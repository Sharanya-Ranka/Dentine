CREATE TABLE "public"."treatment_plan" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  uuid                     NOT NULL,
  "patient_id" uuid                     NOT NULL,
  "doctor_id"  uuid,
  "status"     text                     NOT NULL DEFAULT 'draft'::text,
  "details"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "treatment_plan_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "treatment_plan_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL,
  CONSTRAINT "treatment_plan_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE,
  CONSTRAINT "treatment_plan_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."treatment_plan"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_treatment_plan_clinic ON public.treatment_plan USING btree (clinic_id);

CREATE TRIGGER trg_log_treatment_plan
  AFTER INSERT OR UPDATE ON public.treatment_plan
  FOR EACH ROW
  EXECUTE FUNCTION public.log_treatment_plan_activity();

CREATE POLICY "Clinic members can manage patient treatment_plans in their own " ON "public"."treatment_plan"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."treatment_plan" TO "anon", "authenticated", "postgres", "service_role";
