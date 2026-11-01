CREATE TABLE "public"."payment" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"       uuid                     NOT NULL,
  "patient_id"      uuid                     NOT NULL,
  "invoice_id"      uuid,
  "amount"          numeric(10,2)            NOT NULL,
  "payment_method"  text                     NOT NULL,
  "transaction_ref" text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "payment_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "payment_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE SET NULL,
  CONSTRAINT "payment_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE,
  CONSTRAINT "payment_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."payment"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payment_clinic ON public.payment USING btree (clinic_id);

CREATE POLICY "Clinic members can manage patient payments in their own clinic" ON "public"."payment"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payment" TO "anon", "authenticated", "postgres", "service_role";
