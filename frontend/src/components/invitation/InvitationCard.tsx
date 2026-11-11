// frontend/src/components/invitation/InvitationCard.tsx

import type { InvitationItem } from "../../types/invitation";

interface InvitationCardProps {
  invitation: InvitationItem;
  onAccept: (token: string) => void;
  onDecline: (id: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

export function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
}: InvitationCardProps) {
  const clinicName = invitation.clinic?.name ?? 'Unknown Clinic';
  const inviterName = invitation.inviter?.name ?? 'Clinic Administrator';

  const expiryDate = new Date(invitation.expires_at);
  // eslint-disable-next-line react-hooks/purity
  const isExpired = invitation.status === 'expired' || expiryDate.getTime() <= Date.now();

  const formattedExpiry = expiryDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-5 transition-all ${
        isExpired
          ? 'border-slate-200 bg-slate-50/80 text-slate-400'
          : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
      }`}
    >
      {/* Invitation Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-base font-semibold ${
              isExpired ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-900'
            }`}
          >
            {clinicName}
          </span>

          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
              isExpired
                ? 'bg-slate-200 text-slate-600'
                : 'bg-teal-50 text-teal-700'
            }`}
          >
            {invitation.role}
          </span>
        </div>

        <p className={`text-xs ${isExpired ? 'text-slate-400' : 'text-slate-500'}`}>
          Invited by{' '}
          <span className={`font-medium ${isExpired ? 'text-slate-500' : 'text-slate-700'}`}>
            {inviterName}
          </span>{' '}
          • {isExpired ? `Expired on ${formattedExpiry}` : `Expires ${formattedExpiry}`}
        </p>
      </div>

      {/* Actions / Status */}
      <div className="flex items-center gap-2 shrink-0">
        {isExpired ? (
          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 select-none">
            Invitation Expired
          </span>
        ) : (
          <>
            <button
              type="button"
              disabled={isAccepting || isDeclining}
              onClick={() => onDecline(invitation.id)}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {isDeclining ? 'Declining...' : 'Decline'}
            </button>

            <button
              type="button"
              disabled={isAccepting || isDeclining}
              onClick={() => onAccept(invitation.token)}
              className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 disabled:opacity-50 transition-colors"
            >
              {isAccepting ? 'Accepting...' : 'Accept'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}