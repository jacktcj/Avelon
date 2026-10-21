import { useEffect, type ReactNode } from 'react';
import { useI18n } from '../i18n';

/** Full-height portrait layout: header, scrollable body, sticky footer actions. */
export function Screen({
  stage,
  title,
  subtitle,
  children,
  footer,
  onBack,
  menu,
}: {
  stage?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  menu?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="safe-pad mx-auto flex h-full w-full max-w-md flex-col px-4">
      {(stage || onBack || menu) && (
        <div className="flex min-h-[2.5rem] items-center gap-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gold-300 active:bg-white/10"
              aria-label={t('common.back')}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
          {stage && <span className="label flex-1 truncate">{stage}</span>}
          {menu}
        </div>
      )}
      <div key={String(stage) + String(title)} className="flex min-h-0 flex-1 flex-col animate-fadeUp">
        {title && (
          <header className="mb-4 mt-2 text-center">
            <h1 className="gold-text text-[1.75rem] font-bold leading-tight tracking-wide">{title}</h1>
            {subtitle && <p className="mt-1 text-lg italic text-gold-200/75">{subtitle}</p>}
            <Divider />
          </header>
        )}
        <main className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-4">{children}</main>
      </div>
      {footer && <footer className="flex flex-col gap-3 pt-3">{footer}</footer>}
    </div>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return (
    <div className={`mx-auto mt-3 flex w-48 items-center gap-2 text-gold-500 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-500/70" />
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
        <path d="M10 0 L13 7 L20 10 L13 13 L10 20 L7 13 L0 10 L7 7Z" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-500/70" />
    </div>
  );
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="panel w-full max-w-sm animate-pop text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="gold-text text-2xl font-bold">{title}</h2>
        {body && <div className="mt-3 text-lg text-gold-200/85">{body}</div>}
        <div className="mt-6 flex flex-col gap-3">
          <button className={danger ? 'btn-evil' : 'btn-gold'} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn-ghost" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Public progress (e.g. "3 of 8 players completed"), with no secret information. */
export function Progress({ done, total, text }: { done: number; total: number; text: string }) {
  return (
    <div className="mt-2">
      <div className="mb-1.5 flex justify-between text-sm text-gold-300/80">
        <span>{text}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors duration-500 ${i < done ? 'bg-gold-400' : 'bg-white/10'}`}
          />
        ))}
      </div>
    </div>
  );
}

export function Avatar({ name, size = 'md', tone = 'neutral' }: { name: string; size?: 'sm' | 'md' | 'lg'; tone?: 'neutral' | 'good' | 'evil' | 'gold' }) {
  const sizes = { sm: 'h-8 w-8 text-sm', md: 'h-11 w-11 text-lg', lg: 'h-20 w-20 text-4xl' };
  const tones = {
    neutral: 'border-gold-500/50 bg-royal-800 text-gold-200',
    gold: 'border-gold-300 bg-gold-500/20 text-gold-200',
    good: 'border-good-400 bg-good-700/60 text-good-300',
    evil: 'border-evil-400 bg-evil-700/60 text-evil-300',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 font-heading font-bold ${sizes[size]} ${tones[tone]}`}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export function CrownIcon({ className = 'h-4 w-4' }: { className?: string }) {
  const { t } = useI18n();
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-label={t('board.leader')}>
      <path d="M3 18 L2 7 L7.5 11 L12 4 L16.5 11 L22 7 L21 18Z M3 20h18v2H3z" />
    </svg>
  );
}

/** Neutral privacy screen shown before handing private content to a player. */
export function Handover({
  stage,
  name,
  message,
  buttonLabel,
  onReveal,
  progress,
  extra,
}: {
  stage: string;
  name: string;
  message?: ReactNode;
  buttonLabel: string;
  onReveal: () => void;
  progress?: ReactNode;
  extra?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Screen
      stage={stage}
      footer={
        <button className="btn-gold" onClick={onReveal}>
          {buttonLabel}
        </button>
      }
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        {extra}
        <div className="relative mb-6 animate-float">
          <span className="absolute inset-0 -m-6 rounded-full bg-gold-400/15 blur-2xl animate-glow" />
          <PhoneIcon />
        </div>
        <p className="label">{t('handover.passTo')}</p>
        <h1 className="gold-text mt-2 break-all font-display text-5xl font-bold">{name}</h1>
        <p className="mt-4 max-w-xs text-xl italic text-gold-200/80">
          {message ?? t('handover.onlyYou', { name })}
        </p>
        {progress && <div className="mt-8 w-full">{progress}</div>}
      </div>
    </Screen>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 80 80" className="relative h-24 w-24" aria-hidden>
      <rect x="22" y="8" width="36" height="64" rx="7" fill="#10204d" stroke="#d9b65c" strokeWidth="2.5" />
      <rect x="27" y="16" width="26" height="44" rx="2" fill="#050a1c" />
      <path d="M40 30 a6 6 0 0 1 6 6 v4 h-12 v-4 a6 6 0 0 1 6 -6Z" fill="none" stroke="#d9b65c" strokeWidth="2" />
      <rect x="32" y="39" width="16" height="12" rx="2" fill="#d9b65c" />
      <circle cx="40" cy="66" r="2.5" fill="#d9b65c" />
      <path d="M8 40 q-4 -10 4 -18 M72 40 q4 -10 -4 -18" stroke="#d9b65c" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
