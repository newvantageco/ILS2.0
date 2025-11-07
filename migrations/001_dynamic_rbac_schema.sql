-- =====================================================
-- DYNAMIC RBAC SCHEMA MIGRATION
-- =====================================================
-- This migration creates the foundation for a GUI-driven,
-- enterprise-grade Role-Based Access Control system.
--
-- Allows company admins to:
-- 1. Create custom roles (e.g., "Trainee Dispenser")
-- 2. Assign granular permissions via checkbox UI
-- 3. Clone existing roles and modify permissions
-- 4. Audit all permission changes
--
-- Run this migration to upgrade from hard-coded roles to dynamic RBAC.
-- =====================================================

-- =====================================================
-- 1. DYNAMIC ROLES TABLE
-- =====================================================
-- Stores company-specific roles (both system defaults and custom)
CREATE TABLE IF NOT EXISTS dynamic_roles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- System Management
  is_system_default BOOLEAN NOT NULL DEFAULT false, -- Created by platform (Admin, ECP, etc.)
  is_deletable BOOLEAN NOT NULL DEFAULT true,        -- Can this role be deleted by users?
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR REFERENCES users(id),
  
  -- Ensure unique role names per company
  CONSTRAINT unique_role_per_company UNIQUE (company_id, name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dynamic_roles_company ON dynamic_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_roles_name ON dynamic_roles(name);
CREATE INDEX IF NOT EXISTS idx_dynamic_roles_system_default ON dynamic_roles(is_system_default);

-- =====================================================
-- 2. DYNAMIC ROLE PERMISSIONS TABLE
-- =====================================================
-- Many-to-many relationship: which permissions does each role have?
CREATE TABLE IF NOT EXISTS dynamic_role_permissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id VARCHAR NOT NULL REFERENCES dynamic_roles(id) ON DELETE CASCADE,
  permission_id VARCHAR NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  granted_by VARCHAR REFERENCES users(id), -- Who assigned this permission to the role?
  
  -- Prevent duplicate permission assignments
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dynamic_role_permissions_role ON dynamic_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_role_permissions_permission ON dynamic_role_permissions(permission_id);

-- =====================================================
-- 3. USER DYNAMIC ROLES TABLE
-- =====================================================
-- Many-to-many: which roles are assigned to each user?
-- A user can have multiple roles (e.g., "ECP" + "Lab Manager")
CREATE TABLE IF NOT EXISTS user_dynamic_roles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id VARCHAR NOT NULL REFERENCES dynamic_roles(id) ON DELETE CASCADE,
  
  -- Primary Role Flag
  -- The user's "main" role (displayed in UI, used for default permissions)
  is_primary BOOLEAN NOT NULL DEFAULT false,
  
  -- Audit Trail
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by VARCHAR REFERENCES users(id), -- Who assigned this role?
  
  -- Prevent duplicate role assignments
  CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_dynamic_roles_user ON user_dynamic_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dynamic_roles_role ON user_dynamic_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_dynamic_roles_primary ON user_dynamic_roles(is_primary);

-- =====================================================
-- 4. ROLE CHANGE AUDIT TABLE
-- =====================================================
-- HIPAA/GDPR Compliance: Track all permission changes
-- "Who changed what permission for which role and when?"
CREATE TABLE IF NOT EXISTS role_change_audit (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Who made the change?
  changed_by VARCHAR REFERENCES users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- What type of change?
  action_type VARCHAR(50) NOT NULL, -- 'role_created', 'role_deleted', 'permission_assigned', 'permission_revoked', 'role_cloned'
  
  -- What was changed?
  role_id VARCHAR REFERENCES dynamic_roles(id) ON DELETE SET NULL,
  permission_id VARCHAR REFERENCES permissions(id) ON DELETE SET NULL,
  
  -- Additional context (JSON for flexibility)
  details JSONB, -- e.g., { "old_value": "...", "new_value": "...", "reason": "..." }
  
  -- IP/User Agent for security
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_change_audit_company ON role_change_audit(company_id);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_changed_by ON role_change_audit(changed_by);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_role ON role_change_audit(role_id);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_timestamp ON role_change_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_action ON role_change_audit(action_type);

-- =====================================================
-- 5. UPDATE TRIGGERS FOR TIMESTAMPS
-- =====================================================

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_dynamic_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to dynamic_roles
DROP TRIGGER IF EXISTS trigger_update_dynamic_roles_timestamp ON dynamic_roles;
CREATE TRIGGER trigger_update_dynamic_roles_timestamp
  BEFORE UPDATE ON dynamic_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_dynamic_roles_timestamp();

-- =====================================================
-- 6. HELPER VIEWS (OPTIONAL - FOR EASY QUERYING)
-- =====================================================

-- View: Get all users with their roles and permissions
CREATE OR REPLACE VIEW user_permissions_summary AS
SELECT 
  u.id AS user_id,
  u.email,
  u.company_id,
  dr.id AS role_id,
  dr.name AS role_name,
  dr.is_system_default,
  udr.is_primary AS is_primary_role,
  p.permission_key,
  p.permission_name,
  p.category AS permission_category
FROM users u
LEFT JOIN user_dynamic_roles udr ON udr.user_id = u.id
LEFT JOIN dynamic_roles dr ON dr.id = udr.role_id
LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
LEFT JOIN permissions p ON p.id = drp.permission_id
ORDER BY u.email, dr.name, p.category, p.permission_key;

-- View: Get all roles with permission counts
CREATE OR REPLACE VIEW role_permissions_summary AS
SELECT 
  dr.id AS role_id,
  dr.company_id,
  dr.name AS role_name,
  dr.description,
  dr.is_system_default,
  dr.is_deletable,
  COUNT(DISTINCT drp.permission_id) AS permission_count,
  COUNT(DISTINCT udr.user_id) AS user_count,
  dr.created_at,
  dr.updated_at
FROM dynamic_roles dr
LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
LEFT JOIN user_dynamic_roles udr ON udr.role_id = dr.id
GROUP BY dr.id, dr.company_id, dr.name, dr.description, dr.is_system_default, dr.is_deletable, dr.created_at, dr.updated_at
ORDER BY dr.company_id, dr.name;

-- =====================================================
-- 7. SEED DEFAULT PERMISSIONS (IF NOT EXISTS)
-- =====================================================
-- These are the permissions that will be assigned to default roles
-- The DefaultRolesService.ts references these by permission_key

-- Note: This assumes your permissions table already exists
-- If you need to seed permissions, do it here or in a separate migration

-- Example permission check:
DO $$
BEGIN
  -- Check if permissions exist, if not, suggest running the seed script
  IF NOT EXISTS (SELECT 1 FROM permissions LIMIT 1) THEN
    RAISE NOTICE 'WARNING: permissions table is empty. Please run seed_permissions.sql';
  END IF;
END $$;

-- =====================================================
-- 8. DATA MIGRATION (OPTIONAL)
-- =====================================================
-- If you have existing users with the old role system,
-- you can migrate them to the new dynamic_roles system here.
-- 
-- Example:
-- 1. For each company, create default roles using DefaultRolesService.ts
-- 2. Assign users to their corresponding dynamic roles
-- 3. Mark their old role column as deprecated
--
-- This is intentionally left as a manual step to avoid data loss.

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables were created
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('dynamic_roles', 'dynamic_role_permissions', 'user_dynamic_roles', 'role_change_audit');
  
  IF table_count = 4 THEN
    RAISE NOTICE '✅ Dynamic RBAC Migration Successful! All 4 tables created.';
  ELSE
    RAISE WARNING '⚠️  Expected 4 tables, found %', table_count;
  END IF;
END $$;

-- Display summary
SELECT 
  '✅ Dynamic RBAC Schema Ready' AS status,
  COUNT(*) FILTER (WHERE table_name = 'dynamic_roles') AS dynamic_roles_exists,
  COUNT(*) FILTER (WHERE table_name = 'dynamic_role_permissions') AS dynamic_role_permissions_exists,
  COUNT(*) FILTER (WHERE table_name = 'user_dynamic_roles') AS user_dynamic_roles_exists,
  COUNT(*) FILTER (WHERE table_name = 'role_change_audit') AS role_change_audit_exists
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('dynamic_roles', 'dynamic_role_permissions', 'user_dynamic_roles', 'role_change_audit');

-- Next Steps:
-- 1. Run this migration: psql -d your_database -f 001_dynamic_rbac_schema.sql
-- 2. Seed permissions if needed: npm run seed:permissions
-- 3. Create default roles for existing companies: npm run seed:default-roles
-- 4. Build the Admin UI for role management
-- 5. Update authentication middleware to use dynamic permissions
