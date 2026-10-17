CREATE OR REPLACE FUNCTION public.user_is_owner(p_user_id UUID, p_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_clinic_association
    WHERE user_id = p_user_id
      AND clinic_id = p_clinic_id
      AND role = 'owner'
  );
$$;

-- Grant execution rights to authenticated users
GRANT EXECUTE ON FUNCTION public.user_is_owner(UUID, UUID) TO authenticated;

-- Drop old recursive policies
DROP POLICY IF EXISTS "Users can read their own clinic associations" ON user_clinic_association;
DROP POLICY IF EXISTS "Owners can add or modify clinic associations" ON user_clinic_association;

-- 1. Read Policy (SELECT)
CREATE POLICY "Users can read their own clinic associations"
    ON user_clinic_association FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        public.user_is_owner(auth.uid(), clinic_id)
    );

-- 2. Mutation Policy (INSERT, UPDATE, DELETE)
CREATE POLICY "Owners can add or modify clinic associations"
    ON user_clinic_association FOR ALL
    TO authenticated
    USING (
        public.user_is_owner(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_owner(auth.uid(), clinic_id)
    );