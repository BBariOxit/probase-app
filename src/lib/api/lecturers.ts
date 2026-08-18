'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { PublicLecturer } from '@/lib/api/types';

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
