-- ============================================================
-- Migration: Ensure comp_team_members_insert policy alignment
-- This migration is idempotent and keeps DB behavior aligned
-- with Team Hub invite-code flow:
--   - admins can insert any membership row
--   - approved participants can insert membership for themselves
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
