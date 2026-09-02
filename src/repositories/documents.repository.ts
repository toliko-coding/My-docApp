import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import type { DocumentRow, DocumentSource } from '@/types/database';
import { assertValidDocumentFile, hashArrayBuffer, readFileAsArrayBuffer } from '@/utils/file';

const BUCKET = 'documents';

export interface DocumentUploadInput {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  source: DocumentSource;
}

export interface DocumentUploadResult {
  document: DocumentRow;
  /** True when a document with the same content hash already existed — `document` is that existing row, nothing new was uploaded. */
  isDuplicate: boolean;
}

/**
 * Uploads a picked file to the private `documents` bucket and records it.
 * Storage objects live at `${userId}/${documentId}/${fileName}` per the
 * bucket's RLS policies (supabase/migrations/0002_storage.sql), so the
 * document id is generated client-side before the upload.
 */
export async function uploadDocument(userId: string, input: DocumentUploadInput): Promise<DocumentUploadResult> {
  assertValidDocumentFile(input.mimeType, input.fileSize);

  const fileBuffer = await readFileAsArrayBuffer(input.uri);
  const fileHash = await hashArrayBuffer(fileBuffer);

  const { data: existing, error: findError } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('file_hash', fileHash)
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return { document: existing, isDuplicate: true };

  const documentId = Crypto.randomUUID();
  const storagePath = `${userId}/${documentId}/${input.fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType: input.mimeType, upsert: false });
  if (uploadError) throw uploadError;

  const { data: document, error: insertError } = await supabase
    .from('documents')
    .insert({
      id: documentId,
      user_id: userId,
      storage_path: storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType,
      file_size: input.fileSize,
      file_hash: fileHash,
      source: input.source,
      status: 'uploaded',
    })
    .select('*')
    .single();
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw insertError;
  }

  return { document, isDuplicate: false };
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** A short-lived signed URL for viewing/downloading a private document. */
export async function getDocumentSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(document: Pick<DocumentRow, 'id' | 'storage_path'>): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([document.storage_path]);
  if (storageError) throw storageError;
  const { error: dbError } = await supabase.from('documents').delete().eq('id', document.id);
  if (dbError) throw dbError;
}
