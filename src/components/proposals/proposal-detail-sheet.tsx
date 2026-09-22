'use client';

import { CalendarDays, Layers, Users, User } from 'lucide-react';
import type { TopicProposal } from '@/lib/api/types';
import { ProposalStatusBadge } from '@/components/proposals/proposal-card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function Meta({
  icon: Icon,
  children,
}: {
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
      {children}
    </span>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-sm whitespace-pre-line break-words text-muted-foreground">
        {body}
      </p>
    </section>
  );
}

interface ProposalDetailSheetProps {
  proposal: TopicProposal | null;
  onClose: () => void;
  counterparty?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ProposalDetailSheet({
  proposal,
  onClose,
  counterparty,
  actions,
  footer,
}: ProposalDetailSheetProps) {
  const isOpen = proposal !== null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        {proposal && (
          <>
            <SheetHeader className="border-b pb-4">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5 pr-8">
                <SheetTitle className="font-heading text-base leading-snug">
                  {proposal.title}
                </SheetTitle>
                <ProposalStatusBadge
                  status={proposal.status}
                  className="mt-0.5"
                />
              </div>
              <SheetDescription className="sr-only">
                Xem chi tiết đề xuất
              </SheetDescription>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-sm">
                {counterparty && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <User className="size-3.5 shrink-0 text-muted-foreground/70" />
                    {counterparty}
                  </span>
                )}
                <Meta icon={Layers}>{proposal.projectType.name}</Meta>
                <Meta icon={CalendarDays}>
                  Gửi {dateFormat.format(new Date(proposal.createdAt))}
                </Meta>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
              <Section title="Mô tả" body={proposal.description} />
              <Section
                title="Yêu cầu đầu ra"
                body={proposal.expectedOutcomes}
              />
              {footer}
            </div>

            <SheetFooter className="flex-row justify-end gap-2 border-t pt-4">
              <Button variant="ghost" onClick={onClose}>
                Đóng
              </Button>
              {actions}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
