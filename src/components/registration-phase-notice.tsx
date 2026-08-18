import { describeRound, type RoundLike } from '@/lib/round-status';

/**
 * Why the buttons are missing, in the phases where they are.
 *
 * Only rendered outside OPEN, and only when it has something to add. A student
 * who cannot register needs to know whether that is because the gate has not
 * opened, because it has closed, or because the round is settled — different
 * situations that a page of greyed-out cards would present as one.
 *
 * The RECONCILING wording is the one that matters most. That is when a student
 * with no group can do nothing at all, and saying nothing at that moment is what
 * makes people think they have been forgotten.
 *
 * The words come from `describeRound`, shared with the sidebar countdown and the
 * group screen's header. Three copies of "what phase are we in" drifted apart
 * once already: the sidebar counted the days down while this called the same
 * round simply closed.
 */
export function RegistrationPhaseNotice({
  subject,
  round,
  hasGroup,
}: {
  /**
   * Which round this is about, when the reader has more than one and the
   * sentence would otherwise be ambiguous. Left out when there is only one:
   * naming the single thing on screen is noise.
   */
  subject?: string;
  round: RoundLike;
  hasGroup: boolean;
}) {
  if (round.phase === 'OPEN') return null;

  const status = describeRound(round, hasGroup);

  return (
    <div className="flex items-start gap-2.5 rounded-xl border bg-muted/40 px-4 py-3">
      <status.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="space-y-0.5 text-sm">
        <p className="font-medium">
          {subject ? `${subject} · ${status.headline}` : status.headline}
        </p>
        <p className="text-muted-foreground">{status.detail}</p>
      </div>
    </div>
  );
}
