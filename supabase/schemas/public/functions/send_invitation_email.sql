CREATE OR REPLACE FUNCTION public.send_invitation_email (
  p_invitation_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION "public"."send_invitation_email"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."send_invitation_email"(uuid) FROM PUBLIC;
