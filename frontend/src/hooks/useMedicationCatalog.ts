import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { MedicationCatalog } from '../types/prescription';

export function useMedicationCatalog(clinicId: string | null) {
  return useQuery({
    queryKey: ['medication_catalog', clinicId],
    queryFn: async (): Promise<MedicationCatalog[]> => {
      if (!clinicId) return [];
      const {data, error} = await supabase
            .from('medication_catalog')
            .select(`
              *
            `)
            .eq('clinic_id', clinicId);

      if (error) throw new Error(error.message);
      return (data as MedicationCatalog[]) || [];
    },
    enabled: Boolean(clinicId),
  });
}

export type MedicationCatalogInput = Omit<
  MedicationCatalog,
  'id' | 'created_at' | 'updated_at'
>;

export function useMedicationCatalogMutations(clinicId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['medication_catalog', clinicId];

  const createMutation = useMutation({
    mutationFn: async (payload: MedicationCatalogInput) => {
      const { data, error } = await supabase
        .from('medication_catalog')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<MedicationCatalogInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('medication_catalog')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('medication_catalog')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}