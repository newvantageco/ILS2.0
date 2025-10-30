-- ============================================
-- Multi-Tenant, POS, Analytics & PDF Features
-- ============================================

-- Add tenant isolation columns to existing tables (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id) ON DELETE CASCADE;

-- Create indexes for tenant isolation
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_patients_company_id ON patients(company_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_company_id ON prescriptions(company_id);

-- Add OTC retail fields to existing products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_prescription_required BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ============================================
-- POS Transactions
-- ============================================
CREATE TABLE IF NOT EXISTS pos_transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transaction_number VARCHAR(50) NOT NULL,
  staff_id VARCHAR NOT NULL REFERENCES users(id),
  patient_id VARCHAR REFERENCES patients(id),
  
  -- Transaction details
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment info
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'completed',
  cash_received DECIMAL(10, 2),
  change_given DECIMAL(10, 2),
  
  -- Metadata
  notes TEXT,
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, transaction_number)
);

CREATE INDEX IF NOT EXISTS idx_pos_transactions_company_id ON pos_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_staff_id ON pos_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_status ON pos_transactions(payment_status);

-- ============================================
-- POS Transaction Line Items
-- ============================================
CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  transaction_id VARCHAR NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL REFERENCES products(id),
  
  -- Item details
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2),
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pos_items_transaction_id ON pos_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_items_product_id ON pos_transaction_items(product_id);

-- ============================================
-- PDF Templates
-- ============================================
CREATE TABLE IF NOT EXISTS pdf_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Template info
  name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  html_template TEXT NOT NULL,
  css_styles TEXT,
  
  -- Branding
  header_logo_url TEXT,
  footer_text TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#666666',
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  paper_size VARCHAR(20) DEFAULT 'A4',
  orientation VARCHAR(20) DEFAULT 'portrait',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pdf_templates_company_id ON pdf_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_type ON pdf_templates(template_type);

-- ============================================
-- Trigger to update stock after POS sale
-- ============================================
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    stock_quantity = stock_quantity - NEW.quantity,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_after_sale ON pos_transaction_items;
CREATE TRIGGER trigger_update_stock_after_sale
AFTER INSERT ON pos_transaction_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- ============================================
-- Trigger to restore stock after refund
-- ============================================
CREATE OR REPLACE FUNCTION restore_product_stock_on_refund()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'refunded' AND OLD.payment_status = 'completed' THEN
    -- Restore stock for all items in this transaction
    UPDATE products p
    SET 
      stock_quantity = stock_quantity + pti.quantity,
      updated_at = CURRENT_TIMESTAMP
    FROM pos_transaction_items pti
    WHERE pti.transaction_id = NEW.id
      AND p.id = pti.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_refund ON pos_transactions;
CREATE TRIGGER trigger_restore_stock_on_refund
AFTER UPDATE ON pos_transactions
FOR EACH ROW
WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION restore_product_stock_on_refund();

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Multi-tenant POS, Analytics, and PDF features schema created successfully!';
END $$;
