import {
  describeRound,
  roundTimeline,
  type RoundLike,
} from '@/lib/round-status';
import { cn } from '@/lib/utils';

/**
 * Where the semester is, as a short column beside the group.
 *
 * This replaces a full-width card whose whole content was "Còn 21 ngày đăng ký"
 * — the same sentence the sidebar already keeps on screen at all times, set in
 * two hundred pixels of card. Repeating a line verbatim is not emphasis; it just
 * makes a reader check whether the two are saying different things.
 *
 * A sequence says something the sidebar line cannot: what comes after the gate
 * closes. The countdown is still here, but as the step it belongs to rather than
 * as a headline of its own, and the two steps with no announced date say so
 * instead of guessing.
 */
export function RoundTimeline({
  round,
  hasGroup,
  className,
}: {
  round: RoundLike;
  hasGroup: boolean;
  className?: string;
}) {
  const steps = roundTimeline(round);
  const { detail, urgent } = describeRound(round, hasGroup);

  return (
    <section className={cn('rounded-xl border bg-card p-5', className)}>
      <h2 className="text-sm font-medium">Mốc thời gian</h2>

      <ol className="mt-3">
        {steps.map((step, index) => {
          const last = index === steps.length - 1;
          const current = step.state === 'current';

          return (
            <li key={step.label} className="grid grid-cols-[auto_1fr] gap-x-3">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    step.state === 'done' && 'bg-muted-foreground/40',
                    step.state === 'upcoming' && 'border border-border',
                    current &&
                      (urgent
                        ? 'bg-status-waiting ring-4 ring-status-waiting/15'
                        : 'bg-primary ring-4 ring-primary/15'),
                  )}
                />
                {!last && <span className="w-px flex-1 bg-border" />}
              </div>

              <div className={cn(last ? 'pb-0' : 'pb-4')}>
                <p
                  className={cn(
                    'text-sm',
                    step.state === 'upcoming'
                      ? 'text-muted-foreground'
                      : 'font-medium',
                  )}
                >
                  {step.label}
                </p>

                {(step.date || step.note) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {step.date}
                    {step.date && step.note && ' · '}
                    {step.note && (
                      <span
                        className={cn(
                          current && 'font-medium text-foreground',
                          current && urgent && 'text-status-waiting',
                        )}
                      >
                        {step.note}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* What the current step means for this reader — the half a date cannot
          carry, and the reason the deadline is worth looking at at all. */}
      <p className="mt-4 border-t pt-3 text-xs text-pretty text-muted-foreground">
        {detail}
      </p>
    </section>
  );
}
