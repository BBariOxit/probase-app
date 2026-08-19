'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Paginated, Submission, SubmissionType } from '@/lib/api/types';

export interface SubmissionQuery {
  submissionType?: SubmissionType;
  /** Staff only. A student's own group comes from their token, never from here. */
  groupId?: number;
  topicId?: number;
  page?: number;
  limit?: number;
}

export const submissionKeys = {
  all: ['submissions'] as const,
  list: (query: SubmissionQuery) =>
    [...submissionKeys.all, 'list', query] as const,
};

function toSearch(query: SubmissionQuery): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

/**
 * What has been handed in, from whichever end the reader stands at: a student
 * gets their own group's, a supervisor gets everything on their topics. There is
 * no parameter for whose, so there is nothing here that could ask for somebody
 * else's work.
 */
export function useSubmissions(query: SubmissionQuery = {}) {
  return useQuery({
    queryKey: submissionKeys.list(query),
    queryFn: () => api<Paginated<Submission>>(`/submissions${toSearch(query)}`),
    placeholderData: (previous) => previous,
  });
}

function useInvalidateSubmissions() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: submissionKeys.all });
}

export interface SubmissionInput {
  submissionType: SubmissionType;
  /** At least one of these; the API refuses a submission carrying neither. */
  submissionUrl?: string;
  file?: File | null;
}

/**
 * Handing something in.
 *
 * Always multipart, even when there is no file: the endpoint takes one, and
 * sending the same shape either way means the form does not have to decide
 * between two request formats depending on what the student filled in.
 */
export function useCreateSubmission() {
  const invalidate = useInvalidateSubmissions();

  return useMutation({
    mutationFn: (input: SubmissionInput) => {
      const body = new FormData();
      body.append('submissionType', input.submissionType);
      if (input.submissionUrl)
        body.append('submissionUrl', input.submissionUrl);
      if (input.file) body.append('file', input.file);

      return api<Submission>('/submissions', { method: 'POST', body });
    },
    onSuccess: invalidate,
  });
}

export function useSubmissionFeedback() {
  const invalidate = useInvalidateSubmissions();

  return useMutation({
    mutationFn: ({ id, feedback }: { id: number; feedback: string }) =>
      api<Submission>(`/submissions/${id}/feedback`, {
        method: 'POST',
        body: { feedback },
      }),
    onSuccess: invalidate,
  });
}
