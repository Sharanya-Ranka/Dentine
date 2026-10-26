DO $$
DECLARE
    -- User / Auth
    v_user_me_id                    UUID := '8714cec8-8aac-4d20-8ccc-09402af11507';

    -- Clinics
    v_clinic_1_id                   UUID := 'c1111111-1111-4111-8111-111111111111';
    v_clinic_2_id                   UUID := 'c2222222-2222-4222-8222-222222222222';

    -- User Clinic Associations
    v_user_clinic_assoc_1_id        UUID := 'ca111111-1111-4111-8111-111111111111';
    v_user_clinic_assoc_2_id        UUID := 'ca222222-2222-4222-8222-222222222222';

    -- Patients
    v_patient_1_id                  UUID := 'b1111111-1111-4111-8111-111111111111';
    v_patient_2_id                  UUID := 'b2222222-2222-4222-8222-222222222222';
    v_patient_3_id                  UUID := 'b3333333-3333-4333-8333-333333333333';

    -- Labs
    v_lab_1_id                      UUID := '1ab11111-1111-4111-8111-111111111111';
    v_lab_2_id                      UUID := '1ab22222-2222-4222-8222-222222222222';
    v_lab_3_id                      UUID := '1ab33333-3333-4333-8333-333333333333';

    -- Lab Procedures
    v_lab_procedure_1_id            UUID := '1bc11111-1111-4111-8111-111111111101';
    v_lab_procedure_2_id            UUID := '1bc11111-1111-4111-8111-111111111102';
    v_lab_procedure_3_id            UUID := '1bc11111-1111-4111-8111-111111111103';
    v_lab_procedure_4_id            UUID := '1bc22222-2222-4222-8222-222222222204';
    v_lab_procedure_5_id            UUID := '1bc22222-2222-4222-8222-222222222205';
    v_lab_procedure_6_id            UUID := '1bc22222-2222-4222-8222-222222222206';
    v_lab_procedure_7_id            UUID := '1bc22222-2222-4222-8222-222222222207';
    v_lab_procedure_8_id            UUID := '1bc33333-3333-4333-8333-333333333308';
    v_lab_procedure_9_id            UUID := '1bc33333-3333-4333-8333-333333333309';
    v_lab_procedure_10_id           UUID := '1bc33333-3333-4333-8333-333333333310';

    -- Clinical Procedures
    v_procedure_1_id                UUID := 'd1111111-1111-4111-8111-111111111101';
    v_procedure_2_id                UUID := 'd1111111-1111-4111-8111-111111111102';
    v_procedure_3_id                UUID := 'd1111111-1111-4111-8111-111111111103';
    v_procedure_4_id                UUID := 'd1111111-1111-4111-8111-111111111104';
    v_procedure_5_id                UUID := 'd1111111-1111-4111-8111-111111111105';
    v_procedure_6_id                UUID := 'd1111111-1111-4111-8111-111111111106';
    v_procedure_7_id                UUID := 'd1111111-1111-4111-8111-111111111107';
    v_procedure_8_id                UUID := 'd1111111-1111-4111-8111-111111111108';
    v_procedure_9_id                UUID := 'd1111111-1111-4111-8111-111111111109';
    v_procedure_10_id               UUID := 'd1111111-1111-4111-8111-111111111110';
    v_procedure_11_id               UUID := 'd2222222-2222-4222-8222-222222222211';
    v_procedure_12_id               UUID := 'd2222222-2222-4222-8222-222222222212';
    v_procedure_13_id               UUID := 'd2222222-2222-4222-8222-222222222213';

    -- Visit Notes
    v_visit_note_1_id               UUID := 'e1111111-1111-4111-8111-111111111111';

    -- Lab Tests
    v_lab_test_1_id                 UUID := 'f1111111-1111-4111-8111-111111111101';
    v_lab_test_2_id                 UUID := 'f1111111-1111-4111-8111-111111111102';

    -- Supabase Storage Objects
    v_storage_object_1_id           UUID := '50000001-0000-4000-8000-000000000001';
    v_storage_object_2_id           UUID := '50000002-0000-4000-8000-000000000002';

    -- Documents
    v_document_1_id                 UUID := 'd0c00001-0000-4000-8000-000000000001';
    v_document_2_id                 UUID := 'd0c00002-0000-4000-8000-000000000002';

    -- Appointments
    v_appointment_1_id              UUID := 'a1111111-1111-4111-8111-111111111101';
    v_appointment_2_id              UUID := 'a1111111-1111-4111-8111-111111111102';
    v_appointment_3_id              UUID := 'a1111111-1111-4111-8111-111111111103';

    -- Treatment Plans
    v_treatment_plan_1_id           UUID := '71111111-1111-4111-8111-111111111101';
    v_treatment_plan_2_id           UUID := '71111111-1111-4111-8111-111111111102';
    v_treatment_plan_3_id           UUID := '71111111-1111-4111-8111-111111111103';

    -- Treatment Plan Steps (JSON step_id references)
    v_treatment_step_1_id           UUID := '75111111-1111-4111-8111-111111111101';
    v_treatment_step_2_id           UUID := '75111111-1111-4111-8111-111111111102';
    v_treatment_step_3_id           UUID := '75111111-1111-4111-8111-111111111103';
    v_treatment_step_4_id           UUID := '75222222-2222-4222-8222-222222222204';
    v_treatment_step_5_id           UUID := '75222222-2222-4222-8222-222222222205';
    v_treatment_step_6_id           UUID := '75222222-2222-4222-8222-222222222206';
    v_treatment_step_7_id           UUID := '75333333-3333-4333-8333-333333333307';
    v_treatment_step_8_id           UUID := '75333333-3333-4333-8333-333333333308';

    -- Invoices
    v_invoice_1_id                  UUID := '10111111-1111-4111-8111-111111111101';

    -- Payments
    v_payment_1_id                  UUID := '91111111-1111-4111-8111-111111111101';

    -- Prescriptions
    v_prescription_1_id             UUID := '81111111-1111-4111-8111-111111111101';

    -- Prescription Items (JSON id references)
    v_rx_item_1_id                  UUID := '85111111-1111-4111-8111-111111111101';
    v_rx_item_2_id                  UUID := '85111111-1111-4111-8111-111111111102';
    v_rx_item_3_id                  UUID := '85111111-1111-4111-8111-111111111103';
BEGIN

    -- ============================================================================
    -- STEP 1: PURGE SUPABASE FILE STORAGE
    -- ============================================================================
    -- Deletes all stored files and records in Supabase Storage buckets
    -- DELETE FROM storage.objects;

    -- If you also want to remove custom created buckets (uncomment if desired):
    -- DELETE FROM storage.buckets WHERE id NOT IN ('default');

    -- ============================================================================
    -- STEP 2: PURGE ALL APPLICATION TABLES
    -- ============================================================================
    -- Using TRUNCATE with CASCADE resets foreign key references and identity sequences
    TRUNCATE TABLE 
        public.employee, -- unused
        
        public.clinic,
        public.invitation,
        public.user_clinic_association,
        
        public.patient,
        public.lab,
        public.lab_procedure,
        public.procedure,

        public.visit_note,
        public.lab_test,
        public.document,
        public.appointment,
        public.reminder,
        public.treatment_plan,
        public.follow_up,
        public.invoice,
        public.payment,
        public.prescription,

        public.action_log
    RESTART IDENTITY CASCADE;



    -- ============================================================================
    -- 1. SEED CLINICS (2 Clinics)
    -- ============================================================================
    INSERT INTO public.clinic (id, name, created_at, updated_at)
    VALUES
        (v_clinic_1_id, 'Dentine Dental Care - Main Clinic', now(), now()),
        (v_clinic_2_id, 'Dentine Specialty & Orthodontics', now(), now());

    -- ============================================================================
    -- 2. SEED USER CLINIC ASSOCIATIONS (Owner role for both clinics)
    -- Note: Execute after your auth user record exists in public.app_user
    -- ============================================================================
    INSERT INTO public.user_clinic_association (id, user_id, clinic_id, role, created_at, updated_at)
    VALUES
        (v_user_clinic_assoc_1_id, v_user_me_id, v_clinic_1_id, 'owner', now(), now()),
        (v_user_clinic_assoc_2_id, v_user_me_id, v_clinic_2_id, 'owner', now(), now());


    -- ============================================================================
    -- 1. SEED PATIENTS
    --    Clinic 1: 2 patients (full details, Indian contact info, medical alerts)
    --    Clinic 2: 1 patient
    -- ============================================================================
    INSERT INTO public.patient (id, clinic_id, name, details, created_at, updated_at)
    VALUES
        -- Patient 1 (Clinic 1)
        (
            v_patient_1_id,
            v_clinic_1_id,
            'Aarav Sharma',
            '{
                "address": "Flat 402, Shanti Heights, Kalyani Nagar, Pune, Maharashtra 411006",
                "gender": "male",
                "contact": {
                    "phone": "+91 98230 12345",
                    "email": "aarav.sharma@example.com"
                },
                "insurance": {
                    "provider": "Star Health Allied Insurance",
                    "policy_number": "SH-DENT-884920",
                    "coverage_amount": 50000
                },
                "medical_alerts": ["penicillin_allergy", "hypertension"]
            }'::jsonb,
            now(),
            now()
        ),
        -- Patient 2 (Clinic 1)
        (
            v_patient_2_id,
            v_clinic_1_id,
            'Pooja Kulkarni',
            '{
                "address": "B-12, Green Acres Society, Baner Road, Pune, Maharashtra 411045",
                "gender": "female",
                "contact": {
                    "phone": "+91 97654 67890",
                    "email": "pooja.kulkarni@example.com"
                },
                "insurance": {
                    "provider": "HDFC ERGO General Insurance",
                    "policy_number": "HE-DENT-204194",
                    "coverage_amount": 35000
                },
                "medical_alerts": ["diabetes_type_2"]
            }'::jsonb,
            now(),
            now()
        ),
        -- Patient 3 (Clinic 2)
        (
            v_patient_3_id,
            v_clinic_2_id,
            'Rohan Deshmukh',
            '{
                "address": "Row House 7, Palm Groves, Viman Nagar, Pune, Maharashtra 411014",
                "gender": "male",
                "contact": {
                    "phone": "+91 91580 98765",
                    "email": "rohan.deshmukh@example.com"
                },
                "insurance": {
                    "provider": "Care Health Insurance",
                    "policy_number": "CHI-IND-99102",
                    "coverage_amount": 25000
                },
                "medical_alerts": ["asthma"]
            }'::jsonb,
            now(),
            now()
        );

    -- ============================================================================
    -- 2. SEED LABS
    --    Clinic 1: 3 labs (1 blood test lab, 1 fabrication lab, 1 biopsy lab)
    --    Clinic 2: None
    -- ============================================================================
    INSERT INTO public.lab (id, clinic_id, name, contact_person, phone, email, address, created_at, updated_at)
    VALUES
        -- Lab 1: Blood Diagnostics
        (
            v_lab_1_id,
            v_clinic_1_id,
            'Metropolis Clinical Pathology & Blood Lab',
            'Dr. Rajesh Iyer',
            '+91 20 2612 3456',
            'pune.diagnostics@metropolis.in',
            'Plot 45, Connaught Road, Camp, Pune, Maharashtra 411001',
            now(),
            now()
        ),
        -- Lab 2: Dental Fabrication & CAD/CAM Lab
        (
            v_lab_2_id,
            v_clinic_1_id,
            'Precision Dental Milling & Prosthetics Lab',
            'Vikas Patil',
            '+91 98901 23456',
            'orders@precisiondentallab.in',
            'Unit 3B, Electronic Sadan II, MIDC Bhosari, Pune, Maharashtra 411026',
            now(),
            now()
        ),
        -- Lab 3: Oral Biopsy & Histopathology Lab
        (
            v_lab_3_id,
            v_clinic_1_id,
            'Apex Oral Histopathology & Cytology Center',
            'Dr. Sunita Rao',
            '+91 20 2567 8901',
            'biopsy.reports@apexhisto.com',
            'Commerce Centre, University Road, Shivajinagar, Pune, Maharashtra 411005',
            now(),
            now()
        );

    -- ============================================================================
    -- 3. SEED LAB PROCEDURES
    --    Clinic 1: At least 2 per lab, with some overlapping diagnostic/prep work
    --    Clinic 2: None
    -- ============================================================================
    INSERT INTO public.lab_procedure (id, clinic_id, lab_id, name, cost, estimated_turnaround_days, created_at, updated_at)
    VALUES
        -- Blood Test Lab (<lab_uuid_1>)
        (
            v_lab_procedure_1_id,
            v_clinic_1_id,
            v_lab_1_id,
            'Complete Blood Count (CBC) & ESR',
            750.00,
            1,
            now(),
            now()
        ),
        (
            v_lab_procedure_2_id,
            v_clinic_1_id,
            v_lab_1_id,
            'Bleeding Time & Clotting Time (BT/CT) Panel',
            450.00,
            1,
            now(),
            now()
        ),
        (
            v_lab_procedure_3_id,
            v_clinic_1_id,
            v_lab_1_id,
            'HbA1c Glycated Hemoglobin Test',
            600.00,
            1,
            now(),
            now()
        ),

        -- Fabrication Lab (<lab_uuid_2>)
        (
            v_lab_procedure_4_id,
            v_clinic_1_id,
            v_lab_2_id,
            'Zirconia Multi-Layered CAD/CAM Crown',
            2800.00,
            5,
            now(),
            now()
        ),
        (
            v_lab_procedure_5_id,
            v_clinic_1_id,
            v_lab_2_id,
            'Porcelain Fused to Metal (PFM) Crown',
            1400.00,
            4,
            now(),
            now()
        ),
        (
            v_lab_procedure_6_id,
            v_clinic_1_id,
            v_lab_2_id,
            'Cast Partial Denture (Cobalt-Chromium Framework)',
            4500.00,
            7,
            now(),
            now()
        ),
        (
            v_lab_procedure_7_id,
            v_clinic_1_id,
            v_lab_2_id,
            'Clear Orthodontic Retainer (Single Arch)',
            900.00,
            3,
            now(),
            now()
        ),

        -- Biopsy Lab (<lab_uuid_3>)
        (
            v_lab_procedure_8_id,
            v_clinic_1_id,
            v_lab_3_id,
            'Incisional Soft Tissue Biopsy & Histopathology Report',
            1800.00,
            6,
            now(),
            now()
        ),
        (
            v_lab_procedure_9_id,
            v_clinic_1_id,
            v_lab_3_id,
            'Exfoliative Oral Cytology Smear Analysis',
            950.00,
            3,
            now(),
            now()
        ),
        -- Overlapping service offered by Biopsy Center
        (
            v_lab_procedure_10_id,
            v_clinic_1_id,
            v_lab_3_id,
            'Complete Blood Count (CBC) & ESR',
            300.00,
            2,
            now(),
            now()
        );

    -- ============================================================================
    -- 4. SEED CLINICAL PROCEDURES
    --    Clinic 1: 10 comprehensive procedures (full mouth + per-tooth)
    --    Clinic 2: 3 basic procedures
    -- ============================================================================
    INSERT INTO public.procedure (id, clinic_id, name, type, cost, created_at, updated_at)
    VALUES
        -- Clinic 1: Full-mouth & Per-tooth Comprehensive Procedures
        (
            v_procedure_1_id,
            v_clinic_1_id,
            'Full Mouth Ultrasonic Scaling & Polishing',
            'Periodontics',
            1500.00,
            now(),
            now()
        ),
        (
            v_procedure_2_id,
            v_clinic_1_id,
            'Full Mouth Deep Subgingival Curettage & Root Planing',
            'Periodontics',
            6000.00,
            now(),
            now()
        ),
        (
            v_procedure_3_id,
            v_clinic_1_id,
            'Anterior Composite Restoration (Per Tooth)',
            'Conservative Dentistry',
            1200.00,
            now(),
            now()
        ),
        (
            v_procedure_4_id,
            v_clinic_1_id,
            'Posterior Composite Resin Filling (Per Tooth)',
            'Conservative Dentistry',
            1500.00,
            now(),
            now()
        ),
        (
            v_procedure_5_id,
            v_clinic_1_id,
            'Molar Root Canal Treatment - RCT (Per Tooth)',
            'Endodontics',
            4500.00,
            now(),
            now()
        ),
        (
            v_procedure_6_id,
            v_clinic_1_id,
            'Anterior Single-Visit Root Canal Treatment (Per Tooth)',
            'Endodontics',
            3500.00,
            now(),
            now()
        ),
        (
            v_procedure_7_id,
            v_clinic_1_id,
            'Impacted Third Molar Surgical Extraction (Per Tooth)',
            'Oral Surgery',
            5000.00,
            now(),
            now()
        ),
        (
            v_procedure_8_id,
            v_clinic_1_id,
            'Simple Tooth Extraction (Per Tooth)',
            'Oral Surgery',
            1000.00,
            now(),
            now()
        ),
        (
            v_procedure_9_id,
            v_clinic_1_id,
            'Single Tooth Dental Implant Placement (Titanium Fixture)',
            'Implantology',
            25000.00,
            now(),
            now()
        ),
        (
            v_procedure_10_id,
            v_clinic_1_id,
            'In-Office Vital Tooth Bleaching (Full Mouth)',
            'Cosmetic Dentistry',
            8500.00,
            now(),
            now()
        ),

        -- Clinic 2: Smaller Clinic Routine Procedures
        (
            v_procedure_11_id,
            v_clinic_2_id,
            'Routine Dental Consultation & Diagnostic Examination',
            'Diagnostic',
            500.00,
            now(),
            now()
        ),
        (
            v_procedure_12_id,
            v_clinic_2_id,
            'Basic Dental Scaling & Prophylaxis',
            'Periodontics',
            1200.00,
            now(),
            now()
        ),
        (
            v_procedure_13_id,
            v_clinic_2_id,
            'Class I/II Glass Ionomer / Composite Restoration (Per Tooth)',
            'Conservative Dentistry',
            1000.00,
            now(),
            now()
        );



    -- ============================================================================
    -- 1. SEED VISIT NOTE
    --    1 SOAP visit note for Patient 1 at Clinic 1
    --    doctor_id is set to NULL (since employee table is deprecated/empty)
    -- ============================================================================
    INSERT INTO public.visit_note (id, clinic_id, patient_id, doctor_id, details, created_at, updated_at)
    VALUES
        (
            v_visit_note_1_id,
            v_clinic_1_id,
            v_patient_1_id,
            v_user_me_id,
            '{
                "chief_complaint": "Severe lingering throbbing pain in lower right posterior quadrant when drinking cold liquids.",
                "subjective": "Patient reports pain began 4 days ago. Disrupts sleep at night. Pain score 8/10. Pain radiates toward right ear. Taking OTC paracetamol with minimal relief.",
                "objective": "Tooth #46 shows deep disto-occlusal cavitated carious lesion. Positive lingering response to cold stimulus (>25s). Moderate tenderness upon vertical percussion. Periodontal probing depths within normal limits (2-3mm). No swelling or sinus tract noted.",
                "assessment": "Symptomatic Irreversible Pulpitis with Symptomatic Apical Periodontitis - Tooth #46.",
                "plan": "Advised single/multi-visit Root Canal Treatment (RCT) followed by full coverage crown. Ordered Pre-Op IOPA X-ray, CBC, BT/CT panels due to hypertension history. Initiated emergency pulpotomy under 2% Lignocaine local anesthesia.",
                "vitals": {
                    "blood_pressure": "130/84",
                    "pulse_bpm": 76,
                    "temperature_c": 36.8
                }
            }'::jsonb,
            now(),
            now()
        );

    -- ============================================================================
    -- 2. SEED LAB TESTS
    --    2 lab tests for Patient 1 at Clinic 1 (ordered from 2 different labs)
    -- ============================================================================
    INSERT INTO public.lab_test (id, clinic_id, patient_id, doctor_id, lab_procedure_id, status, created_at, updated_at)
    VALUES
        (
            v_lab_test_1_id,
            v_clinic_1_id,
            v_patient_1_id,
            v_user_me_id,
            v_lab_procedure_1_id,
            'completed',
            now() - INTERVAL '1 day',
            now()
        ),
        (
            v_lab_test_2_id,
            v_clinic_1_id,
            v_patient_1_id,
            v_user_me_id,
            v_lab_procedure_5_id,
            'in_progress',
            now(),
            now()
        );


    -- ============================================================================
    -- 4. SEED APPOINTMENTS
    --    Clinic 1 only, doctor_id references app_user(user_id) (<user_uuid_me>)
    --    All future-facing, spread across different days of the week
    --    Hours: Strictly between 8:00 AM and 10:00 PM IST (UTC+05:30)
    -- ============================================================================
    INSERT INTO public.appointment (
        id,
        clinic_id,
        patient_id,
        doctor_id,
        operatory_number,
        start_time,
        end_time,
        status,
        type,
        notes,
        created_at,
        updated_at
    )
    VALUES
        -- Appointment 1: Patient 1 (Upcoming Wednesday) - 1.5 Hours (10:00 AM - 11:30 AM IST)
        (
            v_appointment_1_id,
            v_clinic_1_id,
            v_patient_1_id,
            v_user_me_id,
            1,
            (CURRENT_DATE + INTERVAL '2 days' + TIME '10:00:00') AT TIME ZONE 'Asia/Kolkata',
            (CURRENT_DATE + INTERVAL '2 days' + TIME '11:30:00') AT TIME ZONE 'Asia/Kolkata',
            'scheduled',
            'procedure',
            'RCT Biomechanical preparation & canal shaping for tooth #46 under local anesthesia.',
            now(),
            now()
        ),

        -- Appointment 2: Patient 1 (Upcoming Friday) - 1.0 Hour (04:30 PM - 05:30 PM IST)
        (
            v_appointment_2_id,
            v_clinic_1_id,
            v_patient_1_id,
            v_user_me_id,
            1,
            (CURRENT_DATE + INTERVAL '4 days' + TIME '16:30:00') AT TIME ZONE 'Asia/Kolkata',
            (CURRENT_DATE + INTERVAL '4 days' + TIME '17:30:00') AT TIME ZONE 'Asia/Kolkata',
            'scheduled',
            'follow_up',
            'Obturation of tooth #46, core buildup, and tooth prep for CAD/CAM crown impression.',
            now(),
            now()
        ),

        -- Appointment 3: Patient 2 (Upcoming Saturday) - 1.0 Hour (11:00 AM - 12:00 PM IST)
        (
            v_appointment_3_id,
            v_clinic_1_id,
            v_patient_2_id,
            v_user_me_id,
            2,
            (CURRENT_DATE + INTERVAL '5 days' + TIME '11:00:00') AT TIME ZONE 'Asia/Kolkata',
            (CURRENT_DATE + INTERVAL '5 days' + TIME '12:00:00') AT TIME ZONE 'Asia/Kolkata',
            'confirmed',
            'consultation',
            'Initial examination, full mouth scaling & polishing, periodontal chart review.',
            now(),
            now()
        );



    -- ============================================================================
    -- 1. SEED TREATMENT PLANS
    --    Patient 1, Clinic 1:
    --      Plan 1: Completed option (Tooth #46 RCT + Build-up + Zirconia Crown)
    --      Plan 2: Alternative draft option (Tooth #46 RCT + Build-up + PFM Crown)
    --      Plan 3: Partially completed plan (Active - Anterior Esthetics & Scaling)
    --    doctor_id is set to NULL (employee table is deprecated)
    -- ============================================================================
    INSERT INTO public.treatment_plan (
        id,
        clinic_id,
        patient_id,
        doctor_id,
        status,
        details,
        created_at,
        updated_at
    )
    VALUES
        -- Plan 1: Completed Treatment Plan (Selected: Zirconia Crown)
        (
            v_treatment_plan_1_id,
            v_clinic_1_id,
            v_patient_1_id,
            NULL,
            'completed',
            format('{
                "title": "Tooth #46 Endodontic Therapy & Zirconia Restoration",
                "notes": "Patient selected premium CAD/CAM monolithic zirconia crown for enhanced posterior durability.",
                "steps": [
                    {
                        "step_id": "%s",
                        "procedure_name": "Molar Root Canal Treatment - RCT (Per Tooth)",
                        "teeth_numbers": [46],
                        "cost": 4500,
                        "status": "completed",
                        "notes": "Biomechanical preparation and warm vertical obturation completed. Working length verified via apex locator.",
                        "completed_at": "2026-10-18T11:45:00.000Z"
                    },
                    {
                        "step_id": "%s",
                        "procedure_name": "Posterior Composite Resin Filling (Per Tooth)",
                        "teeth_numbers": [46],
                        "cost": 1500,
                        "status": "completed",
                        "notes": "Post-endodontic dual-cure core build-up completed.",
                        "completed_at": "2026-10-20T10:30:00.000Z"
                    },
                    {
                        "step_id": "%s",
                        "procedure_name": "Zirconia Multi-Layered CAD/CAM Crown",
                        "teeth_numbers": [46],
                        "cost": 8500,
                        "status": "completed",
                        "notes": "Crown cemented with resin-modified glass ionomer cement. Occlusion and margins checked.",
                        "completed_at": "2026-10-25T16:00:00.000Z"
                    }
                ]
            }', v_treatment_step_1_id, v_treatment_step_2_id, v_treatment_step_3_id)::jsonb,
            now() - INTERVAL '10 days',
            now() - INTERVAL '1 day'
        ),

        -- Plan 2: Unselected / Alternative Draft Plan (Same step 1 & 2, step 3 is PFM Crown)
        (
            v_treatment_plan_2_id,
            v_clinic_1_id,
            v_patient_1_id,
            NULL,
            'draft',
            format('{
                "title": "Tooth #46 Endodontic Therapy & PFM Restoration (Alternative Option)",
                "notes": "Economy option proposed with standard Porcelain-Fused-to-Metal crown.",
                "steps": [
                    {
                        "step_id": "%s",
                        "procedure_name": "Molar Root Canal Treatment - RCT (Per Tooth)",
                        "teeth_numbers": [46],
                        "cost": 4500,
                        "status": "planned",
                        "notes": "Step redundant with primary plan.",
                        "completed_at": null
                    },
                    {
                        "step_id": "%s",
                        "procedure_name": "Posterior Composite Resin Filling (Per Tooth)",
                        "teeth_numbers": [46],
                        "cost": 1500,
                        "status": "planned",
                        "notes": "Step redundant with primary plan.",
                        "completed_at": null
                    },
                    {
                        "step_id": "%s",
                        "procedure_name": "Porcelain Fused to Metal (PFM) Crown",
                        "teeth_numbers": [46],
                        "cost": 4000,
                        "status": "planned",
                        "notes": "Alternative porcelain-fused-to-metal crown.",
                        "completed_at": null
                    }
                ]
            }', v_treatment_step_4_id, v_treatment_step_5_id, v_treatment_step_6_id)::jsonb,
            now() - INTERVAL '10 days',
            now() - INTERVAL '10 days'
        ),

        -- Plan 3: Partially Completed Plan (Active: Scaling done, Anterior Restoration pending)
        (
            v_treatment_plan_3_id,
            v_clinic_1_id,
            v_patient_1_id,
            NULL,
            'active',
            format('{
                "title": "Periodontal Maintenance & Anterior Aesthetic Restoration",
                "notes": "Phase 2 aesthetic treatment following acute symptom resolution.",
                "steps": [
                    {
                        "step_id": "%s",
                        "procedure_name": "Full Mouth Ultrasonic Scaling & Polishing",
                        "teeth_numbers": [],
                        "cost": 1500,
                        "status": "completed",
                        "notes": "Supra and subgingival calculus thoroughly debrided. Polishing completed with fine paste.",
                        "completed_at": "2026-10-24T12:00:00.000Z"
                    },
                    {
                        "step_id": "%s",
                        "procedure_name": "Anterior Composite Restoration (Per Tooth)",
                        "teeth_numbers": [11, 21],
                        "cost": 2400,
                        "status": "in_progress",
                        "notes": "Shade selection matched to A2. Cavity prep scheduled for upcoming visit.",
                        "completed_at": null
                    }
                ]
            }', v_treatment_step_7_id, v_treatment_step_8_id)::jsonb,
            now() - INTERVAL '4 days',
            now()
        );

    -- ============================================================================
    -- 2. SEED INVOICE
    --    Invoice for the completed treatment plan (<treatment_plan_uuid_1>)
    --    Total: 4500 (RCT) + 1500 (Core Build-up) + 8500 (Crown) = 14500.00
    --    Discount applied: 500.00 -> Net Payable: 14000.00
    --    Status: partially_paid
    -- ============================================================================
    INSERT INTO public.invoice (
        id,
        clinic_id,
        patient_id,
        status,
        total_amount,
        details,
        created_at,
        updated_at
    )
    VALUES
        (
            v_invoice_1_id,
            v_clinic_1_id,
            v_patient_1_id,
            'partially_paid',
            14000.00,
            format('{
                "items": [
                    {
                        "step_id": "%s",
                        "description": "Molar Root Canal Treatment - Tooth #46",
                        "amount": 4500,
                        "discount": 0
                    },
                    {
                        "step_id": "%s",
                        "description": "Post-Endo Composite Core Build-up - Tooth #46",
                        "amount": 1500,
                        "discount": 0
                    },
                    {
                        "step_id": "%s",
                        "description": "Zirconia Multi-Layered CAD/CAM Crown - Tooth #46",
                        "amount": 8500,
                        "discount": 500
                    }
                ],
                "notes": "Comprehensive invoice for Tooth #46 completed endodontic and prosthetic restoration. Rs. 500 courtesy discount applied."
            }', v_treatment_step_1_id, v_treatment_step_2_id, v_treatment_step_3_id)::jsonb,
            now() - INTERVAL '1 day',
            now()
        );

    -- ============================================================================
    -- 3. SEED PAYMENT
    --    Partial payment of Rs. 8,000.00 settled through UPI against <invoice_uuid_1>
    --    Remaining balance: Rs. 6,000.00
    -- ============================================================================
    INSERT INTO public.payment (
        id,
        clinic_id,
        patient_id,
        invoice_id,
        amount,
        payment_method,
        transaction_ref,
        created_at,
        updated_at
    )
    VALUES
        (
            v_payment_1_id,
            v_clinic_1_id,
            v_patient_1_id,
            v_invoice_1_id,
            8000.00,
            'upi',
            'UPI/629810459201/AXIS/aarav@oksbi',
            now() - INTERVAL '1 day',
            now() - INTERVAL '1 day'
        );

    -- ============================================================================
    -- 4. SEED PRESCRIPTION
    --    Prescription for Patient 1, Clinic 1 (Tooth #46 post-procedure care)
    --    Note: Patient has a recorded penicillin allergy, so Clindamycin is used
    --    instead of Amoxicillin, paired with an NSAID and PPI.
    --    doctor_id is set to NULL (employee table is deprecated)
    -- ============================================================================
    INSERT INTO public.prescription (
        id,
        clinic_id,
        patient_id,
        doctor_id,
        details,
        created_at,
        updated_at
    )
    VALUES
        (
            v_prescription_1_id,
            v_clinic_1_id,
            v_patient_1_id,
            NULL,
            format('{
                "prescriptions": [
                    {
                        "id": "%s",
                        "name": "Clindamycin Capsules",
                        "dosage": "300mg",
                        "frequency": "1-1-1-1 (QID)",
                        "duration_days": 5,
                        "instructions": "Take with a full glass of water. Complete full 5-day course. (Prescribed due to confirmed Penicillin allergy)"
                    },
                    {
                        "id": "%s",
                        "name": "Ketorol DT (Ketorolac Tromethamine)",
                        "dosage": "10mg",
                        "frequency": "1-0-1 (SOS / Twice daily)",
                        "duration_days": 3,
                        "instructions": "Disperse in half a glass of water after food. Take only if acute dental pain persists."
                    },
                    {
                        "id": "%s",
                        "name": "Pantoprazole Gastro-Resistant Tablets (Pan 40)",
                        "dosage": "40mg",
                        "frequency": "1-0-0 (Once daily)",
                        "duration_days": 5,
                        "instructions": "Take in the morning on an empty stomach, 30 minutes before breakfast."
                    }
                ],
                "notes": "Maintain good oral hygiene. Avoid biting hard foods on the lower right side until post-treatment sensitivity settles. Contact clinic if rash or stomach discomfort occurs."
            }', v_rx_item_1_id, v_rx_item_2_id, v_rx_item_3_id)::jsonb,
            now() - INTERVAL '2 days',
            now() - INTERVAL '2 days'
        );
END $$;