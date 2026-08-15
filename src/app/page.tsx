'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { homePathFor, useSession } from '@/lib/auth/session';

/**
 * The root is a dispatcher, not a page. Where someone belongs depends on the
 * session, which only exists client-side, so it waits for bootstrap and then
 * sends them on.
 */
export default function RootPage() {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !user) {
      router.replace('/login');
      return;
    }
    router.replace(
      user.mustChangePassword ? '/change-password' : homePathFor(user.role),
    );
  }, [status, user, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
    </div>
  );
}
