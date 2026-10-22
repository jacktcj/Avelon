import { useMemo, useState, type ReactNode } from 'react';
import type { Action, GameState, Mission } from '../game/engine';
import { countResults, currentMission } from '../game/engine';
import { shuffle } from '../game/random';
import { Avatar, CrownIcon, Handover, Progress, Screen } from '../components/ui';
import { useI18n } from '../i18n';
import { CharacterLookup } from './RevealScreens';

type Dispatch = (a: Action) => void;

// ---- Shared public widgets ------------------------------------------------

export function MissionBoard({ state, compact }: { state: GameState; compact?: boolean }) {
  const inPlay = !['final', 'assassin'].includes(state.stage);
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {state.missions.map((m, i) => (
        <MissionToken key={i} m={m} index={i} current={inPlay && i === state.missionIndex} compact={compact} />
      ))}
    </div>
  );
}

function MissionToken({ m, index, current, compact }: { m: Mission; index: number; current: boolean; compact?: boolean }) {
  const { t } = useI18n();
  const styles =
    m.status === 'success'
      ? 'border-good-300 bg-gradient-to-b from-good-500 to-good-700 text-white shadow-[0_0_18px_-4px_rgba(79,179,240,0.9)]'
      : m.status === 'fail'
        ? 'border-evil-300 bg-gradient-to-b from-evil-500 to-evil-700 text-white shadow-[0_0_18px_-4px_rgba(240,90,90,0.9)]'
        : current
          ? 'border-gold-300 bg-gold-500/20 text-gold-200 shadow-[0_0_20px_-2px_rgba(217,182,92,0.7)]'
          : 'border-white/15 bg-royal-900/70 text-gold-300/60';
  return (
    <div className={`flex flex-col items-center rounded-2xl border-2 px-1 transition ${compact ? 'py-1.5' : 'py-2.5'} ${styles}`}>
      <span className="font-heading text-[0.6rem] uppercase tracking-widest opacity-80">{t('board.mission')}</span>
      <span className="font-display text-xl font-bold leading-none">{index + 1}</span>
      <span className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full border text-lg font-bold ${m.status === 'pending' ? 'border-current' : 'border-white/60 bg-black/20'}`}>
        {m.status === 'success' ? '✓' : m.status === 'fail' ? '✕' : m.size}
      </span>
      {!compact && (
        <span className="mt-1 text-[0.7rem] leading-tight opacity-80">
          {m.status === 'success'
            ? t('board.success')
            : m.status === 'fail'
              ? t('board.failed')
              : current
                ? t('board.current')
                : t('board.knights', { n: m.size })}
        </span>
      )}
      {m.failsRequired > 1 && m.status === 'pending' && (
        <span className="mt-0.5 rounded bg-evil-600/60 px-1 text-[0.6rem] font-bold text-white">{t('board.twoFails')}</span>
      )}
    </div>
  );
}

function Score({ state }: { state: GameState }) {
  const { t } = useI18n();
  const { good, evil } = countResults(state);
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-2xl border border-good-400/40 bg-good-700/25 px-3 py-2 text-center">
        <div className="label !text-good-300/80">{t('team.good')}</div>
        <div className="font-display text-3xl font-bold text-good-300">{good}</div>
      </div>
      <div className="rounded-2xl border border-evil-400/40 bg-evil-700/25 px-3 py-2 text-center">
        <div className="label !text-evil-300/80">{t('team.evil')}</div>
        <div className="font-display text-3xl font-bold text-evil-300">{evil}</div>
      </div>
    </div>
  );
}

function PlayerName({ state, p, highlight }: { state: GameState; p: number; highlight?: boolean }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-lg ${
        highlight ? 'border-gold-300 bg-gold-500/15' : 'border-gold-500/25 bg-royal-900/60'
      }`}
    >
      <Avatar name={state.names[p]} size="sm" tone={p === state.leader ? 'gold' : 'neutral'} />
      <span className="truncate">{state.names[p]}</span>
      {p === state.leader && <CrownIcon className="h-4 w-4 shrink-0 text-gold-300" />}
    </span>
  );
}

function LeaderBanner({ state, extra }: { state: GameState; extra?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="panel flex items-center gap-3 !p-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/20 text-gold-300">
        <CrownIcon className="h-7 w-7" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="label">{t('board.leader')}</div>
        <div className="truncate font-heading text-2xl font-bold text-gold-200">{state.names[state.leader]}</div>
      </div>
      {extra}
    </div>
  );
}

// ---- Dashboard -------------------------------------------------------------

export function DashboardScreen({ state, dispatch, menu }: { state: GameState; dispatch: Dispatch; menu: ReactNode }) {
  const { t } = useI18n();
  const m = currentMission(state);
  const [lookup, setLookup] = useState(false);
  if (lookup) return <CharacterLookup state={state} onClose={() => setLookup(false)} />;
  return (
    <Screen
      stage={t('board.stage', { n: state.missionIndex + 1 })}
      menu={menu}
      footer={
        <>
          <button className="btn-gold" onClick={() => dispatch({ type: 'OPEN_TEAM_SELECTION' })}>
            {t('board.chooseTeam', { n: state.missionIndex + 1 })}
          </button>
          <button className="btn-ghost !min-h-[3rem] !text-base" onClick={() => setLookup(true)}>
            {t('board.myCharacter')}
          </button>
        </>
      }
    >
      <h1 className="gold-text mb-3 text-center font-display text-3xl font-bold">{t('board.title')}</h1>
      <MissionBoard state={state} />
      <div className="mt-4">
        <Score state={state} />
      </div>
      <div className="mt-3">
        <LeaderBanner
          state={state}
          extra={
            <div className="text-right">
              <div className="label">{t('board.team')}</div>
              <div className="font-display text-2xl font-bold text-gold-200">{m.size}</div>
            </div>
          }
        />
      </div>
      {m.failsRequired > 1 && (
        <div className="panel mt-3 !p-3">
          <p className="text-center text-base italic text-gold-200/75">{t('board.twoFailsNote')}</p>
        </div>
      )}
      <h2 className="label mb-2 mt-4">{t('board.table')}</h2>
      <div className="flex flex-wrap gap-2">
        {state.names.map((_, p) => (
          <PlayerName key={p} state={state} p={p} />
        ))}
      </div>
    </Screen>
  );
}

// ---- Team selection --------------------------------------------------------

export function TeamSelectionScreen({ state, dispatch, menu }: { state: GameState; dispatch: Dispatch; menu: ReactNode }) {
  const { t } = useI18n();
  const m = currentMission(state);
  const [picked, setPicked] = useState<number[]>([]);
  const full = picked.length === m.size;

  if (state.proposedTeam) {
    return (
      <Screen
        stage={t('team.missionTeamStage', { n: state.missionIndex + 1 })}
        title={t('team.missionTeam')}
        subtitle={t('team.chosenBy', { name: state.names[state.leader] })}
        menu={menu}
        footer={
          <>
            <button className="btn-gold" onClick={() => dispatch({ type: 'START_MISSION' })}>
              {t('team.begin')}
            </button>
            <button className="btn-ghost !min-h-[3rem] !text-base" onClick={() => dispatch({ type: 'EDIT_TEAM' })}>
              {t('team.change')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          {state.proposedTeam.map((p, i) => (
            <div key={p} className="panel flex animate-fadeUp items-center gap-3 !p-3" style={{ animationDelay: `${i * 0.07}s` }}>
              <Avatar name={state.names[p]} tone="gold" />
              <span className="font-heading text-2xl text-gold-200">{state.names[p]}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-lg italic text-gold-200/80">
          {t('team.note', { n: state.proposedTeam.length })}
        </p>
      </Screen>
    );
  }

  const toggle = (p: number) =>
    setPicked((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : cur.length < m.size ? [...cur, p] : cur));

  return (
    <Screen
      stage={t('team.selectionStage', { n: state.missionIndex + 1 })}
      menu={menu}
      footer={
        <button className="btn-gold" disabled={!full} onClick={() => dispatch({ type: 'PROPOSE_TEAM', team: picked })}>
          {full ? t('team.confirm') : t('team.selectMore', { n: m.size - picked.length })}
        </button>
      }
    >
      <h1 className="gold-text text-center font-display text-3xl font-bold">{t('team.missionN', { n: state.missionIndex + 1 })}</h1>
      <div className="mt-3">
        <LeaderBanner
          state={state}
          extra={
            <div className="text-right">
              <div className="label">{t('team.selected')}</div>
              <div className={`font-display text-2xl font-bold ${full ? 'text-good-300' : 'text-gold-200'}`}>
                {picked.length}/{m.size}
              </div>
            </div>
          }
        />
      </div>
      <p className="my-3 text-center text-lg italic text-gold-200/80">
        {t('team.chooseExactly', { name: state.names[state.leader], n: m.size })}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {state.names.map((name, p) => {
          const on = picked.includes(p);
          const disabled = !on && full;
          return (
            <button
              key={p}
              onClick={() => toggle(p)}
              disabled={disabled}
              aria-pressed={on}
              className={`flex min-h-[3.75rem] items-center gap-2 rounded-2xl border-2 px-2 text-left transition active:scale-95 ${
                on ? 'border-gold-300 bg-gold-500/20 shadow-[0_0_16px_-4px_rgba(217,182,92,0.8)]' : 'border-gold-500/20 bg-royal-900/60'
              } ${disabled ? 'opacity-40' : ''}`}
            >
              <Avatar name={name} size="sm" tone={on ? 'gold' : 'neutral'} />
              <span className="min-w-0 flex-1 truncate text-lg">{name}</span>
              {p === state.leader && <CrownIcon className="h-4 w-4 shrink-0 text-gold-300" />}
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${on ? 'border-gold-300 bg-gold-400 text-royal-950' : 'border-white/25'}`}>
                {on && '✓'}
              </span>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

function RecordedBadge({ text }: { text: string }) {
  return (
    <div className="mb-6 inline-flex animate-pop items-center gap-2 rounded-full border border-good-400/60 bg-good-700/30 px-4 py-1.5 text-good-300">
      <span>✓</span> {text}
    </div>
  );
}

// ---- Secret mission voting -------------------------------------------------

export function MissionVoteScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { t } = useI18n();
  const m = currentMission(state);
  const [choice, setChoice] = useState<'success' | 'fail' | null>(null);
  const done = state.voterIndex >= m.team.length;
  const progress = (
    <Progress
      done={state.voterIndex}
      total={m.team.length}
      text={t('progress.cards', { done: state.voterIndex, total: m.team.length })}
    />
  );

  if (done) {
    return (
      <Screen
        stage={t('vote.stage', { n: state.missionIndex + 1 })}
        footer={
          <button className="btn-gold" onClick={() => dispatch({ type: 'REVEAL_MISSION_RESULT' })}>
            {t('vote.reveal')}
          </button>
        }
      >
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="flex -space-x-8">
            {m.team.map((_, i) => (
              <MissionCardFace key={i} kind="back" className="animate-fadeUp" delay={i * 0.08} />
            ))}
          </div>
          <h1 className="gold-text mt-8 font-display text-3xl font-bold">{t('vote.allIn')}</h1>
          <p className="mt-3 text-xl italic text-gold-200/80">{t('vote.placePhone')}</p>
          <div className="mt-6 w-full">{progress}</div>
        </div>
      </Screen>
    );
  }

  const player = m.team[state.voterIndex];
  const name = state.names[player];

  if (!state.privateOpen) {
    return (
      <Handover
        key={state.voterIndex}
        stage={t('vote.stage', { n: state.missionIndex + 1 })}
        name={name}
        buttonLabel={t('vote.submitMissionCard')}
        onReveal={() => {
          setChoice(null);
          dispatch({ type: 'OPEN_PRIVATE' });
        }}
        progress={progress}
        extra={
          state.voterIndex === 0 ? (
            <div className="mb-6 text-center">
              <div className="label">{t('vote.missionTeam')}</div>
              <div className="mt-1 font-heading text-lg text-gold-200">{m.team.map((p) => state.names[p]).join(' · ')}</div>
            </div>
          ) : (
            <RecordedBadge text={t('vote.submitted')} />
          )
        }
      />
    );
  }

  // Every voter freely chooses Success or Fail; the screen never names the role or team.

  return (
    <Screen
      stage={t('vote.cardStage', { name })}
      footer={
        <button
          className="btn-gold"
          disabled={!choice}
          onClick={() => dispatch({ type: 'CAST_MISSION_VOTE', fail: choice === 'fail' })}
        >
          {t('vote.submit')}
        </button>
      }
    >
      <h1 className="gold-text mt-2 text-center font-display text-3xl font-bold">{t('vote.choose')}</h1>
      <p className="mt-2 text-center text-lg italic text-gold-200/75">{t('vote.secret')}</p>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button
          onClick={() => setChoice('success')}
          aria-pressed={choice === 'success'}
          className={`rounded-3xl transition active:scale-95 ${choice === 'success' ? 'scale-[1.04] ring-4 ring-gold-300' : ''} ${choice === 'fail' ? 'opacity-35' : ''}`}
        >
          <MissionCardFace kind="success" />
        </button>
        <button
          onClick={() => setChoice('fail')}
          aria-pressed={choice === 'fail'}
          className={`rounded-3xl transition active:scale-95 ${choice === 'fail' ? 'scale-[1.04] ring-4 ring-gold-300' : ''} ${choice === 'success' ? 'opacity-35' : ''}`}
        >
          <MissionCardFace kind="fail" />
        </button>
      </div>
    </Screen>
  );
}

function MissionCardFace({ kind, className = '', delay = 0 }: { kind: 'success' | 'fail' | 'back'; className?: string; delay?: number }) {
  const { t } = useI18n();
  const s = {
    success: 'border-good-300 from-good-400 to-good-700',
    fail: 'border-evil-300 from-evil-400 to-evil-700',
    back: 'border-gold-400 from-royal-700 to-royal-950',
  }[kind];
  return (
    <div
      className={`flex aspect-[3/4] w-full min-w-[6rem] flex-col items-center justify-center rounded-3xl border-2 bg-gradient-to-b p-3 text-white shadow-2xl ${s} ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {kind === 'back' ? (
        <svg viewBox="0 0 40 40" className="h-12 w-12 text-gold-300" fill="currentColor" aria-hidden>
          <path d="M20 2 L24 14 L38 20 L24 26 L20 38 L16 26 L2 20 L16 14Z" />
        </svg>
      ) : (
        <>
          <span className="text-6xl font-bold leading-none">{kind === 'success' ? '✓' : '✕'}</span>
          <span className="mt-3 font-heading text-lg font-bold tracking-[0.2em]">{t(kind === 'success' ? 'card.success' : 'card.fail')}</span>
        </>
      )}
    </div>
  );
}

// ---- Mission result --------------------------------------------------------

export function MissionResultScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { t } = useI18n();
  const m = currentMission(state);
  const ok = m.status === 'success';
  // Cards are shown in a random order so nothing maps back to a voter.
  const cards = useMemo(
    () => shuffle([...Array(m.successCount).fill('success'), ...Array(m.failCount).fill('fail')] as ('success' | 'fail')[]),
    [m.successCount, m.failCount],
  );
  const { good, evil } = countResults(state);
  const ends = good >= 3 || evil >= 3;

  return (
    <Screen
      stage={t('result.stage', { n: state.missionIndex + 1 })}
      footer={
        <button className="btn-gold" onClick={() => dispatch({ type: 'CONTINUE_AFTER_MISSION' })}>
          {ends ? t('common.continue') : t('result.next')}
        </button>
      }
    >
      <div className="flex flex-wrap justify-center gap-2">
        {cards.map((c, i) => (
          <div key={i} className="w-[4.5rem] animate-flipIn" style={{ animationDelay: `${0.3 + i * 0.35}s` }}>
            <MissionCardFace kind={c} className="!min-w-0 !p-1 [&>span:first-child]:text-3xl [&>span:last-child]:text-[0.55rem]" />
          </div>
        ))}
      </div>
      <div className="mt-6 text-center animate-pop" style={{ animationDelay: `${0.5 + cards.length * 0.35}s` }}>
        <h1 className={`font-display text-4xl font-bold ${ok ? 'text-good-300' : 'text-evil-300'} drop-shadow-[0_0_20px_currentColor]`}>
          {ok ? t('result.success') : t('result.failed')}
        </h1>
        <div className="mt-3 flex justify-center gap-8 font-display">
          <div>
            <div className="text-4xl font-bold text-good-300">{m.successCount}</div>
            <div className="label">{t('result.successLabel')}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-evil-300">{m.failCount}</div>
            <div className="label">{t('result.failLabel')}</div>
          </div>
        </div>
        {m.failsRequired > 1 && m.failCount === 1 && (
          <p className="mt-2 italic text-gold-200/80">{t('result.oneFail')}</p>
        )}
      </div>
      <div className="mt-6">
        <MissionBoard state={{ ...state, stage: 'final' }} compact />
      </div>
    </Screen>
  );
}
