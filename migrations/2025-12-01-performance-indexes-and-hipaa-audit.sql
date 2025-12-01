-- Migration: Performance Indexes and HIPAA Audit Logs Table
-- Date: 2025-12-01
-- Purpose: Add missing performance indexes and create HIPAA-compliant audit logging table

-- ============================================================================
-- HIPAA Audit Logs Table
-- ============================================================================
-- This table stores all access to Protected Health Information (PHI)
-- in compliance with HIPAA requirements (45 CFR 164.312(b))

CREATE TABLE IF NOT EXISTS hipaa_audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id VARCHAR(255),
  user_role VARCHAR(100),
  tenant_id VARCHAR(255),
  action VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(1000) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  phi_accessed BOOLEAN NOT NULL DEFAULT false,
  phi_fields JSONB DEFAULT '[]',
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure')),
  status_code INTEGER NOT NULL,
  failure_reason TEXT,
  request_body JSONB,
  response_time INTEGER NOT NULL,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for HIPAA audit logs (for compliance reporting and investigations)
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_timestamp ON hipaa_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_user ON hipaa_audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_tenant ON hipaa_audit_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_resource ON hipaa_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_phi ON hipaa_audit_logs(phi_accessed, timestamp DESC) WHERE phi_accessed = true;
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_failures ON hipaa_audit_logs(outcome, timestamp DESC) WHERE outcome = 'failure';

-- Comment for documentation
COMMENT ON TABLE hipaa_audit_logs IS 'HIPAA-compliant audit log for all PHI access. Retention: 6 years per HIPAA requirements.';

-- ============================================================================
-- Performance Indexes for Orders Table
-- ============================================================================

-- Compound index for tenant + status queries (most common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_status
  ON orders(company_id, status);

-- Index for tenant + date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_created
  ON orders(company_id, created_at DESC);

-- Index for ECP's orders lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_ecp_status
  ON orders(ecp_id, status) WHERE status NOT IN ('completed', 'cancelled');

-- Index for patient's orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_patient
  ON orders(patient_id, created_at DESC);

-- ============================================================================
-- Performance Indexes for Patients Table
-- ============================================================================

-- Compound index for tenant + name search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_company_name
  ON patients(company_id, last_name, first_name);

-- Index for email lookup within tenant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_company_email
  ON patients(company_id, email);

-- Full-text search index for patient search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_search
  ON patients USING gin(
    to_tsvector('english',
      COALESCE(first_name, '') || ' ' ||
      COALESCE(last_name, '') || ' ' ||
      COALESCE(email, '')
    )
  );

-- ============================================================================
-- Performance Indexes for AI Tables
-- ============================================================================

-- AI conversations lookup by tenant and user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_conversations_company_user
  ON ai_conversations(company_id, user_id, updated_at DESC);

-- AI messages by conversation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_conversation
  ON ai_messages(conversation_id, created_at);

-- AI knowledge base search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_knowledge_base_company
  ON ai_knowledge_base(company_id, category);

-- ============================================================================
-- Performance Indexes for Invoices
-- ============================================================================

-- Invoice status lookup within tenant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_company_status
  ON invoices(company_id, status);

-- Overdue invoices lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_company_due
  ON invoices(company_id, due_date) WHERE status IN ('draft', 'sent', 'overdue');

-- Patient invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_patient
  ON invoices(patient_id, created_at DESC);

-- ============================================================================
-- Performance Indexes for Appointments
-- ============================================================================

-- Upcoming appointments lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_company_date
  ON appointment_bookings(company_id, start_time) WHERE status NOT IN ('cancelled', 'no_show');

-- Patient appointments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_patient
  ON appointment_bookings(patient_id, start_time DESC);

-- Practitioner schedule
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_practitioner
  ON appointment_bookings(practitioner_id, start_time) WHERE status NOT IN ('cancelled', 'no_show');

-- ============================================================================
-- Performance Indexes for Audit Logs
-- ============================================================================

-- General audit log queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_company_date
  ON audit_logs(company_id, created_at DESC);

-- User activity audit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action
  ON audit_logs(user_id, action, created_at DESC);

-- ============================================================================
-- Performance Indexes for Insurance Claims
-- ============================================================================

-- Claim status lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_claims_company_status
  ON insurance_claims(company_id, status);

-- Patient claims
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_claims_patient
  ON insurance_claims(patient_id, submission_date DESC);

-- ============================================================================
-- Performance Indexes for Products/Inventory
-- ============================================================================

-- Product lookup by tenant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_category
  ON products(company_id, category);

-- Inventory alerts (low stock)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_low_stock
  ON inventory(company_id, current_quantity) WHERE current_quantity <= reorder_point;

-- ============================================================================
-- Session Table Cleanup Index (if not exists)
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expire
  ON sessions(expire);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user
  ON sessions(user_id);

-- ============================================================================
-- Analysis of Index Usage (run manually to monitor)
-- ============================================================================

-- To check index usage statistics:
-- SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- To find missing indexes:
-- SELECT schemaname, relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
-- FROM pg_stat_user_tables
-- WHERE seq_scan > idx_scan AND seq_scan > 1000
-- ORDER BY seq_scan DESC;
