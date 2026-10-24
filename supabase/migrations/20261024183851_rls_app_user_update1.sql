CREATE OR REPLACE FUNCTION public.get_my_owned_clinic_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT clinic_id
    FROM public.user_clinic_association
    WHERE user_id = auth.uid()
      AND role = 'owner';
$$;

CREATE POLICY "Owners can see profiles of members belonging to their clinic"
    ON public.app_user FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT user_id 
            FROM public.user_clinic_association
            WHERE clinic_id IN (SELECT public.get_my_owned_clinic_ids())
        )
    );