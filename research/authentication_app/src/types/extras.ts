export type ClinicRole = 'owner' | 'non-owner';

export interface UserClinicDetail {
  association_id: string;
  clinic_id: string;
  clinic_name: string;
  role: ClinicRole;
  created_at: string;
}