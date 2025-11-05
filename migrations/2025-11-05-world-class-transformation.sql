-- =====================================================
-- World-Class Platform Transformation - Database Schema Updates
-- =====================================================
--
-- This migration adds support for:
-- 1. Shopify bidirectional sync (products)
-- 2. Usage-based billing tracking
-- 3. API keys and custom webhooks
-- 4. Enhanced product fields
-- 5. Clinical anomaly tracking
--
-- Run this migration after backing up your database
-- =====================================================

-- =====================================================
-- 1. SHOPIFY INTEGRATION ENHANCEMENTS
-- =====================================================

-- Add Shopify mapping fields to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS shopify_product_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS shopify_variant_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS shopify_inventory_item_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS shopify_sync_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_shopify_sync TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_products_shopify_product ON products(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_products_shopify_variant ON products(shopify_variant_id);
CREATE INDEX IF NOT EXISTS idx_products_shopify_inventory ON products(shopify_inventory_item_id);

-- Add Shopify webhook secret to companies (for signature verification)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS shopify_webhook_secret VARCHAR(255);

-- Add default ECP ID for auto-created patients from Shopify
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS default_ecp_id VARCHAR(255) REFERENCES users(id);

-- =====================================================
-- 2. USAGE-BASED BILLING SYSTEM
-- =====================================================

-- Usage records table for metered billing
CREATE TABLE IF NOT EXISTS usage_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric VARCHAR(50) NOT NULL, -- 'order', 'invoice', 'storage', 'api_call', 'ai_job'
  quantity DECIMAL(10, 4) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB,
  reported_to_stripe BOOLEAN DEFAULT false,
  reported_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_company_date ON usage_records(company_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_metric ON usage_records(metric);
CREATE INDEX IF NOT EXISTS idx_usage_unreported ON usage_records(company_id, reported_to_stripe) WHERE NOT reported_to_stripe;
CREATE INDEX IF NOT EXISTS idx_usage_company_metric ON usage_records(company_id, metric, timestamp);

-- Add billing period tracking to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS billing_period_start DATE,
  ADD COLUMN IF NOT EXISTS billing_period_end DATE,
  ADD COLUMN IF NOT EXISTS usage_billing_enabled BOOLEAN DEFAULT false;

-- =====================================================
-- 3. PUBLIC API & AUTHENTICATION
-- =====================================================

-- API keys table for developer access
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt hash of the API key
  key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for identification (e.g., 'sk_live_abc')
  environment VARCHAR(20) NOT NULL DEFAULT 'production', -- 'production' or 'sandbox'
  active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100, -- requests per minute
  scopes JSONB, -- Array of allowed scopes ['orders:read', 'products:write', etc.]
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_company ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(company_id, active) WHERE active = true;

-- =====================================================
-- 4. CUSTOM WEBHOOKS REGISTRY
-- =====================================================

-- Custom webhooks table (for enterprise integrations)
CREATE TABLE IF NOT EXISTS custom_webhooks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'order.shipped', 'product.low_stock', etc.
  target_url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL, -- For HMAC signature
  active BOOLEAN DEFAULT true,
  description TEXT,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_triggered_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMP,
  last_failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhooks_company_event ON custom_webhooks(company_id, event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON custom_webhooks(company_id, active) WHERE active = true;

-- Webhook delivery logs (for debugging and reliability)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id VARCHAR NOT NULL REFERENCES custom_webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'retrying'
  http_status_code INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status, created_at);

-- =====================================================
-- 5. CLINICAL ANOMALY DETECTION
-- =====================================================

-- Clinical anomalies table
CREATE TABLE IF NOT EXISTS clinical_anomalies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id VARCHAR NOT NULL REFERENCES eye_examinations(id) ON DELETE CASCADE,
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ecp_id VARCHAR NOT NULL REFERENCES users(id),
  
  -- Anomaly details
  metric VARCHAR(100) NOT NULL, -- 'IOP', 'visual_acuity', 'refraction_shift', etc.
  current_value DECIMAL(10, 2) NOT NULL,
  expected_min DECIMAL(10, 2),
  expected_max DECIMAL(10, 2),
  percentile_rank DECIMAL(5, 2), -- 0-100
  z_score DECIMAL(5, 2), -- Statistical significance
  
  -- Classification
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
  anomaly_type VARCHAR(50) NOT NULL, -- 'statistical_outlier', 'rapid_change', 'threshold_exceeded'
  confidence DECIMAL(3, 2) NOT NULL, -- 0.00-1.00
  
  -- Recommendation
  recommendation TEXT NOT NULL,
  follow_up_required BOOLEAN DEFAULT false,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'acknowledged', 'resolved', 'false_positive'
  acknowledged_by VARCHAR REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_anomalies_examination ON clinical_anomalies(examination_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_patient ON clinical_anomalies(patient_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_company ON clinical_anomalies(company_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON clinical_anomalies(status, created_at);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON clinical_anomalies(severity, status);

-- =====================================================
-- 6. OMA VALIDATION & ORDER TRIAGE
-- =====================================================

-- OMA validation results table
CREATE TABLE IF NOT EXISTS oma_validations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Validation results
  valid BOOLEAN NOT NULL,
  errors JSONB, -- Array of error messages
  warnings JSONB, -- Array of warning messages
  complexity VARCHAR(20) NOT NULL, -- 'simple', 'moderate', 'complex'
  
  -- Routing decision
  suggested_queue VARCHAR(50) NOT NULL, -- 'lab_tech', 'engineer', 'quality_team'
  auto_approved BOOLEAN DEFAULT false,
  assigned_to VARCHAR(50), -- The queue it was actually assigned to
  
  -- Analysis details
  prescription_match BOOLEAN,
  frame_tracing_analysis JSONB,
  manufacturing_notes TEXT,
  
  validated_at TIMESTAMP DEFAULT NOW(),
  validated_by VARCHAR, -- System or user ID
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_oma_validations_order ON oma_validations(order_id);
CREATE INDEX IF NOT EXISTS idx_oma_validations_company ON oma_validations(company_id);
CREATE INDEX IF NOT EXISTS idx_oma_validations_complexity ON oma_validations(complexity);
CREATE INDEX IF NOT EXISTS idx_oma_validations_queue ON oma_validations(suggested_queue);

-- Add OMA validation fields to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS oma_validated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS oma_validation_id VARCHAR REFERENCES oma_validations(id),
  ADD COLUMN IF NOT EXISTS assigned_queue VARCHAR(50), -- 'lab_tech', 'engineer'
  ADD COLUMN IF NOT EXISTS complexity_score DECIMAL(3, 2); -- 0.00-1.00

-- =====================================================
-- 7. PATIENT ENHANCEMENTS (Shopify Integration)
-- =====================================================

-- Add Shopify customer mapping to patients
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS shopify_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_shopify_sync TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_patients_shopify_customer ON patients(shopify_customer_id);

-- =====================================================
-- 8. NOTIFICATIONS ENHANCEMENTS
-- =====================================================

-- Add clinical anomaly notification type
-- (Assuming notifications table exists, add new type to enum if needed)
-- This may require manual enum update depending on your setup

-- =====================================================
-- 9. SYSTEM HEALTH & MONITORING
-- =====================================================

-- Event audit log (for debugging event bus)
CREATE TABLE IF NOT EXISTS event_audit_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  company_id VARCHAR REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id),
  payload JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_audit_type ON event_audit_log(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_event_audit_company ON event_audit_log(company_id, created_at);

-- =====================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert default API scopes reference data (you can customize)
CREATE TABLE IF NOT EXISTS api_scopes (
  scope VARCHAR(100) PRIMARY KEY,
  description TEXT,
  resource VARCHAR(50) NOT NULL, -- 'orders', 'products', 'patients', etc.
  action VARCHAR(20) NOT NULL -- 'read', 'write', 'delete'
);

INSERT INTO api_scopes (scope, description, resource, action) VALUES
  ('orders:read', 'Read access to orders', 'orders', 'read'),
  ('orders:write', 'Create and update orders', 'orders', 'write'),
  ('products:read', 'Read access to products', 'products', 'read'),
  ('products:write', 'Create and update products', 'products', 'write'),
  ('patients:read', 'Read access to patients', 'patients', 'read'),
  ('patients:write', 'Create and update patients', 'patients', 'write'),
  ('prescriptions:read', 'Read access to prescriptions', 'prescriptions', 'read'),
  ('prescriptions:validate', 'Validate prescriptions', 'prescriptions', 'write'),
  ('webhooks:manage', 'Manage webhook subscriptions', 'webhooks', 'write'),
  ('analytics:read', 'Read access to analytics', 'analytics', 'read')
ON CONFLICT (scope) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  description TEXT,
  applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description) VALUES
  ('2025-11-05-world-class-transformation', 'World-Class Platform Transformation: Omnichannel POS, Usage Billing, Public API, Clinical AI')
ON CONFLICT (version) DO NOTHING;

-- Grant permissions (adjust based on your user setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON TABLE usage_records IS 'Tracks usage metrics for metered billing (orders, invoices, storage, API calls, AI jobs)';
COMMENT ON TABLE api_keys IS 'API keys for developer access to public API';
COMMENT ON TABLE custom_webhooks IS 'Custom webhook registrations for enterprise integrations';
COMMENT ON TABLE clinical_anomalies IS 'AI-detected clinical anomalies from eye examinations';
COMMENT ON TABLE oma_validations IS 'Automated validation results for OMA files';
