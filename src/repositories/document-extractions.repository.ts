import { supabase } from '@/lib/supabase';
import type { DocumentExtractionResult } from '@/schemas/document-extraction.schema';
import type { DocumentExtraction, ExtractionConfidence } from '@/types/database';
import { normalizeProviderName } from '@/utils/category';

/** The most recent extraction attempt for a document, if any (a document may be reprocessed). */
export async function getLatestExtraction(documentId: string): Promise<DocumentExtraction | null> {
  const { data, error } = await supabase
    .from('document_extractions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Exact-match only — never creates a new category. A guess the AI got wrong just leaves category unset for the user to pick. */
async function resolveCategoryId(userId: string, key: string | null): Promise<string | null> {
  if (!key) return null;
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq('key', key)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Exact normalized-name match only — provider *creation* stays findOrCreateProvider's job at bill-save time, same as manual entry. */
async function resolveProviderId(userId: string, name: string | null): Promise<string | null> {
  if (!name) return null;
  const { data, error } = await supabase
    .from('providers')
    .select('id')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq('normalized_name', normalizeProviderName(name))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export interface SaveExtractionInput {
  userId: string;
  documentId: string;
  aiProvider: string;
  result: DocumentExtractionResult;
}

/** Persists a validated AI extraction result, best-effort-resolving provider/category to existing rows. */
export async function saveExtraction(input: SaveExtractionInput): Promise<DocumentExtraction> {
  const { userId, documentId, aiProvider, result } = input;

  const [categoryId, providerId] = await Promise.all([
    resolveCategoryId(userId, result.category?.value ?? null),
    resolveProviderId(userId, result.provider?.value ?? null),
  ]);

  const confidence: ExtractionConfidence = {
    provider: result.provider?.confidence,
    category: result.category?.confidence,
    amount: result.amount?.confidence,
    issueDate: result.issueDate?.confidence,
    dueDate: result.dueDate?.confidence,
    billingPeriod: result.billingPeriod?.confidence,
    invoiceNumber: result.invoiceNumber?.confidence,
    customerNumber: result.customerNumber?.confidence,
  };

  const { data, error } = await supabase
    .from('document_extractions')
    .insert({
      document_id: documentId,
      user_id: userId,
      ai_provider: aiProvider,
      document_type: result.documentType?.value ?? null,
      provider_name_raw: result.provider?.value ?? null,
      provider_id: providerId,
      category_id: categoryId,
      amount: result.amount?.value ?? null,
      currency: result.currency,
      amount_before_vat: result.amountBeforeVat?.value ?? null,
      amount_after_vat: result.amountAfterVat?.value ?? null,
      issue_date: result.issueDate?.value ?? null,
      due_date: result.dueDate?.value ?? null,
      billing_period_start: result.billingPeriod?.start ?? null,
      billing_period_end: result.billingPeriod?.end ?? null,
      invoice_number: result.invoiceNumber?.value ?? null,
      customer_number: result.customerNumber?.value ?? null,
      reference_number: result.referenceNumber?.value ?? null,
      payment_method: result.paymentMethod?.value ?? null,
      is_paid: result.isPaid?.value ?? null,
      paid_date: result.paidDate?.value ?? null,
      raw_ocr_text: result.rawText,
      confidence,
      review_status: 'pending_review',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Fields the review screen lets the user correct before confirming — everything else on the row is left as extracted. */
export interface ExtractionConfirmPatch {
  provider_name_raw: string | null;
  provider_id: string | null;
  category_id: string | null;
  amount: number | null;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
}

export async function confirmExtraction(id: string, patch: ExtractionConfirmPatch): Promise<DocumentExtraction> {
  const { data, error } = await supabase
    .from('document_extractions')
    .update({ ...patch, review_status: 'confirmed' })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
