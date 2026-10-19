-- ============================================================================
-- 1. UPDATED APPOINTMENT TABLE (Direct app_user Reference)
-- ============================================================================
DROP TABLE IF EXISTS appointment CASCADE;

CREATE TABLE appointment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES app_user(user_id) ON DELETE SET NULL,
    operatory_number INT NOT NULL DEFAULT 1,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'
    type TEXT NOT NULL DEFAULT 'consultation', -- 'consultation', 'procedure', 'emergency', 'follow_up'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup indexes for calendar scans and RLS filters
CREATE INDEX idx_appointment_clinic_time 
    ON appointment (clinic_id, start_time, end_time);

CREATE INDEX idx_appointment_doctor_id 
    ON appointment (doctor_id);

-- ============================================================================
-- 2. CACHED MEMBERSHIP HELPER (STABLE + SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_is_member(p_user_id UUID, p_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_clinic_association
    WHERE user_id = p_user_id
      AND clinic_id = p_clinic_id
  );
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.user_is_member(UUID, UUID) TO authenticated;

-- ============================================================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE appointment ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT (Read access)
-- Doctors can only read appointments for clinics they belong to where they are the assigned doctor
CREATE POLICY "Doctors can view their assigned appointments in member clinics"
    ON appointment FOR SELECT
    TO authenticated
    USING (
        doctor_id = auth.uid()
        AND public.user_is_member(auth.uid(), clinic_id)
    );

-- Policy 2: INSERT (Create access)
-- Doctors can only insert appointments where they assign themselves as the doctor
CREATE POLICY "Doctors can create appointments for themselves in member clinics"
    ON appointment FOR INSERT
    TO authenticated
    WITH CHECK (
        doctor_id = auth.uid()
        AND public.user_is_member(auth.uid(), clinic_id)
    );

-- Policy 3: UPDATE (Modify access)
-- Existing row must belong to the doctor, and the updated row cannot change doctor_id away from auth.uid()
CREATE POLICY "Doctors can update their assigned appointments in member clinics"
    ON appointment FOR UPDATE
    TO authenticated
    USING (
        doctor_id = auth.uid()
        AND public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        doctor_id = auth.uid()
        AND public.user_is_member(auth.uid(), clinic_id)
    );