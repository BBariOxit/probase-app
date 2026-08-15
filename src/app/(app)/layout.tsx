'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useSession } from '@/lib/auth/session';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';

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
  const { status, user, signOut } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    // A temporary password gets you exactly one destination. The API enforces
    // this too, since a redirect only steers a browser.
    else if (status === 'authenticated' && user?.mustChangePassword) {
      router.replace('/change-password');
    }
  }, [status, user, router]);

  async function handleSignOut() {
    // Best effort: the server drops the refresh tokens, but the local session
    // must end either way.
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    signOut();
    router.replace('/login');
  }

  if (status !== 'authenticated' || !user || user.mustChangePassword) {
    // The frame does not depend on any request, so it is drawn immediately and
    // only the content waits. Blanking the whole screen used to make the shell
    // arrive late and jump into place.
    return (
      <div className="flex flex-1">
        <div className="sticky top-0 hidden h-svh w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-14 border-b" />
          <div className="flex flex-1 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <AppSidebar role={user.role} />

      {/* min-w-0 so a wide table scrolls inside the column instead of pushing
          the whole page sideways. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} onSignOut={handleSignOut} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
