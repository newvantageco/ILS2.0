-- Add Shopify integration fields to companies table
-- Migration: add_shopify_integration
-- Date: 2025-10-29

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS shopify_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shopify_shop_url VARCHAR,
ADD COLUMN IF NOT EXISTS shopify_access_token VARCHAR,
ADD COLUMN IF NOT EXISTS shopify_api_version VARCHAR DEFAULT '2024-10',
ADD COLUMN IF NOT EXISTS shopify_auto_sync BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shopify_last_sync_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS shopify_sync_settings JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN companies.shopify_enabled IS 'Whether Shopify integration is enabled for this company';
COMMENT ON COLUMN companies.shopify_shop_url IS 'Shopify store URL (e.g., mystore.myshopify.com)';
COMMENT ON COLUMN companies.shopify_access_token IS 'Shopify API access token (should be encrypted)';
COMMENT ON COLUMN companies.shopify_api_version IS 'Shopify API version being used';
COMMENT ON COLUMN companies.shopify_auto_sync IS 'Automatically sync Shopify customers as patients';
COMMENT ON COLUMN companies.shopify_last_sync_at IS 'Last time Shopify data was synced';
COMMENT ON COLUMN companies.shopify_sync_settings IS 'JSON settings for Shopify sync (field mappings, filters, etc.)';
