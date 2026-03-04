-- ============================================================
-- Migration: Add comp_join_requests table for browse + request-to-join flow
-- ============================================================

-- ── Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comp_join_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES public.comp_teams(id) ON DELETE CASCADE,
    participant_id  UUID NOT NULL REFERENCES public.comp_participants(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'denied')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_comp_join_request UNIQUE (team_id, participant_id)
);

CREATE TRIGGER comp_join_requests_updated_at
    BEFORE UPDATE ON public.comp_join_requests
    FOR EACH ROW EXECUTE FUNCTION public.comp_handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_comp_join_requests_team
    ON public.comp_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_comp_join_requests_participant
    ON public.comp_join_requests(participant_id);
CREATE INDEX IF NOT EXISTS idx_comp_join_requests_status
    ON public.comp_join_requests(status);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.comp_join_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: own requests, requests for teams you own, or admin
CREATE POLICY "comp_join_requests_select" ON public.comp_join_requests
    FOR SELECT USING (
        participant_id = public.comp_get_participant_id()
        OR EXISTS (
            SELECT 1 FROM public.comp_teams
            WHERE id = comp_join_requests.team_id
              AND owner_id = public.comp_get_participant_id()
        )
        OR public.comp_is_admin()
    );

-- INSERT: approved participant can create their own pending request
CREATE POLICY "comp_join_requests_insert" ON public.comp_join_requests
    FOR INSERT WITH CHECK (
        participant_id = public.comp_get_participant_id()
        AND status = 'pending'
        AND EXISTS (
            SELECT 1 FROM public.comp_participants
            WHERE id = public.comp_get_participant_id()
              AND status = 'approved'
        )
    );

-- UPDATE: team owner or admin (to approve / deny)
CREATE POLICY "comp_join_requests_update" ON public.comp_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.comp_teams
            WHERE id = comp_join_requests.team_id
              AND owner_id = public.comp_get_participant_id()
        )
        OR public.comp_is_admin()
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.comp_teams
            WHERE id = comp_join_requests.team_id
              AND owner_id = public.comp_get_participant_id()
        )
        OR public.comp_is_admin()
    );

-- DELETE: participant can remove own request, or admin
CREATE POLICY "comp_join_requests_delete" ON public.comp_join_requests
    FOR DELETE USING (
        participant_id = public.comp_get_participant_id()
        OR public.comp_is_admin()
    );

-- ── Update participant visibility ───────────────────────────
-- Team owners need to see profiles of people who sent join requests
-- to their teams. Drop and recreate the SELECT policy.
DROP POLICY IF EXISTS "comp_participants_select" ON public.comp_participants;

CREATE POLICY "comp_participants_select" ON public.comp_participants
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.comp_is_admin()
        -- Teammates can see each other
        OR EXISTS (
            SELECT 1
            FROM public.comp_team_members me
            JOIN public.comp_team_members teammate
              ON teammate.team_id = me.team_id
            WHERE me.participant_id = public.comp_get_participant_id()
              AND teammate.participant_id = public.comp_participants.id
        )
        -- Team owners can see profiles of join requesters
        OR EXISTS (
            SELECT 1
            FROM public.comp_join_requests jr
            JOIN public.comp_teams t ON t.id = jr.team_id
            WHERE jr.participant_id = public.comp_participants.id
              AND jr.status = 'pending'
              AND t.owner_id = public.comp_get_participant_id()
        )
    );

-- ── Enable realtime on join requests ────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.comp_join_requests;
