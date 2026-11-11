// src/data.ts
import type { Doctor, Patient } from './types/prescriptions';

export const DUMMY_DOCTORS: Doctor[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Sarah Connor', specialty: 'General Practice' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Dr. Marcus Vance', specialty: 'Internal Medicine' },
];

export const DUMMY_PATIENTS: Patient[] = [
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Eleanor Shellstrop', dob: '1982-10-14' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Chidi Anagonye', dob: '1980-12-03' },
];