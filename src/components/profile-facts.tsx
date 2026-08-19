import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { MyProfile } from '@/lib/api/types';

/**
 * The person, as the office recorded them — text rather than inputs.
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
export function ProfileFacts({ profile }: { profile: MyProfile }) {
  const { student, lecturer } = profile;

  return (
    <div className="space-y-4">
      {/*
        "Thông tin cá nhân", not "Thông tin do khoa quản lý". Who administers a
        field is our problem, not the reader's — they came to look at themselves,
        and the fields that cannot be typed into are visibly not typed into.
      */}
      <h2 className="text-sm font-medium">Thông tin cá nhân</h2>

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
            {/*
              The load, not the ceiling. "Hạn mức 6 nhóm mỗi kỳ" was a number
              nothing in the system acted on and nobody could place themselves
              against — a lecturer had no way to tell whether they were at two of
              six or at six. This says where they stand, and it is the same sum
              the API now checks before letting them accept another proposal.
            */}
            <Fact
              label="Hướng dẫn học kỳ này"
              value={
                lecturer.mentoring.quota === null
                  ? `${lecturer.mentoring.groups} nhóm`
                  : `${lecturer.mentoring.groups}/${lecturer.mentoring.quota} nhóm`
              }
              hint={
                // Named rather than folded into the count, because it is the
                // part that would otherwise look like a mistake: a lecturer who
                // has said yes to two proposals nobody has registered on yet
                // reads "2 nhóm" and knows of none.
                lecturer.mentoring.reserved > 0
                  ? `${lecturer.mentoring.reserved} đề tài đã nhận, chờ sinh viên đăng ký`
                  : undefined
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
    </div>
  );
}

function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | null;
  /** A qualifier the value would be misread without. Wraps; the value does not. */
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      {/* An empty field says "chưa có" rather than leaving a gap the reader has
          to interpret as either missing or broken. */}
      <dd className="truncate text-sm">
        {value ?? <span className="text-muted-foreground">Chưa có</span>}
      </dd>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
