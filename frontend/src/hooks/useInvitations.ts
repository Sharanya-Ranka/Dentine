import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import type { InvitationItem } from "../types/invitation";

export interface InvitationPreview {
    clinic_name: string
    invitee_email: string
    inviter_name: string
    is_valid: boolean
    role: string
}





/**
 * Fetch invitations created by an admin/clinic owner.
 * Used in admin or clinic management screens.
 */
export function useGetInvitationsBy(clinicId?: string) {
  return useQuery({
    queryKey: ["invitations", "by-clinic", clinicId],
    queryFn: async () => {
      let query = supabase
        .from("invitation")
        .select(`
          *,
          inviter:inviter_id (user_id, name)
        `)
        .order("created_at", { ascending: false });

      if (clinicId) {
        query = query.eq("clinic_id", clinicId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InvitationItem[];
    },
    enabled: Boolean(clinicId),
  });
}

/**
 * Fetch invitations issued to a specific user email.
 * Evaluated through RLS via `email_belongs_to_user(auth.uid(), invitee_email)`.
 */
export function useGetInvitationsFor(email?: string | null) {
  return useQuery({
    queryKey: ["invitations", "for-email", email],
    queryFn: async () => {
      if (!email) return [];

      const { data, error } = await supabase
        .from("invitation")
        .select(`
          *,
          clinic:clinic_id (id, name),
          inviter:inviter_id (user_id, name)
        `)
        .eq("invitee_email", email.toLowerCase())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InvitationItem[];
    },
    enabled: Boolean(email),
  });
}

export function useInvitationPreview(token: string | null) {
  return useQuery({
    queryKey: ["invitation-preview", token],
    queryFn: async () => {
      if (!token) throw new Error("No invitation token provided in the link.");

      const { data, error } = await supabase.rpc("get_invitation_preview", {
        p_token: token,
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Invitation not found or has expired.");
      return data[0] as InvitationPreview;
    },
    enabled: Boolean(token),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (token: string | null) => {
      if (!token) throw new Error("No invitation token provided in the link.");

      const { data, error } = await supabase.rpc("accept_clinic_invitation", {
        p_token: token,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-members"] });
      // Redirect directly into the newly joined clinic
      if (data && typeof data === "object" && "clinic_id" in data) {
        navigate(`/clinics/${data.clinic_id}`);
      }
    },
  });
}


export function useDeclineInvitation(email:string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string | null) => {
      if (!token) throw new Error("No invitation token provided in the link.");

      const { data, error } = await supabase.rpc("decline_clinic_invitation", {
        p_token: token,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics", "for-email", email] });
    },
  });
}