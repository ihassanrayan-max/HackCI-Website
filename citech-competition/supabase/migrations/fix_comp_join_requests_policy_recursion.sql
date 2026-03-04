-- ============================================================
-- Fix: Infinite recursion between comp_participants_select and
-- comp_join_requests. comp_participants_select referenced
-- comp_join_requests, and comp_join_requests INSERT checks
-- comp_participants, causing policy re-entry.
-- Use a SECURITY DEFINER function so the check runs without RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.comp_participants_visible_to_caller(p_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    auth.uid() = (SELECT user_id FROM public.comp_participants WHERE id = p_id LIMIT 1)
    OR public.comp_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.comp_team_members me
      JOIN public.comp_team_members teammate ON teammate.team_id = me.team_id
      WHERE me.participant_id = public.comp_get_participant_id()
        AND teammate.participant_id = p_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.comp_join_requests jr
      JOIN public.comp_teams t ON t.id = jr.team_id
      WHERE jr.participant_id = p_id
        AND jr.status = 'pending'
        AND t.owner_id = public.comp_get_participant_id()
    );
$$;

DROP POLICY IF EXISTS "comp_participants_select" ON public.comp_participants;

CREATE POLICY "comp_participants_select" ON public.comp_participants
  FOR SELECT
  USING (public.comp_participants_visible_to_caller(id));
