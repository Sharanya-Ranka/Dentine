import { useParams } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

export function useClinicId(){
    return useParams<{ clinicId: string }>().clinicId || '';
}

export function useDoctorId(){
    return useAuthStore().user?.id || null;
}