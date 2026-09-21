'use client';

import { GraduationCap, Layers, Loader2, Users } from 'lucide-react';
import { useTopic } from '@/lib/api/topics';
import { TopicStatusBadge } from '@/components/topics/topic-status-badge';
import { TopicRegisterButton } from '@/components/topics/topic-register-button';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-sm whitespace-pre-line text-muted-foreground">
        {body}
      </p>
    </section>
  );
}

interface TopicDetailSheetProps {
  topicId: number | null;
  onClose: () => void;
}

export function TopicDetailSheet({ topicId, onClose }: TopicDetailSheetProps) {
  const { data: topic, isPending } = useTopic(topicId ?? 0);

  const isOpen = topicId !== null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        {isPending || !topic ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader className="border-b pb-4">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5 pr-8">
                <SheetTitle className="font-heading text-base leading-snug">
                  {topic.title}
                </SheetTitle>
                <TopicStatusBadge status={topic.status} className="mt-0.5" />
              </div>
              <SheetDescription className="sr-only">
                Xem nội dung đề tài
              </SheetDescription>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                <Meta icon={GraduationCap}>
                  {topic.lecturer.academicTitle
                    ? `${topic.lecturer.academicTitle} ${topic.lecturer.fullName}`
                    : topic.lecturer.fullName}
                </Meta>
                <Meta icon={Layers}>{topic.projectType.name}</Meta>
                <Meta icon={Users}>{topic.maxStudents} sinh viên</Meta>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <Section title="Mô tả" body={topic.description} />
              <Section title="Yêu cầu đầu ra" body={topic.expectedOutcomes} />
            </div>

            <SheetFooter className="border-t pt-4 flex-row justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Đóng
              </Button>
              <TopicRegisterButton topic={topic} idle={null} />
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
