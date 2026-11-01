CREATE TABLE "public"."prescription" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  uuid                     NOT NULL,
  "patient_id" uuid                     NOT NULL,
  "doctor_id"  uuid,
  "details"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "prescription_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "prescription_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL,
  CONSTRAINT "prescription_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE,
  CONSTRAINT "prescription_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."prescription"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_prescription_clinic ON public.prescription USING btree (clinic_id);

CREATE TRIGGER trg_log_prescription
  AFTER INSERT OR UPDATE ON public.prescription
  FOR EACH ROW
  EXECUTE FUNCTION public.log_prescription_activity();

CREATE POLICY "Clinic members can manage patient prescriptions in their own cl" ON "public"."prescription"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."prescription" TO "anon", "authenticated", "postgres", "service_role";
