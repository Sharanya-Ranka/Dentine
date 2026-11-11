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

GRANT EXECUTE ON FUNCTION "public"."log_lab_test_activity"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
