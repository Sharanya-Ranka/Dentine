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

GRANT EXECUTE ON FUNCTION "public"."get_my_owned_clinic_ids"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
