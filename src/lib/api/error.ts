import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';

/**
 * Call this inside `useMutation({ onError })` (or any catch block) and it will
 * pop a Sonner error toast with the message the API returned.
 *
 * - ApiError        → the message the server sent, already human-readable
 * - Error           → the JS message as a fallback
 * - anything else   → generic "Something went wrong"
 *
 * Usage:
 * ```ts
 * useMutation({
 *   mutationFn: ...,
 *   onSuccess: ...,
 *   onError: toastApiError,
 * });
 * ```
 *
 * Or with a custom prefix:
 * ```ts
 * onError: (err) => toastApiError(err, 'Failed to save topic'),
 * ```
 */
export function toastApiError(error: unknown, prefix?: string): void {
  const message = extractErrorMessage(error);
  toast.error(prefix ? `${prefix}: ${message}` : message);
}

/**
 * Same as `toastApiError` but fires a success toast on the happy path.
 * Handy when you want both sides handled with one import.
 */
export function toastSuccess(message: string): void {
  toast.success(message);
}

/**
 * Pull the most informative string from whatever was thrown.
 * Exposed so callers can compose their own toasts with extra context.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
