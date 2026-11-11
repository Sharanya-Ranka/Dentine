import React, { useState } from "react";
// import type { Patient } from "../../types/patient";
// import type {
//   Prescription,
//   PrescriptionDetails,
//   PrescriptionItem,
// } from "../../types/prescription";
import {
  usePrescriptionsV2,
} from "../../hooks/usePrescriptions";
import { useClinicNavigation } from "../../hooks/useClinicNavigation";
import { ViewPrescription } from "../../components/prescriptions/ViewPrescription";
import { CreatePrescription } from "../../components/prescriptions/CreatePrescription";
// import { usePatient } from "../../hooks/usePatients";

export const PatientPrescriptions: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { clinicId, patientId} = useClinicNavigation();
  console.log("clinicId, patientId", clinicId, patientId);
  // const { data: patient  } = usePatient(patientId);

    
  const {
    data: prescriptions,
    isLoading,
    isError,
    error,
  } = usePrescriptionsV2(clinicId, patientId);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Prescriptions</h2>
          <p className="text-xs text-slate-500">
            Write structured medication orders, dosing schedules, and patient
            instructions.
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          >
            + New Prescription
          </button>
        )}
      </div>

      {/* New Prescription Form Card */}
      {isCreating && clinicId && patientId && (
        <CreatePrescription 
        clinicId={clinicId}
        patientId={patientId}
        onCancel={() => setIsCreating(false)}
        onFinish={() => setIsCreating(false)}
        />
      )}

      {/* Historical Prescriptions List */}
      <div className="space-y-6">
        {isLoading && (
          <div className="bg-white p-8 text-center text-sm text-slate-400 rounded-lg border border-slate-200">
            Loading prescriptions...
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
            Failed to load prescriptions:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}

        {!isLoading &&
          !isError &&
          prescriptions?.length === 0 &&
          !isCreating && (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No prescriptions found
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                There are no recorded medication slips for this patient yet.
              </p>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Write First Prescription
              </button>
            </div>
          )}

        {prescriptions?.map((prescription) => (
          <ViewPrescription
            key={prescription.id}
            prescription={prescription}
          />
        ))}
      </div>
    </div>
  );
};