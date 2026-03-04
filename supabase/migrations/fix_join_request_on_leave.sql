-- Fix: Allow users who left a team to request to join again
-- Run this in Supabase SQL Editor (or via Supabase CLI)
-- 
-- Problem: When a user's join request was approved, they were added to team_members.
-- When they later left the team, only team_members was updated. The join_requests
-- row remained with status 'approved', blocking a new request (unique constraint).
--
-- This migration adds a DELETE policy so users can remove their own join_request
-- when leaving, allowing them to request again later.

DROP POLICY IF EXISTS "join_requests_delete" ON public.join_requests;
CREATE POLICY "join_requests_delete" ON public.join_requests
    FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Clean up existing orphaned rows (approved requests where user already left)
-- Run this if users are currently stuck and can't request again:
DELETE FROM public.join_requests jr
WHERE jr.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = jr.team_id AND tm.user_id = jr.user_id
  );
