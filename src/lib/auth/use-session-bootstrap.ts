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
          },
        });
      } catch (err) {
        if (cancelled) return;
        // An expired or revoked refresh token is the normal way a session
        // ends; anything else still leaves us with no usable credentials.
        if (!(err instanceof ApiError)) console.error(err);
        useSession.getState().signOut();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
