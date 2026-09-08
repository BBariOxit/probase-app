'use client';

import { create } from 'zustand';
import type { Role, SessionUser } from '@/lib/api/types';

const REFRESH_TOKEN_KEY = 'probase.refreshToken';

export function readStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeRefreshToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  user: SessionUser | null;
  signIn: (
    tokens: { accessToken: string; refreshToken: string },
    user: SessionUser,
  ) => void;
  setAccessToken: (accessToken: string) => void;
  patchUser: (patch: Partial<SessionUser>) => void;
  signOut: () => void;
}

export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  accessToken: null,
  user: null,

  signIn: (tokens, user) => {
    storeRefreshToken(tokens.refreshToken);
    set({ status: 'authenticated', accessToken: tokens.accessToken, user });
  },

  setAccessToken: (accessToken) => set({ accessToken }),

  patchUser: (patch) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...patch } : state.user,
    })),

  signOut: () => {
    storeRefreshToken(null);
    set({ status: 'unauthenticated', accessToken: null, user: null });
  },
}));

/** Where a signed-in user belongs, once past the password gate. */
export function homePathFor(role: Role): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'LECTURER') return '/lecturer';
  return '/student';
}
