-- Add analytics_error_message column to orders so workers can persist analytics failure metadata
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS analytics_error_message text;

-- Optionally index this column if you plan to query failed analytics jobs frequently
-- CREATE INDEX IF NOT EXISTS idx_orders_analytics_error ON orders (analytics_error_message);
