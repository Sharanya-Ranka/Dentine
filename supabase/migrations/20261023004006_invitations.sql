CREATE TABLE invitation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'non-owner', -- 'owner' | 'non-owner'
    token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Prevent duplicate pending invitations for the same user in the same clinic
    CONSTRAINT unique_pending_clinic_invite UNIQUE (clinic_id, invitee_email, status)
);

CREATE INDEX idx_invitation_token ON invitation (token) WHERE status = 'pending';
CREATE INDEX idx_invitation_email ON invitation (lower(invitee_email));
CREATE INDEX idx_invitation_clinic ON invitation (clinic_id);


ALTER TABLE public.invitation ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. OWNER-ONLY RLS POLICIES
-- ============================================================================

-- Policy 1: SELECT (Only clinic owners can inspect issued invitations)
CREATE POLICY "Clinic owners can view issued clinic invitations"
    ON public.invitation FOR SELECT
    TO authenticated
    USING (
        public.user_is_owner(clinic_id, auth.uid())
    );

-- Policy 2: INSERT (Only clinic owners can issue new invitations)
CREATE POLICY "Clinic owners can issue invitations"
    ON public.invitation FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_is_owner(clinic_id, auth.uid())
        AND inviter_id = auth.uid()
    );

-- Policy 3: UPDATE (Only clinic owners can revoke or modify invitation status)
CREATE POLICY "Clinic owners can update clinic invitations"
    ON public.invitation FOR UPDATE
    TO authenticated
    USING (
        public.user_is_owner(clinic_id, auth.uid())
    )
    WITH CHECK (
        public.user_is_owner(clinic_id, auth.uid())
    );

-- Policy 4: DELETE (Only clinic owners can purge invitation records)
CREATE POLICY "Clinic owners can delete clinic invitations"
    ON public.invitation FOR DELETE
    TO authenticated
    USING (
        public.user_is_owner(clinic_id, auth.uid())
    );


CREATE OR REPLACE FUNCTION public.get_invitation_preview(p_token UUID)
RETURNS TABLE (
    clinic_name TEXT,
    inviter_name TEXT,
    invitee_email TEXT,
    role TEXT,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_preview(UUID) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.get_my_pending_invitations()
RETURNS TABLE (
    invitation_id UUID,
    clinic_id UUID,
    clinic_name TEXT,
    inviter_name TEXT,
    role TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pending_invitations() TO authenticated;