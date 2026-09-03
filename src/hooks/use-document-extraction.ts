import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import {
  confirmExtraction,
  getLatestExtraction,
  saveExtraction,
  type ExtractionConfirmPatch,
} from '@/repositories/document-extractions.repository';
import { setDocumentStatus } from '@/repositories/documents.repository';
import { getDocumentProcessor } from '@/services/document-processor';
import { DocumentProcessingError } from '@/services/document-processor/types';

function extractionKey(userId: string | undefined, documentId: string | undefined) {
  return ['document-extraction', userId, documentId] as const;
}

export function useDocumentExtraction(documentId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: extractionKey(user?.id, documentId),
    queryFn: () => getLatestExtraction(documentId!),
    enabled: Boolean(user) && Boolean(documentId),
  });
}

/** Runs the configured DocumentProcessor against an uploaded document and persists the result. */
export function useProcessDocument() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const processor = getDocumentProcessor();
      if (!processor) {
        throw new DocumentProcessingError('No document processor is configured.');
      }

      await setDocumentStatus(documentId, 'processing');
      try {
        const result = await processor.process({ documentId, languageHints: ['he', 'en'] });
        const extraction = await saveExtraction({ userId: user!.id, documentId, aiProvider: processor.id, result });
        await setDocumentStatus(documentId, 'processed');
        return extraction;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Processing failed.';
        await setDocumentStatus(documentId, 'failed', message);
        throw error;
      }
    },
    onSuccess: (extraction) => {
      queryClient.setQueryData(extractionKey(user?.id, extraction.document_id), extraction);
      queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
    },
  });
}

export function useConfirmExtraction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ExtractionConfirmPatch }) => confirmExtraction(id, patch),
    onSuccess: (extraction) => {
      queryClient.setQueryData(extractionKey(user?.id, extraction.document_id), extraction);
    },
  });
}
