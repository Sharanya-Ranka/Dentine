SET local check_function_bodies = off;

REVOKE ALL ON TABLE "public"."invitation" FROM "anon";

REVOKE ALL ON TABLE "public"."medication_catalog" FROM "anon";

DROP POLICY "Clinic owners can delete clinic invitations" ON "public"."invitation";

DROP POLICY "Clinic owners can issue invitations" ON "public"."invitation";

DROP POLICY "Clinic owners can update clinic invitations" ON "public"."invitation";

DROP POLICY "Clinic owners can view issued clinic invitations" ON "public"."invitation";

CREATE OR REPLACE FUNCTION public.decline_clinic_invitation (
  p_token uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    v_invitation RECORD;
    v_user_email TEXT;
    v_user_id UUID := auth.uid();
BEGIN
    -- 1. Ensure caller is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- 2. Fetch authenticated user's email
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    -- 3. Lock and validate invitation
    SELECT * INTO v_invitation
    FROM public.invitation
    WHERE token = p_token
      AND status = 'pending'
      AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid, expired, or already claimed invitation';
    END IF;

    -- 4. Verify the accepting user matches the intended email address
    IF lower(v_invitation.invitee_email) <> lower(v_user_email) THEN
        RAISE EXCEPTION 'This invitation was sent to %, but you are signed in as %', 
            v_invitation.invitee_email, v_user_email;
    END IF;

    -- 6. Mark invitation as accepted
    UPDATE public.invitation
    SET status = 'declined',
        updated_at = now()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
        'success', true,
        'clinic_id', v_invitation.clinic_id
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.email_belongs_to_user (
  p_user_id uuid,
  p_email   text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'auth'
  AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = p_user_id
      AND lower(email) = lower(p_email)
  );
$function$;

CREATE OR REPLACE FUNCTION public.enforce_prescription_immutable_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  -- Only allow one-way transition from 'issued' to 'cancelled'
  IF OLD.status <> 'issued' OR NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Prescriptions can only transition from "issued" to "cancelled". Current status: %, Attempted: %', 
      OLD.status, NEW.status;
  END IF;

  -- Prevent modifying core clinical data
  IF (OLD.id, OLD.clinic_id, OLD.patient_id, OLD.doctor_id, OLD.details, OLD.notes, OLD.created_at)
     IS DISTINCT FROM
     (NEW.id, NEW.clinic_id, NEW.patient_id, NEW.doctor_id, NEW.details, NEW.notes, NEW.created_at) THEN
    RAISE EXCEPTION 'Clinical details and relationships on an issued prescription are immutable.';
  END IF;

  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$function$;

CREATE POLICY "Clinic owners can delete clinic invitations" ON "public"."invitation"
  FOR DELETE
  TO "authenticated"
  USING (public.user_is_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can issue invitations" ON "public"."invitation"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.user_is_owner(auth.uid(), clinic_id) AND (inviter_id = auth.uid())));

CREATE POLICY "Clinic owners can update clinic invitations" ON "public"."invitation"
  FOR UPDATE
  TO "authenticated"
  USING (public.user_is_owner(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can view issued clinic invitations" ON "public"."invitation"
  FOR SELECT
  TO "authenticated"
  USING (public.user_is_owner(auth.uid(), clinic_id));

CREATE POLICY "Users can view clinic invitations issued to them" ON "public"."invitation"
  FOR SELECT
  TO "authenticated"
  USING (public.email_belongs_to_user(auth.uid(), invitee_email));

GRANT EXECUTE ON FUNCTION "public"."decline_clinic_invitation"(uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."email_belongs_to_user"(uuid, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
