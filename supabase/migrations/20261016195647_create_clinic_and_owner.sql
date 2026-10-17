-- ============================================================================
-- 1. CLINIC CREATION RPC (Bypasses Tenancy Chicken-and-Egg via SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_clinic_with_owner(clinic_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_clinic_id UUID;
    calling_user_id UUID;
BEGIN
    calling_user_id := auth.uid();
    IF calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Create the clinic record
    INSERT INTO clinic (name)
    VALUES (clinic_name)
    RETURNING id INTO new_clinic_id;

    -- 2. Associate the calling user as the owner
    INSERT INTO user_clinic_association (user_id, clinic_id, role)
    VALUES (calling_user_id, new_clinic_id, 'owner');

    RETURN new_clinic_id;
END;
$$;

-- Allow authenticated users to execute clinic creation
GRANT EXECUTE ON FUNCTION create_clinic_with_owner(TEXT) TO authenticated;

-- -- ============================================================================
-- -- 2. CLINIC TABLE RLS
-- -- ============================================================================
-- ALTER TABLE clinic ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view clinics they belong to"
--     ON clinic FOR SELECT
--     TO authenticated
--     USING (
--         EXISTS (
--             SELECT 1 FROM user_clinic_association uca
--             WHERE uca.clinic_id = clinic.id
--               AND uca.user_id = auth.uid()
--         )
--     );