// src/hooks/useClinicNavigation.ts
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export function useClinicNavigation() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const doctorId = useAuthStore().user?.id || null;
  const patientId = useParams<{ id: string }>().id || null;
  const navigate = useNavigate();

  const basePath = `/clinics/${clinicId}`;

  return {
    clinicId: clinicId || null,
    doctorId,
    patientId,
    basePath,
    // Pre-computed absolute paths for Links
    paths: {
      dashboard: `${basePath}/dashboard`,
      patients: `${basePath}/patients`,
      patientDetail: (patientId: string) => `${basePath}/patients/${patientId}`,
      prescriptions: `${basePath}/prescriptions`,
      admin: `${basePath}/admin`,
    },
    // Imperative helpers
    goToPatients: () => navigate(`${basePath}/patients`),
    goToPatient: (patientId: string) => navigate(`${basePath}/patients/${patientId}`),
  };
}