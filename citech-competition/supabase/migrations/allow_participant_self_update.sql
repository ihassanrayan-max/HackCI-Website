-- ============================================================
-- Migration: Allow participants to update their own profile
-- Non-admins cannot change status or user_id.
-- ============================================================

DROP POLICY IF EXISTS "comp_participants_update" ON public.comp_participants;

CREATE POLICY "comp_participants_update" ON public.comp_participants
    FOR UPDATE
    USING (auth.uid() = user_id OR public.comp_is_admin())
    WITH CHECK (auth.uid() = user_id OR public.comp_is_admin());

-- Prevent non-admins from changing status or user_id
CREATE OR REPLACE FUNCTION public.comp_participants_prevent_privileged_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF public.comp_is_admin() THEN
        RETURN NEW;
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Only an admin can change participant status.';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Only an admin can change participant user_id.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comp_participants_prevent_privileged_update_trigger ON public.comp_participants;
CREATE TRIGGER comp_participants_prevent_privileged_update_trigger
    BEFORE UPDATE ON public.comp_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.comp_participants_prevent_privileged_update();
