'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTopic } from '@/lib/api/topics';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { TopicDetailView } from '@/components/topic-detail-view';
import { Button } from '@/components/ui/button';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export default function StudentTopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const allowed = useRequireRole('STUDENT');
  const { data: topic, isPending, error } = useTopic(Number(id));

  if (!allowed) return null;

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !topic) {
    return <p className="text-sm text-destructive">Không tìm thấy đề tài.</p>;
  }

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        render={<Link href="/student" />}
      >
        <ArrowLeft />
        Danh sách đề tài
      </Button>

      <TopicDetailView
        topic={topic}
        actions={
          <div className="space-y-2">
            {/* Registration is disabled because the module behind it does not
                exist yet. An enabled button that does nothing would be worse
                than one that plainly cannot be pressed. */}
            <Button disabled>Đăng ký đề tài</Button>
            {!topic.isRegistrationOpen && (
              <p className="text-xs text-muted-foreground">
                Ngoài thời hạn đăng ký ({' '}
                {dateFormat.format(new Date(topic.semester.registrationStart))}
                {' – '}
                {dateFormat.format(new Date(topic.semester.registrationEnd))} ).
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
