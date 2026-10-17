import React, { forwardRef } from 'react';
import type { Patient } from '../../types/patient';
import type { Prescription } from '../../types/prescription';

interface PrintablePrescriptionProps {
  patient: Patient;
  prescription: Prescription;
  clinicInfo?: {
    name: string;
    address: string;
    phone: string;
    regNumber?: string;
    email?: string;
  };
}

export const PrintablePrescription = forwardRef<HTMLDivElement, PrintablePrescriptionProps>(
  ({ patient, prescription, clinicInfo }, ref) => {
    const items = prescription.details?.prescriptions || [];
    const dateStr = new Date(prescription.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const patientCode =
      ('patient_code' in patient && typeof patient.patient_code === 'string' && patient.patient_code) ||
      patient.id.slice(0, 8).toUpperCase();

    return (
      <div ref={ref} className="print-sheet p-8 bg-white text-slate-900 font-sans max-w-3xl mx-auto">
        {/* Clinic Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-950">
              {clinicInfo?.name || 'Dental Poly-Clinic & Implant Centre'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {clinicInfo?.address || '102 Medical Arcade, Heritage Drive, Pune, MH'}
            </p>
            <p className="text-xs text-slate-600">
              Tel: {clinicInfo?.phone || '+91 98765 43210'} | Reg No: {clinicInfo?.regNumber || 'MH/DENT/2022/4102'}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 border border-slate-800 text-xs font-bold uppercase tracking-wider mb-1">
              PRESCRIPTION SLIP
            </span>
            <div className="text-xs font-mono font-bold">RX-#{prescription.id.slice(0, 8).toUpperCase()}</div>
            <div className="text-xs text-slate-500 font-mono">Date: {dateStr}</div>
          </div>
        </div>

        {/* Patient & Prescriber Ribbon */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs mb-5">
          <div>
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Patient Details</span>
            <strong className="text-slate-900 text-sm">{patient.name}</strong>
            <div className="text-slate-600 mt-0.5">
              Patient ID: <span className="font-mono font-bold text-slate-800">{patientCode}</span>
            </div>
            <div className="text-slate-500 mt-0.5">
              Phone: {patient.details?.contact?.phone || 'Not recorded'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Attending Clinician</span>
            <div className="text-slate-900 font-bold text-sm">
              {prescription.doctor?.name ? `Dr. ${prescription.doctor.name}` : 'Consulting Dental Surgeon'}
            </div>
            <div className="text-slate-500 mt-0.5">Dept. of Oral Health & Maxillofacial Care</div>
          </div>
        </div>

        {/* Rx Symbol Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-serif font-black text-slate-900 italic leading-none select-none">
            ℞
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Medication Schedule & Posology
          </span>
        </div>

        {/* Itemized Medications Table */}
        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px] tracking-wider text-left bg-slate-50/50">
              <th className="py-2.5 px-2.5 font-semibold w-8">#</th>
              <th className="py-2.5 px-2.5 font-semibold">Medication Name</th>
              <th className="py-2.5 px-2.5 font-semibold">Dosage / Strength</th>
              <th className="py-2.5 px-2.5 font-semibold">Frequency</th>
              <th className="py-2.5 px-2.5 font-semibold">Duration</th>
              <th className="py-2.5 px-2.5 font-semibold">Instructions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((med, idx) => (
              <tr key={med.id || idx} className="break-inside-avoid">
                <td className="py-3 px-2.5 font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3 px-2.5 font-bold text-slate-900">{med.name}</td>
                <td className="py-3 px-2.5 text-slate-700 font-medium">{med.dosage}</td>
                <td className="py-3 px-2.5">
                  <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                    {med.frequency}
                  </span>
                </td>
                <td className="py-3 px-2.5 text-slate-700 font-medium">
                  {med.duration_days} {med.duration_days === 1 ? 'day' : 'days'}
                </td>
                <td className="py-3 px-2.5 text-slate-600 italic">
                  {med.instructions || 'As advised'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Doctor's Advice / Special Notes */}
        {prescription.details?.notes && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 mb-8 break-inside-avoid">
            <strong className="block text-slate-900 text-[11px] uppercase tracking-wider mb-1">
              General Advice & Precautions:
            </strong>
            <p className="whitespace-pre-line leading-relaxed">{prescription.details.notes}</p>
          </div>
        )}

        {/* Footer & Signature */}
        <div className="pt-16 mt-auto border-t border-slate-200 flex justify-between items-end text-xs break-inside-avoid">
          <div className="text-[10px] text-slate-400 leading-tight">
            Dispense strictly per prescription • Valid for 14 days from date of issue.
            <br />
            Emergency contact: {clinicInfo?.phone || '+91 98765 43210'}
          </div>
          <div className="text-center w-52 border-t border-slate-400 pt-1 font-medium text-slate-800">
            {prescription.doctor?.name ? `Dr. ${prescription.doctor.name}` : 'Authorized Dental Surgeon'}
            <div className="text-[10px] text-slate-500 font-normal">Signature & Seal</div>
          </div>
        </div>
      </div>
    );
  }
);

PrintablePrescription.displayName = 'PrintablePrescription';