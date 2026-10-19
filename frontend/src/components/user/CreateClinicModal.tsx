import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCreateClinic } from '../../hooks/useUserClinics';

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateClinicModal({ isOpen, onClose }: CreateClinicModalProps) {
  const [clinicName, setClinicName] = useState('');
  const createClinicMutation = useCreateClinic();

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!clinicName.trim()) return;

    try {
      await createClinicMutation.mutateAsync({ clinicName });
      setClinicName('');
      onClose();
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Register New Clinic</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {createClinicMutation.isError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {createClinicMutation.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="clinicName" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Clinic Practice Name
            </label>
            <input
              id="clinicName"
              type="text"
              required
              placeholder="e.g., Apex Dental Clinic & Implant Center"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createClinicMutation.isPending}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClinicMutation.isPending || !clinicName.trim()}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 disabled:opacity-50"
            >
              {createClinicMutation.isPending ? 'Registering...' : 'Create Clinic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}