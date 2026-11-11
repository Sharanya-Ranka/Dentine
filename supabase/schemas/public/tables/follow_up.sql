CREATE TABLE "public"."follow_up" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  uuid                     NOT NULL,
  "patient_id" uuid                     NOT NULL,
  "type"       text                     NOT NULL DEFAULT 'once'::text,
  "status"     text                     NOT NULL DEFAULT 'active'::text,
  "num_days"   integer                  NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "follow_up_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "follow_up_pkey" PRIMARY KEY (id),
  CONSTRAINT "follow_up_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE
);

ALTER TABLE "public"."follow_up"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_follow_up_clinic ON public.follow_up USING btree (clinic_id);

CREATE POLICY "Clinic members can manage patient follow_ups in their own clini" ON "public"."follow_up"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."follow_up" TO "anon", "authenticated", "postgres", "service_role";
