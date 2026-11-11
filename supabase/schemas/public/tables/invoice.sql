CREATE TABLE "public"."invoice" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"    uuid                     NOT NULL,
  "patient_id"   uuid                     NOT NULL,
  "status"       text                     NOT NULL DEFAULT 'unpaid'::text,
  "total_amount" numeric(10,2)            NOT NULL DEFAULT 0.00,
  "details"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "invoice_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "invoice_pkey" PRIMARY KEY (id),
  CONSTRAINT "invoice_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE
);

ALTER TABLE "public"."invoice"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_invoice_clinic ON public.invoice USING btree (clinic_id);

CREATE POLICY "Clinic members can manage patient invoices in their own clinic" ON "public"."invoice"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."invoice" TO "anon", "authenticated", "postgres", "service_role";
