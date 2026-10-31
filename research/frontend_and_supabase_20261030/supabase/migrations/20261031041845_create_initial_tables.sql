-- Create "medication_catalog" table
CREATE TABLE "medication_catalog" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "generic_name" text NULL,
  "default_dosage" text NOT NULL,
  "default_frequency" text NOT NULL,
  "default_duration_days" integer NOT NULL DEFAULT 5,
  "default_instructions" text NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY ("id")
);
-- Create "prescriptions" table
CREATE TABLE "prescriptions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "patient_id" uuid NOT NULL,
  "doctor_id" uuid NOT NULL,
  "notes" text NULL,
  "prescribed_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY ("id")
);
-- Create index "idx_prescriptions_patient_id" to table: "prescriptions"
CREATE INDEX "idx_prescriptions_patient_id" ON "prescriptions" ("patient_id");
-- Create index "idx_prescriptions_prescribed_at" to table: "prescriptions"
CREATE INDEX "idx_prescriptions_prescribed_at" ON "prescriptions" ("prescribed_at" DESC);
-- Create "prescription_items" table
CREATE TABLE "prescription_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "prescription_id" uuid NOT NULL,
  "medication_id" uuid NULL,
  "medication_name" text NOT NULL,
  "dosage" text NOT NULL,
  "frequency" text NOT NULL,
  "duration_days" integer NOT NULL,
  "instructions" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY ("id"),
  CONSTRAINT "prescription_items_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medication_catalog" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "prescription_items_duration_days_check" CHECK (duration_days > 0)
);
-- Create index "idx_prescription_items_prescription_id" to table: "prescription_items"
CREATE INDEX "idx_prescription_items_prescription_id" ON "prescription_items" ("prescription_id");
-- Create "create_prescription" function
CREATE FUNCTION "create_prescription" ("p_patient_id" uuid, "p_doctor_id" uuid, "p_notes" text, "p_items" jsonb) RETURNS uuid LANGUAGE plpgsql AS $$
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
