-- 1. Enable pg_net
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create the dispatch function
CREATE OR REPLACE FUNCTION public.send_invitation_email(p_invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_project_url TEXT := 'https://nwxolzjldlrwdrbkseka.supabase.co';
    v_anon_key TEXT := 'sb_publishable_PgyCdhmkgfBXspp8tOJyhw_2E78fX2z'; -- Or pass via Vault
    v_edge_function_url TEXT;
BEGIN
    v_edge_function_url := v_project_url || '/functions/v1/send-invite';

    -- Non-blocking HTTP POST via pg_net
    PERFORM net.http_post(
        url := v_edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
        ),
        body := jsonb_build_object(
            'invitation_id', p_invitation_id
        )
    );
END;
$$;

-- Restrict execution to authenticated users
REVOKE EXECUTE ON FUNCTION public.send_invitation_email(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_invitation_email(UUID) TO authenticated;



CREATE OR REPLACE FUNCTION public.create_clinic_invitation(
    p_clinic_id UUID,
    p_invitee_email TEXT,
    p_role TEXT DEFAULT 'non-owner'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;