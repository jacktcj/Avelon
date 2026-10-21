// Local persistence. The saved game is lightly obfuscated so that secret roles
// aren't readable at a glance in browser storage tools — this is a friendly
// pass-and-play safeguard, not encryption.

import { sanitizeForRestore, type GameState } from './engine';

const KEY = 'avalon.game.v2';
const MASK = 'Excalibur-of-the-Lake';

function xor(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) out += String.fromCharCode(text.charCodeAt(i) ^ MASK.charCodeAt(i % MASK.length));
  return out;
}

export function encode(state: GameState): string {
  const json = JSON.stringify(state);
  return btoa(xor(unescape(encodeURIComponent(json))));
}

export function decode(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(xor(atob(raw))))) as GameState;
    if (parsed?.v !== 2 || typeof parsed.stage !== 'string' || !Array.isArray(parsed.names)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState | null) {
  try {
    if (state) localStorage.setItem(KEY, encode(state));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable (private mode / quota) — the game still works in memory.
  }
}

/** Loads a saved game, always returning it in a privacy-safe (hidden) state. */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? decode(raw) : null;
    return s ? sanitizeForRestore(s) : null;
  } catch {
    return null;
  }
}
