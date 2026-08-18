'use client';

import Link from 'next/link';
import { Loader2, Users } from 'lucide-react';
import { useActiveSemester, useMyRound } from '@/lib/api/master-data';
import { useMyGroup } from '@/lib/api/registration';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/empty-state';
import { GroupTopicBrief } from '@/components/group-topic-brief';
import { MyGroupPanel } from '@/components/my-group-panel';
import { RoundTimeline } from '@/components/round-timeline';
import { Button } from '@/components/ui/button';

/**
 * Two columns: what the student has, and when it is due.
 *
 * A single narrow stack left the right-hand half of a desktop screen empty while
 * the page still refused to answer two of the three questions a student arrives
 * with. Widening it alone would only have made the emptiness wider — so the
 * space is paid for with the things that were missing: the round as a sequence
 * of dates in the rail, and the topic's own description underneath the group.
 *
 * The rail comes first in the markup so that a phone, which has one column, gets
 * the deadline before the roster; `lg:order-*` puts it back on the right where
 * there is room for both.
 */
export default function StudentGroupPage() {
  const allowed = useRequireRole('STUDENT');
  const semester = useActiveSemester();
  const round = useMyRound(semester?.id);
  const { data: group, isPending, error } = useMyGroup();

  if (!allowed) return null;

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">Không tải được nhóm của bạn.</p>
    );
  }

  // Not a failure and not empty furniture either: having no group yet is the
  // normal state at the start of a semester, and the one thing to do about it is
  // on the other screen.
  //
  // The timeline still belongs here, and here it matters most: this is the
  // reader who has something to lose by it, and "khoa sẽ xếp bạn vào một đề tài
  // còn chỗ" is what they are agreeing to by doing nothing.
  if (!group) {
    return (
      <Shell rail={round && <RoundTimeline round={round} hasGroup={false} />}>
        <div className="rounded-xl border">
          <EmptyState
            icon={Users}
            title="Bạn chưa đăng ký đề tài nào."
            action={
              <Button render={<Link href="/student" />}>
                Xem danh sách đề tài
              </Button>
            }
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell rail={round && <RoundTimeline round={round} hasGroup />}>
      {/*
        Editable only while the gate is genuinely open. An extension does not
        count: it reopens registration for students who ended up without a group,
        and leaves every group already formed exactly as it is.
      */}
      <MyGroupPanel group={group} canEdit={round?.phase === 'OPEN'} />
      <GroupTopicBrief topicId={group.topicId} />
    </Shell>
  );
}

function Shell({
  rail,
  children,
}: {
  rail: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto grid max-w-6xl items-start gap-4',
        // No round to report, no second column: an empty rail would be the
        // whitespace this layout exists to spend.
        rail && 'lg:grid-cols-[minmax(0,1fr)_20rem]',
      )}
    >
      {rail && <div className="lg:order-2">{rail}</div>}
      <div className="space-y-4 lg:order-1">{children}</div>
    </div>
  );
}
