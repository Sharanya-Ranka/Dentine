import { useParams, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useUserClinics } from '../hooks/useUserClinics';

export function ClinicWorkspaceGuard() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const user = useAuthStore((state) => state.user);
  const { data: clinics, isLoading } = useUserClinics(user?.id);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const hasAccess = clinics?.some((c) => c.clinic_id === clinicId);

  if (!hasAccess) {
    // If not affiliated with this clinic ID, fall back to the User Profile hub
    return <Navigate to="/user/dashboard" replace />;
  }

  // Keying by clinicId resets component subtrees on clinic switches
  return <div className="p-3 sm:p-4">
    <Outlet key={clinicId} />;
    </div>
}