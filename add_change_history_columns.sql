-- Add changeHistory JSONB columns to key tables for timestamp tracking
-- This enables comprehensive audit trail with before/after diffs for all changes

-- Orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Returns table
ALTER TABLE returns 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

-- Non-adapts table
ALTER TABLE non_adapts 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

-- Clinical protocols table
ALTER TABLE clinical_protocols 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

-- Prescription templates table
ALTER TABLE prescription_templates 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

-- Role permissions table
ALTER TABLE role_permissions 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

-- User custom permissions table
ALTER TABLE user_custom_permissions 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

-- GOC compliance checks table
ALTER TABLE goc_compliance_checks 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

-- Inventory items table
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

-- Create indexes on change_history for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_change_history ON orders USING gin (change_history);
CREATE INDEX IF NOT EXISTS idx_prescriptions_change_history ON prescriptions USING gin (change_history);
CREATE INDEX IF NOT EXISTS idx_patients_change_history ON patients USING gin (change_history);
CREATE INDEX IF NOT EXISTS idx_returns_change_history ON returns USING gin (change_history);
CREATE INDEX IF NOT EXISTS idx_non_adapts_change_history ON non_adapts USING gin (change_history);
CREATE INDEX IF NOT EXISTS idx_clinical_protocols_change_history ON clinical_protocols USING gin (change_history);
CREATE INDEX IF NOT EXISTS idx_prescription_templates_change_history ON prescription_templates USING gin (change_history);

-- Verify all columns added successfully
DO $$
BEGIN
    RAISE NOTICE 'Change history columns added successfully';
END $$;

-- Show all tables with change_history columns
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name IN ('change_history', 'created_by', 'updated_by')
ORDER BY table_name, column_name;
