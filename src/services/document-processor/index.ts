import { AnthropicDocumentProcessor } from './anthropic-provider';
import { MockDocumentProcessor } from './mock-provider';
import type { DocumentProcessor } from './types';

export type { DocumentProcessor, DocumentProcessorInput } from './types';
export { DocumentProcessingError } from './types';

/**
 * Provider selection point. Real vendors get added here as their own
 * `${vendor}-provider.ts` file (e.g. GoogleDocumentAiProcessor) and picked
 * via EXPO_PUBLIC_DOCUMENT_PROCESSOR — never hardcode a single vendor
 * elsewhere in the app. Falls back to the mock provider in development only
 * so Phase 3/4 UI work isn't blocked on having a paid OCR account yet.
 */
export function getDocumentProcessor(): DocumentProcessor | null {
  const configured = process.env.EXPO_PUBLIC_DOCUMENT_PROCESSOR;

  switch (configured) {
    case 'anthropic':
      return new AnthropicDocumentProcessor();
    // case 'google-document-ai': return new GoogleDocumentAiProcessor();
    // case 'openai-vision': return new OpenAiVisionProcessor();
    default:
      if (__DEV__) return new MockDocumentProcessor();
      return null;
  }
}
