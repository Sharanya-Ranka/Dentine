import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserProfile, useUpsertUserProfile } from '../../hooks/useUserProfile';
import { useUserClinics } from '../../hooks/useUserClinics';
import { ClinicCard } from './ClinicCard';
import { CreateClinicModal } from './CreateClinicModal';

export function DashboardView() {
  const { user, signOut } = useAuthStore();
  const userId = user?.id;
  const userEmail = user?.email ?? '';

  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: clinics, isLoading: clinicsLoading } = useUserClinics(userId);
  const upsertProfile = useUpsertUserProfile();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId || !profileNameInput.trim()) return;

    await upsertProfile.mutateAsync({
      userId,
      name: profileNameInput.trim(),
      email: userEmail,
    });
    setIsEditingName(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-base">
              D
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Dentine Practice Hub</span>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* User Identity Banner */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Practitioner Profile</span>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                {profileLoading ? 'Loading profile...' : profile?.name ?? 'Complete your profile'}
              </h2>
              <p className="text-sm text-slate-600">{userEmail}</p>
            </div>

            {(!profile || isEditingName) ? (
              <form onSubmit={handleSaveProfile} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Dr. Full Name"
                  defaultValue={profile?.name ?? ''}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={upsertProfile.isPending}
                  className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-500"
                >
                  {upsertProfile.isPending ? 'Saving...' : 'Save Name'}
                </button>
                {isEditingName && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                )}
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setProfileNameInput(profile.name);
                  setIsEditingName(true);
                }}
                className="self-start sm:self-center text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
              >
                Edit Name
              </button>
            )}
          </div>
        </section>

        {/* Associated Clinics Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Affiliated Clinics</h3>
              <p className="text-xs text-slate-500">Clinics where you hold ownership or visiting specialist rights</p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-500"
            >
              + Create Clinic
            </button>
          </div>

          {clinicsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : clinics && clinics.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.association_id} clinic={clinic} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-white">
              <p className="text-sm font-medium text-slate-700">No clinic affiliations found</p>
              <p className="text-xs text-slate-500 mt-1">
                You are not registered with any clinics yet. Register a new clinic practice as owner to begin.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Register Clinic
              </button>
            </div>
          )}
        </section>
      </main>

      <CreateClinicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}