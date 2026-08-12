-- ============================================================================
-- Private storage bucket for original uploaded documents. The bucket is NOT
-- public — every read goes through a short-lived signed URL generated
-- server-side (see src/repositories/documents.repository.ts), and RLS on
-- storage.objects still enforces per-user ownership as defense in depth.
--
-- Convention: objects are stored at `${auth.uid()}/${documentId}/${fileName}`
-- so the folder-name-based policies below are all we need.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520, -- 20 MB per file
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "documents bucket: owner read" on storage.objects
  for select using (
    bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents bucket: owner insert" on storage.objects
  for insert with check (
    bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents bucket: owner delete" on storage.objects
  for delete using (
    bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
  );
