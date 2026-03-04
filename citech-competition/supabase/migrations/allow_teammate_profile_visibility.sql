-- ============================================================
-- Migration: Allow teammates to read basic participant profile
-- Needed for Team Hub roster join:
-- comp_team_members -> comp_participants(id, full_name, email)
-- ============================================================

DROP POLICY IF EXISTS "comp_participants_select" ON public.comp_participants;

CREATE POLICY "comp_participants_select" ON public.comp_participants
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.comp_is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.comp_team_members me
            JOIN public.comp_team_members teammate
              ON teammate.team_id = me.team_id
            WHERE me.participant_id = public.comp_get_participant_id()
              AND teammate.participant_id = public.comp_participants.id
        )
    );
