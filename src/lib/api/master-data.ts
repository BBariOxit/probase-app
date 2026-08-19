'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type {
  ProjectType,
  ProjectTypeDetail,
  RegistrationRound,
  RoundPlanInput,
  Semester,
} from '@/lib/api/types';

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
 * Every round in a semester, whoever is asking.
 *
 * The office's version of `useMyRounds`: an administrator belongs to no intake,
 * so "mine" would answer with nothing at all — and the whole point of their
 * screens is the rounds they are not personally in.
 */
export function useRoundsForSemester(semesterId: number | undefined) {
  return useQuery({
    queryKey: ['rounds', semesterId, 'all'],
    queryFn: () =>
      api<RegistrationRound[]>(`/rounds?semesterId=${semesterId!}`),
    enabled: semesterId !== undefined,
    // The same minute as the student view, and for the same reason: this is
    // where somebody reads which stage a round has reached before acting on it.
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

// ── the office's side of the same data ──────────────────────

/**
 * Everything the master data can be changed by, kept beside the reads it
 * invalidates. A catalogue is small enough that no mutation here tries to patch
 * a cache by hand: the list is refetched, and the two can never disagree.
 */
function useInvalidate(key: readonly unknown[]) {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: key });
}

export interface SemesterInput {
  name: string;
  code: string;
  /** ISO strings; the API coerces them. */
  startDate: string;
  endDate: string;
  gradeSubmissionDeadline?: string | null;
}

export function useCreateSemester() {
  const invalidate = useInvalidate(['semesters']);

  return useMutation({
    mutationFn: (input: SemesterInput) =>
      api<Semester>('/semesters', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateSemester() {
  const invalidate = useInvalidate(['semesters']);

  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<SemesterInput> & { id: number }) =>
      api<Semester>(`/semesters/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: invalidate,
  });
}

export function useDeleteSemester() {
  const invalidate = useInvalidate(['semesters']);

  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/semesters/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

/**
 * Making one semester active makes every other one inactive, so the whole list
 * moves — and with it every screen that asks "which term is this".
 */
export function useActivateSemester() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api<Semester>(`/semesters/${id}/activate`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/** Every round of a semester, for the office rather than for one reader. */
export function useSemesterRounds(semesterId: number | undefined) {
  return useQuery({
    queryKey: ['semesters', semesterId, 'rounds'],
    queryFn: () => api<RegistrationRound[]>(`/semesters/${semesterId!}/rounds`),
    enabled: semesterId !== undefined,
  });
}

/**
 * The whole registration plan, replaced in one call.
 *
 * Rounds that already carry topics are never dropped by omission — the API
 * refuses rather than quietly deleting work a lecturer has done — so the screen
 * can send what the office means without diffing it against what is there.
 */
export function useSetSemesterRounds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      semesterId,
      rounds,
    }: {
      semesterId: number;
      rounds: RoundPlanInput[];
    }) =>
      api<RegistrationRound[]>(`/semesters/${semesterId}/rounds`, {
        method: 'PUT',
        body: { rounds },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rounds'] }),
  });
}

export interface CatalogueInput {
  name: string;
  code: string;
}

export function useCreateProjectType() {
  const invalidate = useInvalidate(['project-types']);

  return useMutation({
    mutationFn: (input: CatalogueInput) =>
      api<ProjectType>('/project-types', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateProjectType() {
  const invalidate = useInvalidate(['project-types']);

  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<CatalogueInput> & { id: number }) =>
      api<ProjectType>(`/project-types/${id}`, {
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteProjectType() {
  const invalidate = useInvalidate(['project-types']);

  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/project-types/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

/** The catalogue with the counts that decide whether a row may be deleted. */
export function useProjectTypeDetails() {
  return useQuery({
    queryKey: ['project-types'],
    queryFn: () => api<ProjectTypeDetail[]>('/project-types'),
    staleTime: MASTER_DATA_STALE_TIME,
  });
}
