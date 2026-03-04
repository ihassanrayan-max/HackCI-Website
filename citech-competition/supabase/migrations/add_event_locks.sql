-- ============================================================
-- Migration: Add event lock flags & gate key RLS policies
--  - applications_open: controls new participant registrations
--  - team_changes_open: controls non-admin team operations
-- ============================================================

-- ── Columns on comp_event_state ────────────────────────────────────────────────

ALTER TABLE public.comp_event_state
  ADD COLUMN IF NOT EXISTS applications_open BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.comp_event_state
  ADD COLUMN IF NOT EXISTS team_changes_open BOOLEAN NOT NULL DEFAULT true;

-- Existing singleton row (id = 1) will pick up defaults automatically on
-- creation; for existing rows, explicitly ensure both are true so current
-- behaviour is preserved.
UPDATE public.comp_event_state
SET applications_open = true,
    team_changes_open = true
WHERE id = 1;

-- ── RLS: comp_participants (registration gate) ────────────────────────────────

DROP POLICY IF EXISTS "comp_participants_insert" ON public.comp_participants;

CREATE POLICY "comp_participants_insert" ON public.comp_participants
  FOR INSERT
  WITH CHECK (
    -- Normal users can register themselves only while applications are open
    (
      auth.uid() = user_id
      AND (SELECT applications_open FROM public.comp_event_state WHERE id = 1)
    )
    -- Admins may insert rows regardless of the applications_open flag
    OR public.comp_is_admin()
  );

-- ── RLS: comp_teams (team objects) ────────────────────────────────────────────

DROP POLICY IF EXISTS "comp_teams_insert" ON public.comp_teams;
DROP POLICY IF EXISTS "comp_teams_update" ON public.comp_teams;
DROP POLICY IF EXISTS "comp_teams_delete" ON public.comp_teams;

-- Insert: approved participant can create a team while team_changes_open is true;
-- admins are allowed regardless of the flag.
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
      AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
    )
    OR public.comp_is_admin()
  );

-- Update: owner may update while team_changes_open is true; admins always may.
CREATE POLICY "comp_teams_update" ON public.comp_teams
  FOR UPDATE
  USING (
    (
      owner_id = public.comp_get_participant_id()
      AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
    )
    OR public.comp_is_admin()
  )
  WITH CHECK (
    (
      owner_id = public.comp_get_participant_id()
      AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
    )
    OR public.comp_is_admin()
  );

-- Delete: owner may delete while team_changes_open is true; admins always may.
CREATE POLICY "comp_teams_delete" ON public.comp_teams
  FOR DELETE
  USING (
    (
      owner_id = public.comp_get_participant_id()
      AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
    )
    OR public.comp_is_admin()
  );

-- ── RLS: comp_team_members (roster membership) ────────────────────────────────

-- Insert policy has been refined in multiple migrations; drop and recreate with
-- the latest semantics plus team_changes_open gating.
DROP POLICY IF EXISTS "comp_team_members_insert" ON public.comp_team_members;

CREATE POLICY "comp_team_members_insert" ON public.comp_team_members
  FOR INSERT
  WITH CHECK (
    -- Admin can always add members regardless of lock
    public.comp_is_admin()
    OR (
      -- Approved participant can add themselves while team_changes_open is true
      (
        participant_id = public.comp_get_participant_id()
        AND EXISTS (
          SELECT 1 FROM public.comp_participants
          WHERE id = public.comp_get_participant_id()
            AND status = 'approved'
        )
      )
      -- Team owner can add a participant who has an approved join request
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
    AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
  );

-- Delete policy has also been customised previously; reapply with lock gating.
DROP POLICY IF EXISTS "comp_team_members_delete" ON public.comp_team_members;

CREATE POLICY "comp_team_members_delete" ON public.comp_team_members
  FOR DELETE
  USING (
    -- Admin can always remove members
    public.comp_is_admin()
    OR (
      (
        -- Member can remove themselves
        participant_id = public.comp_get_participant_id()
        -- Team owner can remove any member of their team
        OR EXISTS (
          SELECT 1
          FROM public.comp_teams t
          WHERE t.id = comp_team_members.team_id
            AND t.owner_id = public.comp_get_participant_id()
        )
      )
      AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
    )
  );

-- ── RLS: comp_join_requests (browse + request-to-join flow) ──────────────────

DROP POLICY IF EXISTS "comp_join_requests_insert" ON public.comp_join_requests;
DROP POLICY IF EXISTS "comp_join_requests_update" ON public.comp_join_requests;
DROP POLICY IF EXISTS "comp_join_requests_delete" ON public.comp_join_requests;

-- INSERT: approved participant can create their own pending request while team
-- changes are open.
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
    AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
  );

-- UPDATE: team owner can approve/deny while team_changes_open is true;
-- admins may always update (for manual fixes).
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
      AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
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
      AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
    )
  );

-- DELETE: participant can cancel their own request while team_changes_open is
-- true; admins may always delete.
CREATE POLICY "comp_join_requests_delete" ON public.comp_join_requests
  FOR DELETE
  USING (
    public.comp_is_admin()
    OR (
      participant_id = public.comp_get_participant_id()
      AND (SELECT team_changes_open FROM public.comp_event_state WHERE id = 1)
    )
  );

