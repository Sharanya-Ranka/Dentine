import {
  useGetInvitationsFor,
  useAcceptInvitation,
  useDeclineInvitation,
} from '../../hooks/useInvitations';
import { InvitationCard } from './InvitationCard';

interface InvitationListProps {
  email: string;
}

export function InvitationList({ email }: InvitationListProps) {
  const { data: invitations, isLoading, error } = useGetInvitationsFor(email);
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation(email);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
        Failed to load invitations.
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
        You have no pending clinic invitations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onAccept={(token) => acceptMutation.mutate(token)}
          onDecline={(id) => declineMutation.mutate(id)}
          isAccepting={acceptMutation.isPending && acceptMutation.variables === invitation.token}
          isDeclining={declineMutation.isPending && declineMutation.variables === invitation.id}
        />
      ))}
    </div>
  );
}