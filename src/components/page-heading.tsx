/**
 * Every signed-in screen opens the same way.
 *
 * It sets no width of its own: the shell already gutters the content column,
 * and the lists that follow want the full width of it. A max-width here would
 * have quietly narrowed every table added later.
 */
export function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1.5">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
