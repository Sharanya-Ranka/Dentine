-- ============================================================================
-- 1. ENUMS & EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clinic membership role domain
DO $$ BEGIN
    CREATE TYPE clinic_role AS ENUM ('owner', 'non-owner');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. USER PROFILE TABLE (Linked 1:1 with auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_user (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive lookup index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_user_email_lower ON app_user (lower(email));

-- ============================================================================
-- 3. USER-CLINIC ASSOCIATION TABLE (Many-to-Many Affiliations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_clinic_association (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    role clinic_role NOT NULL DEFAULT 'non-owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_clinic_membership UNIQUE (user_id, clinic_id)
);

-- Fast lookup indexes for tenancy routing and permission checks
CREATE INDEX IF NOT EXISTS idx_uca_user_id ON user_clinic_association (user_id);
CREATE INDEX IF NOT EXISTS idx_uca_clinic_id ON user_clinic_association (clinic_id);
CREATE INDEX IF NOT EXISTS idx_uca_clinic_role ON user_clinic_association (clinic_id, role);

-- ============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clinic_association ENABLE ROW LEVEL SECURITY;

-- App User policies: Users can read all verified profiles, but only mutate their own
CREATE POLICY "Users can view their own profile and co-members"
    ON app_user FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
    );

CREATE POLICY "Users can insert their own profile"
    ON app_user FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON app_user FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Association policies: Users see their own affiliations; Owners can manage clinic associations
CREATE POLICY "Users can read their own clinic associations"
    ON user_clinic_association FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_clinic_association owner_assoc
            WHERE owner_assoc.clinic_id = user_clinic_association.clinic_id
              AND owner_assoc.user_id = auth.uid()
              AND owner_assoc.role = 'owner'
        )
    );

CREATE POLICY "Owners can add or modify clinic associations"
    ON user_clinic_association FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_clinic_association owner_assoc
            WHERE owner_assoc.clinic_id = user_clinic_association.clinic_id
              AND owner_assoc.user_id = auth.uid()
              AND owner_assoc.role = 'owner'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_clinic_association owner_assoc
            WHERE owner_assoc.clinic_id = user_clinic_association.clinic_id
              AND owner_assoc.user_id = auth.uid()
              AND owner_assoc.role = 'owner'
        )
    );