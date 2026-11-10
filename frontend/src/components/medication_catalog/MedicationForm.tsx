import React, { useState } from 'react';
import type { MedicationCatalogInput } from '../../hooks/useMedicationCatalog';
import type { MedicationCatalog } from '../../types/prescription';


interface MedicationFormProps {
  isEdit: boolean;
  clinicId: string;
  initialData?: MedicationCatalog | null;
  onCancel: () => void;
  onSubmit: (data: MedicationCatalogInput) => Promise<void>;
  isSubmitting: boolean;
}

export const MedicationForm: React.FC<MedicationFormProps> = ({
  isEdit,
  clinicId,
  initialData,
  onCancel,
  onSubmit,
  isSubmitting,
}) => {
  // Initialize state directly from initialData — no useEffect needed
  const [name, setName] = useState(initialData?.name ?? '');
  const [genericName, setGenericName] = useState(initialData?.generic_name ?? '');
  const [defaultDosage, setDefaultDosage] = useState(initialData?.default_dosage ?? '');
  const [defaultFrequency, setDefaultFrequency] = useState(initialData?.default_frequency ?? '1-0-1');
  const [defaultDurationDays, setDefaultDurationDays] = useState<number>(
    initialData?.default_duration_days ?? 5
  );
  const [defaultInstructions, setDefaultInstructions] = useState(
    initialData?.default_instructions ?? ''
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !defaultDosage.trim() || !defaultFrequency.trim()) {
      setErrorMsg('Brand name, dosage, and frequency are required.');
      return;
    }

    try {
      await onSubmit({
        clinic_id: clinicId,
        name: name.trim(),
        generic_name: genericName.trim() || null,
        default_dosage: defaultDosage.trim(),
        default_frequency: defaultFrequency.trim(),
        default_duration_days: defaultDurationDays,
        default_instructions: defaultInstructions.trim() || null,
        is_active: isActive,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred while saving.');
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isEdit ? 'Edit Medication Template' : 'Add New Medication'}
          </h3>
          <p className="text-xs text-slate-500">
            {isEdit
              ? 'Update the default prescribing values for this item.'
              : 'Add a new drug template to your clinic’s prescribing formulary.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium"
        >
          Close
        </button>
      </div>

      {errorMsg && (
        <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Brand / Trade Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Augmentin 625"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Generic Name / Salt
            </label>
            <input
              type="text"
              placeholder="e.g. Amoxicillin + Clavulanate"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Dosage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 625 mg, 1 tablet"
              value={defaultDosage}
              onChange={(e) => setDefaultDosage(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Frequency <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1-0-1 (BD), TID"
              value={defaultFrequency}
              onChange={(e) => setDefaultFrequency(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Duration (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={defaultDurationDays}
              onChange={(e) => setDefaultDurationDays(parseInt(e.target.value) || 1)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Patient Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Take immediately after food. Avoid dairy products."
              value={defaultInstructions}
              onChange={(e) => setDefaultInstructions(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 md:pt-5">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Active in Formulary
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  );
};