import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
// import type { Json } from '../types/database.types';

export interface InvitationPreview {
    clinic_name: string
    invitee_email: string
    inviter_name: string
    is_valid: boolean
    role: string
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
