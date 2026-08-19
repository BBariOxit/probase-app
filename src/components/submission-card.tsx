'use client';

import { ExternalLink, FileText, Link2, MessageSquareText } from 'lucide-react';
import type { Submission, SubmissionType } from '@/lib/api/types';
import { StatusPill, type StatusLabel } from '@/components/status-pill';

/**
 * The three kinds, and what each is called on screen.
 *
 * Source code is described as a link rather than a file everywhere it appears,
 * because that is what it nearly always is — asking a student to zip a git
 * history in order to upload it is asking them for something worse than what
 * they already have.
 */
export const SUBMISSION_LABEL: Record<SubmissionType, string> = {
  MIDTERM: 'Báo cáo giữa kỳ',
  FINAL: 'Báo cáo cuối kỳ',
  SOURCE_CODE: 'Mã nguồn',
};

const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Bytes as a person would say them. */
function fileSize(bytes: number | null): string | null {
  if (bytes === null) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Whether anybody has looked at this version yet. */
export function answered(submission: Submission): StatusLabel {
  return submission.feedbackAt
    ? { label: 'Đã nhận xét', tone: 'success' }
    : { label: 'Chờ nhận xét', tone: 'waiting' };
}

/**
 * One version of one thing handed in.
 *
 * The version number is on the card rather than implied by position, because
 * nothing here is ever overwritten: a group that re-submits leaves the previous
 * version standing with whatever was said about it, and a reader needs to know
 * which one they are looking at.
 */
export function SubmissionCard({
  submission,
  who,
  actions,
}: {
  submission: Submission;
  /** Who handed it in, when that is not obvious — a supervisor reading many groups. */
  who?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const size = fileSize(submission.fileSize);

  return (
    <article className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">
            {SUBMISSION_LABEL[submission.submissionType]}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              lần {submission.version}
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {dateTimeFormat.format(new Date(submission.submittedAt))}
            {submission.submittedBy &&
              ` · ${submission.submittedBy.fullName} (${submission.submittedBy.studentCode})`}
          </p>
        </div>
        <StatusPill {...answered(submission)} />
      </div>

      {who}

      <div className="flex flex-wrap gap-2">
        {submission.fileUrl && (
          <a
            href={submission.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate">
              {submission.fileName ?? 'Tệp đã nộp'}
            </span>
            {size && (
              <span className="shrink-0 text-muted-foreground">{size}</span>
            )}
          </a>
        )}

        {submission.submissionUrl && (
          /*
            `noreferrer` alongside `noopener`: this is a URL a student typed, and
            the page it opens has no business being told which screen sent them.
          */
          <a
            href={submission.submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Link2 className="size-3.5 shrink-0" />
            <span className="truncate">{submission.submissionUrl}</span>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
          </a>
        )}
      </div>

      {submission.lecturerFeedback && (
        <section className="space-y-1 rounded-lg border bg-muted/40 px-3 py-2.5">
          <h4 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquareText className="size-3.5" />
            Nhận xét của giảng viên
          </h4>
          <p className="text-sm whitespace-pre-line">
            {submission.lecturerFeedback}
          </p>
        </section>
      )}

      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </article>
  );
}
