-- 1. Clear all test records across dependent tables
TRUNCATE TABLE 
    action_log,
    visit_note,
    treatment_plan,
    prescription,
    lab_test,
    reminder
CASCADE;

-- 2. Drop old employee foreign key constraints and point to app_user(user_id)

-- visit_note
ALTER TABLE visit_note 
    DROP CONSTRAINT IF EXISTS visit_note_doctor_id_fkey,
    ADD CONSTRAINT visit_note_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES app_user(user_id) ON DELETE SET NULL;

-- treatment_plan
ALTER TABLE treatment_plan 
    DROP CONSTRAINT IF EXISTS treatment_plan_doctor_id_fkey,
    ADD CONSTRAINT treatment_plan_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES app_user(user_id) ON DELETE SET NULL;

-- prescription
ALTER TABLE prescription 
    DROP CONSTRAINT IF EXISTS prescription_doctor_id_fkey,
    ADD CONSTRAINT prescription_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES app_user(user_id) ON DELETE SET NULL;

-- lab_test
ALTER TABLE lab_test 
    DROP CONSTRAINT IF EXISTS lab_test_doctor_id_fkey,
    ADD CONSTRAINT lab_test_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES app_user(user_id) ON DELETE SET NULL;

-- action_log
ALTER TABLE action_log 
    DROP CONSTRAINT IF EXISTS action_log_actor_id_fkey,
    ADD CONSTRAINT action_log_actor_id_fkey 
        FOREIGN KEY (actor_id) REFERENCES app_user(user_id) ON DELETE SET NULL;

-- reminder: Rename column and update constraint
ALTER TABLE reminder 
    RENAME COLUMN employee_id TO user_id;

ALTER TABLE reminder 
    DROP CONSTRAINT IF EXISTS reminder_employee_id_fkey,
    ADD CONSTRAINT reminder_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE SET NULL;