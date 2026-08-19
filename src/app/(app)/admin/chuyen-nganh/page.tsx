'use client';

import { GraduationCap } from 'lucide-react';
import {
  useCreateMajor,
  useDeleteMajor,
  useMajors,
  useUpdateMajor,
} from '@/lib/api/majors';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { CatalogueManager } from '@/components/catalogue-manager';

/**
 * The faculty's specialisations.
 *
 * A student's major comes off the roster import by code, and the round they may
 * register in comes off their intake — so nothing here is decorative, and a
 * specialisation that exists under two codes is a roster that half fails.
 */
export default function MajorsPage() {
  const allowed = useRequireRole('ADMIN');
  const { data, isPending, error } = useMajors();
  const create = useCreateMajor();
  const update = useUpdateMajor();
  const remove = useDeleteMajor();

  if (!allowed) return null;

  return (
    <CatalogueManager
      icon={GraduationCap}
      noun="chuyên ngành"
      codeHint="Mã trong file nhập danh sách sinh viên, ví dụ CNTT, KTPM."
      items={data}
      isPending={isPending}
      error={error}
      usage={(major) => ({
        count: major._count.students,
        label: `${major._count.students} sinh viên`,
      })}
      onCreate={(input) => create.mutateAsync(input)}
      onUpdate={(input) => update.mutateAsync(input)}
      onDelete={(id) => remove.mutateAsync(id)}
    />
  );
}
