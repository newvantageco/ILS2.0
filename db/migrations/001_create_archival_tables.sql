-- Migration: Create Archival and Historical Data Tables
-- Created: 2025-01-13
-- Purpose: Add comprehensive archival, historical tracking, and audit capabilities

-- ============================================================================
-- ARCHIVED RECORDS TABLE
-- Stores soft-deleted records from any table for recovery
-- ============================================================================
CREATE TABLE IF NOT EXISTS archived_records (
  id VARCHAR(255) PRIMARY KEY,

  -- Original record information
  original_table VARCHAR(255) NOT NULL,
  original_id VARCHAR(255) NOT NULL,
  record_data JSONB NOT NULL,

  -- Metadata
  company_id VARCHAR(255),
  archived_at TIMESTAMP DEFAULT NOW() NOT NULL,
  archived_by VARCHAR(255),
  archive_reason TEXT,

  -- Restore tracking
  restored_at TIMESTAMP,
  restored_by VARCHAR(255),

  -- Permanent deletion tracking
  permanently_deleted_at TIMESTAMP,
  permanently_deleted_by VARCHAR(255),

  -- Tags for categorization
  tags JSONB
);

CREATE INDEX IF NOT EXISTS archived_records_original_table_idx ON archived_records(original_table);
CREATE INDEX IF NOT EXISTS archived_records_original_id_idx ON archived_records(original_id);
CREATE INDEX IF NOT EXISTS archived_records_company_id_idx ON archived_records(company_id);
CREATE INDEX IF NOT EXISTS archived_records_archived_at_idx ON archived_records(archived_at);

-- ============================================================================
-- REPORT ARCHIVES TABLE
-- Stores generated reports for historical retrieval
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_archives (
  id VARCHAR(255) PRIMARY KEY,

  -- Report identification
  report_type VARCHAR(255) NOT NULL,
  report_name VARCHAR(500) NOT NULL,

  -- Report data
  report_data JSONB NOT NULL,
  parameters JSONB,

  -- File storage
  file_url TEXT,
  file_format VARCHAR(50),
  file_size INTEGER,

  -- Metadata
  company_id VARCHAR(255) NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  generated_by VARCHAR(255) NOT NULL,

  -- Time period
  period_start TIMESTAMP,
  period_end TIMESTAMP,

  -- Access tracking
  last_accessed_at TIMESTAMP,
  access_count INTEGER DEFAULT 0 NOT NULL,

  -- Retention
  expires_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,

  -- Tags and categorization
  tags JSONB,
  category VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS report_archives_report_type_idx ON report_archives(report_type);
CREATE INDEX IF NOT EXISTS report_archives_company_id_idx ON report_archives(company_id);
CREATE INDEX IF NOT EXISTS report_archives_generated_at_idx ON report_archives(generated_at);
CREATE INDEX IF NOT EXISTS report_archives_period_start_idx ON report_archives(period_start);
CREATE INDEX IF NOT EXISTS report_archives_expires_at_idx ON report_archives(expires_at);

-- ============================================================================
-- DATA EXPORT LOGS TABLE
-- Tracks all data exports for compliance
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_export_logs (
  id VARCHAR(255) PRIMARY KEY,

  -- Export details
  export_type VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  record_count INTEGER NOT NULL,

  -- Filters and parameters
  filters JSONB,
  date_range JSONB,

  -- File information
  file_url TEXT,
  file_format VARCHAR(50) NOT NULL,
  file_size INTEGER,

  -- Metadata
  company_id VARCHAR(255) NOT NULL,
  exported_at TIMESTAMP DEFAULT NOW() NOT NULL,
  exported_by VARCHAR(255) NOT NULL,

  -- Download tracking
  download_count INTEGER DEFAULT 0 NOT NULL,
  last_downloaded_at TIMESTAMP,

  -- Status
  status VARCHAR(50) DEFAULT 'completed' NOT NULL,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS data_export_logs_export_type_idx ON data_export_logs(export_type);
CREATE INDEX IF NOT EXISTS data_export_logs_company_id_idx ON data_export_logs(company_id);
CREATE INDEX IF NOT EXISTS data_export_logs_exported_at_idx ON data_export_logs(exported_at);

-- ============================================================================
-- HISTORICAL SNAPSHOTS TABLE
-- Point-in-time snapshots for time-travel queries
-- ============================================================================
CREATE TABLE IF NOT EXISTS historical_snapshots (
  id VARCHAR(255) PRIMARY KEY,

  -- Snapshot details
  snapshot_type VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,

  -- Data
  snapshot_data JSONB NOT NULL,
  previous_snapshot_id VARCHAR(255),

  -- Changes
  changes JSONB,
  change_type VARCHAR(50),

  -- Metadata
  company_id VARCHAR(255),
  captured_at TIMESTAMP DEFAULT NOW() NOT NULL,
  captured_by VARCHAR(255),
  trigger_event VARCHAR(255),

  -- Version tracking
  version INTEGER NOT NULL,

  FOREIGN KEY (previous_snapshot_id) REFERENCES historical_snapshots(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS historical_snapshots_entity_type_idx ON historical_snapshots(entity_type);
CREATE INDEX IF NOT EXISTS historical_snapshots_entity_id_idx ON historical_snapshots(entity_id);
CREATE INDEX IF NOT EXISTS historical_snapshots_company_id_idx ON historical_snapshots(company_id);
CREATE INDEX IF NOT EXISTS historical_snapshots_captured_at_idx ON historical_snapshots(captured_at);
CREATE INDEX IF NOT EXISTS historical_snapshots_version_idx ON historical_snapshots(version);

-- ============================================================================
-- AUDIT TRAIL TABLE
-- Comprehensive audit log for all CRUD operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_trail (
  id VARCHAR(255) PRIMARY KEY,

  -- Action details
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,

  -- Before/after data
  before_data JSONB,
  after_data JSONB,
  changes JSONB,

  -- Context
  company_id VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,
  user_role VARCHAR(255),

  -- Request information
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_path TEXT,
  request_method VARCHAR(10),

  -- Timing
  performed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  duration INTEGER,

  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Tags
  tags JSONB
);

CREATE INDEX IF NOT EXISTS audit_trail_action_idx ON audit_trail(action);
CREATE INDEX IF NOT EXISTS audit_trail_entity_type_idx ON audit_trail(entity_type);
CREATE INDEX IF NOT EXISTS audit_trail_entity_id_idx ON audit_trail(entity_id);
CREATE INDEX IF NOT EXISTS audit_trail_company_id_idx ON audit_trail(company_id);
CREATE INDEX IF NOT EXISTS audit_trail_user_id_idx ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS audit_trail_performed_at_idx ON audit_trail(performed_at);

-- ============================================================================
-- DATA RETENTION POLICIES TABLE
-- Define retention rules for different data types
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id VARCHAR(255) PRIMARY KEY,

  -- Policy details
  entity_type VARCHAR(255) NOT NULL,
  policy_name VARCHAR(500) NOT NULL,
  description TEXT,

  -- Retention periods (in days)
  active_retention_days INTEGER NOT NULL,
  archive_retention_days INTEGER NOT NULL,
  total_retention_days INTEGER NOT NULL,

  -- Actions
  auto_archive BOOLEAN DEFAULT TRUE NOT NULL,
  auto_delete BOOLEAN DEFAULT FALSE NOT NULL,

  -- Scope
  company_id VARCHAR(255),
  is_global_policy BOOLEAN DEFAULT FALSE NOT NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS data_retention_policies_entity_type_idx ON data_retention_policies(entity_type);
CREATE INDEX IF NOT EXISTS data_retention_policies_company_id_idx ON data_retention_policies(company_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE archived_records IS 'Stores soft-deleted records for recovery and compliance';
COMMENT ON TABLE report_archives IS 'Historical reports storage for quick retrieval';
COMMENT ON TABLE data_export_logs IS 'Audit trail for all data exports (GDPR, HIPAA compliance)';
COMMENT ON TABLE historical_snapshots IS 'Point-in-time snapshots for time-travel queries';
COMMENT ON TABLE audit_trail IS 'Comprehensive audit log for all operations';
COMMENT ON TABLE data_retention_policies IS 'Data retention rules per entity type';

-- ============================================================================
-- GRANTS (adjust as needed for your database user)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON archived_records TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON report_archives TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_export_logs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON historical_snapshots TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON audit_trail TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_retention_policies TO your_app_user;

-- ============================================================================
-- SAMPLE DATA (optional - for testing)
-- ============================================================================

-- Sample retention policy for orders
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
) VALUES (
  'policy_orders',
  'orders',
  'Order Retention Policy',
  'Keep orders active for 2 years, archived for 5 years (7 years total for compliance)',
  730,    -- 2 years
  1825,   -- 5 years
  2555,   -- 7 years total
  true,
  false,
  true,
  'system'
) ON CONFLICT (id) DO NOTHING;

-- Sample retention policy for invoices
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
) VALUES (
  'policy_invoices',
  'invoices',
  'Invoice Retention Policy',
  'Keep invoices for 7 years per tax law requirements',
  730,    -- 2 years active
  1825,   -- 5 years archived
  2555,   -- 7 years total
  true,
  false,  -- Never auto-delete financial records
  true,
  'system'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
