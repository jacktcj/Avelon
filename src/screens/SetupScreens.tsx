import { useMemo, useRef, useState } from 'react';
import type { Action, GameState } from '../game/engine';
import {
  ADVANCED_OPTIONS,
  CLASSIC_OPTIONS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROLE_INFO,
  TEAM_SIZES,
  buildDeck,
  countEvilOptionals,
  evilOptionalSlots,
  modeOf,
  toggleOption,
  type OptionalRole,
  type Role,
} from '../game/rules';
import { CardBack, CastleHero, RoleArt, TeamCrest } from '../art/RoleArt';
import { Divider, Screen } from '../components/ui';
import { LANGUAGES, Rich, useI18n, type MsgKey } from '../i18n';

type Dispatch = (a: Action) => void;

// ---- Home -------------------------------------------------------------------

export function HomeScreen({
  canResume,
  resumeLabel,
  onNew,
  onResume,
  onRules,
}: {
  canResume: boolean;
  resumeLabel: string;
  onNew: () => void;
  onResume: () => void;
  onRules: () => void;
}) {
  const { t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className="safe-pad relative mx-auto flex h-full w-full max-w-md flex-col items-center px-6">
      <Twinkles />
      <button
        onClick={() => setSettingsOpen(true)}
        aria-label={t('settings.title')}
        className="absolute right-4 top-[max(env(safe-area-inset-top),1rem)] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/30 bg-royal-900/60 text-gold-300 backdrop-blur active:bg-white/10"
      >
        <GearIcon />
      </button>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <CastleHero className="w-full max-w-xs animate-fadeUp drop-shadow-[0_10px_30px_rgba(79,179,240,0.25)]" />
        <h1
          className="gold-text mt-2 animate-fadeUp font-display text-6xl font-bold tracking-[0.12em] drop-shadow-[0_2px_12px_rgba(217,182,92,0.35)]"
          style={{ animationDelay: '.1s' }}
        >
          AVALON
        </h1>
        <p className="mt-2 animate-fadeUp text-xl italic text-gold-200/85" style={{ animationDelay: '.2s' }}>
          {t('app.subtitle')}
        </p>
        <Divider />
        <div className="mt-6 flex animate-fadeUp items-end justify-center gap-3" style={{ animationDelay: '.3s' }}>
          {(['percival', 'merlin', 'assassin'] as Role[]).map((r, i) => (
            <RoleArt
              key={r}
              role={r}
              className={`w-20 drop-shadow-xl ${i === 1 ? 'w-24 -translate-y-2' : i === 0 ? '-rotate-6' : 'rotate-6'}`}
            />
          ))}
        </div>
        <p className="mt-4 text-sm tracking-wide text-gold-300/60">{t('home.tagline')}</p>
      </div>
      <div className="flex w-full animate-fadeUp flex-col gap-3 pb-2" style={{ animationDelay: '.4s' }}>
        <button className="btn-gold" onClick={onNew}>
          {t('home.newGame')}
        </button>
        {canResume && (
          <button className="btn-ghost" onClick={onResume}>
            {t('home.resume')} <span className="text-sm font-normal opacity-70">· {resumeLabel}</span>
          </button>
        )}
        <button className="btn-ghost" onClick={onRules}>
          {t('home.howToPlay')}
        </button>
      </div>
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Settings sheet: currently just the interface language. */
function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="panel w-full max-w-sm animate-pop" onClick={(e) => e.stopPropagation()}>
        <h2 className="gold-text text-center text-2xl font-bold">{t('settings.title')}</h2>
        <h3 className="label mb-2 mt-5">{t('settings.language')}</h3>
        <div className="flex flex-col gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              aria-pressed={lang === l.id}
              className={`flex min-h-[3.25rem] items-center justify-between rounded-2xl border-2 px-4 text-lg transition active:scale-[0.98] ${
                lang === l.id ? 'border-gold-300 bg-gold-500/20 text-gold-200' : 'border-gold-500/20 bg-royal-900/60 text-gold-300/80'
              }`}
            >
              <span>{l.label}</span>
              {lang === l.id && <span className="text-gold-300">✓</span>}
            </button>
          ))}
        </div>
        <button className="btn-gold mt-6" onClick={onClose}>
          {t('settings.done')}
        </button>
      </div>
    </div>
  );
}

function Twinkles() {
  const stars = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ l: (i * 37) % 100, t: (i * 53) % 60, d: (i % 7) * 0.4, s: i % 3 === 0 ? 3 : 2 })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gold-200 animate-twinkle"
          style={{ left: `${s.l}%`, top: `${s.t}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }}
        />
      ))}
    </div>
  );
}

// ---- How to play -----------------------------------------------------------

/** Character guide: when each role is in play (translated via inPlay.* and knows.* keys). */
const CHARACTER_GUIDE: { role: Role; inPlay: MsgKey }[] = [
  { role: 'merlin', inPlay: 'inPlay.always' },
  { role: 'percival', inPlay: 'inPlay.optional' },
  { role: 'servant', inPlay: 'inPlay.fillGood' },
  { role: 'assassin', inPlay: 'inPlay.always' },
  { role: 'morgana', inPlay: 'inPlay.optionalNeedsPercival' },
  { role: 'mordred', inPlay: 'inPlay.optional' },
  { role: 'oberon', inPlay: 'inPlay.optional' },
  { role: 'minion', inPlay: 'inPlay.fillEvil' },
];

function CharacterGuide() {
  const { t, roleName, roleText } = useI18n();
  return (
    <section className="mb-3">
      <h2 className="gold-text mb-2 px-1 text-lg font-bold">{t('howto.charactersTitle')}</h2>
      <div className="flex flex-col gap-2">
        {CHARACTER_GUIDE.map(({ role, inPlay }) => {
          const team = ROLE_INFO[role].team;
          const good = team === 'good';
          return (
            <article
              key={role}
              className={`flex gap-3 rounded-3xl border p-3 ${good ? 'border-good-400/40 bg-good-700/20' : 'border-evil-400/40 bg-evil-700/20'}`}
            >
              <RoleArt role={role} className="w-20 shrink-0 self-start drop-shadow-lg" />
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-lg font-bold leading-tight text-gold-200">{roleName(role)}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-heading text-[0.65rem] font-bold uppercase tracking-[0.15em] ${
                      good ? 'border-good-400 text-good-300' : 'border-evil-400 text-evil-300'
                    }`}
                  >
                    <TeamCrest team={team} className="h-3.5 w-3.5" />
                    {t(good ? 'team.good' : 'team.evil')}
                  </span>
                  <span className="text-xs text-gold-300/70">{t(inPlay)}</span>
                </div>
                <p className="mt-1.5 text-base leading-snug text-gold-200/90">{roleText(role, 'description')}</p>
                <p className="mt-1 text-sm leading-snug text-gold-300/80">
                  <b className="text-gold-300">{t('howto.knows')}</b> {t(`knows.${role}` as MsgKey)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function HowToPlayScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const section = (title: MsgKey, ...paragraphs: MsgKey[]) => (
    <section className="panel mb-3">
      <h2 className="gold-text mb-2 text-lg font-bold">{t(title)}</h2>
      <div className="space-y-2 text-[1.08rem] leading-snug text-gold-200/90">
        {paragraphs.map((p) => (
          <p key={p}>
            <Rich text={t(p)} />
          </p>
        ))}
      </div>
    </section>
  );
  return (
    <Screen
      stage={t('howto.title')}
      title={t('howto.title')}
      onBack={onBack}
      footer={
        <button className="btn-gold" onClick={onBack}>
          {t('howto.gotIt')}
        </button>
      }
    >
      {section('howto.goalTitle', 'howto.goalBody')}
      {section('howto.secretTitle', 'howto.secretBody1', 'howto.secretBody2')}
      <CharacterGuide />
      {section('howto.missionTitle', 'howto.mission1', 'howto.mission2', 'howto.mission3')}
      {section('howto.twistTitle', 'howto.twistBody')}
      {section('howto.etiquetteTitle', 'howto.etiquetteBody')}
    </Screen>
  );
}

// ---- Player count ----------------------------------------------------------

export function PlayerCountScreen({ state, dispatch, onBack }: { state: GameState; dispatch: Dispatch; onBack: () => void }) {
  const { t } = useI18n();
  const [count, setCount] = useState(state.playerCount);
  const sizes = TEAM_SIZES[count];
  return (
    <Screen
      stage={t('count.stage')}
      title={t('count.title')}
      subtitle={t('count.subtitle')}
      onBack={onBack}
      footer={
        <button className="btn-gold" onClick={() => dispatch({ type: 'SET_PLAYER_COUNT', count })}>
          {t('common.continue')}
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map((n) => (
          <button
            key={n}
            onClick={() => setCount(n)}
            aria-pressed={n === count}
            className={`h-20 rounded-2xl border-2 font-display text-3xl font-bold transition active:scale-95 ${
              n === count
                ? 'border-gold-300 bg-gold-500/20 text-gold-200 shadow-[0_0_24px_-4px_rgba(217,182,92,0.6)]'
                : 'border-gold-500/25 bg-royal-900/60 text-gold-300/70'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <TeamCount team="good" n={sizes.good} />
        <TeamCount team="evil" n={sizes.evil} />
      </div>
    </Screen>
  );
}

function TeamCount({ team, n }: { team: 'good' | 'evil'; n: number }) {
  const { t } = useI18n();
  const good = team === 'good';
  return (
    <div
      key={n}
      className={`flex animate-pop flex-col items-center rounded-3xl border p-4 ${
        good ? 'border-good-400/50 bg-good-700/25' : 'border-evil-400/50 bg-evil-700/25'
      }`}
    >
      <TeamCrest team={team} className="h-12 w-12" />
      <span className={`mt-2 font-display text-4xl font-bold ${good ? 'text-good-300' : 'text-evil-300'}`}>{n}</span>
      <span className="label mt-1">{t(good ? 'team.good' : 'team.evil')}</span>
    </div>
  );
}

// ---- Names -----------------------------------------------------------------

export function PlayerNamesScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { t } = useI18n();
  const [names, setNames] = useState<string[]>(state.names);
  const [touched, setTouched] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const lower = names.map((n) => n.trim().toLocaleLowerCase());
  const isDuplicate = (i: number) => !!lower[i] && lower.indexOf(lower[i]) !== i;
  const fieldError = (i: number) => {
    if (!lower[i]) return touched ? t('names.required') : null;
    if (isDuplicate(i)) return t('names.duplicate');
    return null;
  };
  const firstDuplicate = names.findIndex((_, i) => isDuplicate(i));
  const error = lower.some((n) => !n)
    ? t('names.errorEmpty')
    : firstDuplicate >= 0
      ? t('names.errorDuplicate', { name: names[firstDuplicate].trim() })
      : null;

  const submit = () => {
    setTouched(true);
    if (!error) dispatch({ type: 'SET_NAMES', names });
    else {
      const bad = names.findIndex((_, i) => !lower[i] || isDuplicate(i));
      refs.current[bad]?.focus();
    }
  };

  return (
    <Screen
      stage={t('names.stage')}
      title={t('names.title')}
      subtitle={t('names.subtitle')}
      onBack={() => dispatch({ type: 'BACK' })}
      footer={
        <>
          {touched && error && <p className="text-center text-evil-300">{error}</p>}
          <button className="btn-gold" onClick={submit}>
            {t('names.continue')}
          </button>
        </>
      }
    >
      <form
        className="flex flex-col gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {names.map((name, i) => {
          const err = fieldError(i);
          return (
            <label key={i} className="block">
              <div
                className={`flex items-center gap-3 rounded-2xl border bg-royal-900/70 px-3 transition focus-within:border-gold-300 ${
                  err ? 'border-evil-400' : 'border-gold-500/30'
                }`}
              >
                <span className="w-16 shrink-0 font-heading text-sm text-gold-400">{t('names.player', { n: i + 1 })}</span>
                <input
                  ref={(el) => (refs.current[i] = el)}
                  value={name}
                  maxLength={16}
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint={i === names.length - 1 ? 'done' : 'next'}
                  placeholder={t('names.placeholder')}
                  onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && i < names.length - 1) {
                      e.preventDefault();
                      refs.current[i + 1]?.focus();
                    }
                  }}
                  className="h-14 min-w-0 flex-1 bg-transparent text-xl text-gold-200 placeholder:text-gold-200/30 focus:outline-none"
                />
              </div>
              {err && <span className="ml-3 mt-1 block text-sm text-evil-300">{err}</span>}
            </label>
          );
        })}
        <button type="submit" hidden />
      </form>
    </Screen>
  );
}

// ---- Character configuration ----------------------------------------------

const OPTIONAL: { role: OptionalRole; blurb: MsgKey }[] = [
  { role: 'percival', blurb: 'config.blurbPercival' },
  { role: 'morgana', blurb: 'config.blurbMorgana' },
  { role: 'mordred', blurb: 'config.blurbMordred' },
  { role: 'oberon', blurb: 'config.blurbOberon' },
];

export function CharacterConfigScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { t, roleName } = useI18n();
  const n = state.playerCount;
  const o = state.options;
  const mode = modeOf(o);
  const deck = buildDeck(n, o);
  const slotsLeft = evilOptionalSlots(n) - countEvilOptionals(o);

  const counts = deck.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r]: (acc[r] ?? 0) + 1 }), {});
  const ordered = (Object.keys(counts) as Role[]).sort(
    (a, b) => Number(ROLE_INFO[a].team === 'evil') - Number(ROLE_INFO[b].team === 'evil'),
  );

  return (
    <Screen
      stage={t('config.stage')}
      title={t('config.title')}
      subtitle={t('config.subtitle', { good: TEAM_SIZES[n].good, evil: TEAM_SIZES[n].evil })}
      onBack={() => dispatch({ type: 'BACK' })}
      footer={
        <button className="btn-gold" onClick={() => dispatch({ type: 'SHUFFLE_START' })}>
          {t('config.shuffle')}
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gold-500/25 bg-royal-950/60 p-1.5">
        {(['classic', 'advanced'] as const).map((m) => (
          <button
            key={m}
            onClick={() => dispatch({ type: 'SET_OPTIONS', options: m === 'classic' ? CLASSIC_OPTIONS : ADVANCED_OPTIONS })}
            className={`rounded-xl py-3 font-heading text-base font-bold tracking-wider transition ${
              mode === m ? 'bg-gold-400 text-royal-950 shadow' : 'text-gold-300/70'
            }`}
          >
            {t(m === 'classic' ? 'config.classic' : 'config.advanced')}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-sm italic text-gold-300/70">
        {t(mode === 'classic' ? 'config.modeClassic' : mode === 'advanced' ? 'config.modeAdvanced' : 'config.modeCustom')}
      </p>

      <h3 className="label mb-2 mt-5">{t('config.always')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {(['merlin', 'assassin'] as Role[]).map((r) => (
          <RoleRow key={r} role={r} blurb={t(r === 'merlin' ? 'config.blurbMerlin' : 'config.blurbAssassin')} on locked />
        ))}
      </div>

      <h3 className="label mb-2 mt-5 flex justify-between">
        <span>{t('config.special')}</span>
        <span className="normal-case tracking-normal text-gold-300/60">{t('config.slotsLeft', { n: slotsLeft })}</span>
      </h3>
      <div className="flex flex-col gap-2">
        {OPTIONAL.map(({ role, blurb }) => {
          const next = toggleOption(n, o, role);
          const blocked = next === o; // toggle refused because it would break the rules
          return (
            <RoleRow
              key={role}
              role={role}
              blurb={t(blocked && !o[role] ? 'config.noSlot' : blurb)}
              on={o[role]}
              disabled={blocked}
              onClick={() => dispatch({ type: 'SET_OPTIONS', options: next })}
              wide
            />
          );
        })}
      </div>
      {o.morgana && <p className="mt-2 text-sm italic text-gold-300/70">{t('config.morganaNeedsPercival')}</p>}

      <h3 className="label mb-2 mt-5">{t('config.finalDeck', { n })}</h3>
      <div className="panel flex flex-wrap gap-2 !p-3">
        {ordered.map((r) => (
          <span
            key={r}
            className={`rounded-full border px-3 py-1 text-base ${
              ROLE_INFO[r].team === 'good' ? 'border-good-400/50 bg-good-700/30 text-good-300' : 'border-evil-400/50 bg-evil-700/30 text-evil-300'
            }`}
          >
            {roleName(r)}
            {counts[r] > 1 && <b> ×{counts[r]}</b>}
          </span>
        ))}
      </div>
    </Screen>
  );
}

function RoleRow({
  role,
  blurb,
  on,
  locked,
  disabled,
  onClick,
  wide,
}: {
  role: Role;
  blurb: string;
  on: boolean;
  locked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  wide?: boolean;
}) {
  const { roleName } = useI18n();
  const evil = ROLE_INFO[role].team === 'evil';
  return (
    <button
      type="button"
      disabled={locked || (disabled && !on)}
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-3 rounded-2xl border p-2 text-left transition active:scale-[0.98] disabled:active:scale-100 ${
        on
          ? evil
            ? 'border-evil-400/70 bg-evil-700/30'
            : 'border-good-400/70 bg-good-700/30'
          : 'border-gold-500/20 bg-royal-900/50'
      } ${disabled && !on ? 'opacity-40' : ''}`}
    >
      <RoleArt role={role} className={wide ? 'h-16 w-12 shrink-0' : 'h-14 w-11 shrink-0'} />
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-base font-bold text-gold-200">{roleName(role)}</span>
        <span className="block text-sm leading-tight text-gold-200/70">{blurb}</span>
      </span>
      {!locked && (
        <span
          className={`mr-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${on ? 'bg-gold-400' : 'bg-white/15'}`}
          aria-hidden
        >
          <span className={`h-5 w-5 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : ''}`} />
        </span>
      )}
    </button>
  );
}

// ---- Distribution ----------------------------------------------------------

export function DistributionScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { t } = useI18n();
  return (
    <Screen
      stage={t('dealt.stage')}
      title={t('dealt.title')}
      subtitle={t('dealt.subtitle')}
      footer={
        <button className="btn-gold" onClick={() => dispatch({ type: 'BEGIN_REVEAL' })}>
          {t('dealt.begin')}
        </button>
      }
    >
      <div className="relative mx-auto mt-4 h-64 w-full max-w-xs">
        {state.names.map((_, i) => {
          const mid = (state.playerCount - 1) / 2;
          const angle = (i - mid) * 7;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-4 w-32 origin-bottom animate-fadeUp"
              style={{
                transform: `translateX(-50%) rotate(${angle}deg) translateY(${Math.abs(i - mid) * 3}px)`,
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <CardBack className="w-full drop-shadow-2xl" />
            </div>
          );
        })}
      </div>
      <div className="panel mt-6 text-center text-lg leading-snug">
        <Rich text={t('dealt.body')} />
      </div>
    </Screen>
  );
}
