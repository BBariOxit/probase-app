'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useProposal, useUpdateProposal } from '@/lib/api/proposals';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { ProposalForm } from '@/components/proposal-form';
import { Button } from '@/components/ui/button';

/**
 * Your own words, while nobody has answered them yet.
 *
 * Only the three text fields are editable, and the form draws the other two as
 * plain text for that reason — the API refuses to move either. That is not
 * fussiness about immutability: the lecturer has been told about this proposal
 * and may have it open right now, so redirecting it to somebody else is a
 * withdrawal and a new proposal, not an edit.
 */
export default function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const allowed = useRequireRole('STUDENT');
  const router = useRouter();
  const { data: proposal, isPending, error } = useProposal(Number(id));
  const update = useUpdateProposal();

  if (!allowed) return null;

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        render={<Link href="/student/de-xuat" />}
      >
        <ArrowLeft />
        Đề xuất của tôi
      </Button>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error || !proposal ? (
        <p className="text-sm text-destructive">Không tìm thấy đề xuất.</p>
      ) : proposal.status !== 'PENDING' ? (
        /*
          The API refuses this too, so the form would only lead to a message
          after the typing. Reached by a stale tab or a bookmarked link far more
          often than by anything else, which is why it explains rather than
          bounces: somebody arriving here has just been answered.
        */
        <p className="max-w-2xl rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Đề xuất này đã được trả lời nên không sửa được nữa. Mở lại danh sách
          để xem câu trả lời của giảng viên.
        </p>
      ) : (
        <ProposalForm
          projectTypes={[proposal.projectType]}
          fixed={{
            projectType: proposal.projectType.name,
            lecturer: proposal.requestedLecturer.academicTitle
              ? `${proposal.requestedLecturer.academicTitle} ${proposal.requestedLecturer.fullName}`
              : proposal.requestedLecturer.fullName,
          }}
          defaultValues={{
            projectTypeId: proposal.projectType.id,
            requestedLecturerId: proposal.requestedLecturer.id,
            title: proposal.title,
            description: proposal.description,
            expectedOutcomes: proposal.expectedOutcomes,
          }}
          submitLabel="Lưu thay đổi"
          onSubmit={async (values) => {
            // Only the three the API will take back; sending the other two
            // would be asking it to refuse a change nobody made.
            await update.mutateAsync({
              id: proposal.id,
              title: values.title,
              description: values.description,
              expectedOutcomes: values.expectedOutcomes,
            });
            router.push('/student/de-xuat');
          }}
          onCancel={() => router.push('/student/de-xuat')}
        />
      )}
    </div>
  );
}
