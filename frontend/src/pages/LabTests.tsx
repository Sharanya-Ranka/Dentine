import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { LabTest, LabTestStatus, LabProcedure } from '../types/labTest';
import {
  useAllLabTests,
  useLabProcedureCatalog,
  useCreateGlobalLabTest,
  useUpdateGlobalLabTest,
} from '../hooks/useAllLabTests';
import { usePatients } from '../hooks/usePatients';
import { useClinicId, useDoctorId } from '../hooks/useSession';
import { useClinicNavigation } from '../hooks/useClinicNavigation';

type FilterTab = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

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

export const LabTests: React.FC = () => {
  const clinicId = useClinicId();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);

  const { data: labTests, isLoading, isError, error } = useAllLabTests(clinicId, searchTerm);
  const { data: catalog = [] } = useLabProcedureCatalog(clinicId);
  const updateMutation = useUpdateGlobalLabTest();
  const { paths } = useClinicNavigation();

  // Filter by status tab and search term (procedure, lab vendor, patient name)
  const filteredTests = useMemo(() => {
    return labTests?.filter((test) => {
      const matchesTab = activeTab === 'all' || test.status === activeTab;
      const patientName = test.patient?.name?.toLowerCase() || '';
      const procName = test.lab_procedure?.name?.toLowerCase() || '';
      const labName = test.lab_procedure?.lab?.name?.toLowerCase() || '';
      const query = searchTerm.toLowerCase().trim();

      const matchesQuery =
        query === '' ||
        procName.includes(query) ||
        labName.includes(query) ||
        patientName.includes(query);

      return matchesTab && matchesQuery;
    });
  }, [labTests, activeTab, searchTerm]);

  const counts = {
    all: labTests?.length || 0,
    pending: labTests?.filter((t) => t.status === 'pending').length || 0,
    in_progress: labTests?.filter((t) => t.status === 'in_progress').length || 0,
    completed: labTests?.filter((t) => t.status === 'completed').length || 0,
    cancelled: labTests?.filter((t) => t.status === 'cancelled').length || 0,
  };

  const handleQuickStatusChange = (testId: string, newStatus: LabTestStatus) => {
    updateMutation.mutate({ id: testId, status: newStatus });
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Lab Orders</h1>
          <p className="mt-1 text-slate-500 text-sm">
            Track external laboratory prosthetics, CAD/CAM fabrications, turnaround schedules, and costs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
        >
          + New Lab Order
        </button>
      </div>

      {/* Controls: Search and Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by procedure, vendor, or patient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-xs px-3.5 py-2 text-sm border border-slate-300 rounded-md outline-none bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'in_progress', label: 'In Progress', count: counts.in_progress },
              { id: 'completed', label: 'Completed', count: counts.completed },
              { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        {isLoading && (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading clinic lab requisitions...
          </div>
        )}

        {isError && (
          <div className="p-6 text-red-700 bg-red-50 text-sm">
            Failed to load lab tests: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && filteredTests?.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            No lab orders found matching current filters.
          </div>
        )}

        {!isLoading && !isError && filteredTests && filteredTests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Procedure / Prosthesis</th>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Lab Vendor</th>
                  <th className="px-4 py-3 font-semibold">Turnaround</th>
                  <th className="px-4 py-3 font-semibold text-right">Fee (₹)</th>
                  <th className="px-4 py-3 font-semibold">Date Ordered</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.map((test) => {
                  const badge = statusConfig[test.status] || statusConfig.pending;
                  const proc = test.lab_procedure;
                  const lab = proc?.lab;
                  const dateStr = new Date(test.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={test.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Procedure */}
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {proc?.name || 'Unspecified Procedure'}
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3.5 text-slate-700">
                        {test.patient ? (
                          <Link
                            to={paths.patientDetail(test.patient.id)}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {test.patient.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Lab Name */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {lab?.name ? (
                          <span className="font-medium text-slate-800">{lab.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">In-house</span>
                        )}
                      </td>

                      {/* Turnaround */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                          ⏱ {proc?.estimated_turnaround_days ?? 7}d
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        ₹{Number(proc?.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Status / Quick Switch */}
                      <td className="px-4 py-3.5">
                        <select
                          value={test.status}
                          onChange={(e) =>
                            handleQuickStatusChange(test.id, e.target.value as LabTestStatus)
                          }
                          disabled={updateMutation.isPending}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${badge.badgeClass}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Edit Button */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingTest(test)}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded text-xs font-medium text-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <CreateLabOrderModal
          clinicId={clinicId}
          catalog={catalog}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Edit Order Modal */}
      {editingTest && (
        <EditLabOrderModal
          test={editingTest}
          catalog={catalog}
          onClose={() => setEditingTest(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// MODAL: Create Lab Order (With Patient Selector, Autocomplete & Cost Preview)
// ============================================================================
const CreateLabOrderModal: React.FC<{
  clinicId: string;
  catalog: LabProcedure[];
  onClose: () => void;
}> = ({ clinicId, catalog, onClose }) => {
  const doctorId = useDoctorId();
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  const createMutation = useCreateGlobalLabTest();

  const [patientId, setPatientId] = useState('');
  const [procedureQuery, setProcedureQuery] = useState('');
  const [labQuery, setLabQuery] = useState('');
  const [status, setStatus] = useState<LabTestStatus>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dropdown states & click-outside refs
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

  // Filter available procedures based on selected/typed lab
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

  // Filter available labs based on selected/typed procedure
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

  // Find exact match
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

    if (!patientId) {
      setErrorMsg('Please select a patient.');
      return;
    }

    if (!matchedProcedure) {
      setErrorMsg(
        'Please select a valid procedure and laboratory combination from the registered catalog.'
      );
      return;
    }

    const selectedPatient = patients?.find((p) => p.id === patientId);
    if (!selectedPatient) {
      setErrorMsg('Invalid patient selected.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        clinicId: selectedPatient.clinic_id || clinicId,
        patientId,
        doctorId,
        labProcedureId: matchedProcedure.id,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create lab order');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Create New Lab Order</h3>
            <p className="text-xs text-slate-500">Assign a patient and requisition from verified lab vendors.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Patient
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Patient --</option>
              {isLoadingPatients && <option disabled>Loading patients...</option>}
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.details?.contact?.phone ? `(${p.details.contact.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Procedure & Lab Autocomplete Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Procedure Autocomplete */}
            <div ref={procContainerRef} className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Procedure / Work Ordered
              </label>
              <input
                type="text"
                placeholder="Type or select procedure..."
                value={procedureQuery}
                onFocus={() => setIsProcOpen(true)}
                onChange={(e) => {
                  setProcedureQuery(e.target.value);
                  setIsProcOpen(true);
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
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

            {/* Lab Vendor Autocomplete */}
            <div ref={labContainerRef} className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Laboratory Vendor
              </label>
              <input
                type="text"
                placeholder="Type or select vendor..."
                value={labQuery}
                onFocus={() => setIsLabOpen(true)}
                onChange={(e) => {
                  setLabQuery(e.target.value);
                  setIsLabOpen(true);
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
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

          {/* Auto-populated Summary & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Standard Lab Fee
              </span>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {matchedProcedure
                  ? `₹${Number(matchedProcedure.cost).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}`
                  : '—'}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Expected Turnaround
              </span>
              <div className="text-sm font-bold font-mono text-blue-700 mt-0.5">
                {matchedProcedure
                  ? `⏱ ${matchedProcedure.estimated_turnaround_days} Days`
                  : '—'}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LabTestStatus)}
                className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white font-medium outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              {createMutation.isPending ? 'Ordering...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: Edit Lab Order (Cross-filter with Click-Outside Dropdowns)
// ============================================================================
const EditLabOrderModal: React.FC<{
  test: LabTest;
  catalog: LabProcedure[];
  onClose: () => void;
}> = ({ test, catalog, onClose }) => {
  const updateMutation = useUpdateGlobalLabTest();

  const initialProc = test.lab_procedure;
  const [procedureQuery, setProcedureQuery] = useState(initialProc?.name || '');
  const [labQuery, setLabQuery] = useState(initialProc?.lab?.name || '');
  const [status, setStatus] = useState<LabTestStatus>(test.status);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dropdown states & click-outside refs
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
      setErrorMsg('Please select a valid procedure and laboratory from the catalog.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: test.id,
        labProcedureId: matchedProcedure.id,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Lab Order</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Patient: <strong className="text-slate-700">{test.patient?.name || 'Unassigned'}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Procedure */}
            <div ref={procContainerRef} className="relative">
              <label className="block font-semibold text-slate-600 mb-1">
                Procedure / Prosthesis
              </label>
              <input
                type="text"
                value={procedureQuery}
                onFocus={() => setIsProcOpen(true)}
                onChange={(e) => {
                  setProcedureQuery(e.target.value);
                  setIsProcOpen(true);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
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

            {/* Vendor */}
            <div ref={labContainerRef} className="relative">
              <label className="block font-semibold text-slate-600 mb-1">
                Laboratory Vendor
              </label>
              <input
                type="text"
                value={labQuery}
                onFocus={() => setIsLabOpen(true)}
                onChange={(e) => {
                  setLabQuery(e.target.value);
                  setIsLabOpen(true);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
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

          {/* Pricing & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200 items-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Lab Fee</span>
              <span className="font-mono font-bold text-slate-900">
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
                className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-medium outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !matchedProcedure}
              className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-40"
            >
              {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};