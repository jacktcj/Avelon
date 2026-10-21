import { useState, type ReactNode } from 'react';
import type { Action, GameState } from '../game/engine';
import { countResults } from '../game/engine';
import { ROLE_INFO } from '../game/rules';
import { RoleArt, TeamCrest } from '../art/RoleArt';
import { Avatar, Confirm, CrownIcon, Handover, Screen } from '../components/ui';
import { MissionBoard } from './GameScreens';
import { Rich, useI18n } from '../i18n';

type Dispatch = (a: Action) => void;

// ---- Assassin --------------------------------------------------------------

export function AssassinScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { t } = useI18n();
  const [target, setTarget] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const assassin = state.roles.indexOf('assassin');

  if (state.assassinStep === 'intro') {
    return (
      <Screen
        stage={t('assassin.stage')}
        footer={
          <button className="btn-evil" onClick={() => dispatch({ type: 'BEGIN_ASSASSIN' })}>
            {t('assassin.begin')}
          </button>
        }
      >
        <div className="flex h-full flex-col items-center justify-center text-center">
          <TeamCrest team="good" className="h-24 w-24 animate-pop" />
          <h1 className="gold-text mt-6 font-display text-3xl font-bold leading-tight">
            {t('assassin.threeDone')}
          </h1>
          <p className="mt-6 animate-fadeUp text-2xl italic text-evil-300 [animation-delay:.6s]">
            {t('assassin.finalChance')}
          </p>
          <p className="mt-6 text-lg text-gold-200/75">
            {t('assassin.confer')}
          </p>
        </div>
      </Screen>
    );
  }

  if (state.assassinStep === 'handover' || !state.privateOpen) {
    return (
      <Handover
        stage={t('assassin.stage')}
        name={t('assassin.who')}
        message={t('assassin.onlyAssassin')}
        buttonLabel={t('assassin.iAm')}
        onReveal={() => {
          setTarget(null);
          dispatch({ type: 'OPEN_PRIVATE' });
        }}
      />
    );
  }

  return (
    <Screen
      stage={t('assassin.strikeStage')}
      footer={
        <button className="btn-evil" disabled={target === null} onClick={() => setConfirming(true)}>
          {t('assassin.strikeButton')}
        </button>
      }
    >
      <div className="mb-4 flex flex-col items-center text-center">
        <RoleArt role="assassin" className="w-20" />
        <h1 className="gold-text mt-3 font-display text-3xl font-bold">{t('assassin.whoIsMerlin')}</h1>
        <p className="mt-1 text-lg italic text-gold-200/75">{t('assassin.oneChance')}</p>
      </div>
      <div className="flex flex-col gap-2">
        {state.names.map((name, p) =>
          p === assassin ? null : (
            <button
              key={p}
              onClick={() => setTarget(p)}
              aria-pressed={target === p}
              className={`flex min-h-[3.5rem] items-center gap-3 rounded-2xl border-2 px-3 text-left transition active:scale-[0.98] ${
                target === p ? 'border-evil-300 bg-evil-600/40 shadow-[0_0_20px_-4px_rgba(240,90,90,0.9)]' : 'border-gold-500/20 bg-royal-900/60'
              }`}
            >
              <Avatar name={name} size="sm" tone={target === p ? 'evil' : 'neutral'} />
              <span className="flex-1 text-xl">{name}</span>
              {target === p && <span className="text-2xl">🗡</span>}
            </button>
          ),
        )}
      </div>
      <Confirm
        open={confirming}
        title={t('assassin.confirmTitle')}
        body={<Rich text={t('assassin.confirmBody', { name: target !== null ? state.names[target] : '' })} boldClass="text-evil-300" />}
        confirmLabel={t('assassin.confirm')}
        danger
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          if (target !== null) dispatch({ type: 'ASSASSINATE', target });
        }}
      />
    </Screen>
  );
}

// ---- Final results ---------------------------------------------------------

export function FinalScreen({
  state,
  dispatch,
  onNewGame,
  onHome,
  menu,
}: {
  state: GameState;
  dispatch: Dispatch;
  onNewGame: () => void;
  onHome: () => void;
  menu: ReactNode;
}) {
  const { t, roleName } = useI18n();
  const [confirmReveal, setConfirmReveal] = useState(false);
  const good = state.winner === 'good';
  const { good: goodWins, evil: evilWins } = countResults(state);
  const target = state.assassinTarget;

  const targetName = target !== null ? state.names[target] : '';
  const reason = {
    assassinMissed: t('final.assassinMissed', { name: targetName }),
    assassinHit: t('final.assassinHit', { name: targetName }),
    threeFails: t('final.threeFails'),
  }[state.winReason ?? 'threeFails'];

  return (
    <Screen stage={t('final.stage')} menu={menu}>
      {/* Victory banner */}
      <div className="relative flex flex-col items-center overflow-hidden rounded-3xl py-6 text-center">
        <span className={`absolute inset-0 animate-glow ${good ? 'bg-good-500/20' : 'bg-evil-500/20'} blur-3xl`} />
        <div className="relative">
          <span className={`absolute inset-0 -m-6 rounded-full blur-2xl animate-glow ${good ? 'bg-good-400/50' : 'bg-evil-400/50'}`} />
          <TeamCrest team={good ? 'good' : 'evil'} className="relative h-28 w-28 animate-pop" />
        </div>
        <h1
          className={`relative mt-4 animate-pop font-display text-5xl font-bold tracking-wider ${good ? 'text-good-300' : 'text-evil-300'} drop-shadow-[0_0_24px_currentColor]`}
          style={{ animationDelay: '.3s' }}
        >
          {t(good ? 'final.goodWins' : 'final.evilWins')}
        </h1>
        <p className="relative mt-3 animate-fadeUp px-4 text-xl italic text-gold-200/90" style={{ animationDelay: '.6s' }}>
          {reason}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-good-400/40 bg-good-700/25 py-2 text-center">
          <div className="label !text-good-300/80">{t('final.missionsGood')}</div>
          <div className="font-display text-3xl font-bold text-good-300">{goodWins}</div>
        </div>
        <div className="rounded-2xl border border-evil-400/40 bg-evil-700/25 py-2 text-center">
          <div className="label !text-evil-300/80">{t('final.missionsEvil')}</div>
          <div className="font-display text-3xl font-bold text-evil-300">{evilWins}</div>
        </div>
      </div>
      <div className="mt-3">
        <MissionBoard state={state} compact />
      </div>

      {/* Characters */}
      <section className="mt-5">
        {state.revealAll ? (
          <>
            <h2 className="label mb-2">{t('final.allCharacters')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {state.names.map((name, p) => {
                const role = state.roles[p];
                const g = ROLE_INFO[role].team === 'good';
                return (
                  <div
                    key={p}
                    className={`flex animate-flipIn items-center gap-2 rounded-2xl border p-2 ${g ? 'border-good-400/50 bg-good-700/25' : 'border-evil-400/50 bg-evil-700/25'}`}
                    style={{ animationDelay: `${p * 0.08}s` }}
                  >
                    <RoleArt role={role} className="h-14 w-11 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate font-heading text-base font-bold text-gold-200">{name}</div>
                      <div className={`text-sm leading-tight ${g ? 'text-good-300' : 'text-evil-300'}`}>{roleName(role)}</div>
                      <div className="text-xs uppercase tracking-widest text-gold-300/60">{t(g ? 'team.good' : 'team.evil')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <button className="btn-ghost" onClick={() => setConfirmReveal(true)}>
            {t('final.revealAll')}
          </button>
        )}
      </section>

      {/* History */}
      <section className="mt-6">
        <h2 className="label mb-2">{t('final.history')}</h2>
        <div className="flex flex-col gap-3">
          {state.missions.map((m, i) =>
            m.leader === null ? null : (
              <div key={i} className="panel !p-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg font-bold text-gold-200">{t('team.missionN', { n: i + 1 })}</span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-sm font-bold ${
                      m.status === 'success' ? 'bg-good-600 text-white' : m.status === 'fail' ? 'bg-evil-600 text-white' : 'bg-white/10 text-gold-300'
                    }`}
                  >
                    {m.status === 'success'
                      ? t('final.histSuccess', { n: m.failCount })
                      : m.status === 'fail'
                        ? t('final.histFailed', { n: m.failCount })
                        : t('final.notCompleted')}
                  </span>
                </div>
                <div className="mt-2 rounded-xl bg-black/20 p-2">
                  <div className="flex items-center gap-1 text-sm text-gold-300/80">
                    <CrownIcon className="h-3.5 w-3.5" />
                    {t('final.teamChosenBy', { name: state.names[m.leader] })}
                  </div>
                  <div className="mt-0.5 text-base text-gold-200">{m.team.map((x) => state.names[x]).join(', ')}</div>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3 pb-2">
        <button className="btn-gold" onClick={() => dispatch({ type: 'PLAY_AGAIN' })}>
          {t('final.playAgain')}
        </button>
        <button className="btn-ghost" onClick={onNewGame}>
          {t('final.newGame')}
        </button>
        <button className="btn-ghost" onClick={onHome}>
          {t('final.home')}
        </button>
      </div>

      <Confirm
        open={confirmReveal}
        title={t('final.revealTitle')}
        body={t('final.revealBody')}
        confirmLabel={t('final.reveal')}
        onCancel={() => setConfirmReveal(false)}
        onConfirm={() => {
          setConfirmReveal(false);
          dispatch({ type: 'REVEAL_ALL' });
        }}
      />
    </Screen>
  );
}
