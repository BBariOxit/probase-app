import { CalendarClock, CircleCheck, Info } from 'lucide-react';
import type { SemesterPhase } from '@/lib/api/types';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
});

/**
 * Why the buttons are missing, in the phases where they are.
 *
 * Only rendered outside OPEN, and only when it has something to add. A student
 * who cannot register needs to know whether that is because the gate has not
 * opened, because it has closed, or because the semester is settled — three
 * different situations that a page of greyed-out cards would present as one.
 *
 * The RECONCILING wording is the one that matters most. That is when a student
 * with no group can do nothing at all, and saying nothing at that moment is what
 * makes people think they have been forgotten.
 */
export function RegistrationPhaseNotice({
  phase,
  registrationStart,
  hasGroup,
}: {
  phase: SemesterPhase;
  registrationStart: string;
  hasGroup: boolean;
}) {
  if (phase === 'OPEN') return null;

  const notice = describe(phase, registrationStart, hasGroup);

  return (
    <div className="flex items-start gap-2.5 rounded-xl border bg-muted/40 px-4 py-3">
      <notice.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="space-y-0.5 text-sm">
        <p className="font-medium">{notice.title}</p>
        <p className="text-muted-foreground">{notice.body}</p>
      </div>
    </div>
  );
}

function describe(
  phase: Exclude<SemesterPhase, 'OPEN'>,
  registrationStart: string,
  hasGroup: boolean,
) {
  if (phase === 'PREP') {
    return {
      icon: CalendarClock,
      title: 'Chưa mở đăng ký',
      body: `Cổng đăng ký mở ngày ${dateFormat.format(new Date(registrationStart))}. Bạn có thể xem trước danh sách đề tài từ giờ.`,
    };
  }

  if (phase === 'RECONCILING') {
    return {
      icon: Info,
      title: 'Cổng đăng ký đã đóng',
      body: hasGroup
        ? 'Khoa đang rà soát phân bổ. Nhóm của bạn giữ nguyên, chỉ không thay đổi được thành viên nữa.'
        : 'Bạn chưa có nhóm, nên khoa sẽ xếp bạn vào một đề tài còn chỗ. Bạn sẽ nhận được thông báo khi kết quả được chốt.',
    };
  }

  return {
    icon: CircleCheck,
    title: 'Đã chốt phân bổ',
    body: hasGroup
      ? 'Đề tài và nhóm của bạn đã chính thức. Xem các mốc thời gian sắp tới ở trang nhóm.'
      : 'Học kỳ này bạn không được phân đề tài. Liên hệ giáo vụ khoa nếu đây là sai sót.',
  };
}
