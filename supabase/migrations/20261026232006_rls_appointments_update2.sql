CREATE POLICY "Owners can view all appointments in their clinic"
    ON appointment FOR SELECT
    TO authenticated
    USING (
        public.user_is_owner(auth.uid(), clinic_id)
    );