import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { getProfile, updateProfile, type ProfilePatch } from '@/repositories/profiles.repository';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: Boolean(user),
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: ProfilePatch) => updateProfile(user!.id, patch),
    onSuccess: (profile) => queryClient.setQueryData(['profile', user?.id], profile),
  });
}
