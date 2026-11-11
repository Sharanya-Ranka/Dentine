// Master catalog template item
export type MedicationCatalogItem = {
  id: string;
  name: string;
  generic_name: string | null;
  default_dosage: string;
  default_frequency: string;
  default_duration_days: number;
  default_instructions: string | null;
  is_active: boolean;
};

// Prescription line item tied to a prescription
export type PrescriptionItem = {
  id: string;
  prescription_id: string;
  medication_id: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string | null;
};

// Complete prescription with embedded items
export type PrescriptionWithDetails = {
  id: string;
  patient_id: string;
  doctor_id: string;
  notes: string | null;
  prescribed_at: string;
  items: PrescriptionItem[];
};

// src/types.ts
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
}

export interface PrescriptionItemDraft {
  medication_id: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string;
}

export interface PrescriptionItemRecord extends PrescriptionItemDraft {
  id: string;
  prescription_id: string;
  created_at: string;
}

export interface PrescriptionRecord {
  id: string;
  doctor_id: string;
  patient_id: string;
  notes: string | null;
  prescribed_at: string;
  created_at: string;
  items: PrescriptionItemRecord[];
}

export interface CreatePrescriptionInput {
  doctor_id: string;
  patient_id: string;
  notes: string | null;
  items: PrescriptionItemDraft[];
}