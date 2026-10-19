import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  ReminderStatus,
  ReminderType,
} from '../types/reminder';
import type { Json, Database } from '../types/database.types';

type ReminderUpdate = Database['public']['Tables']['reminder']['Update'];
type ReminderInsert = Database['public']['Tables']['reminder']['Insert'];

interface UseRemindersOptions {
  status?: ReminderStatus | 'all';
  type?: ReminderType | 'all';
}

async function fetchAllReminders(clinicId: string): Promise<Reminder[]> {
  console.log('Fetching reminders for clinicId:', clinicId);
  const { data, error } = await supabase
        .from('reminder')
        .select(`
          *,
          employee:employee (
            id,
            name
          )
        `)
        .eq('clinic_id', clinicId)
        .order('due_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Reminder[]) || [];
}


export function useReminders(clinicId: string, options: UseRemindersOptions = {}) {
  const { status = 'active', type = 'all' } = options;

  return useQuery({
    queryKey: ['reminders', clinicId],
    queryFn: () => fetchAllReminders(clinicId),
    enabled: Boolean(clinicId),
    select: (reminders) => reminders.filter((r) => (status === 'all' || r.status === status) && (type === 'all' || r.type === type)),
  });
}

export function useCreateReminder(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReminderInput) => {
      const { data, error } = await supabase
        .from('reminder')
        .insert({
          clinic_id: input.clinic_id,
          employee_id: input.employee_id || null,
          asof_datetime: input.asof_datetime,
          remind_in_days: input.remind_in_days ?? 0,
          status: input.status ?? 'active',
          type: input.type,
          details: input.details as Json,
        } as ReminderInsert)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', clinicId] });
    },
  });
}

export function useUpdateReminder(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateReminderInput) => {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.remind_in_days !== undefined) {
        updates.remind_in_days = input.remind_in_days;
      }
      if (input.status !== undefined) {
        updates.status = input.status;
      }
      if (input.details !== undefined) {
        updates.details = input.details;
      }

      const { data, error } = await supabase
        .from('reminder')
        .update(updates as ReminderUpdate)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', clinicId] });
    },
  });
}