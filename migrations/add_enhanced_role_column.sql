-- Migration: Add enhanced_role column to users table
-- Date: 2025-10-29

-- Create the user_role_enhanced enum type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE user_role_enhanced AS ENUM (
    'owner',
    'admin',
    'optometrist',
    'dispenser',
    'retail_assistant',
    'lab_tech',
    'engineer',
    'supplier'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add the enhanced_role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS enhanced_role user_role_enhanced;

-- Add an index on enhanced_role for better query performance
CREATE INDEX IF NOT EXISTS idx_users_enhanced_role ON users(enhanced_role);

-- Add a comment to document the column
COMMENT ON COLUMN users.enhanced_role IS 'Enhanced role system with more granular permissions (owner, admin, optometrist, dispenser, retail_assistant, lab_tech, engineer, supplier)';
