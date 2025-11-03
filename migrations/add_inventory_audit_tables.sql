-- Migration: Add Inventory Audit and Enhancement Tables
-- Created: 2025-11-03
-- Description: Adds inventory movements audit trail, product variants, and low stock alerts

-- Create movement_type enum
CREATE TYPE movement_type AS ENUM (
  'sale',
  'refund',
  'adjustment',
  'received',
  'transfer_out',
  'transfer_in',
  'damaged',
  'initial'
);

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Movement details
  movement_type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  
  -- Reference tracking
  reference_type VARCHAR(50),
  reference_id VARCHAR,
  
  -- Audit information
  reason TEXT,
  notes TEXT,
  performed_by VARCHAR NOT NULL REFERENCES users(id),
  
  -- Location tracking (for multi-location support)
  location_id VARCHAR,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for inventory_movements
CREATE INDEX idx_inventory_movements_company ON inventory_movements(company_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_performed_by ON inventory_movements(performed_by);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Variant details
  variant_sku VARCHAR(100) NOT NULL,
  variant_name VARCHAR(255) NOT NULL,
  
  -- Variant attributes
  color VARCHAR(50),
  size VARCHAR(50),
  style VARCHAR(100),
  attributes JSONB,
  
  -- Pricing (can override parent product)
  unit_price DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  
  -- Stock tracking
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  low_stock_threshold INTEGER DEFAULT 10,
  
  -- Variant specific data
  barcode VARCHAR(100),
  image_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for product_variants
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_company ON product_variants(company_id);
CREATE INDEX idx_product_variants_sku ON product_variants(variant_sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);

-- Create low_stock_alerts table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id VARCHAR REFERENCES product_variants(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL,
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  acknowledged_by VARCHAR REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  
  -- Auto-reorder suggestion
  suggested_reorder_quantity INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for low_stock_alerts
CREATE INDEX idx_low_stock_alerts_company ON low_stock_alerts(company_id);
CREATE INDEX idx_low_stock_alerts_product ON low_stock_alerts(product_id);
CREATE INDEX idx_low_stock_alerts_status ON low_stock_alerts(status);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_movements TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_variants TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON low_stock_alerts TO PUBLIC;

COMMENT ON TABLE inventory_movements IS 'Audit trail for all inventory stock movements';
COMMENT ON TABLE product_variants IS 'Product variants for managing different SKUs, colors, sizes, etc.';
COMMENT ON TABLE low_stock_alerts IS 'System-generated alerts for low stock items requiring attention';
