'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/lib/api/types';
import { homePathFor, useSession } from '@/lib/auth/session';

/**
 * Sends a signed-in user away from a screen that is not theirs.
 *
 * This is housekeeping, not a security control — the API refuses the requests
 * regardless of what the client renders. Its job is to stop a lecturer who
 * typed /admin from meeting a wall of 403s and concluding the system is
 * broken, when the real answer is that they are in the wrong place.
 */
export function useRequireRole(role: Role): boolean {
  const router = useRouter();
  const user = useSession((state) => state.user);
  const allowed = user?.role === role;

  useEffect(() => {
    if (user && !allowed) router.replace(homePathFor(user.role));
  }, [user, allowed, router]);

  return allowed;
}
