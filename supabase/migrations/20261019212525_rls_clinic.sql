ALTER TABLE clinic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their clinic"
    ON clinic FOR SELECT
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), id)
    );