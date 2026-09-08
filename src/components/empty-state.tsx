import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Icon className="size-7 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}
