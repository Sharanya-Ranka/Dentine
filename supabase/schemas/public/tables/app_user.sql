CREATE TABLE "public"."app_user" (
  "user_id"    uuid                     NOT NULL,
  "name"       text                     NOT NULL,
  "email"      text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "app_user_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "app_user_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."app_user"
  ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_app_user_email_lower ON public.app_user USING btree (lower(email));

CREATE POLICY "Owners can see profiles of members belonging to their clinic" ON "public"."app_user"
  FOR SELECT
  TO "authenticated"
  USING ((user_id IN ( SELECT user_clinic_association.user_id
   FROM public.user_clinic_association
  WHERE (user_clinic_association.clinic_id IN ( SELECT public.get_my_owned_clinic_ids() AS get_my_owned_clinic_ids)))));

CREATE POLICY "Users can insert their own profile" ON "public"."app_user"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can update their own profile" ON "public"."app_user"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can view their own profile and co-members" ON "public"."app_user"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."app_user" TO "anon", "authenticated", "postgres", "service_role";
