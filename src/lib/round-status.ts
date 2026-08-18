import {
  CalendarClock,
  CircleCheck,
  DoorOpen,
  Info,
  type LucideIcon,
} from 'lucide-react';
import type { RegistrationRound } from '@/lib/api/types';

/** Everything the wording below needs; a topic's embedded round satisfies it too. */
export type RoundLike = Pick<
  RegistrationRound,
  'phase' | 'registrationStart' | 'registrationEnd'
>;

export interface RoundStatus {
  icon: LucideIcon;
  /**
   * The deadline as a person would say it: "Còn 12 ngày đăng ký".
   *
   * Short enough for the foot of the sidebar and loud enough for the top of a
   * page, because it is the same sentence in both places — a student who reads
   * "còn 12 ngày" on one screen and "đang mở" on another has to work out that
   * they are the same fact.
   */
  headline: string;
  /** What that means for this reader, in one line. */
  detail: string;
  /** The window is closing within three days: worth colouring, not shouting. */
  urgent: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
});

/** Whole days from now until `iso`, rounded up; negative once it has passed. */
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS);
}

/**
 * A round, said out loud — the one place that turns a phase into words.
 *
 * Keyed on the phase, not on the dates. The dates are what moves the phase, but
 * they are not the same thing: the office can open the gate early or hold it
 * shut, and RECONCILING carries on after `registrationEnd` has passed and says
 * something the calendar cannot — that the faculty is placing the students who
 * ended up without a group.
 *
 * `hasGroup` changes the detail and never the headline. When the gate is what
 * it is, it is that for everybody; what differs is what each reader should do
 * about it, and EXTENDED is the phase where those two readers are told opposite
 * things.
 */
export function describeRound(
  round: RoundLike,
  hasGroup: boolean,
): RoundStatus {
  const { phase, registrationStart, registrationEnd } = round;

  if (phase === 'PREP') {
    const opensIn = daysUntil(registrationStart);

    return {
      icon: CalendarClock,
      headline:
        opensIn > 0 ? `Mở đăng ký sau ${opensIn} ngày` : 'Chưa mở đăng ký',
      detail: `Cổng đăng ký mở ngày ${dateFormat.format(new Date(registrationStart))}. Bạn có thể xem trước danh sách đề tài từ giờ.`,
      urgent: false,
    };
  }

  if (phase === 'OPEN' || phase === 'EXTENDED') {
    const closesIn = daysUntil(registrationEnd);
    const extended = phase === 'EXTENDED';
    const noun = extended ? 'gia hạn' : 'đăng ký';
    const closingDate = dateFormat.format(new Date(registrationEnd));

    return {
      icon: extended ? DoorOpen : CalendarClock,
      headline:
        closesIn <= 0
          ? `Hôm nay là hạn ${noun}`
          : `Còn ${closesIn} ngày ${noun}`,
      detail: hasGroup
        ? extended
          ? 'Cổng mở lại cho các bạn chưa có nhóm. Nhóm của bạn giữ nguyên và không thay đổi được thành viên nữa.'
          : `Hết ngày ${closingDate} là chốt. Sau đó nhóm không đổi được thành viên nữa, nên còn thiếu ai thì rủ từ giờ.`
        : `Bạn còn thời gian tự chọn đề tài, tới hết ngày ${closingDate}. Sau đó khoa sẽ xếp bạn vào một đề tài còn chỗ.`,
      urgent: closesIn <= 3,
    };
  }

  if (phase === 'RECONCILING') {
    return {
      icon: Info,
      headline: 'Khoa đang phân bổ',
      detail: hasGroup
        ? 'Cổng đăng ký đã đóng và khoa đang rà soát phân bổ. Nhóm của bạn giữ nguyên, chỉ không thay đổi được thành viên nữa.'
        : 'Bạn chưa có nhóm, nên khoa sẽ xếp bạn vào một đề tài còn chỗ. Bạn sẽ nhận được thông báo khi kết quả được chốt.',
      urgent: false,
    };
  }

  return {
    icon: CircleCheck,
    headline: 'Đã chốt phân bổ',
    detail: hasGroup
      ? 'Đề tài và nhóm của bạn đã chính thức. Từ đây là phần làm đồ án.'
      : 'Học kỳ này bạn không được phân đề tài. Liên hệ giáo vụ khoa nếu đây là sai sót.',
    urgent: false,
  };
}

export interface RoundStep {
  label: string;
  /** dd/MM, on the two steps the faculty has actually committed to a date for. */
  date: string | null;
  /** "còn 21 ngày", "đang diễn ra" — only ever on the step happening now. */
  note: string | null;
  state: 'done' | 'current' | 'upcoming';
}

/**
 * The round as a sequence, so "còn 21 ngày" has something to be 21 days of.
 *
 * A bare countdown answers when but not what happens next, and the phases after
 * the gate closes are the ones students have no picture of at all — the faculty
 * places whoever is left, then the list is final. Two of the four steps carry a
 * real date; the other two deliberately carry none, because the office does not
 * announce them and inventing one here would be a promise nothing keeps.
 */
export function roundTimeline(round: RoundLike): RoundStep[] {
  const { phase } = round;
  const opened = phase !== 'PREP';
  const closed = phase === 'RECONCILING' || phase === 'FINALIZED';
  const opensIn = daysUntil(round.registrationStart);
  const closesIn = daysUntil(round.registrationEnd);

  return [
    {
      label: 'Mở đăng ký',
      date: dateFormat.format(new Date(round.registrationStart)),
      note: opened ? null : opensIn > 0 ? `còn ${opensIn} ngày` : 'hôm nay',
      state: opened ? 'done' : 'current',
    },
    {
      label: phase === 'EXTENDED' ? 'Hạn gia hạn' : 'Hạn đăng ký',
      date: dateFormat.format(new Date(round.registrationEnd)),
      note:
        opened && !closed
          ? closesIn > 0
            ? `còn ${closesIn} ngày`
            : 'hôm nay'
          : null,
      state: closed ? 'done' : opened ? 'current' : 'upcoming',
    },
    {
      label: 'Khoa phân bổ',
      date: null,
      note: phase === 'RECONCILING' ? 'đang diễn ra' : null,
      state:
        phase === 'FINALIZED'
          ? 'done'
          : phase === 'RECONCILING'
            ? 'current'
            : 'upcoming',
    },
    {
      label: 'Chốt danh sách',
      date: null,
      note: null,
      state: phase === 'FINALIZED' ? 'done' : 'upcoming',
    },
  ];
}
