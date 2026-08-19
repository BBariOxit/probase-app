'use client';

import { Layers } from 'lucide-react';
import {
  useCreateProjectType,
  useDeleteProjectType,
  useProjectTypeDetails,
  useUpdateProjectType,
} from '@/lib/api/master-data';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { CatalogueManager } from '@/components/catalogue-manager';

/**
 * Cơ sở, Chuyên ngành, Tốt nghiệp — and whatever else a faculty runs.
 *
 * This is the shorter list of the two catalogues and the more load-bearing: a
 * kind of project crossed with a semester is what a registration round *is*, so
 * a row added here is what makes it possible to open a round at all.
 */
export default function ProjectTypesPage() {
  const allowed = useRequireRole('ADMIN');
  const { data, isPending, error } = useProjectTypeDetails();
  const create = useCreateProjectType();
  const update = useUpdateProjectType();
  const remove = useDeleteProjectType();

  if (!allowed) return null;

  return (
    <CatalogueManager
      icon={Layers}
      noun="loại đồ án"
      codeHint="Mã ngắn dùng trong hệ thống, ví dụ DACS, DATN."
      items={data}
      isPending={isPending}
      error={error}
      usage={(type) => {
        // Two different things point at a project type, and the office needs to
        // know which is in the way: an open round is this term's problem, an old
        // proposal is a record from a term nobody is running any more.
        const rounds = type._count.rounds;
        const proposals = type._count.topicProposals;

        return {
          count: rounds + proposals,
          label: [
            rounds > 0 && `${rounds} đợt`,
            proposals > 0 && `${proposals} đề xuất`,
          ]
            .filter(Boolean)
            .join(' · '),
        };
      }}
      onCreate={(input) => create.mutateAsync(input)}
      onUpdate={(input) => update.mutateAsync(input)}
      onDelete={(id) => remove.mutateAsync(id)}
    />
  );
}
