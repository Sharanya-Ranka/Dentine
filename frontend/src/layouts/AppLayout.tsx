import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import type { Database } from '../types/database.types';
import { useAuthStore } from '../stores/useAuthStore';
import { useUserClinics } from '../hooks/useUserClinics';


type ClinicRole = Database['public']['Enums']['clinic_role'];

export function AppLayout() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { data: clinics } = useUserClinics(user?.id);

  const activeClinic = clinics?.find((c) => c.clinic_id === clinicId);
  const isOwner = activeClinic?.role === ('owner' as ClinicRole);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Dynamic Unified Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 font-bold text-white">
            D
          </div>
          <span className="font-bold tracking-tight text-slate-900 text-lg">Dentine EMR</span>
        </div>

        {/* Clinic Switcher Header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Active Workspace
          </label>
          <select
            value={clinicId || ''}
            onChange={(e) => {
              const selected = e.target.value;
              if (selected) {
                navigate(`/clinics/${selected}/dashboard`);
              } else {
                navigate('/user/dashboard');
              }
            }}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">No Active Clinic (Hub)</option>
            {clinics?.map((c) => (
              <option key={c.clinic_id} value={c.clinic_id}>
                {c.clinic_name} ({c.role})
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {/* USER SECTION */}
          <div>
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              User Space
            </span>
            <div className="mt-2 space-y-1">
              <NavLink
                to="/user/dashboard"
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                Profile & Affiliations
              </NavLink>
            </div>
          </div>

          {/* CLINIC SECTION */}
          <div>
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Clinic Operations
            </span>

            {clinicId ? (
              <div className="mt-2 space-y-1">
                <NavLink
                  to={`/clinics/${clinicId}/dashboard`}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                      isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Clinic Dashboard
                </NavLink>
                <NavLink
                  to={`/clinics/${clinicId}/calendar`}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                      isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Appointments Calendar
                </NavLink>
                <NavLink
                  to={`/clinics/${clinicId}/patients`}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                      isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Patients Directory
                </NavLink>
                <NavLink
                  to={`/clinics/${clinicId}/prescriptions`}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                      isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Prescriptions
                </NavLink>
                <NavLink
                  to={`/clinics/${clinicId}/lab-tests`}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                      isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Dental Lab Orders
                </NavLink>
                <NavLink
                  to={`/clinics/${clinicId}/financials`}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                      isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Financial Reports
                </NavLink>

                {/* Owner Only Administration */}
                {isOwner && (
                  <NavLink
                    to={`/clinics/${clinicId}/admin`}
                    className={({ isActive }) =>
                      `flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                        isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    Clinic Settings & Admin
                  </NavLink>
                )}
              </div>
            ) : (
              <div className="mt-2 rounded-lg border border-dashed border-slate-200 p-3 text-center">
                <p className="text-[11px] text-slate-400">
                  Select or register a clinic above to enable clinical records.
                </p>
              </div>
            )}
          </div>
        </nav>

        {/* Footer with Sign Out */}
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Primary Workspace Viewport */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}