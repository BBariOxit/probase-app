import type { AppNotification, Role } from '@/lib/api/types';

/**
 * Where a notice leads, or null when it leads nowhere yet.
 *
 * Two roles receive notices now, and each has its own set: everything a lecturer
 * is told about is a proposal waiting on them, and everything else is addressed
 * to a student. They are split rather than merged because the destinations do not
 * overlap at all — a single switch would have to re-check the role in most of its
 * arms anyway, and the one time that check was missed it would send somebody into
 * a screen that bounces them straight back out.
 *
 * Returning null is the honest answer for the types whose screens do not exist:
 * a notice that navigates to a dead page is worse than one that simply reads.
 */
export function notificationHref(
  notice: AppNotification,
  role: Role,
): string | null {
  if (role === 'LECTURER') {
    switch (notice.type) {
      // Carries the proposal's id, which the inbox screen does not need: what
      // they are opening it for is the queue, and the one they were told about
      // is at the top of it — pending first is the order the API returns.
      case 'PROPOSAL_SUBMITTED':
        return '/lecturer/de-xuat';

      // The office put somebody on their topic. `targetId` is that topic, and
      // it is where the new roster is.
      // Somebody handed something in on one of their topics, or they are being
      // reminded of it. The queue is what they open it for.
      case 'SUBMISSION_FEEDBACK':
        return '/lecturer/bao-cao';

      case 'TOPIC_STUDENT_ASSIGNED':
        return notice.targetId
          ? `/lecturer/topics/${notice.targetId}`
          : '/lecturer';

      default:
        return null;
    }
  }

  if (role !== 'STUDENT') return null;

  switch (notice.type) {
    /*
      Both land on the outbox rather than on the thing they name, and for
      different reasons that happen to agree.

      A rejection's `targetId` is the proposal, and the proposal screen is where
      the lecturer's reason is — there is nowhere better to go. An acceptance's
      `targetId` is the *topic* that was just written, and that topic is PENDING
      until the faculty office signs it off: `/student/topics/:id` answers 404 for
      a student until then, so following it would take the good news to an error
      page. The outbox names the topic and says which of the two it is waiting on.
    */
    case 'PROPOSAL_ACCEPTED':
    case 'PROPOSAL_REJECTED':
      return '/student/de-xuat';

    case 'GROUP_MEMBER_JOINED':
    // The office placed the reader, or placed somebody beside them. Either way
    // the group screen is what changed, and `targetId` is that group.
    case 'GROUP_MEMBER_ASSIGNED':
      return '/student/nhom';

    /*
      The group screen again, and for the reader who ended up with nothing as
      much as for the one who did. Its empty state is written for exactly this
      moment — a settled round with no group reads "học kỳ này bạn không được
      phân đề tài, liên hệ giáo vụ khoa nếu đây là sai sót" — so both halves of
      the audience land somewhere that answers them.
    */
    case 'ROUND_FINALIZED':
      return '/student/nhom';

    /*
      The supervisor answered a version of something the group handed in.
      `targetId` is the group, which the submissions screen is already scoped to —
      it shows that group's whole history, newest first, so the version just
      answered is at the top of it.
    */
    case 'SUBMISSION_FEEDBACK':
      return '/student/nop-bai';

    // The group is gone in both of these, so the topic is what is left to look
    // at — and `targetId` is the topic for exactly that reason.
    case 'GROUP_MEMBER_REMOVED':
    case 'GROUP_DISBANDED':
      return notice.targetId
        ? `/student/topics/${notice.targetId}`
        : '/student';

    // The point of the notice is that there is still time to choose, so it
    // leads to the list rather than to the round it names.
    case 'ROUND_EXTENDED':
      return '/student';

    default:
      return null;
  }
}

const RELATIVE = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' });

const STEPS: {
  limit: number;
  divisor: number;
  unit: Intl.RelativeTimeFormatUnit;
}[] = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86_400, divisor: 3600, unit: 'hour' },
  { limit: 604_800, divisor: 86_400, unit: 'day' },
];

/**
 * How long ago, in words.
 *
 * An inbox is read by recency and almost never by date: "2 giờ trước" answers
 * the question a reader actually has, where "18/08/2026 14:22" makes them do
 * the subtraction. Past a week the exact date becomes the more useful of the
 * two, and it takes over.
 */
export function timeAgo(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;

  if (seconds < 45) return 'vừa xong';

  for (const step of STEPS) {
    if (seconds < step.limit) {
      return RELATIVE.format(-Math.round(seconds / step.divisor), step.unit);
    }
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}
