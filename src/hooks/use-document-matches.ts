import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import {
  createDocumentMatch,
  findPotentialBillMatches,
  updateDocumentMatchStatus,
  type CreateMatchInput,
  type PotentialMatchQuery,
} from '@/repositories/document-matches.repository';
import type { MatchStatus } from '@/types/database';

/** Existing bills that might be the same real-world charge as the given (provider, amount, dates). */
export function usePotentialBillMatches(query: PotentialMatchQuery | null, excludeBillId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bill-matches', user?.id, query, excludeBillId],
    queryFn: () => findPotentialBillMatches(query!, excludeBillId),
    enabled: Boolean(user) && Boolean(query),
  });
}

export function useCreateDocumentMatch() {
  return useMutation({
    mutationFn: (input: CreateMatchInput) => createDocumentMatch(input),
  });
}

export function useUpdateDocumentMatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MatchStatus }) => updateDocumentMatchStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bills'] }),
  });
}
