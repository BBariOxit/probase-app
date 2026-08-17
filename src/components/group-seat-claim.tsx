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
 * counts below the group's own size are disabled instead of hidden: the reason
 * they are unavailable is that people are already sitting there, and a number
 * that quietly disappears looks like a bug rather than an explanation.
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
        <span className="text-sm font-medium">Nhóm đi mấy người?</span>
        {update.isPending && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex gap-1.5">
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
                  'h-9 flex-1 rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-muted',
                )}
              >
                {size}
              </button>
            );
          },
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {group.holdActive && group.heldSeats > 0
          ? `Đang giữ ${group.heldSeats} chỗ cho bạn của bạn · còn ${hoursLeft(group.holdUntil!)} giờ`
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
