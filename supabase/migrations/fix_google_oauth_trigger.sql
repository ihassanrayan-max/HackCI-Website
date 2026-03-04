-- ============================================
-- Migration: Fix handle_new_user trigger for Google OAuth
-- Handles both email/password metadata (first_name, last_name)
-- and Google OAuth metadata (given_name, family_name, full_name)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
            NULLIF(TRIM(NEW.raw_user_meta_data->>'given_name'), ''),
            NULLIF(TRIM(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)), '')
        ),
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
            NULLIF(TRIM(NEW.raw_user_meta_data->>'family_name'), ''),
            NULLIF(TRIM(
                CASE
                    WHEN position(' ' IN COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')) > 0
                    THEN substring(
                        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
                        position(' ' IN COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')) + 1
                    )
                    ELSE ''
                END
            ), '')
        ),
        'applicant'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
