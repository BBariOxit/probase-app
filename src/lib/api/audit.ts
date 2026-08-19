'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { AuditLogEntry, Paginated } from '@/lib/api/types';

export interface AuditQuery {
  action?: string;
  userId?: number;
  targetTable?: string;
  page?: number;
  limit?: number;
}

function toSearch(query: AuditQuery): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

/**
 * The trail. Read-only, because there is nothing to write: entries are made by
 * the services that perform the actions, inside the transaction that performs
 * them, and nothing anywhere edits or deletes one.
 */
export function useAuditLogs(query: AuditQuery) {
  return useQuery({
    queryKey: ['audit-logs', query],
    queryFn: () =>
      api<Paginated<AuditLogEntry>>(`/audit-logs${toSearch(query)}`),
    placeholderData: (previous) => previous,
  });
}

/**
 * The kinds of action that have actually happened, for the filter.
 *
 * Asked of the server rather than listed here, so a service added next month
 * shows up the first time it writes anything — and the filter never offers a
 * value with nothing behind it.
 */
export function useAuditActions() {
  return useQuery({
    queryKey: ['audit-logs', 'actions'],
    queryFn: () => api<string[]>('/audit-logs/actions'),
    staleTime: 5 * 60_000,
  });
}
