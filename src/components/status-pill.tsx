import { cn } from '@/lib/utils';

/**
 * Class names are written out in full rather than composed from the tone name,
 * because Tailwind reads the source as text — a template literal would compile
 * to nothing.
 */
const TONE_CLASS = {
  /** Somebody else has to act before this moves. */
  waiting: 'bg-status-waiting-bg text-status-waiting',
  /** Running, and the reader is part of it. */
  active: 'bg-status-active-bg text-status-active',
  /** The good outcome. */
  success: 'bg-status-success-bg text-status-success',
  /** The bad one, and worth the reader stopping on. */
  danger: 'bg-status-danger-bg text-status-danger',
  /** Nothing to do here. */
  idle: 'bg-status-idle-bg text-status-idle',
} as const;

export type StatusTone = keyof typeof TONE_CLASS;

export interface StatusLabel {
  label: string;
  tone: StatusTone;
}

/**
 * One small coloured label, drawn the same way everywhere a state is named.
 *
 * It exists because the palette was written out three times over — once for
 * topic statuses, once for seat counts, once more for anything added after — and
 * the copies had already begun to disagree about which tones existed at all.
 * What each state *means* still belongs to the component that knows about that
 * state; only the drawing is here.
 */
export function StatusPill({
  label,
  tone,
  className,
}: StatusLabel & { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
