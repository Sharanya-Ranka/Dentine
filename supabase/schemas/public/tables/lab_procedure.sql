CREATE TABLE "public"."lab_procedure" (
  "id"                        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"                 uuid                     NOT NULL,
  "lab_id"                    uuid                     NOT NULL,
  "name"                      text                     NOT NULL,
  "cost"                      numeric(10,2)            NOT NULL DEFAULT 0.00,
  "estimated_turnaround_days" integer                  NOT NULL DEFAULT 7,
  "created_at"                timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "lab_procedure_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "lab_procedure_lab_id_fkey" FOREIGN KEY (lab_id) REFERENCES public.lab(id) ON DELETE CASCADE,
  CONSTRAINT "lab_procedure_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."lab_procedure"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lab_procedure_clinic_id ON public.lab_procedure USING btree (clinic_id);

CREATE INDEX idx_lab_procedure_lab_id ON public.lab_procedure USING btree (lab_id);

CREATE POLICY "Clinic members can manage patient lab_procedures in their own c" ON "public"."lab_procedure"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab_procedure" TO "anon", "authenticated", "postgres", "service_role";
