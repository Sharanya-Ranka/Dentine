// src/hooks/useClinicNavigation.ts
import { useNavigate, useParams } from 'react-router-dom';

export function useClinicNavigation() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();

  const basePath = `/clinics/${clinicId}`;

  return {
    clinicId,
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