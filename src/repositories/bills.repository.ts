import { supabase } from '@/lib/supabase';
import type { Bill, BillStatus, BillWithRelations } from '@/types/database';

const WITH_RELATIONS = '*, provider:providers(*), category:categories(*)';

export interface BillFilters {
  /** 'overdue' is a derived display status (see utils/bill-status), not stored — filtering by it means "pending AND past due". */
  status?: BillStatus | null;
  categoryId?: string | null;
  search?: string | null;
}

export async function listBills(filters: BillFilters = {}): Promise<BillWithRelations[]> {
  let query = supabase
    .from('bills')
    .select(WITH_RELATIONS)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (filters.status === 'overdue') {
    query = query.eq('status', 'pending').lt('due_date', new Date().toISOString().slice(0, 10));
  } else if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []) as unknown as BillWithRelations[];

  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    if (needle) {
      rows = rows.filter(
        (bill) =>
          bill.provider?.name.toLowerCase().includes(needle) ||
          bill.notes?.toLowerCase().includes(needle) ||
          bill.invoice_number?.toLowerCase().includes(needle),
      );
    }
  }

  return rows;
}

export async function getBill(id: string): Promise<BillWithRelations | null> {
  const { data, error } = await supabase.from('bills').select(WITH_RELATIONS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as unknown as BillWithRelations | null;
}

export type NewBillInput = Omit<Bill, 'id' | 'created_at' | 'updated_at'>;

export async function createBill(input: NewBillInput): Promise<Bill> {
  const { data, error } = await supabase.from('bills').insert(input).select('*').single();
  if (error) throw error;
  return data;
}

export type BillPatch = Partial<Omit<Bill, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export async function updateBill(id: string, patch: BillPatch): Promise<Bill> {
  const { data, error } = await supabase.from('bills').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteBill(id: string): Promise<void> {
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
}

export async function markBillPaid(
  id: string,
  paidDate: string,
  paymentMethod?: string | null,
): Promise<Bill> {
  return updateBill(id, { status: 'paid', paid_date: paidDate, payment_method: paymentMethod ?? null });
}

export async function markBillUnpaid(id: string): Promise<Bill> {
  return updateBill(id, { status: 'pending', paid_date: null });
}
