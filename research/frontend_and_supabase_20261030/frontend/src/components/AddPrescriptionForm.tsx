// src/components/AddPrescriptionForm.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPrescription } from '../hooks/getPrescriptions';
import { DUMMY_DOCTORS, DUMMY_PATIENTS } from '../data';
import { ComboboxSelector } from './ComboboxSelector';
import type { MedicationCatalogItem, PrescriptionItemDraft } from '../types/prescriptions';

interface AddPrescriptionFormProps {
  catalog: MedicationCatalogItem[];
  onSuccess?: () => void;
}

export const AddPrescriptionForm: React.FC<AddPrescriptionFormProps> = ({
  catalog,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [doctorId, setDoctorId] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<PrescriptionItemDraft[]>([]);

  // TanStack Mutation
  const { mutate: savePrescription, isPending, error } = useMutation({
    mutationFn: createPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      // Reset form
      setDoctorId('');
      setPatientId('');
      setNotes('');
      setItems([]);
      onSuccess?.();
    },
  });

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        medication_id: null,
        medication_name: '',
        dosage: '',
        frequency: '',
        duration_days: 5,
        instructions: '',
      },
    ]);
  };

  const updateItem = (index: number, updates: Partial<PrescriptionItemDraft>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicationSelect = (index: number, catalogItem: MedicationCatalogItem) => {
    updateItem(index, {
      medication_id: catalogItem.id,
      medication_name: catalogItem.name,
      dosage: catalogItem.default_dosage,
      frequency: catalogItem.default_frequency,
      duration_days: catalogItem.default_duration_days,
      instructions: catalogItem.default_instructions ?? '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !patientId || items.length === 0) return;

    savePrescription({
      doctor_id: doctorId,
      patient_id: patientId,
      notes: notes.trim() ? notes : null,
      items,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-5">Create New Prescription</h2>

      {error && (
        <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          {(error as Error).message}
        </div>
      )}

      {/* Doctor & Patient Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ComboboxSelector
          label="Prescribing Doctor"
          required
          placeholder="Type doctor name..."
          valueId={doctorId}
          options={DUMMY_DOCTORS.map((d) => ({
            id: d.id,
            label: d.name,
            sublabel: d.specialty,
          }))}
          onSelect={(opt) => setDoctorId(opt.id)}
        />

        <ComboboxSelector
          label="Patient"
          required
          placeholder="Type patient name..."
          valueId={patientId}
          options={DUMMY_PATIENTS.map((p) => ({
            id: p.id,
            label: p.name,
            sublabel: `DOB: ${p.dob}`,
          }))}
          onSelect={(opt) => setPatientId(opt.id)}
        />
      </div>

      {/* General Notes */}
      <div className="mb-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">
          Clinical Notes
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional instructions, symptoms, or diagnoses..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Prescription Items */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Prescription Items ({items.length})
          </label>
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            + Add Medication Line
          </button>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-500">
            No medications added yet.{' '}
            <button
              type="button"
              onClick={addItem}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Add a medication
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative space-y-3"
              >
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 text-xs px-2 py-1 font-bold"
                >
                  ✕
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                  {/* Substring Medication Selector */}
                  <ComboboxSelector
                    label="Medication (Catalog Search)"
                    placeholder="Search medication name..."
                    valueId={item.medication_id}
                    options={catalog.map((c) => ({
                      id: c.id,
                      label: c.name,
                      sublabel: `${c.default_dosage} | ${c.default_frequency}`,
                    }))}
                    onSelect={(opt) => {
                      const matched = catalog.find((c) => c.id === opt.id);
                      if (matched) handleMedicationSelect(idx, matched);
                    }}
                  />

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Medication Name Snapshot *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.medication_name}
                      onChange={(e) => updateItem(idx, { medication_name: e.target.value })}
                      placeholder="e.g. Amoxicillin"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.dosage}
                      onChange={(e) => updateItem(idx, { dosage: e.target.value })}
                      placeholder="e.g. 500 mg"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.frequency}
                      onChange={(e) => updateItem(idx, { frequency: e.target.value })}
                      placeholder="e.g. 1-0-1 or TID"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Duration (Days) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={item.duration_days}
                      onChange={(e) =>
                        updateItem(idx, { duration_days: parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                    Patient Instructions
                  </label>
                  <input
                    type="text"
                    value={item.instructions}
                    onChange={(e) => updateItem(idx, { instructions: e.target.value })}
                    placeholder="e.g. After food. Complete entire course."
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !doctorId || !patientId || items.length === 0}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Saving Prescription...' : 'Save Prescription'}
      </button>
    </form>
  );
};