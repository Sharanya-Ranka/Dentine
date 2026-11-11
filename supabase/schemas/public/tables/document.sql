CREATE TABLE "public"."document" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"    uuid                     NOT NULL,
  "patient_id"   uuid                     NOT NULL,
  "name"         text                     NOT NULL,
  "type"         text,
  "storage_path" text                     NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "document_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "document_pkey" PRIMARY KEY (id),
  CONSTRAINT "document_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE
);

ALTER TABLE "public"."document"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_document_clinic ON public.document USING btree (clinic_id);

CREATE TRIGGER trg_log_document
  AFTER INSERT OR UPDATE ON public.document
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_activity();

CREATE POLICY "Clinic members can manage patient documents in their own clinic" ON "public"."document"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."document" TO "anon", "authenticated", "postgres", "service_role";
