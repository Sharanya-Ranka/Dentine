import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Prescription, PrescriptionDetails } from '../types/prescription';
import type { Json } from '../types/database.types';


export async function fetchAllPrescriptions(clinicId: string): Promise<Prescription[]> {
    console.log('Fetching prescriptions for clinicId:', clinicId);
    const { data, error } = await supabase
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

    if (error) throw new Error(error.message);
    return (data as unknown as Prescription[]) || [];
}

export function useAllPrescriptions(clinicId:string = '', searchQuery: string = '') {
  return useQuery({
    queryKey: ['all_prescriptions', clinicId],
    queryFn: () => fetchAllPrescriptions(clinicId),
    select: (prescriptions) => {
      if (!searchQuery) return prescriptions;
      return prescriptions.filter((p) => {
        const findInDetails = p.details.prescriptions.map((d) => d.name+ ' '+ d.dosage + ' '+ d.frequency + ' '+ d.instructions).join(' ');
        const findIn = {patientName: p.patient?.name, doctorName: p.doctor?.name || '', details: findInDetails};
        
        console.log("findIn:", JSON.stringify(findIn));
        console.log("searchQuery:", searchQuery);
        console.log("found?: ", JSON.stringify(findIn).toLowerCase().includes(searchQuery.toLowerCase()))
        return JSON.stringify(findIn).toLowerCase().includes(searchQuery.toLowerCase());
      });
    },
  });
}

export function useCreateGlobalPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      patientId,
      doctorId,
      details,
    }: {
      clinicId: string;
      patientId: string;
      doctorId?: string | null;
      details: PrescriptionDetails;
    }) => {
      const { data, error } = await supabase
        .from('prescription')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: doctorId || null,
          details: details as Json,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline'] });
    },
  });
}

export function useUpdateGlobalPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      details,
    }: {
      id: string;
      details: PrescriptionDetails;
    }) => {
      const { data, error } = await supabase
        .from('prescription')
        .update({
          details: details as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline'] });
    },
  });
}