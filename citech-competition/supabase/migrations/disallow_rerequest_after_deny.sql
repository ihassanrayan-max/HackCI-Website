-- ============================================================
-- Disallow requester from changing a denied join request back
-- to pending. Once a team has rejected a request, the same
-- participant cannot request again for that team.
-- ============================================================

DROP POLICY IF EXISTS "comp_join_requests_update_requester_retry"
  ON public.comp_join_requests;

