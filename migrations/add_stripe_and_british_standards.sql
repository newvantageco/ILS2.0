-- Migration: Add Stripe Integration and British Optical Standards
-- Date: 2025-10-29
-- Description: Adds Stripe subscription management, separate L/R pupillary distances, 
--              company logos, and British optical compliance fields

-- Add Stripe fields to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS free_trial_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_letterhead_url TEXT,
ADD COLUMN IF NOT EXISTS is_subscription_exempt BOOLEAN DEFAULT FALSE; -- For master admin created companies

-- Create index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer ON companies(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_subscription ON companies(stripe_subscription_id);

-- Update prescriptions table for British standards (separate L/R PD)
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS pd_right DECIMAL(4, 1), -- Right monocular PD (mm)
ADD COLUMN IF NOT EXISTS pd_left DECIMAL(4, 1),  -- Left monocular PD (mm)
ADD COLUMN IF NOT EXISTS binocular_pd DECIMAL(4, 1), -- Total binocular PD (mm)
ADD COLUMN IF NOT EXISTS near_pd DECIMAL(4, 1),  -- Near PD for reading glasses
ADD COLUMN IF NOT EXISTS od_prism_horizontal DECIMAL(4, 2), -- Right eye horizontal prism
ADD COLUMN IF NOT EXISTS od_prism_vertical DECIMAL(4, 2),   -- Right eye vertical prism
ADD COLUMN IF NOT EXISTS od_prism_base VARCHAR(20),         -- Base direction (IN, OUT, UP, DOWN)
ADD COLUMN IF NOT EXISTS os_prism_horizontal DECIMAL(4, 2), -- Left eye horizontal prism  
ADD COLUMN IF NOT EXISTS os_prism_vertical DECIMAL(4, 2),   -- Left eye vertical prism
ADD COLUMN IF NOT EXISTS os_prism_base VARCHAR(20),         -- Base direction
ADD COLUMN IF NOT EXISTS back_vertex_distance DECIMAL(4, 1), -- BVD in mm
ADD COLUMN IF NOT EXISTS prescription_type VARCHAR(50),      -- 'distance', 'reading', 'bifocal', 'varifocal'
ADD COLUMN IF NOT EXISTS dispensing_notes TEXT,              -- Special dispensing instructions
ADD COLUMN IF NOT EXISTS goc_compliant BOOLEAN DEFAULT TRUE, -- General Optical Council compliance
ADD COLUMN IF NOT EXISTS prescriber_goc_number VARCHAR(50);  -- Prescriber's GOC registration

COMMENT ON COLUMN prescriptions.pd_right IS 'Right monocular pupillary distance in mm (British standard)';
COMMENT ON COLUMN prescriptions.pd_left IS 'Left monocular pupillary distance in mm (British standard)';
COMMENT ON COLUMN prescriptions.binocular_pd IS 'Total binocular PD (distance between pupils)';

-- Add British compliance fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS fitting_height_right DECIMAL(4, 1), -- Fitting height for right lens (mm)
ADD COLUMN IF NOT EXISTS fitting_height_left DECIMAL(4, 1),  -- Fitting height for left lens (mm)
ADD COLUMN IF NOT EXISTS frame_measurements JSONB,            -- Store A, B, DBL, ED measurements
ADD COLUMN IF NOT EXISTS dispensed_by VARCHAR(255),           -- Name of dispenser
ADD COLUMN IF NOT EXISTS dispenser_goc_number VARCHAR(50),    -- Dispenser's GOC number
ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMP,              -- When glasses were dispensed
ADD COLUMN IF NOT EXISTS collection_date TIMESTAMP,           -- Expected/actual collection date
ADD COLUMN IF NOT EXISTS aftercare_notes TEXT;                -- Post-dispense care instructions

-- Create Stripe payment records table
CREATE TABLE IF NOT EXISTS stripe_payment_intents (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in pence/cents
  currency VARCHAR(3) DEFAULT 'GBP',
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(255),
  customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_company ON stripe_payment_intents(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_subscription ON stripe_payment_intents(subscription_id);

-- Create subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'created', 'updated', 'cancelled', 'expired', 'trial_ended'
  old_plan VARCHAR(50),
  new_plan VARCHAR(50),
  changed_by VARCHAR(255) REFERENCES users(id), -- NULL if system/stripe webhook
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_company ON subscription_history(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event ON subscription_history(event_type);

-- Create dispense records table (for audit trail)
CREATE TABLE IF NOT EXISTS dispense_records (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  prescription_id VARCHAR(255) REFERENCES prescriptions(id),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id VARCHAR(255) NOT NULL REFERENCES patients(id),
  dispensed_by_user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  dispenser_name VARCHAR(255) NOT NULL,
  dispenser_goc_number VARCHAR(50),
  dispense_date TIMESTAMP DEFAULT NOW() NOT NULL,
  printed_at TIMESTAMP,
  patient_signature TEXT, -- Base64 encoded signature
  dispenser_signature TEXT, -- Base64 encoded signature
  special_instructions TEXT,
  aftercare_provided BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dispense_records_order ON dispense_records(order_id);
CREATE INDEX IF NOT EXISTS idx_dispense_records_company ON dispense_records(company_id);
CREATE INDEX IF NOT EXISTS idx_dispense_records_patient ON dispense_records(patient_id);

-- Add company branding preferences
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS branding_settings JSONB DEFAULT '{
  "primaryColor": "#0f172a",
  "secondaryColor": "#3b82f6",
  "logoPosition": "top-left",
  "showGocNumber": true,
  "includeAftercare": true,
  "dispenseSlipFooter": ""
}'::jsonb;

-- Update AI learning data table to ensure proper isolation
ALTER TABLE ai_learning_data
ADD COLUMN IF NOT EXISTS is_master_training BOOLEAN DEFAULT FALSE, -- True only for platform admin training data
ADD COLUMN IF NOT EXISTS training_version VARCHAR(50),             -- Version of master AI model
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255) REFERENCES users(id); -- Platform admin approval

CREATE INDEX IF NOT EXISTS idx_ai_learning_master ON ai_learning_data(is_master_training) WHERE is_master_training = TRUE;

-- Add patient compliance and history tracking
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS nhs_number VARCHAR(50),            -- UK NHS number
ADD COLUMN IF NOT EXISTS medical_conditions JSONB,          -- Relevant medical history
ADD COLUMN IF NOT EXISTS allergies TEXT,                    -- Known allergies
ADD COLUMN IF NOT EXISTS previous_prescriptions JSONB,      -- Historical prescription data
ADD COLUMN IF NOT EXISTS collection_preferences JSONB;      -- Preferred collection times, notifications

COMMENT ON COLUMN patients.nhs_number IS 'UK National Health Service number for patient identification';

-- Insert default subscription plans as reference data
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  price_monthly_gbp DECIMAL(10, 2),
  price_yearly_gbp DECIMAL(10, 2),
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  features JSONB,
  max_users INTEGER,
  max_orders_per_month INTEGER,
  ai_enabled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

INSERT INTO subscription_plans (id, name, display_name, description, price_monthly_gbp, price_yearly_gbp, features, max_users, max_orders_per_month, ai_enabled)
VALUES 
  ('free_ecp', 'free_ecp', 'Free ECP', 'Basic features for independent opticians', 0, 0, 
   '{"basicOrdering": true, "patientManagement": true, "maxPatients": 100}'::jsonb, 1, 50, FALSE),
  ('professional', 'professional', 'Professional', 'Full features for growing practices', 49.99, 499.99,
   '{"unlimitedPatients": true, "aiAssistant": true, "analytics": true, "multiUser": true}'::jsonb, 5, NULL, TRUE),
  ('enterprise', 'enterprise', 'Enterprise', 'Complete solution for large practices', 149.99, 1499.99,
   '{"unlimitedEverything": true, "prioritySupport": true, "customIntegrations": true, "dedicatedAI": true}'::jsonb, NULL, NULL, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions (adjust based on your user roles)
COMMENT ON TABLE stripe_payment_intents IS 'Stripe payment intent records for subscription payments';
COMMENT ON TABLE subscription_history IS 'Audit log for all subscription changes';
COMMENT ON TABLE dispense_records IS 'Complete audit trail of all dispensed eyewear';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans with pricing and features';
