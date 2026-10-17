import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import type { LabTest, LabTestStatus, LabProcedure } from '../../types/labTest';
import {
  useLabTests,
  useLabProcedureCatalog,
  useCreateLabTest,
  useUpdateLabTest,
} from '../../hooks/useLabTests';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

const statusConfig: Record<LabTestStatus, { label: string; badgeClass: string }> = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 line-through',
  },
};

export const PatientLabTests: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');

  const { data: tests, isLoading, isError, error } = useLabTests(patient.id);
  const { data: catalog = [] } = useLabProcedureCatalog(patient.clinic_id);

  const filteredTests = tests?.filter((test) => {
    if (filter === 'active') return test.status === 'pending' || test.status === 'in_progress';
    if (filter === 'completed') return test.status === 'completed';
    if (filter === 'cancelled') return test.status === 'cancelled';
    return true;
  });

  const activeCount =
    tests?.filter((t) => t.status === 'pending' || t.status === 'in_progress').length || 0;
  const completedCount = tests?.filter((t) => t.status === 'completed').length || 0;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lab Orders & Requisitions</h2>
          <p className="text-xs text-slate-500">
            Order external prosthesis, dental CAD/CAM work, diagnostics, and track turnaround statuses.
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            + Order Lab Test
          </button>
        )}
      </div>

      {/* New Lab Test Form */}
      {isCreating && (
        <CreateLabTestCard
          patient={patient}
          catalog={catalog}
          onClose={() => setIsCreating(false)}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          {(
            [
              { id: 'all', label: 'All Orders', count: tests?.length || 0 },
              { id: 'active', label: 'Active', count: activeCount },
              { id: 'completed', label: 'Completed', count: completedCount },
              {
                id: 'cancelled',
                label: 'Cancelled',
                count: (tests?.length || 0) - activeCount - completedCount,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="bg-white p-8 text-center text-sm text-slate-400 rounded-lg border border-slate-200">
            Loading lab orders...
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
            Failed to load lab tests: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && filteredTests?.length === 0 && !isCreating && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-sm font-medium text-slate-700">No lab tests found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {filter === 'all'
                ? 'No external lab work has been ordered for this patient yet.'
                : `No orders matching filter "${filter}".`}
            </p>
            {filter === 'all' && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Create Lab Order
              </button>
            )}
          </div>
        )}

        {filteredTests?.map((test) => (
          <HistoricalLabTestCard
            key={test.id}
            test={test}
            catalog={catalog}
            patientId={patient.id}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: New Lab Test Order Form (with Dual Cross-Filtering & Auto Cost)
// ============================================================================
const CreateLabTestCard: React.FC<{
  patient: Patient;
  catalog: LabProcedure[];
  onClose: () => void;
}> = ({ patient, catalog, onClose }) => {
  const createMutation = useCreateLabTest(patient.id);

  // Search & Selected text
  const [procedureQuery, setProcedureQuery] = useState('');
  const [labQuery, setLabQuery] = useState('');
  const [status, setStatus] = useState<LabTestStatus>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dropdown visibility
  const [isProcOpen, setIsProcOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);

  const procContainerRef = useRef<HTMLDivElement>(null);
const labContainerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      procContainerRef.current &&
      !procContainerRef.current.contains(event.target as Node)
    ) {
      setIsProcOpen(false);
    }
    if (
      labContainerRef.current &&
      !labContainerRef.current.contains(event.target as Node)
    ) {
      setIsLabOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  // 1. Filtered Procedures based on current lab input
  const availableProcedures = useMemo(() => {
    let list = catalog;
    if (labQuery.trim()) {
      list = list.filter((p) =>
        p.lab?.name.toLowerCase().includes(labQuery.trim().toLowerCase())
      );
    }
    // Extract unique procedure names
    const seen = new Set<string>();
    const unique: string[] = [];
    list.forEach((p) => {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        unique.push(p.name);
      }
    });

    if (!procedureQuery.trim()) return unique;
    return unique.filter((name) =>
      name.toLowerCase().includes(procedureQuery.trim().toLowerCase())
    );
  }, [catalog, labQuery, procedureQuery]);

  // 2. Filtered Labs based on current procedure input
  const availableLabs = useMemo(() => {
    let list = catalog;
    if (procedureQuery.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(procedureQuery.trim().toLowerCase())
      );
    }
    // Extract unique labs
    const seen = new Set<string>();
    const unique: Array<{ id: string; name: string }> = [];
    list.forEach((p) => {
      if (p.lab && !seen.has(p.lab.id)) {
        seen.add(p.lab.id);
        unique.push({ id: p.lab.id, name: p.lab.name });
      }
    });

    if (!labQuery.trim()) return unique;
    return unique.filter((l) =>
      l.name.toLowerCase().includes(labQuery.trim().toLowerCase())
    );
  }, [catalog, procedureQuery, labQuery]);

  // 3. Exact matching lab_procedure record
  const matchedProcedure = useMemo<LabProcedure | null>(() => {
    if (!procedureQuery.trim() || !labQuery.trim()) return null;
    return (
      catalog.find(
        (p) =>
          p.name.toLowerCase() === procedureQuery.trim().toLowerCase() &&
          p.lab?.name.toLowerCase() === labQuery.trim().toLowerCase()
      ) || null
    );
  }, [catalog, procedureQuery, labQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!matchedProcedure) {
      setErrorMsg(
        'Please select a valid procedure and laboratory combination from the registered catalog.'
      );
      return;
    }

    try {
      await createMutation.mutateAsync({
        clinicId: patient.clinic_id,
        doctorId: null,
        labProcedureId: matchedProcedure.id,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create lab test');
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 shadow-md p-6">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            New Lab Requisition
          </h3>
          <p className="text-[11px] text-slate-400">
            Select a procedure and lab partner to load preconfigured cost and delivery turnaround.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs font-medium"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Procedure Autocomplete Input */}
          <div ref={procContainerRef} className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procedure / Work Ordered
            </label>
            <input
              type="text"
              placeholder="Search or select procedure..."
              value={procedureQuery}
              onFocus={() => setIsProcOpen(true)}
              onChange={(e) => {
                setProcedureQuery(e.target.value);
                setIsProcOpen(true);
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
            {procedureQuery && (
              <button
                type="button"
                onClick={() => setProcedureQuery('')}
                className="absolute right-2.5 top-7 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}

            {isProcOpen && availableProcedures.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 text-xs border border-slate-200">
                {availableProcedures.map((procName) => (
                  <li
                    key={procName}
                    onClick={() => {
                      setProcedureQuery(procName);
                      setIsProcOpen(false);
                      // If only 1 lab provides this procedure, auto-select it
                      const matchingLabs = catalog
                        .filter((c) => c.name.toLowerCase() === procName.toLowerCase())
                        .map((c) => c.lab?.name)
                        .filter(Boolean);
                      if (matchingLabs.length === 1 && matchingLabs[0]) {
                        setLabQuery(matchingLabs[0]);
                      }
                    }}
                    className="cursor-pointer px-3 py-2 hover:bg-blue-50 hover:text-blue-700 font-medium text-slate-700"
                  >
                    {procName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Laboratory Autocomplete Input */}
          <div ref={labContainerRef} className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Laboratory Partner / Vendor
            </label>
            <input
              type="text"
              placeholder="Search or select lab..."
              value={labQuery}
              onFocus={() => setIsLabOpen(true)}
              onChange={(e) => {
                setLabQuery(e.target.value);
                setIsLabOpen(true);
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
            {labQuery && (
              <button
                type="button"
                onClick={() => setLabQuery('')}
                className="absolute right-2.5 top-7 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}

            {isLabOpen && availableLabs.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 text-xs border border-slate-200">
                {availableLabs.map((lab) => (
                  <li
                    key={lab.id}
                    onClick={() => {
                      setLabQuery(lab.name);
                      setIsLabOpen(false);
                      // If only 1 procedure offered by this lab, auto-select it
                      const labProcs = catalog
                        .filter((c) => c.lab_id === lab.id)
                        .map((c) => c.name);
                      if (labProcs.length === 1) {
                        setProcedureQuery(labProcs[0]);
                      }
                    }}
                    className="cursor-pointer px-3 py-2 hover:bg-blue-50 hover:text-blue-700 font-medium text-slate-700"
                  >
                    {lab.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Read-Only Cost Estimate & Turnaround Summary Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Estimated Lab Charge (Fee)
            </span>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {matchedProcedure
                ? `₹${Number(matchedProcedure.cost).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}`
                : '—'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Configured in lab procedure master
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Expected Delivery
            </span>
            <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
              {matchedProcedure
                ? `⏱ ${matchedProcedure.estimated_turnaround_days} Days`
                : '—'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Calculates reminder trigger date
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LabTestStatus)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Submission Controls */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !matchedProcedure}
            className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-40 transition-opacity"
          >
            {createMutation.isPending ? 'Ordering...' : 'Submit Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// COMPONENT: Historical Lab Test Card (View vs Edit Controller)
// ============================================================================
const HistoricalLabTestCard: React.FC<{
  test: LabTest;
  catalog: LabProcedure[];
  patientId: string;
}> = ({ test, catalog, patientId }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      {!isEditing ? (
        <LabTestView test={test} patientId={patientId} onEdit={() => setIsEditing(true)} />
      ) : (
        <LabTestEditForm
          test={test}
          catalog={catalog}
          patientId={patientId}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Lab Test View Mode with Quick Status Selector
// ============================================================================
const LabTestView: React.FC<{
  test: LabTest;
  patientId: string;
  onEdit: () => void;
}> = ({ test, patientId, onEdit }) => {
  const updateMutation = useUpdateLabTest(patientId);

  const createdFormatted = new Date(test.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handleQuickStatusChange = (newStatus: LabTestStatus) => {
    updateMutation.mutate({ id: test.id, status: newStatus });
  };

  const currentBadge = statusConfig[test.status] || statusConfig.pending;
  const procedure = test.lab_procedure;
  const lab = procedure?.lab;

  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-slate-900">
            {procedure?.name || 'Unspecified Procedure'}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${currentBadge.badgeClass}`}
          >
            {currentBadge.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>
            Lab: <strong className="text-slate-800">{lab?.name || 'In-House / Unspecified'}</strong>
          </span>
          <span>•</span>
          <span>
            Fee:{' '}
            <strong className="text-slate-800 font-mono">
              ₹{Number(procedure?.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </span>
          <span>•</span>
          <span>
            Turnaround: <strong className="text-slate-800 font-mono">{procedure?.estimated_turnaround_days || 7}d</strong>
          </span>
          <span>•</span>
          <span>Ordered: {createdFormatted}</span>
          {test.doctor?.name && (
            <>
              <span>•</span>
              <span>Doctor: {test.doctor.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 self-end md:self-center">
        <select
          value={test.status}
          onChange={(e) => handleQuickStatusChange(e.target.value as LabTestStatus)}
          disabled={updateMutation.isPending}
          className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
        >
          <option value="pending">Mark Pending</option>
          <option value="in_progress">Mark In Progress</option>
          <option value="completed">Mark Completed</option>
          <option value="cancelled">Mark Cancelled</option>
        </select>

        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Lab Test Edit Form
// ============================================================================
const LabTestEditForm: React.FC<{
  test: LabTest;
  catalog: LabProcedure[];
  patientId: string;
  onCancel: () => void;
}> = ({ test, catalog, patientId, onCancel }) => {
  const updateMutation = useUpdateLabTest(patientId);

  const initialProc = test.lab_procedure;
  const [procedureQuery, setProcedureQuery] = useState(initialProc?.name || '');
  const [labQuery, setLabQuery] = useState(initialProc?.lab?.name || '');
  const [status, setStatus] = useState<LabTestStatus>(test.status);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isProcOpen, setIsProcOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);

  const procContainerRef = useRef<HTMLDivElement>(null);
  const labContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      procContainerRef.current &&
      !procContainerRef.current.contains(event.target as Node)
    ) {
      setIsProcOpen(false);
    }
    if (
      labContainerRef.current &&
      !labContainerRef.current.contains(event.target as Node)
    ) {
      setIsLabOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  const availableProcedures = useMemo(() => {
    let list = catalog;
    if (labQuery.trim()) {
      list = list.filter((p) =>
        p.lab?.name.toLowerCase().includes(labQuery.trim().toLowerCase())
      );
    }
    const seen = new Set<string>();
    const unique: string[] = [];
    list.forEach((p) => {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        unique.push(p.name);
      }
    });

    if (!procedureQuery.trim()) return unique;
    return unique.filter((name) =>
      name.toLowerCase().includes(procedureQuery.trim().toLowerCase())
    );
  }, [catalog, labQuery, procedureQuery]);

  const availableLabs = useMemo(() => {
    let list = catalog;
    if (procedureQuery.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(procedureQuery.trim().toLowerCase())
      );
    }
    const seen = new Set<string>();
    const unique: Array<{ id: string; name: string }> = [];
    list.forEach((p) => {
      if (p.lab && !seen.has(p.lab.id)) {
        seen.add(p.lab.id);
        unique.push({ id: p.lab.id, name: p.lab.name });
      }
    });

    if (!labQuery.trim()) return unique;
    return unique.filter((l) =>
      l.name.toLowerCase().includes(labQuery.trim().toLowerCase())
    );
  }, [catalog, procedureQuery, labQuery]);

  const matchedProcedure = useMemo<LabProcedure | null>(() => {
    if (!procedureQuery.trim() || !labQuery.trim()) return null;
    return (
      catalog.find(
        (p) =>
          p.name.toLowerCase() === procedureQuery.trim().toLowerCase() &&
          p.lab?.name.toLowerCase() === labQuery.trim().toLowerCase()
      ) || null
    );
  }, [catalog, procedureQuery, labQuery]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!matchedProcedure) {
      setErrorMsg('Please select a valid procedure and lab from the catalog.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: test.id,
        labProcedureId: matchedProcedure.id,
        status,
      });
      onCancel();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update lab test');
    }
  };

  return (
    <form onSubmit={handleUpdate} className="p-4 bg-slate-50/50 space-y-3 text-xs">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <span className="font-bold text-slate-700 uppercase tracking-wider">
          Edit Lab Requisition
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending || !matchedProcedure}
            className="px-3 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-40"
          >
            {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div ref={procContainerRef} className="relative">
          <label className="block font-semibold text-slate-600 mb-1">Procedure</label>
          <input
            type="text"
            value={procedureQuery}
            onFocus={() => setIsProcOpen(true)}
            onChange={(e) => {
              setProcedureQuery(e.target.value);
              setIsProcOpen(true);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          {isProcOpen && availableProcedures.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded bg-white py-1 shadow-lg ring-1 ring-black/5 border border-slate-200">
              {availableProcedures.map((procName) => (
                <li
                  key={procName}
                  onClick={() => {
                    setProcedureQuery(procName);
                    setIsProcOpen(false);
                  }}
                  className="cursor-pointer px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 text-slate-700"
                >
                  {procName}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={labContainerRef} className="relative">
          <label className="block font-semibold text-slate-600 mb-1">Laboratory Vendor</label>
          <input
            type="text"
            value={labQuery}
            onFocus={() => setIsLabOpen(true)}
            onChange={(e) => {
              setLabQuery(e.target.value);
              setIsLabOpen(true);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          {isLabOpen && availableLabs.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded bg-white py-1 shadow-lg ring-1 ring-black/5 border border-slate-200">
              {availableLabs.map((lab) => (
                <li
                  key={lab.id}
                  onClick={() => {
                    setLabQuery(lab.name);
                    setIsLabOpen(false);
                  }}
                  className="cursor-pointer px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 text-slate-700"
                >
                  {lab.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-2.5 rounded border border-slate-200 items-center">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase">Lab Cost</span>
          <span className="font-mono font-bold text-slate-800">
            {matchedProcedure ? `₹${Number(matchedProcedure.cost).toFixed(2)}` : '—'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase">Turnaround</span>
          <span className="font-mono font-bold text-blue-700">
            {matchedProcedure ? `⏱ ${matchedProcedure.estimated_turnaround_days} Days` : '—'}
          </span>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LabTestStatus)}
            className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-medium outline-none"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </form>
  );
};