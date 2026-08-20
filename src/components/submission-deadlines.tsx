'use client';

import type { Submission, SubmissionRequirement } from '@/lib/api/types';
import { daysUntilDay } from '@/lib/named-day';
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
 * they came to ask is whether they are late. So the list sits above the history
 * rather than inside it.
 *
 * The rows are whatever the faculty declared for this round, in the order they
 * declared them. Nothing at all appears when they have declared nothing: a row
 * saying "chưa có mục nào" is a line read once and ignored thereafter.
 */
export function SubmissionDeadlines({
  requirements,
  submissions,
}: {
  requirements: SubmissionRequirement[];
  submissions: Submission[];
}) {
  if (requirements.length === 0) return null;

  return (
    <ul className="divide-y rounded-xl border">
      {requirements.map((requirement) => {
        const handedIn = submissions.some(
          (submission) => submission.requirement.id === requirement.id,
        );
        const left = daysUntilDay(requirement.dueAt);

        return (
          <li
            key={requirement.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {requirement.name}
                {!requirement.isRequired && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    tuỳ chọn
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Hạn {dateFormat.format(new Date(requirement.dueAt))}
                {left > 0 && ` · còn ${left} ngày`}
                {left === 0 && ' · hôm nay'}
              </p>
            </div>
            <StatusPill {...standing(handedIn, left)} />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Where the group stands on one document.
 *
 * "Quá hạn" is kept for work that is both late and still missing. A group that
 * handed in after the date has already been marked on the submission itself, and
 * saying it again up here would be the screen scolding somebody who has done the
 * thing it is asking for.
 */
function standing(handedIn: boolean, daysLeft: number): StatusLabel {
  if (handedIn) return { label: 'Đã nộp', tone: 'success' };
  if (daysLeft < 0) return { label: 'Quá hạn', tone: 'danger' };

  return { label: 'Chưa nộp', tone: 'waiting' };
}
