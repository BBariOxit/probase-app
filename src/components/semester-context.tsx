'use client';

import { CalendarClock } from 'lucide-react';
import { useActiveSemester, useMyRounds } from '@/lib/api/master-data';
import { describeRound } from '@/lib/round-status';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

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
 *
 * The wording is `describeRound`'s, so this line and the one at the top of the
 * group screen cannot disagree about the same round.
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

  // Only the headline: the foot of the sidebar is where this is kept in view,
  // not where it is explained. The screen that has room for the rest says it
  // there, in the same words.
  const line = describeRound(round, false).headline;
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
