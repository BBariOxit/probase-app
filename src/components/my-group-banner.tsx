'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { RegistrationGroup } from '@/lib/api/types';
import { SeatDots } from '@/components/seat-indicator';

/**
 * One line above the topic list once a student has a group.
 *
 * Deliberately not the whole panel. The group has its own screen, and repeating
 * it here would push the list — the reason this page exists — down the page while
 * saying the same thing twice. What belongs here is the fact of having a group,
 * the seat count, and the way through: enough that nobody keeps browsing without
 * realising they already have a topic.
 */
export function MyGroupBanner({ group }: { group: RegistrationGroup }) {
  return (
    <Link
      href="/student/nhom"
      className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Đề tài của bạn</p>
        <p className="truncate text-sm font-medium">{group.topic.title}</p>
      </div>

      <SeatDots
        occupied={group.occupiedSeats}
        capacity={group.topic.maxStudents}
        held={group.heldSeats}
        className="shrink-0"
      />
      <span className="shrink-0 text-sm text-muted-foreground">
        {group.occupiedSeats}/{group.topic.maxStudents}
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
