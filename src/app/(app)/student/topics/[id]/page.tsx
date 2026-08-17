'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTopic } from '@/lib/api/topics';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { TopicDetailView } from '@/components/topic-detail-view';
import { TopicRegisterButton } from '@/components/topic-register-button';
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
            <TopicRegisterButton topic={topic} />

            {/*
              Three different silences, and each calls for different words. The
              window not being open is about the calendar; a topic already taken
              is about somebody else being quicker; a full one is neither. Only
              the first is worth spelling out with dates — the badge on the list
              already said the other two.
            */}
            {!topic.isRegistrationOpen ? (
              <p className="text-xs text-muted-foreground">
                Ngoài thời hạn đăng ký ({' '}
                {dateFormat.format(new Date(topic.semester.registrationStart))}
                {' – '}
                {dateFormat.format(new Date(topic.semester.registrationEnd))} ).
              </p>
            ) : (
              !topic.canRegister &&
              !topic.canJoin && (
                <p className="text-xs text-muted-foreground">
                  {topic.isFull
                    ? `Đề tài này đã đủ ${topic.occupiedSeats}/${topic.maxStudents} sinh viên.`
                    : topic.activeGroup
                      ? 'Đề tài này đã có nhóm nhận.'
                      : topic.eligibleForMe === false
                        ? `${topic.projectType.name} không mở cho khóa của bạn trong học kỳ này.`
                        : 'Đề tài này chưa mở đăng ký.'}
                </p>
              )
            )}
          </div>
        }
      />
    </div>
  );
}
