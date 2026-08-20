'use client';

import type { RegistrationGroup, Submission } from '@/lib/api/types';
import { daysUntilDay } from '@/lib/named-day';
import { SUBMISSION_LABEL } from '@/components/submission-card';
import { StatusPill, type StatusLabel } from '@/components/status-pill';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
});

/**
 * What the group owes, and by when.
 *
 * The page underneath it is a history of what has already been handed in, which
 * answers the wrong question for a group that has handed in nothing — the one
 * they came to ask is whether they are late. So the deadlines sit above the
 * history rather than inside it.
 *
 * Only the deadlines the faculty has actually announced appear, and nothing at
 * all appears when they have announced none: an empty row saying "chưa có hạn"
 * is a line of text that will be read once and then permanently ignored.
 *
 * Source code has no row of its own. It shares the final report's date, and two
 * rows counting down to the same day would read as two deadlines.
 */
export function SubmissionDeadlines({
  deadlines,
  submissions,
}: {
  deadlines: RegistrationGroup['deadlines'];
  submissions: Submission[];
}) {
  const rows = (
    [
      { kind: 'MIDTERM', due: deadlines.midtermDueAt },
      { kind: 'FINAL', due: deadlines.finalDueAt },
    ] as const
  ).flatMap(({ kind, due }) => {
    if (!due) return [];

    const handedIn = submissions.some(
      (submission) => submission.submissionType === kind,
    );

    return [{ kind, due, handedIn, left: daysUntilDay(due) }];
  });

  if (rows.length === 0) return null;

  return (
    <ul className="divide-y rounded-xl border">
      {rows.map((row) => (
        <li
          key={row.kind}
          className="flex items-center justify-between gap-3 px-4 py-2.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {SUBMISSION_LABEL[row.kind]}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Hạn {dateFormat.format(new Date(row.due))}
              {row.left > 0 && ` · còn ${row.left} ngày`}
              {row.left === 0 && ' · hôm nay'}
            </p>
          </div>
          <StatusPill {...standing(row.handedIn, row.left)} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Where the group stands on one report.
 *
 * "Quá hạn" is kept for work that is both late and still missing. A group that
 * handed in after the date has already been marked on the submission itself, and
 * telling them again up here would be the screen scolding somebody who has done
 * the thing it is asking for.
 */
function standing(handedIn: boolean, daysLeft: number): StatusLabel {
  if (handedIn) return { label: 'Đã nộp', tone: 'success' };
  if (daysLeft < 0) return { label: 'Quá hạn', tone: 'danger' };

  return { label: 'Chưa nộp', tone: 'waiting' };
}
