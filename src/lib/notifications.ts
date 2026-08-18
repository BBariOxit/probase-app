import type { AppNotification, Role } from '@/lib/api/types';

/**
 * Where a notice leads, or null when it leads nowhere yet.
 *
 * Every type the API currently raises is addressed to a student, and every
 * destination below is a student route — so a reader in any other role gets no
 * link rather than a link into a screen that is not theirs. Returning null is
 * also the honest answer for the types whose screens have not been built:
 * a notice that navigates to a dead page is worse than one that simply reads.
 */
export function notificationHref(
  notice: AppNotification,
  role: Role,
): string | null {
  if (role !== 'STUDENT') return null;

  switch (notice.type) {
    case 'GROUP_MEMBER_JOINED':
      return '/student/nhom';

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
