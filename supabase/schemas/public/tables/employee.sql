CREATE TABLE "public"."employee" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  uuid                     NOT NULL,
  "user_id"    uuid,
  "name"       text                     NOT NULL,
  "details"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "type"       text                     NOT NULL DEFAULT 'employee'::text,
  "role"       text                     NOT NULL DEFAULT 'doctor'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "employee_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "employee_pkey" PRIMARY KEY (id),
  CONSTRAINT "employee_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT "employee_user_id_key" UNIQUE (user_id)
);

CREATE INDEX idx_employee_clinic ON public.employee USING btree (clinic_id);

CREATE INDEX idx_employee_user ON public.employee USING btree (user_id);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."employee" TO "anon", "authenticated", "postgres", "service_role";
