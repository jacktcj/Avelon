import { useEffect, useState } from 'react';
import type { Action, GameState } from '../game/engine';
import { knowledgeFor } from '../game/engine';
import { ROLE_INFO } from '../game/rules';
import { RoleArt, TeamCrest } from '../art/RoleArt';
import { Avatar, Handover, Progress, Screen } from '../components/ui';
import { useI18n } from '../i18n';

type Dispatch = (a: Action) => void;

export function RevealScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { t } = useI18n();
  const i = state.revealIndex;
  const name = state.names[i];
  const progress = (
    <Progress done={i} total={state.playerCount} text={t('progress.players', { done: i, total: state.playerCount })} />
  );

  if (!state.privateOpen) {
    return (
      <Handover
        key={i}
        stage={t('reveal.stage')}
        name={name}
        buttonLabel={t('reveal.iAm', { name })}
        onReveal={() => dispatch({ type: 'OPEN_PRIVATE' })}
        progress={progress}
      />
    );
  }

  return (
    <Screen
      stage={t('reveal.privateStage', { name })}
      footer={
        <button className="btn-gold !text-base" onClick={() => dispatch({ type: 'NEXT_REVEAL' })}>
          {t('reveal.hideNext')}
        </button>
      }
    >
      <CharacterCard state={state} player={i} />
    </Screen>
  );
}

/** A player's character and private knowledge. Render only while that player alone holds the phone. */
export function CharacterCard({ state, player }: { state: GameState; player: number }) {
  const { t, roleName, roleText, knowledgeTitle, hint } = useI18n();
  const role = state.roles[player];
  const team = ROLE_INFO[role].team;
  const title = roleName(role);
  const k = knowledgeFor(state, player);
  const good = team === 'good';

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-44 animate-flipIn">
        <span className={`absolute inset-0 -m-4 rounded-3xl blur-2xl animate-glow ${good ? 'bg-good-500/30' : 'bg-evil-500/30'}`} />
        <RoleArt role={role} className="relative w-full drop-shadow-2xl" />
      </div>
      <h1
        className={`gold-text mt-4 font-display font-bold uppercase tracking-wider animate-fadeUp ${title.length > 12 ? 'text-2xl' : 'text-4xl'}`}
        style={{ animationDelay: '.3s' }}
      >
        {title}
      </h1>
      <div
        className={`mt-2 inline-flex animate-fadeUp items-center gap-2 rounded-full border px-4 py-1 font-heading text-sm font-bold uppercase tracking-[0.2em] ${
          good ? 'border-good-400 bg-good-700/40 text-good-300' : 'border-evil-400 bg-evil-700/40 text-evil-300'
        }`}
        style={{ animationDelay: '.4s' }}
      >
        <TeamCrest team={team} className="h-5 w-5" />
        {t('reveal.team', { team: t(good ? 'team.good' : 'team.evil') })}
      </div>
      <p className="mt-3 animate-fadeUp text-xl italic text-gold-200" style={{ animationDelay: '.5s' }}>
        “{roleText(role, 'tagline')}”
      </p>
      <p className="mt-2 animate-fadeUp text-base leading-snug text-gold-200/75" style={{ animationDelay: '.55s' }}>
        {roleText(role, 'description')}
      </p>

      <div className={`panel mt-4 w-full animate-fadeUp !p-4 ${good ? '!border-good-400/40' : '!border-evil-400/40'}`} style={{ animationDelay: '.65s' }}>
        {k.kind !== 'none' && (
          <>
            <h2 className="label mb-3">{knowledgeTitle(k.kind)}</h2>
            {k.players.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {k.players.map((p) => (
                  <span
                    key={p}
                    className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-lg ${
                      role === 'percival' ? 'border-gold-400/60 bg-gold-500/10' : 'border-evil-400/60 bg-evil-700/30'
                    }`}
                  >
                    <Avatar name={state.names[p]} size="sm" tone={role === 'percival' ? 'gold' : 'evil'} />
                    {state.names[p]}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-lg italic text-gold-200/70">{t('reveal.noOne')}</p>
            )}
          </>
        )}
        <p className={`text-base italic text-gold-200/70 ${k.kind !== 'none' ? 'mt-3' : ''}`}>{hint(k.hint)}</p>
      </div>
    </div>
  );
}

export function ReadyScreen({ dispatch }: { dispatch: Dispatch }) {
  const { t } = useI18n();
  return (
    <Screen
      stage={t('ready.stage')}
      footer={
        <button className="btn-gold" onClick={() => dispatch({ type: 'START_GAME' })}>
          {t('ready.start')}
        </button>
      }
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="flex gap-4">
          <TeamCrest team="good" className="h-20 w-20 animate-pop" />
          <TeamCrest team="evil" className="h-20 w-20 animate-pop [animation-delay:.15s]" />
        </div>
        <h1 className="gold-text mt-6 font-display text-4xl font-bold">{t('ready.title')}</h1>
        <p className="mt-4 max-w-xs text-xl italic text-gold-200/85">{t('ready.body')}</p>
      </div>
    </Screen>
  );
}

/** Mid-game: a player who forgot their character picks their name, takes the phone and looks again. */
export function CharacterLookup({ state, onClose }: { state: GameState; onClose: () => void }) {
  const { t } = useI18n();
  const [player, setPlayer] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // Hide the character whenever the app is backgrounded or the back button is pressed.
  useEffect(() => {
    const hide = () => setOpen(false);
    const onVis = () => document.visibilityState === 'hidden' && hide();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', hide);
    window.addEventListener('popstate', hide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('popstate', hide);
    };
  }, []);

  if (player === null) {
    return (
      <Screen stage={t('lookup.stage')} title={t('lookup.title')} subtitle={t('lookup.subtitle')} onBack={onClose}>
        <div className="grid grid-cols-2 gap-2">
          {state.names.map((name, p) => (
            <button
              key={p}
              onClick={() => setPlayer(p)}
              className="flex min-h-[3.75rem] items-center gap-2 rounded-2xl border-2 border-gold-500/20 bg-royal-900/60 px-2 text-left transition active:scale-95"
            >
              <Avatar name={name} size="sm" />
              <span className="min-w-0 flex-1 truncate text-lg">{name}</span>
            </button>
          ))}
        </div>
      </Screen>
    );
  }

  const name = state.names[player];

  if (!open) {
    return (
      <Handover
        stage={t('lookup.stage')}
        name={name}
        buttonLabel={t('reveal.iAm', { name })}
        onReveal={() => setOpen(true)}
        onBack={() => setPlayer(null)}
      />
    );
  }

  return (
    <Screen
      stage={t('reveal.privateStage', { name })}
      footer={
        <button className="btn-gold !text-base" onClick={onClose}>
          {t('lookup.hide')}
        </button>
      }
    >
      <CharacterCard state={state} player={player} />
    </Screen>
  );
}
