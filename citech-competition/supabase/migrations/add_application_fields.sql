-- ============================================================
-- Migration: Application fields for dietary + resume upload
-- ============================================================

ALTER TABLE public.comp_participants
  ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;

ALTER TABLE public.comp_participants
  ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Resume storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('comp-resumes', 'comp-resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket policies
DROP POLICY IF EXISTS "comp_resumes_insert_own" ON storage.objects;
CREATE POLICY "comp_resumes_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comp-resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "comp_resumes_update_own" ON storage.objects;
CREATE POLICY "comp_resumes_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'comp-resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'comp-resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "comp_resumes_delete_own" ON storage.objects;
CREATE POLICY "comp_resumes_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'comp-resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
