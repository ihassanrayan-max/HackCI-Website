-- ============================================================
-- Lifecycle refactor
-- Schedule defaults + admin overrides + team-based submissions
-- ============================================================

-- -----------------------------------------------------------------
-- 1) comp_event_state: move from manual booleans to nullable overrides
-- -----------------------------------------------------------------
ALTER TABLE public.comp_event_state
  ADD COLUMN IF NOT EXISTS applications_open_override BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS briefing_released_override BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS submissions_open_override BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS team_changes_open_override BOOLEAN NULL;

-- Keep results release fully manual.
ALTER TABLE public.comp_event_state
  ADD COLUMN IF NOT EXISTS results_released BOOLEAN NOT NULL DEFAULT false;

-- Clear overrides so schedule becomes the default source of truth.
UPDATE public.comp_event_state
SET
  applications_open_override = NULL,
  briefing_released_override = NULL,
  submissions_open_override = NULL,
  team_changes_open_override = NULL
WHERE id = 1;

-- Drop legacy policies before dropping legacy columns they reference.
DROP POLICY IF EXISTS "comp_participants_insert" ON public.comp_participants;
DROP POLICY IF EXISTS "comp_teams_insert" ON public.comp_teams;
DROP POLICY IF EXISTS "comp_teams_update" ON public.comp_teams;
DROP POLICY IF EXISTS "comp_teams_delete" ON public.comp_teams;
DROP POLICY IF EXISTS "comp_team_members_insert" ON public.comp_team_members;
DROP POLICY IF EXISTS "comp_team_members_delete" ON public.comp_team_members;
DROP POLICY IF EXISTS "comp_join_requests_insert" ON public.comp_join_requests;
DROP POLICY IF EXISTS "comp_join_requests_update" ON public.comp_join_requests;
DROP POLICY IF EXISTS "comp_join_requests_delete" ON public.comp_join_requests;
DROP POLICY IF EXISTS "comp_submissions_insert" ON public.comp_submissions;
DROP POLICY IF EXISTS "comp_submissions_update" ON public.comp_submissions;

ALTER TABLE public.comp_event_state
  DROP COLUMN IF EXISTS applications_open,
  DROP COLUMN IF EXISTS briefing_released,
  DROP COLUMN IF EXISTS submissions_open,
  DROP COLUMN IF EXISTS team_changes_open;

-- -----------------------------------------------------------------
-- 2) Effective lifecycle helpers (must mirror src/lib/eventSchedule.ts)
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.comp_effective_applications_open()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    applications_open_override,
    NOW() < TIMESTAMPTZ '2026-04-01 00:00:00-04'
  )
  FROM public.comp_event_state
  WHERE id = 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.comp_event_started()
RETURNS BOOLEAN AS $$
  SELECT NOW() >= TIMESTAMPTZ '2026-04-02 21:30:00-04';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.comp_effective_team_changes_open()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    team_changes_open_override,
    (
      NOW() >= TIMESTAMPTZ '2026-04-02 21:30:00-04'
      AND NOW() <= TIMESTAMPTZ '2026-04-02 23:59:00-04'
    )
  )
  FROM public.comp_event_state
  WHERE id = 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.comp_effective_submissions_open()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    submissions_open_override,
    (
      NOW() >= TIMESTAMPTZ '2026-04-06 12:00:00-04'
      AND NOW() < TIMESTAMPTZ '2026-04-09 10:00:00-04'
    )
  )
  FROM public.comp_event_state
  WHERE id = 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.comp_effective_briefing_released()
RETURNS BOOLEAN AS $$
  SELECT (
    public.comp_event_started()
    AND COALESCE(briefing_released_override, false)
  )
  FROM public.comp_event_state
  WHERE id = 1;
$$ LANGUAGE sql STABLE;

-- -----------------------------------------------------------------
-- 3) Submissions become team-based
-- -----------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comp_submissions'
      AND column_name = 'participant_id'
  ) THEN
    ALTER TABLE public.comp_submissions
      RENAME COLUMN participant_id TO submitted_by;
  END IF;
END $$;

ALTER TABLE public.comp_submissions
  ADD COLUMN IF NOT EXISTS team_id UUID;

-- Backfill team_id from submitter membership.
UPDATE public.comp_submissions s
SET team_id = tm.team_id
FROM public.comp_team_members tm
WHERE tm.participant_id = s.submitted_by
  AND s.team_id IS NULL;

-- Remove orphan submissions that are not associated with a team.
DELETE FROM public.comp_submissions
WHERE team_id IS NULL;

ALTER TABLE public.comp_submissions
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.comp_submissions
  DROP CONSTRAINT IF EXISTS comp_submissions_participant_id_key,
  DROP CONSTRAINT IF EXISTS comp_submissions_submitted_by_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comp_submissions_team_id_key'
      AND conrelid = 'public.comp_submissions'::regclass
  ) THEN
    ALTER TABLE public.comp_submissions
      ADD CONSTRAINT comp_submissions_team_id_key UNIQUE (team_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comp_submissions_team_id_fkey'
      AND conrelid = 'public.comp_submissions'::regclass
  ) THEN
    ALTER TABLE public.comp_submissions
      ADD CONSTRAINT comp_submissions_team_id_fkey
        FOREIGN KEY (team_id) REFERENCES public.comp_teams(id) ON DELETE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------
-- 4) Submission/business-rule enforcement at DB layer
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.comp_validate_team_submission()
RETURNS TRIGGER AS $$
DECLARE
  member_count INT;
BEGIN
  IF public.comp_is_admin() THEN
    RETURN NEW;
  END IF;

  -- Only the current participant can submit on behalf of their team.
  IF NEW.submitted_by <> public.comp_get_participant_id() THEN
    RAISE EXCEPTION 'You may only submit as yourself.';
  END IF;

  -- Submitter must be a member of the target team.
  IF NOT EXISTS (
    SELECT 1
    FROM public.comp_team_members tm
    WHERE tm.team_id = NEW.team_id
      AND tm.participant_id = NEW.submitted_by
  ) THEN
    RAISE EXCEPTION 'You are not a member of this team.';
  END IF;

  -- Team must be valid for submission.
  SELECT COUNT(*)
  INTO member_count
  FROM public.comp_team_members tm
  WHERE tm.team_id = NEW.team_id;

  IF member_count < 2 THEN
    RAISE EXCEPTION 'A valid team must have at least 2 members before submission.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comp_validate_team_submission_trigger ON public.comp_submissions;
CREATE TRIGGER comp_validate_team_submission_trigger
  BEFORE INSERT OR UPDATE ON public.comp_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.comp_validate_team_submission();

CREATE OR REPLACE FUNCTION public.comp_block_team_change_after_submission()
RETURNS TRIGGER AS $$
DECLARE
  target_team_id UUID;
BEGIN
  IF public.comp_is_admin() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  target_team_id := COALESCE(NEW.team_id, OLD.team_id);

  IF EXISTS (
    SELECT 1
    FROM public.comp_submissions s
    WHERE s.team_id = target_team_id
  ) THEN
    RAISE EXCEPTION 'Team composition cannot be modified after submission.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comp_block_team_member_insert_after_submission ON public.comp_team_members;
CREATE TRIGGER comp_block_team_member_insert_after_submission
  BEFORE INSERT ON public.comp_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.comp_block_team_change_after_submission();

DROP TRIGGER IF EXISTS comp_block_team_member_delete_after_submission ON public.comp_team_members;
CREATE TRIGGER comp_block_team_member_delete_after_submission
  BEFORE DELETE ON public.comp_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.comp_block_team_change_after_submission();

DROP TRIGGER IF EXISTS comp_block_team_disband_after_submission ON public.comp_teams;
CREATE TRIGGER comp_block_team_disband_after_submission
  BEFORE DELETE ON public.comp_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.comp_block_team_change_after_submission();

-- -----------------------------------------------------------------
-- 5) RLS policy updates: use effective lifecycle functions
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "comp_participants_insert" ON public.comp_participants;
CREATE POLICY "comp_participants_insert" ON public.comp_participants
  FOR INSERT
  WITH CHECK (
    (
      auth.uid() = user_id
      AND public.comp_effective_applications_open()
    )
    OR public.comp_is_admin()
  );

DROP POLICY IF EXISTS "comp_teams_insert" ON public.comp_teams;
CREATE POLICY "comp_teams_insert" ON public.comp_teams
  FOR INSERT
  WITH CHECK (
    (
      owner_id = public.comp_get_participant_id()
      AND EXISTS (
        SELECT 1 FROM public.comp_participants
        WHERE id = public.comp_get_participant_id()
          AND status = 'approved'
      )
      AND public.comp_effective_team_changes_open()
    )
    OR public.comp_is_admin()
  );

DROP POLICY IF EXISTS "comp_teams_update" ON public.comp_teams;
CREATE POLICY "comp_teams_update" ON public.comp_teams
  FOR UPDATE
  USING (
    (
      owner_id = public.comp_get_participant_id()
      AND public.comp_effective_team_changes_open()
    )
    OR public.comp_is_admin()
  )
  WITH CHECK (
    (
      owner_id = public.comp_get_participant_id()
      AND public.comp_effective_team_changes_open()
    )
    OR public.comp_is_admin()
  );

DROP POLICY IF EXISTS "comp_teams_delete" ON public.comp_teams;
CREATE POLICY "comp_teams_delete" ON public.comp_teams
  FOR DELETE
  USING (
    (
      owner_id = public.comp_get_participant_id()
      AND public.comp_effective_team_changes_open()
    )
    OR public.comp_is_admin()
  );

DROP POLICY IF EXISTS "comp_team_members_insert" ON public.comp_team_members;
CREATE POLICY "comp_team_members_insert" ON public.comp_team_members
  FOR INSERT
  WITH CHECK (
    public.comp_is_admin()
    OR (
      (
        participant_id = public.comp_get_participant_id()
        AND EXISTS (
          SELECT 1 FROM public.comp_participants
          WHERE id = public.comp_get_participant_id()
            AND status = 'approved'
        )
      )
      OR EXISTS (
        SELECT 1
        FROM public.comp_join_requests jr
        JOIN public.comp_teams t ON t.id = jr.team_id
        WHERE jr.team_id = comp_team_members.team_id
          AND jr.participant_id = comp_team_members.participant_id
          AND jr.status = 'approved'
          AND t.owner_id = public.comp_get_participant_id()
      )
    )
    AND public.comp_effective_team_changes_open()
  );

DROP POLICY IF EXISTS "comp_team_members_delete" ON public.comp_team_members;
CREATE POLICY "comp_team_members_delete" ON public.comp_team_members
  FOR DELETE
  USING (
    public.comp_is_admin()
    OR (
      (
        participant_id = public.comp_get_participant_id()
        OR EXISTS (
          SELECT 1
          FROM public.comp_teams t
          WHERE t.id = comp_team_members.team_id
            AND t.owner_id = public.comp_get_participant_id()
        )
      )
      AND public.comp_effective_team_changes_open()
    )
  );

DROP POLICY IF EXISTS "comp_join_requests_insert" ON public.comp_join_requests;
CREATE POLICY "comp_join_requests_insert" ON public.comp_join_requests
  FOR INSERT
  WITH CHECK (
    participant_id = public.comp_get_participant_id()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.comp_participants
      WHERE id = public.comp_get_participant_id()
        AND status = 'approved'
    )
    AND public.comp_effective_team_changes_open()
  );

DROP POLICY IF EXISTS "comp_join_requests_update" ON public.comp_join_requests;
CREATE POLICY "comp_join_requests_update" ON public.comp_join_requests
  FOR UPDATE
  USING (
    public.comp_is_admin()
    OR (
      EXISTS (
        SELECT 1 FROM public.comp_teams
        WHERE id = comp_join_requests.team_id
          AND owner_id = public.comp_get_participant_id()
      )
      AND public.comp_effective_team_changes_open()
    )
  )
  WITH CHECK (
    public.comp_is_admin()
    OR (
      EXISTS (
        SELECT 1 FROM public.comp_teams
        WHERE id = comp_join_requests.team_id
          AND owner_id = public.comp_get_participant_id()
      )
      AND public.comp_effective_team_changes_open()
    )
  );

DROP POLICY IF EXISTS "comp_join_requests_delete" ON public.comp_join_requests;
CREATE POLICY "comp_join_requests_delete" ON public.comp_join_requests
  FOR DELETE
  USING (
    public.comp_is_admin()
    OR (
      participant_id = public.comp_get_participant_id()
      AND public.comp_effective_team_changes_open()
    )
  );

DROP POLICY IF EXISTS "comp_submissions_select" ON public.comp_submissions;
CREATE POLICY "comp_submissions_select" ON public.comp_submissions
  FOR SELECT
  USING (
    public.comp_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.comp_team_members tm
      WHERE tm.team_id = comp_submissions.team_id
        AND tm.participant_id = public.comp_get_participant_id()
    )
  );

DROP POLICY IF EXISTS "comp_submissions_insert" ON public.comp_submissions;
CREATE POLICY "comp_submissions_insert" ON public.comp_submissions
  FOR INSERT
  WITH CHECK (
    public.comp_is_admin()
    OR (
      submitted_by = public.comp_get_participant_id()
      AND public.comp_effective_submissions_open()
    )
  );

DROP POLICY IF EXISTS "comp_submissions_update" ON public.comp_submissions;
CREATE POLICY "comp_submissions_update" ON public.comp_submissions
  FOR UPDATE
  USING (
    public.comp_is_admin()
    OR (
      submitted_by = public.comp_get_participant_id()
      AND public.comp_effective_submissions_open()
    )
  )
  WITH CHECK (
    public.comp_is_admin()
    OR (
      submitted_by = public.comp_get_participant_id()
      AND public.comp_effective_submissions_open()
    )
  );

