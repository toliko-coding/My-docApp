import * as Crypto from 'expo-crypto';

import type { DocumentSource } from '@/types/database';

/** A file selected by the user, before upload — normalized across the camera, gallery, and PDF pickers. */
export interface PickedFile {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  source: DocumentSource;
}

/** Must match the `documents` bucket's allowed_mime_types in supabase/migrations/0002_storage.sql. */
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
  'application/pdf',
] as const;

/** Must match the `documents` bucket's file_size_limit in supabase/migrations/0002_storage.sql. */
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export function isAllowedDocumentMimeType(mimeType: string): boolean {
  return (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType);
}

export class FileValidationError extends Error {}

export function assertValidDocumentFile(mimeType: string, fileSize: number): void {
  if (!isAllowedDocumentMimeType(mimeType)) {
    throw new FileValidationError(`Unsupported file type: ${mimeType}`);
  }
  if (fileSize > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new FileValidationError('File is too large (max 20 MB).');
  }
  if (fileSize <= 0) {
    throw new FileValidationError('File appears to be empty.');
  }
}

/**
 * Reads a picked file's bytes via fetch() rather than expo-file-system —
 * some content:// URIs handed back by the Android document/media pickers
 * (especially DocumentPicker's copyToCacheDirectory copies) aren't
 * consistently readable through the native filesystem module, but fetch's
 * OkHttp-backed content resolver handles them reliably.
 */
export async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  // expo-crypto's native digest() needs a real TypedArray view to attach to
  // over JSI — a plain ArrayBuffer (e.g. from fetch().arrayBuffer()) isn't
  // accepted directly on Android ("no ArrayBuffer attached").
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(buffer));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** A SHA-256 content fingerprint, used for duplicate detection. */
export async function computeFileHash(uri: string): Promise<string> {
  return hashArrayBuffer(await readFileAsArrayBuffer(uri));
}

/** Fallback for the rare case a picker doesn't report a mimeType (seen on some web/Android combos). */
export function guessMimeTypeFromUri(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase().split('?')[0];
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'image/jpeg';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
