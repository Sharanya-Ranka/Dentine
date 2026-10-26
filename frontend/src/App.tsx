import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from './stores/useAuthStore';
import { RequireAuth } from './guards/RequireAuth';
import { ClinicWorkspaceGuard } from './guards/ClinicWorkspaceGuard';

// Layouts
import { AppLayout } from './layouts/AppLayout';

// Pages
import { AuthView } from './components/auth/AuthView';
import { DashboardView as UserDashboard } from './components/user/DashboardView';
import { Dashboard as ClinicDashboard } from './pages/Dashboard';
import { AllPatients } from './pages/AllPatients';
import { CalendarPage } from './pages/Calendar';
import { LabTests } from './pages/LabTests';
import { Prescriptions } from './pages/Prescriptions';
import { Financials } from './pages/Shells';

// Patient Nested Sub-routes
import { PatientPage } from './pages/patient/PatientPage';
import { PatientDetails } from './pages/patient/PatientDetails';
import { PatientTimeline } from './pages/patient/PatientTimeline';
import { PatientVisitNotes } from './pages/patient/PatientVisitNotes';
import { PatientTreatmentPlans } from './pages/patient/PatientTreatmentPlans';
import { PatientLabTests } from './pages/patient/PatientLabTests';
import { PatientPrescriptions } from './pages/patient/PatientPrescriptions';
import { PatientDocuments } from './pages/patient/PatientDocuments';
import { PatientPayments } from './pages/patient/PatientPayments';

// Admin Sub-routes
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminEmployees } from './pages/admin/AdminEmployees';
import { AdminProcedures } from './pages/admin/AdminProcedures';
import { AdminLabInfo } from './pages/admin/AdminLabInfo';
import { AcceptInvitePage } from './pages/invitation/AcceptInvitePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* 1. Public Authentication Route */}
          <Route path="/login" element={<AuthView />} />
          <Route path="/auth/login" element={<AuthView />} />
          <Route path="/invite" element={<AcceptInvitePage />} />
          {/* 2. Authenticated Boundary */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              {/* Default Index Route: Lands on User Dashboard */}
              <Route index element={<Navigate to="/user/dashboard" replace />} />

              {/* User Switchboard Hub */}
              <Route path="user/dashboard" element={<UserDashboard />} />

              {/* 3. URL-Scoped Multi-Tenant Clinic Workspace */}
              <Route path="clinics/:clinicId" element={<ClinicWorkspaceGuard />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ClinicDashboard />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="patients" element={<AllPatients />} />

                {/* Patient File Sub-tree */}
                <Route path="patients/:id" element={<PatientPage />}>
                  <Route index element={<Navigate to="details" replace />} />
                  <Route path="details" element={<PatientDetails />} />
                  <Route path="timeline" element={<PatientTimeline />} />
                  <Route path="visit-notes" element={<PatientVisitNotes />} />
                  <Route path="treatment-plans" element={<PatientTreatmentPlans />} />
                  <Route path="lab-tests" element={<PatientLabTests />} />
                  <Route path="prescriptions" element={<PatientPrescriptions />} />
                  <Route path="documents" element={<PatientDocuments />} />
                  <Route path="payments" element={<PatientPayments />} />
                </Route>

                <Route path="prescriptions" element={<Prescriptions />} />
                <Route path="lab-tests" element={<LabTests />} />
                <Route path="financials" element={<Financials />} />

                {/* Clinic Administration (Owner-Only) */}
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="employees" replace />} />
                  <Route path="employees" element={<AdminEmployees />} />
                  <Route path="procedures" element={<AdminProcedures />} />
                  <Route path="labs" element={<AdminLabInfo />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}