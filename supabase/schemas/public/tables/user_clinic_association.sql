CREATE TABLE "public"."user_clinic_association" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "clinic_id"  uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_user_clinic_membership" UNIQUE (user_id, clinic_id),
  CONSTRAINT "user_clinic_association_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "user_clinic_association_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_clinic_association_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_user(user_id) ON DELETE CASCADE
);

ALTER TABLE "public"."user_clinic_association"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_clinic_association"
  ADD COLUMN "role" public.clinic_role NOT NULL DEFAULT 'non-owner'::public.clinic_role;

CREATE INDEX idx_uca_clinic_id ON public.user_clinic_association USING btree (clinic_id);

CREATE INDEX idx_uca_clinic_role ON public.user_clinic_association USING btree (clinic_id, ROLE);

CREATE INDEX idx_uca_user_id ON public.user_clinic_association USING btree (user_id);

CREATE POLICY "Owners can add or modify clinic associations" ON "public"."user_clinic_association"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_owner(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_owner(auth.uid(), clinic_id));

CREATE POLICY "Users can read their own clinic associations" ON "public"."user_clinic_association"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = auth.uid()) OR public.user_is_owner(auth.uid(), clinic_id)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_clinic_association" TO "anon", "authenticated", "postgres", "service_role";
