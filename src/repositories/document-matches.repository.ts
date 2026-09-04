import { supabase } from '@/lib/supabase';
import type { BillWithRelations, DocumentMatch, MatchStatus, MatchType } from '@/types/database';

const WITH_RELATIONS = '*, provider:providers(*), category:categories(*)';

// Bill amounts extracted from a receipt vs. the original bill sometimes
// differ by a few agorot due to rounding — a small absolute tolerance
// avoids missing an otherwise-obvious match over a rounding difference.
const AMOUNT_TOLERANCE = 1;

export interface PotentialMatchQuery {
  providerId: string;
  amount: number;
  dueDate: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
}

/**
 * Existing bills that plausibly refer to the same real-world charge: same
 * provider, amount within a small tolerance, and either the exact same
 * billing period or the exact same due date. Deliberately conservative
 * (exact date agreement, not a loose date-range overlap) to avoid false
 * positives — a missed match just means the user gets no suggestion, a
 * wrong one means an incorrect "mark as paid" or "duplicate" prompt.
 */
export async function findPotentialBillMatches(
  query: PotentialMatchQuery,
  excludeBillId?: string,
): Promise<BillWithRelations[]> {
  let dbQuery = supabase
    .from('bills')
    .select(WITH_RELATIONS)
    .eq('provider_id', query.providerId)
    .gte('amount', query.amount - AMOUNT_TOLERANCE)
    .lte('amount', query.amount + AMOUNT_TOLERANCE);

  if (excludeBillId) {
    dbQuery = dbQuery.neq('id', excludeBillId);
  }

  const { data, error } = await dbQuery;
  if (error) throw error;
  const rows = (data ?? []) as unknown as BillWithRelations[];

  const samePeriod = (bill: BillWithRelations) =>
    Boolean(
      query.billingPeriodStart &&
        query.billingPeriodEnd &&
        bill.billing_period_start === query.billingPeriodStart &&
        bill.billing_period_end === query.billingPeriodEnd,
    );
  const sameDueDate = (bill: BillWithRelations) => Boolean(query.dueDate && bill.due_date === query.dueDate);

  return rows.filter((bill) => samePeriod(bill) || sameDueDate(bill));
}

export interface CreateMatchInput {
  userId: string;
  billId: string;
  documentId: string;
  matchType: MatchType;
  confidence: number;
  matchedFields: Record<string, boolean>;
  status?: MatchStatus;
}

export async function createDocumentMatch(input: CreateMatchInput): Promise<DocumentMatch> {
  const { data, error } = await supabase
    .from('document_matches')
    .insert({
      user_id: input.userId,
      bill_id: input.billId,
      document_id: input.documentId,
      match_type: input.matchType,
      confidence: input.confidence,
      matched_fields: input.matchedFields,
      status: input.status ?? 'suggested',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocumentMatchStatus(id: string, status: MatchStatus): Promise<DocumentMatch> {
  const { data, error } = await supabase.from('document_matches').update({ status }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}
