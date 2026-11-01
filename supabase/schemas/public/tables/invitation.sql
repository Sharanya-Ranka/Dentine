CREATE TABLE "public"."invitation" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"     uuid                     NOT NULL,
  "inviter_id"    uuid                     NOT NULL,
  "invitee_email" text                     NOT NULL,
  "role"          text                     NOT NULL DEFAULT 'non-owner'::text,
  "token"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "status"        text                     NOT NULL DEFAULT 'pending'::text,
  "expires_at"    timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "invitation_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT "invitation_inviter_id_fkey" FOREIGN KEY (inviter_id) REFERENCES public.app_user(user_id) ON DELETE CASCADE,
  CONSTRAINT "invitation_pkey" PRIMARY KEY (id),
  CONSTRAINT "invitation_token_key" UNIQUE (token),
  CONSTRAINT "unique_pending_clinic_invite" UNIQUE (clinic_id, invitee_email, status)
);

ALTER TABLE "public"."invitation"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_invitation_clinic ON public.invitation USING btree (clinic_id);

CREATE INDEX idx_invitation_email ON public.invitation USING btree (lower(invitee_email));

CREATE INDEX idx_invitation_token ON public.invitation USING btree (token)
  WHERE (status = 'pending'::text);

CREATE POLICY "Clinic owners can delete clinic invitations" ON "public"."invitation"
  FOR DELETE
  TO "authenticated"
  USING (public.user_is_owner(clinic_id, auth.uid()));

CREATE POLICY "Clinic owners can issue invitations" ON "public"."invitation"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.user_is_owner(clinic_id, auth.uid()) AND (inviter_id = auth.uid())));

CREATE POLICY "Clinic owners can update clinic invitations" ON "public"."invitation"
  FOR UPDATE
  TO "authenticated"
  USING (public.user_is_owner(clinic_id, auth.uid()))
  WITH CHECK (public.user_is_owner(clinic_id, auth.uid()));

CREATE POLICY "Clinic owners can view issued clinic invitations" ON "public"."invitation"
  FOR SELECT
  TO "authenticated"
  USING (public.user_is_owner(clinic_id, auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."invitation" TO "anon", "authenticated", "postgres", "service_role";
