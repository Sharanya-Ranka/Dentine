CREATE OR REPLACE FUNCTION public.get_my_pending_invitations()
  RETURNS TABLE (
    invitation_id uuid,
    clinic_id     uuid,
    clinic_name   text,
    inviter_name  text,
    role          text,
    created_at    timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

    RETURN QUERY
    SELECT 
        i.id,
        i.clinic_id,
        c.name,
        u.name,
        i.role,
        i.created_at
    FROM public.invitation i
    JOIN public.clinic c ON c.id = i.clinic_id
    JOIN public.app_user u ON u.user_id = i.inviter_id
    WHERE lower(i.invitee_email) = lower(v_email)
      AND i.status = 'pending'
      AND i.expires_at > now();
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_pending_invitations"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
