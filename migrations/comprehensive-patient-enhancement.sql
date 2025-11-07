-- ==========================================
-- COMPREHENSIVE PATIENT SCHEMA ENHANCEMENT
-- Adds comprehensive patient fields & activity tracking
-- ==========================================

BEGIN;

-- 1. Add new patient fields (comprehensive profile)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS work_phone VARCHAR(50);

-- Enhanced address fields
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS county VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS postcode VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United Kingdom';

-- Timezone auto-detection
ALTER TABLE patients ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS timezone_offset INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS locale VARCHAR(20) DEFAULT 'en-GB';

-- Enhanced clinical information
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gp_phone VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS systemic_conditions JSONB;

-- Lifestyle & activities
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hobbies TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS vdu_hours_per_day NUMERIC(4, 1);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS sport_activities TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS reading_habits TEXT;

-- Contact lens details
ALTER TABLE patients ADD COLUMN IF NOT EXISTS contact_lens_type VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS contact_lens_brand VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS contact_lens_compliance VARCHAR(50);

-- Communication preferences
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_appointment_time VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS reminder_preference VARCHAR(50);

-- Additional consent fields
ALTER TABLE patients ADD COLUMN IF NOT EXISTS third_party_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT FALSE;

-- Examination scheduling
ALTER TABLE patients ADD COLUMN IF NOT EXISTS recall_schedule VARCHAR(50);

-- Insurance information
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS nhs_exemption BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS nhs_exemption_type VARCHAR(100);

-- Patient status & notes
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS vip_patient BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Timestamp tracking
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. Create patient activity log enum type
DO $$ BEGIN
    CREATE TYPE patient_activity_type AS ENUM (
        'profile_created',
        'profile_updated',
        'examination_scheduled',
        'examination_completed',
        'prescription_issued',
        'order_placed',
        'order_updated',
        'order_completed',
        'contact_lens_fitted',
        'recall_sent',
        'appointment_booked',
        'appointment_cancelled',
        'payment_received',
        'refund_issued',
        'complaint_logged',
        'complaint_resolved',
        'consent_updated',
        'document_uploaded',
        'note_added',
        'referral_made',
        'communication_sent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create patient activity log table
CREATE TABLE IF NOT EXISTS patient_activity_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    activity_type patient_activity_type NOT NULL,
    
    -- Related records
    order_id VARCHAR REFERENCES orders(id),
    examination_id VARCHAR REFERENCES eye_examinations(id),
    prescription_id VARCHAR REFERENCES prescriptions(id),
    
    -- Activity details
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    activity_data JSONB,
    
    -- Change tracking
    changes_before JSONB,
    changes_after JSONB,
    changed_fields JSONB,
    
    -- Actor information
    performed_by VARCHAR(255) NOT NULL,
    performed_by_name VARCHAR(255),
    performed_by_role VARCHAR(100),
    
    -- Metadata
    ip_address VARCHAR(50),
    user_agent TEXT,
    source VARCHAR(100) DEFAULT 'web',
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Create indexes for patient activity log
CREATE INDEX IF NOT EXISTS idx_patient_activity_patient ON patient_activity_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_activity_type ON patient_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_patient_activity_date ON patient_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_activity_company ON patient_activity_log(company_id);

-- 5. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patients_updated_at_trigger ON patients;
CREATE TRIGGER patients_updated_at_trigger
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patients_updated_at();

COMMIT;

-- Verification queries
SELECT 
    'patients' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
  AND column_name IN ('timezone', 'phone', 'mobile_phone', 'address_line_1', 'patient_notes', 'updated_at')
ORDER BY column_name;

SELECT 
    'patient_activity_log' as table_name,
    COUNT(*) as row_count
FROM patient_activity_log;
