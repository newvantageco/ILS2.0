-- NHS e-Referral Service (e-RS) Migration
-- Stores local copies of referrals sent to NHS e-RS
-- Reference: https://digital.nhs.uk/developer/api-catalogue/e-referral-service-fhir

-- ============================================================================
-- Referral Priority Enum
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE nhs_referral_priority AS ENUM (
    'routine',
    'urgent',
    'two_week_wait'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Referral Status Enum
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE nhs_referral_status AS ENUM (
    'draft',
    'ready_to_send',
    'sent',
    'booked',
    'accepted',
    'rejected',
    'cancelled',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- NHS e-Referrals Table
-- Local storage for referrals sent to e-RS
-- ============================================================================
CREATE TABLE IF NOT EXISTS nhs_ereferrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- NHS e-RS identifiers
  ers_referral_id VARCHAR(100),              -- ID from e-RS
  ubrn VARCHAR(20),                           -- Unique Booking Reference Number
  
  -- Patient details
  patient_id VARCHAR(255) REFERENCES patients(id),
  patient_nhs_number VARCHAR(20) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_date_of_birth DATE,
  
  -- Referring practitioner
  referring_user_id VARCHAR(255) REFERENCES users(id),
  referring_practitioner_name VARCHAR(255),
  referring_practitioner_goc VARCHAR(20),     -- GOC number if optometrist
  
  -- Referring organisation
  referring_organisation_ods VARCHAR(20),
  referring_organisation_name VARCHAR(255),
  
  -- Referral details
  specialty VARCHAR(50) NOT NULL,             -- OPHTHALMOLOGY, OPHTHALMOLOGY_MEDICAL, etc.
  specialty_code VARCHAR(10),                 -- NHS specialty code
  priority nhs_referral_priority NOT NULL DEFAULT 'routine',
  referral_reason VARCHAR(100) NOT NULL,
  referral_reason_description TEXT,
  clinical_details TEXT NOT NULL,
  urgency_justification TEXT,
  
  -- Clinical information
  examination_id VARCHAR(255) REFERENCES eye_examinations(id),
  visual_acuity_od VARCHAR(20),
  visual_acuity_os VARCHAR(20),
  iop_od DECIMAL(4,1),
  iop_os DECIMAL(4,1),
  clinical_findings JSONB,
  
  -- Selected service
  selected_service_id VARCHAR(100),
  selected_service_name VARCHAR(255),
  selected_provider VARCHAR(255),
  
  -- Status tracking
  status nhs_referral_status NOT NULL DEFAULT 'draft',
  status_updated_at TIMESTAMP WITH TIME ZONE,
  status_reason TEXT,
  
  -- Appointment details (when booked)
  appointment_date DATE,
  appointment_time TIME,
  appointment_location VARCHAR(255),
  appointment_provider VARCHAR(255),
  
  -- Workflow tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by VARCHAR(255) REFERENCES users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by VARCHAR(255) REFERENCES users(id),
  cancellation_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Attachments tracking
  attachments JSONB DEFAULT '[]',             -- Array of { type, title, uploaded, documentId }
  
  -- e-RS sync status
  ers_synced BOOLEAN DEFAULT FALSE,
  ers_last_sync TIMESTAMP WITH TIME ZONE,
  ers_sync_error TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nhs_ereferrals_company ON nhs_ereferrals(company_id);
CREATE INDEX IF NOT EXISTS idx_nhs_ereferrals_patient ON nhs_ereferrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_nhs_ereferrals_patient_nhs ON nhs_ereferrals(patient_nhs_number);
CREATE INDEX IF NOT EXISTS idx_nhs_ereferrals_ubrn ON nhs_ereferrals(ubrn) WHERE ubrn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nhs_ereferrals_status ON nhs_ereferrals(status);
CREATE INDEX IF NOT EXISTS idx_nhs_ereferrals_priority ON nhs_ereferrals(priority);
CREATE INDEX IF NOT EXISTS idx_nhs_ereferrals_created ON nhs_ereferrals(created_at);

-- ============================================================================
-- NHS e-Referral Attachments Table
-- Stores attachment metadata for referrals
-- ============================================================================
CREATE TABLE IF NOT EXISTS nhs_ereferral_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES nhs_ereferrals(id) ON DELETE CASCADE,
  
  -- Attachment details
  attachment_type VARCHAR(50) NOT NULL,       -- clinical_letter, test_result, image, other
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  mime_type VARCHAR(100),
  file_size INTEGER,
  
  -- Storage
  storage_path TEXT,                          -- Local storage path
  ers_document_id VARCHAR(100),               -- e-RS document ID after upload
  
  -- Status
  uploaded_to_ers BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) REFERENCES users(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_nhs_ereferral_attachments_referral 
  ON nhs_ereferral_attachments(referral_id);

-- ============================================================================
-- NHS e-Referral Status History Table
-- Audit trail of status changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS nhs_ereferral_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES nhs_ereferrals(id) ON DELETE CASCADE,
  
  -- Status change
  from_status nhs_referral_status,
  to_status nhs_referral_status NOT NULL,
  reason TEXT,
  
  -- e-RS details
  ers_event_id VARCHAR(100),
  ers_event_type VARCHAR(50),
  
  -- Who/when
  changed_by VARCHAR(255) REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional data
  metadata JSONB
);

-- Index
CREATE INDEX IF NOT EXISTS idx_nhs_ereferral_status_history_referral 
  ON nhs_ereferral_status_history(referral_id);
CREATE INDEX IF NOT EXISTS idx_nhs_ereferral_status_history_date 
  ON nhs_ereferral_status_history(changed_at);

-- ============================================================================
-- Update trigger for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_nhs_ereferrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_nhs_ereferrals_updated_at ON nhs_ereferrals;
CREATE TRIGGER trg_update_nhs_ereferrals_updated_at
  BEFORE UPDATE ON nhs_ereferrals
  FOR EACH ROW
  EXECUTE FUNCTION update_nhs_ereferrals_updated_at();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE nhs_ereferrals IS 'Local storage for NHS e-Referral Service referrals. Synced with e-RS.';
COMMENT ON TABLE nhs_ereferral_attachments IS 'Attachments for e-Referrals (clinical letters, test results, images).';
COMMENT ON TABLE nhs_ereferral_status_history IS 'Audit trail of referral status changes.';
COMMENT ON COLUMN nhs_ereferrals.ubrn IS 'Unique Booking Reference Number assigned by e-RS.';
COMMENT ON COLUMN nhs_ereferrals.specialty IS 'Ophthalmology specialty code: OPHTHALMOLOGY, OPHTHALMOLOGY_MEDICAL, OPHTHALMOLOGY_SURGICAL, OPTOMETRY, ORTHOPTICS';
