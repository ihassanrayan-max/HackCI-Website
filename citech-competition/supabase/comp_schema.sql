-- ============================================================
-- CITech Competition Schema
-- Run this ONCE in the Supabase SQL Editor.
-- All objects are prefixed with comp_ to avoid any collision
-- with the existing HackCI tables (profiles, applications, etc.)
-- HackCI objects are NEVER referenced or modified here.
-- ============================================================

-- ============================================================
-- UPDATED_AT HELPER
-- Re-use if already exists (HackCI also defines handle_updated_at
-- but uses a different name space; safe to create comp-specific one)
-- ============================================================
CREATE OR REPLACE FUNCTION public.comp_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- comp_admins
-- Manually INSERT admin user UUIDs after schema is applied.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comp_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER: comp_is_admin()
-- Returns true if the calling auth.uid() is in comp_admins.
-- ============================================================
CREATE OR REPLACE FUNCTION public.comp_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.comp_admins
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- comp_participants
-- One row per registered competition user.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comp_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    age             INT NOT NULL CHECK (age >= 16 AND age <= 99),
    university      TEXT NOT NULL CHECK (university IN ('otu', 'other')),
    university_name TEXT,
    student_id      TEXT,
    program         TEXT NOT NULL,
    year_of_study   TEXT NOT NULL CHECK (year_of_study IN ('1', '2', '3', '4', '5+', 'grad')),
    goals           TEXT,
    linkedin_url    TEXT,
    github_url      TEXT,
    portfolio_url   TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER comp_participants_updated_at
    BEFORE UPDATE ON public.comp_participants
    FOR EACH ROW EXECUTE FUNCTION public.comp_handle_updated_at();

-- HELPER: get the comp_participants.id for the current auth user
CREATE OR REPLACE FUNCTION public.comp_get_participant_id()
RETURNS UUID AS $$
    SELECT id FROM public.comp_participants WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- comp_event_state
-- Singleton row (id = 1). Controls the event lifecycle.
-- Seeded immediately below.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comp_event_state (
    id                  INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    briefing_released   BOOLEAN NOT NULL DEFAULT false,
    submissions_open    BOOLEAN NOT NULL DEFAULT false,
    results_released    BOOLEAN NOT NULL DEFAULT false,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER comp_event_state_updated_at
    BEFORE UPDATE ON public.comp_event_state
    FOR EACH ROW EXECUTE FUNCTION public.comp_handle_updated_at();

-- Seed the singleton row (safe to run multiple times)
INSERT INTO public.comp_event_state (id, briefing_released, submissions_open, results_released)
VALUES (1, false, false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- comp_submissions
-- One per participant (UNIQUE on participant_id).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comp_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id  UUID NOT NULL UNIQUE REFERENCES public.comp_participants(id) ON DELETE CASCADE,
    drive_link      TEXT NOT NULL,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER comp_submissions_updated_at
    BEFORE UPDATE ON public.comp_submissions
    FOR EACH ROW EXECUTE FUNCTION public.comp_handle_updated_at();

-- ============================================================
-- comp_results
-- Admin-assigned. At most 4 rows: 2 tracks × 2 positions.
-- UNIQUE(track, position) prevents awarding same slot twice.
-- UNIQUE(team_id) prevents one team winning more than one slot.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comp_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL UNIQUE REFERENCES public.comp_teams(id) ON DELETE CASCADE,
    track           TEXT NOT NULL CHECK (track IN ('A', 'B')),
    position        INT NOT NULL CHECK (position IN (1, 2)),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_track_position UNIQUE (track, position)
);

CREATE TRIGGER comp_results_updated_at
    BEFORE UPDATE ON public.comp_results
    FOR EACH ROW EXECUTE FUNCTION public.comp_handle_updated_at();

-- ============================================================
-- comp_teams
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comp_teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL DEFAULT 'Untitled Team',
    code        TEXT NOT NULL UNIQUE,
    owner_id    UUID NOT NULL REFERENCES public.comp_participants(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER comp_teams_updated_at
    BEFORE UPDATE ON public.comp_teams
    FOR EACH ROW EXECUTE FUNCTION public.comp_handle_updated_at();

-- ============================================================
-- comp_team_members
-- One team per person (UNIQUE on participant_id).
-- Max 4 per team enforced by application logic + trigger below.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comp_team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES public.comp_teams(id) ON DELETE CASCADE,
    participant_id  UUID NOT NULL UNIQUE REFERENCES public.comp_participants(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: enforce max 4 members per team
CREATE OR REPLACE FUNCTION public.comp_enforce_team_cap()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.comp_team_members WHERE team_id = NEW.team_id) >= 4 THEN
        RAISE EXCEPTION 'Team is full (max 4 members).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comp_team_members_cap
    BEFORE INSERT ON public.comp_team_members
    FOR EACH ROW EXECUTE FUNCTION public.comp_enforce_team_cap();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.comp_admins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_event_state    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_team_members   ENABLE ROW LEVEL SECURITY;

-- ---- comp_admins ----
CREATE POLICY "comp_admins_select" ON public.comp_admins
    FOR SELECT USING (public.comp_is_admin());

-- ---- comp_participants ----

-- Users can view their own row; admins can view all.
-- Teammates can view each other so the Team Hub roster can render names.
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

-- A user can register themselves (INSERT once)
CREATE POLICY "comp_participants_insert" ON public.comp_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update participant data (e.g. status)
-- Participants cannot change their own status
CREATE POLICY "comp_participants_update" ON public.comp_participants
    FOR UPDATE USING (public.comp_is_admin())
    WITH CHECK (public.comp_is_admin());

-- Only admins can delete
CREATE POLICY "comp_participants_delete" ON public.comp_participants
    FOR DELETE USING (public.comp_is_admin());

-- ---- comp_event_state ----

-- Any authenticated user can read event state
CREATE POLICY "comp_event_state_select" ON public.comp_event_state
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can update
CREATE POLICY "comp_event_state_update" ON public.comp_event_state
    FOR UPDATE USING (public.comp_is_admin())
    WITH CHECK (public.comp_is_admin());

-- ---- comp_submissions ----

-- Participants see own; admins see all
CREATE POLICY "comp_submissions_select" ON public.comp_submissions
    FOR SELECT USING (
        participant_id = public.comp_get_participant_id()
        OR public.comp_is_admin()
    );

-- Participants can insert their own submission when submissions are open
CREATE POLICY "comp_submissions_insert" ON public.comp_submissions
    FOR INSERT WITH CHECK (
        participant_id = public.comp_get_participant_id()
        AND (SELECT submissions_open FROM public.comp_event_state WHERE id = 1)
    );

-- Participants can update (edit) their own submission when submissions are open
CREATE POLICY "comp_submissions_update" ON public.comp_submissions
    FOR UPDATE USING (
        participant_id = public.comp_get_participant_id()
        AND (SELECT submissions_open FROM public.comp_event_state WHERE id = 1)
    ) WITH CHECK (
        participant_id = public.comp_get_participant_id()
        AND (SELECT submissions_open FROM public.comp_event_state WHERE id = 1)
    );

-- Only admins can delete submissions
CREATE POLICY "comp_submissions_delete" ON public.comp_submissions
    FOR DELETE USING (public.comp_is_admin());

-- ---- comp_results ----

-- Participants see their team's result when results_released; admins always see all
CREATE POLICY "comp_results_select" ON public.comp_results
    FOR SELECT USING (
        public.comp_is_admin()
        OR (
            (SELECT results_released FROM public.comp_event_state WHERE id = 1)
            AND EXISTS (
                SELECT 1 FROM public.comp_team_members tm
                WHERE tm.team_id = public.comp_results.team_id
                  AND tm.participant_id = public.comp_get_participant_id()
            )
        )
    );

-- Only admins can insert/update/delete results
CREATE POLICY "comp_results_insert" ON public.comp_results
    FOR INSERT WITH CHECK (public.comp_is_admin());

CREATE POLICY "comp_results_update" ON public.comp_results
    FOR UPDATE USING (public.comp_is_admin())
    WITH CHECK (public.comp_is_admin());

CREATE POLICY "comp_results_delete" ON public.comp_results
    FOR DELETE USING (public.comp_is_admin());

-- ---- comp_teams ----

-- Any participant can read teams (to look up by join code)
CREATE POLICY "comp_teams_select" ON public.comp_teams
    FOR SELECT USING (
        public.comp_get_participant_id() IS NOT NULL
        OR public.comp_is_admin()
    );

-- Approved participants can create a team
CREATE POLICY "comp_teams_insert" ON public.comp_teams
    FOR INSERT WITH CHECK (
        owner_id = public.comp_get_participant_id()
        AND EXISTS (
            SELECT 1 FROM public.comp_participants
            WHERE id = public.comp_get_participant_id()
            AND status = 'approved'
        )
    );

-- Owner or admin can update team
CREATE POLICY "comp_teams_update" ON public.comp_teams
    FOR UPDATE USING (
        owner_id = public.comp_get_participant_id()
        OR public.comp_is_admin()
    ) WITH CHECK (
        owner_id = public.comp_get_participant_id()
        OR public.comp_is_admin()
    );

-- Owner or admin can delete (disband) team
CREATE POLICY "comp_teams_delete" ON public.comp_teams
    FOR DELETE USING (
        owner_id = public.comp_get_participant_id()
        OR public.comp_is_admin()
    );

-- ---- comp_team_members ----

-- Any participant can read members
CREATE POLICY "comp_team_members_select" ON public.comp_team_members
    FOR SELECT USING (
        public.comp_get_participant_id() IS NOT NULL
        OR public.comp_is_admin()
    );

-- Admin can add anyone.
-- Approved participants can add themselves to a team (join by invite code).
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

-- User can remove themselves; admin can remove any
CREATE POLICY "comp_team_members_delete" ON public.comp_team_members
    FOR DELETE USING (
        participant_id = public.comp_get_participant_id()
        OR public.comp_is_admin()
    );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_comp_participants_user_id ON public.comp_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_participants_status  ON public.comp_participants(status);
CREATE INDEX IF NOT EXISTS idx_comp_submissions_participant ON public.comp_submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_comp_results_team_id      ON public.comp_results(team_id);
CREATE INDEX IF NOT EXISTS idx_comp_results_track_pos     ON public.comp_results(track, position);
CREATE INDEX IF NOT EXISTS idx_comp_teams_code            ON public.comp_teams(code);
CREATE INDEX IF NOT EXISTS idx_comp_team_members_team     ON public.comp_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_comp_team_members_participant ON public.comp_team_members(participant_id);

-- ============================================================
-- ENABLE REALTIME on comp_event_state
-- (So the dashboard can subscribe to event state changes)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.comp_event_state;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
-- After running this SQL:
-- 1. Go to Supabase Dashboard > Authentication > Providers > Google and enable it.
-- 2. Add your site URL to Supabase Dashboard > Authentication > URL Configuration.
--    Allowed redirect URLs should include: <your-site-url>/auth/callback
-- 3. To bootstrap an admin:
--    INSERT INTO public.comp_admins (user_id) VALUES ('<your-auth-user-uuid>');
-- ============================================================
