import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import {
  deleteDocument,
  getDocument,
  getDocumentSignedUrl,
  listDocuments,
  uploadDocument,
  type DocumentUploadInput,
} from '@/repositories/documents.repository';
import type { DocumentRow } from '@/types/database';

export function useDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['documents', user?.id],
    queryFn: () => listDocuments(),
    enabled: Boolean(user),
  });
}

export function useDocument(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['document', user?.id, id],
    queryFn: () => getDocument(id!),
    enabled: Boolean(user) && Boolean(id),
  });
}

export function useDocumentSignedUrl(storagePath: string | undefined) {
  return useQuery({
    queryKey: ['document-signed-url', storagePath],
    queryFn: () => getDocumentSignedUrl(storagePath!),
    enabled: Boolean(storagePath),
    // Signed URLs are valid for an hour server-side; stop treating ours as fresh a bit before that.
    staleTime: 50 * 60 * 1000,
  });
}

export function useUploadDocument() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DocumentUploadInput) => uploadDocument(user!.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', user?.id] }),
  });
}

export function useDeleteDocument() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: Pick<DocumentRow, 'id' | 'storage_path'>) => deleteDocument(document),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', user?.id] }),
  });
}
