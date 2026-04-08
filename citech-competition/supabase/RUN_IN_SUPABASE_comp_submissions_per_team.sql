-- ============================================================
-- Paste this ENTIRE file into Supabase SQL Editor and Run once.
-- Order: backup → DROP policies FIRST (fixes participant_id drop) → data → column drop → new policies
-- Safe to re-run only if migration did not fully complete; if already done, skip (see bottom).
-- ============================================================

BEGIN;

-- Backup (current row shape)
DROP TABLE IF EXISTS public.comp_submissions_migration_backup;
CREATE TABLE public.comp_submissions_migration_backup AS
SELECT * FROM public.comp_submissions;

-- MUST run before DROP COLUMN participant_id: policies reference that column
DROP POLICY IF EXISTS "comp_submissions_select" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_insert" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_update" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_delete" ON public.comp_submissions;

ALTER TABLE public.comp_submissions
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.comp_teams(id) ON DELETE CASCADE;

ALTER TABLE public.comp_submissions
  ADD COLUMN IF NOT EXISTS submitted_by_participant_id UUID REFERENCES public.comp_participants(id) ON DELETE SET NULL;

-- Backfill only while legacy column still exists (skips if already migrated)
DO $body$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comp_submissions' AND column_name = 'participant_id'
  ) THEN
    UPDATE public.comp_submissions s
    SET team_id = (
      SELECT tm.team_id
      FROM public.comp_team_members tm
      WHERE tm.participant_id = s.participant_id
      LIMIT 1
    )
    WHERE s.team_id IS NULL;

    UPDATE public.comp_submissions
    SET submitted_by_participant_id = participant_id
    WHERE submitted_by_participant_id IS NULL;
  END IF;
END $body$;

DELETE FROM public.comp_submissions s
WHERE s.team_id IS NOT NULL
  AND s.id NOT IN (
    SELECT DISTINCT ON (team_id) id
    FROM public.comp_submissions
    WHERE team_id IS NOT NULL
    ORDER BY team_id, submitted_at DESC, updated_at DESC, id DESC
  );

DELETE FROM public.comp_submissions WHERE team_id IS NULL;

ALTER TABLE public.comp_submissions ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.comp_submissions
  DROP CONSTRAINT IF EXISTS comp_submissions_team_id_key;

ALTER TABLE public.comp_submissions
  ADD CONSTRAINT comp_submissions_team_id_key UNIQUE (team_id);

ALTER TABLE public.comp_submissions DROP CONSTRAINT IF EXISTS comp_submissions_participant_id_key;
ALTER TABLE public.comp_submissions DROP CONSTRAINT IF EXISTS comp_submissions_participant_id_fkey;
ALTER TABLE public.comp_submissions DROP COLUMN IF EXISTS participant_id;

DROP INDEX IF EXISTS public.idx_comp_submissions_participant;
CREATE INDEX IF NOT EXISTS idx_comp_submissions_team_id ON public.comp_submissions(team_id);

CREATE POLICY "comp_submissions_select" ON public.comp_submissions
  FOR SELECT USING (
    public.comp_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.comp_team_members tm
      WHERE tm.team_id = team_id
        AND tm.participant_id = public.comp_get_participant_id()
    )
  );

CREATE POLICY "comp_submissions_insert" ON public.comp_submissions
  FOR INSERT WITH CHECK (
    (SELECT submissions_open FROM public.comp_event_state WHERE id = 1)
    AND EXISTS (
      SELECT 1
      FROM public.comp_team_members tm
      WHERE tm.team_id = team_id
        AND tm.participant_id = public.comp_get_participant_id()
    )
    AND submitted_by_participant_id = public.comp_get_participant_id()
  );

CREATE POLICY "comp_submissions_update" ON public.comp_submissions
  FOR UPDATE USING (
    (SELECT submissions_open FROM public.comp_event_state WHERE id = 1)
    AND EXISTS (
      SELECT 1
      FROM public.comp_team_members tm
      WHERE tm.team_id = team_id
        AND tm.participant_id = public.comp_get_participant_id()
    )
  )
  WITH CHECK (
    (SELECT submissions_open FROM public.comp_event_state WHERE id = 1)
    AND EXISTS (
      SELECT 1
      FROM public.comp_team_members tm
      WHERE tm.team_id = team_id
        AND tm.participant_id = public.comp_get_participant_id()
    )
    AND submitted_by_participant_id = public.comp_get_participant_id()
  );

CREATE POLICY "comp_submissions_delete" ON public.comp_submissions
  FOR DELETE USING (public.comp_is_admin());

COMMIT;

-- Post-check (run separately if you like):
-- SELECT team_id, COUNT(*) FROM public.comp_submissions GROUP BY team_id HAVING COUNT(*) > 1;
