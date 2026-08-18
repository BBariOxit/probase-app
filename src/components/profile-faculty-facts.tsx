import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { MyProfile } from '@/lib/api/types';

/**
 * What the faculty office holds about you, as text rather than as inputs.
 *
 * These are not read-only because of a permission: they are read-only because
 * the system computes with them. A student's cohort comes out of their student
 * code and decides which round their intake may enter; the class code is
 * cross-checked against the same code on import. An editable box here would not
 * be a correction, it would be a way into a round you are not in — so the screen
 * says where corrections actually happen instead of offering a control that ends
 * in a refusal.
 *
 * The name is in this list for the same reason, and it is the entry people ask
 * about: it is the name that goes onto the defence minutes and the grade sheet.
 */
export function ProfileFacultyFacts({ profile }: { profile: MyProfile }) {
  const { student, lecturer } = profile;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <h2 className="text-sm font-medium">Thông tin do khoa quản lý</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sai thông tin? Liên hệ giáo vụ khoa — bạn không tự sửa được ở đây.
        </p>
      </div>

      {student && (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Fact label="Họ và tên" value={student.fullName} />
          <Fact label="Mã sinh viên" value={student.studentCode} />
          <Fact label="Lớp" value={student.class} />
          <Fact label="Khoá" value={student.cohort} />
          <Fact label="Chuyên ngành" value={student.major?.name ?? null} />
        </dl>
      )}

      {lecturer && (
        <>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Fact label="Họ và tên" value={lecturer.fullName} />
            <Fact label="Mã giảng viên" value={lecturer.lecturerCode} />
            <Fact
              label="Hạn mức hướng dẫn"
              value={
                lecturer.maxMentoringQuota === null
                  ? 'Không giới hạn'
                  : `${lecturer.maxMentoringQuota} nhóm mỗi kỳ`
              }
            />
          </dl>

          <Link
            href={`/giang-vien/${lecturer.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Xem trang sinh viên nhìn thấy
            <ExternalLink className="size-3.5" />
          </Link>
        </>
      )}

      {!student && !lecturer && (
        <p className="text-sm text-muted-foreground">
          Tài khoản quản trị không gắn với hồ sơ sinh viên hay giảng viên nào,
          nên ở đây chỉ có địa chỉ đăng nhập và ảnh đại diện.
        </p>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      {/* An empty field says "chưa có" rather than leaving a gap the reader has
          to interpret as either missing or broken. */}
      <dd className="truncate text-sm">
        {value ?? <span className="text-muted-foreground">Chưa có</span>}
      </dd>
    </div>
  );
}
