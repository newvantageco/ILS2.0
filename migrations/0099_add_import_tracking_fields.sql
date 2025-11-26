/**
 * Add Import Tracking Fields to Existing Tables
 *
 * Enables tracking of migrated records from Optix, Occuco, Acuity, etc.
 * These fields are optional - NULL for new records created directly in ILS 2.0
 */

-- Add import tracking to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS import_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS import_job_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;

-- Add index for faster lookups by external ID (for linking examinations, prescriptions)
CREATE INDEX IF NOT EXISTS idx_patients_external_id ON patients(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_import_source ON patients(import_source) WHERE import_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_import_job ON patients(import_job_id) WHERE import_job_id IS NOT NULL;

-- Add import tracking to eye_examinations table
ALTER TABLE eye_examinations
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS import_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS import_job_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_eye_exams_external_id ON eye_examinations(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eye_exams_import_job ON eye_examinations(import_job_id) WHERE import_job_id IS NOT NULL;

-- Add import tracking to prescriptions table
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS import_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS import_job_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_prescriptions_external_id ON prescriptions(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_import_job ON prescriptions(import_job_id) WHERE import_job_id IS NOT NULL;

-- Add import tracking to dispense_records table
ALTER TABLE dispense_records
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS import_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS import_job_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_dispense_records_external_id ON dispense_records(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dispense_records_import_job ON dispense_records(import_job_id) WHERE import_job_id IS NOT NULL;

-- Add import tracking to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS import_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS import_job_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_orders_external_id ON orders(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_import_job ON orders(import_job_id) WHERE import_job_id IS NOT NULL;

-- Add import tracking to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS import_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS import_job_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON appointments(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_import_job ON appointments(import_job_id) WHERE import_job_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN patients.external_id IS 'Original ID from legacy system (Optix, Occuco, Acuity, etc.) - NULL for new records';
COMMENT ON COLUMN patients.import_source IS 'Source system name (optix, occuco, acuity, manual_csv) - NULL for new records';
COMMENT ON COLUMN patients.import_job_id IS 'Reference to migration_jobs.id - NULL for new records';
COMMENT ON COLUMN patients.imported_at IS 'Timestamp when record was imported - NULL for new records';

COMMENT ON COLUMN eye_examinations.external_id IS 'Original exam ID from legacy system - NULL for new records';
COMMENT ON COLUMN eye_examinations.import_source IS 'Source system name - NULL for new records';
COMMENT ON COLUMN eye_examinations.import_job_id IS 'Reference to migration_jobs.id - NULL for new records';
COMMENT ON COLUMN eye_examinations.imported_at IS 'Timestamp when record was imported - NULL for new records';

COMMENT ON COLUMN prescriptions.external_id IS 'Original Rx ID from legacy system - NULL for new records';
COMMENT ON COLUMN prescriptions.import_source IS 'Source system name - NULL for new records';
COMMENT ON COLUMN prescriptions.import_job_id IS 'Reference to migration_jobs.id - NULL for new records';
COMMENT ON COLUMN prescriptions.imported_at IS 'Timestamp when record was imported - NULL for new records';

COMMENT ON COLUMN dispense_records.external_id IS 'Original dispense ID from legacy system - NULL for new records';
COMMENT ON COLUMN dispense_records.import_source IS 'Source system name - NULL for new records';
COMMENT ON COLUMN dispense_records.import_job_id IS 'Reference to migration_jobs.id - NULL for new records';
COMMENT ON COLUMN dispense_records.imported_at IS 'Timestamp when record was imported - NULL for new records';

COMMENT ON COLUMN orders.external_id IS 'Original order ID from legacy system - NULL for new records';
COMMENT ON COLUMN orders.import_source IS 'Source system name - NULL for new records';
COMMENT ON COLUMN orders.import_job_id IS 'Reference to migration_jobs.id - NULL for new records';
COMMENT ON COLUMN orders.imported_at IS 'Timestamp when record was imported - NULL for new records';

COMMENT ON COLUMN appointments.external_id IS 'Original appointment ID from legacy system - NULL for new records';
COMMENT ON COLUMN appointments.import_source IS 'Source system name - NULL for new records';
COMMENT ON COLUMN appointments.import_job_id IS 'Reference to migration_jobs.id - NULL for new records';
COMMENT ON COLUMN appointments.imported_at IS 'Timestamp when record was imported - NULL for new records';

-- Add foreign key constraints to migration_jobs (if the table exists)
DO $$
BEGIN
    -- Check if migration_jobs table exists before adding foreign key
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_jobs') THEN
        ALTER TABLE patients
        ADD CONSTRAINT fk_patients_migration_job
        FOREIGN KEY (import_job_id) REFERENCES migration_jobs(id)
        ON DELETE SET NULL;

        ALTER TABLE eye_examinations
        ADD CONSTRAINT fk_eye_examinations_migration_job
        FOREIGN KEY (import_job_id) REFERENCES migration_jobs(id)
        ON DELETE SET NULL;

        ALTER TABLE prescriptions
        ADD CONSTRAINT fk_prescriptions_migration_job
        FOREIGN KEY (import_job_id) REFERENCES migration_jobs(id)
        ON DELETE SET NULL;

        ALTER TABLE dispense_records
        ADD CONSTRAINT fk_dispense_records_migration_job
        FOREIGN KEY (import_job_id) REFERENCES migration_jobs(id)
        ON DELETE SET NULL;

        ALTER TABLE orders
        ADD CONSTRAINT fk_orders_migration_job
        FOREIGN KEY (import_job_id) REFERENCES migration_jobs(id)
        ON DELETE SET NULL;

        ALTER TABLE appointments
        ADD CONSTRAINT fk_appointments_migration_job
        FOREIGN KEY (import_job_id) REFERENCES migration_jobs(id)
        ON DELETE SET NULL;
    END IF;
END $$;
