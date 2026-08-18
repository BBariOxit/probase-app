'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { NotificationPage } from '@/lib/api/types';

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (query: NotificationQuery) =>
    [...notificationKeys.all, 'list', query] as const,
};

function toSearch(query: NotificationQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.unreadOnly) params.set('unreadOnly', 'true');

  const search = params.toString();
  return search ? `?${search}` : '';
}

/**
 * The inbox, and the unread count that comes with it.
 *
 * The one thing in this app that changes without the reader having done
 * anything: somebody joins your group, the office reopens a round, and the
 * first you hear of it is here. So unlike the rest of the data — which is
 * invalidated by whatever mutation moved it — this has to go and ask.
 *
 * A minute, and on regaining focus. Not a socket: a service people open a few
 * times a semester does not earn a live connection, and the count being a
 * minute stale costs nothing. Not longer, either — a student who follows a
 * notification into the app and finds the badge still there learns to distrust
 * it.
 */
export function useNotifications(query: NotificationQuery = {}) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => api<NotificationPage>(`/notifications${toSearch(query)}`),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Every list and every count moves when one notice is read, and the badge is
 * derived from the same response as the list — so the whole family goes rather
 * than any one key.
 */
function useInvalidateNotifications() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: () =>
      api<{ message: string }>('/notifications/read-all', { method: 'POST' }),
    onSuccess: invalidate,
  });
}
