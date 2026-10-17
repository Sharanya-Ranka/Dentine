-- ============================================================================
-- 1. TRIGGER FUNCTION: Sync auth.users to public.app_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    extracted_name TEXT;
BEGIN
    -- 1. Try reading the full name from user_metadata (passed via options.data during signup/magic link)
    extracted_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULLIF(split_part(NEW.email, '@', 1), ''),
        'Practitioner'
    );

    -- 2. Insert into app_user, handling potential idempotent conflicts
    INSERT INTO public.app_user (user_id, name, email, created_at, updated_at)
    VALUES (
        NEW.id,
        extracted_name,
        NEW.email,
        NEW.created_at,
        NEW.created_at
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- Revoke public execution rights for security hygiene
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM public;

-- ============================================================================
-- 2. TRIGGER DEFINITION
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();