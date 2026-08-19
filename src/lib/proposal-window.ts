import type { RoundLike } from '@/lib/round-status';

/**
 * Whether a student may still put an idea to a lecturer, and what to tell them
 * when they may not.
 *
 * The window is wider at the front than registration's and identical at the
 * back, which is the whole reason this is not `describeRound`. PREP is the phase
 * proposals are *for* — the gate is shut, the catalogue is still being written,
 * and a lecturer has time to read one — so reusing the registration wording here
 * would tell a student to come back later at precisely the moment they should be
 * writing.
 *
 * It mirrors `RoundPhaseService.requireCanPropose` on the API. The API is what
 * enforces it; this exists so the screen does not offer a button that is certain
 * to be refused. When the two disagree the API wins, and its message is what the
 * form shows.
 */
export interface ProposalWindow {
  open: boolean;
  /** Why it is shut, in words for the person reading. Null while it is open. */
  reason: string | null;
}

export function proposalWindow(
  round: RoundLike | undefined,
  hasGroup: boolean,
): ProposalWindow {
  // No round for this reader's intake this semester: not a phase problem, and
  // the faculty office is the only place that can fix it.
  if (!round) {
    return {
      open: false,
      reason:
        'Học kỳ này khoa chưa mở đợt đồ án nào cho khóa của bạn, nên chưa gửi đề xuất được.',
    };
  }

  if (round.phase === 'PREP' || round.phase === 'OPEN') {
    return { open: true, reason: null };
  }

  if (round.phase === 'EXTENDED') {
    return hasGroup
      ? {
          open: false,
          reason:
            'Đợt đăng ký đã đóng và chỉ gia hạn cho các bạn chưa có nhóm. Bạn đã có đề tài nên không gửi đề xuất mới được.',
        }
      : { open: true, reason: null };
  }

  return {
    open: false,
    reason:
      round.phase === 'RECONCILING'
        ? 'Đợt đăng ký đã đóng và khoa đang phân bổ, nên đề tài đề xuất bây giờ sẽ không kịp cho ai đăng ký.'
        : 'Học kỳ này đã chốt phân bổ, không nhận thêm đề xuất nữa.',
  };
}
