import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { createSetup, reduce } from './game/engine';
import { encode } from './game/storage';
import { translate, type MsgKey } from './i18n';

const NAMES = ['Alex', 'Ben', 'Cindy', 'David', 'Emma'];

function revealingGame() {
  let s = reduce(createSetup(), { type: 'SET_PLAYER_COUNT', count: 5 });
  s = reduce(s, { type: 'SET_NAMES', names: NAMES });
  s = reduce(s, { type: 'SHUFFLE_START' });
  s = reduce(s, { type: 'BEGIN_REVEAL' });
  return reduce(s, { type: 'OPEN_PRIVATE' }); // Alex is looking at their card
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('avalon.lang', 'en');
});
afterEach(cleanup);

describe('App', () => {
  it('shows the home screen without Resume when no game exists', () => {
    render(<App />);
    expect(screen.getByText('AVALON')).toBeTruthy();
    expect(screen.queryByText(/Resume Game/)).toBeNull();
  });

  it('restores an interrupted game to a neutral handover screen', () => {
    const s = revealingGame();
    localStorage.setItem('avalon.game.v2', encode(s));
    render(<App />);
    fireEvent.click(screen.getByText(/Resume Game/));
    expect(screen.getByText('I Am Alex – View My Character')).toBeTruthy();
    const roleName = translate('en', `role.${s.roles[0]}.name` as MsgKey);
    expect(screen.queryByText(roleName)).toBeNull();
    expect(screen.queryByText(/Hide Character/)).toBeNull();
  });

  it('hides private content when the app is backgrounded', () => {
    const s = revealingGame();
    localStorage.setItem('avalon.game.v2', encode({ ...s, privateOpen: false }));
    render(<App />);
    fireEvent.click(screen.getByText(/Resume Game/));
    fireEvent.click(screen.getByText('I Am Alex – View My Character'));
    expect(screen.getByText(/Hide Character/)).toBeTruthy();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    fireEvent(document, new Event('visibilitychange'));
    expect(screen.queryByText(/Hide Character/)).toBeNull();
    expect(screen.getByText('I Am Alex – View My Character')).toBeTruthy();
  });

  it('lets a player look up their character again from the dashboard', () => {
    let s = revealingGame();
    for (let i = 0; i < NAMES.length; i++) {
      if (i > 0) s = reduce(s, { type: 'OPEN_PRIVATE' });
      s = reduce(s, { type: 'NEXT_REVEAL' });
    }
    s = reduce(s, { type: 'START_GAME' });
    localStorage.setItem('avalon.game.v2', encode(s));
    render(<App />);
    fireEvent.click(screen.getByText(/Resume Game/));
    fireEvent.click(screen.getByText('Forgot Your Character?'));
    fireEvent.click(screen.getByText('Cindy'));
    const roleName = translate('en', `role.${s.roles[2]}.name` as MsgKey);
    expect(screen.queryByText(roleName)).toBeNull();
    fireEvent.click(screen.getByText('I Am Cindy – View My Character'));
    expect(screen.getByText(roleName)).toBeTruthy();
    fireEvent.click(screen.getByText('Hide Character & Return'));
    expect(screen.queryByText(roleName)).toBeNull();
    expect(screen.getByText('The Quest Board')).toBeTruthy();
  });

  it('asks for confirmation before abandoning a game in progress', () => {
    localStorage.setItem('avalon.game.v2', encode(revealingGame()));
    render(<App />);
    fireEvent.click(screen.getByText('New Game'));
    expect(screen.getByText('Abandon current game?')).toBeTruthy();
  });

  it('switches the interface to Simplified Chinese from Settings and remembers it', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('简体中文'));
    expect(screen.getByText('新游戏')).toBeTruthy();
    expect(screen.getByText('忠诚与欺骗之战')).toBeTruthy();
    expect(localStorage.getItem('avalon.lang')).toBe('zh');
    expect(document.documentElement.lang).toBe('zh-Hans');
    cleanup();
    render(<App />);
    expect(screen.getByText('新游戏')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('设置'));
    fireEvent.click(screen.getByText('English'));
    expect(screen.getByText('New Game')).toBeTruthy();
  });
});
