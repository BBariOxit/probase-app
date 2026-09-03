'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { topicKeys } from '@/lib/api/topics';
import type { JoinPreview, RegistrationGroup } from '@/lib/api/types';

export const groupKeys = {
  all: ['registration-groups'] as const,
  mine: () => [...groupKeys.all, 'mine'] as const,
  supervised: (semesterId?: number) =>
    [...groupKeys.all, 'supervised', semesterId] as const,
  detail: (id: number) => [...groupKeys.all, 'detail', id] as const,
  preview: (code: string) => [...groupKeys.all, 'preview', code] as const,
};

/**
 * Everything a registration change can move.
 *
 * Joining or leaving alters a topic's seat count as much as the group itself, so
 * both caches go — a browse list still showing "còn 1 chỗ" for a topic that just
 * filled is how a student ends up pressing a button the API refuses.
 */
function useInvalidateRegistration() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: groupKeys.all }),
      queryClient.invalidateQueries({ queryKey: topicKeys.all }),
    ]);
  };
}

/**
 * The caller's group this semester, or null when they have none yet.
 *
 * Read by the banner, the group screen and the confirmation dialog, so it is
 * mounted and unmounted often as the student moves around. Every path that can
 * change it goes through a mutation here and invalidates it explicitly, which
 * makes refetching on each remount and on every window focus pure noise — a
 * navigation between two screens that both show the group was costing three
 * requests for data that had not moved.
 *
 * A long staleTime rather than Infinity: the group can also change from another
 * member's browser, and coming back to a tab minutes later should not show a
 * roster from before lunch.
 */
export function useMyGroup() {
  return useQuery({
    queryKey: groupKeys.mine(),
    queryFn: () => api<RegistrationGroup | null>('/registration-groups/me'),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * All active groups on topics this lecturer supervises.
 *
 * Keyed by semesterId so switching semesters hits the network instead of
 * showing last term's roster. staleTime of 2 minutes matches the student's
 * own group — the data can change whenever a student registers or leaves.
 */
export function useSupervisedGroups(semesterId?: number) {
  const params = semesterId ? `?semesterId=${semesterId}` : '';

  return useQuery({
    queryKey: groupKeys.supervised(semesterId),
    queryFn: () =>
      api<RegistrationGroup[]>(
        `/registration-groups/my-supervised${params}`,
      ),
    staleTime: 2 * 60_000,
  });
}

export function useGroup(id: number | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(id ?? 0),
    queryFn: () => api<RegistrationGroup>(`/registration-groups/${id!}`),
    enabled: id !== undefined,
  });
}

export interface RegisterTopicInput {
  topicId: number;
  /** Omitted means no seats are held and the rest open immediately. */
  declaredSize?: number;
  name?: string;
}

export function useRegisterTopic() {
  const invalidate = useInvalidateRegistration();

  return useMutation({
    mutationFn: ({ topicId, ...body }: RegisterTopicInput) =>
      api<RegistrationGroup>(`/topics/${topicId}/register`, {
        method: 'POST',
        body,
      }),
    onSuccess: invalidate,
  });
}

/** Take a seat in the group that already holds a topic. */
export function useJoinTopic() {
  const invalidate = useInvalidateRegistration();

  return useMutation({
    mutationFn: (topicId: number) =>
      api<RegistrationGroup>(`/topics/${topicId}/join`, { method: 'POST' }),
    onSuccess: invalidate,
  });
}

/**
 * What a link leads to. Kept fresh rather than cached for long: the page exists
 * to show a seat count somebody is about to act on.
 */
export function useJoinPreview(code: string) {
  return useQuery({
    queryKey: groupKeys.preview(code),
    queryFn: () =>
      api<JoinPreview>(`/registration-groups/join/${encodeURIComponent(code)}`),
    staleTime: 0,
    retry: false,
  });
}

export function useJoinByCode() {
  const invalidate = useInvalidateRegistration();

  return useMutation({
    mutationFn: (code: string) =>
      api<RegistrationGroup>(
        `/registration-groups/join/${encodeURIComponent(code)}`,
        { method: 'POST' },
      ),
    onSuccess: invalidate,
  });
}

export interface GroupPatch {
  name?: string | null;
  openForJoin?: boolean;
  /**
   * How many of the topic's seats to claim. Between the members already in the
   * group and the topic's capacity; null gives the claim up entirely.
   */
  declaredSize?: number | null;
  /** `true` only — the API will not push a hold further out, just end it. */
  releaseHold?: true;
  /** A student profile id already in the group. */
  leaderId?: number;
}

export function useUpdateGroup(id: number) {
  const invalidate = useInvalidateRegistration();

  return useMutation({
    mutationFn: (patch: GroupPatch) =>
      api<RegistrationGroup>(`/registration-groups/${id}`, {
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: invalidate,
  });
}

export function useLeaveGroup(id: number) {
  const invalidate = useInvalidateRegistration();

  return useMutation({
    mutationFn: () =>
      api<{ message: string }>(`/registration-groups/${id}/leave`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });
}

export function useRemoveMember(id: number) {
  const invalidate = useInvalidateRegistration();

  return useMutation({
    mutationFn: (studentId: number) =>
      api<RegistrationGroup>(
        `/registration-groups/${id}/members/${studentId}`,
        { method: 'DELETE' },
      ),
    onSuccess: invalidate,
  });
}

export function useDisbandGroup(id: number) {
  const invalidate = useInvalidateRegistration();

  return useMutation({
    mutationFn: () =>
      api<{ message: string }>(`/registration-groups/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  });
}
