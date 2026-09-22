'use client';

import { Check, GraduationCap, Layers, Loader2, Users } from 'lucide-react';
import { useTopic, useTopicTransition } from '@/lib/api/topics';
import { TopicStatusBadge } from '@/components/topics/topic-status-badge';
import { TextSection } from '@/components/shared/text-section';
import { Button } from '@/components/ui/button';
import { DetailSheet } from '@/components/shared/detail-sheet';
import { toast } from 'sonner';

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

interface TopicReviewSheetProps {
  topicId: number | null;
  onClose: () => void;
}

export function TopicReviewSheet({ topicId, onClose }: TopicReviewSheetProps) {
  const { data: topic, isPending } = useTopic(topicId ?? 0);
  const transition = useTopicTransition();

  const isOpen = topicId !== null;

  const isTransitioning = transition.isPending;

  async function handleTransition(to: 'APPROVE' | 'REJECT') {
    if (!topic) return;
    await transition.mutateAsync({
      id: topic.id,
      to: to.toLowerCase() as 'approve' | 'reject',
    });
    toast.success(to === 'APPROVE' ? 'Đã duyệt đề tài.' : 'Đã từ chối đề tài.');
    onClose();
  }

  const meta = topic ? (
    <>
      <Meta icon={GraduationCap}>
        {topic.lecturer.academicTitle
          ? `${topic.lecturer.academicTitle} ${topic.lecturer.fullName}`
          : topic.lecturer.fullName}
      </Meta>
      <Meta icon={Layers}>{topic.projectType.name}</Meta>
      <Meta icon={Users}>{topic.maxStudents} sinh viên</Meta>
    </>
  ) : null;

  const footerActions = topic ? (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isTransitioning}>
        Huỷ
      </Button>

      {topic.status === 'PENDING' && (
        <>
          <Button
            variant="destructive"
            onClick={() => handleTransition('REJECT')}
            disabled={isTransitioning}
          >
            Từ chối
          </Button>
          <Button
            onClick={() => handleTransition('APPROVE')}
            disabled={isTransitioning}
          >
            Duyệt đề tài
          </Button>
        </>
      )}

      {topic.status === 'APPROVED' && (
        <Button
          variant="outline"
          onClick={() => handleTransition('REJECT')}
          disabled={isTransitioning}
        >
          Thu hồi quyết định
        </Button>
      )}
    </>
  ) : null;

  return (
    <DetailSheet
      open={!!topicId}
      onOpenChange={(open) => !open && onClose()}
      loading={isPending}
      title={topic?.title}
      badge={
        topic ? (
          <TopicStatusBadge
            status={topic.status}
            className="mt-0.5"
            isTransitioning={isTransitioning}
          />
        ) : null
      }
      meta={meta}
      footer={footerActions}
      descriptionAria="Duyệt nội dung đề tài"
    >
      {topic && (
        <>
          <TextSection title="Mô tả" body={topic.description} />
          <TextSection title="Yêu cầu đầu ra" body={topic.expectedOutcomes} />

          {topic.status === 'REJECTED' && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <span className="font-medium">Lý do từ chối:</span> Đề tài chưa
              đáp ứng đủ yêu cầu của hội đồng. Vui lòng bổ sung thêm nội dung.
            </div>
          )}
        </>
      )}
    </DetailSheet>
  );
}
