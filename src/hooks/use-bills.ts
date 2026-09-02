import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import {
  createBill,
  deleteBill,
  getBill,
  listBills,
  markBillPaid,
  markBillUnpaid,
  updateBill,
  type BillFilters,
  type BillPatch,
  type NewBillInput,
} from '@/repositories/bills.repository';

function billsKey(userId: string | undefined, filters: BillFilters) {
  return ['bills', userId, filters] as const;
}

export function useBills(filters: BillFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: billsKey(user?.id, filters),
    queryFn: () => listBills(filters),
    enabled: Boolean(user),
  });
}

export function useBill(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bill', user?.id, id],
    queryFn: () => getBill(id!),
    enabled: Boolean(user) && Boolean(id),
  });
}

function useInvalidateBills() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return (billId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['bills', user?.id] });
    if (billId) queryClient.invalidateQueries({ queryKey: ['bill', user?.id, billId] });
  };
}

export function useCreateBill() {
  const { user } = useAuth();
  const invalidate = useInvalidateBills();

  return useMutation({
    mutationFn: (input: Omit<NewBillInput, 'user_id'>) => createBill({ ...input, user_id: user!.id }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateBill(id: string) {
  const invalidate = useInvalidateBills();

  return useMutation({
    mutationFn: (patch: BillPatch) => updateBill(id, patch),
    onSuccess: () => invalidate(id),
  });
}

export function useDeleteBill() {
  const invalidate = useInvalidateBills();

  return useMutation({
    mutationFn: (id: string) => deleteBill(id),
    onSuccess: () => invalidate(),
  });
}

export function useMarkBillPaid() {
  const invalidate = useInvalidateBills();

  return useMutation({
    mutationFn: ({ id, paidDate, paymentMethod }: { id: string; paidDate: string; paymentMethod?: string | null }) =>
      markBillPaid(id, paidDate, paymentMethod),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useMarkBillUnpaid() {
  const invalidate = useInvalidateBills();

  return useMutation({
    mutationFn: (id: string) => markBillUnpaid(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}
