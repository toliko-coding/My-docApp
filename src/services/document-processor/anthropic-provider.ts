import { supabase } from '@/lib/supabase';
import { documentExtractionResultSchema, type DocumentExtractionResult } from '@/schemas/document-extraction.schema';

import { DocumentProcessingError } from './types';
import type { DocumentProcessor, DocumentProcessorInput } from './types';

/**
 * Calls the `process-document` Supabase Edge Function, which holds the
 * Anthropic API key server-side and does the actual vision + structured-
 * extraction call. This class never talks to Anthropic directly — no
 * third-party vendor key is ever present in the mobile bundle.
 *
 * Uses a plain fetch rather than supabase-js's `functions.invoke` so a
 * non-2xx response's JSON body (the actual failure reason, e.g. an
 * Anthropic billing error) can be read reliably — `invoke`'s thrown
 * FunctionsHttpError wraps that body in a way that isn't consistently
 * readable across supabase-js/React Native fetch-polyfill versions.
 */
export class AnthropicDocumentProcessor implements DocumentProcessor {
  readonly id = 'anthropic';

  async process(input: DocumentProcessorInput): Promise<DocumentExtractionResult> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new DocumentProcessingError('You must be signed in to process a document.');
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId: input.documentId, languageHints: input.languageHints }),
    });

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message = typeof (body as { error?: unknown })?.error === 'string' ? (body as { error: string }).error : null;
      throw new DocumentProcessingError(message ?? `Document processing failed (${response.status}).`);
    }

    try {
      return documentExtractionResultSchema.parse(body);
    } catch (parseError) {
      throw new DocumentProcessingError('The AI returned data in an unexpected shape.', parseError);
    }
  }
}
