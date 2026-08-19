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

/**
 * Statuses where the server has nothing useful to add, so it must not be
 * quoted.
 *
 * Whatever a 5xx says is about our server, not about anything the person
 * reading it can do.
 *
 * 429 used to be listed here, because Nest answered a rate limit with
 * "ThrottlerException: Too Many Requests" — a framework class name, in English,
 * on a Vietnamese screen. The API now words that itself, and a 429 can also mean
 * "sai mật khẩu nhiều lần, thử lại sau 8 giây", which carries a number that a
 * canned sentence about waiting a minute would have thrown away.
 *
 * Everything else still shows what the API said, because those messages are
 * ours and they carry the actual reason — "Đề tài vừa có nhóm khác nhận" is
 * exactly what someone needs to read, and replacing it with a generic line
 * would be throwing away the only useful part of the response.
 */
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

/**
 * One request, authenticated, with a single refresh retry — and the response
 * unread.
 *
 * Split out from `api` because not everything the API answers with is JSON: a
 * spreadsheet export is a file, and it needs exactly this handling of the token
 * and exactly none of the parsing. Two copies of the refresh dance would be two
 * places for a rotated token to be spent twice.
 */
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

  // An empty body is an answer, not malformed JSON.
  //
  // Nest replies to a controller that returns null with 200 and no content at
  // all, which is exactly what "you have no group this semester" looks like.
  // Handing that to response.json() throws a SyntaxError, and a SyntaxError here
  // is indistinguishable from the network having failed — so the request gets
  // retried, three times, with backoff, and the query still ends in an error
  // state. The screen then reports a failure for a request that succeeded.
  const payload = await response.text();

  return (payload ? JSON.parse(payload) : null) as T;
}

/**
 * Ask for a file and hand it to the browser to save.
 *
 * A plain link cannot do this: the endpoint needs an Authorization header, and
 * an anchor sends none — which is why the export is a fetch and a temporary
 * object URL rather than an `href`.
 *
 * The filename comes from the server's own Content-Disposition when it sent one,
 * because the server is what decided what the file is. The fallback is only for
 * a deployment where a proxy has stripped the header.
 */
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
