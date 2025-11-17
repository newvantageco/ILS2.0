-- Migration: Fix Prescription Data Types
-- Purpose: Convert text-based prescription fields to proper numeric types
-- Critical for data integrity and clinical calculations
-- Date: 2025-11-17

-- Step 1: Create backup tables before making changes
CREATE TABLE IF NOT EXISTS eye_examinations_backup AS 
SELECT * FROM eye_examinations;

CREATE TABLE IF NOT EXISTS prescriptions_backup AS 
SELECT * FROM prescriptions;

-- Step 2: Add new numeric columns with proper precision
-- For eye_examinations table
ALTER TABLE eye_examinations 
ADD COLUMN IF NOT EXISTS od_sphere_new DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS od_cylinder_new DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS os_sphere_new DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS os_cylinder_new DECIMAL(6,3);

-- For prescriptions table  
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS od_sphere_new DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS od_cylinder_new DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS os_sphere_new DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS os_cylinder_new DECIMAL(6,3);

-- Step 3: Migrate data from text to numeric with validation
-- Handle eye_examinations data
UPDATE eye_examinations SET 
  od_sphere_new = CASE 
    WHEN od_sphere ~ '^-?\d*\.?\d+$' THEN CAST(od_sphere AS DECIMAL(6,3))
    WHEN od_sphere IS NULL OR od_sphere = '' THEN NULL
    ELSE 0.000 -- Default for invalid data
  END,
  od_cylinder_new = CASE 
    WHEN od_cylinder ~ '^-?\d*\.?\d+$' THEN CAST(od_cylinder AS DECIMAL(6,3))
    WHEN od_cylinder IS NULL OR od_cylinder = '' THEN NULL
    ELSE 0.000 -- Default for invalid data
  END,
  os_sphere_new = CASE 
    WHEN os_sphere ~ '^-?\d*\.?\d+$' THEN CAST(os_sphere AS DECIMAL(6,3))
    WHEN os_sphere IS NULL OR os_sphere = '' THEN NULL
    ELSE 0.000 -- Default for invalid data
  END,
  os_cylinder_new = CASE 
    WHEN os_cylinder ~ '^-?\d*\.?\d+$' THEN CAST(os_cylinder AS DECIMAL(6,3))
    WHEN os_cylinder IS NULL OR os_cylinder = '' THEN NULL
    ELSE 0.000 -- Default for invalid data
  END;

-- Handle prescriptions data
UPDATE prescriptions SET 
  od_sphere_new = CASE 
    WHEN od_sphere ~ '^-?\d*\.?\d+$' THEN CAST(od_sphere AS DECIMAL(6,3))
    WHEN od_sphere IS NULL OR od_sphere = '' THEN NULL
    ELSE 0.000 -- Default for invalid data
  END,
  od_cylinder_new = CASE 
    WHEN od_cylinder ~ '^-?\d*\.?\d+$' THEN CAST(od_cylinder AS DECIMAL(6,3))
    WHEN od_cylinder IS NULL OR od_cylinder = '' THEN NULL
    ELSE 0.000 -- Default for invalid data
  END,
  os_sphere_new = CASE 
    WHEN os_sphere ~ '^-?\d*\.?\d+$' THEN CAST(os_sphere AS DECIMAL(6,3))
    WHEN os_sphere IS NULL OR os_sphere = '' THEN NULL
    ELSE 0.000 -- Default for invalid data
  END,
  os_cylinder_new = CASE 
    WHEN os_cylinder ~ '^-?\d*\.?\d+$' THEN CAST(os_cylinder AS DECIMAL(6,3))
    WHEN os_cylinder IS NULL OR os_cylinder = '' THEN NULL
    ELSE 0.000 -- Default for invalid data
  END;

-- Step 4: Drop old text columns
ALTER TABLE eye_examinations 
DROP COLUMN IF EXISTS od_sphere,
DROP COLUMN IF EXISTS od_cylinder,
DROP COLUMN IF EXISTS os_sphere,
DROP COLUMN IF EXISTS os_cylinder;

ALTER TABLE prescriptions
DROP COLUMN IF EXISTS od_sphere,
DROP COLUMN IF EXISTS od_cylinder,
DROP COLUMN IF EXISTS os_sphere,
DROP COLUMN IF EXISTS os_cylinder;

-- Step 5: Rename new columns to final names
ALTER TABLE eye_examinations 
RENAME COLUMN od_sphere_new TO od_sphere,
RENAME COLUMN od_cylinder_new TO od_cylinder,
RENAME COLUMN os_sphere_new TO os_sphere,
RENAME COLUMN os_cylinder_new TO os_cylinder;

ALTER TABLE prescriptions
RENAME COLUMN od_sphere_new TO od_sphere,
RENAME COLUMN od_cylinder_new TO od_cylinder,
RENAME COLUMN os_sphere_new TO os_sphere,
RENAME COLUMN os_cylinder_new TO os_cylinder;

-- Step 6: Add constraints for data integrity
ALTER TABLE eye_examinations 
ADD CONSTRAINT IF NOT EXISTS chk_eye_od_sphere_range CHECK (od_sphere BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT IF NOT EXISTS chk_eye_od_cylinder_range CHECK (od_cylinder BETWEEN -10.00 AND 10.00),
ADD CONSTRAINT IF NOT EXISTS chk_eye_os_sphere_range CHECK (os_sphere BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT IF NOT EXISTS chk_eye_os_cylinder_range CHECK (os_cylinder BETWEEN -10.00 AND 10.00);

ALTER TABLE prescriptions
ADD CONSTRAINT IF NOT EXISTS chk_rx_od_sphere_range CHECK (od_sphere BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT IF NOT EXISTS chk_rx_od_cylinder_range CHECK (od_cylinder BETWEEN -10.00 AND 10.00),
ADD CONSTRAINT IF NOT EXISTS chk_rx_os_sphere_range CHECK (os_sphere BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT IF NOT EXISTS chk_rx_os_cylinder_range CHECK (os_cylinder BETWEEN -10.00 AND 10.00);

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_eye_examinations_od_sphere ON eye_examinations(od_sphere);
CREATE INDEX IF NOT EXISTS idx_eye_examinations_od_cylinder ON eye_examinations(od_cylinder);
CREATE INDEX IF NOT EXISTS idx_eye_examinations_os_sphere ON eye_examinations(os_sphere);
CREATE INDEX IF NOT EXISTS idx_eye_examinations_os_cylinder ON eye_examinations(os_cylinder);

CREATE INDEX IF NOT EXISTS idx_prescriptions_od_sphere ON prescriptions(od_sphere);
CREATE INDEX IF NOT EXISTS idx_prescriptions_od_cylinder ON prescriptions(od_cylinder);
CREATE INDEX IF NOT EXISTS idx_prescriptions_os_sphere ON prescriptions(os_sphere);
CREATE INDEX IF NOT EXISTS idx_prescriptions_os_cylinder ON prescriptions(os_cylinder);

-- Step 8: Create validation function for future inserts
CREATE OR REPLACE FUNCTION validate_prescription_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate sphere values
  IF NEW.od_sphere IS NOT NULL AND (NEW.od_sphere < -30.00 OR NEW.od_sphere > 30.00) THEN
    RAISE EXCEPTION 'OD sphere value % is outside valid range (-30.00 to 30.00)', NEW.od_sphere;
  END IF;
  
  IF NEW.os_sphere IS NOT NULL AND (NEW.os_sphere < -30.00 OR NEW.os_sphere > 30.00) THEN
    RAISE EXCEPTION 'OS sphere value % is outside valid range (-30.00 to 30.00)', NEW.os_sphere;
  END IF;
  
  -- Validate cylinder values
  IF NEW.od_cylinder IS NOT NULL AND (NEW.od_cylinder < -10.00 OR NEW.od_cylinder > 10.00) THEN
    RAISE EXCEPTION 'OD cylinder value % is outside valid range (-10.00 to 10.00)', NEW.od_cylinder;
  END IF;
  
  IF NEW.os_cylinder IS NOT NULL AND (NEW.os_cylinder < -10.00 OR NEW.os_cylinder > 10.00) THEN
    RAISE EXCEPTION 'OS cylinder value % is outside valid range (-10.00 to 10.00)', NEW.os_cylinder;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create triggers for validation
DROP TRIGGER IF EXISTS validate_eye_examination_values ON eye_examinations;
CREATE TRIGGER validate_eye_examination_values
  BEFORE INSERT OR UPDATE ON eye_examinations
  FOR EACH ROW EXECUTE FUNCTION validate_prescription_values();

DROP TRIGGER IF EXISTS validate_prescription_values ON prescriptions;
CREATE TRIGGER validate_prescription_values
  BEFORE INSERT OR UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION validate_prescription_values();

-- Step 10: Log migration completion
INSERT INTO migration_log (migration_name, executed_at, status, details)
VALUES (
  '002_fix_prescription_data_types',
  NOW(),
  'SUCCESS',
  'Converted prescription fields from text to DECIMAL(6,3) with validation constraints'
) ON CONFLICT (migration_name) DO UPDATE SET 
  executed_at = NOW(),
  status = 'SUCCESS',
  details = 'Converted prescription fields from text to DECIMAL(6,3) with validation constraints';

COMMIT;

-- Verification queries (run these to verify the migration)
-- SELECT COUNT(*) FROM eye_examinations WHERE od_sphere IS NOT NULL;
-- SELECT COUNT(*) FROM prescriptions WHERE od_sphere IS NOT NULL;
-- SELECT column_name, data_type, numeric_precision, numeric_scale FROM information_schema.columns 
--   WHERE table_name IN ('eye_examinations', 'prescriptions') AND column_name LIKE '%sphere' OR column_name LIKE '%cylinder';
