-- ===================================================================
-- COMPREHENSIVE DATABASE SCHEMA SYNCHRONIZATION FOR ILS 2.0
-- Run this to sync your local database with shared/schema.ts
-- ===================================================================

BEGIN;

-- 1. COMPANIES TABLE - Add all missing Shopify columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS shopify_shop_name VARCHAR(255);

-- 2. ORDERS TABLE - Add PDF and analytics columns (already done but keeping for completeness)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pdf_error_message TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS analytics_error_message TEXT;

-- 3. Verify all critical indexes exist
CREATE INDEX IF NOT EXISTS idx_companies_shopify_shop ON companies(shopify_shop_name);
CREATE INDEX IF NOT EXISTS idx_orders_pdf_status ON orders(pdf_url) WHERE pdf_url IS NOT NULL;

COMMIT;

-- Report on schema status
SELECT 
    'Schema synchronization completed successfully' as status,
    NOW() as timestamp;

-- Show all Shopify columns in companies table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND column_name LIKE 'shopify%'
ORDER BY ordinal_position;
