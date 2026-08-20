import { cn } from '@/lib/utils';

/**
 * A reading column with a narrow rail beside it.
 *
 * The shape most screens here want. A list of cards or notices has to keep a
 * narrow measure — a line of text past about eighty characters is measurably
 * harder to read — so stretching it across a monitor is not an option. But
 * leaving the other half of the screen blank is not neutral either: it is space
 * that could be answering the next question the reader has, and on this app that
 * next question is always the same kind of thing — what is due, what is left,
 * who to contact.
 *
 * The rail is optional and the layout collapses to one column without it. An
 * empty rail would be exactly the whitespace this exists to spend.
 *
 * It stacks below `lg` with the rail first, because on a phone the summary is
 * what you want before the list, not after it.
 */
export function PageWithRail({
  rail,
  className,
  children,
}: {
  rail?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto grid max-w-6xl items-start gap-4',
        rail && 'lg:grid-cols-[minmax(0,1fr)_20rem]',
        className,
      )}
    >
      {rail && <div className="space-y-4 lg:order-2">{rail}</div>}
      <div className="space-y-4 lg:order-1">{children}</div>
    </div>
  );
}
