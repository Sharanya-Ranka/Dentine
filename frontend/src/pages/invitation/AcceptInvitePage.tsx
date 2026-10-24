import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore'; // Your existing auth hook
import { useAcceptInvitation, useInvitationPreview } from '../../hooks/useInvitations';

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuthStore();

  // 1. Validate and fetch token metadata via an unauthenticated/public RPC or endpoint
  const {
    data: invite,
    isLoading: isInviteLoading,
    isError,
    error,
  } = useInvitationPreview(token);

  // 2. Mutation to accept the invitation
  const acceptMutation = useAcceptInvitation();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg border border-slate-200 text-center">
          <h2 className="text-base font-bold text-slate-800">Invalid Link</h2>
          <p className="text-xs text-slate-500 mt-2">
            This invitation link is missing a verification token.
          </p>
        </div>
      </div>
    );
  }

  if (isInviteLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="text-xs text-slate-500">Validating invitation...</span>
      </div>
    );
  }

  if (isError || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg border border-slate-200 text-center">
          <h2 className="text-base font-bold text-red-600">Invitation Expired or Invalid</h2>
          <p className="text-xs text-slate-500 mt-2">
            {error instanceof Error ? error.message : 'Unable to verify this invite.'}
          </p>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated state: Route to login or signup
  if (!user) {
    const redirectUrl = encodeURIComponent(`/invites/accept?token=${token}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-lg">
            ✉️
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Join {invite.clinic_name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              <strong>{invite.inviter_name}</strong> invited you to join as a{' '}
              <span className="font-semibold text-slate-700">{invite.role}</span>.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600">
            Invitation sent to: <span className="font-mono font-medium">{invite.invitee_email}</span>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to={`/auth/signup?email=${encodeURIComponent(invite.invitee_email)}&redirect=${redirectUrl}`}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Create Account to Accept
            </Link>
            <Link
              to={`/auth/login?email=${encodeURIComponent(invite.invitee_email)}&redirect=${redirectUrl}`}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              Sign In with Existing Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated, but logged into an account that doesn't match the invite email
  const isEmailMismatch = user.email?.toLowerCase() !== invite.invitee_email.toLowerCase();

  if (isEmailMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg border border-amber-200 bg-amber-50/30 text-center space-y-3">
          <h2 className="text-sm font-bold text-amber-900">Account Mismatch</h2>
          <p className="text-xs text-amber-800">
            This invitation was sent to <strong className="font-mono">{invite.invitee_email}</strong>,
            but you are currently signed in as <strong className="font-mono">{user.email}</strong>.
          </p>
          <p className="text-[11px] text-slate-500">
            Please log out and sign in with the correct email to accept this clinic invitation.
          </p>
        </div>
      </div>
    );
  }

  // 5. Authenticated & matching email: Ready to accept
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg border border-slate-200 shadow-xs text-center space-y-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            Clinic Invitation
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-3">
            Join {invite.clinic_name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {invite.inviter_name} has invited you to join the clinical team as{' '}
            <strong className="text-slate-800">{invite.role}</strong>.
          </p>
        </div>

        {acceptMutation.isError && (
          <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
            {acceptMutation.error instanceof Error
              ? acceptMutation.error.message
              : 'Failed to accept invitation'}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            Decline / Later
          </button>
          <button
            type="button"
            onClick={() => acceptMutation.mutate(token)}
            disabled={acceptMutation.isPending}
            className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
          >
            {acceptMutation.isPending ? 'Joining Clinic...' : 'Accept Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};