import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { searchProviders } from '@/repositories/providers.repository';

export function useProviderSearch(query: string) {
  const { user } = useAuth();
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['providers', 'search', user?.id, trimmed],
    queryFn: () => searchProviders(user!.id, trimmed),
    enabled: Boolean(user) && trimmed.length > 0,
  });
}
