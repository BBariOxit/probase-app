/**
 * Every signed-in screen opens the same way. The role landings are
 * intentionally bare: there is nothing to show until the topic and
 * registration modules exist, and inventing placeholder statistics would be
 * clutter pretending to be a product.
 */
export function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-1.5">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
