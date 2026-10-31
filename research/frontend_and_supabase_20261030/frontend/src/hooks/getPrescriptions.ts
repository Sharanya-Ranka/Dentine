// src/api/prescriptions.ts
import { supabase } from '../lib/supabase';
import type {
  MedicationCatalogItem,
  PrescriptionRecord,
  CreatePrescriptionInput,
} from '../types/prescriptions';

import type { Json } from '../types/database.types';

export async function getMedicationCatalog(): Promise<MedicationCatalogItem[]> {
  const { data, error } = await supabase
    .from('medication_catalog')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPrescriptions(): Promise<PrescriptionRecord[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      id,
      doctor_id,
      patient_id,
      notes,
      prescribed_at,
      created_at,
      items:prescription_items (
        id,
        prescription_id,
        medication_id,
        medication_name,
        dosage,
        frequency,
        duration_days,
        instructions,
        created_at
      )
    `)
    .order('prescribed_at', { ascending: false });

  if (error) throw error;
  return (data as PrescriptionRecord[]) ?? [];
}

export async function createPrescription(input: CreatePrescriptionInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_prescription', {
    p_doctor_id: input.doctor_id,
    p_patient_id: input.patient_id,
    p_notes: input.notes || "",
    p_items: input.items as unknown as Json,
  });

  if (error) throw error;
  return data as string; // returns created prescription UUID
}