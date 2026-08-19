import type { TopicAvailability } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { StatusPill, type StatusLabel } from '@/components/status-pill';

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
  return <StatusPill {...describe(topic)} className={className} />;
}

function describe(
  topic: TopicAvailability & { maxStudents: number; activeGroup: unknown },
): StatusLabel {
  // Held for the reader, and the only thing standing between them and it is
  // them. Said before the seat count because "còn trống" would describe a topic
  // anybody could take, and this is one only they can.
  if (topic.proposedByMe === true && topic.canRegister) {
    return { label: 'Chờ bạn đăng ký', tone: 'success' };
  }

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

  /*
    The reader is in the group that holds it. Said before the two lines below
    because both of those describe somebody else having taken the topic — which
    is the same fact about the topic and the opposite fact about this reader,
    and "đã có nhóm" over their own project reads as having lost it.
  */
  if (topic.isMyGroup) return { label: 'Nhóm của bạn', tone: 'active' };

  // Somebody holds it and is not taking anyone else.
  if (topic.activeGroup) return { label: 'Đã có nhóm', tone: 'idle' };

  /*
    Nobody holds it, and it is still not on offer — which used to fall through
    to "chưa mở đăng ký" and tell a plain lie about a topic whose round was
    wide open. A topic written out of somebody else's proposal is theirs while
    the gate is open, so it is never going to become available to this reader
    and saying "not open yet" invites them to come back and check.

    Ahead of the eligibility line because both can be true at once and this is
    the one that will not change: a cohort can be opened for a project type, a
    reservation belongs to a person.
  */
  if (topic.proposedByMe === false) {
    return { label: 'SV khác đề xuất', tone: 'idle' };
  }

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
