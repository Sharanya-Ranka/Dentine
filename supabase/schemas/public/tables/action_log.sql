CREATE TABLE "public"."action_log" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"   uuid                     NOT NULL,
  "patient_id"  uuid                     NOT NULL,
  "actor_id"    uuid,
  "entity_type" text                     NOT NULL,
  "entity_id"   uuid                     NOT NULL,
  "action"      text                     NOT NULL,
  "details"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "action_log_pkey" PRIMARY KEY (id),
  CONSTRAINT "action_log_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL,
  CONSTRAINT "action_log_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "action_log_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE
);

CREATE INDEX idx_action_log_clinic_id ON public.action_log USING btree (clinic_id);

CREATE INDEX idx_action_log_patient_timeline ON public.action_log USING btree (patient_id, created_at DESC);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."action_log" TO "anon", "authenticated", "postgres", "service_role";
