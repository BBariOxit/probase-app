'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { nextParam } from '@/lib/auth/next-path';
import { useSession } from '@/lib/auth/session';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

/** SidebarProvider writes this on every toggle but never reads it back. */
function storedSidebarOpen(): boolean {
  if (typeof document === 'undefined') return true;
  return !/(^|;\s*)sidebar_state=false(;|$)/.test(document.cookie);
}

/**
 * The guard for every signed-in screen.
 *
 * It runs on the client rather than in middleware because the access token
 * lives in memory, which the edge runtime cannot see. The cost is a moment of
 * skeleton on first paint; the alternative is putting the token in a cookie
 * purely so middleware can read it.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, signOut } = useSession();
  const [defaultOpen] = useState(storedSidebarOpen);

  useEffect(() => {
    // The destination travels with the redirect. Someone following a join link
    // from a chat message almost never has a live session, and dropping them on
    // /student after signing in loses the only thing they were trying to do.
    if (status === 'unauthenticated') {
      router.replace(`/login${nextParam(pathname)}`);
    }
    // A temporary password gets you exactly one destination. The API enforces
    // this too, since a redirect only steers a browser.
    else if (status === 'authenticated' && user?.mustChangePassword) {
      router.replace('/change-password');
    }
  }, [status, user, router, pathname]);

  async function handleSignOut() {
    // Best effort: the server drops the refresh tokens, but the local session
    // must end either way.
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    signOut();
    router.replace('/login');
  }

  if (status !== 'authenticated' || !user || user.mustChangePassword) {
    // The frame does not depend on any request, so it is drawn immediately and
    // only the content waits. Blanking the whole viewport made the shell
    // arrive late and jump into place.
    return (
      <div className="flex min-h-svh flex-1 bg-sidebar">
        <div className="hidden w-64 shrink-0 md:block" />
        <div className="m-2 ml-0 flex flex-1 flex-col rounded-xl bg-background shadow-sm">
          <div className="h-14 border-b" />
          <div className="flex flex-1 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar user={user} onSignOut={handleSignOut} />
      <SidebarInset>
        <AppHeader role={user.role} />
        {/* min-w-0 so a wide table scrolls inside the panel instead of pushing
            the page sideways. */}
        <div className="min-w-0 flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
