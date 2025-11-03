-- Comprehensive schema fix for ILS database
-- This script aligns the database with the TypeScript schema

-- ============== FIX PERMISSIONS TABLE ==============
-- Already done, but verify
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'permissions' AND column_name = 'permission_key'
  ) THEN
    ALTER TABLE permissions ADD COLUMN permission_key VARCHAR NOT NULL;
    UPDATE permissions SET permission_key = name;
    ALTER TABLE permissions ADD CONSTRAINT permissions_permission_key_unique UNIQUE (permission_key);
  END IF;
END $$;

-- ============== FIX USER_CUSTOM_PERMISSIONS TABLE ==============
-- Already done, verify
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_custom_permissions' AND column_name = 'granted_by'
  ) THEN
    ALTER TABLE user_custom_permissions RENAME COLUMN granted_by TO created_by;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_custom_permissions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE user_custom_permissions DROP COLUMN expires_at;
  END IF;
END $$;

-- ============== CREATE/UPDATE ROLE_PERMISSIONS TABLE ==============
CREATE TABLE IF NOT EXISTS role_permissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL,
  permission_id VARCHAR NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_company ON role_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- ============== ENSURE ALL NEW FEATURE TABLES EXIST ==============

-- Returns table (should already exist)
CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id),
  return_reason VARCHAR NOT NULL,
  return_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR NOT NULL REFERENCES users(id),
  status VARCHAR NOT NULL DEFAULT 'pending',
  processing_notes TEXT,
  replacement_order_id VARCHAR REFERENCES orders(id),
  quality_issue_id VARCHAR REFERENCES quality_issues(id),
  metadata JSONB
);

-- Non-adapts table (should already exist)
CREATE TABLE IF NOT EXISTS non_adapts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id),
  reported_by VARCHAR NOT NULL REFERENCES users(id),
  patient_feedback TEXT NOT NULL,
  symptoms JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolution TEXT,
  resolution_type VARCHAR,
  resolved_at TIMESTAMP,
  quality_issue_id VARCHAR REFERENCES quality_issues(id),
  replacement_order_id VARCHAR REFERENCES orders(id),
  metadata JSONB
);

-- GOC Compliance Checks (should already exist)
CREATE TABLE IF NOT EXISTS goc_compliance_checks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  check_type VARCHAR NOT NULL,
  check_date TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR NOT NULL,
  details TEXT,
  action_required BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goc_compliance_company ON goc_compliance_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_goc_compliance_user ON goc_compliance_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_goc_compliance_status ON goc_compliance_checks(status);

-- ============== SUMMARY ==============
SELECT 
  'Database schema migration completed successfully' AS status,
  COUNT(*) FILTER (WHERE table_name = 'permissions') AS permissions_exists,
  COUNT(*) FILTER (WHERE table_name = 'role_permissions') AS role_permissions_exists,
  COUNT(*) FILTER (WHERE table_name = 'user_custom_permissions') AS user_custom_permissions_exists,
  COUNT(*) FILTER (WHERE table_name = 'audit_logs') AS audit_logs_exists,
  COUNT(*) FILTER (WHERE table_name = 'returns') AS returns_exists,
  COUNT(*) FILTER (WHERE table_name = 'non_adapts') AS non_adapts_exists,
  COUNT(*) FILTER (WHERE table_name = 'prescription_templates') AS prescription_templates_exists,
  COUNT(*) FILTER (WHERE table_name = 'clinical_protocols') AS clinical_protocols_exists,
  COUNT(*) FILTER (WHERE table_name = 'goc_compliance_checks') AS goc_compliance_checks_exists
FROM information_schema.tables 
WHERE table_schema = 'public';
