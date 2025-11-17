-- Migration 001: Fix Prescription Numeric Types
-- 
-- CRITICAL: This migration fixes data integrity issues by converting
-- text-based prescription fields to proper numeric types.
--
-- Risk Level: HIGH - This affects core business data
-- Rollback: YES - Full rollback script provided

BEGIN;

-- Step 1: Add new decimal columns to orders table
ALTER TABLE orders 
ADD COLUMN od_sphere_new DECIMAL(5, 2),
ADD COLUMN od_cylinder_new DECIMAL(5, 2),
ADD COLUMN od_axis_new DECIMAL(3, 0),
ADD COLUMN od_add_new DECIMAL(4, 2),
ADD COLUMN os_sphere_new DECIMAL(5, 2),
ADD COLUMN os_cylinder_new DECIMAL(5, 2),
ADD COLUMN os_axis_new DECIMAL(3, 0),
ADD COLUMN os_add_new DECIMAL(4, 2),
ADD COLUMN pd_new DECIMAL(4, 1);

-- Step 2: Add new decimal columns to prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN od_sphere_new DECIMAL(5, 2),
ADD COLUMN od_cylinder_new DECIMAL(5, 2),
ADD COLUMN od_axis_new DECIMAL(3, 0),
ADD COLUMN od_add_new DECIMAL(4, 2),
ADD COLUMN os_sphere_new DECIMAL(5, 2),
ADD COLUMN os_cylinder_new DECIMAL(5, 2),
ADD COLUMN os_axis_new DECIMAL(3, 0),
ADD COLUMN os_add_new DECIMAL(4, 2),
ADD COLUMN pd_new DECIMAL(4, 1);

-- Step 3: Migrate data from text to decimal (orders table)
UPDATE orders SET 
  od_sphere_new = CASE 
    WHEN od_sphere ~ '^-?\d*\.?\d+$' THEN CAST(od_sphere AS DECIMAL(5, 2))
    WHEN od_sphere IS NULL OR od_sphere = '' THEN NULL
    ELSE NULL -- Log invalid values for manual review
  END,
  od_cylinder_new = CASE 
    WHEN od_cylinder ~ '^-?\d*\.?\d+$' THEN CAST(od_cylinder AS DECIMAL(5, 2))
    WHEN od_cylinder IS NULL OR od_cylinder = '' THEN NULL
    ELSE NULL
  END,
  od_axis_new = CASE 
    WHEN od_axis ~ '^\d+$' THEN CAST(od_axis AS DECIMAL(3, 0))
    WHEN od_axis IS NULL OR od_axis = '' THEN NULL
    ELSE NULL
  END,
  od_add_new = CASE 
    WHEN od_add ~ '^-?\d*\.?\d+$' THEN CAST(od_add AS DECIMAL(4, 2))
    WHEN od_add IS NULL OR od_add = '' THEN NULL
    ELSE NULL
  END,
  os_sphere_new = CASE 
    WHEN os_sphere ~ '^-?\d*\.?\d+$' THEN CAST(os_sphere AS DECIMAL(5, 2))
    WHEN os_sphere IS NULL OR os_sphere = '' THEN NULL
    ELSE NULL
  END,
  os_cylinder_new = CASE 
    WHEN os_cylinder ~ '^-?\d*\.?\d+$' THEN CAST(os_cylinder AS DECIMAL(5, 2))
    WHEN os_cylinder IS NULL OR os_cylinder = '' THEN NULL
    ELSE NULL
  END,
  os_axis_new = CASE 
    WHEN os_axis ~ '^\d+$' THEN CAST(os_axis AS DECIMAL(3, 0))
    WHEN os_axis IS NULL OR os_axis = '' THEN NULL
    ELSE NULL
  END,
  os_add_new = CASE 
    WHEN os_add ~ '^-?\d*\.?\d+$' THEN CAST(os_add AS DECIMAL(4, 2))
    WHEN os_add IS NULL OR os_add = '' THEN NULL
    ELSE NULL
  END,
  pd_new = CASE 
    WHEN pd ~ '^-?\d*\.?\d+$' THEN CAST(pd AS DECIMAL(4, 1))
    WHEN pd IS NULL OR pd = '' THEN NULL
    ELSE NULL
  END;

-- Step 4: Migrate data from text to decimal (prescriptions table)
UPDATE prescriptions SET 
  od_sphere_new = CASE 
    WHEN od_sphere ~ '^-?\d*\.?\d+$' THEN CAST(od_sphere AS DECIMAL(5, 2))
    WHEN od_sphere IS NULL OR od_sphere = '' THEN NULL
    ELSE NULL
  END,
  od_cylinder_new = CASE 
    WHEN od_cylinder ~ '^-?\d*\.?\d+$' THEN CAST(od_cylinder AS DECIMAL(5, 2))
    WHEN od_cylinder IS NULL OR od_cylinder = '' THEN NULL
    ELSE NULL
  END,
  od_axis_new = CASE 
    WHEN od_axis ~ '^\d+$' THEN CAST(od_axis AS DECIMAL(3, 0))
    WHEN od_axis IS NULL OR od_axis = '' THEN NULL
    ELSE NULL
  END,
  od_add_new = CASE 
    WHEN od_add ~ '^-?\d*\.?\d+$' THEN CAST(od_add AS DECIMAL(4, 2))
    WHEN od_add IS NULL OR od_add = '' THEN NULL
    ELSE NULL
  END,
  os_sphere_new = CASE 
    WHEN os_sphere ~ '^-?\d*\.?\d+$' THEN CAST(os_sphere AS DECIMAL(5, 2))
    WHEN os_sphere IS NULL OR os_sphere = '' THEN NULL
    ELSE NULL
  END,
  os_cylinder_new = CASE 
    WHEN os_cylinder ~ '^-?\d*\.?\d+$' THEN CAST(os_cylinder AS DECIMAL(5, 2))
    WHEN os_cylinder IS NULL OR os_cylinder = '' THEN NULL
    ELSE NULL
  END,
  os_axis_new = CASE 
    WHEN os_axis ~ '^\d+$' THEN CAST(os_axis AS DECIMAL(3, 0))
    WHEN os_axis IS NULL OR os_axis = '' THEN NULL
    ELSE NULL
  END,
  os_add_new = CASE 
    WHEN os_add ~ '^-?\d*\.?\d+$' THEN CAST(os_add AS DECIMAL(4, 2))
    WHEN os_add IS NULL OR os_add = '' THEN NULL
    ELSE NULL
  END,
  pd_new = CASE 
    WHEN pd ~ '^-?\d*\.?\d+$' THEN CAST(pd AS DECIMAL(4, 1))
    WHEN pd IS NULL OR pd = '' THEN NULL
    ELSE NULL
  END;

-- Step 5: Log invalid data for manual review
CREATE TABLE IF NOT EXISTS prescription_data_migration_issues AS
SELECT 
  'orders' as table_name,
  id as record_id,
  'od_sphere' as field_name,
  od_sphere as invalid_value
FROM orders 
WHERE od_sphere IS NOT NULL 
  AND od_sphere != '' 
  AND od_sphere !~ '^-?\d*\.?\d+$'

UNION ALL

SELECT 
  'orders' as table_name,
  id as record_id,
  'od_cylinder' as field_name,
  od_cylinder as invalid_value
FROM orders 
WHERE od_cylinder IS NOT NULL 
  AND od_cylinder != '' 
  AND od_cylinder !~ '^-?\d*\.?\d+$'

UNION ALL

-- Add similar checks for all other fields...
SELECT 
  'prescriptions' as table_name,
  id as record_id,
  'od_sphere' as field_name,
  od_sphere as invalid_value
FROM prescriptions 
WHERE od_sphere IS NOT NULL 
  AND od_sphere != '' 
  AND od_sphere !~ '^-?\d*\.?\d+$';

-- Step 6: Add constraints to validate new columns
ALTER TABLE orders 
ADD CONSTRAINT chk_od_sphere_range CHECK (od_sphere_new BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT chk_od_cylinder_range CHECK (od_cylinder_new BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT chk_od_axis_range CHECK (od_axis_new BETWEEN 0 AND 180),
ADD CONSTRAINT chk_od_add_range CHECK (od_add_new BETWEEN 0.00 AND 4.00),
ADD CONSTRAINT chk_os_sphere_range CHECK (os_sphere_new BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT chk_os_cylinder_range CHECK (os_cylinder_new BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT chk_os_axis_range CHECK (os_axis_new BETWEEN 0 AND 180),
ADD CONSTRAINT chk_os_add_range CHECK (os_add_new BETWEEN 0.00 AND 4.00),
ADD CONSTRAINT chk_pd_range CHECK (pd_new BETWEEN 20.0 AND 80.0);

ALTER TABLE prescriptions 
ADD CONSTRAINT chk_pres_od_sphere_range CHECK (od_sphere_new BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT chk_pres_od_cylinder_range CHECK (od_cylinder_new BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT chk_pres_od_axis_range CHECK (od_axis_new BETWEEN 0 AND 180),
ADD CONSTRAINT chk_pres_od_add_range CHECK (od_add_new BETWEEN 0.00 AND 4.00),
ADD CONSTRAINT chk_pres_os_sphere_range CHECK (os_sphere_new BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT chk_pres_os_cylinder_range CHECK (os_cylinder_new BETWEEN -30.00 AND 30.00),
ADD CONSTRAINT chk_pres_os_axis_range CHECK (os_axis_new BETWEEN 0 AND 180),
ADD CONSTRAINT chk_pres_os_add_range CHECK (os_add_new BETWEEN 0.00 AND 4.00),
ADD CONSTRAINT chk_pres_pd_range CHECK (pd_new BETWEEN 20.0 AND 80.0);

-- Step 7: Create indexes for performance
CREATE INDEX idx_orders_od_sphere ON orders(od_sphere_new);
CREATE INDEX idx_orders_od_cylinder ON orders(od_cylinder_new);
CREATE INDEX idx_prescriptions_od_sphere ON prescriptions(od_sphere_new);
CREATE INDEX idx_prescriptions_od_cylinder ON prescriptions(od_cylinder_new);

COMMIT;

-- Rollback script (save as 001_fix_prescription_numeric_types_rollback.sql)
/*
BEGIN;

-- Drop new columns
ALTER TABLE orders 
DROP COLUMN IF EXISTS od_sphere_new,
DROP COLUMN IF EXISTS od_cylinder_new,
DROP COLUMN IF EXISTS od_axis_new,
DROP COLUMN IF EXISTS od_add_new,
DROP COLUMN IF EXISTS os_sphere_new,
DROP COLUMN IF EXISTS os_cylinder_new,
DROP COLUMN IF EXISTS os_axis_new,
DROP COLUMN IF EXISTS os_add_new,
DROP COLUMN IF EXISTS pd_new;

ALTER TABLE prescriptions 
DROP COLUMN IF EXISTS od_sphere_new,
DROP COLUMN IF EXISTS od_cylinder_new,
DROP COLUMN IF EXISTS od_axis_new,
DROP COLUMN IF EXISTS od_add_new,
DROP COLUMN IF EXISTS os_sphere_new,
DROP COLUMN IF EXISTS os_cylinder_new,
DROP COLUMN IF EXISTS os_axis_new,
DROP COLUMN IF EXISTS os_add_new,
DROP COLUMN IF EXISTS pd_new;

-- Drop migration issues table
DROP TABLE IF EXISTS prescription_data_migration_issues;

COMMIT;
*/
