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

GRANT EXECUTE ON FUNCTION "public"."user_is_member"(uuid, uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
