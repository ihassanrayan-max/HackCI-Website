-- ============================================================
-- Use ONLY if the main migration failed with:
--   cannot drop column participant_id ... policy ... depends on column participant_id
-- and earlier steps (add columns, backfill, dedupe) already succeeded.
-- If you are unsure, check: SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'comp_submissions' AND table_schema = 'public';
-- You want participant_id still present + team_id present before running this.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "comp_submissions_select" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_insert" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_update" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_delete" ON public.comp_submissions;

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
