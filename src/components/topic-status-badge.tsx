import type { ActiveGroup, TopicStatus } from '@/lib/api/types';
import { StatusPill, type StatusLabel } from '@/components/status-pill';

/**
 * Five topic states over four tones.
 *
 * Green goes to OPEN rather than to IN_PROGRESS, because on the screen where
 * these matter most — a student browsing — green answers the only question
 * being asked: can I register for this one. IN_PROGRESS takes blue for
 * "running, nothing for you to do", and COMPLETED shares grey with APPROVED
 * since both mean the same to a reader: no action here.
 */
const TOPIC_STATUS: Record<TopicStatus, StatusLabel> = {
  PENDING: { label: 'Chờ duyệt', tone: 'waiting' },
  APPROVED: { label: 'Đã duyệt', tone: 'idle' },
  OPEN: { label: 'Đang mở', tone: 'success' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'active' },
  COMPLETED: { label: 'Hoàn thành', tone: 'idle' },
};

export function TopicStatusBadge({
  status,
  className,
}: {
  status: TopicStatus;
  className?: string;
}) {
  return <StatusPill {...TOPIC_STATUS[status]} className={className} />;
}

/**
 * The same badge for a lecturer looking at their own topics, folding in what
 * the group is doing.
 *
 * One column rather than two, because the group only says anything new while
 * the topic is OPEN: before that no group can exist, and afterwards there is
 * always exactly one settled.
 *
 * Nothing here waits on the lecturer any more. Per-group approval is gone — a
 * group that fills up is simply done, and the faculty office settles the whole
 * semester at once after the gate closes — so SUBMITTED reads as "đã đủ người"
 * rather than as a queue with the lecturer at the head of it.
 */
export function TopicOwnerBadge({
  status,
  activeGroup,
  className,
}: {
  status: TopicStatus;
  activeGroup: ActiveGroup | null;
  className?: string;
}) {
  if (status === 'OPEN' && activeGroup) {
    const owned =
      activeGroup.status === 'SUBMITTED'
        ? ({ label: 'Đã đủ người', tone: 'success' } as const)
        : ({ label: 'Đang lập nhóm', tone: 'active' } as const);

    return <StatusPill {...owned} className={className} />;
  }

  return <StatusPill {...TOPIC_STATUS[status]} className={className} />;
}
