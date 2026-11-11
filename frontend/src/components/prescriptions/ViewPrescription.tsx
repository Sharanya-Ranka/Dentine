import React, { useRef, useState } from 'react';
import type { PrescriptionV2 } from '../../types/prescription';
import { useReactToPrint } from 'react-to-print';
import { PrintablePrescription } from './PrintablePrescription';
import { useCancelPrescription } from '../../hooks/usePrescriptions';

interface ViewPrescriptionProps {
  prescription: PrescriptionV2;
}

export const ViewPrescription: React.FC<ViewPrescriptionProps> = ({
  prescription,
}) => {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const {mutate: onCancelPrescription, isPending: isCancelling} = useCancelPrescription();

  const isCancelled = prescription.status === 'cancelled';

  const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: `Prescription_${prescription.patient.name.replace(/\s+/g, "_")}_${prescription.id.slice(0, 8)}`,
      pageStyle: `
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `,
    });

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setErrorMsg('Please supply a reason for cancelling this prescription.');
      return;
    }

    try {
      setErrorMsg(null);
      await onCancelPrescription({id:prescription.id, cancel_reason:cancelReason.trim()});
      setIsCancelModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to cancel prescription');
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(prescription.created_at));

  return (
    <>
      <div
        className={`bg-white rounded-lg border max-w-3xl w-full mx-auto p-6 transition-colors shadow-sm ${
          isCancelled
            ? 'bg-slate-50/70 border-slate-300 opacity-75 grayscale-[30%]'
            : 'border-slate-200'
        }`}
      >
        {/* Banner if Cancelled */}
        {isCancelled && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex justify-between items-start">
            <div>
              <span className="font-bold uppercase tracking-wide">Prescription Cancelled / Voided</span>
              {prescription.cancel_reason && (
                <p className="mt-0.5 text-red-700">
                  <span className="font-medium">Reason:</span> {prescription.cancel_reason}
                </p>
              )}
            </div>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-semibold text-[10px]">
              REVOKED
            </span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Prescription Slip</h3>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  isCancelled
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {prescription.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Issued on {formattedDate} (IST)</p>
          </div>

          <div className="text-right text-xs">
            {prescription.doctor && (
              <p className="font-semibold text-slate-800">Dr. {prescription.doctor.name}</p>
            )}
            {prescription.patient && (
              <p className="text-slate-600 mt-0.5">
                Patient: <span className="font-medium">{prescription.patient.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Prescription Details List */}
        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Medications
          </h4>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Medication</th>
                  <th className="p-2.5">Dosage</th>
                  <th className="p-2.5">Frequency</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescription.details.map((med, index) => { return(
                  <tr key={med.id || index} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-slate-400 font-mono">{index + 1}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{med.name}</td>
                    <td className="p-2.5 text-slate-600">{med.dosage}</td>
                    <td className="p-2.5 text-slate-600 font-medium">{med.frequency}</td>
                    <td className="p-2.5 text-slate-600">
                      {med.duration_days} {med.duration_days === 1 ? 'day' : 'days'}
                    </td>
                    <td className="p-2.5 text-slate-500">{med.instructions || '—'}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {prescription.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-xs">
            <span className="font-semibold text-slate-700">Remarks / Instructions:</span>
            <p className="mt-1 text-slate-600">{prescription.notes}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center">
          <div>
            {!isCancelled && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
              >
                Cancel / Revoke Prescription
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePrint()}
              disabled={isCancelled}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded inline-flex items-center gap-1.5"
            >
              🖨 Print Slip
            </button>
          </div>
        </div>
      </div>

      {/* Cancellation Prompt Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900">Cancel Prescription</h4>
            <p className="text-xs text-slate-600">
              Prescriptions are permanent medical records. Once cancelled, this slip will be marked
              voided and cannot be reverted.
            </p>

            {errorMsg && (
              <div className="p-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Patient allergic to penicillin, changed to Clindamycin..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded font-semibold disabled:opacity-50"
              >
                {isCancelling ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden offscreen container holding the printable layout */}
    <div style={{ display: "none" }}>
        <PrintablePrescription
        ref={componentRef}
        patient={prescription.patient}
        prescription={prescription}
        />
    </div>
    </>
  );
};



interface CompactPrescriptionCardProps {
  prescription: PrescriptionV2;
  onSelect: (prescription: PrescriptionV2) => void;
}

/**
 * Compact representation of a prescription slip tailored for high-density clinic lists.
 * Features prominent patient identity, status, medication pills, and quick print/view actions.
 */
export const CompactPrescriptionCard: React.FC<CompactPrescriptionCardProps> = ({
  prescription,
  onSelect,
}) => {
  const isCancelled = prescription.status === 'cancelled';
  const printRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(prescription.created_at));

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prescription_${prescription.patient?.name?.replace(/\s+/g, '_') || 'Patient'}_${prescription.id.slice(0, 8)}`,
  });

  return (
    <>
      <div
        className={`group relative rounded-xl border p-4 transition-all duration-150 hover:shadow-md ${
          isCancelled
            ? 'bg-slate-50/70 border-slate-200 opacity-80'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Header: Patient Info & Status */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm md:text-base truncate">
                {prescription.patient?.name || 'Unknown Patient'}
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isCancelled ? 'Cancelled' : prescription.status || 'Active'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1">
              <span>Issued: {formattedDate}</span>
              {prescription.doctor?.name && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>Dr. {prescription.doctor.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handlePrint()}
              disabled={prescription.status === 'cancelled'}
              title="Quick Print"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onSelect(prescription)}
              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors"
            >
              View Slip
            </button>
          </div>
        </div>

        {/* Medications Summary Pills */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Prescribed Items ({prescription.details?.length || 0})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {prescription.details && prescription.details.length > 0 ? (
              prescription.details.map((med, idx) => (
                <div
                  key={med.id || idx}
                  className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2 py-1 rounded text-xs border border-slate-200"
                >
                  <span className="font-medium text-slate-900">{med.name}</span>
                  <span className="text-[10px] text-slate-500 bg-white px-1 rounded border border-slate-200 font-mono">
                    {med.dosage}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({med.frequency} &bull; {med.duration_days}d)
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No medications recorded</span>
            )}
          </div>
        </div>

        {/* Doctor Remarks / Notes */}
        {prescription.notes && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500 shrink-0">Note:</span>
            <p className="line-clamp-2 text-slate-600">{prescription.notes}</p>
          </div>
        )}

        {/* Cancellation Notice */}
        {isCancelled && prescription.cancel_reason && (
          <div className="mt-2.5 p-2 bg-rose-50/70 border border-rose-100 rounded text-xs text-rose-700">
            <span className="font-medium">Revocation Reason:</span> {prescription.cancel_reason}
          </div>
        )}
      </div>

      {/* Hidden container for print action */}
      <div style={{ display: 'none' }}>
        <PrintablePrescription
          ref={printRef}
          patient={prescription.patient}
          prescription={prescription}
        />
      </div>
    </>
  );
};