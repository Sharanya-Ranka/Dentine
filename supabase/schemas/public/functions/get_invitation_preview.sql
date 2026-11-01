CREATE OR REPLACE FUNCTION public.get_invitation_preview (
  p_token uuid
)
  RETURNS TABLE (
    clinic_name   text,
    inviter_name  text,
    invitee_email text,
    role          text,
    is_valid      boolean
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_invitation_preview"(uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
