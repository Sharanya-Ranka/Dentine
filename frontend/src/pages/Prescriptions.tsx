// frontend/src/pages/Prescriptions.tsx
import React, { useState, useMemo } from 'react';
import { usePrescriptionsV2 } from '../hooks/usePrescriptions';
import { CompactPrescriptionCard, ViewPrescription } from '../components/prescriptions/ViewPrescription';

import { useClinicNavigation } from '../hooks/useClinicNavigation';
// import { useAuth } from '../context/AuthContext'; // Or your application's clinic/auth context hook



export const Prescriptions: React.FC = () => {
  const { clinicId } = useClinicNavigation();

  // Pass clinicId and null as patientId to load ALL prescriptions in the clinic
  const { data: prescriptions = [], isLoading, isError, error } = usePrescriptionsV2(clinicId, null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const selectedPrescription = selectedPrescriptionId ? prescriptions.find(p => p.id === selectedPrescriptionId) : null;

  // Multi-field search across patient name, medications, and notes
  const filteredPrescriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return prescriptions.filter((item) => {
      // Status filter
      if (statusFilter === 'active' && item.status === 'cancelled') return false;
      if (statusFilter === 'cancelled' && item.status !== 'cancelled') return false;

      if (!query) return true;

      // 1. Patient Name
      const patientMatch = item.patient?.name?.toLowerCase().includes(query);

      // 2. Doctor's Notes
      const notesMatch = item.notes?.toLowerCase().includes(query);

      // 3. Medications (name, dosage, frequency, instructions)
      const medicationMatch = item.details?.some(
        (med) =>
          med.name.toLowerCase().includes(query) ||
          med.dosage?.toLowerCase().includes(query) ||
          med.frequency?.toLowerCase().includes(query) ||
          med.instructions?.toLowerCase().includes(query)
      );

      return Boolean(patientMatch || notesMatch || medicationMatch);
    });
  }, [prescriptions, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinic Prescriptions</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Browse, search, and view all patient prescriptions issued across the clinic.
            </p>
          </div>

          {/* Read-only counter tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-xs text-slate-600 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Total Records: <strong className="text-slate-900">{prescriptions.length}</strong>
          </div>
        </div>

        {/* Search Bar & Status Filter */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, medication name (e.g. Amoxicillin), or notes..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading clinic prescriptions...</p>
          </div>
        ) : isError ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
            <p className="text-sm font-semibold text-red-800">Failed to load prescriptions</p>
            <p className="text-xs text-red-600">{error instanceof Error ? error.message : 'An error occurred'}</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No prescriptions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No prescription records matched "${searchQuery}". Try modifying your search criteria.`
                : 'There are currently no prescription slips issued in this clinic.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrescriptions.map((prescription) => (
              <CompactPrescriptionCard
                key={prescription.id}
                prescription={prescription}
                onSelect={(p) => setSelectedPrescriptionId(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal dialog showing full ViewPrescription details & cancel actions */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8">
            <button
              type="button"
              onClick={() => setSelectedPrescriptionId(null)}
              className="absolute -top-3 -right-3 z-50 p-1.5 bg-white rounded-full text-slate-500 hover:text-slate-800 shadow-md border border-slate-200 transition-transform active:scale-95"
              aria-label="Close modal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ViewPrescription prescription={selectedPrescription} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;