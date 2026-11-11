CREATE TABLE "public"."lab_test" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"        uuid                     NOT NULL,
  "patient_id"       uuid                     NOT NULL,
  "doctor_id"        uuid,
  "status"           text                     NOT NULL DEFAULT 'pending'::text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "lab_procedure_id" uuid                     NOT NULL,
  CONSTRAINT "lab_test_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "lab_test_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL,
  CONSTRAINT "lab_test_lab_procedure_id_fkey" FOREIGN KEY (lab_procedure_id) REFERENCES public.lab_procedure(id) ON DELETE RESTRICT,
  CONSTRAINT "lab_test_pkey" PRIMARY KEY (id),
  CONSTRAINT "lab_test_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE
);

ALTER TABLE "public"."lab_test"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lab_test_clinic ON public.lab_test USING btree (clinic_id);

CREATE TRIGGER trg_lab_test_reminder
  AFTER INSERT OR UPDATE ON public.lab_test
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_lab_test_reminder();

CREATE TRIGGER trg_log_lab_test
  AFTER INSERT OR UPDATE ON public.lab_test
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lab_test_activity();

CREATE POLICY "Clinic members can manage patient lab_tests in their own clinic" ON "public"."lab_test"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab_test" TO "anon", "authenticated", "postgres", "service_role";
