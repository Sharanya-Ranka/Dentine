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

GRANT EXECUTE ON FUNCTION "public"."trg_calculate_reminder_due_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
