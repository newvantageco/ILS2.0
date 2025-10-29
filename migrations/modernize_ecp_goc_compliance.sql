-- Migration: Modernize ECP System with British GOC Compliance
-- Date: 2025-10-29
-- Description: Adds comprehensive British GOC requirements, test room tracking, 
--              enhanced prescription fields, visual acuity, and clinical notes

-- ============== PRESCRIPTIONS TABLE ENHANCEMENTS ==============

-- Add Test Room and GOC Compliance Fields
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS test_room_name VARCHAR(100),               -- Test room where examination took place
ADD COLUMN IF NOT EXISTS prescriber_name VARCHAR(255),              -- Full name of prescriber
ADD COLUMN IF NOT EXISTS prescriber_qualifications VARCHAR(255),    -- Professional qualifications (e.g., MCOptom, FBDO)
ADD COLUMN IF NOT EXISTS prescriber_goc_type VARCHAR(50),           -- 'optometrist', 'dispensing_optician', 'ophthalmologist'

-- Visual Acuity Measurements (British Standards)
ADD COLUMN IF NOT EXISTS od_visual_acuity_unaided VARCHAR(20),     -- Right eye VA without correction (e.g., 6/12)
ADD COLUMN IF NOT EXISTS od_visual_acuity_aided VARCHAR(20),       -- Right eye VA with correction
ADD COLUMN IF NOT EXISTS od_visual_acuity_pinhole VARCHAR(20),     -- Right eye VA with pinhole
ADD COLUMN IF NOT EXISTS os_visual_acuity_unaided VARCHAR(20),     -- Left eye VA without correction
ADD COLUMN IF NOT EXISTS os_visual_acuity_aided VARCHAR(20),       -- Left eye VA with correction
ADD COLUMN IF NOT EXISTS os_visual_acuity_pinhole VARCHAR(20),     -- Left eye VA with pinhole
ADD COLUMN IF NOT EXISTS binocular_visual_acuity VARCHAR(20),      -- Binocular VA

-- Near Vision (British Standards)
ADD COLUMN IF NOT EXISTS od_near_vision VARCHAR(20),               -- Right eye near vision (e.g., N5)
ADD COLUMN IF NOT EXISTS os_near_vision VARCHAR(20),               -- Left eye near vision
ADD COLUMN IF NOT EXISTS binocular_near_vision VARCHAR(20),        -- Binocular near vision

-- Intermediate Vision (for varifocals/progressives)
ADD COLUMN IF NOT EXISTS od_intermediate_add DECIMAL(4, 2),        -- Right eye intermediate addition
ADD COLUMN IF NOT EXISTS os_intermediate_add DECIMAL(4, 2),        -- Left eye intermediate addition

-- Detailed Clinical Measurements
ADD COLUMN IF NOT EXISTS od_k_reading_1 DECIMAL(5, 2),             -- Right eye keratometry reading 1
ADD COLUMN IF NOT EXISTS od_k_reading_2 DECIMAL(5, 2),             -- Right eye keratometry reading 2
ADD COLUMN IF NOT EXISTS od_k_axis INTEGER,                        -- Right eye keratometry axis
ADD COLUMN IF NOT EXISTS os_k_reading_1 DECIMAL(5, 2),             -- Left eye keratometry reading 1
ADD COLUMN IF NOT EXISTS os_k_reading_2 DECIMAL(5, 2),             -- Left eye keratometry reading 2
ADD COLUMN IF NOT EXISTS os_k_axis INTEGER,                        -- Left eye keratometry axis

-- Ocular Health and Clinical Notes
ADD COLUMN IF NOT EXISTS intraocular_pressure_od VARCHAR(20),      -- Right eye IOP (mmHg)
ADD COLUMN IF NOT EXISTS intraocular_pressure_os VARCHAR(20),      -- Left eye IOP (mmHg)
ADD COLUMN IF NOT EXISTS ocular_health_notes TEXT,                 -- Ocular health observations
ADD COLUMN IF NOT EXISTS clinical_recommendations TEXT,            -- Clinical recommendations
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE, -- Follow-up needed
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP,                 -- Recommended follow-up date
ADD COLUMN IF NOT EXISTS follow_up_reason TEXT,                    -- Reason for follow-up

-- Dispensing and Fitting Recommendations
ADD COLUMN IF NOT EXISTS recommended_lens_type VARCHAR(100),       -- Recommended lens type
ADD COLUMN IF NOT EXISTS recommended_lens_material VARCHAR(100),   -- Recommended material
ADD COLUMN IF NOT EXISTS recommended_coatings TEXT,                -- Recommended coatings (JSON array)
ADD COLUMN IF NOT EXISTS frame_recommendations TEXT,               -- Frame fitting recommendations
ADD COLUMN IF NOT EXISTS special_instructions TEXT,                -- Special dispensing instructions

-- Prescription Usage and Restrictions
ADD COLUMN IF NOT EXISTS usage_purpose VARCHAR(100),               -- 'driving', 'reading', 'computer', 'general', 'occupational'
ADD COLUMN IF NOT EXISTS wear_time VARCHAR(100),                   -- 'full-time', 'part-time', 'distance only', 'near only'
ADD COLUMN IF NOT EXISTS driving_suitable BOOLEAN DEFAULT TRUE,    -- Suitable for driving
ADD COLUMN IF NOT EXISTS dvla_notified BOOLEAN DEFAULT FALSE,      -- DVLA notification required

-- Verification and Quality Control
ADD COLUMN IF NOT EXISTS verified_by_ecp_id VARCHAR(255) REFERENCES users(id), -- Verified by different ECP
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,                    -- Verification timestamp
ADD COLUMN IF NOT EXISTS verification_notes TEXT,                  -- Verification comments

-- GOC Compliance and Record Keeping (7-year retention requirement)
ADD COLUMN IF NOT EXISTS record_retention_date TIMESTAMP,          -- Date when record can be deleted (7 years)
ADD COLUMN IF NOT EXISTS referral_made BOOLEAN DEFAULT FALSE,      -- Referral to another practitioner
ADD COLUMN IF NOT EXISTS referral_to VARCHAR(255),                 -- Who was patient referred to
ADD COLUMN IF NOT EXISTS referral_reason TEXT,                     -- Reason for referral

-- Enhanced metadata
ADD COLUMN IF NOT EXISTS examination_duration_minutes INTEGER,     -- How long examination took
ADD COLUMN IF NOT EXISTS examination_type VARCHAR(50),             -- 'routine', 'emergency', 'follow_up', 'screening'
ADD COLUMN IF NOT EXISTS patient_complaint TEXT,                   -- Patient's presenting complaint
ADD COLUMN IF NOT EXISTS previous_prescription_id VARCHAR(255) REFERENCES prescriptions(id); -- Link to previous Rx

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_test_room ON prescriptions(test_room_name);
CREATE INDEX IF NOT EXISTS idx_prescriptions_goc_number ON prescriptions(prescriber_goc_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_follow_up ON prescriptions(follow_up_date) WHERE follow_up_required = TRUE;
CREATE INDEX IF NOT EXISTS idx_prescriptions_retention ON prescriptions(record_retention_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_verified ON prescriptions(verified_by_ecp_id);

-- Comments for documentation
COMMENT ON COLUMN prescriptions.test_room_name IS 'Name/identifier of test room where examination was conducted';
COMMENT ON COLUMN prescriptions.prescriber_goc_number IS 'GOC registration number of prescriber (required by British law)';
COMMENT ON COLUMN prescriptions.prescriber_goc_type IS 'Type of GOC registrant: optometrist, dispensing_optician, or ophthalmologist';
COMMENT ON COLUMN prescriptions.od_visual_acuity_unaided IS 'Right eye visual acuity without correction (Snellen notation, e.g., 6/6)';
COMMENT ON COLUMN prescriptions.record_retention_date IS 'Date when record can be legally deleted (GOC requires 7-year retention)';
COMMENT ON COLUMN prescriptions.driving_suitable IS 'Whether prescription meets DVLA requirements for driving';

-- ============== COMPANIES TABLE - GOC AND ECP ENHANCEMENTS ==============

-- Add GOC practice details for ECP companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS practice_goc_number VARCHAR(50),          -- Practice GOC registration number
ADD COLUMN IF NOT EXISTS practice_type VARCHAR(50),                -- 'independent', 'multiple', 'hospital', 'domiciliary'
ADD COLUMN IF NOT EXISTS primary_practitioner_name VARCHAR(255),   -- Primary practitioner name
ADD COLUMN IF NOT EXISTS primary_practitioner_goc VARCHAR(50),     -- Primary practitioner GOC number
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),      -- Emergency contact name
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),      -- Emergency contact phone
ADD COLUMN IF NOT EXISTS out_of_hours_contact TEXT,                -- Out of hours contact details
ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(255),          -- Professional indemnity insurance provider
ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100),     -- Insurance policy number
ADD COLUMN IF NOT EXISTS insurance_expiry_date TIMESTAMP,          -- Insurance expiry date
ADD COLUMN IF NOT EXISTS has_ecp_access BOOLEAN DEFAULT FALSE,     -- Has access to ECP features
ADD COLUMN IF NOT EXISTS has_lab_access BOOLEAN DEFAULT FALSE;     -- Has access to lab/manufacturing features

-- Add test rooms table for tracking multiple test rooms per practice
CREATE TABLE IF NOT EXISTS test_rooms (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  room_name VARCHAR(100) NOT NULL,                               -- e.g., "Test Room 1", "Consulting Room A"
  room_code VARCHAR(20),                                         -- Short code for quick selection
  location_description TEXT,                                     -- Physical location description
  equipment_list TEXT,                                           -- List of equipment in room
  is_active BOOLEAN DEFAULT TRUE,                                -- Whether room is currently in use
  display_order INTEGER DEFAULT 0,                               -- Order for display in UI
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(company_id, room_name)
);

CREATE INDEX IF NOT EXISTS idx_test_rooms_company ON test_rooms(company_id);
CREATE INDEX IF NOT EXISTS idx_test_rooms_active ON test_rooms(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE test_rooms IS 'Test rooms available at each practice for conducting eye examinations';

-- ============== USERS TABLE - GOC PRACTITIONER DETAILS ==============

ALTER TABLE users
ADD COLUMN IF NOT EXISTS goc_registration_number VARCHAR(50),     -- Individual GOC registration number
ADD COLUMN IF NOT EXISTS goc_registration_type VARCHAR(50),       -- 'optometrist', 'dispensing_optician', 'student', 'ophthalmologist'
ADD COLUMN IF NOT EXISTS professional_qualifications VARCHAR(255), -- e.g., "BSc(Hons) Optom, MCOptom"
ADD COLUMN IF NOT EXISTS goc_registration_expiry TIMESTAMP,       -- GOC registration expiry date
ADD COLUMN IF NOT EXISTS indemnity_insurance_provider VARCHAR(255), -- Personal insurance provider
ADD COLUMN IF NOT EXISTS indemnity_policy_number VARCHAR(100),    -- Personal insurance policy
ADD COLUMN IF NOT EXISTS indemnity_expiry_date TIMESTAMP,         -- Insurance expiry
ADD COLUMN IF NOT EXISTS cpd_completed BOOLEAN DEFAULT TRUE,      -- CPD requirements completed
ADD COLUMN IF NOT EXISTS cpd_last_updated TIMESTAMP,              -- Last CPD update
ADD COLUMN IF NOT EXISTS signature_image TEXT,                    -- Base64 encoded signature for prescriptions
ADD COLUMN IF NOT EXISTS can_prescribe BOOLEAN DEFAULT TRUE,      -- Can issue prescriptions
ADD COLUMN IF NOT EXISTS can_dispense BOOLEAN DEFAULT TRUE;       -- Can dispense eyewear

CREATE INDEX IF NOT EXISTS idx_users_goc_number ON users(goc_registration_number);
CREATE INDEX IF NOT EXISTS idx_users_goc_expiry ON users(goc_registration_expiry);

COMMENT ON COLUMN users.goc_registration_number IS 'Individual GOC registration number for practitioners';
COMMENT ON COLUMN users.goc_registration_type IS 'Type of GOC registration: optometrist, dispensing_optician, student, ophthalmologist';
COMMENT ON COLUMN users.can_prescribe IS 'Whether user is qualified to prescribe optical appliances';

-- ============== PATIENTS TABLE - ENHANCED CLINICAL RECORDS ==============

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS previous_optician VARCHAR(255),          -- Previous optician/practice
ADD COLUMN IF NOT EXISTS gp_name VARCHAR(255),                    -- General Practitioner name
ADD COLUMN IF NOT EXISTS gp_practice VARCHAR(255),                -- GP practice name
ADD COLUMN IF NOT EXISTS gp_address TEXT,                         -- GP address
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),     -- Emergency contact
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),     -- Emergency phone
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100), -- Relationship to patient
ADD COLUMN IF NOT EXISTS medical_history JSONB,                   -- Comprehensive medical history
ADD COLUMN IF NOT EXISTS current_medications TEXT,                -- Current medications
ADD COLUMN IF NOT EXISTS family_ocular_history TEXT,              -- Family eye health history
ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),                 -- Patient occupation (relevant for VDU use)
ADD COLUMN IF NOT EXISTS vdu_user BOOLEAN DEFAULT FALSE,          -- Uses computer/screens regularly
ADD COLUMN IF NOT EXISTS driving_requirement BOOLEAN DEFAULT FALSE, -- Requires glasses for driving
ADD COLUMN IF NOT EXISTS contact_lens_wearer BOOLEAN DEFAULT FALSE, -- Wears contact lenses
ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50),    -- 'email', 'phone', 'sms', 'post'
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE, -- Consent for marketing
ADD COLUMN IF NOT EXISTS data_sharing_consent BOOLEAN DEFAULT TRUE, -- Consent for NHS data sharing
ADD COLUMN IF NOT EXISTS last_examination_date TIMESTAMP,         -- Date of last eye examination
ADD COLUMN IF NOT EXISTS next_examination_due TIMESTAMP;          -- When next examination is due

CREATE INDEX IF NOT EXISTS idx_patients_next_exam ON patients(next_examination_due);
CREATE INDEX IF NOT EXISTS idx_patients_nhs ON patients(nhs_number);

COMMENT ON COLUMN patients.nhs_number IS 'UK National Health Service number (10 digits)';
COMMENT ON COLUMN patients.vdu_user IS 'Whether patient uses VDU (computer screens) regularly - relevant for DSE regulations';
COMMENT ON COLUMN patients.last_examination_date IS 'Date of most recent comprehensive eye examination';

-- ============== REGISTER NEW VANTAGE CO LTD ==============

-- Insert NEW VANTAGE CO LTD as first company with ECP and Lab access
INSERT INTO companies (
  id,
  name,
  type,
  status,
  email,
  phone,
  address,
  registration_number,
  goc_number,
  subscription_plan,
  subscription_start_date,
  is_subscription_exempt,
  has_ecp_access,
  has_lab_access,
  practice_goc_number,
  practice_type,
  primary_practitioner_name,
  company_logo_url,
  branding_settings,
  created_at
) VALUES (
  'new-vantage-co-ltd-001',
  'NEW VANTAGE CO LTD',
  'hybrid',  -- Both ECP and Lab capabilities
  'active',
  'admin@newvantageco.com',
  '+44 20 1234 5678',
  '{"street": "123 High Street", "city": "London", "postcode": "SW1A 1AA", "country": "United Kingdom"}'::jsonb,
  'NVC001',  -- Company registration number
  'GOC-PRACTICE-001',  -- GOC practice number
  'full',  -- Full subscription plan
  NOW(),
  TRUE,  -- Subscription exempt (master admin created)
  TRUE,  -- Has ECP access
  TRUE,  -- Has Lab access
  'GOC-PRACTICE-001',
  'independent',
  'NEW VANTAGE CO LTD',
  NULL,  -- Logo to be added later
  '{
    "primaryColor": "#1e40af",
    "secondaryColor": "#3b82f6",
    "logoPosition": "top-left",
    "showGocNumber": true,
    "includeAftercare": true,
    "dispenseSlipFooter": "NEW VANTAGE CO LTD - Excellence in Eye Care"
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  has_ecp_access = TRUE,
  has_lab_access = TRUE,
  status = 'active',
  updated_at = NOW();

-- Create admin user for NEW VANTAGE CO LTD
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  role,
  company_id,
  account_status,
  goc_registration_number,
  goc_registration_type,
  professional_qualifications,
  can_prescribe,
  can_dispense,
  is_active,
  created_at
) VALUES (
  'new-vantage-admin-001',
  'admin@newvantageco.com',
  '$2b$10$YourHashedPasswordHere',  -- This will need to be updated with actual password
  'Admin',
  'NEW VANTAGE',
  'company_admin',
  'new-vantage-co-ltd-001',
  'active',
  'GOC-OPT-12345',  -- Example GOC number
  'optometrist',
  'BSc(Hons) Optom, MCOptom',
  TRUE,
  TRUE,
  TRUE,
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  company_id = 'new-vantage-co-ltd-001',
  role = 'company_admin',
  account_status = 'active',
  updated_at = NOW();

-- Create initial test rooms for NEW VANTAGE CO LTD
INSERT INTO test_rooms (company_id, room_name, room_code, location_description, display_order) VALUES
  ('new-vantage-co-ltd-001', 'Test Room 1', 'TR1', 'Main testing room with full equipment suite', 1),
  ('new-vantage-co-ltd-001', 'Test Room 2', 'TR2', 'Secondary testing room for routine examinations', 2),
  ('new-vantage-co-ltd-001', 'Consulting Room', 'CR1', 'Private consulting room for complex cases', 3),
  ('new-vantage-co-ltd-001', 'Contact Lens Room', 'CL1', 'Dedicated contact lens fitting room', 4)
ON CONFLICT (company_id, room_name) DO NOTHING;

-- ============== GOC COMPLIANCE AUDIT TABLE ==============

-- Create table to track GOC compliance checks
CREATE TABLE IF NOT EXISTS goc_compliance_checks (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id),
  check_type VARCHAR(100) NOT NULL,  -- 'insurance_expiry', 'goc_registration', 'cpd_status', 'record_retention'
  check_date TIMESTAMP DEFAULT NOW() NOT NULL,
  status VARCHAR(50) NOT NULL,  -- 'compliant', 'warning', 'non_compliant'
  details TEXT,
  action_required TEXT,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goc_compliance_company ON goc_compliance_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_goc_compliance_status ON goc_compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_goc_compliance_date ON goc_compliance_checks(check_date);

COMMENT ON TABLE goc_compliance_checks IS 'Tracks GOC compliance checks and alerts for practices and practitioners';

-- ============== PRESCRIPTION TEMPLATES ==============

-- Create prescription templates for quick prescription entry
CREATE TABLE IF NOT EXISTS prescription_templates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  template_name VARCHAR(150) NOT NULL,
  template_description TEXT,
  prescription_type VARCHAR(50),  -- 'distance', 'reading', 'bifocal', 'varifocal'
  default_values JSONB NOT NULL,  -- Stores default prescription values
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(company_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_prescription_templates_company ON prescription_templates(company_id);

COMMENT ON TABLE prescription_templates IS 'Reusable prescription templates for common prescriptions';

-- ============== CLINICAL PROTOCOLS ==============

-- Create clinical protocols/guidelines table
CREATE TABLE IF NOT EXISTS clinical_protocols (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  protocol_name VARCHAR(255) NOT NULL,
  protocol_type VARCHAR(100),  -- 'examination', 'referral', 'follow_up', 'emergency'
  description TEXT,
  protocol_steps JSONB,  -- Array of steps
  compliance_notes TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clinical_protocols_company ON clinical_protocols(company_id);

COMMENT ON TABLE clinical_protocols IS 'Clinical protocols and guidelines for consistent practice standards';

-- ============== UPDATE EXISTING RECORDS ==============

-- Set record retention date for existing prescriptions (7 years from issue date)
UPDATE prescriptions 
SET record_retention_date = issue_date + INTERVAL '7 years'
WHERE record_retention_date IS NULL;

-- Set default examination type for existing prescriptions
UPDATE prescriptions
SET examination_type = 'routine'
WHERE examination_type IS NULL;

-- Set GOC compliance to true for existing prescriptions
UPDATE prescriptions
SET goc_compliant = TRUE
WHERE goc_compliant IS NULL;

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE ON test_rooms TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON goc_compliance_checks TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON prescription_templates TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON clinical_protocols TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ ECP System Modernization Complete';
  RAISE NOTICE '✅ British GOC Compliance Features Added';
  RAISE NOTICE '✅ NEW VANTAGE CO LTD Registered';
  RAISE NOTICE '✅ Test Rooms Created';
  RAISE NOTICE '';
  RAISE NOTICE 'Company ID: new-vantage-co-ltd-001';
  RAISE NOTICE 'Admin User ID: new-vantage-admin-001';
  RAISE NOTICE 'Login Email: admin@newvantageco.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Set password for admin user';
  RAISE NOTICE '2. Configure authentication for email/password login';
  RAISE NOTICE '3. Update frontend to use new prescription fields';
  RAISE NOTICE '4. Add test room selection to prescription forms';
END $$;
