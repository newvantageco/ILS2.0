-- NHS Claims Retry Queue Migration
-- Adds retry queue table for automatic retry of failed PCSE claim submissions
-- Implements exponential backoff: 1h → 4h → 24h

-- ============================================================================
-- NHS Claims Retry Queue Table
-- Manages automatic retry of failed PCSE API submissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS nhs_claims_retry_queue (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  claim_id VARCHAR(255) NOT NULL REFERENCES nhs_claims(id) ON DELETE CASCADE,
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Retry Tracking
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP NOT NULL,

  -- Error Information
  error_message TEXT,
  error_code VARCHAR(50),
  pcse_response JSONB,

  -- Status
  -- pending: Waiting for retry time
  -- retrying: Currently being retried
  -- completed: Successfully submitted
  -- failed: Max retries reached, manual intervention needed
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Find claims ready for retry (most important query)
CREATE INDEX IF NOT EXISTS idx_retry_queue_next_retry
  ON nhs_claims_retry_queue(next_retry_at)
  WHERE status = 'pending';

-- Lookup by claim ID
CREATE INDEX IF NOT EXISTS idx_retry_queue_claim
  ON nhs_claims_retry_queue(claim_id);

-- Filter by company
CREATE INDEX IF NOT EXISTS idx_retry_queue_company
  ON nhs_claims_retry_queue(company_id);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_retry_queue_status
  ON nhs_claims_retry_queue(status);

-- Composite index for company + status queries
CREATE INDEX IF NOT EXISTS idx_retry_queue_company_status
  ON nhs_claims_retry_queue(company_id, status);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================
COMMENT ON TABLE nhs_claims_retry_queue IS
  'Automatic retry queue for failed PCSE claim submissions. Implements exponential backoff: 1h, 4h, 24h.';

COMMENT ON COLUMN nhs_claims_retry_queue.next_retry_at IS
  'When to attempt next retry. Calculated using exponential backoff.';

COMMENT ON COLUMN nhs_claims_retry_queue.retry_count IS
  'Number of retry attempts made (0-3). After max_retries, status becomes failed.';

COMMENT ON COLUMN nhs_claims_retry_queue.pcse_response IS
  'Last PCSE API response (if available) for debugging.';

-- ============================================================================
-- Migration Complete
-- ============================================================================
