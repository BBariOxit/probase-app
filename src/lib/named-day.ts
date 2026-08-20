const OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Which Vietnamese calendar day an instant falls in, as a whole number. */
function vietnamDay(ms: number): number {
  return Math.floor((ms + OFFSET_MS) / DAY_MS);
}

/**
 * How many days from today to the day a date names: 0 is today, negative is
 * past.
 *
 * Every deadline the faculty sets is a calendar day picked out of a date box,
 * which arrives as midnight UTC of that day. Subtracting one instant from
 * another and dividing gives an answer that changes at seven in the morning
 * rather than at midnight, so a deadline read at breakfast on its own day
 * already says "quá hạn" — while the API, which counts the same day as running
 * to its end, still accepts the work.
 *
 * Counting whole days instead of hours removes the discrepancy rather than
 * papering over it: both sides are answering a question about days, and neither
 * has to know the other's arithmetic.
 */
export function daysUntilDay(iso: string): number {
  return vietnamDay(new Date(iso).getTime()) - vietnamDay(Date.now());
}
