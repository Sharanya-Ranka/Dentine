-- ============================================================================
-- 1. INDEX FOR FAST TENANT ISOLATION
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_patient_clinic_id 
    ON patient (clinic_id);

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES FOR PATIENT CRUD
-- ============================================================================

-- Option A: Single Unified Policy (Covers SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Clinic members can manage their clinic patients"
    ON patient FOR ALL
    TO authenticated
    USING (
        public.user_is_member(auth.uid(), clinic_id)
    )
    WITH CHECK (
        public.user_is_member(auth.uid(), clinic_id)
    );