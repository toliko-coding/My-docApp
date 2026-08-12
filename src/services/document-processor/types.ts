import type { DocumentExtractionResult } from '@/schemas/document-extraction.schema';

export interface DocumentProcessorInput {
  /** Local file URI (camera/gallery/picker) or a readable remote URL. */
  uri: string;
  mimeType: string;
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
