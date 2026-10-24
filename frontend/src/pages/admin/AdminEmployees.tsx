import React, { useState } from 'react';
import type { FormEvent } from 'react';
import type { ClinicRole, CreateInvitationInput } from '../../types/admin';
import { useClinicMembers, useInviteMember } from '../../hooks/useAdmin';
import { useClinicId } from '../../hooks/useSession';

const ROLE_BADGES: Record<ClinicRole, string> = {
  owner: 'bg-amber-50 text-amber-700 border-amber-200',
  'non-owner': 'bg-blue-50 text-blue-700 border-blue-200',
};

export const AdminEmployees: React.FC = () => {
  const clinicId = useClinicId();
  const { data: members, isLoading, error: membersError } = useClinicMembers(clinicId);
  const inviteMember = useInviteMember(clinicId);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<CreateInvitationInput>({
    employee_email: '',
    role: 'non-owner',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenModal = () => {
    setInviteForm({ employee_email: '', role: 'non-owner' });
    setErrorMessage(null);
    setIsInviteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsInviteModalOpen(false);
    setErrorMessage(null);
  };

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteForm.employee_email.trim()) return;

    setErrorMessage(null);
    try {
      await inviteMember.mutateAsync(inviteForm);
      handleCloseModal();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">Staff & Clinical Members</h2>
          <p className="text-xs text-slate-500">
            Active clinic personnel and access management via user associations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
        >
          + Invite Staff Member
        </button>
      </div>

      {membersError && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
          Failed to load clinic members: {membersError.message}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
          Loading clinic members...
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Clinic Role</th>
                <th className="py-2.5 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members && members.length > 0 ? (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {member.app_user?.name || 'Unnamed Member'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {member.app_user?.email || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
                          ROLE_BADGES[member.role as ClinicRole] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(member.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No active staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Staff Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Invite Staff Member</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employee Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="doctor@example.com"
                  value={inviteForm.employee_email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, employee_email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  An email invitation link will be dispatched automatically via transactional mail.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Clinic Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, role: e.target.value as ClinicRole })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="non-owner">Non-Owner (Staff / Provider)</option>
                  <option value="owner">Owner (Full Admin Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={inviteMember.isPending}
                  className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMember.isPending}
                  className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
                >
                  {inviteMember.isPending ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};