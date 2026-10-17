export type LabTestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type Lab = {
  id: string;
  clinic_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type LabProcedure = {
  id: string;
  clinic_id: string;
  lab_id: string;
  name: string;
  cost: number;
  estimated_turnaround_days: number;
  created_at: string;
  updated_at: string;
  lab?: Lab;
};

export type LabTest = {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  lab_procedure_id: string;
  status: LabTestStatus;
  created_at: string;
  updated_at: string;
  lab_procedure?: LabProcedure;
  doctor?: {
    id: string;
    name: string;
  } | null;
  patient?: {
    id: string;
    name: string;
    details?: {
      contact?: {
        phone?: string;
        email?: string;
      };
    };
  } | null;
};