-- Migration: add pdf_url and pdf_error_message to orders
-- Generated: 2025-11-06
-- NOTE: Run this migration using your migrations tooling (drizzle-kit or psql) in the target environment.

ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS pdf_error_message TEXT;

-- Optional: add an index if you plan to query by pdf_url frequently
-- CREATE INDEX IF NOT EXISTS idx_orders_pdf_url ON orders (pdf_url);
