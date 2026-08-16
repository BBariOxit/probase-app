'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { ProjectType, Semester } from '@/lib/api/types';

/**
 * Master data changes a few times a year at most. Refetching it on every
 * navigation would be pure noise, so it is held for a long while.
 */
const MASTER_DATA_STALE_TIME = 5 * 60_000;

export function useSemesters() {
  return useQuery({
    queryKey: ['semesters'],
    queryFn: () => api<Semester[]>('/semesters'),
    staleTime: MASTER_DATA_STALE_TIME,
  });
}

export function useProjectTypes() {
  return useQuery({
    queryKey: ['project-types'],
    queryFn: () => api<ProjectType[]>('/project-types'),
    staleTime: MASTER_DATA_STALE_TIME,
  });
}

/** The semester everything defaults to, if the faculty has opened one. */
export function useActiveSemester(): Semester | undefined {
  const { data } = useSemesters();
  return data?.find((semester) => semester.isActive);
}
