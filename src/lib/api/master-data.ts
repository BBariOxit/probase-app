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

/**
 * The kinds of project this caller's intake may take in a semester.
 *
 * What the browse screen defaults its filter to. Without it a student sees the
 * whole catalogue and every register button on a project type their cohort is not
 * open for fails on press — the rule lives at the API, so the screen has to ask
 * rather than guess. Staff get the full catalogue: the rule exists to steer
 * students, not to hide the list from the people running it.
 */
export function useMyEligibleProjectTypes(semesterId: number | undefined) {
  return useQuery({
    queryKey: ['semesters', semesterId, 'eligibility', 'mine'],
    queryFn: () =>
      api<ProjectType[]>(`/semesters/${semesterId!}/eligibility/mine`),
    enabled: semesterId !== undefined,
    staleTime: MASTER_DATA_STALE_TIME,
  });
}
