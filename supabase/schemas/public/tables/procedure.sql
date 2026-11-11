CREATE TABLE "public"."procedure" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  uuid                     NOT NULL,
  "name"       text                     NOT NULL,
  "type"       text,
  "cost"       numeric(10,2)            NOT NULL DEFAULT 0.00,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "procedure_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "procedure_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."procedure"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage patient procedures in their own clini" ON "public"."procedure"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."procedure" TO "anon", "authenticated", "postgres", "service_role";
