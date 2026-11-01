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

GRANT EXECUTE ON FUNCTION "public"."trg_sync_lab_test_reminder"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
