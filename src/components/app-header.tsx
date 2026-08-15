'use client';

import { Menu as MenuIcon } from 'lucide-react';
import type { SessionUser } from '@/lib/api/types';
import { useSidebar } from '@/lib/ui/use-sidebar';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { Button } from '@/components/ui/button';

/**
 * Deliberately thin. Navigation lives in the sidebar, so all this carries is
 * the way into it on small screens plus the two account-level controls.
 */
export function AppHeader({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  const setMobileOpen = useSidebar((state) => state.setMobileOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mở điều hướng"
          onClick={() => setMobileOpen(true)}
          className="text-muted-foreground lg:hidden"
        >
          <MenuIcon className="size-4" />
        </Button>
        {/* The wordmark is in the sidebar on desktop; on mobile the sidebar is
            hidden, so the header carries it instead. */}
        <Brand className="text-lg lg:hidden" />
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
