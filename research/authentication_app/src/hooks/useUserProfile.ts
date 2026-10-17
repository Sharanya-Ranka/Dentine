import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '../types/database';
import { supabase } from '../lib/supabase';

type AppUser = Database['public']['Tables']['app_user']['Row'];

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['app_user', userId],
    queryFn: async (): Promise<AppUser | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useUpsertUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, name, email }: { userId: string; name: string; email: string }) => {
      const { data, error } = await supabase
        .from('app_user')
        .upsert(
          {
            user_id: userId,
            name,
            email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as AppUser;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['app_user', data.user_id], data);
    },
  });
}