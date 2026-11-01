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

GRANT EXECUTE ON FUNCTION "public"."log_treatment_plan_activity"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
