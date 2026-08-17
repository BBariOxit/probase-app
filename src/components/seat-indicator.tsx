import type { TopicAvailability } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/**
 * Written out in full rather than composed from the tone name: Tailwind reads
 * the source as text, so a template literal would compile to nothing.
 */
const TONE_CLASS = {
  success: 'bg-status-success-bg text-status-success',
  active: 'bg-status-active-bg text-status-active',
  idle: 'bg-status-idle-bg text-status-idle',
} as const;

/**
 * Whether a student can still get onto this topic — the first thing they need
 * from a list of forty, and so the loudest thing on a card after the title.
 *
 * The three ways a *claimed* topic can be unavailable — full, the group shut its
 * door, seats held for people the leader is bringing — are deliberately one
 * state. To somebody outside they are the same fact, and naming the reason would
 * invite them to wait for a seat that already has a name on it.
 *
 * But "somebody has it" and "it is not yours to take" are not the same fact, and
 * collapsing those two is how this badge came to announce "Đã có nhóm" over a
 * topic nobody had registered at all.
 */
export function SeatBadge({
  topic,
  className,
}: {
  topic: TopicAvailability & { maxStudents: number; activeGroup: unknown };
  className?: string;
}) {
  const { label, tone } = describe(topic);

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

function describe(
  topic: TopicAvailability & { maxStudents: number; activeGroup: unknown },
): {
  label: string;
  tone: keyof typeof TONE_CLASS;
} {
  if (topic.canRegister) return { label: 'Còn trống', tone: 'success' };

  if (topic.canJoin) {
    const free = topic.maxStudents - topic.occupiedSeats;
    return {
      label: `${topic.occupiedSeats}/${topic.maxStudents} · còn ${free} chỗ`,
      tone: 'active',
    };
  }

  if (topic.isFull) {
    return {
      label: `Đủ ${topic.occupiedSeats}/${topic.maxStudents}`,
      tone: 'idle',
    };
  }

  // Somebody holds it and is not taking anyone else.
  if (topic.activeGroup) return { label: 'Đã có nhóm', tone: 'idle' };

  // Nobody holds it, so the reason has to be about the reader rather than the
  // topic: either their intake is not opened for this kind of project, or the
  // gate is not open to anyone yet.
  if (topic.eligibleForMe === false) {
    return { label: 'Không đúng khóa', tone: 'idle' };
  }

  return { label: 'Chưa mở đăng ký', tone: 'idle' };
}

/**
 * Seats as filled and empty dots.
 *
 * For the group's own screen, where the count is not a yes/no but something the
 * members watch fill up. Held seats read as taken, because to the group they are.
 */
export function SeatDots({
  occupied,
  capacity,
  held = 0,
  className,
}: {
  occupied: number;
  capacity: number;
  held?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      role="img"
      aria-label={`${occupied} trên ${capacity} chỗ`}
    >
      {Array.from({ length: capacity }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            'size-2 rounded-full',
            index < occupied
              ? 'bg-status-success'
              : index < occupied + held
                ? 'bg-status-active/40'
                : 'bg-muted-foreground/25',
          )}
        />
      ))}
    </span>
  );
}
