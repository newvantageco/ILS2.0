-- Migration: Add Missing Foreign Key Indexes
-- Date: 2025-12-05
-- Purpose: Add critical indexes on foreign key columns to improve query performance
--          These indexes are essential for JOIN operations and referential integrity checks
--
-- CRITICAL PERFORMANCE FIX: Foreign keys without indexes cause table scans on joins and deletes
--
-- Tables affected: orders, patients, order_timeline, consult_logs
-- Estimated impact: 10-100x faster queries on joined tables and cascading deletes

-- =======================================================================================
-- ORDERS TABLE INDEXES
-- =======================================================================================

-- Index on orders.patient_id (FK to patients table)
-- Used for: Finding all orders for a patient, JOIN operations
-- Query example: SELECT * FROM orders WHERE patient_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_patient_id
ON orders(patient_id);

-- Index on orders.ecp_id (FK to users table)
-- Used for: Finding all orders by ECP, dashboard queries, analytics
-- Query example: SELECT * FROM orders WHERE ecp_id = ? ORDER BY order_date DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_ecp_id
ON orders(ecp_id);

-- Index on orders.company_id (FK to companies table) - May already exist but ensuring
-- Used for: Multi-tenant filtering, company-wide reports
-- Query example: SELECT * FROM orders WHERE company_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_id
ON orders(company_id);

-- Composite index on orders(company_id, status) for dashboard filtering
-- Used for: Company-specific order lists filtered by status
-- Query example: SELECT * FROM orders WHERE company_id = ? AND status = 'pending'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_status
ON orders(company_id, status);

-- Composite index on orders(company_id, order_date) for date-based queries
-- Used for: Recent orders by company, date range reports
-- Query example: SELECT * FROM orders WHERE company_id = ? AND order_date >= ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_date
ON orders(company_id, order_date DESC);

-- Index on orders.status for status-based filtering
-- Used for: Global status views, workflow management
-- Query example: SELECT * FROM orders WHERE status IN ('pending', 'processing')
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status
ON orders(status);

-- Index on orders.order_date for chronological queries
-- Used for: Recent orders, date range filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_order_date
ON orders(order_date DESC);

-- Index on orders.tracking_number for shipment lookups
-- Used for: Quick tracking number searches
-- Query example: SELECT * FROM orders WHERE tracking_number = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tracking_number
ON orders(tracking_number);

-- Index on orders.deleted_at for soft delete filtering
-- Used for: Excluding deleted records efficiently
-- Query example: SELECT * FROM orders WHERE deleted_at IS NULL
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_deleted_at
ON orders(deleted_at) WHERE deleted_at IS NOT NULL;

-- =======================================================================================
-- PATIENTS TABLE INDEXES
-- =======================================================================================

-- Index on patients.ecp_id (FK to users table)
-- Used for: Finding all patients for an ECP, patient list views
-- Query example: SELECT * FROM patients WHERE ecp_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_ecp_id
ON patients(ecp_id);

-- Index on patients.company_id (FK to companies table) - May already exist but ensuring
-- Used for: Multi-tenant filtering, company-wide patient lists
-- Query example: SELECT * FROM patients WHERE company_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_company_id
ON patients(company_id);

-- Composite index on patients(company_id, status) for active patient filtering
-- Used for: Company patient lists filtered by status
-- Query example: SELECT * FROM patients WHERE company_id = ? AND status = 'active'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_company_status
ON patients(company_id, status);

-- Index on patients.email for email lookups
-- Used for: Patient search by email, duplicate detection
-- Query example: SELECT * FROM patients WHERE email = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_email
ON patients(email) WHERE email IS NOT NULL;

-- Index on patients.nhs_number for NHS lookups
-- Used for: NHS patient identification, referral matching
-- Query example: SELECT * FROM patients WHERE nhs_number = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_nhs_number
ON patients(nhs_number) WHERE nhs_number IS NOT NULL;

-- Index on patients.postcode for geographic queries
-- Used for: Location-based analytics, patient mapping
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_postcode
ON patients(postcode) WHERE postcode IS NOT NULL;

-- Index on patients.next_examination_due for recall scheduling
-- Used for: Finding patients due for recall
-- Query example: SELECT * FROM patients WHERE next_examination_due <= CURRENT_DATE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_next_exam_due
ON patients(next_examination_due) WHERE next_examination_due IS NOT NULL;

-- Index on patients.deleted_at for soft delete filtering
-- Used for: Excluding deleted records efficiently
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_deleted_at
ON patients(deleted_at) WHERE deleted_at IS NOT NULL;

-- =======================================================================================
-- ORDER_TIMELINE TABLE INDEXES
-- =======================================================================================

-- Index on order_timeline.order_id (FK to orders table)
-- Used for: Loading timeline history for an order
-- Query example: SELECT * FROM order_timeline WHERE order_id = ? ORDER BY timestamp DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_timeline_order_id
ON order_timeline(order_id);

-- Index on order_timeline.user_id (FK to users table)
-- Used for: Tracking user actions across orders
-- Query example: SELECT * FROM order_timeline WHERE user_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_timeline_user_id
ON order_timeline(user_id);

-- Composite index on order_timeline(order_id, timestamp) for ordered timeline
-- Used for: Fetching timeline in chronological order
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_timeline_order_timestamp
ON order_timeline(order_id, timestamp DESC);

-- =======================================================================================
-- CONSULT_LOGS TABLE INDEXES
-- =======================================================================================

-- Index on consult_logs.order_id (FK to orders table)
-- Used for: Loading consults for a specific order
-- Query example: SELECT * FROM consult_logs WHERE order_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consult_logs_order_id
ON consult_logs(order_id);

-- Index on consult_logs.ecp_id (FK to users table)
-- Used for: Finding all consults by ECP
-- Query example: SELECT * FROM consult_logs WHERE ecp_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consult_logs_ecp_id
ON consult_logs(ecp_id);

-- Index on consult_logs.company_id (FK to companies table)
-- Used for: Multi-tenant filtering
-- Query example: SELECT * FROM consult_logs WHERE company_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consult_logs_company_id
ON consult_logs(company_id);

-- Composite index on consult_logs(company_id, status, priority) for queue management
-- Used for: Loading open consults by priority
-- Query example: SELECT * FROM consult_logs WHERE company_id = ? AND status = 'open' ORDER BY priority
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consult_logs_company_status_priority
ON consult_logs(company_id, status, priority);

-- Index on consult_logs.created_at for chronological queries
-- Used for: Recent consults, date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consult_logs_created_at
ON consult_logs(created_at DESC);

-- =======================================================================================
-- PERFORMANCE STATISTICS
-- =======================================================================================

-- After migration completes, update table statistics for query planner optimization
ANALYZE orders;
ANALYZE patients;
ANALYZE order_timeline;
ANALYZE consult_logs;

-- =======================================================================================
-- VERIFICATION QUERIES
-- =======================================================================================

-- Run these queries to verify indexes were created successfully:
--
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('orders', 'patients', 'order_timeline', 'consult_logs')
-- ORDER BY tablename, indexname;
--
-- Check index usage after deployment:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename IN ('orders', 'patients', 'order_timeline', 'consult_logs')
-- ORDER BY idx_scan DESC;
