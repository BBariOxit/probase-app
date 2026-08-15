'use client';

import {
  readStoredRefreshToken,
  storeRefreshToken,
  useSession,
} from '@/lib/auth/session';
import type { TokenPair } from '@/lib/api/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Nest replies with `message` as either a string or an array of them. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'message' in body) {
      const { message } = body as { message: unknown };
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join(', ');
    }
  } catch {
    // Body was empty or not JSON; fall through to the generic message.
  }
  return `Yêu cầu thất bại (${response.status})`;
}

/**
 * At most one refresh is ever in flight.
 *
 * The API rotates refresh tokens and stores only a hash of the current one, so
 * a token is single-use. If a page fires several requests that all expire at
 * once, letting each start its own refresh means the first rotates the token
 * and the rest present one the server has already discarded — every straggler
 * fails and the user is thrown out mid-session. Sharing one promise means the
 * losers wait for the winner instead of racing it.
 */
let inFlightRefresh: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  inFlightRefresh ??= (async () => {
    const refreshToken = readStoredRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const tokens = (await response.json()) as TokenPair;
    storeRefreshToken(tokens.refreshToken);
    useSession.getState().setAccessToken(tokens.accessToken);
    return tokens.accessToken;
  })()
    .catch(() => null)
    .finally(() => {
      inFlightRefresh = null;
    });

  return inFlightRefresh;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Skip the Authorization header — login and refresh are public. */
  anonymous?: boolean;
}

export async function api<T>(
  path: string,
  { method = 'GET', body, anonymous = false }: RequestOptions = {},
): Promise<T> {
  const send = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  const token = anonymous ? null : useSession.getState().accessToken;
  let response = await send(token);

  // One retry, and only for an expired session — a second 401 means the
  // refresh token is spent too, so there is nothing left to try.
  if (response.status === 401 && !anonymous) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      useSession.getState().signOut();
      throw new ApiError(401, 'Phiên đăng nhập đã hết hạn');
    }
    response = await send(refreshed);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response));
  }

  return (await response.json()) as T;
}
