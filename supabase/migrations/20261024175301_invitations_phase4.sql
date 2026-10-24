-- ============================================================================
-- 1. DROP EXISTING POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Clinic owners can view issued clinic invitations" ON public.invitation;
DROP POLICY IF EXISTS "Clinic owners can issue invitations" ON public.invitation;
DROP POLICY IF EXISTS "Clinic owners can update clinic invitations" ON public.invitation;
DROP POLICY IF EXISTS "Clinic owners can delete clinic invitations" ON public.invitation;

-- ============================================================================
-- 2. RECREATE OWNER-ONLY POLICIES WITH INTERCHANGED ARGUMENTS:
--    public.user_is_owner(auth.uid(), clinic_id)
-- ============================================================================

-- Policy 1: SELECT (Only clinic owners can inspect issued invitations)
CREATE POLICY "Clinic owners can view issued clinic invitations"
    ON public.invitation FOR SELECT
    TO authenticated
    USING (
        public.user_is_owner(auth.uid(), clinic_id)
    );

-- Policy 2: INSERT (Only clinic owners can issue new invitations)
CREATE POLICY "Clinic owners can issue invitations"
    ON public.invitation FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_is_owner(auth.uid(), clinic_id)
        AND inviter_id = auth.uid()
    );

-- Policy 3: UPDATE (Only clinic owners can revoke or modify invitation status)
CREATE POLICY "Clinic owners can update clinic invitations"
    ON public.invitation FOR UPDATE
    TO authenticated
    USING (
        public.user_is_owner(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_owner(auth.uid(), clinic_id)
    );

-- Policy 4: DELETE (Only clinic owners can purge invitation records)
CREATE POLICY "Clinic owners can delete clinic invitations"
    ON public.invitation FOR DELETE
    TO authenticated
    USING (
        public.user_is_owner(auth.uid(), clinic_id)
    );