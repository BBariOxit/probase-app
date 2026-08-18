'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { groupKeys } from '@/lib/api/registration';
import type { MyProfile, UpdateMyProfileInput } from '@/lib/api/types';
import { useSession } from '@/lib/auth/session';

export const meKeys = {
  profile: ['me', 'profile'] as const,
};

/**
 * The signed-in user's own profile.
 *
 * Separate from the session on purpose. The session is rebuilt on every reload
 * and is deliberately small — id, address, role, name, picture — while this is
 * everything the account screen shows, asked for by the one screen that shows
 * it.
 */
export function useMyProfile() {
  return useQuery({
    queryKey: meKeys.profile,
    queryFn: () => api<MyProfile>('/me/profile'),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) =>
      api<MyProfile>('/me/profile', { method: 'PATCH', body: input }),
    onSuccess: (profile) => queryClient.setQueryData(meKeys.profile, profile),
  });
}

/**
 * Both avatar mutations end the same way, because a picture is not only on the
 * account screen: it is in the header on every page, and in the roster of a
 * group whose members were fetched long before this upload. The session copy is
 * patched directly — it is one string and re-fetching it would mean an extra
 * round trip to learn what the response already said — while the group cache is
 * invalidated, since somebody else's row is not ours to rewrite.
 */
function useAvatarMutation<TVariables>(
  send: (variables: TVariables) => Promise<{ avatarUrl: string | null }>,
) {
  const queryClient = useQueryClient();
  const patchUser = useSession((state) => state.patchUser);

  return useMutation({
    mutationFn: send,
    onSuccess: async ({ avatarUrl }) => {
      patchUser({ avatarUrl });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meKeys.profile }),
        queryClient.invalidateQueries({ queryKey: groupKeys.all }),
      ]);
    },
  });
}

export function useUploadAvatar() {
  return useAvatarMutation((file: File) => {
    const form = new FormData();
    form.append('file', file);

    return api<{ avatarUrl: string | null }>('/me/avatar', {
      method: 'POST',
      body: form,
    });
  });
}

export function useRemoveAvatar() {
  return useAvatarMutation(() =>
    api<{ avatarUrl: string | null }>('/me/avatar', { method: 'DELETE' }),
  );
}
