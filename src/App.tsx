import { useCallback, useEffect, useRef, useState } from 'react';
import { createSetup, isGameInProgress, reduce, type Action, type GameState } from './game/engine';
import { loadGame, saveGame } from './game/storage';
import { Confirm } from './components/ui';
import {
  CharacterConfigScreen,
  DistributionScreen,
  HomeScreen,
  HowToPlayScreen,
  PlayerCountScreen,
  PlayerNamesScreen,
} from './screens/SetupScreens';
import { ReadyScreen, RevealScreen } from './screens/RevealScreens';
import {
  DashboardScreen,
  MissionResultScreen,
  MissionVoteScreen,
  TeamSelectionScreen,
} from './screens/GameScreens';
import { AssassinScreen, FinalScreen } from './screens/EndScreens';
import { LanguageProvider, useI18n, type MsgKey } from './i18n';

type View = 'home' | 'rules' | 'game';

/** Translation key for the "Resume Game · …" label on the home screen. */
function stageKey(s: GameState): MsgKey {
  switch (s.stage) {
    case 'playerCount':
    case 'playerNames':
    case 'characterConfig':
      return 'stage.setup';
    case 'distribution':
    case 'reveal':
    case 'ready':
      return 'stage.reveal';
    case 'assassin':
      return 'stage.assassin';
    case 'final':
      return 'stage.final';
    default:
      return 'stage.mission';
  }
}

export default function App() {
  return (
    <LanguageProvider>
      <Game />
    </LanguageProvider>
  );
}

function Game() {
  const { t } = useI18n();
  const [view, setView] = useState<View>('home');
  const [game, setGame] = useState<GameState | null>(() => loadGame());
  const [toast, setToast] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const gameRef = useRef(game);
  const viewRef = useRef(view);
  viewRef.current = view;

  const commit = useCallback((next: GameState | null) => {
    gameRef.current = next;
    setGame(next);
    saveGame(next);
  }, []);

  const dispatch = useCallback(
    (a: Action) => {
      const cur = gameRef.current;
      if (!cur) return;
      try {
        const next = reduce(cur, a);
        if (next !== cur) commit(next);
      } catch (e) {
        setToast(e instanceof Error ? e.message : String(e));
      }
    },
    [commit],
  );

  // Hide private information whenever the app is backgrounded or left.
  useEffect(() => {
    const hide = () => dispatch({ type: 'HIDE_PRIVATE' });
    const onVis = () => document.visibilityState === 'hidden' && hide();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', hide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', hide);
    };
  }, [dispatch]);

  // Trap the browser/Android back button during play: never navigate to a
  // previous private screen — just hide anything private instead.
  useEffect(() => {
    history.pushState({ avalon: true }, '');
    const onPop = () => {
      dispatch({ type: 'HIDE_PRIVATE' });
      if (viewRef.current === 'rules') setView('home');
      history.pushState({ avalon: true }, '');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [dispatch]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const goHome = useCallback(() => {
    dispatch({ type: 'HIDE_PRIVATE' });
    setView('home');
  }, [dispatch]);

  const startNew = useCallback(() => {
    const prev = gameRef.current;
    const fresh = createSetup();
    // Keep previous names and player count as a convenience for the next setup.
    if (prev) Object.assign(fresh, { playerCount: prev.playerCount, names: prev.names });
    commit(fresh);
    setView('game');
  }, [commit]);

  const homeMenu = (
    <button
      onClick={goHome}
      aria-label={t('common.home')}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/30 text-gold-300 active:bg-white/10"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
      </svg>
    </button>
  );

  let content: React.ReactNode;
  if (view === 'rules') content = <HowToPlayScreen onBack={() => setView('home')} />;
  else if (view === 'home' || !game)
    content = (
      <HomeScreen
        canResume={!!game}
        resumeLabel={game ? t(stageKey(game), { n: game.missionIndex + 1 }) : ''}
        onNew={() => (isGameInProgress(game) ? setConfirmNew(true) : startNew())}
        onResume={() => setView('game')}
        onRules={() => setView('rules')}
      />
    );
  else {
    const props = { state: game, dispatch };
    switch (game.stage) {
      case 'playerCount':
        content = <PlayerCountScreen {...props} onBack={goHome} />;
        break;
      case 'playerNames':
        content = <PlayerNamesScreen {...props} />;
        break;
      case 'characterConfig':
        content = <CharacterConfigScreen {...props} />;
        break;
      case 'distribution':
        content = <DistributionScreen {...props} />;
        break;
      case 'reveal':
        content = <RevealScreen {...props} />;
        break;
      case 'ready':
        content = <ReadyScreen dispatch={dispatch} />;
        break;
      case 'dashboard':
        content = <DashboardScreen {...props} menu={homeMenu} />;
        break;
      case 'teamSelection':
        content = <TeamSelectionScreen {...props} menu={homeMenu} />;
        break;
      case 'missionVote':
        content = <MissionVoteScreen {...props} />;
        break;
      case 'missionResult':
        content = <MissionResultScreen {...props} />;
        break;
      case 'assassin':
        content = <AssassinScreen {...props} />;
        break;
      case 'final':
        content = <FinalScreen {...props} onNewGame={startNew} onHome={goHome} menu={homeMenu} />;
        break;
    }
  }

  return (
    <div className="h-full">
      {content}
      <Confirm
        open={confirmNew}
        title={t('abandon.title')}
        body={t('abandon.body')}
        confirmLabel={t('abandon.confirm')}
        danger
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => {
          setConfirmNew(false);
          startNew();
        }}
      />
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] animate-fadeUp rounded-full border border-evil-400/60 bg-evil-700/90 px-5 py-2 text-center text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
