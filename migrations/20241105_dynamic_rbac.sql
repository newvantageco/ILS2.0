-- =====================================================
-- Dynamic RBAC Migration
-- Transforms hardcoded roles into database-driven system
-- =====================================================

-- Step 1: Add plan_level to permissions table
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS plan_level VARCHAR(50) DEFAULT 'free';

-- Add comment for clarity
COMMENT ON COLUMN permissions.plan_level IS 'Minimum subscription plan required: free, full, add_on_analytics';

-- Step 2: Create dynamic roles table (company-specific)
CREATE TABLE IF NOT EXISTS dynamic_roles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_default BOOLEAN DEFAULT FALSE, -- System defaults can't be deleted
  is_deletable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Ensure unique role names per company
  UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_dynamic_roles_company ON dynamic_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_roles_system_default ON dynamic_roles(is_system_default);

COMMENT ON TABLE dynamic_roles IS 'Company-specific roles that tenants can create and customize';
COMMENT ON COLUMN dynamic_roles.is_system_default IS 'True for default roles created on company signup (ECP, Admin, etc)';
COMMENT ON COLUMN dynamic_roles.is_deletable IS 'False for protected roles like Admin';

-- Step 3: Create dynamic_role_permissions junction table
CREATE TABLE IF NOT EXISTS dynamic_role_permissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id VARCHAR NOT NULL REFERENCES dynamic_roles(id) ON DELETE CASCADE,
  permission_id VARCHAR NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate permission assignments
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_dynamic_role_permissions_role ON dynamic_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_role_permissions_permission ON dynamic_role_permissions(permission_id);

-- Step 4: Create user_dynamic_roles junction table (replaces single user.role)
CREATE TABLE IF NOT EXISTS user_dynamic_roles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id VARCHAR NOT NULL REFERENCES dynamic_roles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- For UI display purposes
  assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
  assigned_by VARCHAR REFERENCES users(id),
  
  -- Prevent duplicate role assignments
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_dynamic_roles_user ON user_dynamic_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dynamic_roles_role ON user_dynamic_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_dynamic_roles_primary ON user_dynamic_roles(user_id, is_primary);

COMMENT ON TABLE user_dynamic_roles IS 'Many-to-many relationship: users can have multiple roles';
COMMENT ON COLUMN user_dynamic_roles.is_primary IS 'The primary role shown in UI (for display/dashboard purposes only)';

-- Step 5: Add is_owner flag to users table (for company ownership)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_owner ON users(company_id, is_owner);

COMMENT ON COLUMN users.is_owner IS 'True for company owner - has all permissions, can designate other owners';

-- Step 6: Create permission_categories helper table
CREATE TABLE IF NOT EXISTS permission_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_permission_categories_order ON permission_categories(display_order);

COMMENT ON TABLE permission_categories IS 'Organizes permissions into categories for the role management UI';

-- Step 7: Update permissions table to reference categories
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS category_id VARCHAR REFERENCES permission_categories(id);

-- Migrate existing category text to category_id (will be handled in seed script)

-- Step 8: Create audit table for role changes
CREATE TABLE IF NOT EXISTS role_change_audit (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  changed_by VARCHAR REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- 'role_created', 'role_updated', 'role_deleted', 'permission_assigned', 'permission_revoked', 'user_role_assigned', 'user_role_removed'
  role_id VARCHAR REFERENCES dynamic_roles(id) ON DELETE SET NULL,
  affected_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  permission_id VARCHAR REFERENCES permissions(id) ON DELETE SET NULL,
  details JSONB,
  
  -- For compliance and rollback
  old_value JSONB,
  new_value JSONB
);

CREATE INDEX IF NOT EXISTS idx_role_change_audit_company ON role_change_audit(company_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_user ON role_change_audit(affected_user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_timestamp ON role_change_audit(timestamp DESC);

COMMENT ON TABLE role_change_audit IS 'Comprehensive audit log for all role and permission changes';

-- Step 9: Add session_permissions to sessions table for caching
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS cached_permissions JSONB;

COMMENT ON COLUMN sessions.cached_permissions IS 'Cached array of permission slugs for fast middleware checks';

-- Step 10: Create view for easy permission lookups
CREATE OR REPLACE VIEW user_effective_permissions AS
SELECT 
  u.id AS user_id,
  u.company_id,
  u.is_owner,
  COALESCE(
    -- If owner, return ALL permissions
    CASE WHEN u.is_owner THEN (
      SELECT json_agg(DISTINCT p.permission_key)
      FROM permissions p
      WHERE p.plan_level = 'free' -- Or filtered by company's plan
    )
    ELSE (
      -- Otherwise, aggregate from all assigned roles
      SELECT json_agg(DISTINCT p.permission_key)
      FROM user_dynamic_roles udr
      JOIN dynamic_role_permissions drp ON drp.role_id = udr.role_id
      JOIN permissions p ON p.id = drp.permission_id
      WHERE udr.user_id = u.id
    )
    END,
    '[]'::json
  ) AS permission_keys
FROM users u;

COMMENT ON VIEW user_effective_permissions IS 'Materialized view of all effective permissions per user (including owner override)';

-- Step 11: Create trigger to update updated_at on dynamic_roles
CREATE OR REPLACE FUNCTION update_dynamic_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dynamic_roles_timestamp
BEFORE UPDATE ON dynamic_roles
FOR EACH ROW
EXECUTE FUNCTION update_dynamic_roles_timestamp();

-- Step 12: Add constraints for data integrity
ALTER TABLE dynamic_roles
ADD CONSTRAINT check_role_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Dynamic RBAC schema created successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Run permission seeding script';
  RAISE NOTICE '   2. Create default roles for existing companies';
  RAISE NOTICE '   3. Migrate existing user roles to dynamic_roles system';
END $$;
