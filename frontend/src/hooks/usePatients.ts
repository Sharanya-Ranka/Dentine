import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Patient, PatientDetails } from '../types/patient';
import type { Json } from '../types/database.types';

export function usePatients(clinicId?: string) {
  return useQuery({
    queryKey: clinicId ? ['patients', 'clinic', clinicId] : ['patients', 'all'],
    queryFn: async (): Promise<Patient[]> => {
      let query = supabase.from('patient').select('*');
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }
      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as Patient[]) || [];
    },
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async (): Promise<Patient> => {
      if (!id) throw new Error('Patient ID is required');

      const { data, error } = await supabase
        .from('patient')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as Patient;
    },
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      name,
      details,
    }: {
      clinicId: string;
      name: string;
      details: PatientDetails;
    }) => {
      const { data, error } = await supabase
        .from('patient')
        .insert({
          clinic_id: clinicId,
          name,
          details: details as Json,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Patient;
    },
    onSuccess: (newPatient) => {
      queryClient.setQueryData(['patients', newPatient.id], newPatient);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      details,
    }: {
      id: string;
      name: string;
      details: PatientDetails;
    }) => {
      const { data, error } = await supabase
        .from('patient')
        .update({
          name,
          details: details as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Patient;
    },
    onSuccess: (updatedPatient) => {
      queryClient.setQueryData(['patients', updatedPatient.id], updatedPatient);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}