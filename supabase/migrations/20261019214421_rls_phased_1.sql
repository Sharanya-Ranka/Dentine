ALTER TABLE document ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient documents in their own clinic"
    ON document FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );


ALTER TABLE follow_up ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient follow_ups in their own clinic"
    ON follow_up FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );
    

ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient invoices in their own clinic"
    ON invoice FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );

ALTER TABLE lab ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient labs in their own clinic"
    ON lab FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );

ALTER TABLE lab_procedure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient lab_procedures in their own clinic"
    ON lab_procedure FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );


ALTER TABLE lab_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient lab_tests in their own clinic"
    ON lab_test FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );


ALTER TABLE payment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient payments in their own clinic"
    ON payment FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );


ALTER TABLE prescription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient prescriptions in their own clinic"
    ON prescription FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );



ALTER TABLE "procedure" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient procedures in their own clinic"
    ON "procedure" FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );


ALTER TABLE reminder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient reminders in their own clinic"
    ON reminder FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );



ALTER TABLE treatment_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient treatment_plans in their own clinic"
    ON treatment_plan FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );

    


ALTER TABLE visit_note ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient visit_notes in their own clinic"
    ON visit_note FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );
