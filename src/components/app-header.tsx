'use client';

import type { SessionUser } from '@/lib/api/types';
import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

/**
 * Deliberately thin, and deliberately inside the content panel rather than
 * alongside the sidebar. Navigation lives in the sidebar, so what is left here
 * is where you are, and the three controls that belong to the person rather
 * than to the page: notices, theme, account.
 *
 * The heading was replaced with AppBreadcrumb so that detail pages (e.g.
 * /lecturer/nhom/42) show a clickable trail instead of a static title.
 * Top-level pages (single path segment) still render a plain h1.
 */
export function AppHeader({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 !h-4" />

      {/* Breadcrumb trail — single-segment paths degrade to a plain h1. */}
      <AppBreadcrumb role={user.role} />

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationBell role={user.role} />
        <ThemeToggle />
        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
