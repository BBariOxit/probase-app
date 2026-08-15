'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Semester } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from now until `iso`, rounded up; negative once it has passed. */
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS);
}

function registrationLine(semester: Semester): string {
  const opensIn = daysUntil(semester.registrationStart);
  const closesIn = daysUntil(semester.registrationEnd);

  if (opensIn > 0) return `Mở đăng ký sau ${opensIn} ngày`;
  if (closesIn < 0) return 'Đã đóng đăng ký';
  if (closesIn === 0) return 'Hôm nay là hạn đăng ký';
  return `Còn ${closesIn} ngày đăng ký`;
}

/**
 * The registration window governs almost everything a user can do — students
 * cannot register outside it, lecturers cannot open topics, grades lock after
 * it. It belongs somewhere permanently visible but quiet, which is what the
 * foot of the sidebar is for.
 */
export function SemesterContext({ collapsed }: { collapsed: boolean }) {
  const { data } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api<Semester[]>('/semesters'),
    // The active semester changes a few times a year. Refetching it on every
    // navigation would be noise.
    staleTime: 5 * 60_000,
  });

  const active = data?.find((semester) => semester.isActive);

  // Nothing to say yet, and a skeleton here would be a loading state for
  // something the user did not ask to see.
  if (!active) return null;

  const line = registrationLine(active);

  if (collapsed) {
    return (
      <Tooltip content={`${active.name} · ${line}`}>
        <div className="mx-auto flex size-9 items-center justify-center rounded-lg text-muted-foreground">
          <CalendarClock className="size-4" />
        </div>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-sidebar-accent/60 px-3 py-2.5 text-sidebar-accent-foreground',
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{active.name}</span>
      </p>
      <p className="mt-0.5 pl-5 text-xs text-muted-foreground">{line}</p>
    </div>
  );
}
