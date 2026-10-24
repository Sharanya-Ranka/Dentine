CREATE OR REPLACE FUNCTION public.accept_clinic_invitation(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
    v_user_email TEXT;
    v_user_id UUID := auth.uid();
BEGIN
    -- 1. Ensure caller is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- 2. Fetch authenticated user's email
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    -- 3. Lock and validate invitation
    SELECT * INTO v_invitation
    FROM public.invitation
    WHERE token = p_token
      AND status = 'pending'
      AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid, expired, or already claimed invitation';
    END IF;

    -- 4. Verify the accepting user matches the intended email address
    IF lower(v_invitation.invitee_email) <> lower(v_user_email) THEN
        RAISE EXCEPTION 'This invitation was sent to %, but you are signed in as %', 
            v_invitation.invitee_email, v_user_email;
    END IF;

    -- 5. Insert tenancy record (or update if previously deactivated)
    INSERT INTO public.user_clinic_association (user_id, clinic_id, role)
    VALUES (v_user_id, v_invitation.clinic_id, v_invitation.role::clinic_role)
    ON CONFLICT (user_id, clinic_id) DO NOTHING;

    -- 6. Mark invitation as accepted
    UPDATE public.invitation
    SET status = 'accepted',
        updated_at = now()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
        'success', true,
        'clinic_id', v_invitation.clinic_id
    );
END;
$$;


-- 1. Revoke default execution from all users (including anon)
REVOKE EXECUTE ON FUNCTION public.accept_clinic_invitation(UUID) FROM PUBLIC;

-- 2. Explicitly grant execution only to signed-in users
GRANT EXECUTE ON FUNCTION public.accept_clinic_invitation(UUID) TO authenticated;