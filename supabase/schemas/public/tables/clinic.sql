CREATE TABLE "public"."clinic" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "clinic_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."clinic"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their clinic" ON "public"."clinic"
  FOR SELECT
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."clinic" TO "anon", "authenticated", "postgres", "service_role";
