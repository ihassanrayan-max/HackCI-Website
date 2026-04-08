-- ============================================================
-- Migration: comp_submissions per team
-- One submission row per team (UNIQUE team_id). Teammates share
-- read/write while submissions_open; audit via submitted_by_participant_id.
--
-- Dedup tie-breaker when multiple participant rows map to the same team:
-- keep the row with latest submitted_at, then updated_at, then id (desc).
-- Orphan rows (participant not in any team) are deleted — export first if needed.
-- ============================================================

-- 1. New columns (nullable until backfill)
ALTER TABLE public.comp_submissions
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.comp_teams(id) ON DELETE CASCADE;

ALTER TABLE public.comp_submissions
  ADD COLUMN IF NOT EXISTS submitted_by_participant_id UUID REFERENCES public.comp_participants(id) ON DELETE SET NULL;

-- 2. Backfill team_id from membership
UPDATE public.comp_submissions s
SET team_id = (
  SELECT tm.team_id
  FROM public.comp_team_members tm
  WHERE tm.participant_id = s.participant_id
  LIMIT 1
)
WHERE s.team_id IS NULL;

-- 3. Historical submitter (before team-scoped rows)
UPDATE public.comp_submissions
SET submitted_by_participant_id = participant_id
WHERE submitted_by_participant_id IS NULL;

-- 4. Dedupe: one row per team_id (keep best row per team)
DELETE FROM public.comp_submissions s
WHERE s.team_id IS NOT NULL
  AND s.id NOT IN (
    SELECT DISTINCT ON (team_id) id
    FROM public.comp_submissions
    WHERE team_id IS NOT NULL
    ORDER BY team_id, submitted_at DESC, updated_at DESC, id DESC
  );

-- 5. Orphans: participant had a submission row but no team — remove
DELETE FROM public.comp_submissions WHERE team_id IS NULL;

-- 6. Enforce NOT NULL and one row per team
ALTER TABLE public.comp_submissions ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.comp_submissions
  DROP CONSTRAINT IF EXISTS comp_submissions_team_id_key;

ALTER TABLE public.comp_submissions
  ADD CONSTRAINT comp_submissions_team_id_key UNIQUE (team_id);

-- 7. Drop old participant_id column and its constraints
ALTER TABLE public.comp_submissions DROP CONSTRAINT IF EXISTS comp_submissions_participant_id_key;
ALTER TABLE public.comp_submissions DROP CONSTRAINT IF EXISTS comp_submissions_participant_id_fkey;
ALTER TABLE public.comp_submissions DROP COLUMN IF EXISTS participant_id;

-- 8. Indexes
DROP INDEX IF EXISTS public.idx_comp_submissions_participant;
CREATE INDEX IF NOT EXISTS idx_comp_submissions_team_id ON public.comp_submissions(team_id);

-- ============================================================
-- 9. RLS: replace policies for team-scoped submissions
-- ============================================================
DROP POLICY IF EXISTS "comp_submissions_select" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_insert" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_update" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_delete" ON public.comp_submissions;

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

-- ============================================================
-- Pre-flight (run BEFORE migration in production SQL editor)
-- ============================================================
-- Orphan risk: submissions whose participant is not in any team
-- SELECT s.id, s.participant_id, s.drive_link
-- FROM public.comp_submissions s
-- LEFT JOIN public.comp_team_members tm ON tm.participant_id = s.participant_id
-- WHERE tm.id IS NULL;
--
-- Duplicate-team risk (multiple participant rows → same team after backfill):
-- SELECT tm.team_id, COUNT(*) AS cnt
-- FROM public.comp_submissions s
-- JOIN public.comp_team_members tm ON tm.participant_id = s.participant_id
-- GROUP BY tm.team_id
-- HAVING COUNT(*) > 1;
--
-- Post-verify (after migration)
-- SELECT team_id, COUNT(*) FROM public.comp_submissions GROUP BY team_id HAVING COUNT(*) > 1;
-- (expect 0 rows)
