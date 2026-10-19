import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import type { Database } from '../types/database';
import type { UserClinicDetail } from '../types/extras';
import { supabase } from '../lib/supabase';

interface AssociationJoinRow {
  id: string;
  clinic_id: string;
  role: 'owner' | 'non-owner';
  created_at: string;
  clinic: {
    id: string;
    name: string;
  } | null;
}

export function useUserClinics(userId: string | undefined) {
  return useQuery({
    queryKey: ['user_clinics', userId],
    queryFn: async (): Promise<UserClinicDetail[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_clinic_association')
        .select(`
          id,
          clinic_id,
          role,
          created_at,
          clinic:clinic_id (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return ((data as unknown) as AssociationJoinRow[]).map((row) => ({
        association_id: row.id,
        clinic_id: row.clinic_id,
        clinic_name: row.clinic?.name ?? 'Unnamed Clinic',
        role: row.role,
        created_at: row.created_at,
      }));
    },
    enabled: !!userId,
  });
}

export function useCreateClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clinicName }: { clinicName: string }) => {
      const { data, error } = await supabase.rpc('create_clinic_with_owner', {
        clinic_name: clinicName.trim(),
      });

      if (error) throw error;
      return data as string; // returns created clinic UUID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_clinics'] });
    },
  });
}