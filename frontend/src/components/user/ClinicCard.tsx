import type { UserClinicDetail } from '../../types/extras';

interface ClinicCardProps {
  clinic: UserClinicDetail;
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  const isOwner = clinic.role === 'owner';

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base font-bold text-slate-900 line-clamp-1">{clinic.clinic_name}</h4>
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wider shrink-0 ${
              isOwner
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {isOwner ? 'Owner' : 'Visiting Doctor'}
          </span>
        </div>
        <p className="mt-1 font-mono text-xs text-slate-400">ID: {clinic.clinic_id}</p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">
          Affiliated: {new Date(clinic.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => {
            // URL-scoped tenancy workspace deep-link
            window.location.href = `/clinics/${clinic.clinic_id}/dashboard`;
          }}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200"
        >
          Enter Clinic →
        </button>
      </div>
    </div>
  );
}