'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { ProjectType, RegistrationRound, Semester } from '@/lib/api/types';

/**
 * Master data changes a few times a year at most. Refetching it on every
 * navigation would be pure noise, so it is held for a long while.
 *
 * Half an hour rather than the five minutes this used to be. Five did not match
 * the sentence above it, and the gap was visible: React Query refetches every
 * stale query when the window regains focus, so coming back to a tab after lunch
 * fired the whole set again — semesters, project types and cohort eligibility
 * together — for data that had not moved since term started.
 */
const MASTER_DATA_STALE_TIME = 30 * 60_000;

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
 * The rounds this caller may take part in, soonest deadline first.
 *
 * The API does the ordering, and it is not arbitrary: a student already in a
 * group gets that round first, and one who is not gets the round they are about
 * to miss. A screen picking `[0]` therefore lands on the right one without
 * knowing either rule.
 */
export function useMyRounds(semesterId: number | undefined) {
  return useQuery({
    queryKey: ['rounds', semesterId, 'mine'],
    queryFn: () =>
      api<RegistrationRound[]>(`/rounds?semesterId=${semesterId!}&mine=true`),
    enabled: semesterId !== undefined,
    // Shorter than the rest of the master data: this is the countdown a student
    // reads before deciding whether they still have time, and the phase can move
    // between two page loads.
    staleTime: 60_000,
  });
}

/**
 * The one round a student's screens follow.
 *
 * Almost every student has exactly one — their intake is opened for a single
 * kind of project — so this is the whole answer for them. Where a faculty opens
 * two for the same intake, the API's ordering decides which comes first.
 */
export function useMyRound(semesterId: number | undefined) {
  const { data } = useMyRounds(semesterId);

  return data?.[0];
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
