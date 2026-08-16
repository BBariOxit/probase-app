'use client';

import { usePathname } from 'next/navigation';
import type { Role } from '@/lib/api/types';
import { titleFor } from '@/lib/nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

/**
 * Deliberately thin, and deliberately inside the content panel rather than
 * alongside the sidebar. Navigation and the account both live in the sidebar,
 * so all this carries is where you are and the controls that belong to the
 * page in view.
 */
export function AppHeader({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 !h-4" />
      <h1 className="font-heading text-sm font-medium">
        {titleFor(role, pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
      </div>
    </header>
  );
}
