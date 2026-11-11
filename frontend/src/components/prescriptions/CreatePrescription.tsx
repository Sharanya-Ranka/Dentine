import React, { useState } from 'react';
import { SearchPicker, type SearchPickerOption } from '../common/SearchPicker';
import type { PrescriptionItem } from '../../types/prescription';
import { useCreatePrescriptionV2 } from '../../hooks/usePrescriptions';
import { useClinicNavigation } from '../../hooks/useClinicNavigation';
import { useMedicationCatalog } from '../../hooks/useMedicationCatalog';

export interface MedicationCatalogItem {
  id: string;
  name: string;
  generic_name: string | null;
  default_dosage: string;
  default_frequency: string;
  default_duration_days: number;
  default_instructions: string | null;
}

interface CreatePrescriptionProps {
  clinicId: string;
  patientId: string;
  onCancel: () => void;
  onFinish: () => void;
}

export const CreatePrescription: React.FC<CreatePrescriptionProps> = ({
  clinicId,
  patientId,
  onCancel,
  onFinish,
}) => {
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [pickerSelectionKey, setPickerSelectionKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const {data: medicationCatalog} = useMedicationCatalog(clinicId);
  const {doctorId} = useClinicNavigation();

  const {mutate:createPrescription, isPending: isSaving} = useCreatePrescriptionV2();

  // Convert catalog items into SearchPicker format
  const catalogOptions: SearchPickerOption<MedicationCatalogItem>[] = medicationCatalog?.map((med) => ({
    value: med,
    label: (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-800">{med.name}</span>
        <span className="text-[10px] text-slate-400">
          {med.generic_name ? `${med.generic_name} • ` : ''}
          {med.default_dosage} • {med.default_frequency}
        </span>
      </div>
    ),
    searchStr: `${med.name} ${med.generic_name ?? ''}`,
  })) || [];

  const handleSelectMedication = (selectedMed: MedicationCatalogItem) => {
    const newItem: PrescriptionItem = {
      id: crypto.randomUUID(),
      name: selectedMed.name,
      dosage: selectedMed.default_dosage || '',
      frequency: selectedMed.default_frequency || '1-0-1',
      duration_days: selectedMed.default_duration_days || 5,
      instructions: selectedMed.default_instructions || '',
    };

    setItems((prev) => [...prev, newItem]);
    // Force picker key reset so input clears
    setPickerSelectionKey(crypto.randomUUID());
  };

  const handleManualAdd = () => {
    const customItem: PrescriptionItem = {
      id: crypto.randomUUID(),
      name: '',
      dosage: '',
      frequency: '1-0-1',
      duration_days: 5,
      instructions: '',
    };
    setItems((prev) => [...prev, customItem]);
  };

  const handleUpdateItem = (
    id: string,
    field: keyof PrescriptionItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('Please add at least one medication before issuing.');
      return;
    }

    const hasInvalidEntries = items.some(
      (item) => !item.name.trim() || !item.dosage.trim() || item.duration_days <= 0
    );

    if (hasInvalidEntries) {
      setErrorMsg('Ensure all medications have a valid name, dosage, and duration.');
      return;
    }

    try {
      await createPrescription({
        clinicId,
        patientId,
        doctorId: doctorId,
        details: items,
        notes: notes.trim() || "",
      });
      onFinish();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to issue prescription');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xl max-w-4xl w-full mx-auto space-y-5">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900">Issue New Prescription</h3>
          <p className="text-xs text-slate-500">Search formulary or enter custom medicines.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      {/* Top SearchPicker */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Search Medication Formulary
        </label>
        <div className="flex gap-2">
          <SearchPicker
            key={pickerSelectionKey}
            options={catalogOptions}
            onSelect={handleSelectMedication}
            placeholder="Type brand name or generic (e.g. Amoxicillin, Paracetamol)..."
          />
          <button
            type="button"
            onClick={handleManualAdd}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded whitespace-nowrap"
          >
            + Custom Drug
          </button>
        </div>
      </div>

      {/* Items Table / Form Entries */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Prescription Items ({items.length})
        </label>

        {items.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded text-center text-xs text-slate-400">
            No medications added yet. Search above or click Custom Drug to add.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, ) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-start bg-slate-50 p-2.5 rounded border border-slate-200 text-xs"
              >
                <div className="col-span-3">
                  <label className="text-[10px] text-slate-500 uppercase font-medium">Drug Name</label>
                  <input
                    type="text"
                    value={item.name}
                    placeholder="e.g. Augmentin 625"
                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                    className="w-full mt-0.5 p-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 uppercase font-medium">Dosage</label>
                  <input
                    type="text"
                    value={item.dosage}
                    placeholder="e.g. 1 tab"
                    onChange={(e) => handleUpdateItem(item.id, 'dosage', e.target.value)}
                    className="w-full mt-0.5 p-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 uppercase font-medium">Frequency</label>
                  <input
                    type="text"
                    value={item.frequency}
                    placeholder="e.g. 1-0-1 (BD)"
                    onChange={(e) => handleUpdateItem(item.id, 'frequency', e.target.value)}
                    className="w-full mt-0.5 p-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-[10px] text-slate-500 uppercase font-medium">Days</label>
                  <input
                    type="number"
                    min="1"
                    value={item.duration_days}
                    onChange={(e) =>
                      handleUpdateItem(item.id, 'duration_days', parseInt(e.target.value) || 1)
                    }
                    className="w-full mt-0.5 p-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-3">
                  <label className="text-[10px] text-slate-500 uppercase font-medium">Instructions</label>
                  <input
                    type="text"
                    value={item.instructions}
                    placeholder="e.g. After meals"
                    onChange={(e) => handleUpdateItem(item.id, 'instructions', e.target.value)}
                    className="w-full mt-0.5 p-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-1 flex justify-center pt-5">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove item"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General Instructions / Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          General Clinical Advice / Remarks
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Warm saline rinses after 24 hrs. Avoid hard food on left side."
          className="w-full text-xs p-2.5 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
        >
          {isSaving ? 'Issuing...' : 'Issue Prescription'}
        </button>
      </div>
    </div>
  );
};