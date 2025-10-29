-- ============================================
-- Multi-Tenant Architecture Migration
-- ============================================
-- This migration adds companyId to all relevant tables
-- to enable proper data isolation per company

-- Step 1: Ensure companies table exists and has proper structure
-- (Already exists from previous migrations)

-- Step 2: Add companyId to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS company_id VARCHAR;
ALTER TABLE patients ADD CONSTRAINT fk_patients_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_patients_company ON patients(company_id);

-- Step 3: Add companyId to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id VARCHAR;
ALTER TABLE orders ADD CONSTRAINT fk_orders_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);

-- Step 4: Add companyId to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id VARCHAR;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);

-- Step 5: Add companyId to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id VARCHAR;
ALTER TABLE products ADD CONSTRAINT fk_products_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);

-- Step 6: Add companyId to prescriptions table
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS company_id VARCHAR;
ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_prescriptions_company ON prescriptions(company_id);

-- Step 7: Add companyId to eye_examinations table
ALTER TABLE eye_examinations ADD COLUMN IF NOT EXISTS company_id VARCHAR;
ALTER TABLE eye_examinations ADD CONSTRAINT fk_examinations_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_examinations_company ON eye_examinations(company_id);

-- Step 8: Add companyId to purchase_orders table
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS company_id VARCHAR;
ALTER TABLE purchase_orders ADD CONSTRAINT fk_purchase_orders_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON purchase_orders(company_id);

-- Step 9: Add companyId to consult_logs table
ALTER TABLE consult_logs ADD COLUMN IF NOT EXISTS company_id VARCHAR;
ALTER TABLE consult_logs ADD CONSTRAINT fk_consult_logs_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_consult_logs_company ON consult_logs(company_id);

-- Step 10: Create default company for existing data migration
DO $$
DECLARE
  default_company_id VARCHAR;
  master_user_id VARCHAR;
BEGIN
  -- Get or create default company
  SELECT id INTO default_company_id FROM companies WHERE name = 'New Vantage Co' LIMIT 1;
  
  IF default_company_id IS NULL THEN
    -- Create default company
    INSERT INTO companies (id, name, type, status, email, website, phone, subscription_plan, created_at, updated_at)
    VALUES (
      gen_random_uuid()::text,
      'New Vantage Co',
      'ecp',
      'active',
      'saban@newvantageco.com',
      'https://newvantageco.com',
      NULL,
      'full',
      NOW(),
      NOW()
    )
    RETURNING id INTO default_company_id;
    
    RAISE NOTICE 'Created default company with ID: %', default_company_id;
  ELSE
    RAISE NOTICE 'Using existing company with ID: %', default_company_id;
  END IF;
  
  -- Update master user's companyId
  UPDATE users 
  SET company_id = default_company_id 
  WHERE email = 'saban@newvantageco.com' AND company_id IS NULL;
  
  -- Migrate existing patients to default company
  UPDATE patients SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Migrate existing orders to default company
  UPDATE orders SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Migrate existing invoices to default company
  UPDATE invoices SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Migrate existing products to default company
  UPDATE products SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Migrate existing prescriptions to default company
  UPDATE prescriptions SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Migrate existing examinations to default company
  UPDATE eye_examinations SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Migrate existing purchase orders to default company
  UPDATE purchase_orders SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Migrate existing consult logs to default company
  UPDATE consult_logs SET company_id = default_company_id WHERE company_id IS NULL;
  
  RAISE NOTICE 'Migration complete - all existing data assigned to default company';
END $$;

-- Step 11: Make companyId NOT NULL after migration (enforce data integrity)
-- Note: Uncomment these after verifying migration is successful
-- ALTER TABLE patients ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE orders ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE invoices ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE prescriptions ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE eye_examinations ALTER COLUMN company_id SET NOT NULL;

-- Step 12: Create view for company data summary
CREATE OR REPLACE VIEW company_data_summary AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(DISTINCT p.id) as patient_count,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT i.id) as invoice_count,
  COUNT(DISTINCT pr.id) as product_count,
  COUNT(DISTINCT u.id) as user_count
FROM companies c
LEFT JOIN patients p ON p.company_id = c.id
LEFT JOIN orders o ON o.company_id = c.id
LEFT JOIN invoices i ON i.company_id = c.id
LEFT JOIN products pr ON pr.company_id = c.id
LEFT JOIN users u ON u.company_id = c.id
GROUP BY c.id, c.name;

-- Step 13: Create function to check company access
CREATE OR REPLACE FUNCTION check_company_access(
  user_company_id VARCHAR,
  resource_company_id VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_company_id = resource_company_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION check_company_access IS 'Validates that user can access resource from their company';

-- Verification queries
SELECT 'Migration Summary:' as status;
SELECT 'Patients with companyId: ' || COUNT(*) FROM patients WHERE company_id IS NOT NULL;
SELECT 'Orders with companyId: ' || COUNT(*) FROM orders WHERE company_id IS NOT NULL;
SELECT 'Invoices with companyId: ' || COUNT(*) FROM invoices WHERE company_id IS NOT NULL;
SELECT 'Products with companyId: ' || COUNT(*) FROM products WHERE company_id IS NOT NULL;
SELECT * FROM company_data_summary;
