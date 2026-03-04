-- ============================================================
-- Allow a participant to set their own join request from
-- 'denied' back to 'pending' so they can re-request without
-- having to cancel (delete) the request first.
-- ============================================================

CREATE POLICY "comp_join_requests_update_requester_retry" ON public.comp_join_requests
    FOR UPDATE
    USING (
        participant_id = public.comp_get_participant_id()
        AND status = 'denied'
    )
    WITH CHECK (
        participant_id = public.comp_get_participant_id()
        AND status = 'pending'
    );
