'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useSession } from '@/lib/auth/session';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

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
    // A temporary password gets you exactly one destination.
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
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b px-5 py-3 sm:px-8">
        <Brand />
        <div className="flex items-center gap-1">
          <span className="mr-2 hidden text-sm text-muted-foreground sm:inline">
            {user.email}
          </span>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Đăng xuất"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
