CREATE TABLE "public"."appointment" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"        uuid                     NOT NULL,
  "patient_id"       uuid                     NOT NULL,
  "doctor_id"        uuid,
  "operatory_number" integer                  NOT NULL DEFAULT 1,
  "start_time"       timestamp with time zone NOT NULL,
  "end_time"         timestamp with time zone NOT NULL,
  "status"           text                     NOT NULL DEFAULT 'scheduled'::text,
  "type"             text                     NOT NULL DEFAULT 'consultation'::text,
  "notes"            text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "appointment_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL,
  CONSTRAINT "appointment_pkey" PRIMARY KEY (id),
  CONSTRAINT "appointment_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "appointment_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE
);

ALTER TABLE "public"."appointment"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_appointment_clinic_time ON public.appointment USING btree (clinic_id, start_time, end_time);

CREATE INDEX idx_appointment_doctor_id ON public.appointment USING btree (doctor_id);

CREATE TRIGGER trg_appointment_reminder
  AFTER INSERT OR UPDATE ON public.appointment
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_appointment_reminder();

ALTER TABLE "public"."appointment"
  DISABLE TRIGGER "trg_appointment_reminder";

CREATE POLICY "Doctors can create appointments for themselves in member clinic" ON "public"."appointment"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((doctor_id = auth.uid()) AND public.user_is_member(auth.uid(), clinic_id)));

CREATE POLICY "Doctors can update their assigned appointments in member clinic" ON "public"."appointment"
  FOR UPDATE
  TO "authenticated"
  USING (((doctor_id = auth.uid()) AND public.user_is_member(auth.uid(), clinic_id)))
  WITH CHECK (((doctor_id = auth.uid()) AND public.user_is_member(auth.uid(), clinic_id)));

CREATE POLICY "Doctors can view their assigned appointments in member clinics" ON "public"."appointment"
  FOR SELECT
  TO "authenticated"
  USING (((doctor_id = auth.uid()) AND public.user_is_member(auth.uid(), clinic_id)));

CREATE POLICY "Owners can view all appointments in their clinic" ON "public"."appointment"
  FOR SELECT
  TO "authenticated"
  USING (public.user_is_owner(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."appointment" TO "anon", "authenticated", "postgres", "service_role";
