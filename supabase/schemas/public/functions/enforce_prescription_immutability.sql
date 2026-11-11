-- 3. Immutability Trigger Function (Matching column names)
CREATE OR REPLACE FUNCTION public.enforce_prescription_immutable_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow one-way transition from 'issued' to 'cancelled'
  IF OLD.status <> 'issued' OR NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Prescriptions can only transition from "issued" to "cancelled". Current status: %, Attempted: %', 
      OLD.status, NEW.status;
  END IF;

  -- Prevent modifying core clinical data
  IF (OLD.id, OLD.clinic_id, OLD.patient_id, OLD.doctor_id, OLD.details, OLD.notes, OLD.created_at)
     IS DISTINCT FROM
     (NEW.id, NEW.clinic_id, NEW.patient_id, NEW.doctor_id, NEW.details, NEW.notes, NEW.created_at) THEN
    RAISE EXCEPTION 'Clinical details and relationships on an issued prescription are immutable.';
  END IF;

  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;