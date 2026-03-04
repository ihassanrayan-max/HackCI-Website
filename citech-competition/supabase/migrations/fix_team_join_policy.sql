-- ============================================================
-- Migration: Fix comp_team_members_insert RLS policy
-- Previously, only team owners or admins could insert rows.
-- This prevented non-owner approved participants from joining
-- a team using an invite code.
--
-- New policy: an approved participant may insert a row for
-- themselves (participant_id = their own comp_participants.id).
-- The comp_enforce_team_cap trigger still enforces the 4-member
-- cap. Admins retain full insert access.
-- ============================================================

DROP POLICY IF EXISTS "comp_team_members_insert" ON public.comp_team_members;

CREATE POLICY "comp_team_members_insert" ON public.comp_team_members
    FOR INSERT WITH CHECK (
        public.comp_is_admin()
        OR (
            participant_id = public.comp_get_participant_id()
            AND EXISTS (
                SELECT 1 FROM public.comp_participants
                WHERE id = public.comp_get_participant_id()
                AND status = 'approved'
            )
        )
    );
