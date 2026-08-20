'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  useActiveSemester,
  useMyEligibleProjectTypes,
} from '@/lib/api/master-data';
import { useCreateProposal } from '@/lib/api/proposals';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { ProposalForm } from '@/components/proposal-form';
import { Button } from '@/components/ui/button';

/**
 * Writing one.
 *
 * A page rather than a dialog: it asks for two paragraphs of considered prose,
 * and a box that closes on a stray click is the wrong container for something
 * somebody spent twenty minutes on.
 *
 * The kinds of project offered are only the ones this student's intake is opened
 * for. Anything wider would let them write a whole proposal against a round the
 * API refuses on submit, and the refusal would arrive after the writing rather
 * than before it.
 */
export default function NewProposalPage() {
  const allowed = useRequireRole('STUDENT');
  const router = useRouter();
  const semester = useActiveSemester();
  const { data: projectTypes, isPending } = useMyEligibleProjectTypes(
    semester?.id,
  );
  const create = useCreateProposal();

  if (!allowed) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        render={<Link href="/student/de-xuat" />}
      >
        <ArrowLeft />
        Đề xuất của tôi
      </Button>

      {isPending || projectTypes === undefined ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : projectTypes.length === 0 ? (
        // Not an error and not an empty list either: the faculty has opened no
        // round this intake belongs to, and no form on this page could fix it.
        <p className="max-w-2xl rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Học kỳ này khoa chưa mở loại đồ án nào cho khóa của bạn, nên chưa gửi
          đề xuất được. Nếu bạn nghĩ đây là sai sót, liên hệ giáo vụ khoa.
        </p>
      ) : (
        <ProposalForm
          projectTypes={projectTypes}
          submitLabel="Gửi đề xuất"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            router.push('/student/de-xuat');
          }}
          onCancel={() => router.push('/student/de-xuat')}
        />
      )}
    </div>
  );
}
