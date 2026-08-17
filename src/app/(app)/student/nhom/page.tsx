'use client';

import Link from 'next/link';
import { Loader2, Users } from 'lucide-react';
import { useMyGroup } from '@/lib/api/registration';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { EmptyState } from '@/components/empty-state';
import { MyGroupPanel } from '@/components/my-group-panel';
import { Button } from '@/components/ui/button';

export default function StudentGroupPage() {
  const allowed = useRequireRole('STUDENT');
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
  if (!group) {
    return (
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
    );
  }

  return (
    <div className="max-w-2xl">
      <MyGroupPanel group={group} />
    </div>
  );
}
