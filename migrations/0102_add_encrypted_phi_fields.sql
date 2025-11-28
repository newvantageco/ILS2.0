-- Migration: Add encrypted PHI fields for HIPAA compliance
-- Date: 2025-11-28
-- Purpose: Implement field-level encryption for sensitive patient data
-- Compliance: HIPAA Security Rule §164.312(a)(2)(iv) - Encryption at rest

-- ============================================================================
-- PATIENTS TABLE - Add encrypted PHI columns
-- ============================================================================

ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS nhs_number_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS address_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS postcode_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS medical_history_encrypted TEXT;

COMMENT ON COLUMN patients.nhs_number_encrypted IS 'AES-256-GCM encrypted NHS number (format: v1:iv:tag:ciphertext)';
COMMENT ON COLUMN patients.date_of_birth_encrypted IS 'AES-256-GCM encrypted date of birth';
COMMENT ON COLUMN patients.email_encrypted IS 'AES-256-GCM encrypted email address';
COMMENT ON COLUMN patients.phone_encrypted IS 'AES-256-GCM encrypted phone number';
COMMENT ON COLUMN patients.address_encrypted IS 'AES-256-GCM encrypted full address';
COMMENT ON COLUMN patients.postcode_encrypted IS 'AES-256-GCM encrypted postcode';
COMMENT ON COLUMN patients.medical_history_encrypted IS 'AES-256-GCM encrypted medical history';

-- ============================================================================
-- USERS TABLE - Add encrypted PII columns
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS nhs_number_encrypted TEXT;

COMMENT ON COLUMN users.email_encrypted IS 'AES-256-GCM encrypted email address';
COMMENT ON COLUMN users.phone_encrypted IS 'AES-256-GCM encrypted phone number';
COMMENT ON COLUMN users.nhs_number_encrypted IS 'AES-256-GCM encrypted NHS number (for ECP users)';

-- ============================================================================
-- PRESCRIPTIONS TABLE - Add encrypted prescription data
-- ============================================================================

ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS prescription_data_encrypted TEXT;

COMMENT ON COLUMN prescriptions.prescription_data_encrypted IS 'AES-256-GCM encrypted prescription details';

-- ============================================================================
-- EXAMINATIONS TABLE - Add encrypted clinical data
-- ============================================================================

ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS clinical_notes_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis_encrypted TEXT;

COMMENT ON COLUMN examinations.clinical_notes_encrypted IS 'AES-256-GCM encrypted clinical notes';
COMMENT ON COLUMN examinations.diagnosis_encrypted IS 'AES-256-GCM encrypted diagnosis information';

-- ============================================================================
-- INDEXES for encrypted columns (for existence checks only, not searchable)
-- ============================================================================

-- Note: Encrypted data cannot be searched or indexed by value
-- These indexes only help with NULL checks and existence queries

CREATE INDEX IF NOT EXISTS idx_patients_nhs_encrypted_exists 
  ON patients(nhs_number_encrypted) 
  WHERE nhs_number_encrypted IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_email_encrypted_exists 
  ON patients(email_encrypted) 
  WHERE email_encrypted IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_encrypted_exists 
  ON users(email_encrypted) 
  WHERE email_encrypted IS NOT NULL;

-- ============================================================================
-- AUDIT TRIGGER - Log all encryption operations
-- ============================================================================

CREATE OR REPLACE FUNCTION log_encryption_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when encrypted fields are accessed (via UPDATE/SELECT)
  -- In production, integrate with audit logging system
  
  IF TG_OP = 'UPDATE' THEN
    -- Log decryption events (when encrypted fields are read for update)
    IF OLD.nhs_number_encrypted IS DISTINCT FROM NEW.nhs_number_encrypted OR
       OLD.email_encrypted IS DISTINCT FROM NEW.email_encrypted THEN
      
      -- In production, send to audit log table
      RAISE NOTICE 'Encrypted PHI modified: table=%, record_id=%, operation=%', 
        TG_TABLE_NAME, NEW.id, TG_OP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to patients table
DROP TRIGGER IF EXISTS audit_patient_encryption ON patients;
CREATE TRIGGER audit_patient_encryption
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION log_encryption_access();

-- Apply audit trigger to users table
DROP TRIGGER IF NOT EXISTS audit_user_encryption ON users;
CREATE TRIGGER audit_user_encryption
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_encryption_access();

-- ============================================================================
-- DATA MIGRATION PLAN (to be executed separately with downtime)
-- ============================================================================

-- IMPORTANT: The following SQL should be executed during a maintenance window
-- to migrate existing plaintext data to encrypted format.
-- 
-- This is a MANUAL operation and should NOT be included in automatic migrations.
-- 
-- Steps:
-- 1. Schedule maintenance window
-- 2. Create database backup
-- 3. Run encryption migration script (separate from this migration)
-- 4. Verify all data encrypted correctly
-- 5. Drop plaintext columns (after verification period)
-- 
-- Example migration script (run separately):
-- 
-- UPDATE patients 
-- SET nhs_number_encrypted = encrypt_field(nhs_number)
-- WHERE nhs_number IS NOT NULL 
--   AND nhs_number_encrypted IS NULL;
-- 
-- After verification (e.g., 30 days):
-- ALTER TABLE patients DROP COLUMN nhs_number;
-- ALTER TABLE patients RENAME COLUMN nhs_number_encrypted TO nhs_number;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration:
-- 
-- DROP TRIGGER IF EXISTS audit_patient_encryption ON patients;
-- DROP TRIGGER IF EXISTS audit_user_encryption ON users;
-- DROP FUNCTION IF EXISTS log_encryption_access();
-- 
-- DROP INDEX IF EXISTS idx_patients_nhs_encrypted_exists;
-- DROP INDEX IF EXISTS idx_patients_email_encrypted_exists;
-- DROP INDEX IF EXISTS idx_users_email_encrypted_exists;
-- 
-- ALTER TABLE patients 
--   DROP COLUMN IF EXISTS nhs_number_encrypted,
--   DROP COLUMN IF EXISTS date_of_birth_encrypted,
--   DROP COLUMN IF EXISTS email_encrypted,
--   DROP COLUMN IF EXISTS phone_encrypted,
--   DROP COLUMN IF EXISTS address_encrypted,
--   DROP COLUMN IF EXISTS postcode_encrypted,
--   DROP COLUMN IF EXISTS medical_history_encrypted;
-- 
-- ALTER TABLE users
--   DROP COLUMN IF EXISTS email_encrypted,
--   DROP COLUMN IF EXISTS phone_encrypted,
--   DROP COLUMN IF EXISTS nhs_number_encrypted;
-- 
-- ALTER TABLE prescriptions
--   DROP COLUMN IF EXISTS prescription_data_encrypted;
-- 
-- ALTER TABLE examinations
--   DROP COLUMN IF EXISTS clinical_notes_encrypted,
--   DROP COLUMN IF EXISTS diagnosis_encrypted;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count records needing encryption:
-- SELECT COUNT(*) as needs_encryption 
-- FROM patients 
-- WHERE nhs_number IS NOT NULL 
--   AND nhs_number_encrypted IS NULL;

-- Verify encryption format (should all start with version prefix):
-- SELECT 
--   LEFT(nhs_number_encrypted, 10) as encryption_header,
--   COUNT(*) as count
-- FROM patients
-- WHERE nhs_number_encrypted IS NOT NULL
-- GROUP BY LEFT(nhs_number_encrypted, 10);
