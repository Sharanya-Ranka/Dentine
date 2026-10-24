import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configure the SMTP transporter using your environment secrets
const transporter = nodemailer.createTransport({
  host: Deno.env.get('SMTP_HOST'),
  port: Number(Deno.env.get('SMTP_PORT') || 587),
  secure: Deno.env.get('SMTP_SECURE') === 'true', // true for 465, false for 587/STARTTLS
  auth: {
    user: Deno.env.get('SMTP_USER'),
    pass: Deno.env.get('SMTP_PASS'),
  },
});

serve(async (req) => {
  console.log(`[send-invite] Incoming ${req.method} request`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const req_json = await req.json();
    const {invitation_id} = req_json;
    console.log('[send-invite] JSON request payload received:', req_json);

    if (!invitation_id) {
      return new Response(JSON.stringify({ error: 'Missing invitation_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase Admin client to fetch invitation details securely
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: invite, error: fetchError } = await supabaseAdmin
      .from('invitation')
      .select(`
        id,
        token,
        invitee_email,
        role,
        status,
        clinic:clinic_id ( name ),
        inviter:inviter_id ( name )
      `)
      .eq('id', invitation_id)
      .single();

    if (fetchError || !invite) {
      return new Response(JSON.stringify({ error: 'Invitation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (invite.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Invitation is no longer pending' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const inviteUrl = `${appUrl}/invite?token=${invite.token}`;
    const clinicName = (invite.clinic as any)?.name ?? 'the clinic';
    const inviterName = (invite.inviter as any)?.name ?? 'A team administrator';

    // Dispatch the email over SMTP
    await transporter.sendMail({
      from: `"Dentine Clinical" <${Deno.env.get('SMTP_FROM') || Deno.env.get('SMTP_USER')}>`,
      to: invite.invitee_email,
      subject: `Invitation: Join ${clinicName} on Dentine`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 12px;">You've been invited to join ${clinicName}</h2>
          <p style="color: #475569; font-size: 14px; line-height: 22px;">
            ${inviterName} has invited you to join their clinical workspace on Dentine as a <strong>${invite.role}</strong>.
          </p>
          <div style="margin: 28px 0;">
            <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 18px;">
            This link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});