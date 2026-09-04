import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  assertValidDocumentFile,
  FileValidationError,
  formatFileSize,
  guessMimeTypeFromUri,
  isAllowedDocumentMimeType,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from '@/utils/file';

describe('isAllowedDocumentMimeType', () => {
  it('accepts every type in the allow-list', () => {
    for (const type of ALLOWED_DOCUMENT_MIME_TYPES) {
      expect(isAllowedDocumentMimeType(type)).toBe(true);
    }
  });

  it('rejects an unsupported type', () => {
    expect(isAllowedDocumentMimeType('application/zip')).toBe(false);
  });
});

describe('assertValidDocumentFile', () => {
  it('passes for an allowed type within the size limit', () => {
    expect(() => assertValidDocumentFile('image/jpeg', 1024)).not.toThrow();
  });

  it('rejects a disallowed mime type', () => {
    expect(() => assertValidDocumentFile('application/zip', 1024)).toThrow(FileValidationError);
  });

  it('rejects a file over the size limit', () => {
    expect(() => assertValidDocumentFile('image/png', MAX_DOCUMENT_FILE_SIZE_BYTES + 1)).toThrow(
      FileValidationError,
    );
  });

  it('accepts a file exactly at the size limit', () => {
    expect(() => assertValidDocumentFile('image/png', MAX_DOCUMENT_FILE_SIZE_BYTES)).not.toThrow();
  });

  it('rejects an empty file', () => {
    expect(() => assertValidDocumentFile('image/png', 0)).toThrow(FileValidationError);
  });

  it('rejects a negative file size', () => {
    expect(() => assertValidDocumentFile('image/png', -1)).toThrow(FileValidationError);
  });
});

describe('guessMimeTypeFromUri', () => {
  it('maps known extensions', () => {
    expect(guessMimeTypeFromUri('file:///a/b.png')).toBe('image/png');
    expect(guessMimeTypeFromUri('file:///a/b.heic')).toBe('image/heic');
    expect(guessMimeTypeFromUri('file:///a/b.webp')).toBe('image/webp');
    expect(guessMimeTypeFromUri('file:///a/b.pdf')).toBe('application/pdf');
  });

  it('ignores a query string when reading the extension', () => {
    expect(guessMimeTypeFromUri('https://example.com/a/b.pdf?token=abc')).toBe('application/pdf');
  });

  it('is case-insensitive', () => {
    expect(guessMimeTypeFromUri('file:///a/b.PDF')).toBe('application/pdf');
  });

  it('falls back to jpeg for an unknown or missing extension', () => {
    expect(guessMimeTypeFromUri('file:///a/b.unknown')).toBe('image/jpeg');
    expect(guessMimeTypeFromUri('file:///a/b')).toBe('image/jpeg');
  });
});

describe('formatFileSize', () => {
  it('shows bytes under 1 KB', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('shows whole kilobytes between 1 KB and 1 MB', () => {
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('shows one decimal of megabytes at 1 MB and above', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
  });
});
