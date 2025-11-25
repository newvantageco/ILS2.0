-- Migration: Add missing tables for billing and AI analytics
-- These tables are required by BillingService and AnalyticsService
-- Date: 2025-11-24

-- Insurance Companies Table
CREATE TABLE IF NOT EXISTS insurance_companies (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  payer_id VARCHAR(100),
  npi VARCHAR(20),
  address JSONB,
  phone VARCHAR(50),
  fax VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  edi_trading_partner_id VARCHAR(100),
  clearinghouse VARCHAR(100),
  claim_submission_method VARCHAR(50),
  attachment_requirements JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_companies_company ON insurance_companies(company_id);

-- Insurance Plans Table
CREATE TABLE IF NOT EXISTS insurance_plans (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  insurance_company_id VARCHAR(255) REFERENCES insurance_companies(id) ON DELETE CASCADE,
  plan_name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  plan_id VARCHAR(100),
  group_id VARCHAR(100),
  copayment_amount DECIMAL(10, 2),
  deductible_amount DECIMAL(10, 2),
  coinsurance_percentage DECIMAL(5, 2),
  out_of_pocket_maximum DECIMAL(10, 2),
  vision_coverage JSONB,
  exam_coverage JSONB,
  materials_coverage JSONB,
  preauthorization_required BOOLEAN DEFAULT false,
  referral_required BOOLEAN DEFAULT false,
  timely_filing_days INTEGER,
  effective_date TIMESTAMP,
  termination_date TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_plans_company ON insurance_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_plans_insurance_company ON insurance_plans(insurance_company_id);

-- AI Analyses Table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
  model_type VARCHAR(100) NOT NULL,
  analysis_type VARCHAR(100) NOT NULL,
  confidence DECIMAL(5, 4),
  input_data JSONB,
  output_data JSONB,
  processing_time_ms INTEGER,
  error_message TEXT,
  user_id VARCHAR(255) REFERENCES users(id),
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_company ON ai_analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_model_type ON ai_analyses(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at);

-- Patient Insurance Table
CREATE TABLE IF NOT EXISTS patient_insurance (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  insurance_plan_id VARCHAR(255) REFERENCES insurance_plans(id),
  member_id VARCHAR(100),
  subscriber_id VARCHAR(100),
  group_number VARCHAR(100),
  subscriber_first_name VARCHAR(100),
  subscriber_last_name VARCHAR(100),
  subscriber_dob TIMESTAMP,
  relationship_to_subscriber VARCHAR(50),
  priority INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active',
  effective_date TIMESTAMP,
  termination_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_insurance_company ON patient_insurance(company_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient ON patient_insurance(patient_id);

-- Eligibility Verifications Table
CREATE TABLE IF NOT EXISTS eligibility_verifications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  insurance_plan_id VARCHAR(255) REFERENCES insurance_plans(id),
  verification_date TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_by VARCHAR(255) REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  eligibility_status VARCHAR(50),
  coverage_details JSONB,
  copay_amount DECIMAL(10, 2),
  deductible_remaining DECIMAL(10, 2),
  out_of_pocket_remaining DECIMAL(10, 2),
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eligibility_verifications_company ON eligibility_verifications(company_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_verifications_patient ON eligibility_verifications(patient_id);

-- Preauthorizations Table
CREATE TABLE IF NOT EXISTS preauthorizations (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  insurance_plan_id VARCHAR(255) REFERENCES insurance_plans(id),
  request_date TIMESTAMP NOT NULL DEFAULT NOW(),
  requested_by VARCHAR(255) REFERENCES users(id),
  service_type VARCHAR(100),
  procedure_codes JSONB,
  diagnosis_codes JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  authorization_number VARCHAR(100),
  approved_units INTEGER,
  approved_amount DECIMAL(10, 2),
  effective_date TIMESTAMP,
  expiration_date TIMESTAMP,
  denial_reason TEXT,
  notes TEXT,
  response_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preauthorizations_company ON preauthorizations(company_id);
CREATE INDEX IF NOT EXISTS idx_preauthorizations_patient ON preauthorizations(patient_id);

-- Medical Claims Table
CREATE TABLE IF NOT EXISTS medical_claims (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  insurance_plan_id VARCHAR(255) REFERENCES insurance_plans(id),
  claim_number VARCHAR(50) NOT NULL,
  claim_type VARCHAR(50) DEFAULT 'professional',
  status VARCHAR(50) DEFAULT 'draft',
  service_date TIMESTAMP NOT NULL,
  place_of_service VARCHAR(10),
  diagnosis_codes JSONB,
  total_charges DECIMAL(10, 2),
  allowed_amount DECIMAL(10, 2),
  paid_amount DECIMAL(10, 2),
  patient_responsibility DECIMAL(10, 2),
  adjustment_amount DECIMAL(10, 2),
  adjustment_reasons JSONB,
  submitted_at TIMESTAMP,
  processed_at TIMESTAMP,
  denial_reason TEXT,
  notes TEXT,
  created_by VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_claims_company ON medical_claims(company_id);
CREATE INDEX IF NOT EXISTS idx_medical_claims_patient ON medical_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_claims_claim_number ON medical_claims(claim_number);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id VARCHAR(255) REFERENCES patients(id),
  claim_id VARCHAR(255) REFERENCES medical_claims(id),
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50),
  payment_source VARCHAR(50),
  check_number VARCHAR(50),
  reference_number VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  processed_date TIMESTAMP,
  notes TEXT,
  created_by VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_claim ON payments(claim_id);

-- Billing Codes Table
CREATE TABLE IF NOT EXISTS billing_codes (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  code_type VARCHAR(20) NOT NULL,
  description TEXT,
  short_description VARCHAR(255),
  category VARCHAR(100),
  default_fee DECIMAL(10, 2),
  unit_type VARCHAR(20),
  modifiers JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_date TIMESTAMP,
  termination_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_codes_company ON billing_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_codes_code ON billing_codes(code);

-- Add company_id to claim_line_items if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='claim_line_items' AND column_name='company_id') THEN
    ALTER TABLE claim_line_items ADD COLUMN company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
