import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { getUserSettings, updateUserSettings, type UserSettingsPatch } from '@/repositories/user-settings.repository';

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: () => getUserSettings(user!.id),
    enabled: Boolean(user),
  });
}

export function useUpdateUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UserSettingsPatch) => updateUserSettings(user!.id, patch),
    onSuccess: (settings) => queryClient.setQueryData(['user-settings', user?.id], settings),
  });
}
