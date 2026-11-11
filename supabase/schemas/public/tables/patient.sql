CREATE TABLE "public"."patient" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  uuid                     NOT NULL,
  "name"       text                     NOT NULL,
  "details"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "patient_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "patient_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."patient"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_patient_clinic_id ON public.patient USING btree (clinic_id);

CREATE INDEX idx_patient_clinic ON public.patient USING btree (clinic_id);

CREATE POLICY "Clinic members can manage their clinic patients" ON "public"."patient"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."patient" TO "anon", "authenticated", "postgres", "service_role";
