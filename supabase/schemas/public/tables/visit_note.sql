CREATE TABLE "public"."visit_note" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  uuid                     NOT NULL,
  "patient_id" uuid                     NOT NULL,
  "doctor_id"  uuid,
  "details"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "visit_note_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "visit_note_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL,
  CONSTRAINT "visit_note_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE,
  CONSTRAINT "visit_note_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."visit_note"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_visit_note_clinic ON public.visit_note USING btree (clinic_id);

CREATE TRIGGER trg_log_visit_note
  AFTER INSERT OR UPDATE ON public.visit_note
  FOR EACH ROW
  EXECUTE FUNCTION public.log_visit_note_activity();

CREATE POLICY "Clinic members can manage patient visit_notes in their own clin" ON "public"."visit_note"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."visit_note" TO "anon", "authenticated", "postgres", "service_role";
