import type { Patient } from "./patient";
import type { Database } from './database.types';

export type PrescriptionType = Database['public']['Tables']['prescription']['Row'];

export type PrescriptionItem = {
  id: string; // crypto.randomUUID()
  name: string; // e.g. "Amoxicillin"
  dosage: string; // e.g. "500mg" or "1 capsule"
  frequency: string; // e.g. "1-0-1", "TID", "Once daily"
  duration_days: number; // e.g. 5
  instructions: string; // e.g. "After food. Complete full course."
};

export type PrescriptionDetails = {
  prescriptions: PrescriptionItem[];
  notes?: string; // Optional general advisory (e.g. "Drink plenty of water")
};

export type Prescription = {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  details: PrescriptionDetails;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    name: string;
  } | null;
  patient?: Patient;
};


export type PrescriptionV2 = Omit<PrescriptionType, 'doctor_id' | 'patient_id' | 'details'> & {
  details: PrescriptionItem[];
  doctor?: {
    id: string;
    name: string;
  } | null;
  patient: Patient;
};

export type MedicationCatalog = Database['public']['Tables']['medication_catalog']['Row'];