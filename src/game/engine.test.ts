import { describe, expect, it } from 'vitest';
import {
  GameError,
  activeVoter,
  createSetup,
  currentMission,
  isGameInProgress,
  knowledgeFor,
  reduce,
  sanitizeForRestore,
  validateNames,
  type Action,
  type GameState,
} from './engine';
import {
  ADVANCED_OPTIONS,
  CLASSIC_OPTIONS,
  MISSION_SIZES,
  TEAM_SIZES,
  buildDeck,
  countEvilOptionals,
  evilOptionalSlots,
  teamOf,
  toggleOption,
  validateOptions,
  type Role,
  type RoleOptions,
} from './rules';
import { shuffle, secureRandomInt } from './random';
import { decode, encode } from './storage';

const NAMES = ['Alex', 'Ben', 'Cindy', 'David', 'Emma', 'Finn', 'Gwen', 'Hugo', 'Iris', 'Jack'];

/** Seeded deterministic RNG for reproducible tests. */
function seeded(seed = 42) {
  let x = seed >>> 0 || 1;
  return (max: number) => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x % max;
  };
}

function run(s: GameState, ...actions: Action[]): GameState {
  return actions.reduce((acc, a) => reduce(acc, a, seeded(7)), s);
}

function dealt(n: number, options: RoleOptions = CLASSIC_OPTIONS, seed = 1): GameState {
  let s = reduce(createSetup(), { type: 'SET_PLAYER_COUNT', count: n });
  s = reduce(s, { type: 'SET_NAMES', names: NAMES.slice(0, n) });
  s = reduce(s, { type: 'SET_OPTIONS', options });
  return reduce(s, { type: 'SHUFFLE_START' }, seeded(seed));
}

function withRoles(s: GameState, roles: Role[]): GameState {
  const merlin = roles.indexOf('merlin');
  const morgana = roles.indexOf('morgana');
  return {
    ...s,
    roles,
    percivalView: roles.includes('percival') ? (morgana >= 0 ? [morgana, merlin] : [merlin]) : [],
  };
}

function toDashboard(s: GameState): GameState {
  s = reduce(s, { type: 'BEGIN_REVEAL' });
  for (let i = 0; i < s.playerCount; i++) s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'NEXT_REVEAL' });
  return reduce(s, { type: 'START_GAME' });
}

/** From the dashboard: choose a team and go straight to the secret mission vote. */
function startMission(s: GameState, team: number[]): GameState {
  if (s.stage === 'dashboard') s = reduce(s, { type: 'OPEN_TEAM_SELECTION' });
  return run(s, { type: 'PROPOSE_TEAM', team }, { type: 'START_MISSION' });
}

function firstN(s: GameState): number[] {
  return Array.from({ length: currentMission(s).size }, (_, i) => i);
}

/** Pick a team of the required size containing the given players first. */
function teamWith(s: GameState, must: number[]): number[] {
  const t = [...must];
  for (let i = 0; t.length < currentMission(s).size; i++) if (!t.includes(i)) t.push(i);
  return t.slice(0, currentMission(s).size);
}

/** Run a mission, where `fails` lists team members who play Fail. */
function playMission(s: GameState, team: number[], fails: number[] = []): GameState {
  s = startMission(s, team);
  const ordered = currentMission(s).team;
  for (const p of ordered) s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: fails.includes(p) });
  return reduce(s, { type: 'REVEAL_MISSION_RESULT' });
}

const good = (s: GameState) => s.roles.map((r, i) => (teamOf(r) === 'good' ? i : -1)).filter((i) => i >= 0);
const evil = (s: GameState) => s.roles.map((r, i) => (teamOf(r) === 'evil' ? i : -1)).filter((i) => i >= 0);

// ---------------------------------------------------------------------------

describe('rule tables', () => {
  it('has the standard Good/Evil distribution for 5–10 players', () => {
    expect(TEAM_SIZES).toEqual({
      5: { good: 3, evil: 2 },
      6: { good: 4, evil: 2 },
      7: { good: 4, evil: 3 },
      8: { good: 5, evil: 3 },
      9: { good: 6, evil: 3 },
      10: { good: 6, evil: 4 },
    });
  });

  it('uses the house-rule team sizes (M3 = M2, +1 player for M4–5)', () => {
    expect(MISSION_SIZES[5]).toEqual([2, 3, 3, 4, 4]);
    expect(MISSION_SIZES[6]).toEqual([2, 3, 3, 4, 5]);
    expect(MISSION_SIZES[7]).toEqual([2, 3, 3, 5, 5]);
    for (const n of [8, 9, 10]) expect(MISSION_SIZES[n]).toEqual([3, 4, 4, 6, 6]);
    for (let n = 5; n <= 10; n++) {
      expect(MISSION_SIZES[n][2]).toBe(MISSION_SIZES[n][1]);
      for (const size of MISSION_SIZES[n]) expect(size).toBeLessThanOrEqual(n);
    }
  });

  for (let n = 5; n <= 10; n++) {
    it(`deals the right teams and mission sizes for ${n} players`, () => {
      const s = dealt(n);
      expect(s.roles).toHaveLength(n);
      expect(good(s)).toHaveLength(TEAM_SIZES[n].good);
      expect(evil(s)).toHaveLength(TEAM_SIZES[n].evil);
      expect(s.roles.filter((r) => r === 'merlin')).toHaveLength(1);
      expect(s.roles.filter((r) => r === 'assassin')).toHaveLength(1);
      expect(s.missions.map((m) => m.size)).toEqual(MISSION_SIZES[n]);
      expect(s.missions.map((m) => m.failsRequired)).toEqual([1, 1, 1, 2, 2]);
      expect(s.leader).toBeGreaterThanOrEqual(0);
      expect(s.leader).toBeLessThan(n);
    });
  }
});

describe('character configuration', () => {
  const allCombos: RoleOptions[] = [];
  for (let mask = 0; mask < 16; mask++)
    allCombos.push({ percival: !!(mask & 1), morgana: !!(mask & 2), mordred: !!(mask & 4), oberon: !!(mask & 8) });

  for (let n = 5; n <= 10; n++) {
    it(`accepts exactly the legal combinations for ${n} players and deals them correctly`, () => {
      for (const o of allCombos) {
        const legal = !(o.morgana && !o.percival) && countEvilOptionals(o) <= evilOptionalSlots(n);
        expect(validateOptions(n, o) === null).toBe(legal);
        if (!legal) {
          expect(() => buildDeck(n, o)).toThrow();
          continue;
        }
        const deck = buildDeck(n, o);
        expect(deck).toHaveLength(n);
        expect(deck.filter((r) => teamOf(r) === 'good')).toHaveLength(TEAM_SIZES[n].good);
        expect(deck.filter((r) => teamOf(r) === 'evil')).toHaveLength(TEAM_SIZES[n].evil);
        for (const special of ['merlin', 'assassin', 'percival', 'morgana', 'mordred', 'oberon'] as Role[])
          expect(deck.filter((r) => r === special).length).toBeLessThanOrEqual(1);
        for (const k of ['percival', 'morgana', 'mordred', 'oberon'] as const)
          expect(deck.includes(k)).toBe(o[k]);
        // Every legal combination deals and plays through knowledge without error.
        const s = dealt(n, o);
        for (let p = 0; p < n; p++) expect(() => knowledgeFor(s, p)).not.toThrow();
      }
    });
  }

  it('Advanced mode is legal for every player count', () => {
    for (let n = 5; n <= 10; n++) expect(validateOptions(n, ADVANCED_OPTIONS)).toBeNull();
  });

  it('toggling Morgana enables Percival; disabling Percival removes Morgana', () => {
    let o = toggleOption(7, CLASSIC_OPTIONS, 'morgana');
    expect(o).toMatchObject({ morgana: true, percival: true });
    o = toggleOption(7, o, 'percival');
    expect(o).toMatchObject({ morgana: false, percival: false });
  });

  it('refuses Evil roles beyond available slots', () => {
    let o = toggleOption(5, CLASSIC_OPTIONS, 'mordred');
    expect(o.mordred).toBe(true);
    o = toggleOption(5, o, 'oberon');
    expect(o.oberon).toBe(false);
    expect(() => reduce({ ...dealt(5), stage: 'characterConfig' }, {
      type: 'SET_OPTIONS',
      options: { percival: true, morgana: true, mordred: true, oberon: false },
    })).toThrow(GameError);
  });
});

describe('setup validation', () => {
  it('rejects empty and duplicate names', () => {
    expect(validateNames(['A', 'B', '', 'D', 'E'], 5)).toMatch(/name/);
    expect(validateNames(['A', 'B', 'c', 'C', 'E'], 5)).toMatch(/more than once/);
    expect(validateNames(['A', 'B', 'C', 'D'], 5)).toMatch(/exactly/);
    expect(validateNames(['A', 'B', 'C', 'D', 'E'], 5)).toBeNull();
    let s = reduce(createSetup(), { type: 'SET_PLAYER_COUNT', count: 5 });
    expect(() => reduce(s, { type: 'SET_NAMES', names: ['A', 'A', 'B', 'C', 'D'] })).toThrow(GameError);
    s = reduce(s, { type: 'SET_NAMES', names: [' Alex ', 'Ben', 'Cindy', 'David', 'Emma'] });
    expect(s.names[0]).toBe('Alex');
  });

  it('rejects player counts outside 5–10', () => {
    expect(() => reduce(createSetup(), { type: 'SET_PLAYER_COUNT', count: 4 })).toThrow(GameError);
    expect(() => reduce(createSetup(), { type: 'SET_PLAYER_COUNT', count: 11 })).toThrow(GameError);
  });

  it('preserves names when going back and changing count', () => {
    let s = reduce(createSetup(), { type: 'SET_PLAYER_COUNT', count: 5 });
    s = reduce(s, { type: 'SET_NAMES', names: NAMES.slice(0, 5) });
    s = run(s, { type: 'BACK' }, { type: 'BACK' }, { type: 'SET_PLAYER_COUNT', count: 6 });
    expect(s.names).toEqual([...NAMES.slice(0, 5), '']);
  });

  it('prevents invalid transitions', () => {
    const s = dealt(5);
    expect(() => reduce(s, { type: 'START_GAME' })).toThrow(GameError);
    expect(() => reduce(s, { type: 'CAST_MISSION_VOTE', fail: false })).toThrow(GameError);
    expect(() => reduce(s, { type: 'ASSASSINATE', target: 0 })).toThrow(GameError);
    expect(() => reduce(createSetup(), { type: 'SHUFFLE_START' })).toThrow(GameError);
  });
});

describe('secret knowledge', () => {
  // 10 players: M Pe S S S S | A Mg Md Ob
  const roles: Role[] = ['merlin', 'percival', 'servant', 'servant', 'servant', 'servant', 'assassin', 'morgana', 'mordred', 'oberon'];
  const s = withRoles(dealt(10, { percival: true, morgana: true, mordred: true, oberon: true }), roles);

  it('Merlin sees Evil except Mordred, including Oberon', () => {
    expect(knowledgeFor(s, 0).players.sort()).toEqual([6, 7, 9]);
  });

  it('Percival sees Merlin and Morgana as candidates', () => {
    const k = knowledgeFor(s, 1);
    expect([...k.players].sort()).toEqual([0, 7]);
    expect(k.kind).toBe('merlinCandidates');
  });

  it('Percival sees only Merlin without Morgana', () => {
    const s2 = withRoles(dealt(5, { percival: true, morgana: false, mordred: false, oberon: false }), [
      'merlin', 'percival', 'servant', 'assassin', 'minion',
    ]);
    expect(knowledgeFor(s2, 1).players).toEqual([0]);
  });

  it('Percival candidate order is randomised across deals', () => {
    const firstIsMerlin = new Set<boolean>();
    for (let seed = 1; seed < 40; seed++) {
      const d = dealt(7, ADVANCED_OPTIONS, seed);
      firstIsMerlin.add(d.roles[d.percivalView[0]] === 'merlin');
    }
    expect(firstIsMerlin.size).toBe(2);
  });

  it('Evil (except Oberon) sees each other but not Oberon', () => {
    for (const p of [6, 7, 8]) {
      const k = knowledgeFor(s, p);
      expect(k.players).not.toContain(9);
      expect(k.players).not.toContain(p);
      expect(k.players.sort()).toEqual([6, 7, 8].filter((x) => x !== p));
    }
  });

  it('Oberon and Loyal Servants see nobody', () => {
    expect(knowledgeFor(s, 9).players).toEqual([]);
    expect(knowledgeFor(s, 2).players).toEqual([]);
  });

  it('a minion sees fellow evil in classic mode', () => {
    const s2 = withRoles(dealt(7), ['merlin', 'servant', 'servant', 'servant', 'assassin', 'minion', 'minion']);
    expect(knowledgeFor(s2, 5).players).toEqual([4, 6]);
    expect(knowledgeFor(s2, 0).players).toEqual([4, 5, 6]);
  });
});

describe('private character reveal', () => {
  it('requires each player to open before moving on and ends at ready', () => {
    let s = reduce(dealt(5), { type: 'BEGIN_REVEAL' });
    expect(s.privateOpen).toBe(false);
    expect(() => reduce(s, { type: 'NEXT_REVEAL' })).toThrow(GameError);
    for (let i = 0; i < 5; i++) {
      expect(activeVoter(s)).toBe(i);
      s = reduce(s, { type: 'OPEN_PRIVATE' });
      expect(s.privateOpen).toBe(true);
      s = reduce(s, { type: 'NEXT_REVEAL' });
      expect(s.privateOpen).toBe(false);
    }
    expect(s.stage).toBe('ready');
  });
});

describe('team selection (one vote per mission)', () => {
  it('enforces exact team size', () => {
    const s = reduce(toDashboard(dealt(5)), { type: 'OPEN_TEAM_SELECTION' });
    expect(() => reduce(s, { type: 'PROPOSE_TEAM', team: [0] })).toThrow(GameError);
    expect(() => reduce(s, { type: 'PROPOSE_TEAM', team: [0, 1, 2] })).toThrow(GameError);
    expect(() => reduce(s, { type: 'PROPOSE_TEAM', team: [0, 0] })).toThrow(GameError);
    expect(reduce(s, { type: 'PROPOSE_TEAM', team: [3, 1] }).proposedTeam).toEqual([1, 3]);
    expect(() => reduce(s, { type: 'START_MISSION' })).toThrow(GameError);
  });

  it('goes straight to the secret mission vote, with only the team voting', () => {
    for (let n = 5; n <= 10; n++) {
      let s = toDashboard(dealt(n));
      for (let mi = 0; mi < 2; mi++) {
        const leader = s.leader;
        const team = teamWith(s, [n - 1]);
        s = startMission(s, team);
        expect(s.stage).toBe('missionVote');
        expect(team).toHaveLength(MISSION_SIZES[n][mi]);
        expect(currentMission(s)).toMatchObject({ team: [...team].sort((a, b) => a - b), leader });
        let ballots = 0;
        for (const p of currentMission(s).team) {
          expect(activeVoter(s)).toBe(p);
          s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: false });
          ballots++;
        }
        expect(ballots).toBe(MISSION_SIZES[n][mi]);
        expect(() => reduce(s, { type: 'OPEN_PRIVATE' })).toThrow(GameError);
        s = run(s, { type: 'REVEAL_MISSION_RESULT' }, { type: 'CONTINUE_AFTER_MISSION' });
        expect(s.leader).toBe((leader + 1) % n);
      }
    }
  });

  it('lets the leader change the team before the mission starts', () => {
    let s = reduce(toDashboard(dealt(5)), { type: 'OPEN_TEAM_SELECTION' });
    s = run(s, { type: 'PROPOSE_TEAM', team: [0, 1] }, { type: 'EDIT_TEAM' }, { type: 'PROPOSE_TEAM', team: [2, 3] }, { type: 'START_MISSION' });
    expect(currentMission(s).team).toEqual([2, 3]);
  });
});

describe('secret mission voting', () => {
  const roles5: Role[] = ['merlin', 'servant', 'servant', 'assassin', 'minion'];

  it('Good players may also play Fail (free choice)', () => {
    let s = withRoles(toDashboard(dealt(5)), roles5);
    s = startMission(s, [0, 1]); // Merlin and a Loyal Servant
    s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: true });
    s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: false });
    s = reduce(s, { type: 'REVEAL_MISSION_RESULT' });
    expect(currentMission(s)).toMatchObject({ status: 'fail', successCount: 1, failCount: 1 });
  });

  it('Evil players may play Success or Fail', () => {
    let s = withRoles(toDashboard(dealt(5)), roles5);
    s = startMission(s, [3, 4]);
    s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: false });
    s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: true });
    s = reduce(s, { type: 'REVEAL_MISSION_RESULT' });
    expect(currentMission(s)).toMatchObject({ status: 'fail', successCount: 1, failCount: 1 });
  });

  it('prevents duplicate ballots and early reveal', () => {
    let s = withRoles(toDashboard(dealt(5)), roles5);
    s = startMission(s, [0, 1]);
    expect(() => reduce(s, { type: 'REVEAL_MISSION_RESULT' })).toThrow(GameError);
    s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: false });
    expect(() => reduce(s, { type: 'CAST_MISSION_VOTE', fail: false })).toThrow(GameError);
    s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: false });
    expect(() => reduce(s, { type: 'OPEN_PRIVATE' })).toThrow(GameError);
    s = reduce(s, { type: 'REVEAL_MISSION_RESULT' });
    expect(currentMission(s)).toMatchObject({ status: 'success', successCount: 2, failCount: 0 });
  });

  it('one Fail fails a normal mission', () => {
    let s = withRoles(toDashboard(dealt(5)), roles5);
    s = playMission(s, [0, 4], [4]);
    expect(currentMission(s).status).toBe('fail');
  });

  for (let n = 5; n <= 10; n++) {
    it(`Missions 4 and 5 need two Fails with ${n} players`, () => {
      const ev = evil(toDashboard(dealt(n)));
      let s = toDashboard(dealt(n));
      // Missions 1–3: success, fail, success → 2–1, reaching Mission 4.
      s = reduce(playMission(s, teamWith(s, [])), { type: 'CONTINUE_AFTER_MISSION' });
      s = reduce(playMission(s, teamWith(s, [ev[0]]), [ev[0]]), { type: 'CONTINUE_AFTER_MISSION' });
      s = reduce(playMission(s, teamWith(s, [ev[1]])), { type: 'CONTINUE_AFTER_MISSION' });
      expect(s.missionIndex).toBe(3);
      expect(currentMission(s).size).toBe(MISSION_SIZES[n][3]);
      const one = playMission(s, teamWith(s, [ev[0], ev[1]]), [ev[0]]);
      expect(currentMission(one)).toMatchObject({ status: 'success', failCount: 1 });
      const two = playMission(s, teamWith(s, [ev[0], ev[1]]), [ev[0], ev[1]]);
      expect(currentMission(two)).toMatchObject({ status: 'fail', failCount: 2 });
      // Mission 5 also needs two: after 4 fails (2–2), one Fail is not enough.
      s = reduce(two, { type: 'CONTINUE_AFTER_MISSION' });
      expect(s.missionIndex).toBe(4);
      const last = playMission(s, teamWith(s, [ev[0], ev[1]]), [ev[0]]);
      expect(currentMission(last)).toMatchObject({ status: 'success', failCount: 1 });
    });
  }
});

describe('win conditions', () => {
  it('three failed missions give Evil an immediate win', () => {
    let s = toDashboard(dealt(5));
    const e = evil(s)[0];
    for (let i = 0; i < 2; i++) s = reduce(playMission(s, teamWith(s, [e]), [e]), { type: 'CONTINUE_AFTER_MISSION' });
    s = playMission(s, teamWith(s, [e]), [e]);
    s = reduce(s, { type: 'CONTINUE_AFTER_MISSION' });
    expect(s).toMatchObject({ stage: 'final', winner: 'evil', winReason: 'threeFails' });
  });

  function toAssassin(n: number) {
    let s = toDashboard(dealt(n));
    for (let i = 0; i < 3; i++) s = reduce(playMission(s, firstN(s)), { type: 'CONTINUE_AFTER_MISSION' });
    return s;
  }

  it('three successful missions trigger the Assassin phase, not a win', () => {
    const s = toAssassin(6);
    expect(s).toMatchObject({ stage: 'assassin', assassinStep: 'intro', winner: null });
  });

  it('Assassin hitting Merlin gives Evil the win', () => {
    let s = toAssassin(7);
    s = run(s, { type: 'BEGIN_ASSASSIN' });
    expect(() => reduce(s, { type: 'ASSASSINATE', target: 0 })).toThrow(GameError);
    s = reduce(s, { type: 'OPEN_PRIVATE' });
    expect(activeVoter(s)).toBe(s.roles.indexOf('assassin'));
    expect(() => reduce(s, { type: 'ASSASSINATE', target: s.roles.indexOf('assassin') })).toThrow(GameError);
    s = reduce(s, { type: 'ASSASSINATE', target: s.roles.indexOf('merlin') });
    expect(s).toMatchObject({ stage: 'final', winner: 'evil', winReason: 'assassinHit' });
  });

  it('Assassin missing Merlin gives Good the win', () => {
    let s = toAssassin(7);
    s = run(s, { type: 'BEGIN_ASSASSIN' }, { type: 'OPEN_PRIVATE' });
    const wrong = s.roles.findIndex((r) => teamOf(r) === 'good' && r !== 'merlin');
    s = reduce(s, { type: 'ASSASSINATE', target: wrong });
    expect(s).toMatchObject({ stage: 'final', winner: 'good', winReason: 'assassinMissed' });
  });

  it('plays a full game for every player count', () => {
    for (let n = 5; n <= 10; n++) {
      let s = toDashboard(dealt(n, ADVANCED_OPTIONS, n));
      const e = evil(s)[0];
      s = reduce(playMission(s, firstN(s)), { type: 'CONTINUE_AFTER_MISSION' });
      s = reduce(playMission(s, teamWith(s, [e]), [e]), { type: 'CONTINUE_AFTER_MISSION' });
      s = reduce(playMission(s, firstN(s)), { type: 'CONTINUE_AFTER_MISSION' });
      // A single Fail on Mission 4 is not enough, so Good reaches three successes.
      s = reduce(playMission(s, teamWith(s, [e]), [e]), { type: 'CONTINUE_AFTER_MISSION' });
      expect(s.stage).toBe('assassin');
      s = run(s, { type: 'BEGIN_ASSASSIN' }, { type: 'OPEN_PRIVATE' }, { type: 'ASSASSINATE', target: s.roles.indexOf('merlin') });
      expect(s.winner).toBe('evil');
      s = reduce(s, { type: 'REVEAL_ALL' });
      expect(s.revealAll).toBe(true);
      const again = reduce(s, { type: 'PLAY_AGAIN' }, seeded(99));
      expect(again).toMatchObject({ stage: 'distribution', names: s.names, winner: null, missionIndex: 0, revealAll: false });
      expect(again.missions.every((m) => m.status === 'pending')).toBe(true);
    }
  });
});

describe('privacy and persistence', () => {
  it('backgrounding hides private content', () => {
    let s = run(dealt(5), { type: 'BEGIN_REVEAL' }, { type: 'OPEN_PRIVATE' });
    s = reduce(s, { type: 'HIDE_PRIVATE' });
    expect(s.privateOpen).toBe(false);
    expect(s.revealIndex).toBe(0);
  });

  it('restored games come back on a neutral screen', () => {
    let s = run(dealt(5), { type: 'BEGIN_REVEAL' }, { type: 'OPEN_PRIVATE' });
    const restored = sanitizeForRestore(decode(encode(s))!);
    expect(restored.privateOpen).toBe(false);
    expect(restored.stage).toBe('reveal');
    expect(restored.roles).toEqual(s.roles);

    s = toDashboard(dealt(5));
    for (let i = 0; i < 3; i++) s = reduce(playMission(s, firstN(s)), { type: 'CONTINUE_AFTER_MISSION' });
    s = run(s, { type: 'BEGIN_ASSASSIN' }, { type: 'OPEN_PRIVATE' });
    expect(sanitizeForRestore(s)).toMatchObject({ assassinStep: 'handover', privateOpen: false });
  });

  it('a mid-mission refresh keeps ballots hidden and not duplicated', () => {
    let s = toDashboard(dealt(5));
    s = startMission(s, [0, 1]);
    s = run(s, { type: 'OPEN_PRIVATE' }, { type: 'CAST_MISSION_VOTE', fail: false });
    const restored = sanitizeForRestore(decode(encode(s))!);
    expect(restored.voterIndex).toBe(1);
    expect(restored.privateOpen).toBe(false);
  });

  it('a final-screen full reveal is hidden again after restore', () => {
    const s = { ...toDashboard(dealt(5)), stage: 'final' as const, revealAll: true };
    expect(sanitizeForRestore(s).revealAll).toBe(false);
  });

  it('stored data does not contain readable role names', () => {
    const raw = encode(dealt(5, ADVANCED_OPTIONS));
    expect(raw).not.toMatch(/merlin|assassin/i);
    expect(decode('garbage')).toBeNull();
  });

  it('reports games in progress', () => {
    expect(isGameInProgress(null)).toBe(false);
    expect(isGameInProgress(createSetup())).toBe(false);
    expect(isGameInProgress(dealt(5))).toBe(true);
  });
});

describe('randomness', () => {
  it('secureRandomInt stays in range and shuffle is a permutation', () => {
    for (let i = 0; i < 500; i++) {
      const v = secureRandomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
    expect(shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
