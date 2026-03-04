-- ============================================================
-- Migration: comp_results per team
-- Replace participant_id with team_id so results are assigned
-- per team; all team members see the same result.
-- ============================================================

-- 1. Add nullable team_id (FK to comp_teams)
ALTER TABLE public.comp_results
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.comp_teams(id) ON DELETE CASCADE;

-- 2. Backfill team_id from comp_team_members (one member's team per result)
UPDATE public.comp_results r
SET team_id = (
  SELECT tm.team_id
  FROM public.comp_team_members tm
  WHERE tm.participant_id = r.participant_id
  LIMIT 1
)
WHERE team_id IS NULL;

-- 3. Remove rows for participants with no team (orphaned results)
DELETE FROM public.comp_results WHERE team_id IS NULL;

-- 4. Drop participant_id unique constraint and column
ALTER TABLE public.comp_results DROP CONSTRAINT IF EXISTS comp_results_participant_id_key;
ALTER TABLE public.comp_results DROP COLUMN IF EXISTS participant_id;

-- 5. Enforce team_id NOT NULL and one result per team
ALTER TABLE public.comp_results ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE public.comp_results ADD CONSTRAINT comp_results_team_id_key UNIQUE (team_id);

-- 6. Update RLS: participants see result when results_released and row is for their team
DROP POLICY IF EXISTS "comp_results_select" ON public.comp_results;

CREATE POLICY "comp_results_select" ON public.comp_results
  FOR SELECT USING (
    public.comp_is_admin()
    OR (
      (SELECT results_released FROM public.comp_event_state WHERE id = 1)
      AND EXISTS (
        SELECT 1 FROM public.comp_team_members tm
        WHERE tm.team_id = public.comp_results.team_id
          AND tm.participant_id = public.comp_get_participant_id()
      )
    )
  );

-- 7. Index for team lookups
CREATE INDEX IF NOT EXISTS idx_comp_results_team_id ON public.comp_results(team_id);
