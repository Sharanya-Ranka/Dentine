-- 1. Catalog / Formulary templates
CREATE TABLE public.medication_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinic(id) ON DELETE CASCADE,
  name text NOT NULL,
  generic_name text,
  default_dosage text NOT NULL,
  default_frequency text NOT NULL,
  default_duration_days int NOT NULL DEFAULT 5,
  default_instructions text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_medication_catalog_clinic ON public.medication_catalog(clinic_id);

ALTER TABLE public.medication_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow clinic owners to create, read, update and delete records in the medical catalog"
  ON public.medication_catalog
  FOR ALL
  TO authenticated
  USING (public.user_is_owner(auth.uid(), clinic_id))
  WITH CHECK (public.user_is_owner(auth.uid(), clinic_id));
  
CREATE POLICY "Allow clinic members to read records in the medical catalog"
  ON public.medication_catalog
  FOR SELECT
  TO authenticated
  USING (public.user_is_member(auth.uid(), clinic_id));


REVOKE ALL ON TABLE public.medication_catalog FROM anon, authenticated;
GRANT SELECT, UPDATE, DELETE, INSERT ON TABLE public.medication_catalog TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.medication_catalog TO postgres, service_role;


-- 2. Prescription Table
CREATE TABLE public.prescription (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  doctor_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'cancelled')),
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  
  CONSTRAINT prescription_pkey PRIMARY KEY (id),
  CONSTRAINT prescription_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinic(id) ON DELETE CASCADE,
  CONSTRAINT prescription_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patient(id) ON DELETE CASCADE,
  -- Ensure this points to public.app_user(id) or public.app_user(user_id) based on your schema
  CONSTRAINT prescription_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_prescription_clinic ON public.prescription(clinic_id);
CREATE INDEX idx_prescription_patient ON public.prescription(patient_id);


CREATE TRIGGER trg_prescription_status_guard
  BEFORE UPDATE ON public.prescription
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_prescription_immutable_update();


-- 4. RLS & Permissions
ALTER TABLE public.prescription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can view patient prescriptions in their own clinic"
  ON public.prescription
  FOR SELECT
  TO authenticated
  USING (public.user_is_member(auth.uid(), clinic_id));

CREATE POLICY "Clinic members can add patient prescriptions in their own clinic"
  ON public.prescription
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id));

CREATE POLICY "Clinic members can cancel patient prescriptions in their own clinic"
  ON public.prescription
  FOR UPDATE
  TO authenticated
  USING (public.user_is_member(auth.uid(), clinic_id) AND status = 'issued')
  WITH CHECK (public.user_is_member(auth.uid(), clinic_id) AND status = 'cancelled');

-- Deny anonymous access
REVOKE ALL ON TABLE public.prescription FROM anon, authenticated;

-- Service role & Postgres privileges
GRANT ALL PRIVILEGES ON TABLE public.prescription TO postgres, service_role;

-- Authenticated privileges: strictly SELECT, INSERT, UPDATE
GRANT SELECT, INSERT, UPDATE ON TABLE public.prescription TO authenticated;

