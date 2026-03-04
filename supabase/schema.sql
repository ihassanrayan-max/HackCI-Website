-- ============================================
-- CI Hacks — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE
-- One row per auth user. Created on sign-up.
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email               TEXT NOT NULL,
    first_name          TEXT,
    last_name           TEXT,
    role                TEXT NOT NULL DEFAULT 'applicant'
                        CHECK (role IN ('applicant', 'admin', 'super_admin')),
    anonymous_in_teams  BOOLEAN NOT NULL DEFAULT false,
    avatar_path         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS TABLE
-- One row per applicant. Status tracks lifecycle.
-- ============================================
CREATE TABLE IF NOT EXISTS public.applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN (
                            'draft',
                            'submitted',
                            'under_review',
                            'accepted',
                            'rejected',
                            'waitlisted'
                        )),
    answers         JSONB NOT NULL DEFAULT '{}'::jsonb,
    current_step    INT NOT NULL DEFAULT 0,
    submitted_at    TIMESTAMPTZ,
    exported_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT one_application_per_user UNIQUE (user_id)
);

-- ============================================
-- ADMIN REVIEWS TABLE
-- One review per application, set by an admin.
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    admin_id        UUID NOT NULL REFERENCES public.profiles(id),
    decision        TEXT CHECK (decision IN ('accepted', 'rejected', 'waitlisted', 'under_review')),
    notes           TEXT,
    tags            TEXT[] DEFAULT ARRAY[]::TEXT[],
    score           INT CHECK (score IS NULL OR (score BETWEEN 1 AND 5)),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT one_review_per_application UNIQUE (application_id)
);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER admin_reviews_updated_at
    BEFORE UPDATE ON public.admin_reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGN-UP TRIGGER
-- (Optional — also handled in the frontend)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        'applicant'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTION: is_admin()
-- Returns true if the calling user has role = 'admin'
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: is_accepted()
-- Returns true if the calling user has application status = 'accepted'
-- ============================================
CREATE OR REPLACE FUNCTION public.is_accepted()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.applications
        WHERE user_id = auth.uid()
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- TEAMS TABLE
-- Team Hub: teams created by accepted participants
-- ============================================
CREATE TABLE IF NOT EXISTS public.teams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT DEFAULT '',
    roles_wanted    TEXT[] DEFAULT ARRAY[]::TEXT[],
    owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TEAM_MEMBERS TABLE
-- One row per team membership. Max 4 per team, 1 team per user.
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT one_team_per_user UNIQUE (user_id),
    CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

-- ============================================
-- JOIN_REQUESTS TABLE
-- Participant requests to join a team; owner approves/denies
-- ============================================
CREATE TABLE IF NOT EXISTS public.join_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'denied')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_join_request UNIQUE (team_id, user_id)
);

-- ============================================
-- UPDATED_AT TRIGGERS (teams, join_requests)
-- ============================================
CREATE TRIGGER teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER join_requests_updated_at
    BEFORE UPDATE ON public.join_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- HELPER: team owner check (for RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_team_owner(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.teams
        WHERE id = team_uuid AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- RPC: get_team_visible_profiles
-- Returns sanitized profile data for team/request contexts. SECURITY DEFINER
-- bypasses RLS; visibility enforced internally.
-- ============================================
CREATE OR REPLACE FUNCTION public.get_team_visible_profiles(p_user_ids uuid[])
RETURNS TABLE (
    user_id         uuid,
    display_name    text,
    school          text,
    major           text,
    year            text,
    experience      text,
    github          text,
    linkedin        text,
    portfolio       text,
    discord         text,
    instagram       text,
    whatsapp        text,
    contact_phone   text,
    is_teammate     boolean,
    avatar_path     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id     uuid := auth.uid();
    v_uid           uuid;
    v_same_team     boolean;
    v_visible       boolean;
    v_anon          boolean;
    v_dname         text;
    v_answers       jsonb;
    v_p_first       text;
    v_p_last        text;
    v_avatar_path   text;
BEGIN
    IF NOT public.is_accepted() THEN
        RETURN;
    END IF;

    FOREACH v_uid IN ARRAY p_user_ids LOOP
        v_same_team := false;
        v_visible := false;
        v_answers := NULL;

        -- Target must be accepted
        IF NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.user_id = v_uid AND a.status = 'accepted') THEN
            CONTINUE;
        END IF;

        -- (a) Same team?
        SELECT EXISTS (
            SELECT 1 FROM public.team_members m1
            JOIN public.team_members m2 ON m1.team_id = m2.team_id
            WHERE m1.user_id = v_caller_id AND m2.user_id = v_uid
        ) INTO v_same_team;

        IF v_same_team THEN
            v_visible := true;
        END IF;

        -- (b) Caller owns team, target has pending request?
        IF NOT v_visible THEN
            SELECT EXISTS (
                SELECT 1 FROM public.teams t
                JOIN public.join_requests jr ON jr.team_id = t.id
                WHERE t.owner_id = v_caller_id AND jr.user_id = v_uid AND jr.status = 'pending'
            ) INTO v_visible;
        END IF;

        -- (c) Target in team that caller has pending request to?
        IF NOT v_visible THEN
            SELECT EXISTS (
                SELECT 1 FROM public.join_requests jr
                JOIN public.team_members m ON m.team_id = jr.team_id
                WHERE jr.user_id = v_caller_id AND jr.status = 'pending' AND m.user_id = v_uid
            ) INTO v_visible;
        END IF;

        IF NOT v_visible THEN
            CONTINUE;
        END IF;

        -- Fetch target data (SECURITY DEFINER allows read)
        SELECT p.anonymous_in_teams, p.first_name, p.last_name, p.avatar_path
        INTO v_anon, v_p_first, v_p_last, v_avatar_path
        FROM public.profiles p WHERE p.id = v_uid;

        SELECT a.answers INTO v_answers FROM public.applications a WHERE a.user_id = v_uid LIMIT 1;

        -- Display name
        IF COALESCE(v_anon, false) THEN
            v_dname := 'Anonymous';
        ELSIF v_answers IS NOT NULL AND (v_answers->>'preferred_name') IS NOT NULL AND trim(v_answers->>'preferred_name') <> '' THEN
            v_dname := trim(v_answers->>'preferred_name');
        ELSE
            v_dname := coalesce(v_p_first, trim(v_answers->>'legal_first_name'), '');
            IF v_p_last IS NOT NULL AND v_p_last <> '' THEN
                v_dname := v_dname || ' ' || left(v_p_last, 1) || '.';
            ELSIF v_answers->>'legal_last_name' IS NOT NULL AND trim(v_answers->>'legal_last_name') <> '' THEN
                v_dname := v_dname || ' ' || left(trim(v_answers->>'legal_last_name'), 1) || '.';
            END IF;
            v_dname := trim(v_dname);
            IF v_dname = '' THEN v_dname := 'Anonymous'; END IF;
        END IF;

        user_id := v_uid;
        display_name := v_dname;
        school := v_answers->>'school_name';
        major := v_answers->>'program';
        year := v_answers->>'year_of_study';
        experience := coalesce(v_answers->>'skill_level', v_answers->>'hackathon_experience');
        github := v_answers->>'github';
        linkedin := v_answers->>'linkedin';
        portfolio := v_answers->>'portfolio';
        is_teammate := v_same_team;
        avatar_path := v_avatar_path;

        IF v_same_team THEN
            discord := v_answers->>'discord_username';
            instagram := v_answers->>'instagram_handle';
            whatsapp := v_answers->>'whatsapp_number';
            contact_phone := v_answers->>'phone';
        ELSE
            discord := NULL;
            instagram := NULL;
            whatsapp := NULL;
            contact_phone := NULL;
        END IF;

        RETURN NEXT;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_visible_profiles(uuid[]) TO authenticated;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests  ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES RLS ----

-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

-- Users can insert their own profile (on signup)
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile; admins can update any
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- ---- APPLICATIONS RLS ----

-- Users see their own application; admins see all
CREATE POLICY "applications_select" ON public.applications
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

-- Users can create their own application
CREATE POLICY "applications_insert" ON public.applications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own application (e.g. profile/contact in answers); admins can update any.
-- Trigger applications_prevent_draft_revert_trigger prevents non-admins from reverting status to draft.
CREATE POLICY "applications_update" ON public.applications
    FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Prevent non-admins from reverting application status to draft after submission
CREATE OR REPLACE FUNCTION public.applications_prevent_draft_revert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'draft' AND (OLD.status IS NULL OR OLD.status <> 'draft') THEN
        IF public.is_admin() THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Cannot change application status back to draft after submission.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_prevent_draft_revert_trigger
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.applications_prevent_draft_revert();

-- ---- ADMIN REVIEWS RLS ----

-- Only admins can select/insert/update reviews
CREATE POLICY "admin_reviews_select" ON public.admin_reviews
    FOR SELECT
    USING (public.is_admin());

CREATE POLICY "admin_reviews_insert" ON public.admin_reviews
    FOR INSERT
    WITH CHECK (public.is_admin() AND auth.uid() = admin_id);

CREATE POLICY "admin_reviews_update" ON public.admin_reviews
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ---- TEAMS RLS ----

-- Accepted participants + admins can read teams (to browse)
CREATE POLICY "teams_select" ON public.teams
    FOR SELECT
    USING (public.is_accepted() OR public.is_admin());

-- Only accepted users can create teams (become owner)
CREATE POLICY "teams_insert" ON public.teams
    FOR INSERT
    WITH CHECK (public.is_accepted() AND auth.uid() = owner_id);

-- Owner can update (e.g. transfer ownership); admins can update any
CREATE POLICY "teams_update" ON public.teams
    FOR UPDATE
    USING (public.is_team_owner(id) OR public.is_admin())
    WITH CHECK (public.is_team_owner(id) OR public.is_admin());

-- Only admins can delete (disband) teams
CREATE POLICY "teams_delete" ON public.teams
    FOR DELETE
    USING (public.is_admin());

-- ---- TEAM_MEMBERS RLS ----

-- Accepted participants + admins can read team members
CREATE POLICY "team_members_select" ON public.team_members
    FOR SELECT
    USING (public.is_accepted() OR public.is_admin());

-- Team owner (via app logic) or admin can add members; RPC or app ensures cap
CREATE POLICY "team_members_insert" ON public.team_members
    FOR INSERT
    WITH CHECK (
        public.is_admin()
        OR (public.is_accepted() AND public.is_team_owner(team_id))
    );

-- User can remove self (leave); admins can remove any
CREATE POLICY "team_members_delete" ON public.team_members
    FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

-- ---- JOIN_REQUESTS RLS ----

-- Requester, team owner, or admin can read
CREATE POLICY "join_requests_select" ON public.join_requests
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR public.is_team_owner(team_id)
        OR public.is_admin()
    );

-- Accepted user (not already on a team) can create pending request
CREATE POLICY "join_requests_insert" ON public.join_requests
    FOR INSERT
    WITH CHECK (
        public.is_accepted()
        AND auth.uid() = user_id
        AND status = 'pending'
    );

-- Team owner or admin can update (approve/deny)
CREATE POLICY "join_requests_update" ON public.join_requests
    FOR UPDATE
    USING (public.is_team_owner(team_id) OR public.is_admin())
    WITH CHECK (public.is_team_owner(team_id) OR public.is_admin());

-- User can delete their own join request (e.g. when leaving a team, to allow re-request later)
CREATE POLICY "join_requests_delete" ON public.join_requests
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_applications_user_id  ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status   ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_exported_at ON public.applications(exported_at);
CREATE INDEX IF NOT EXISTS idx_admin_reviews_app_id  ON public.admin_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id        ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id  ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id  ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_team_id ON public.join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON public.join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status  ON public.join_requests(status);

-- ============================================
-- MIGRATIONS: For existing DBs
-- Run in Supabase SQL Editor if columns/functions are missing:
-- ============================================
-- ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ;
-- CREATE INDEX IF NOT EXISTS idx_applications_exported_at ON public.applications(exported_at);
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymous_in_teams BOOLEAN NOT NULL DEFAULT false;

-- Fix: Allow users who left a team to request to join again (delete join_request on leave)
-- Run this once in Supabase SQL Editor:
-- DROP POLICY IF EXISTS "join_requests_delete" ON public.join_requests;
-- CREATE POLICY "join_requests_delete" ON public.join_requests FOR DELETE USING (auth.uid() = user_id);
