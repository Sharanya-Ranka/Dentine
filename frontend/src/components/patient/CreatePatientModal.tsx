import React, { useState } from 'react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCreatePatient } from '../../hooks/usePatients';
import type { Patient, PatientDetails } from '../../types/patient';

interface CreatePatientModalProps {
  isOpen: boolean;
  clinicId: string;
  onClose: () => void;
  onSuccess?: (newPatient: Patient) => void;
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  clinicId,
  onClose,
  onSuccess,
}) => {
  const createPatientMutation = useCreatePatient();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [newAlertInput, setNewAlertInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setAge('');
    setGender('');
    setInsuranceProvider('');
    setPolicyNumber('');
    setAlerts([]);
    setNewAlertInput('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAddAlert = (e: KeyboardEvent | MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const formatted = newAlertInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (formatted && !alerts.includes(formatted)) {
      setAlerts([...alerts, formatted]);
      setNewAlertInput('');
    }
  };

  const handleRemoveAlert = (target: string) => {
    setAlerts(alerts.filter((a) => a !== target));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Patient full name is required');
      return;
    }

    const details: PatientDetails = {
      address: address.trim() || undefined,
      gender: gender ? gender : undefined,
      age: age !== '' ? Number(age) : undefined,
      contact: {
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      },
      insurance: insuranceProvider.trim()
        ? {
            provider: insuranceProvider.trim(),
            policy_number: policyNumber.trim() || undefined,
          }
        : null,
      medical_alerts: alerts,
    };

    try {
      const createdPatient = await createPatientMutation.mutateAsync({
        clinicId,
        name: name.trim(),
        details,
      });
      handleClose();
      if (onSuccess) {
        onSuccess(createdPatient);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to register patient');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">New Patient Registration</h3>
            <p className="text-xs text-slate-500">Record baseline demographics, contact, and safety alerts</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-md border border-red-200 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Section 1: Demographics */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              General Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  placeholder="e.g. 34"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Address */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Contact & Address
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Residential Address</label>
              <textarea
                rows={2}
                placeholder="Street address, apartment, city, pincode"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Section 3: Safety & Medical Alerts */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-3">
              Medical & Safety Alerts
            </h4>
            {alerts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {alerts.map((alert) => (
                  <span
                    key={alert}
                    className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {alert.replace(/_/g, ' ')}
                    <button
                      type="button"
                      onClick={() => handleRemoveAlert(alert)}
                      className="hover:text-red-900 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="e.g. hypertension, latex_allergy"
                value={newAlertInput}
                onChange={(e) => setNewAlertInput(e.target.value)}
                onKeyDown={handleAddAlert}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-md flex-1 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddAlert}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300"
              >
                Add Alert
              </button>
            </div>
          </div>

          {/* Section 4: Insurance */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Insurance Details (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Provider Name</label>
                <input
                  type="text"
                  placeholder="e.g. Star Health / HDFC ERGO"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Policy / Member ID</label>
                <input
                  type="text"
                  placeholder="e.g. POL-1029384"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={createPatientMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md border border-slate-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPatientMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              {createPatientMutation.isPending ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};