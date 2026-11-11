CREATE OR REPLACE FUNCTION public.create_clinic_invitation (
  p_clinic_id     uuid,
  p_invitee_email text,
  p_role          text DEFAULT 'non-owner'::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    v_invitation_id UUID;
BEGIN
    -- Verify caller is clinic owner
    IF NOT public.user_is_owner(auth.uid(), p_clinic_id) THEN
        RAISE EXCEPTION 'Only clinic owners can issue invitations';
    END IF;

    -- Create invitation record
    INSERT INTO public.invitation (
        clinic_id,
        inviter_id,
        invitee_email,
        role
    )
    VALUES (
        p_clinic_id,
        auth.uid(),
        lower(trim(p_invitee_email)),
        p_role
    )
    RETURNING id INTO v_invitation_id;

    -- Asynchronously dispatch the email
    PERFORM public.send_invitation_email(v_invitation_id);

    RETURN v_invitation_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."create_clinic_invitation"(uuid, text, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
