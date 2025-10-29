-- Add new admin role types
-- Migration: add_admin_roles
-- Date: 2025-10-29

-- Add new values to role enum
ALTER TYPE role ADD VALUE IF NOT EXISTS 'platform_admin';
ALTER TYPE role ADD VALUE IF NOT EXISTS 'company_admin';

-- Add new values to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'platform_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'company_admin';

-- Comments for documentation
COMMENT ON TYPE role IS 'User role types: ecp, admin (deprecated), lab_tech, engineer, supplier, platform_admin (super admin), company_admin (company owner/admin)';
COMMENT ON TYPE user_role IS 'Enhanced user role types including platform_admin and company_admin';
