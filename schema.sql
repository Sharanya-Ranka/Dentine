


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."clinic_role" AS ENUM (
    'owner',
    'non-owner'
);


ALTER TYPE "public"."clinic_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_clinic_invitation"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."accept_clinic_invitation"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_clinic_invitation"("p_clinic_id" "uuid", "p_invitee_email" "text", "p_role" "text" DEFAULT 'non-owner'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_clinic_invitation"("p_clinic_id" "uuid", "p_invitee_email" "text", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_clinic_with_owner"("clinic_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_clinic_with_owner"("clinic_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invitation_preview"("p_token" "uuid") RETURNS TABLE("clinic_name" "text", "inviter_name" "text", "invitee_email" "text", "role" "text", "is_valid" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_invitation_preview"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_owned_clinic_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT clinic_id
    FROM public.user_clinic_association
    WHERE user_id = auth.uid()
      AND role = 'owner';
$$;


ALTER FUNCTION "public"."get_my_owned_clinic_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_pending_invitations"() RETURNS TABLE("invitation_id" "uuid", "clinic_id" "uuid", "clinic_name" "text", "inviter_name" "text", "role" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_my_pending_invitations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_document_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."log_document_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_lab_test_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."log_lab_test_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_prescription_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."log_prescription_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_treatment_plan_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."log_treatment_plan_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_visit_note_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."log_visit_note_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_invitation_email"("p_invitation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."send_invitation_email"("p_invitation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_calculate_reminder_due_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Automatically compute due_at whenever asof_datetime or remind_in_days is set/updated
    NEW.due_at := NEW.asof_datetime + (NEW.remind_in_days * INTERVAL '1 day');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_calculate_reminder_due_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_sync_appointment_reminder"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trg_sync_appointment_reminder"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_sync_lab_test_reminder"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trg_sync_lab_test_reminder"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_member"("p_user_id" "uuid", "p_clinic_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_clinic_association
    WHERE user_id = p_user_id
      AND clinic_id = p_clinic_id
  );
$$;


ALTER FUNCTION "public"."user_is_member"("p_user_id" "uuid", "p_clinic_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_owner"("p_user_id" "uuid", "p_clinic_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_clinic_association
    WHERE user_id = p_user_id
      AND clinic_id = p_clinic_id
      AND role = 'owner'
  );
$$;


ALTER FUNCTION "public"."user_is_owner"("p_user_id" "uuid", "p_clinic_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."action_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."action_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_user" (
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "operatory_number" integer DEFAULT 1 NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "type" "text" DEFAULT 'consultation'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appointment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinic" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clinic" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "storage_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "type" "text" DEFAULT 'employee'::"text" NOT NULL,
    "role" "text" DEFAULT 'doctor'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employee" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follow_up" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "type" "text" DEFAULT 'once'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "num_days" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."follow_up" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "inviter_id" "uuid" NOT NULL,
    "invitee_email" "text" NOT NULL,
    "role" "text" DEFAULT 'non-owner'::"text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invitation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'unpaid'::"text" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invoice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lab" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_procedure" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "lab_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "cost" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "estimated_turnaround_days" integer DEFAULT 7 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lab_procedure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_test" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lab_procedure_id" "uuid" NOT NULL
);


ALTER TABLE "public"."lab_test" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "payment_method" "text" NOT NULL,
    "transaction_ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prescription" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."procedure" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "cost" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."procedure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminder" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "asof_datetime" timestamp with time zone NOT NULL,
    "remind_in_days" integer DEFAULT 0 NOT NULL,
    "due_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "type" "text" DEFAULT 'general'::"text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reminder" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."treatment_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_clinic_association" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "role" "public"."clinic_role" DEFAULT 'non-owner'::"public"."clinic_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_clinic_association" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visit_note" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."visit_note" OWNER TO "postgres";


ALTER TABLE ONLY "public"."action_log"
    ADD CONSTRAINT "action_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_user"
    ADD CONSTRAINT "app_user_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."appointment"
    ADD CONSTRAINT "appointment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinic"
    ADD CONSTRAINT "clinic_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document"
    ADD CONSTRAINT "document_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee"
    ADD CONSTRAINT "employee_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee"
    ADD CONSTRAINT "employee_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."follow_up"
    ADD CONSTRAINT "follow_up_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation"
    ADD CONSTRAINT "invitation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation"
    ADD CONSTRAINT "invitation_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."invoice"
    ADD CONSTRAINT "invoice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab"
    ADD CONSTRAINT "lab_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_procedure"
    ADD CONSTRAINT "lab_procedure_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_test"
    ADD CONSTRAINT "lab_test_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient"
    ADD CONSTRAINT "patient_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment"
    ADD CONSTRAINT "payment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription"
    ADD CONSTRAINT "prescription_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."procedure"
    ADD CONSTRAINT "procedure_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminder"
    ADD CONSTRAINT "reminder_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_plan"
    ADD CONSTRAINT "treatment_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation"
    ADD CONSTRAINT "unique_pending_clinic_invite" UNIQUE ("clinic_id", "invitee_email", "status");



ALTER TABLE ONLY "public"."user_clinic_association"
    ADD CONSTRAINT "uq_user_clinic_membership" UNIQUE ("user_id", "clinic_id");



ALTER TABLE ONLY "public"."user_clinic_association"
    ADD CONSTRAINT "user_clinic_association_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visit_note"
    ADD CONSTRAINT "visit_note_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_action_log_clinic_id" ON "public"."action_log" USING "btree" ("clinic_id");



CREATE INDEX "idx_action_log_patient_timeline" ON "public"."action_log" USING "btree" ("patient_id", "created_at" DESC);



CREATE UNIQUE INDEX "idx_app_user_email_lower" ON "public"."app_user" USING "btree" ("lower"("email"));



CREATE INDEX "idx_appointment_clinic_time" ON "public"."appointment" USING "btree" ("clinic_id", "start_time", "end_time");



CREATE INDEX "idx_appointment_doctor_id" ON "public"."appointment" USING "btree" ("doctor_id");



CREATE INDEX "idx_document_clinic" ON "public"."document" USING "btree" ("clinic_id");



CREATE INDEX "idx_employee_clinic" ON "public"."employee" USING "btree" ("clinic_id");



CREATE INDEX "idx_employee_user" ON "public"."employee" USING "btree" ("user_id");



CREATE INDEX "idx_follow_up_clinic" ON "public"."follow_up" USING "btree" ("clinic_id");



CREATE INDEX "idx_invitation_clinic" ON "public"."invitation" USING "btree" ("clinic_id");



CREATE INDEX "idx_invitation_email" ON "public"."invitation" USING "btree" ("lower"("invitee_email"));



CREATE INDEX "idx_invitation_token" ON "public"."invitation" USING "btree" ("token") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_invoice_clinic" ON "public"."invoice" USING "btree" ("clinic_id");



CREATE INDEX "idx_lab_clinic_id" ON "public"."lab" USING "btree" ("clinic_id");



CREATE INDEX "idx_lab_procedure_clinic_id" ON "public"."lab_procedure" USING "btree" ("clinic_id");



CREATE INDEX "idx_lab_procedure_lab_id" ON "public"."lab_procedure" USING "btree" ("lab_id");



CREATE INDEX "idx_lab_test_clinic" ON "public"."lab_test" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_clinic" ON "public"."patient" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_clinic_id" ON "public"."patient" USING "btree" ("clinic_id");



CREATE INDEX "idx_payment_clinic" ON "public"."payment" USING "btree" ("clinic_id");



CREATE INDEX "idx_prescription_clinic" ON "public"."prescription" USING "btree" ("clinic_id");



CREATE INDEX "idx_reminder_clinic_status_due" ON "public"."reminder" USING "btree" ("clinic_id", "status", "due_at");



CREATE INDEX "idx_reminder_entity_id" ON "public"."reminder" USING "btree" ((("details" ->> 'entity_id'::"text")));



CREATE INDEX "idx_reminder_type" ON "public"."reminder" USING "btree" ("clinic_id", "type");



CREATE INDEX "idx_treatment_plan_clinic" ON "public"."treatment_plan" USING "btree" ("clinic_id");



CREATE INDEX "idx_uca_clinic_id" ON "public"."user_clinic_association" USING "btree" ("clinic_id");



CREATE INDEX "idx_uca_clinic_role" ON "public"."user_clinic_association" USING "btree" ("clinic_id", "role");



CREATE INDEX "idx_uca_user_id" ON "public"."user_clinic_association" USING "btree" ("user_id");



CREATE INDEX "idx_visit_note_clinic" ON "public"."visit_note" USING "btree" ("clinic_id");



CREATE OR REPLACE TRIGGER "trg_appointment_reminder" AFTER INSERT OR UPDATE ON "public"."appointment" FOR EACH ROW EXECUTE FUNCTION "public"."trg_sync_appointment_reminder"();



CREATE OR REPLACE TRIGGER "trg_lab_test_reminder" AFTER INSERT OR UPDATE ON "public"."lab_test" FOR EACH ROW EXECUTE FUNCTION "public"."trg_sync_lab_test_reminder"();



CREATE OR REPLACE TRIGGER "trg_log_document" AFTER INSERT OR UPDATE ON "public"."document" FOR EACH ROW EXECUTE FUNCTION "public"."log_document_activity"();



CREATE OR REPLACE TRIGGER "trg_log_lab_test" AFTER INSERT OR UPDATE ON "public"."lab_test" FOR EACH ROW EXECUTE FUNCTION "public"."log_lab_test_activity"();



CREATE OR REPLACE TRIGGER "trg_log_prescription" AFTER INSERT OR UPDATE ON "public"."prescription" FOR EACH ROW EXECUTE FUNCTION "public"."log_prescription_activity"();



CREATE OR REPLACE TRIGGER "trg_log_treatment_plan" AFTER INSERT OR UPDATE ON "public"."treatment_plan" FOR EACH ROW EXECUTE FUNCTION "public"."log_treatment_plan_activity"();



CREATE OR REPLACE TRIGGER "trg_log_visit_note" AFTER INSERT OR UPDATE ON "public"."visit_note" FOR EACH ROW EXECUTE FUNCTION "public"."log_visit_note_activity"();



CREATE OR REPLACE TRIGGER "trg_set_reminder_due_at" BEFORE INSERT OR UPDATE OF "asof_datetime", "remind_in_days" ON "public"."reminder" FOR EACH ROW EXECUTE FUNCTION "public"."trg_calculate_reminder_due_at"();



ALTER TABLE ONLY "public"."action_log"
    ADD CONSTRAINT "action_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."app_user"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."action_log"
    ADD CONSTRAINT "action_log_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."action_log"
    ADD CONSTRAINT "action_log_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_user"
    ADD CONSTRAINT "app_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment"
    ADD CONSTRAINT "appointment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment"
    ADD CONSTRAINT "appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."app_user"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointment"
    ADD CONSTRAINT "appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document"
    ADD CONSTRAINT "document_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document"
    ADD CONSTRAINT "document_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee"
    ADD CONSTRAINT "employee_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee"
    ADD CONSTRAINT "employee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."follow_up"
    ADD CONSTRAINT "follow_up_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follow_up"
    ADD CONSTRAINT "follow_up_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation"
    ADD CONSTRAINT "invitation_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation"
    ADD CONSTRAINT "invitation_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."app_user"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice"
    ADD CONSTRAINT "invoice_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice"
    ADD CONSTRAINT "invoice_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab"
    ADD CONSTRAINT "lab_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_procedure"
    ADD CONSTRAINT "lab_procedure_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_procedure"
    ADD CONSTRAINT "lab_procedure_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "public"."lab"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_test"
    ADD CONSTRAINT "lab_test_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_test"
    ADD CONSTRAINT "lab_test_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."app_user"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lab_test"
    ADD CONSTRAINT "lab_test_lab_procedure_id_fkey" FOREIGN KEY ("lab_procedure_id") REFERENCES "public"."lab_procedure"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lab_test"
    ADD CONSTRAINT "lab_test_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient"
    ADD CONSTRAINT "patient_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment"
    ADD CONSTRAINT "payment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment"
    ADD CONSTRAINT "payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment"
    ADD CONSTRAINT "payment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription"
    ADD CONSTRAINT "prescription_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription"
    ADD CONSTRAINT "prescription_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."app_user"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prescription"
    ADD CONSTRAINT "prescription_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."procedure"
    ADD CONSTRAINT "procedure_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminder"
    ADD CONSTRAINT "reminder_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminder"
    ADD CONSTRAINT "reminder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."treatment_plan"
    ADD CONSTRAINT "treatment_plan_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_plan"
    ADD CONSTRAINT "treatment_plan_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."app_user"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."treatment_plan"
    ADD CONSTRAINT "treatment_plan_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_clinic_association"
    ADD CONSTRAINT "user_clinic_association_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_clinic_association"
    ADD CONSTRAINT "user_clinic_association_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_note"
    ADD CONSTRAINT "visit_note_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_note"
    ADD CONSTRAINT "visit_note_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."app_user"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."visit_note"
    ADD CONSTRAINT "visit_note_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE CASCADE;



CREATE POLICY "Clinic members can manage patient documents in their own clinic" ON "public"."document" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient follow_ups in their own clini" ON "public"."follow_up" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient invoices in their own clinic" ON "public"."invoice" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient lab_procedures in their own c" ON "public"."lab_procedure" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient lab_tests in their own clinic" ON "public"."lab_test" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient labs in their own clinic" ON "public"."lab" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient payments in their own clinic" ON "public"."payment" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient prescriptions in their own cl" ON "public"."prescription" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient procedures in their own clini" ON "public"."procedure" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient reminders in their own clinic" ON "public"."reminder" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient treatment_plans in their own " ON "public"."treatment_plan" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage patient visit_notes in their own clin" ON "public"."visit_note" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic members can manage their clinic patients" ON "public"."patient" TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_member"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic owners can delete clinic invitations" ON "public"."invitation" FOR DELETE TO "authenticated" USING ("public"."user_is_owner"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic owners can issue invitations" ON "public"."invitation" FOR INSERT TO "authenticated" WITH CHECK (("public"."user_is_owner"("auth"."uid"(), "clinic_id") AND ("inviter_id" = "auth"."uid"())));



CREATE POLICY "Clinic owners can update clinic invitations" ON "public"."invitation" FOR UPDATE TO "authenticated" USING ("public"."user_is_owner"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_owner"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Clinic owners can view issued clinic invitations" ON "public"."invitation" FOR SELECT TO "authenticated" USING ("public"."user_is_owner"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Doctors can create appointments for themselves in member clinic" ON "public"."appointment" FOR INSERT TO "authenticated" WITH CHECK ((("doctor_id" = "auth"."uid"()) AND "public"."user_is_member"("auth"."uid"(), "clinic_id")));



CREATE POLICY "Doctors can update their assigned appointments in member clinic" ON "public"."appointment" FOR UPDATE TO "authenticated" USING ((("doctor_id" = "auth"."uid"()) AND "public"."user_is_member"("auth"."uid"(), "clinic_id"))) WITH CHECK ((("doctor_id" = "auth"."uid"()) AND "public"."user_is_member"("auth"."uid"(), "clinic_id")));



CREATE POLICY "Doctors can view their assigned appointments in member clinics" ON "public"."appointment" FOR SELECT TO "authenticated" USING ((("doctor_id" = "auth"."uid"()) AND "public"."user_is_member"("auth"."uid"(), "clinic_id")));



CREATE POLICY "Members can view their clinic" ON "public"."clinic" FOR SELECT TO "authenticated" USING ("public"."user_is_member"("auth"."uid"(), "id"));



CREATE POLICY "Owners can add or modify clinic associations" ON "public"."user_clinic_association" TO "authenticated" USING ("public"."user_is_owner"("auth"."uid"(), "clinic_id")) WITH CHECK ("public"."user_is_owner"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Owners can see profiles of members belonging to their clinic" ON "public"."app_user" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "user_clinic_association"."user_id"
   FROM "public"."user_clinic_association"
  WHERE ("user_clinic_association"."clinic_id" IN ( SELECT "public"."get_my_owned_clinic_ids"() AS "get_my_owned_clinic_ids")))));



CREATE POLICY "Owners can view all appointments in their clinic" ON "public"."appointment" FOR SELECT TO "authenticated" USING ("public"."user_is_owner"("auth"."uid"(), "clinic_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."app_user" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read their own clinic associations" ON "public"."user_clinic_association" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."user_is_owner"("auth"."uid"(), "clinic_id")));



CREATE POLICY "Users can update their own profile" ON "public"."app_user" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile and co-members" ON "public"."app_user" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."app_user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinic" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follow_up" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lab" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lab_procedure" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lab_test" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescription" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."procedure" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminder" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatment_plan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_clinic_association" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visit_note" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."accept_clinic_invitation"("p_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_clinic_invitation"("p_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_clinic_invitation"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_clinic_invitation"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_clinic_invitation"("p_clinic_id" "uuid", "p_invitee_email" "text", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_clinic_invitation"("p_clinic_id" "uuid", "p_invitee_email" "text", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_clinic_invitation"("p_clinic_id" "uuid", "p_invitee_email" "text", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_clinic_with_owner"("clinic_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_clinic_with_owner"("clinic_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_clinic_with_owner"("clinic_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invitation_preview"("p_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_invitation_preview"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invitation_preview"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_owned_clinic_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_owned_clinic_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_owned_clinic_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_pending_invitations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_pending_invitations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_pending_invitations"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_auth_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_document_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_document_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_document_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_lab_test_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_lab_test_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_lab_test_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_prescription_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_prescription_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_prescription_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_treatment_plan_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_treatment_plan_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_treatment_plan_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_visit_note_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_visit_note_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_visit_note_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_invitation_email"("p_invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_invitation_email"("p_invitation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_invitation_email"("p_invitation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_invitation_email"("p_invitation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_calculate_reminder_due_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_calculate_reminder_due_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_calculate_reminder_due_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_sync_appointment_reminder"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_sync_appointment_reminder"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_sync_appointment_reminder"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_sync_lab_test_reminder"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_sync_lab_test_reminder"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_sync_lab_test_reminder"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_member"("p_user_id" "uuid", "p_clinic_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_member"("p_user_id" "uuid", "p_clinic_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_member"("p_user_id" "uuid", "p_clinic_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_owner"("p_user_id" "uuid", "p_clinic_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_owner"("p_user_id" "uuid", "p_clinic_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_owner"("p_user_id" "uuid", "p_clinic_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."action_log" TO "anon";
GRANT ALL ON TABLE "public"."action_log" TO "authenticated";
GRANT ALL ON TABLE "public"."action_log" TO "service_role";



GRANT ALL ON TABLE "public"."app_user" TO "anon";
GRANT ALL ON TABLE "public"."app_user" TO "authenticated";
GRANT ALL ON TABLE "public"."app_user" TO "service_role";



GRANT ALL ON TABLE "public"."appointment" TO "anon";
GRANT ALL ON TABLE "public"."appointment" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment" TO "service_role";



GRANT ALL ON TABLE "public"."clinic" TO "anon";
GRANT ALL ON TABLE "public"."clinic" TO "authenticated";
GRANT ALL ON TABLE "public"."clinic" TO "service_role";



GRANT ALL ON TABLE "public"."document" TO "anon";
GRANT ALL ON TABLE "public"."document" TO "authenticated";
GRANT ALL ON TABLE "public"."document" TO "service_role";



GRANT ALL ON TABLE "public"."employee" TO "anon";
GRANT ALL ON TABLE "public"."employee" TO "authenticated";
GRANT ALL ON TABLE "public"."employee" TO "service_role";



GRANT ALL ON TABLE "public"."follow_up" TO "anon";
GRANT ALL ON TABLE "public"."follow_up" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_up" TO "service_role";



GRANT ALL ON TABLE "public"."invitation" TO "anon";
GRANT ALL ON TABLE "public"."invitation" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation" TO "service_role";



GRANT ALL ON TABLE "public"."invoice" TO "anon";
GRANT ALL ON TABLE "public"."invoice" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice" TO "service_role";



GRANT ALL ON TABLE "public"."lab" TO "anon";
GRANT ALL ON TABLE "public"."lab" TO "authenticated";
GRANT ALL ON TABLE "public"."lab" TO "service_role";



GRANT ALL ON TABLE "public"."lab_procedure" TO "anon";
GRANT ALL ON TABLE "public"."lab_procedure" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_procedure" TO "service_role";



GRANT ALL ON TABLE "public"."lab_test" TO "anon";
GRANT ALL ON TABLE "public"."lab_test" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_test" TO "service_role";



GRANT ALL ON TABLE "public"."patient" TO "anon";
GRANT ALL ON TABLE "public"."patient" TO "authenticated";
GRANT ALL ON TABLE "public"."patient" TO "service_role";



GRANT ALL ON TABLE "public"."payment" TO "anon";
GRANT ALL ON TABLE "public"."payment" TO "authenticated";
GRANT ALL ON TABLE "public"."payment" TO "service_role";



GRANT ALL ON TABLE "public"."prescription" TO "anon";
GRANT ALL ON TABLE "public"."prescription" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription" TO "service_role";



GRANT ALL ON TABLE "public"."procedure" TO "anon";
GRANT ALL ON TABLE "public"."procedure" TO "authenticated";
GRANT ALL ON TABLE "public"."procedure" TO "service_role";



GRANT ALL ON TABLE "public"."reminder" TO "anon";
GRANT ALL ON TABLE "public"."reminder" TO "authenticated";
GRANT ALL ON TABLE "public"."reminder" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_plan" TO "anon";
GRANT ALL ON TABLE "public"."treatment_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_plan" TO "service_role";



GRANT ALL ON TABLE "public"."user_clinic_association" TO "anon";
GRANT ALL ON TABLE "public"."user_clinic_association" TO "authenticated";
GRANT ALL ON TABLE "public"."user_clinic_association" TO "service_role";



GRANT ALL ON TABLE "public"."visit_note" TO "anon";
GRANT ALL ON TABLE "public"."visit_note" TO "authenticated";
GRANT ALL ON TABLE "public"."visit_note" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







