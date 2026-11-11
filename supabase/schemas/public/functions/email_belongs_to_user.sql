CREATE OR REPLACE FUNCTION public.email_belongs_to_user(
  p_user_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = p_user_id
      AND lower(email) = lower(p_email)
  );
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.email_belongs_to_user(uuid, text) TO authenticated;