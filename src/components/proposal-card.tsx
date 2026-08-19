'use client';

import { useState } from 'react';
import { CalendarDays, Layers } from 'lucide-react';
import type { ProposalStatus, TopicProposal } from '@/lib/api/types';
import { StatusPill, type StatusLabel } from '@/components/status-pill';

/**
 * Three states, worded from the student's side because they are the ones who
 * wait on them.
 *
 * REJECTED is "chưa được nhận" rather than "bị từ chối", and takes the danger
 * tone anyway: the softer wording is the API's own, and it is the honest one —
 * a lecturer declining an idea has not judged the student — but the colour still
 * has to be the one that stops a reader, because there is a reason to read
 * underneath and a next step to take.
 */
const PROPOSAL_STATUS: Record<ProposalStatus, StatusLabel> = {
  PENDING: { label: 'Chờ trả lời', tone: 'waiting' },
  ACCEPTED: { label: 'Đã được nhận', tone: 'success' },
  REJECTED: { label: 'Chưa được nhận', tone: 'danger' },
};

export function ProposalStatusBadge({
  status,
  className,
}: {
  status: ProposalStatus;
  className?: string;
}) {
  return <StatusPill {...PROPOSAL_STATUS[status]} className={className} />;
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * A proposal as either side reads it.
 *
 * The two screens differ in who the other party is and in what may be done about
 * it, so both arrive as slots rather than as a role flag — one card that renders
 * two different jobs from a boolean is a card nobody can change safely later.
 * What is shared is everything about the idea itself, and that is the part worth
 * having in one place: the same words in the same order, so a lecturer and a
 * student discussing a proposal are looking at the same object.
 */
export function ProposalCard({
  proposal,
  counterparty,
  actions,
  footer,
}: {
  proposal: TopicProposal;
  /** Who the other side is — the addressee, or the person who wrote it. */
  counterparty?: React.ReactNode;
  actions?: React.ReactNode;
  /** Whatever the answer left behind: a reason, or the topic it became. */
  footer?: React.ReactNode;
}) {
  return (
    <article className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium">{proposal.title}</h2>
        <ProposalStatusBadge status={proposal.status} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {counterparty}
        <span className="inline-flex items-center gap-1.5">
          <Layers className="size-3.5 shrink-0" />
          {proposal.projectType.name}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          Gửi {dateFormat.format(new Date(proposal.createdAt))}
        </span>
      </div>

      <Prose label="Mô tả" body={proposal.description} clamp />
      <Prose label="Yêu cầu đầu ra" body={proposal.expectedOutcomes} />

      {footer}

      {actions && (
        <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>
      )}
    </article>
  );
}

/**
 * A block of what somebody typed, newlines and all.
 *
 * The description is clamped and the outcomes are not, which looks arbitrary and
 * is not: a description runs to paragraphs and is what makes a list of ten
 * proposals unreadable, while expected outcomes are three lines by nature. A
 * toggle on both would be two controls where one is needed.
 */
function Prose({
  label,
  body,
  clamp = false,
}: {
  label: string;
  body: string;
  clamp?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  // Cheap and slightly generous — it only decides whether to offer the toggle,
  // and offering it on something that turns out to fit costs nothing.
  const long = clamp && (body.length > 260 || body.includes('\n'));

  return (
    <section className="space-y-1">
      <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
      <p
        className={
          long && !expanded
            ? 'line-clamp-3 text-sm whitespace-pre-line'
            : 'text-sm whitespace-pre-line'
        }
      >
        {body}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="rounded-sm text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </section>
  );
}
