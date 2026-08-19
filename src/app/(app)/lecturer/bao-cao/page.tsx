'use client';

import { useState } from 'react';
import { BookOpen, Inbox, Loader2, MessageSquareText } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { useSubmissionFeedback, useSubmissions } from '@/lib/api/submissions';
import type { Submission, SubmissionType } from '@/lib/api/types';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { EmptyState } from '@/components/empty-state';
import { FormError } from '@/components/form-error';
import { PaginationBar } from '@/components/pagination-bar';
import { SUBMISSION_LABEL, SubmissionCard } from '@/components/submission-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PAGE_SIZE = 10;

const FILTERS: { value: SubmissionType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Mọi loại bài nộp' },
  { value: 'MIDTERM', label: SUBMISSION_LABEL.MIDTERM },
  { value: 'FINAL', label: SUBMISSION_LABEL.FINAL },
  { value: 'SOURCE_CODE', label: SUBMISSION_LABEL.SOURCE_CODE },
];

/**
 * Everything handed in on this lecturer's topics, newest first.
 *
 * No id travels in the request: which submissions come back is decided by the
 * token, so a supervisor cannot reach another's by editing anything on this
 * screen. The same applies to answering one — the API checks that the topic is
 * theirs and answers 404 rather than 403, so knowing an id never confirms it
 * exists.
 */
export default function LecturerSubmissionsPage() {
  const allowed = useRequireRole('LECTURER');
  const [page, setPage] = useState(1);
  const [type, setType] = useState<SubmissionType | 'ALL'>('ALL');
  const [answering, setAnswering] = useState<Submission | null>(null);

  const { data, isPending, error } = useSubmissions({
    submissionType: type === 'ALL' ? undefined : type,
    page,
    limit: PAGE_SIZE,
  });

  if (!allowed) return null;

  const submissions = data?.items ?? [];

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value as SubmissionType | 'ALL');
            // The page number belongs to the old filter; keeping it lands the
            // reader on an empty page of a shorter list.
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52" aria-label="Lọc theo loại bài nộp">
            <SelectValue>
              {(value) =>
                FILTERS.find((option) => option.value === value)?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {data.total} bài nộp
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">Không tải được bài nộp.</p>
      )}

      {isPending && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && submissions.length === 0 && (
        <div className="rounded-xl border">
          <EmptyState
            icon={Inbox}
            title={
              type === 'ALL'
                ? 'Chưa nhóm nào nộp bài cho đề tài của bạn.'
                : 'Chưa có bài nộp nào thuộc loại này.'
            }
          />
        </div>
      )}

      <ul className="space-y-3">
        {submissions.map((submission) => (
          <li key={submission.id}>
            <SubmissionCard
              submission={submission}
              who={
                /*
                  Which topic, on a screen that mixes several. The student who
                  pressed submit is already on the card; what a supervisor
                  reading twenty of these needs first is which piece of work it
                  belongs to.
                */
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {submission.group.topic.title}
                  </span>
                </p>
              }
              actions={
                <Button
                  size="sm"
                  variant={submission.feedbackAt ? 'outline' : 'default'}
                  onClick={() => setAnswering(submission)}
                >
                  <MessageSquareText />
                  {submission.feedbackAt ? 'Sửa nhận xét' : 'Nhận xét'}
                </Button>
              }
            />
          </li>
        ))}
      </ul>

      {data && (
        <PaginationBar
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}

      {answering && (
        <FeedbackDialog
          submission={answering}
          onClose={() => setAnswering(null)}
        />
      )}
    </div>
  );
}

/**
 * Writing back on one version.
 *
 * Against the version rather than against the group, so a group that re-submits
 * does not silently inherit what was said about the file they replaced — and the
 * dialog names the version for the same reason.
 */
function FeedbackDialog({
  submission,
  onClose,
}: {
  submission: Submission;
  onClose: () => void;
}) {
  const answer = useSubmissionFeedback();
  const [feedback, setFeedback] = useState(submission.lecturerFeedback ?? '');
  const [error, setError] = useState<string | null>(null);

  const trimmed = feedback.trim();

  async function submit() {
    setError(null);
    try {
      await answer.mutateAsync({ id: submission.id, feedback: trimmed });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => !next && !answer.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Nhận xét {SUBMISSION_LABEL[submission.submissionType].toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            {submission.group.topic.title} · lần {submission.version}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormError message={error} />

          <div className="space-y-2">
            <Label htmlFor="feedback">Nhận xét cho nhóm</Label>
            <p className="-mt-1 text-xs text-muted-foreground">
              Cả nhóm sẽ nhận thông báo và đọc được nguyên văn. Đây là nhận xét,
              không phải điểm.
            </p>
            <Textarea
              id="feedback"
              rows={5}
              maxLength={4000}
              autoFocus
              value={feedback}
              aria-invalid={trimmed === ''}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={answer.isPending}
            onClick={onClose}
          >
            Huỷ
          </Button>
          <Button
            disabled={trimmed === '' || answer.isPending}
            onClick={submit}
          >
            {answer.isPending && <Loader2 className="animate-spin" />}
            Gửi nhận xét
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
