import type { TopicStatus } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/**
 * Class names are written out in full rather than composed from the tone name,
 * because Tailwind reads the source as text — a template literal would compile
 * to nothing.
 */
const TONE_CLASS = {
  waiting: 'bg-status-waiting-bg text-status-waiting',
  active: 'bg-status-active-bg text-status-active',
  success: 'bg-status-success-bg text-status-success',
  idle: 'bg-status-idle-bg text-status-idle',
} as const;

/**
 * Five topic states over four tones.
 *
 * Green goes to OPEN rather than to IN_PROGRESS, because on the screen where
 * these matter most — a student browsing — green answers the only question
 * being asked: can I register for this one. IN_PROGRESS takes blue for
 * "running, nothing for you to do", and COMPLETED shares grey with APPROVED
 * since both mean the same to a reader: no action here.
 */
const TOPIC_STATUS: Record<
  TopicStatus,
  { label: string; tone: keyof typeof TONE_CLASS }
> = {
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
  const { label, tone } = TOPIC_STATUS[status];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
