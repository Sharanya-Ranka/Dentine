import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { LabTest, LabTestStatus, LabProcedure } from '../types/labTest';

// Fetch global lab test requisitions with procedures, labs, patients, and doctors
export function useAllLabTests(clinicId: string, searchQuery: string = '') {
  return useQuery({
    queryKey: ['all_lab_tests', clinicId, searchQuery],
    queryFn: async (): Promise<LabTest[]> => {
      if (!clinicId) return [];

      let query = supabase
        .from('lab_test')
        .select(`
          *,
          lab_procedure:lab_procedure!inner (
            id,
            clinic_id,
            lab_id,
            name,
            cost,
            estimated_turnaround_days,
            created_at,
            updated_at,
            lab:lab!inner (
              id,
              name,
              phone,
              contact_person,
              email
            )
          ),
          patient:patient (
            id,
            name,
            details
          ),
          doctor:employee (
            id,
            name
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(
          `lab_procedure.name.ilike.%${searchQuery.trim()}%,lab_procedure.lab.name.ilike.%${searchQuery.trim()}%`
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as LabTest[]) || [];
    },
    enabled: Boolean(clinicId),
  });
}

// Fetch all available lab procedures and their partner labs for the clinic
export function useLabProcedureCatalog(clinicId: string) {
  return useQuery({
    queryKey: ['lab_procedure_catalog', clinicId],
    queryFn: async (): Promise<LabProcedure[]> => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from('lab_procedure')
        .select(`
          *,
          lab:lab (
            id,
            clinic_id,
            name,
            contact_person,
            phone,
            email,
            address,
            created_at,
            updated_at
          )
        `)
        .eq('clinic_id', clinicId)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as LabProcedure[]) || [];
    },
    enabled: Boolean(clinicId),
  });
}

// Create new global lab order referencing lab_procedure_id
export function useCreateGlobalLabTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      patientId,
      doctorId,
      labProcedureId,
      status = 'pending',
    }: {
      clinicId: string;
      patientId: string;
      doctorId?: string | null;
      labProcedureId: string;
      status?: LabTestStatus;
    }) => {
      const { data, error } = await supabase
        .from('lab_test')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: doctorId || null,
          lab_procedure_id: labProcedureId,
          status,
        })
        .select(`
          *,
          lab_procedure:lab_procedure (
            id,
            name,
            cost,
            estimated_turnaround_days,
            lab:lab ( id, name )
          )
        `)
        .single();

      if (error) throw new Error(error.message);
      return data as LabTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_lab_tests'] });
      queryClient.invalidateQueries({ queryKey: ['lab_tests'] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

// Update lab order status or reassign lab procedure
export function useUpdateGlobalLabTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      labProcedureId,
      status,
    }: {
      id: string;
      labProcedureId?: string;
      status?: LabTestStatus;
    }) => {
      const updates: {
        updated_at: string;
        lab_procedure_id?: string;
        status?: LabTestStatus;
      } = {
        updated_at: new Date().toISOString(),
      };

      if (labProcedureId !== undefined) updates.lab_procedure_id = labProcedureId;
      if (status !== undefined) updates.status = status;

      const { data, error } = await supabase
        .from('lab_test')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          lab_procedure:lab_procedure (
            id,
            name,
            cost,
            estimated_turnaround_days,
            lab:lab ( id, name )
          )
        `)
        .single();

      if (error) throw new Error(error.message);
      return data as LabTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_lab_tests'] });
      queryClient.invalidateQueries({ queryKey: ['lab_tests'] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}