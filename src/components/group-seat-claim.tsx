'use client';

import { Loader2 } from 'lucide-react';
import { useUpdateGroup } from '@/lib/api/registration';
import type { RegistrationGroup } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/** Whole hours left on the hold, rounded up. */
function hoursLeft(holdUntil: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(holdUntil).getTime() - Date.now()) / 3_600_000),
  );
}

/**
 * How many of the topic's seats the group is claiming.
 *
 * A row of the topic's seat counts rather than a yes/no, because on a topic for
 * three a group that turns out to be two wants to free exactly one seat. The
 * counts below the group's own size stay in place and disabled: the reason they
 * are unavailable is that people are already sitting there, and a number that
 * quietly disappears looks like a bug rather than an explanation.
 *
 * Drawn as one segmented control rather than three separate buttons. As buttons
 * the unselected two carried a faint border, which reads as *disabled* rather
 * than as *not chosen* — and the chosen one, filled with the brand colour,
 * became the loudest thing on a dialog where it is not the point.
 *
 * The chosen segment is marked with a translucent wash of the accent rather than
 * a lighter surface, because a surface cannot do it in both themes: light mode
 * stacks background above muted, dark mode stacks it below, so the same pair of
 * tokens reads as raised on one and as a hole punched in the track on the other.
 * A tint over whatever is underneath behaves the same either way — and at this
 * strength it says "chosen" without competing with the one control here that is
 * worth pressing.
 *
 * Nothing here is required. Registration already holds every seat, so a leader
 * who ignores this keeps what they were given until the hold lapses on its own.
 */
export function GroupSeatClaim({ group }: { group: RegistrationGroup }) {
  const update = useUpdateGroup(group.id);
  const capacity = group.topic.maxStudents;
  const claimed = group.declaredSize ?? group.occupiedSeats;

  if (capacity < 2) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Số thành viên dự kiến</span>
        {update.isPending && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {/*
        Sized to its content, not to the container. Stretched across a card this
        wide, three segments holding one digit each became slabs the width of a
        paragraph.
      */}
      <div className="inline-flex w-fit gap-1 rounded-lg bg-muted p-1">
        {Array.from({ length: capacity }, (_, index) => index + 1).map(
          (size) => {
            const tooFew = size < group.occupiedSeats;
            const active = size === claimed && group.holdActive;

            return (
              <button
                key={size}
                type="button"
                disabled={tooFew || update.isPending}
                onClick={() => update.mutate({ declaredSize: size })}
                aria-pressed={active}
                className={cn(
                  'h-8 min-w-14 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                  active
                    ? 'bg-primary/15 text-foreground ring-1 ring-primary/40'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {size}
              </button>
            );
          },
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {/*
          Says what the hold *does*, not only that it exists. "Giữ 2 chỗ" alone
          leaves a leader wondering how a friend is supposed to get in; the rule
          is the half that makes the link below make sense.
        */}
        {group.holdActive && group.heldSeats > 0
          ? `Giữ ${group.heldSeats} chỗ trong ${hoursLeft(group.holdUntil!)} giờ — chỉ người có link mới vào được.`
          : group.isFull
            ? 'Nhóm đã đủ người.'
            : 'Không giữ chỗ — ai cũng có thể vào nhóm.'}
      </p>

      {update.error && (
        <p className="text-xs text-destructive">{update.error.message}</p>
      )}
    </div>
  );
}
