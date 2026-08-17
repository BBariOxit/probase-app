'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type {
  Paginated,
  TopicDetail,
  TopicListItem,
  TopicStatus,
} from '@/lib/api/types';

export interface TopicQuery {
  semesterId?: number;
  projectTypeId?: number;
  lecturerId?: number;
  status?: TopicStatus;
  q?: string;
  mine?: boolean;
  /** Narrow to the project types this caller's intake may take. */
  forMyCohort?: boolean;
  page?: number;
  limit?: number;
}

/** Just enough of a lecturer to name them in a filter. */
export interface TopicLecturer {
  id: number;
  fullName: string;
  academicTitle: string | null;
}

/**
 * Unset filters are dropped rather than sent empty, so that the cache key and
 * the URL agree on what "no filter" means. Sending `?q=` would otherwise be a
 * different key from sending nothing while asking the server the same thing.
 */
function toSearchParams(query: TopicQuery): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || value === false) continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

export const topicKeys = {
  all: ['topics'] as const,
  lists: () => [...topicKeys.all, 'list'] as const,
  list: (query: TopicQuery) => [...topicKeys.lists(), query] as const,
  detail: (id: number) => [...topicKeys.all, 'detail', id] as const,
};

/**
 * `enabled` exists for the screens whose filters depend on something still
 * loading — the active semester, most often. Without it the list fetches once
 * unfiltered, then again with the semester the moment it arrives: a wasted
 * request, and a flicker of other semesters' topics in between.
 */
export function useTopics(query: TopicQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: topicKeys.list(query),
    queryFn: () =>
      api<Paginated<TopicListItem>>(`/topics${toSearchParams(query)}`),
    enabled: options?.enabled ?? true,
    // Keep the previous page on screen while the next one loads. Without this
    // the table empties and the page jumps every time someone types a letter
    // into the search box.
    placeholderData: (previous) => previous,
  });
}

/**
 * Only lecturers who actually have a visible topic, which is what the endpoint
 * returns — a filter whose options mostly lead to an empty page is worse than
 * no filter at all.
 */
export function useTopicLecturers(semesterId: number | undefined) {
  return useQuery({
    queryKey: [...topicKeys.all, 'lecturers', semesterId],
    queryFn: () =>
      api<TopicLecturer[]>(
        `/topics/lecturers${semesterId ? `?semesterId=${semesterId}` : ''}`,
      ),
    enabled: semesterId !== undefined,
    staleTime: 60_000,
  });
}

export function useTopic(id: number) {
  return useQuery({
    queryKey: topicKeys.detail(id),
    queryFn: () => api<TopicDetail>(`/topics/${id}`),
  });
}

export interface TopicInput {
  semesterId: number;
  projectTypeId: number;
  title: string;
  description: string;
  expectedOutcomes: string;
  maxStudents: number;
}

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TopicInput) =>
      api<TopicDetail>('/topics', { method: 'POST', body: input }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: topicKeys.lists() }),
  });
}

/** Everything except the semester, which the API refuses to move. */
export type TopicPatch = Partial<Omit<TopicInput, 'semesterId'>>;

export function useUpdateTopic(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: TopicPatch) =>
      api<TopicDetail>(`/topics/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: (topic) => {
      queryClient.setQueryData(topicKeys.detail(id), topic);
      return queryClient.invalidateQueries({ queryKey: topicKeys.lists() });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/topics/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.all }),
  });
}

/** approve is the faculty office's; open and close belong to the owner. */
export type TopicTransition = 'approve' | 'open' | 'close';

export function useTopicTransition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, to }: { id: number; to: TopicTransition }) =>
      api<TopicDetail>(`/topics/${id}/${to}`, { method: 'PATCH' }),
    onSuccess: (topic) => {
      queryClient.setQueryData(topicKeys.detail(topic.id), topic);
      return queryClient.invalidateQueries({ queryKey: topicKeys.lists() });
    },
  });
}
