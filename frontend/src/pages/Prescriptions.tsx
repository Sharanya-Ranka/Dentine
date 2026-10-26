import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import type { Prescription, PrescriptionDetails, PrescriptionItem } from '../types/prescription';
import {
  useAllPrescriptions,
  // useCreateGlobalPrescription,
  // useUpdateGlobalPrescription,
} from '../hooks/useAllPrescriptions';
// import { usePatients } from '../hooks/usePatients';
import { useClinicNavigation } from '../hooks/useClinicNavigation';
// import { useReactToPrint } from 'react-to-print';
import { HistoricalPrescriptionCard } from './patient/PatientPrescriptions';
import type { Patient } from '../types/patient';

export const Prescriptions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // const componentRef = React.createRef<HTMLDivElement>();

  const { clinicId } = useClinicNavigation();
  const { data: prescriptions, isLoading, isError, error } = useAllPrescriptions(clinicId, searchTerm);

  // const {paths} = useClinicNavigation();
  
  // Client-side filtering matching patient name, medication name, or doctor name
  const filteredPrescriptions = prescriptions;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Prescriptions</h1>
          <p className="mt-1 text-slate-500 text-sm">
            Review clinic-wide medication orders, dosage regimens, and print prescription slips.
          </p>
        </div>
        {/* <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
        >
          + Issue Prescription
        </button> */}
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by patient, medicine (e.g. Amoxicillin), or doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3.5 py-2 text-sm border border-slate-300 rounded-md outline-none bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {filteredPrescriptions?.length || 0} Prescriptions Recorded
        </span>
      </div>

      {/* Table Data View */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {isLoading && (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading prescription history...
          </div>
        )}

        {isError && (
          <div className="p-6 text-red-700 bg-red-50 text-sm">
            Failed to load prescriptions: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && filteredPrescriptions?.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            No prescriptions found matching "{searchTerm}".
          </div>
        )}

        {!isLoading && !isError && filteredPrescriptions && filteredPrescriptions.length > 0 && 
            prescriptions?.map((prescription) => (
          <HistoricalPrescriptionCard
            key={prescription.id}
            prescription={prescription}
            patient={prescription.patient as Patient}
          />
        )) }
      </div>
    </div>
  );
};