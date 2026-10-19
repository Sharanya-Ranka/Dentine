import { useAuthStore } from "../stores/useAuthStore";

export function useClinicId(){
    return "11111111-1111-1111-1111-111111111111";
}

export function useDoctorId(){
    return useAuthStore().user?.id || null;
}