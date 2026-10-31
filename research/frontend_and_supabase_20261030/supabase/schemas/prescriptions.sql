-- 1. Catalog / Formulary templates (~50-100 rows)
create table medication_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  default_dosage text not null,          -- e.g. "500 mg"
  default_frequency text not null,       -- e.g. "TID (three times daily)"
  default_duration_days int not null default 5,
  default_instructions text,             -- e.g. "Take after meals"
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

-- 2. Prescriptions (Encounter header)
create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  doctor_id uuid not null,
  notes text,
  prescribed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- 3. Prescription line items (Snapshotted clinical details)
create table prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medication_id uuid references medication_catalog(id) on delete set null,
  
  -- Snapshotted fields: guarantees audit history remains intact
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  duration_days int not null check (duration_days > 0),
  instructions text,
  
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes for performance
create index idx_prescription_items_prescription_id on prescription_items(prescription_id);
create index idx_prescriptions_patient_id on prescriptions(patient_id);
create index idx_prescriptions_prescribed_at on prescriptions(prescribed_at desc);


create or replace function create_prescription(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_notes text,
  p_items jsonb
) returns uuid language plpgsql as $$
declare
  v_prescription_id uuid;
begin
  insert into prescriptions (patient_id, doctor_id, notes)
  values (p_patient_id, p_doctor_id, p_notes)
  returning id into v_prescription_id;

  insert into prescription_items (
    prescription_id,
    medication_id,
    medication_name,
    dosage,
    frequency,
    duration_days,
    instructions
  )
  select
    v_prescription_id,
    (item->>'medication_id')::uuid,
    item->>'medication_name',
    item->>'dosage',
    item->>'frequency',
    (item->>'duration_days')::int,
    item->>'instructions'
  from jsonb_array_elements(p_items) as item;

  return v_prescription_id;
end;
$$;