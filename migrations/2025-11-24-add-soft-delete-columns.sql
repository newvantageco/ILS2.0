-- Migration: Add Soft Delete Columns to Critical Healthcare Tables
-- Created: 2025-11-24
-- Purpose: Enable soft deletes for healthcare compliance (7-year data retention)
--
-- This migration adds deletedAt and deletedBy columns to critical tables
-- to support soft delete functionality. Soft-deleted records are kept in place
-- with a timestamp indicating when they were deleted, rather than being
-- permanently removed from the database.

-- ============================================================================
-- EYE EXAMINATIONS TABLE
-- ============================================================================
ALTER TABLE eye_examinations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_eye_examinations_deleted_at ON eye_examinations(deleted_at);

COMMENT ON COLUMN eye_examinations.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN eye_examinations.deleted_by IS 'User ID who deleted the record';

-- ============================================================================
-- PRESCRIPTIONS TABLE
-- ============================================================================
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_prescriptions_deleted_at ON prescriptions(deleted_at);

COMMENT ON COLUMN prescriptions.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN prescriptions.deleted_by IS 'User ID who deleted the record';

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at);

COMMENT ON COLUMN invoices.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN invoices.deleted_by IS 'User ID who deleted the record';

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(deleted_at);

COMMENT ON COLUMN appointments.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN appointments.deleted_by IS 'User ID who deleted the record';

-- ============================================================================
-- CLINICAL NOTES TABLE
-- ============================================================================
ALTER TABLE clinical_notes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_deleted_at ON clinical_notes(deleted_at);

COMMENT ON COLUMN clinical_notes.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN clinical_notes.deleted_by IS 'User ID who deleted the record';

-- ============================================================================
-- VITAL SIGNS TABLE
-- ============================================================================
ALTER TABLE vital_signs
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_vital_signs_deleted_at ON vital_signs(deleted_at);

COMMENT ON COLUMN vital_signs.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN vital_signs.deleted_by IS 'User ID who deleted the record';

-- ============================================================================
-- ORDERS TABLE (verify columns exist, add if not)
-- ============================================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);

COMMENT ON COLUMN orders.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN orders.deleted_by IS 'User ID who deleted the record';

-- ============================================================================
-- PATIENTS TABLE (verify columns exist, add if not)
-- ============================================================================
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(deleted_at);

COMMENT ON COLUMN patients.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN patients.deleted_by IS 'User ID who deleted the record';

-- ============================================================================
-- TEST ROOM BOOKINGS TABLE
-- ============================================================================
ALTER TABLE test_room_bookings
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_test_room_bookings_deleted_at ON test_room_bookings(deleted_at);

-- ============================================================================
-- NHS CLAIMS TABLE (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nhs_claims') THEN
        ALTER TABLE nhs_claims
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

        CREATE INDEX IF NOT EXISTS idx_nhs_claims_deleted_at ON nhs_claims(deleted_at);
    END IF;
END
$$;

-- ============================================================================
-- Insert default retention policies for soft-deleted records
-- ============================================================================
INSERT INTO data_retention_policies (
  id,
  entity_type,
  policy_name,
  description,
  active_retention_days,
  archive_retention_days,
  total_retention_days,
  auto_archive,
  auto_delete,
  is_global_policy,
  created_by
) VALUES
(
  'policy_patients',
  'patients',
  'Patient Record Retention Policy',
  'Healthcare records must be retained for minimum 7 years (UK NHS requirement)',
  2555,   -- 7 years active
  3650,   -- 10 years in archive
  6205,   -- 17 years total
  true,
  false,  -- Never auto-delete patient records
  true,
  'system'
),
(
  'policy_prescriptions',
  'prescriptions',
  'Prescription Retention Policy',
  'GOC requires prescription records for 10 years',
  2555,   -- 7 years active
  1095,   -- 3 years in archive
  3650,   -- 10 years total
  true,
  false,  -- Never auto-delete prescriptions
  true,
  'system'
),
(
  'policy_clinical_notes',
  'clinical_notes',
  'Clinical Notes Retention Policy',
  'Clinical notes must be retained with patient records',
  2555,   -- 7 years active
  3650,   -- 10 years in archive
  6205,   -- 17 years total
  true,
  false,
  true,
  'system'
),
(
  'policy_eye_examinations',
  'eye_examinations',
  'Eye Examination Retention Policy',
  'Eye examination records for GOC compliance',
  2555,   -- 7 years active
  1095,   -- 3 years in archive
  3650,   -- 10 years total
  true,
  false,
  true,
  'system'
),
(
  'policy_appointments',
  'appointments',
  'Appointment Retention Policy',
  'Appointment records for audit trail',
  730,    -- 2 years active
  1825,   -- 5 years in archive
  2555,   -- 7 years total
  true,
  false,
  true,
  'system'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run the migration: psql -d your_database -f this_file.sql
-- 2. Update application code to filter deleted_at IS NULL in queries
-- 3. Replace hard deletes with soft deletes (UPDATE set deleted_at = NOW())
-- 4. Integrate with ArchivalService for complete audit trail
