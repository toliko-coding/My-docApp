import { documentExtractionResultSchema, type DocumentExtractionResult } from '@/schemas/document-extraction.schema';

import type { DocumentProcessor, DocumentProcessorInput } from './types';

/**
 * DEVELOPMENT-ONLY provider. It always returns the same, clearly-fake,
 * low-confidence sample so the review screen is exercisable before any real
 * OCR/AI vendor is wired up in Phase 4. It must never be selected outside
 * __DEV__ (see index.ts) and must never be presented to the user as a real
 * result — every field is deliberately below CONFIDENCE_THRESHOLD.
 */
export class MockDocumentProcessor implements DocumentProcessor {
  readonly id = 'mock-dev-provider';

  async process(_input: DocumentProcessorInput): Promise<DocumentExtractionResult> {
    const sample = {
      documentType: { value: 'bill', confidence: 0.6 },
      provider: { value: 'Sample Provider (mock)', confidence: 0.5 },
      category: { value: 'electricity', confidence: 0.5 },
      amount: { value: 0, confidence: 0.3 },
      currency: 'ILS',
      amountBeforeVat: null,
      amountAfterVat: null,
      issueDate: null,
      dueDate: null,
      billingPeriod: null,
      invoiceNumber: null,
      customerNumber: null,
      referenceNumber: null,
      paymentMethod: null,
      isPaid: null,
      paidDate: null,
      rawText: '[MOCK PROVIDER] No real OCR ran — this is placeholder development data.',
    } satisfies DocumentExtractionResult;

    return documentExtractionResultSchema.parse(sample);
  }
}
