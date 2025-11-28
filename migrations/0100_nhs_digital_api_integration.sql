-- NHS Digital API Integration Migration
-- Adds tables for NHS API credential management, integration tracking, and audit logging
-- Reference: https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#statuses

-- ============================================================================
-- NHS API Integration Status Enum
-- Maps to NHS Digital API lifecycle statuses
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE nhs_integration_status AS ENUM (
    'in_development',           -- Early prototyping, sandbox testing
    'beta',                     -- Available in production, may have breaking changes
    'in_production',            -- Stable, production ready
    'internal',                 -- Internal use only
    'under_review_deprecation', -- Being considered for deprecation
    'deprecated',               -- Still available but planned for retirement
    'retired'                   -- No longer available
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- NHS API Environment Enum
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE nhs_api_environment AS ENUM (
    'sandbox',      -- Open-access testing
    'integration',  -- Integration testing with credentials
    'production'    -- Live production
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- NHS API Credentials Table
-- Stores API credentials per company (encrypted in production)
-- ============================================================================
CREATE TABLE IF NOT EXISTS nhs_api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- API Platform credentials
  api_key VARCHAR(512) NOT NULL,                  -- Client ID from NHS API Platform
  private_key_encrypted TEXT,                      -- RSA private key (encrypted)
  key_id VARCHAR(100) NOT NULL DEFAULT 'ils-key-1', -- Key ID for JWT header
  
  -- Environment configuration
  environment nhs_api_environment NOT NULL DEFAULT 'sandbox',
  
  -- Onboarding status
  ods_code VARCHAR(20),                           -- Organisation Data Service code
  onboarding_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, approved, rejected
  onboarding_reference VARCHAR(100),               -- Reference number from NHS onboarding
  
  -- Assurance status
  dspt_status VARCHAR(50),                         -- Data Security Protection Toolkit status
  dcb0129_compliant BOOLEAN DEFAULT FALSE,         -- Clinical risk management compliance
  penetration_test_date DATE,                      -- Last pen test date
  penetration_test_passed BOOLEAN,
  
  -- Connection details
  hscn_connected BOOLEAN DEFAULT FALSE,            -- Health and Social Care Network connection
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- One credential set per company per environment
  UNIQUE(company_id, environment)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_nhs_api_credentials_company 
  ON nhs_api_credentials(company_id);
CREATE INDEX IF NOT EXISTS idx_nhs_api_credentials_environment 
  ON nhs_api_credentials(environment);

-- ============================================================================
-- NHS API Integrations Table
-- Tracks which NHS APIs a company is using
-- ============================================================================
CREATE TABLE IF NOT EXISTS nhs_api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- API identification
  api_name VARCHAR(100) NOT NULL,                  -- e.g., 'pds', 'eps', 'mesh'
  api_display_name VARCHAR(255),                   -- Human readable name
  api_version VARCHAR(20),                         -- e.g., 'FHIR/R4'
  
  -- Status tracking (NHS Digital statuses)
  status nhs_integration_status NOT NULL DEFAULT 'in_development',
  
  -- Environment status per environment
  sandbox_enabled BOOLEAN DEFAULT FALSE,
  sandbox_verified_at TIMESTAMP WITH TIME ZONE,
  integration_enabled BOOLEAN DEFAULT FALSE,
  integration_verified_at TIMESTAMP WITH TIME ZONE,
  production_enabled BOOLEAN DEFAULT FALSE,
  production_verified_at TIMESTAMP WITH TIME ZONE,
  production_go_live_date DATE,
  
  -- Assurance tracking
  assurance_method VARCHAR(50),                    -- 'digital_onboarding' or 'scal'
  assurance_reference VARCHAR(100),
  assurance_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage statistics
  last_api_call_at TIMESTAMP WITH TIME ZONE,
  total_api_calls BIGINT DEFAULT 0,
  successful_calls BIGINT DEFAULT 0,
  failed_calls BIGINT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One integration record per API per company
  UNIQUE(company_id, api_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nhs_api_integrations_company 
  ON nhs_api_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_nhs_api_integrations_status 
  ON nhs_api_integrations(status);
CREATE INDEX IF NOT EXISTS idx_nhs_api_integrations_api_name 
  ON nhs_api_integrations(api_name);

-- ============================================================================
-- NHS API Audit Log Table
-- Compliance audit trail for all NHS API interactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS nhs_api_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL,
  
  -- Request details
  api_name VARCHAR(100) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_id UUID NOT NULL,
  
  -- User context
  user_id VARCHAR(255),
  user_role VARCHAR(100),
  
  -- Patient context (for auditing patient data access)
  patient_nhs_number VARCHAR(20),
  patient_id VARCHAR(255),
  
  -- Response details
  response_status INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Security context
  access_token_id VARCHAR(100),                    -- Identifier for the token used
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- NHS requires audit data retention for 8 years
  retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '8 years')
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_nhs_api_audit_company 
  ON nhs_api_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_nhs_api_audit_timestamp 
  ON nhs_api_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_nhs_api_audit_patient 
  ON nhs_api_audit_log(patient_nhs_number) WHERE patient_nhs_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nhs_api_audit_user 
  ON nhs_api_audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nhs_api_audit_api_name 
  ON nhs_api_audit_log(api_name);
CREATE INDEX IF NOT EXISTS idx_nhs_api_audit_request_id 
  ON nhs_api_audit_log(request_id);

-- ============================================================================
-- NHS Onboarding Checklist Table
-- Track compliance requirements for NHS API onboarding
-- ============================================================================
CREATE TABLE IF NOT EXISTS nhs_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Step 1: Developer Account
  developer_account_created BOOLEAN DEFAULT FALSE,
  developer_account_email VARCHAR(255),
  developer_account_created_at TIMESTAMP WITH TIME ZONE,
  
  -- Step 2: ODS Code
  ods_code_obtained BOOLEAN DEFAULT FALSE,
  ods_code VARCHAR(20),
  ods_code_obtained_at TIMESTAMP WITH TIME ZONE,
  
  -- Step 3: Use Case Confirmation
  use_case_submitted BOOLEAN DEFAULT FALSE,
  use_case_approved BOOLEAN DEFAULT FALSE,
  use_case_reference VARCHAR(100),
  use_case_submitted_at TIMESTAMP WITH TIME ZONE,
  use_case_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Step 4: HSCN Connection (if required)
  hscn_required BOOLEAN DEFAULT FALSE,
  hscn_connected BOOLEAN DEFAULT FALSE,
  hscn_connection_reference VARCHAR(100),
  hscn_connected_at TIMESTAMP WITH TIME ZONE,
  
  -- Step 5: DSPT (Data Security Protection Toolkit)
  dspt_registered BOOLEAN DEFAULT FALSE,
  dspt_organisation_type VARCHAR(100),            -- 'nhs_business_partner' or 'company'
  dspt_status VARCHAR(50),                        -- 'standards_not_met', 'standards_met', 'exceeding'
  dspt_published_date DATE,
  dspt_expiry_date DATE,
  
  -- Step 6: Clinical Safety (DCB0129)
  dcb0129_process_implemented BOOLEAN DEFAULT FALSE,
  dcb0129_clinical_safety_officer VARCHAR(255),
  dcb0129_hazard_log_completed BOOLEAN DEFAULT FALSE,
  dcb0129_last_review_date DATE,
  
  -- Step 7: Medical Device Classification
  is_medical_device BOOLEAN,
  medical_device_class VARCHAR(50),               -- 'class_I', 'class_IIa', 'class_IIb', 'class_III'
  mhra_registered BOOLEAN DEFAULT FALSE,
  ce_ukca_marked BOOLEAN DEFAULT FALSE,
  
  -- Step 8: Product Assurance
  product_assurance_started BOOLEAN DEFAULT FALSE,
  product_assurance_completed BOOLEAN DEFAULT FALSE,
  test_evidence_submitted BOOLEAN DEFAULT FALSE,
  product_assurance_reference VARCHAR(100),
  
  -- Step 9: Penetration Testing
  pen_test_scheduled BOOLEAN DEFAULT FALSE,
  pen_test_date DATE,
  pen_test_provider VARCHAR(255),
  pen_test_passed BOOLEAN,
  pen_test_report_reference VARCHAR(100),
  
  -- Step 10: Service Desk Registration
  service_desk_registered BOOLEAN DEFAULT FALSE,
  service_desk_portal_access BOOLEAN DEFAULT FALSE,
  service_desk_registered_at TIMESTAMP WITH TIME ZONE,
  
  -- Connection Agreement
  connection_agreement_reviewed BOOLEAN DEFAULT FALSE,
  connection_agreement_signed BOOLEAN DEFAULT FALSE,
  connection_agreement_signatory VARCHAR(255),
  connection_agreement_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Overall progress
  overall_progress_percent INTEGER DEFAULT 0,
  ready_for_production BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_nhs_onboarding_company 
  ON nhs_onboarding_checklist(company_id);

-- ============================================================================
-- Add NHS Number validation to patients table if not exists
-- ============================================================================
DO $$
BEGIN
  -- Add nhs_number_verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'nhs_number_verified'
  ) THEN
    ALTER TABLE patients ADD COLUMN nhs_number_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add nhs_number_verified_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'nhs_number_verified_at'
  ) THEN
    ALTER TABLE patients ADD COLUMN nhs_number_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add pds_last_sync column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'pds_last_sync'
  ) THEN
    ALTER TABLE patients ADD COLUMN pds_last_sync TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================================================
-- Helper function to calculate onboarding progress
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_nhs_onboarding_progress(checklist_id UUID)
RETURNS INTEGER AS $$
DECLARE
  progress INTEGER := 0;
  total_steps INTEGER := 10;
  completed_steps INTEGER := 0;
  rec RECORD;
BEGIN
  SELECT * INTO rec FROM nhs_onboarding_checklist WHERE id = checklist_id;
  
  IF rec IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count completed steps
  IF rec.developer_account_created THEN completed_steps := completed_steps + 1; END IF;
  IF rec.ods_code_obtained THEN completed_steps := completed_steps + 1; END IF;
  IF rec.use_case_approved THEN completed_steps := completed_steps + 1; END IF;
  IF NOT rec.hscn_required OR rec.hscn_connected THEN completed_steps := completed_steps + 1; END IF;
  IF rec.dspt_status = 'standards_met' OR rec.dspt_status = 'exceeding' THEN completed_steps := completed_steps + 1; END IF;
  IF rec.dcb0129_process_implemented THEN completed_steps := completed_steps + 1; END IF;
  IF rec.is_medical_device IS NOT NULL THEN completed_steps := completed_steps + 1; END IF;
  IF rec.product_assurance_completed THEN completed_steps := completed_steps + 1; END IF;
  IF rec.pen_test_passed THEN completed_steps := completed_steps + 1; END IF;
  IF rec.service_desk_registered THEN completed_steps := completed_steps + 1; END IF;
  
  progress := (completed_steps * 100) / total_steps;
  
  -- Update the record
  UPDATE nhs_onboarding_checklist 
  SET overall_progress_percent = progress,
      ready_for_production = (progress = 100 AND rec.connection_agreement_signed),
      updated_at = NOW()
  WHERE id = checklist_id;
  
  RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger to update progress on checklist changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_nhs_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_nhs_onboarding_progress(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_nhs_onboarding_progress ON nhs_onboarding_checklist;
CREATE TRIGGER trg_update_nhs_onboarding_progress
  AFTER INSERT OR UPDATE ON nhs_onboarding_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_nhs_onboarding_progress();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE nhs_api_credentials IS 'Stores NHS API Platform credentials per company. Private keys should be encrypted at rest.';
COMMENT ON TABLE nhs_api_integrations IS 'Tracks which NHS Digital APIs each company is integrated with and their status.';
COMMENT ON TABLE nhs_api_audit_log IS 'Compliance audit trail for all NHS API interactions. Retention: 8 years per NHS requirements.';
COMMENT ON TABLE nhs_onboarding_checklist IS 'Tracks progress through NHS API onboarding requirements per company.';
