// Pure, deterministic-given-RNG Avalon state machine.
// Every transition is validated; illegal actions throw GameError.

import {
  CLASSIC_OPTIONS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  MISSION_COUNT,
  MISSION_SIZES,
  WINS_NEEDED,
  buildDeck,
  failsRequired,
  teamOf,
  validateOptions,
  type Role,
  type RoleOptions,
  type Team,
} from './rules';
import { secureRandomInt, shuffle, type Rng } from './random';

export type Stage =
  | 'playerCount'
  | 'playerNames'
  | 'characterConfig'
  | 'distribution'
  | 'reveal'
  | 'ready'
  | 'dashboard'
  | 'teamSelection'
  | 'missionVote'
  | 'missionResult'
  | 'assassin'
  | 'final';

export interface Mission {
  size: number;
  failsRequired: number;
  status: 'pending' | 'success' | 'fail';
  /** The leader who chose this mission's team, once chosen. */
  leader: number | null;
  team: number[];
  successCount: number;
  failCount: number;
}

export type WinReason = 'assassinMissed' | 'assassinHit' | 'threeFails';
export type AssassinStep = 'intro' | 'handover' | 'choose';

export interface GameState {
  v: 2;
  stage: Stage;
  playerCount: number;
  names: string[];
  options: RoleOptions;
  /** Secret: roles[playerIndex]. */
  roles: Role[];
  /** Secret: Percival's Merlin candidates in randomised display order. */
  percivalView: number[];
  /** True only while a single player is looking at private content. */
  privateOpen: boolean;
  revealIndex: number;
  leader: number;
  missionIndex: number;
  missions: Mission[];
  proposedTeam: number[] | null;
  /** Position of the current voter within the mission team. */
  voterIndex: number;
  /** Secret until the mission result is revealed. */
  missionTally: { success: number; fail: number };
  assassinStep: AssassinStep;
  assassinTarget: number | null;
  winner: Team | null;
  winReason: WinReason | null;
  revealAll: boolean;
}

export type Action =
  | { type: 'SET_PLAYER_COUNT'; count: number }
  | { type: 'SET_NAMES'; names: string[] }
  | { type: 'BACK' }
  | { type: 'SET_OPTIONS'; options: RoleOptions }
  | { type: 'SHUFFLE_START' }
  | { type: 'BEGIN_REVEAL' }
  | { type: 'OPEN_PRIVATE' }
  | { type: 'HIDE_PRIVATE' }
  | { type: 'NEXT_REVEAL' }
  | { type: 'START_GAME' }
  | { type: 'OPEN_TEAM_SELECTION' }
  | { type: 'PROPOSE_TEAM'; team: number[] }
  | { type: 'EDIT_TEAM' }
  | { type: 'START_MISSION' }
  | { type: 'CAST_MISSION_VOTE'; fail: boolean }
  | { type: 'REVEAL_MISSION_RESULT' }
  | { type: 'CONTINUE_AFTER_MISSION' }
  | { type: 'BEGIN_ASSASSIN' }
  | { type: 'ASSASSINATE'; target: number }
  | { type: 'REVEAL_ALL' }
  | { type: 'PLAY_AGAIN' };

export class GameError extends Error {}

function fail(msg: string): never {
  throw new GameError(msg);
}

function expectStage(s: GameState, ...stages: Stage[]) {
  if (!stages.includes(s.stage)) fail(`Action not allowed during stage "${s.stage}"`);
}

export function createSetup(): GameState {
  return {
    v: 2,
    stage: 'playerCount',
    playerCount: 5,
    names: [],
    options: { ...CLASSIC_OPTIONS },
    roles: [],
    percivalView: [],
    privateOpen: false,
    revealIndex: 0,
    leader: 0,
    missionIndex: 0,
    missions: [],
    proposedTeam: null,
    voterIndex: 0,
    missionTally: { success: 0, fail: 0 },
    assassinStep: 'intro',
    assassinTarget: null,
    winner: null,
    winReason: null,
    revealAll: false,
  };
}

export function validateNames(names: string[], count: number): string | null {
  if (names.length !== count) return `Enter exactly ${count} names.`;
  const trimmed = names.map((n) => n.trim());
  if (trimmed.some((n) => n.length === 0)) return 'Every player needs a name.';
  if (trimmed.some((n) => n.length > 16)) return 'Names can be at most 16 characters.';
  const seen = new Set<string>();
  for (const n of trimmed) {
    const k = n.toLocaleLowerCase();
    if (seen.has(k)) return `The name "${n}" is used more than once.`;
    seen.add(k);
  }
  return null;
}

/** Deal fresh roles and reset all game progress, keeping players and options. */
function deal(s: GameState, rng: Rng): GameState {
  const roles = shuffle(buildDeck(s.playerCount, s.options), rng);
  const merlin = roles.indexOf('merlin');
  const morgana = roles.indexOf('morgana');
  const percivalView =
    roles.includes('percival') ? shuffle(morgana >= 0 ? [merlin, morgana] : [merlin], rng) : [];
  const sizes = MISSION_SIZES[s.playerCount];
  return {
    ...createSetup(),
    stage: 'distribution',
    playerCount: s.playerCount,
    names: s.names,
    options: s.options,
    roles,
    percivalView,
    leader: rng(s.playerCount),
    missions: sizes.map((size, i) => ({
      size,
      failsRequired: failsRequired(s.playerCount, i),
      status: 'pending',
      team: [],
      successCount: 0,
      failCount: 0,
      leader: null,
    })),
  };
}

export function countResults(s: GameState) {
  return {
    good: s.missions.filter((m) => m.status === 'success').length,
    evil: s.missions.filter((m) => m.status === 'fail').length,
  };
}

function updateMission(s: GameState, patch: Partial<Mission>): Mission[] {
  return s.missions.map((m, i) => (i === s.missionIndex ? { ...m, ...patch } : m));
}

export function currentMission(s: GameState): Mission {
  return s.missions[s.missionIndex];
}

/** The player whose turn it is to look at the phone in a private stage. */
export function activeVoter(s: GameState): number {
  if (s.stage === 'missionVote') return currentMission(s).team[s.voterIndex] ?? -1;
  if (s.stage === 'reveal') return s.revealIndex;
  if (s.stage === 'assassin') return s.roles.indexOf('assassin');
  return -1;
}

export function reduce(s: GameState, a: Action, rng: Rng = secureRandomInt): GameState {
  switch (a.type) {
    case 'SET_PLAYER_COUNT': {
      expectStage(s, 'playerCount');
      if (!Number.isInteger(a.count) || a.count < MIN_PLAYERS || a.count > MAX_PLAYERS)
        fail('Player count must be between 5 and 10.');
      const names = Array.from({ length: a.count }, (_, i) => s.names[i] ?? '');
      // Drop optional roles that no longer fit the new team sizes.
      const options = validateOptions(a.count, s.options) ? { ...CLASSIC_OPTIONS } : s.options;
      return { ...s, stage: 'playerNames', playerCount: a.count, names, options };
    }
    case 'SET_NAMES': {
      expectStage(s, 'playerNames');
      const err = validateNames(a.names, s.playerCount);
      if (err) fail(err);
      return { ...s, stage: 'characterConfig', names: a.names.map((n) => n.trim()) };
    }
    case 'BACK': {
      if (s.stage === 'playerNames') return { ...s, stage: 'playerCount' };
      if (s.stage === 'characterConfig') return { ...s, stage: 'playerNames' };
      return fail('Cannot go back from here.');
    }
    case 'SET_OPTIONS': {
      expectStage(s, 'characterConfig');
      const err = validateOptions(s.playerCount, a.options);
      if (err) fail(err);
      return { ...s, options: { ...a.options } };
    }
    case 'SHUFFLE_START': {
      expectStage(s, 'characterConfig');
      if (validateNames(s.names, s.playerCount)) fail('Player names are invalid.');
      return deal(s, rng);
    }
    case 'BEGIN_REVEAL':
      expectStage(s, 'distribution');
      return { ...s, stage: 'reveal', revealIndex: 0, privateOpen: false };
    case 'OPEN_PRIVATE': {
      expectStage(s, 'reveal', 'missionVote', 'assassin');
      if (s.stage === 'assassin') {
        if (s.assassinStep !== 'handover') fail('Assassin is not ready.');
        return { ...s, assassinStep: 'choose', privateOpen: true };
      }
      if (s.stage === 'missionVote' && s.voterIndex >= currentMission(s).team.length)
        fail('All mission cards are in.');
      return { ...s, privateOpen: true };
    }
    case 'HIDE_PRIVATE': {
      // Safe from any stage: used when the app is backgrounded or restored.
      if (s.stage === 'assassin' && s.assassinStep === 'choose')
        return { ...s, privateOpen: false, assassinStep: 'handover' };
      return s.privateOpen ? { ...s, privateOpen: false } : s;
    }
    case 'NEXT_REVEAL': {
      expectStage(s, 'reveal');
      if (!s.privateOpen) fail('The current player has not viewed their character.');
      const next = s.revealIndex + 1;
      if (next >= s.playerCount) return { ...s, stage: 'ready', privateOpen: false, revealIndex: next };
      return { ...s, revealIndex: next, privateOpen: false };
    }
    case 'START_GAME':
      expectStage(s, 'ready');
      return { ...s, stage: 'dashboard' };
    case 'OPEN_TEAM_SELECTION':
      expectStage(s, 'dashboard');
      return { ...s, stage: 'teamSelection', proposedTeam: null };
    case 'PROPOSE_TEAM': {
      expectStage(s, 'teamSelection');
      const team = [...new Set(a.team)].sort((x, y) => x - y);
      if (team.length !== a.team.length) fail('A player cannot be selected twice.');
      if (team.some((p) => !Number.isInteger(p) || p < 0 || p >= s.playerCount)) fail('Unknown player.');
      if (team.length !== currentMission(s).size)
        fail(`Select exactly ${currentMission(s).size} players.`);
      return { ...s, proposedTeam: team };
    }
    case 'EDIT_TEAM':
      expectStage(s, 'teamSelection');
      return { ...s, proposedTeam: null };
    case 'START_MISSION':
      // One vote per mission: the chosen team goes straight to the secret Success/Fail vote.
      expectStage(s, 'teamSelection');
      if (!s.proposedTeam) fail('Propose a team first.');
      return {
        ...s,
        stage: 'missionVote',
        missions: updateMission(s, { team: s.proposedTeam, leader: s.leader }),
        voterIndex: 0,
        missionTally: { success: 0, fail: 0 },
        privateOpen: false,
      };
    case 'CAST_MISSION_VOTE': {
      expectStage(s, 'missionVote');
      if (!s.privateOpen) fail('Ballot is not open.');
      const team = currentMission(s).team;
      if (s.voterIndex >= team.length) fail('All mission cards are in.');
      // House rule: every team member may freely play Success or Fail.
      return {
        ...s,
        voterIndex: s.voterIndex + 1,
        privateOpen: false,
        missionTally: {
          success: s.missionTally.success + (a.fail ? 0 : 1),
          fail: s.missionTally.fail + (a.fail ? 1 : 0),
        },
      };
    }
    case 'REVEAL_MISSION_RESULT': {
      expectStage(s, 'missionVote');
      const m = currentMission(s);
      if (s.voterIndex < m.team.length) fail('Not every mission member has played a card.');
      const status = s.missionTally.fail >= m.failsRequired ? 'fail' : 'success';
      return {
        ...s,
        stage: 'missionResult',
        missions: updateMission(s, {
          status,
          successCount: s.missionTally.success,
          failCount: s.missionTally.fail,
        }),
        missionTally: { success: 0, fail: 0 },
      };
    }
    case 'CONTINUE_AFTER_MISSION': {
      expectStage(s, 'missionResult');
      const { good, evil } = countResults(s);
      if (evil >= WINS_NEEDED) return { ...s, stage: 'final', winner: 'evil', winReason: 'threeFails' };
      if (good >= WINS_NEEDED) return { ...s, stage: 'assassin', assassinStep: 'intro' };
      if (s.missionIndex + 1 >= MISSION_COUNT) fail('No missions remain.');
      return {
        ...s,
        stage: 'dashboard',
        missionIndex: s.missionIndex + 1,
        leader: (s.leader + 1) % s.playerCount,
        proposedTeam: null,
        voterIndex: 0,
      };
    }
    case 'BEGIN_ASSASSIN':
      expectStage(s, 'assassin');
      if (s.assassinStep !== 'intro') fail('Assassin phase already started.');
      return { ...s, assassinStep: 'handover', privateOpen: false };
    case 'ASSASSINATE': {
      expectStage(s, 'assassin');
      if (s.assassinStep !== 'choose' || !s.privateOpen) fail('The Assassin has not taken the phone.');
      const assassin = s.roles.indexOf('assassin');
      if (a.target === assassin || a.target < 0 || a.target >= s.playerCount) fail('Invalid target.');
      const hit = s.roles[a.target] === 'merlin';
      return {
        ...s,
        stage: 'final',
        privateOpen: false,
        assassinTarget: a.target,
        winner: hit ? 'evil' : 'good',
        winReason: hit ? 'assassinHit' : 'assassinMissed',
      };
    }
    case 'REVEAL_ALL':
      expectStage(s, 'final');
      return { ...s, revealAll: true };
    case 'PLAY_AGAIN':
      expectStage(s, 'final');
      return deal(s, rng);
  }
}

/** Stages where a game is underway and leaving should require confirmation. */
export function isGameInProgress(s: GameState | null): boolean {
  return !!s && !['playerCount', 'playerNames', 'characterConfig', 'final'].includes(s.stage);
}

/** Make a restored state safe to display: nothing private may be on screen. */
export function sanitizeForRestore(s: GameState): GameState {
  let r = reduce(s, { type: 'HIDE_PRIVATE' });
  if (r.revealAll) r = { ...r, revealAll: false };
  return r;
}

// ---- Private knowledge -------------------------------------------------------

/** What a role's private knowledge list shows; display text lives in the i18n dictionary. */
export type KnowledgeKind = 'evilForMerlin' | 'merlinCandidates' | 'merlin' | 'evilTeammates' | 'none';
export type KnowledgeHint =
  | 'merlinMordredHidden'
  | 'merlinDefault'
  | 'percivalMorgana'
  | 'percivalSingle'
  | 'oberon'
  | 'servant'
  | 'evilOberonHidden'
  | 'evilDefault';

export interface Knowledge {
  /** Which list the role sees, or 'none' if the role learns nothing. */
  kind: KnowledgeKind;
  players: number[];
  hint: KnowledgeHint;
}

export function knowledgeFor(s: GameState, player: number): Knowledge {
  const role = s.roles[player];
  const others = (pred: (r: Role, i: number) => boolean) =>
    s.roles.map((r, i) => (i !== player && pred(r, i) ? i : -1)).filter((i) => i >= 0);

  switch (role) {
    case 'merlin':
      return {
        kind: 'evilForMerlin',
        players: others((r) => teamOf(r) === 'evil' && r !== 'mordred'),
        hint: s.roles.includes('mordred') ? 'merlinMordredHidden' : 'merlinDefault',
      };
    case 'percival':
      return s.percivalView.length > 1
        ? { kind: 'merlinCandidates', players: s.percivalView, hint: 'percivalMorgana' }
        : { kind: 'merlin', players: s.percivalView, hint: 'percivalSingle' };
    case 'oberon':
      return { kind: 'none', players: [], hint: 'oberon' };
    case 'servant':
      return { kind: 'none', players: [], hint: 'servant' };
    default:
      return {
        kind: 'evilTeammates',
        players: others((r) => teamOf(r) === 'evil' && r !== 'oberon'),
        hint: s.roles.includes('oberon') ? 'evilOberonHidden' : 'evilDefault',
      };
  }
}
