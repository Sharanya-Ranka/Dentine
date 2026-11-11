CREATE TABLE "public"."lab" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"      uuid                     NOT NULL,
  "name"           text                     NOT NULL,
  "contact_person" text,
  "phone"          text,
  "email"          text,
  "address"        text,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "lab_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "lab_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."lab"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lab_clinic_id ON public.lab USING btree (clinic_id);

CREATE POLICY "Clinic members can manage patient labs in their own clinic" ON "public"."lab"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab" TO "anon", "authenticated", "postgres", "service_role";
