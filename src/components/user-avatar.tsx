import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * One face, drawn the same way everywhere it appears.
 *
 * The fallback is a letter rather than a silhouette icon, because a roster of
 * three silhouettes tells a reader nothing and a roster of A, B and C tells them
 * who is who. Most accounts will never upload a picture, so the fallback is the
 * common case and deserves to be the legible one.
 */
export function UserAvatar({
  name,
  email,
  src,
  className,
}: {
  /** Null for an admin, who has no profile row to carry a name. */
  name?: string | null;
  /** Used for the letter when there is no name; never displayed in full. */
  email?: string | null;
  src?: string | null;
  className?: string;
}) {
  const label = name ?? email ?? '';

  return (
    <Avatar className={cn('size-8', className)}>
      {src && <AvatarImage src={src} alt={label} />}
      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
        {initial(label)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * The letter people are called by: the last word of a Vietnamese name, since
 * that is the given name and the first word is the family one — "Nguyễn Văn A"
 * is A, not N, and a column of Ns would identify nobody.
 */
function initial(label: string): string {
  const parts = label.trim().split(/\s+/);
  const word = parts.at(-1) ?? label;

  return (word.charAt(0) || '?').toUpperCase();
}
