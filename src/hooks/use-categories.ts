import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { listCategories } from '@/repositories/categories.repository';

export function useCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => listCategories(user!.id),
    enabled: Boolean(user),
  });
}
