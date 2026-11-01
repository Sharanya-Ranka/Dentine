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

GRANT EXECUTE ON FUNCTION "public"."log_document_activity"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
