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

const STATUS_MESSAGES: Record<number, string> = {
  500: 'Máy chủ gặp sự cố. Thử lại sau ít phút.',
  502: 'Không kết nối được máy chủ.',
  503: 'Máy chủ đang bảo trì. Thử lại sau ít phút.',
  504: 'Máy chủ phản hồi quá chậm. Thử lại nhé.',
};

/** Nest replies with `message` as either a string or an array of them. */
async function errorMessage(response: Response): Promise<string> {
  const canned = STATUS_MESSAGES[response.status];
  if (canned) return canned;

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
  /**
   * JSON by default. A `FormData` is sent as it is, with no `Content-Type` of
   * ours: the browser has to write that header itself so it can append the
   * multipart boundary, and setting it here would produce a body the server
   * cannot split.
   */
  body?: unknown;
  /** Skip the Authorization header — login and refresh are public. */
  anonymous?: boolean;
}

async function request(
  path: string,
  { method = 'GET', body, anonymous = false }: RequestOptions = {},
): Promise<Response> {
  const multipart = body instanceof FormData;

  const send = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined || multipart
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        body === undefined
          ? undefined
          : multipart
            ? (body as FormData)
            : JSON.stringify(body),
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

  return response;
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await request(path, options);

  const payload = await response.text();

  return (payload ? JSON.parse(payload) : null) as T;
}

export async function download(
  path: string,
  fallbackName: string,
): Promise<void> {
  const response = await request(path);
  const blob = await response.blob();

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"\n]+)"?/.exec(disposition);

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = match?.[1] ?? fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Released on the next tick rather than immediately: revoking before the
  // browser has started reading the URL cancels the download it just began.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
