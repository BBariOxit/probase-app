'use client';

import { usePathname } from 'next/navigation';
import type { SessionUser } from '@/lib/api/types';
import { titleFor } from '@/lib/nav';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 !h-4" />
      <h1 className="font-heading text-sm font-medium">
        {titleFor(user.role, pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationBell role={user.role} />
        <ThemeToggle />
        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
