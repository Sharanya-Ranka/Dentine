import { PatientDetails } from '../pages/patient/PatientDetails';
import type { Database } from './database.types';

type PatientType = Database['public']['Tables']['patient']['Row'];

export interface PatientContact {
  phone?: string;
  email?: string;
}

export interface PatientInsurance {
  provider?: string;
  policy_number?: string;
  coverage_amount?: number;
}

export interface PatientDetails {
  address?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  contact?: PatientContact;
  insurance?: PatientInsurance | null;
  medical_alerts?: string[];
  [key: string]: unknown;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  details: PatientDetails;
  created_at: string;
  updated_at: string;
}

export type PatientV2 = Omit<PatientType, 'details'> & {
  details: PatientDetails;
}