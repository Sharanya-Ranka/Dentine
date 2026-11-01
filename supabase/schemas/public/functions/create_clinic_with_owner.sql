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

GRANT EXECUTE ON FUNCTION "public"."create_clinic_with_owner"(text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
