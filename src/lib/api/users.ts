'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type {
  BulkImportResult,
  LecturerProfileDetail,
  LecturerProfileInput,
  Role,
  StudentProfileDetail,
  StudentProfileInput,
  UserAccount,
  UserDetail,
  UsersPage,
} from '@/lib/api/types';

export interface UserQuery {
  role?: Role;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const userKeys = {
  all: ['users'] as const,
  list: (query: UserQuery) => [...userKeys.all, 'list', query] as const,
};

function toSearch(query: UserQuery): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

/**
 * The account roster.
 *
 * Answers in `{ data, meta }` rather than the envelope every other list uses,
 * which is why the type says so plainly — the shape is wrapped here rather than
 * flattened, so nothing downstream has to remember which of the two it is
 * holding.
 */
export function useUsers(query: UserQuery) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => api<UsersPage>(`/users${toSearch(query)}`),
    placeholderData: (previous) => previous,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: userKeys.all });
}

/**
 * What creating an account needs, which depends entirely on the role.
 *
 * A student and a lecturer are created together with their profile, because
 * every relation in the system points at the profile rather than the account —
 * an account without one is a row nothing can refer to. An admin has no profile
 * table at all, so an address is the whole of it.
 */
export type CreateUserInput =
  | {
      role: 'STUDENT';
      email: string;
      studentCode: string;
      fullName: string;
      majorId?: number;
      class?: string;
      phone?: string;
    }
  | {
      role: 'LECTURER';
      email: string;
      lecturerCode: string;
      fullName: string;
      academicTitle?: string;
      researchInterests?: string;
      phone?: string;
    }
  | { role: 'ADMIN'; email: string };

/**
 * The account is created with a temporary password and the credentials are
 * emailed — nothing comes back here that could be shown on screen, and that is
 * deliberate: a password that appears in a browser is one that ends up in a
 * screenshot.
 */
export function useCreateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api<UserAccount>('/users', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

/** The three things about an account that are not the person: address, role, access. */
export interface UserPatch {
  email?: string;
  role?: Role;
  isActive?: boolean;
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: ({ id, ...patch }: UserPatch & { id: number }) =>
      api<UserAccount>(`/users/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: invalidate,
  });
}

/**
 * Named for what it does rather than for the verb in the URL.
 *
 * `DELETE /users/:id` does not delete anything: it clears the account's refresh
 * tokens and marks it inactive, and refuses outright if it already is. Nothing
 * in this system removes a person — every group, grade and topic points at their
 * profile, so a real deletion would take somebody else's history with it. Calling
 * this `useDeleteUser` was how a screen came to promise "xoá vĩnh viễn" for an
 * action that locks the door and keeps the room.
 */
export function useDeactivateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

/**
 * Issue a new temporary password and email it.
 *
 * The response carries no password either, for the same reason as creation —
 * and this is the route out of the one failure mode a roster import can leave
 * behind: an account whose credentials email never arrived.
 */
export function useResetUserPassword() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/users/${id}/reset-password`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });
}

/**
 * A roster, uploaded as a spreadsheet.
 *
 * Sent as FormData so the browser writes its own multipart boundary. One bad
 * row never fails the batch — the result reports each refusal separately, which
 * is the only way an office can fix a file of three hundred lines.
 */
export function useBulkImportUsers() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('file', file);

      return api<BulkImportResult>('/users/bulk-import', {
        method: 'POST',
        body,
      });
    },
    onSuccess: invalidate,
  });
}

/**
 * One account in full, for the screen that edits its profile.
 *
 * Fetched rather than taken from the list row, because the list deliberately
 * carries only what a table shows — the phone number, the research interests and
 * the office's private note are none of a roster's business.
 */
export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: [...userKeys.all, 'detail', id],
    queryFn: () => api<UserDetail>(`/users/${id!}`),
    enabled: id !== undefined,
  });
}

/**
 * The profile, replaced whole.
 *
 * Both endpoints are a PUT and take every field, so a partial edit has to send
 * what it is not changing — the dialog loads the profile first for exactly that
 * reason. They also refuse a profile whose role does not match the account, which
 * is why there is one hook per role rather than one that guesses.
 */
export function useUpsertStudentProfile() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: ({ id, ...input }: StudentProfileInput & { id: number }) =>
      api<StudentProfileDetail>(`/users/${id}/student-profile`, {
        method: 'PUT',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useUpsertLecturerProfile() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: ({ id, ...input }: LecturerProfileInput & { id: number }) =>
      api<LecturerProfileDetail>(`/users/${id}/lecturer-profile`, {
        method: 'PUT',
        body: input,
      }),
    onSuccess: async () => {
      await invalidate();
      // The mentoring quota decides whether this lecturer may accept another
      // proposal, and it is read by the directory the proposal form picks from
      // and by their own profile screen.
      await queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      await queryClient.invalidateQueries({ queryKey: ['me', 'profile'] });
    },
  });
}
