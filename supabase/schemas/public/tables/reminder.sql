CREATE TABLE "public"."reminder" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"      uuid                     NOT NULL,
  "user_id"        uuid,
  "asof_datetime"  timestamp with time zone NOT NULL,
  "remind_in_days" integer                  NOT NULL DEFAULT 0,
  "due_at"         timestamp with time zone NOT NULL,
  "status"         text                     NOT NULL DEFAULT 'active'::text,
  "type"           text                     NOT NULL DEFAULT 'general'::text,
  "details"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reminder_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "reminder_pkey" PRIMARY KEY (id),
  CONSTRAINT "reminder_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL
);

ALTER TABLE "public"."reminder"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reminder_clinic_status_due ON public.reminder USING btree (clinic_id, status, due_at);

CREATE INDEX idx_reminder_entity_id ON public.reminder USING btree (((details ->> 'entity_id'::text)));

CREATE INDEX idx_reminder_type ON public.reminder USING btree (clinic_id, TYPE);

CREATE TRIGGER trg_set_reminder_due_at
  BEFORE INSERT OR UPDATE OF asof_datetime, remind_in_days ON public.reminder
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_calculate_reminder_due_at();

CREATE POLICY "Clinic members can manage patient reminders in their own clinic" ON "public"."reminder"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reminder" TO "anon", "authenticated", "postgres", "service_role";
