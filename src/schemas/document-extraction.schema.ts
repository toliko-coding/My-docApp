import { z } from 'zod';

/**
 * Hard contract for AI/OCR structured output. Every DocumentProcessor
 * implementation (mock or real) MUST return data that satisfies this schema
 * before it is allowed to reach the review screen or the database — no
 * provider is allowed to hand the app free-form text instead of this shape.
 *
 * Every extracted field is paired with a 0..1 confidence. The review screen
 * (Phase 4) uses CONFIDENCE_THRESHOLD to decide whether to show a value as
 * fact or ask the user to confirm/edit it.
 */

export const CONFIDENCE_THRESHOLD = 0.85;

const confidence = z.number().min(0).max(1);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected ISO date (YYYY-MM-DD)');

const withConfidence = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ value, confidence });

export const documentTypeSchema = z.enum([
  'bill',
  'receipt',
  'tax_invoice',
  'payment_demand',
  'other',
]);

// Deliberately not a hardcoded enum: new categories must be addable without
// a schema change, so this stays a free string validated against the
// categories table (system + user-defined) at the repository layer instead.
export const categoryKeySchema = z.string().min(1);

export const billingPeriodSchema = z
  .object({
    start: isoDate,
    end: isoDate,
    confidence,
  })
  .nullable();

export const documentExtractionResultSchema = z.object({
  documentType: withConfidence(documentTypeSchema).nullable(),
  provider: withConfidence(z.string().min(1)).nullable(),
  category: withConfidence(categoryKeySchema).nullable(),
  amount: withConfidence(z.number().nonnegative()).nullable(),
  currency: z.string().length(3).default('ILS'),
  amountBeforeVat: withConfidence(z.number().nonnegative()).nullable(),
  amountAfterVat: withConfidence(z.number().nonnegative()).nullable(),
  issueDate: withConfidence(isoDate).nullable(),
  dueDate: withConfidence(isoDate).nullable(),
  billingPeriod: billingPeriodSchema,
  invoiceNumber: withConfidence(z.string().min(1)).nullable(),
  customerNumber: withConfidence(z.string().min(1)).nullable(),
  referenceNumber: withConfidence(z.string().min(1)).nullable(),
  paymentMethod: withConfidence(z.string().min(1)).nullable(),
  isPaid: withConfidence(z.boolean()).nullable(),
  paidDate: withConfidence(isoDate).nullable(),
  rawText: z.string(), // full OCR text, kept for debugging and re-processing
});

export type DocumentExtractionResult = z.infer<typeof documentExtractionResultSchema>;
export type FieldWithConfidence<T> = { value: T; confidence: number };

/** True when a field's confidence is below the threshold and must be confirmed by the user. */
export function needsReview(field: { confidence: number } | null): boolean {
  return field === null || field.confidence < CONFIDENCE_THRESHOLD;
}

/** Parses and validates a provider's raw output, throwing a descriptive error if it doesn't match the contract. */
export function parseDocumentExtractionResult(raw: unknown): DocumentExtractionResult {
  return documentExtractionResultSchema.parse(raw);
}
