'use client';

import { useEffect } from 'react';
import { api, ApiError } from '@/lib/api/client';
import type { MeResponse, TokenPair } from '@/lib/api/types';
import {
  readStoredRefreshToken,
  storeRefreshToken,
  useSession,
} from '@/lib/auth/session';

/**
 * Rebuilds the session on first paint.
 *
 * The access token is deliberately not persisted, so after a reload the only
 * thing on hand is the stored refresh token: exchange it, then ask the API who
 * we are. `mustChangePassword` has to come from /auth/me rather than from
 * anything cached locally, otherwise the forced-change gate would be a value
 * the client could simply edit.
 */
export function useSessionBootstrap() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const refreshToken = readStoredRefreshToken();
      if (!refreshToken) {
        useSession.setState({ status: 'unauthenticated' });
        return;
      }

      try {
        const tokens = await api<TokenPair>('/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
          anonymous: true,
        });
        if (cancelled) return;

        storeRefreshToken(tokens.refreshToken);
        useSession.setState({ accessToken: tokens.accessToken });

        const me = await api<MeResponse>('/auth/me');
        if (cancelled) return;

        useSession.setState({
          status: 'authenticated',
          user: {
            id: me.id,
            email: me.email,
            role: me.role,
            mustChangePassword: me.mustChangePassword,
            // Null rather than the address as a fallback: the header wants to
            // know that there is no name on file, not to be handed an email
            // dressed up as one.
            fullName:
              me.studentProfile?.fullName ??
              me.lecturerProfile?.fullName ??
              null,
            avatarUrl: me.avatarUrl,
          },
        });
      } catch (err) {
        if (cancelled) return;

        // Two very different failures used to be treated the same way, and
        // signOut() deletes the stored refresh token.
        //
        // An ApiError means the server answered and rejected the token —
        // expired, revoked, already rotated. The credentials really are gone
        // and keeping them would only fail again.
        if (err instanceof ApiError) {
          useSession.getState().signOut();
          return;
        }

        // Anything else is fetch failing to reach the host at all: the API
        // restarting, or the machine briefly offline. The token is very
        // probably still good, so it stays put and a reload once the server
        // is back restores the session. Throwing it away turned a two-second
        // blip into a forced sign-in.
        //
        // Warn rather than error: this is a condition, not a defect, and
        // console.error is what paints Next's full-screen overlay over it.
        console.warn('Không kết nối được máy chủ khi khôi phục phiên:', err);
        useSession.setState({
          status: 'unauthenticated',
          accessToken: null,
          user: null,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
