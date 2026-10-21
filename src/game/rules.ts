// Static Avalon rule tables and role definitions.

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 10;
export const MISSION_COUNT = 5;
export const WINS_NEEDED = 3;

export type Team = 'good' | 'evil';

export type Role =
  | 'merlin'
  | 'percival'
  | 'servant'
  | 'assassin'
  | 'morgana'
  | 'mordred'
  | 'oberon'
  | 'minion';

export type OptionalRole = 'percival' | 'morgana' | 'mordred' | 'oberon';

export const TEAM_SIZES: Record<number, { good: number; evil: number }> = {
  5: { good: 3, evil: 2 },
  6: { good: 4, evil: 2 },
  7: { good: 4, evil: 3 },
  8: { good: 5, evil: 3 },
  9: { good: 6, evil: 3 },
  10: { good: 6, evil: 4 },
};

/**
 * Team sizes played: MISSION_SIZES[playerCount][missionIndex].
 * House rules on top of standard Avalon: Mission 3 has the same size as Mission 2,
 * and the last two missions (4 and 5) take one extra player.
 */
export const MISSION_SIZES: Record<number, readonly number[]> = {
  5: [2, 3, 3, 4, 4],
  6: [2, 3, 3, 4, 5],
  7: [2, 3, 3, 5, 5],
  8: [3, 4, 4, 6, 6],
  9: [3, 4, 4, 6, 6],
  10: [3, 4, 4, 6, 6],
};

/** House rule: the last two missions (4 and 5) need two Fail cards to fail. */
const FINAL_MISSIONS_FROM = 3;

export function failsRequired(_playerCount: number, missionIndex: number): number {
  return missionIndex >= FINAL_MISSIONS_FROM ? 2 : 1;
}

/** Rule facts per role. Names and descriptions are translated in src/i18n.tsx. */
export interface RoleInfo {
  role: Role;
  team: Team;
  special: boolean;
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  merlin: { role: 'merlin', team: 'good', special: true },
  percival: { role: 'percival', team: 'good', special: true },
  servant: { role: 'servant', team: 'good', special: false },
  assassin: { role: 'assassin', team: 'evil', special: true },
  morgana: { role: 'morgana', team: 'evil', special: true },
  mordred: { role: 'mordred', team: 'evil', special: true },
  oberon: { role: 'oberon', team: 'evil', special: true },
  minion: { role: 'minion', team: 'evil', special: false },
};

export function teamOf(role: Role): Team {
  return ROLE_INFO[role].team;
}

export interface RoleOptions {
  percival: boolean;
  morgana: boolean;
  mordred: boolean;
  oberon: boolean;
}

export const CLASSIC_OPTIONS: RoleOptions = { percival: false, morgana: false, mordred: false, oberon: false };
export const ADVANCED_OPTIONS: RoleOptions = { percival: true, morgana: true, mordred: false, oberon: false };

export const EVIL_OPTIONALS: OptionalRole[] = ['morgana', 'mordred', 'oberon'];

/** Number of evil optional roles that still fit (Assassin always takes one evil slot). */
export function evilOptionalSlots(playerCount: number): number {
  return TEAM_SIZES[playerCount].evil - 1;
}

export function countEvilOptionals(o: RoleOptions): number {
  return EVIL_OPTIONALS.filter((r) => o[r]).length;
}

export type ConfigMode = 'classic' | 'advanced' | 'custom';

export function modeOf(o: RoleOptions): ConfigMode {
  if (!o.percival && !o.morgana && !o.mordred && !o.oberon) return 'classic';
  if (o.percival && o.morgana) return 'advanced';
  return 'custom';
}

export function validateOptions(playerCount: number, o: RoleOptions): string | null {
  if (!TEAM_SIZES[playerCount]) return 'Player count must be between 5 and 10.';
  const { good } = TEAM_SIZES[playerCount];
  if (1 + (o.percival ? 1 : 0) > good) return 'Too many Good special characters.';
  if (countEvilOptionals(o) > evilOptionalSlots(playerCount))
    return `Only ${evilOptionalSlots(playerCount)} optional Evil character(s) fit with ${playerCount} players.`;
  if (o.morgana && !o.percival) return 'Morgana requires Percival.';
  return null;
}

/**
 * Toggle an optional role, keeping the configuration legal:
 * Morgana pulls in Percival, removing Percival removes Morgana,
 * and Evil roles that would exceed the slots are refused.
 */
export function toggleOption(playerCount: number, o: RoleOptions, role: OptionalRole): RoleOptions {
  const next = { ...o, [role]: !o[role] };
  if (role === 'morgana' && next.morgana) next.percival = true;
  if (role === 'percival' && !next.percival) next.morgana = false;
  return validateOptions(playerCount, next) ? o : next;
}

/** Build the deck of roles to deal for the given options. */
export function buildDeck(playerCount: number, o: RoleOptions): Role[] {
  const err = validateOptions(playerCount, o);
  if (err) throw new Error(err);
  const { good, evil } = TEAM_SIZES[playerCount];
  const goodRoles: Role[] = ['merlin'];
  if (o.percival) goodRoles.push('percival');
  while (goodRoles.length < good) goodRoles.push('servant');
  const evilRoles: Role[] = ['assassin'];
  for (const r of EVIL_OPTIONALS) if (o[r]) evilRoles.push(r);
  while (evilRoles.length < evil) evilRoles.push('minion');
  return [...goodRoles, ...evilRoles];
}
