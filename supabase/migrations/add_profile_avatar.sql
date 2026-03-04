-- ============================================
-- Optional profile avatar (participant)
-- ============================================
-- Adds avatar_path to profiles and creates storage bucket for avatar uploads.
-- Avatars are visible only in Team Hub and Admin (enforced in app); bucket can be
-- public for stable URLs.
--
-- If the storage bucket INSERT fails, create it in Supabase Dashboard: Storage → New bucket:
--   Name: avatars, Public: yes, File size limit: 2 MB, Allowed MIME types: image/jpeg, image/png, image/webp

DROP FUNCTION IF EXISTS public.get_team_visible_profiles(uuid[]);

-- 1. Add avatar_path to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- 2. Create storage bucket (optional; create in Dashboard if this fails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Policies: users can upload/update/delete only their own avatar (path = {user_id}/...)
DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow authenticated users to read avatars (for Team Hub / Admin)
DROP POLICY IF EXISTS "avatars_read_authenticated" ON storage.objects;
CREATE POLICY "avatars_read_authenticated" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

-- 5. Extend get_team_visible_profiles to return avatar_path (for Team Hub / accepted viewers)
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
        v_avatar_path := NULL;

        IF NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.user_id = v_uid AND a.status = 'accepted') THEN
            CONTINUE;
        END IF;

        SELECT EXISTS (
            SELECT 1 FROM public.team_members m1
            JOIN public.team_members m2 ON m1.team_id = m2.team_id
            WHERE m1.user_id = v_caller_id AND m2.user_id = v_uid
        ) INTO v_same_team;

        IF v_same_team THEN
            v_visible := true;
        END IF;

        IF NOT v_visible THEN
            SELECT EXISTS (
                SELECT 1 FROM public.teams t
                JOIN public.join_requests jr ON jr.team_id = t.id
                WHERE t.owner_id = v_caller_id AND jr.user_id = v_uid AND jr.status = 'pending'
            ) INTO v_visible;
        END IF;

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

        SELECT p.anonymous_in_teams, p.first_name, p.last_name, p.avatar_path
        INTO v_anon, v_p_first, v_p_last, v_avatar_path
        FROM public.profiles p WHERE p.id = v_uid;

        SELECT a.answers INTO v_answers FROM public.applications a WHERE a.user_id = v_uid LIMIT 1;

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
