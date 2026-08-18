'use client';

import { CalendarClock } from 'lucide-react';
import { useActiveSemester, useMyRounds } from '@/lib/api/master-data';
import type { RegistrationRound } from '@/lib/api/types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from now until `iso`, rounded up; negative once it has passed. */
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS);
}

/**
 * Keyed on the phase, not on the dates.
 *
 * The dates are what moves the phase, but they are not the same thing: the office
 * can open the gate early or hold it shut, and RECONCILING carries on after
 * `registrationEnd` has passed and says something the calendar cannot — that the
 * faculty is placing the students who ended up without a group. Only inside the
 * two open phases is the remaining time worth counting, because those are the
 * only ones where anybody can still act on it.
 */
function registrationLine(round: RegistrationRound): string {
  switch (round.phase) {
    case 'PREP': {
      const opensIn = daysUntil(round.registrationStart);
      return opensIn > 0 ? `Mở đăng ký sau ${opensIn} ngày` : 'Chưa mở đăng ký';
    }
    case 'OPEN':
    case 'EXTENDED': {
      const closesIn = daysUntil(round.registrationEnd);
      const label = round.phase === 'EXTENDED' ? 'gia hạn' : 'đăng ký';
      if (closesIn <= 0) return `Hôm nay là hạn ${label}`;
      return `Còn ${closesIn} ngày ${label}`;
    }
    case 'RECONCILING':
      return 'Đã đóng đăng ký · khoa đang phân bổ';
    case 'FINALIZED':
      return 'Đã chốt phân bổ';
  }
}

/**
 * The registration window governs almost everything a user can do — students
 * cannot register outside it, lecturers cannot open topics, grades lock after
 * it. It belongs somewhere permanently visible but quiet, which is what the
 * foot of the sidebar is for.
 *
 * A semester runs several rounds and they do not share a deadline, so this shows
 * one: the API returns them in the order that makes `[0]` the right one — the
 * reader's own round, or the one closing soonest. Where there is more than one,
 * the kind of project is named, because a countdown with no subject is worse
 * than none.
 */
export function SemesterContext() {
  const { state, isMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;

  const active = useActiveSemester();
  const { data: rounds } = useMyRounds(active?.id);
  const round = rounds?.[0];

  // Nothing to say yet, and a skeleton here would be a loading state for
  // something nobody asked to see.
  if (!active || !round) return null;

  const line = registrationLine(round);
  const subject =
    rounds && rounds.length > 1 ? `${round.projectType.name} · ` : '';

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <div className="flex h-8 items-center justify-center text-muted-foreground">
              <CalendarClock className="size-4" />
            </div>
          }
        />
        <TooltipContent side="right">
          {active.name} · {subject}
          {line}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="rounded-lg bg-sidebar-accent/70 px-2.5 py-2">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{active.name}</span>
      </p>
      <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
        {subject}
        {line}
      </p>
    </div>
  );
}
