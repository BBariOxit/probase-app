'use client';

import { Loader2, UserRound, UserRoundPlus } from 'lucide-react';
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

type SeatState = 'taken' | 'held' | 'free';

const SEAT_STYLE: Record<SeatState, string> = {
  taken: 'border-transparent bg-muted text-foreground',
  held: 'border-primary/40 bg-primary/10 text-primary',
  free: 'border-dashed border-border text-muted-foreground/60',
};

const SEAT_LABEL: Record<SeatState, string> = {
  taken: 'đã có người',
  held: 'đang giữ, chỉ người có link vào được',
  free: 'còn trống, ai cũng vào được',
};

/**
 * The topic's seats, and which of them this group is holding.
 *
 * Drawn as the seats themselves rather than as a count of them, because seats
 * are what the data is: the API answers in occupied, held and open-to-anyone,
 * and a number makes the reader convert that back. It also removes a control
 * that did nothing — in a count, choosing "1" holds no seat and is identical to
 * never touching it, while here the first seat is simply not a control at all.
 * It is the leader, sitting down.
 *
 * The hold is a count under the covers — `declaredSize` reserves the first N
 * seats and cannot skip one — so the row fills from the left: pressing a seat
 * holds up to it, pressing the last held seat gives it back. That is how every
 * seat picker behaves anyway; what it must not do is let somebody hold the third
 * seat while leaving the second open, because the model has no way to say it.
 *
 * Nothing here is required. Registration already holds every seat for the first
 * 24 hours, so a leader who ignores this keeps what they were given until the
 * window lapses on its own — and once it has, these are read-only. Setting a
 * number after that changes a column and nothing else.
 */
export function GroupSeatClaim({ group }: { group: RegistrationGroup }) {
  const update = useUpdateGroup(group.id);
  const capacity = group.topic.maxStudents;
  const occupied = group.occupiedSeats;
  const claimed = group.holdActive
    ? (group.declaredSize ?? occupied)
    : occupied;
  const editable = group.holdActive && !group.isFull;

  if (capacity < 2) return null;

  function stateOf(seat: number): SeatState {
    if (seat <= occupied) return 'taken';
    return seat <= claimed ? 'held' : 'free';
  }

  /** Pressing a seat holds up to it; pressing the last held one gives it back. */
  function toggle(seat: number) {
    const releasing = seat === claimed;
    const next = releasing ? seat - 1 : seat;

    update.mutate({ declaredSize: next <= occupied ? null : next });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Chỗ trong nhóm</span>
        {update.isPending && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex gap-2">
        {Array.from({ length: capacity }, (_, index) => index + 1).map(
          (seat) => {
            const state = stateOf(seat);
            const Icon = state === 'free' ? UserRoundPlus : UserRound;
            // The leader's own seat, and everybody else's, are facts rather
            // than choices — there is nothing to press on a seat somebody is
            // already sitting in.
            const pressable = editable && state !== 'taken';

            return (
              <button
                key={seat}
                type="button"
                disabled={!pressable || update.isPending}
                onClick={() => toggle(seat)}
                aria-pressed={state === 'held'}
                aria-label={`Chỗ ${seat}: ${SEAT_LABEL[state]}`}
                className={cn(
                  'flex size-11 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  SEAT_STYLE[state],
                  pressable
                    ? 'cursor-pointer hover:border-primary/60'
                    : 'cursor-default',
                  update.isPending && 'opacity-60',
                )}
              >
                <Icon className="size-5" />
              </button>
            );
          },
        )}
      </div>

      <p className="text-xs text-muted-foreground">{hint(group)}</p>

      {update.error && (
        <p className="text-xs text-destructive">{update.error.message}</p>
      )}
    </div>
  );
}

/**
 * The rule behind the seats, which the seats themselves cannot show.
 *
 * How many are held is now visible; what being held *means* is not, and that is
 * the half a leader needs in order to understand why they were handed a link.
 */
function hint(group: RegistrationGroup): string {
  if (group.isFull) return 'Nhóm đã đủ người.';

  if (!group.holdActive) {
    return 'Đã hết hạn giữ chỗ — những chỗ còn trống giờ mở cho tất cả.';
  }

  const hours = hoursLeft(group.holdUntil!);

  if (group.heldSeats > 0) {
    return `Chỗ đang giữ chỉ mở cho người có link, trong ${hours} giờ nữa.`;
  }

  return `Chưa giữ chỗ nào — ai cũng vào được. Bấm vào một chỗ để giữ trong ${hours} giờ tới.`;
}
