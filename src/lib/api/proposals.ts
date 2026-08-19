'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { topicKeys } from '@/lib/api/topics';
import type { Paginated, ProposalStatus, TopicProposal } from '@/lib/api/types';

/**
 * Whose proposals come back is decided by the token, not by anything here — a
 * student gets what they sent, a lecturer gets what was sent to them. There is
 * deliberately no parameter for it, so there is nothing on this side that could
 * ask for somebody else's.
 */
export interface ProposalQuery {
  status?: ProposalStatus;
  semesterId?: number;
  page?: number;
  limit?: number;
}

export const proposalKeys = {
  all: ['proposals'] as const,
  lists: () => [...proposalKeys.all, 'list'] as const,
  list: (query: ProposalQuery) => [...proposalKeys.lists(), query] as const,
  detail: (id: number) => [...proposalKeys.all, 'detail', id] as const,
};

function toSearch(query: ProposalQuery): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

export function useProposals(query: ProposalQuery = {}) {
  return useQuery({
    queryKey: proposalKeys.list(query),
    queryFn: () =>
      api<Paginated<TopicProposal>>(`/proposals${toSearch(query)}`),
    // Keeps the current page on screen while the next one loads, so filtering
    // does not empty the list and jump the page.
    placeholderData: (previous) => previous,
  });
}

/**
 * One proposal, for the screen that edits it.
 *
 * The API decides who may read it from the token — a student sees their own, a
 * lecturer sees what was addressed to them, and anybody else gets a 404 rather
 * than a 403, so knowing an id reveals nothing about whether it exists.
 */
export function useProposal(id: number) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => api<TopicProposal>(`/proposals/${id}`),
  });
}

/**
 * Everything a proposal can move.
 *
 * The topic caches go too, and not out of caution: accepting one writes a real
 * topic, which appears in the lecturer's own list and — once the office approves
 * and it opens — in the browse list held for its proposer.
 */
function useInvalidateProposals() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: proposalKeys.all }),
      queryClient.invalidateQueries({ queryKey: topicKeys.all }),
    ]);
  };
}

export interface ProposalInput {
  projectTypeId: number;
  requestedLecturerId: number;
  title: string;
  description: string;
  expectedOutcomes: string;
}

export function useCreateProposal() {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: (input: ProposalInput) =>
      api<TopicProposal>('/proposals', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

/**
 * The three fields the API will still take back.
 *
 * Not the lecturer: moving a proposal to somebody else is not an edit, because
 * the first one has been told about it and may be reading it right now. And not
 * the kind of project, which decides the round the resulting topic would live
 * in. Both are changed by withdrawing and sending a new one.
 */
export type ProposalPatch = Partial<
  Pick<ProposalInput, 'title' | 'description' | 'expectedOutcomes'>
>;

export function useUpdateProposal() {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: ({ id, ...patch }: ProposalPatch & { id: number }) =>
      api<TopicProposal>(`/proposals/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: invalidate,
  });
}

/** Withdraw. The API deletes it, along with the notice the lecturer was sent. */
export function useWithdrawProposal() {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/proposals/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

export function useAcceptProposal() {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: ({ id, maxStudents }: { id: number; maxStudents: number }) =>
      api<TopicProposal>(`/proposals/${id}/accept`, {
        method: 'POST',
        body: { maxStudents },
      }),
    onSuccess: invalidate,
  });
}

export function useRejectProposal() {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: ({ id, feedback }: { id: number; feedback: string }) =>
      api<TopicProposal>(`/proposals/${id}/reject`, {
        method: 'POST',
        body: { feedback },
      }),
    onSuccess: invalidate,
  });
}
