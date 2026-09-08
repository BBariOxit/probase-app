'use client';

import { useState } from 'react';
import { CalendarDays, Layers } from 'lucide-react';
import type { ProposalStatus, TopicProposal } from '@/lib/api/types';
import { StatusPill, type StatusLabel } from '@/components/status-pill';

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

export function ProposalCard({
  proposal,
  counterparty,
  actions,
  footer,
}: {
  proposal: TopicProposal;
  counterparty?: React.ReactNode;
  actions?: React.ReactNode;
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
