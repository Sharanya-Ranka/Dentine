SET local check_function_bodies = off;

REVOKE ALL ON TABLE "public"."prescription" FROM "anon";

DROP POLICY "Clinic owners can delete clinic invitations" ON "public"."invitation";

DROP POLICY "Clinic owners can issue invitations" ON "public"."invitation";

DROP POLICY "Clinic owners can update clinic invitations" ON "public"."invitation";

DROP POLICY "Clinic owners can view issued clinic invitations" ON "public"."invitation";

DROP POLICY "Clinic members can manage patient prescriptions in their own cl" ON "public"."prescription";

DROP TRIGGER "trg_log_prescription" ON "public"."prescription";

CREATE TABLE "public"."medication_catalog" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"             uuid                     NOT NULL,
  "name"                  text                     NOT NULL,
  "generic_name"          text,
  "default_dosage"        text                     NOT NULL,
  "default_frequency"     text                     NOT NULL,
  "default_duration_days" integer                  NOT NULL DEFAULT 5,
  "default_instructions"  text,
  "is_active"             boolean                  NOT NULL DEFAULT true,
  "created_at"            timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "medication_catalog_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."medication_catalog"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prescription"
  ADD COLUMN "notes" text;

ALTER TABLE "public"."prescription"
  ADD COLUMN "status" text NOT NULL DEFAULT 'issued'::text;

ALTER TABLE "public"."prescription"
  ADD COLUMN "cancel_reason" text;

ALTER TABLE "public"."prescription"
  ALTER COLUMN "created_at" SET DEFAULT timezone('utc'::text, now());

ALTER TABLE "public"."prescription"
  ALTER COLUMN "updated_at" SET DEFAULT timezone('utc'::text, now());

CREATE OR REPLACE FUNCTION public.accept_clinic_invitation (
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

    -- 5. Insert tenancy record (or update if previously deactivated)
    INSERT INTO public.user_clinic_association (user_id, clinic_id, role)
    VALUES (v_user_id, v_invitation.clinic_id, v_invitation.role::clinic_role)
    ON CONFLICT (user_id, clinic_id) DO NOTHING;

    -- 6. Mark invitation as accepted
    UPDATE public.invitation
    SET status = 'accepted',
        updated_at = now()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
        'success', true,
        'clinic_id', v_invitation.clinic_id
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_clinic_invitation (
  p_clinic_id     uuid,
  p_invitee_email text,
  p_role          text DEFAULT 'non-owner'::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    v_invitation_id UUID;
BEGIN
    -- Verify caller is clinic owner
    IF NOT public.user_is_owner(auth.uid(), p_clinic_id) THEN
        RAISE EXCEPTION 'Only clinic owners can issue invitations';
    END IF;

    -- Create invitation record
    INSERT INTO public.invitation (
        clinic_id,
        inviter_id,
        invitee_email,
        role
    )
    VALUES (
        p_clinic_id,
        auth.uid(),
        lower(trim(p_invitee_email)),
        p_role
    )
    RETURNING id INTO v_invitation_id;

    -- Asynchronously dispatch the email
    PERFORM public.send_invitation_email(v_invitation_id);

    RETURN v_invitation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_clinic_with_owner (
  clinic_name text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    new_clinic_id UUID;
    calling_user_id UUID;
BEGIN
    calling_user_id := auth.uid();
    IF calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Create the clinic record
    INSERT INTO clinic (name)
    VALUES (clinic_name)
    RETURNING id INTO new_clinic_id;

    -- 2. Associate the calling user as the owner
    INSERT INTO user_clinic_association (user_id, clinic_id, role)
    VALUES (calling_user_id, new_clinic_id, 'owner');

    RETURN new_clinic_id;
END;
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

CREATE OR REPLACE FUNCTION public.get_invitation_preview (
  p_token uuid
)
  RETURNS TABLE (
    clinic_name   text,
    inviter_name  text,
    invitee_email text,
    role          text,
    is_valid      boolean
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.name AS clinic_name,
        u.name AS inviter_name,
        i.invitee_email,
        i.role,
        (i.status = 'pending' AND i.expires_at > now()) AS is_valid
    FROM public.invitation i
    JOIN public.clinic c ON c.id = i.clinic_id
    JOIN public.app_user u ON u.user_id = i.inviter_id
    WHERE i.token = p_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_owned_clinic_ids()
  RETURNS SETOF uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
    SELECT clinic_id
    FROM public.user_clinic_association
    WHERE user_id = auth.uid()
      AND role = 'owner';
$function$;

CREATE OR REPLACE FUNCTION public.get_my_pending_invitations()
  RETURNS TABLE (
    invitation_id uuid,
    clinic_id     uuid,
    clinic_name   text,
    inviter_name  text,
    role          text,
    created_at    timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

    RETURN QUERY
    SELECT 
        i.id,
        i.clinic_id,
        c.name,
        u.name,
        i.role,
        i.created_at
    FROM public.invitation i
    JOIN public.clinic c ON c.id = i.clinic_id
    JOIN public.app_user u ON u.user_id = i.inviter_id
    WHERE lower(i.invitee_email) = lower(v_email)
      AND i.status = 'pending'
      AND i.expires_at > now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    extracted_name TEXT;
BEGIN
    -- 1. Try reading the full name from user_metadata (passed via options.data during signup/magic link)
    extracted_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULLIF(split_part(NEW.email, '@', 1), ''),
        'Practitioner'
    );

    -- 2. Insert into app_user, handling potential idempotent conflicts
    INSERT INTO public.app_user (user_id, name, email, created_at, updated_at)
    VALUES (
        NEW.id,
        extracted_name,
        NEW.email,
        NEW.created_at,
        NEW.created_at
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_document_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NULL, -- The document table schema does not track employee/doctor ID; set to NULL
            'document',
            NEW.id,
            'CREATED',
            jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type,
                'storage_path', NEW.storage_path
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NULL,
            'document',
            NEW.id,
            'UPDATED',
            jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type,
                'old_name', OLD.name,
                'old_type', OLD.type
            )
        );
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_lab_test_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
DECLARE
    v_proc_name TEXT;
    v_lab_name TEXT;
BEGIN
    SELECT lp.name, l.name INTO v_proc_name, v_lab_name
    FROM lab_procedure lp
    JOIN lab l ON l.id = lp.lab_id
    WHERE lp.id = NEW.lab_procedure_id;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'lab_test',
            NEW.id,
            'CREATED',
            jsonb_build_object(
                'procedure', v_proc_name,
                'lab_name', v_lab_name,
                'lab_procedure_id', NEW.lab_procedure_id,
                'status', NEW.status
            )
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'lab_test',
            NEW.id,
            'STATUS_CHANGE',
            jsonb_build_object(
                'procedure', v_proc_name,
                'lab_name', v_lab_name,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'lab_test',
            NEW.id,
            'UPDATED',
            jsonb_build_object(
                'procedure', v_proc_name,
                'lab_name', v_lab_name,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_prescription_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'prescription',
            NEW.id,
            'CREATED',
            NEW.details
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'prescription',
            NEW.id,
            'UPDATED',
            NEW.details
        );
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_treatment_plan_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'treatment_plan',
            NEW.id,
            'CREATED',
            jsonb_build_object(
                'status', NEW.status,
                'details', NEW.details
            )
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'treatment_plan',
            NEW.id,
            'STATUS_CHANGE',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'details', NEW.details
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'treatment_plan',
            NEW.id,
            'UPDATED',
            jsonb_build_object(
                'status', NEW.status,
                'details', NEW.details
            )
        );
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_visit_note_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'visit_note',
            NEW.id,
            'CREATED',
            NEW.details
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'visit_note',
            NEW.id,
            'UPDATED',
            NEW.details
        );
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_invitation_email (
  p_invitation_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    v_project_url TEXT := 'https://nwxolzjldlrwdrbkseka.supabase.co';
    v_anon_key TEXT := 'sb_publishable_PgyCdhmkgfBXspp8tOJyhw_2E78fX2z'; -- Or pass via Vault
    v_edge_function_url TEXT;
BEGIN
    v_edge_function_url := v_project_url || '/functions/v1/send-invite';

    -- Non-blocking HTTP POST via pg_net
    PERFORM net.http_post(
        url := v_edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
        ),
        body := jsonb_build_object(
            'invitation_id', p_invitation_id
        )
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_calculate_reminder_due_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    -- Automatically compute due_at whenever asof_datetime or remind_in_days is set/updated
    NEW.due_at := NEW.asof_datetime + (NEW.remind_in_days * INTERVAL '1 day');
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_sync_appointment_reminder()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
DECLARE
    v_patient_name TEXT;
    v_doctor_name TEXT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Fetch patient and doctor names for rich details
        SELECT name INTO v_patient_name FROM patient WHERE id = NEW.patient_id;
        IF NEW.doctor_id IS NOT NULL THEN
            SELECT name INTO v_doctor_name FROM app_user WHERE id = NEW.doctor_id;
        END IF;

        INSERT INTO reminder (
            clinic_id,
            user_id,
            asof_datetime,
            remind_in_days,
            status,
            type,
            details
        ) VALUES (
            NEW.clinic_id,
            NEW.doctor_id,
            NEW.start_time,
            0, -- Alerts on the day of the meeting by default
            'active',
            'meeting',
            jsonb_build_object(
                'entity_id', NEW.id,
                'patient_id', NEW.patient_id,
                'patient_name', COALESCE(v_patient_name, 'Unknown Patient'),
                'doctor_name', v_doctor_name,
                'title', 'Upcoming Appointment (Chair ' || NEW.operatory_number || ')',
                'notes', COALESCE(NEW.notes, 'Consultation / Procedure scheduled')
            )
        );

    ELSIF (TG_OP = 'UPDATE') THEN
        -- If appointment date/time shifts, automatically re-anchor the reminder
        IF (OLD.start_time IS DISTINCT FROM NEW.start_time) THEN
            UPDATE reminder
            SET asof_datetime = NEW.start_time,
                updated_at = now()
            WHERE clinic_id = NEW.clinic_id
              AND type = 'meeting'
              AND details->>'entity_id' = NEW.id::text;
        END IF;

        -- If appointment completes or cancels, retire the reminder
        IF (NEW.status IN ('completed', 'cancelled', 'no_show') AND OLD.status <> NEW.status) THEN
            UPDATE reminder
            SET status = 'inactive',
                updated_at = now()
            WHERE clinic_id = NEW.clinic_id
              AND type = 'meeting'
              AND details->>'entity_id' = NEW.id::text;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_sync_lab_test_reminder()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
DECLARE
    v_patient_name TEXT;
    v_proc_name TEXT;
    v_lab_name TEXT;
    v_turnaround INT := 7;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT p.name INTO v_patient_name FROM patient p WHERE p.id = NEW.patient_id;
        
        SELECT lp.name, lp.estimated_turnaround_days, l.name
        INTO v_proc_name, v_turnaround, v_lab_name
        FROM lab_procedure lp
        JOIN lab l ON l.id = lp.lab_id
        WHERE lp.id = NEW.lab_procedure_id;

        INSERT INTO reminder (
            clinic_id,
            user_id,
            asof_datetime,
            remind_in_days,
            status,
            type,
            details
        ) VALUES (
            NEW.clinic_id,
            NEW.doctor_id,
            (NEW.created_at + (COALESCE(v_turnaround, 7) || ' days')::interval),
            0,
            'active',
            'lab_test',
            jsonb_build_object(
                'entity_id', NEW.id,
                'patient_id', NEW.patient_id,
                'patient_name', COALESCE(v_patient_name, 'Patient'),
                'title', 'Lab Delivery Due: ' || COALESCE(v_proc_name, 'Prosthesis'),
                'lab_name', v_lab_name,
                'notes', 'Expected turnaround: ' || COALESCE(v_turnaround, 7) || ' days'
            )
        );

    ELSIF (TG_OP = 'UPDATE') THEN
        -- If the lab order completes or is cancelled, deactivate the reminder
        IF (NEW.status IN ('completed', 'cancelled') AND OLD.status <> NEW.status) THEN
            UPDATE reminder
            SET status = 'inactive',
                updated_at = now()
            WHERE clinic_id = NEW.clinic_id
              AND type = 'lab_test'
              AND details->>'entity_id' = NEW.id::text;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_is_member (
  p_user_id   uuid,
  p_clinic_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_clinic_association
    WHERE user_id = p_user_id
      AND clinic_id = p_clinic_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_is_owner (
  p_user_id   uuid,
  p_clinic_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_clinic_association
    WHERE user_id = p_user_id
      AND clinic_id = p_clinic_id
      AND role = 'owner'
  );
$function$;

ALTER TABLE "public"."medication_catalog"
  ADD CONSTRAINT "medication_catalog_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE;

ALTER TABLE "public"."prescription"
  ADD CONSTRAINT "prescription_status_check" CHECK ((status = ANY (ARRAY['issued'::text, 'cancelled'::text])));

CREATE INDEX idx_medication_catalog_clinic ON public.medication_catalog USING btree (clinic_id);

CREATE INDEX idx_prescription_patient ON public.prescription USING btree (patient_id);

ALTER TABLE "public"."appointment"
  DISABLE TRIGGER "trg_appointment_reminder";

CREATE TRIGGER trg_prescription_status_guard
  BEFORE UPDATE ON public.prescription
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_prescription_immutable_update();

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

CREATE POLICY "Allow clinic members to read records in the medical catalog" ON "public"."medication_catalog"
  FOR SELECT
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id));

CREATE POLICY "Allow clinic owners to create, read, update and delete records " ON "public"."medication_catalog"
  FOR ALL
  TO "authenticated"
  USING (public.user_is_owner(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic members can add patient prescriptions in their own clini" ON "public"."prescription"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

CREATE POLICY "Clinic members can cancel patient prescriptions in their own cl" ON "public"."prescription"
  FOR UPDATE
  TO "authenticated"
  USING ((public.user_is_member(auth.uid(), clinic_id) AND (status = 'issued'::text)))
  WITH CHECK ((public.user_is_member(auth.uid(), clinic_id) AND (status = 'cancelled'::text)));

CREATE POLICY "Clinic members can view patient prescriptions in their own clin" ON "public"."prescription"
  FOR SELECT
  TO "authenticated"
  USING (public.user_is_member(auth.uid(), clinic_id));

GRANT EXECUTE ON FUNCTION "public"."enforce_prescription_immutable_update"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON TABLE "public"."medication_catalog" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."medication_catalog" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."medication_catalog" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."prescription" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."prescription" TO "authenticated";
