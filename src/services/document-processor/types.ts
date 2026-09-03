import type { DocumentExtractionResult } from '@/schemas/document-extraction.schema';

export interface DocumentProcessorInput {
  /**
   * Id of an already-uploaded `documents` row. A provider is expected to
   * fetch the file itself server-side (e.g. a Supabase Edge Function
   * reading private Storage under the caller's own RLS-scoped session) —
   * the app never ships raw file bytes to a third-party vendor directly
   * from the client, since that would require embedding a vendor API key
   * in the mobile bundle.
   */
  documentId: string;
  /** BCP-47 language hints to prioritize during OCR, e.g. ['he', 'en']. */
  languageHints?: string[];
}

/**
 * Provider-agnostic contract for turning a document into structured data.
 * Swapping OCR/AI vendors (Google Document AI, AWS Textract, Azure Document
 * Intelligence, OpenAI Vision, Gemini, ...) means writing a new class that
 * implements this interface — nothing else in the app changes.
 */
export interface DocumentProcessor {
  /** Machine-readable id, stored on document_extractions.ai_provider for auditing. */
  readonly id: string;
  process(input: DocumentProcessorInput): Promise<DocumentExtractionResult>;
}

export class DocumentProcessingError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'DocumentProcessingError';
  }
}
