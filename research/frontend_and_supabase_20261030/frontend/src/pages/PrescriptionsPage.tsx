// src/pages/PrescriptionsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMedicationCatalog, getPrescriptions } from '../hooks/getPrescriptions';
import { DUMMY_DOCTORS, DUMMY_PATIENTS } from '../data';
import { AddPrescriptionForm } from '../components/AddPrescriptionForm';

export const PrescriptionsPage: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  // 1. Fetch Medication Catalog (Cache indefinitely for the session)
  const { data: catalog = [] } = useQuery({
    queryKey: ['medication_catalog'],
    queryFn: getMedicationCatalog,
    staleTime: Infinity,
  });

  // 2. Fetch All Prescriptions
  const {
    data: prescriptions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: getPrescriptions,
  });

  // Helper mappings for dummy doctors & patients
  const getDoctorName = (id: string) =>
    DUMMY_DOCTORS.find((d) => d.id === id)?.name ?? 'Unknown Doctor';
  const getPatientName = (id: string) =>
    DUMMY_PATIENTS.find((p) => p.id === id)?.name ?? 'Unknown Patient';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prescription Registry</h1>
            <p className="text-sm text-slate-500">
              Research portal: full prescription records and catalog items.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal((prev) => !prev)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            {showAddModal ? 'Close Form' : '+ New Prescription'}
          </button>
        </div>

        {/* Collapsible Add Prescription Form */}
        {showAddModal && (
          <AddPrescriptionForm
            catalog={catalog}
            onSuccess={() => setShowAddModal(false)}
          />
        )}

        {/* Prescriptions List */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            All Prescriptions ({prescriptions.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Loading all prescriptions...
            </div>
          ) : isError ? (
            <div className="rounded-md bg-rose-50 p-4 border border-rose-200 text-sm text-rose-700">
              Error loading prescriptions: {(error as Error).message}
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm">
              No prescriptions recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {getPatientName(rx.patient_id)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Prescribed by <span className="font-medium text-slate-700">{getDoctorName(rx.doctor_id)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-400 block">
                        {new Date(rx.prescribed_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {rx.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 italic">
                      Notes: {rx.notes}
                    </p>
                  )}

                  {/* Nested Line Items */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Medication</th>
                          <th className="py-2 px-3">Dosage</th>
                          <th className="py-2 px-3">Frequency</th>
                          <th className="py-2 px-3">Duration</th>
                          <th className="py-2 px-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rx.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {item.medication_name}
                            </td>
                            <td className="py-2.5 px-3">{item.dosage}</td>
                            <td className="py-2.5 px-3">{item.frequency}</td>
                            <td className="py-2.5 px-3">{item.duration_days} days</td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {item.instructions || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};