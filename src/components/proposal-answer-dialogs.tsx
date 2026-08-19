'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { useAcceptProposal, useRejectProposal } from '@/lib/api/proposals';
import type { TopicProposal } from '@/lib/api/types';
import { FormError } from '@/components/form-error';
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
import { Textarea } from '@/components/ui/textarea';

/**
 * Saying yes, and the one thing the lecturer has to supply to do it.
 *
 * `maxStudents` is the field the proposal deliberately does not carry: how many
 * people an idea takes is a judgement about the work, made by whoever has to
 * guide it. It is also the number the group's whole seat arithmetic is built on,
 * so it cannot be defaulted to something plausible and corrected later — which
 * is why this is a dialog and not a button.
 *
 * What it produces is a PENDING topic, exactly like one the lecturer wrote
 * themselves, and the wording says so. Skipping the faculty office here would
 * open a way around its review entirely, and a lecturer who expected the topic
 * to appear immediately would read the delay as a fault.
 */
export function AcceptProposalDialog({
  proposal,
  open,
  onOpenChange,
}: {
  proposal: TopicProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const accept = useAcceptProposal();
  const [maxStudents, setMaxStudents] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const size = Number(maxStudents);
  const valid = Number.isInteger(size) && size >= 1 && size <= 10;

  async function submit() {
    setError(null);
    try {
      await accept.mutateAsync({ id: proposal.id, maxStudents: size });
      onOpenChange(false);
    } catch (err) {
      // The refusal that actually happens here is the mentoring quota, and its
      // message names the numbers. Replacing it with something generic would
      // throw away the only part worth reading.
      setError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!accept.isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nhận hướng dẫn đề tài này?</DialogTitle>
          <DialogDescription>{proposal.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormError message={error} />

          <div className="space-y-2">
            <Label htmlFor="maxStudents">Số sinh viên tối đa</Label>
            <p className="-mt-1 text-xs text-muted-foreground">
              Đề tài sẽ nhận tối đa bấy nhiêu sinh viên. Sinh viên đề xuất được
              giữ chỗ cho tới khi đợt đăng ký đóng.
            </p>
            <Input
              id="maxStudents"
              type="number"
              min={1}
              max={10}
              className="w-24"
              value={maxStudents}
              aria-invalid={!valid}
              onChange={(event) => setMaxStudents(event.target.value)}
            />
            {!valid && (
              <p className="text-xs text-destructive">
                Nhập một số từ 1 đến 10.
              </p>
            )}
          </div>

          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Đề tài được tạo ở trạng thái chờ khoa duyệt, giống như đề tài bạn tự
            ra. Sau khi khoa duyệt và bạn mở đăng ký, sinh viên mới giữ chỗ
            được.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={accept.isPending}
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
          <Button disabled={!valid || accept.isPending} onClick={submit}>
            {accept.isPending && <Loader2 className="animate-spin" />}
            Nhận hướng dẫn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Saying no, with the reason that makes it worth anything.
 *
 * The reason is required by the API, and this is why: a refusal a student cannot
 * learn from produces the same proposal again next week, and the lecturer reads
 * it twice. It also costs very little — the sentence they would have said out
 * loud is the sentence that goes here.
 */
export function RejectProposalDialog({
  proposal,
  open,
  onOpenChange,
}: {
  proposal: TopicProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reject = useRejectProposal();
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  const trimmed = feedback.trim();

  async function submit() {
    setError(null);
    try {
      await reject.mutateAsync({ id: proposal.id, feedback: trimmed });
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!reject.isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chưa nhận đề xuất này</DialogTitle>
          <DialogDescription>{proposal.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormError message={error} />

          <div className="space-y-2">
            <Label htmlFor="feedback">Nhận xét cho sinh viên</Label>
            <p className="-mt-1 text-xs text-muted-foreground">
              Vài câu là đủ: vì sao chưa nhận, và sinh viên nên sửa hướng nào.
              Sinh viên sẽ đọc được nguyên văn.
            </p>
            <Textarea
              id="feedback"
              rows={4}
              maxLength={2000}
              value={feedback}
              aria-invalid={trimmed === ''}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={reject.isPending}
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
          <Button
            variant="destructive"
            disabled={trimmed === '' || reject.isPending}
            onClick={submit}
          >
            {reject.isPending && <Loader2 className="animate-spin" />}
            Gửi nhận xét
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
