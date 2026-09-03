import { supabase } from '@/lib/supabase';
import { documentExtractionResultSchema, type DocumentExtractionResult } from '@/schemas/document-extraction.schema';

import { DocumentProcessingError } from './types';
import type { DocumentProcessor, DocumentProcessorInput } from './types';

/**
 * Calls the `process-document` Supabase Edge Function, which holds the
 * Anthropic API key server-side and does the actual vision + structured-
 * extraction call. This class never talks to Anthropic directly — no
 * third-party vendor key is ever present in the mobile bundle.
 */
export class AnthropicDocumentProcessor implements DocumentProcessor {
  readonly id = 'anthropic';

  async process(input: DocumentProcessorInput): Promise<DocumentExtractionResult> {
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: { documentId: input.documentId, languageHints: input.languageHints },
    });

    if (error) {
      throw new DocumentProcessingError('Document processing failed.', error);
    }

    try {
      return documentExtractionResultSchema.parse(data);
    } catch (parseError) {
      throw new DocumentProcessingError('The AI returned data in an unexpected shape.', parseError);
    }
  }
}
