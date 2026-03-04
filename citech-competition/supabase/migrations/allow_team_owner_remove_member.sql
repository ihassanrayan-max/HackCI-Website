-- ============================================================
-- Allow team owner to remove a member from their own team
-- Fix: previous comp_team_members_delete policy only allowed
-- self-removal or admin, so captains could not permanently
-- remove teammates (delete returned 0 rows with no error).
-- ============================================================

DROP POLICY IF EXISTS "comp_team_members_delete" ON public.comp_team_members;

CREATE POLICY "comp_team_members_delete" ON public.comp_team_members
    FOR DELETE USING (
        -- Member can remove themselves
        participant_id = public.comp_get_participant_id()
        -- Admin can remove anyone
        OR public.comp_is_admin()
        -- Team owner can remove any member of their team
        OR EXISTS (
            SELECT 1
            FROM public.comp_teams t
            WHERE t.id = comp_team_members.team_id
              AND t.owner_id = public.comp_get_participant_id()
        )
    );

