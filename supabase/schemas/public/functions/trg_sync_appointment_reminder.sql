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

GRANT EXECUTE ON FUNCTION "public"."trg_sync_appointment_reminder"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
