'use client';

import { GraduationCap, Layers } from 'lucide-react';
import {
  useCreateMajor,
  useDeleteMajor,
  useMajors,
  useUpdateMajor,
} from '@/lib/api/majors';
import {
  useCreateProjectType,
  useDeleteProjectType,
  useProjectTypeDetails,
  useUpdateProjectType,
} from '@/lib/api/master-data';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { CatalogueManager } from '@/components/catalogue-manager';

/**
 * The two flat lists the faculty keeps, on one screen.
 *
 * They were a page each, and each page was a six-row table holding a third of a
 * monitor. Nothing about them is separate work either: the office declares both
 * once, at the start of a term, in the same sitting — a specialisation so the
 * roster import can match a code, and a kind of project so a round can be opened
 * at all. Splitting one job across two destinations was two clicks and two
 * near-empty screens for it.
 *
 * Học kỳ deliberately stays where it is. It has a detail page, an activate
 * button and a registration plan hanging off it, so it is not a flat list and
 * would not sit beside these two.
 */
export default function CataloguesPage() {
  const allowed = useRequireRole('ADMIN');

  const majors = useMajors();
  const createMajor = useCreateMajor();
  const updateMajor = useUpdateMajor();
  const deleteMajor = useDeleteMajor();

  const types = useProjectTypeDetails();
  const createType = useCreateProjectType();
  const updateType = useUpdateProjectType();
  const deleteType = useDeleteProjectType();

  if (!allowed) return null;

  return (
    /*
      Side by side from `xl` rather than `lg`: each block carries a four-column
      table, and squeezed into half of a laptop screen the names start wrapping —
      at which point two columns cost more reading than the empty space they
      saved.
    */
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <CatalogueManager
        icon={GraduationCap}
        title="Chuyên ngành"
        noun="chuyên ngành"
        codeHint="Mã trong file nhập danh sách sinh viên, ví dụ CNTT, KTPM."
        items={majors.data}
        isPending={majors.isPending}
        error={majors.error}
        usage={(major) => ({
          count: major._count.students,
          label: `${major._count.students} sinh viên`,
        })}
        onCreate={(input) => createMajor.mutateAsync(input)}
        onUpdate={(input) => updateMajor.mutateAsync(input)}
        onDelete={(id) => deleteMajor.mutateAsync(id)}
      />

      <CatalogueManager
        icon={Layers}
        title="Loại đồ án"
        noun="loại đồ án"
        codeHint="Mã ngắn dùng trong hệ thống, ví dụ DACS, DATN."
        items={types.data}
        isPending={types.isPending}
        error={types.error}
        usage={(type) => {
          // Two different things point at a kind of project, and the office
          // needs to know which is in the way: an open round is this term's
          // problem, an old proposal is a record from a term nobody runs now.
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
        onCreate={(input) => createType.mutateAsync(input)}
        onUpdate={(input) => updateType.mutateAsync(input)}
        onDelete={(id) => deleteType.mutateAsync(id)}
      />
    </div>
  );
}
