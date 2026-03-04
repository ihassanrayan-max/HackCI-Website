-- ============================================================
-- Allow team owner to add a member when approving a join request
-- Previously, comp_team_members_insert only allowed:
-- - admin, or
-- - participant_id = current user (self-join via invite code).
-- So when the captain approved a join request, the UPDATE to
-- comp_join_requests succeeded but the INSERT into comp_team_members
-- failed under RLS, leaving the request "approved" but the user not
-- in the team (and the request disappearing from the pending list).
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
    );
