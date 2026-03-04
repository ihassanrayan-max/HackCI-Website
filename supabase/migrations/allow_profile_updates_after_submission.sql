-- ============================================
-- Allow profile/contact updates after submission
-- ============================================
-- Problem: Contact info (Discord, Instagram, WhatsApp) and other profile fields
-- live in applications.answers. The old policy only allowed UPDATE when
-- status = 'draft', so once a user submitted (or was accepted), profile saves
-- appeared to succeed but applications.answers was never written.
--
-- Fix: Allow users to update their own application row so they can update
-- answers (profile/contact) anytime. A trigger prevents non-admins from
-- reverting status back to 'draft'.

-- 1. Drop the existing policy that restricted updates to draft only
DROP POLICY IF EXISTS "applications_update" ON public.applications;

-- 2. New policy: users can update their own application; admins can update any
CREATE POLICY "applications_update" ON public.applications
    FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 3. Trigger: prevent non-admins from setting status to 'draft' when it's not already draft
CREATE OR REPLACE FUNCTION public.applications_prevent_draft_revert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only care when status is being changed to 'draft'
    IF NEW.status = 'draft' AND (OLD.status IS NULL OR OLD.status <> 'draft') THEN
        -- Admins can do anything
        IF public.is_admin() THEN
            RETURN NEW;
        END IF;
        -- Non-admins cannot reopen a submitted application
        RAISE EXCEPTION 'Cannot change application status back to draft after submission.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_prevent_draft_revert_trigger ON public.applications;
CREATE TRIGGER applications_prevent_draft_revert_trigger
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.applications_prevent_draft_revert();
