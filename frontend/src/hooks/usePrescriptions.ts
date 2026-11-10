import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PrescriptionV2, PrescriptionType, PrescriptionItem } from '../types/prescription';
import type { Json } from '../types/database.types';

export function usePrescriptionsV2(clinicId: string | null  , patientId: string | null ) {
  return useQuery({
    queryKey: ['prescriptions', clinicId, patientId],
    queryFn: async (): Promise<PrescriptionV2[]> => {
      if (!clinicId) return [];

      let query = supabase
        .from('prescription')
        .select(`
          *,
          patient:patient (*),
          doctor:app_user (
            id:user_id,
            name
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
        
      if(patientId){
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;


      if (error) throw new Error(error.message);
      return (data as unknown as PrescriptionV2[]) || [];
    },
    enabled: Boolean(clinicId),
  });
}



export function useCreatePrescriptionV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      clinicId,
      doctorId,
      details,
      notes,
    }: {
      patientId: string;
      clinicId: string;
      doctorId?: string | null;
      details: PrescriptionItem[];
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('prescription')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: doctorId || null,
          details: details as Json,
          notes: notes,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PrescriptionType;
    },
    onSuccess: (prescription) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', prescription.clinic_id, prescription.patient_id] });
      // queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}


export function useUpdatePrescriptionV2() {
  // For regulatory purposes, the only update that can be done is to cancel a prescription with an optional cancel message.
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      cancel_reason,
    }: {
      id: string;
      cancel_reason?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('prescription')
        .update({
          cancel_reason: cancel_reason || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PrescriptionType;
    },
    onSuccess: (prescription) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', prescription.clinic_id, prescription.patient_id] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', prescription.clinic_id, null] });
      // queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}

export function useCancelPrescription() {
  // For regulatory purposes, the only update that can be done is to cancel a prescription with an optional cancel message.
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      cancel_reason,
    }: {
      id: string;
      cancel_reason?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('prescription')
        .update({
          status: 'cancelled',
          cancel_reason: cancel_reason || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PrescriptionType;
    },
    onSuccess: (prescription) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', prescription.clinic_id, prescription.patient_id] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', prescription.clinic_id, null] });
      // queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}