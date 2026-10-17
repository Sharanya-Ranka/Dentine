-- 1. Seed Clinics
INSERT INTO clinic (id, name)
VALUES 
    ('11111111-1111-1111-1111-111111111112', 'Smile Care Orthodontics & Pediatric Clinic'),
    ('11111111-1111-1111-1111-111111111113', 'Heritage Drive Dental Poly-Clinic')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Application Users (Corresponds to accounts in auth.users)
INSERT INTO app_user (user_id, name, email)
VALUES 
    ('8714cec8-8aac-4d20-8ccc-09402af11507', 'Sharanya Ranka', 'sharanya.ranka@gmail.com'),
    ('65049cac-0d0a-4ce2-ab4f-cf47b8054e02', 'SRR', 'sharanya.ranka.research@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Seed Affiliations & Roles
-- Dr. Aarav Mehta: Owner of Clinic 1, Non-Owner Visiting Specialist at Clinic 2
-- Dr. Priya Sharma: Owner of Clinic 2 and Clinic 3
-- Dr. Rohan Verma: Non-Owner at Clinic 1 and Clinic 3
INSERT INTO user_clinic_association (user_id, clinic_id, role)
VALUES 
    ('8714cec8-8aac-4d20-8ccc-09402af11507', '11111111-1111-1111-1111-111111111111', 'owner'),
    ('8714cec8-8aac-4d20-8ccc-09402af11507', '11111111-1111-1111-1111-111111111112', 'non-owner'),
    ('65049cac-0d0a-4ce2-ab4f-cf47b8054e02', '11111111-1111-1111-1111-111111111112', 'owner'),
    ('65049cac-0d0a-4ce2-ab4f-cf47b8054e02', '11111111-1111-1111-1111-111111111113', 'owner'),
ON CONFLICT (user_id, clinic_id) DO UPDATE 
SET role = EXCLUDED.role;