'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type {
  LecturerDirectoryEntry,
  Paginated,
  PublicLecturer,
} from '@/lib/api/types';

/**
 * A supervisor's public profile, keyed on the same id every topic payload
 * already carries — so a link to it can be drawn from a list that has been
 * loaded, without a lookup first.
 */
export function useLecturer(id: number | undefined) {
  return useQuery({
    queryKey: ['lecturers', id],
    queryFn: () => api<PublicLecturer>(`/lecturers/${id!}`),
    enabled: id !== undefined,
    staleTime: 5 * 60_000,
  });
}

export interface LecturerDirectoryQuery {
  q?: string;
  page?: number;
  limit?: number;
}

/**
 * The faculty's supervisors, for the one screen that has to offer a choice of
 * one: the proposal form.
 *
 * Not `/topics/lecturers`, which lists only people who already published a
 * topic. A student writes their own idea exactly when the catalogue has nothing
 * they want, and the person who would guide it is often the one with nothing in
 * it — so filtering to lecturers with topics would hide the very names this
 * screen exists to find.
 */
export function useLecturerDirectory(query: LecturerDirectoryQuery = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const search = params.toString();

  return useQuery({
    queryKey: ['lecturers', 'directory', query],
    queryFn: () =>
      api<Paginated<LecturerDirectoryEntry>>(
        `/lecturers${search ? `?${search}` : ''}`,
      ),
    // Names and titles do not move; the mentoring load does, but a minute-old
    // count is only ever a warning that the API will repeat properly on submit.
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}
