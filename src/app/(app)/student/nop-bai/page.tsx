'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileUp, Loader2, Upload, Users } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { useMyGroup } from '@/lib/api/registration';
import { useCreateSubmission, useSubmissions } from '@/lib/api/submissions';
import type { SubmissionType } from '@/lib/api/types';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { EmptyState } from '@/components/empty-state';
import { FormError } from '@/components/form-error';
import { PageWithRail } from '@/components/page-with-rail';
import { SUBMISSION_LABEL, SubmissionCard } from '@/components/submission-card';
import { SubmissionDeadlines } from '@/components/submission-deadlines';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TYPES: SubmissionType[] = ['MIDTERM', 'FINAL', 'SOURCE_CODE'];

/**
 * What the group has handed in, and the way to hand in more.
 *
 * The history is the screen rather than a footnote to it: nothing is ever
 * overwritten here, so a group that re-submits leaves the previous version
 * standing with whatever their supervisor said about it. Reading down the page
 * is reading what happened.
 */
export default function StudentSubmissionsPage() {
  const allowed = useRequireRole('STUDENT');
  const { data: group, isPending: groupPending } = useMyGroup();
  const { data, isPending, error } = useSubmissions({ limit: 50 });
  const [submitting, setSubmitting] = useState(false);

  if (!allowed) return null;

  if (groupPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Nothing to hand in against. Not a failure — a student without a topic yet
  // simply has no work to submit, and the way out is the other screen.
  if (!group) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border">
        <EmptyState
          icon={Users}
          title="Bạn chưa có đề tài nào, nên chưa nộp bài được."
          action={
            <Button render={<Link href="/student" />}>
              Xem danh sách đề tài
            </Button>
          }
        />
      </div>
    );
  }

  const submissions = data?.items ?? [];

  return (
    /*
      The history is the reading column and the rail is the context it is read
      against. Which topic and what is due are the two things a group checks
      before deciding whether to hand something in, and they were competing with
      the history for the top of the page — while half the screen sat empty
      beside it.
    */
    <PageWithRail
      rail={
        <>
          <section className="rounded-xl border bg-card p-4">
            <p className="text-sm font-medium">{group.topic.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {group.topic.lecturer.academicTitle
                ? `${group.topic.lecturer.academicTitle} ${group.topic.lecturer.fullName}`
                : group.topic.lecturer.fullName}
            </p>
          </section>

          <SubmissionDeadlines
            deadlines={group.deadlines}
            submissions={submissions}
          />
        </>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold tracking-tight">
          Đã nộp
        </h2>
        <Button onClick={() => setSubmitting(true)}>
          <Upload />
          Nộp bài
        </Button>
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
            icon={FileUp}
            title="Nhóm bạn chưa nộp gì cả."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmitting(true)}
              >
                <Upload />
                Nộp bài đầu tiên
              </Button>
            }
          />
        </div>
      )}

      <ul className="space-y-3">
        {submissions.map((submission) => (
          <li key={submission.id}>
            <SubmissionCard submission={submission} />
          </li>
        ))}
      </ul>

      {submitting && <SubmitDialog onClose={() => setSubmitting(false)} />}
    </PageWithRail>
  );
}

/**
 * Handing something in.
 *
 * A file or a link, and the form says at least one is needed rather than
 * silently disabling the button — a student who filled in neither should be told
 * which of the two they still owe. Source code defaults the wording towards a
 * link because that is what it nearly always is.
 */
function SubmitDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateSubmission();
  const [type, setType] = useState<SubmissionType>('MIDTERM');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const trimmedUrl = url.trim();
  const validUrl = trimmedUrl === '' || /^https?:\/\//i.test(trimmedUrl);
  const ready = (file !== null || trimmedUrl !== '') && validUrl;

  async function submit() {
    setError(null);
    try {
      await create.mutateAsync({
        submissionType: type,
        submissionUrl: trimmedUrl || undefined,
        file,
      });
      onClose();
    } catch (err) {
      // The refusal worth reading comes from the API: a file whose bytes are not
      // a PDF, Word or zip, or a deployment where file storage is not configured
      // at all. Both are sentences a student can act on.
      setError(
        err instanceof ApiError ? err.message : 'Không tải được bài nộp lên',
      );
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => !next && !create.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nộp bài</DialogTitle>
          <DialogDescription>
            Mỗi lần nộp là một phiên bản mới — bài cũ và nhận xét trên nó vẫn
            giữ nguyên.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormError message={error} />

          <div className="space-y-2">
            <Label htmlFor="sub-type">Loại bài nộp</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as SubmissionType)}
            >
              <SelectTrigger id="sub-type" className="w-full">
                <SelectValue>
                  {(value) => SUBMISSION_LABEL[value as SubmissionType]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((one) => (
                  <SelectItem key={one} value={one}>
                    {SUBMISSION_LABEL[one]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-file">Tệp</Label>
            <p className="-mt-1 text-xs text-muted-foreground">
              PDF, Word hoặc ZIP, tối đa 25MB.
            </p>
            <Input
              id="sub-file"
              type="file"
              accept=".pdf,.doc,.docx,.zip"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-url">
              {type === 'SOURCE_CODE' ? 'Link repository' : 'Hoặc link'}
            </Label>
            <p className="-mt-1 text-xs text-muted-foreground">
              {type === 'SOURCE_CODE'
                ? 'Link GitHub, GitLab… Nộp mã nguồn bằng link thì tiện hơn nén ra file.'
                : 'Link Google Drive, OneDrive… nếu bạn không tải file lên.'}
            </p>
            <Input
              id="sub-url"
              placeholder="https://github.com/..."
              value={url}
              aria-invalid={!validUrl}
              onChange={(event) => setUrl(event.target.value)}
            />
            {!validUrl && (
              <p className="text-xs text-destructive">
                Link phải bắt đầu bằng http:// hoặc https://
              </p>
            )}
          </div>

          {!file && trimmedUrl === '' && (
            <p className="text-xs text-muted-foreground">
              Cần ít nhất một trong hai: tải tệp lên, hoặc dán link.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={create.isPending}
            onClick={onClose}
          >
            Huỷ
          </Button>
          <Button disabled={!ready || create.isPending} onClick={submit}>
            {create.isPending && <Loader2 className="animate-spin" />}
            Nộp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
