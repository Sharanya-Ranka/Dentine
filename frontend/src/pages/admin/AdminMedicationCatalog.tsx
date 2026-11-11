import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    useMedicationCatalog,
  useMedicationCatalogMutations,
  type MedicationCatalogInput,
} from '../../hooks/useMedicationCatalog';
import { MedicationForm } from '../../components/medication_catalog/MedicationForm';
import type { MedicationCatalog } from '../../types/prescription';

export const AdminMedicationCatalog: React.FC = () => {
  const { clinicId = '' } = useParams<{ clinicId: string }>();

  const { data: catalog = [], isLoading, error } = useMedicationCatalog(clinicId);
  const { createMutation, updateMutation, deleteMutation } =
    useMedicationCatalogMutations(clinicId);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Inline Form State
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationCatalog | null>(null);

  // Inline Delete Confirmation State (tracks item id)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.generic_name &&
          item.generic_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        filterActive === 'all'
          ? true
          : filterActive === 'active'
          ? item.is_active
          : !item.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [catalog, searchQuery, filterActive]);

  const handleStartCreate = () => {
    setIsEdit(false);
    setEditingMedication(null);
    setShowForm(true);
  };

  const handleStartEdit = (med: MedicationCatalog) => {
    setIsEdit(true);
    setEditingMedication(med);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEdit(false);
    setEditingMedication(null);
  };

  const handleFormSubmit = async (formData: MedicationCatalogInput) => {
    if (isEdit && editingMedication) {
      await updateMutation.mutateAsync({
        id: editingMedication.id,
        ...formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
    handleCloseForm();
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeletingId(null);
  };

  return (
    <div className="max-w-6xl w-full mx-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Medication Formulary</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage templates for dosages, frequencies, and instructions.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm inline-flex items-center gap-1.5"
          >
            <span className="text-sm font-bold leading-none">+</span> Add Medication
          </button>
        )}
      </div>

      {/* Inline Create/Edit Form Container */}
      {showForm && (
        <MedicationForm
          isEdit={isEdit}
          clinicId={clinicId}
          initialData={editingMedication}
          onCancel={handleCloseForm}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search brand or generic name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">Status:</span>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
            className="text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All ({catalog.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-slate-400">Loading formulary...</div>
        ) : error ? (
          <div className="p-6 text-xs text-red-600 bg-red-50">
            Failed to load medication catalog: {(error as Error).message}
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No medications found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Brand / Generic</th>
                  <th className="py-3 px-4">Default Dosing</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Instructions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalog.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      editingMedication?.id === item.id
                        ? 'bg-blue-50/50'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.generic_name && (
                        <div className="text-[11px] text-slate-400">{item.generic_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {item.default_dosage}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.default_frequency}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.default_duration_days} days
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {item.default_instructions || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {deletingId === item.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-[11px] text-red-600 font-medium">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(item.id)}
                            disabled={deleteMutation.isPending}
                            className="text-[11px] text-red-700 font-bold hover:underline"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="text-[11px] text-slate-500 hover:underline ml-1"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};