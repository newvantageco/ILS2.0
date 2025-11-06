-- =====================================================
-- Enhanced Dispenser Permissions Migration
-- Adds granular POS, Patient, and Order permissions
-- for the world-class Dispenser role workflow
-- =====================================================

BEGIN;

-- Step 1: Add POS Category (if not exists)
INSERT INTO permission_categories (name, description, display_order) VALUES
('Point of Sale (POS)', 'POS system, invoicing, and payment processing', 3)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- Step 2: Add comprehensive POS permissions
INSERT INTO permissions (permission_key, permission_name, description, category, plan_level) VALUES
-- Core POS Access
('pos:access', 'Access POS System', 'Access the Point of Sale interface', 'Point of Sale (POS)', 'full'),

-- Invoice Management (the heart of Dispenser workflow)
('pos:invoices:read', 'View Invoices', 'View all invoices and sales history', 'Point of Sale (POS)', 'full'),
('pos:invoices:create', 'Create Invoices', 'Create new invoices and process sales', 'Point of Sale (POS)', 'full'),
('pos:invoices:update', 'Edit Invoices', 'Edit draft or pending invoices', 'Point of Sale (POS)', 'full'),
('pos:invoices:void', 'Void Invoices', 'Cancel or void completed invoices (manager function)', 'Point of Sale (POS)', 'full'),
('pos:invoices:apply_discount', 'Apply Discounts', 'Apply discounts to invoices (may be limited)', 'Point of Sale (POS)', 'full'),

-- Product/Inventory for POS
('pos:products:read', 'View Product Catalog', 'View products, prices, and stock for sales', 'Point of Sale (POS)', 'full'),
('pos:products:create', 'Add Products', 'Add new products to the catalog', 'Point of Sale (POS)', 'full'),
('pos:products:update', 'Edit Products', 'Edit product details, prices, and descriptions', 'Point of Sale (POS)', 'full'),
('pos:products:manage_stock', 'Manage Stock Levels', 'Perform inventory adjustments and stock counts', 'Point of Sale (POS)', 'full'),

-- Payment Processing
('pos:payments:process', 'Process Payments', 'Accept and process customer payments', 'Point of Sale (POS)', 'full'),
('pos:payments:refund', 'Process Refunds', 'Issue refunds and process returns', 'Point of Sale (POS)', 'full'),

-- POS Reports & Analytics
('pos:reports:read', 'View POS Reports', 'Access sales reports and POS analytics', 'Point of Sale (POS)', 'full'),
('analytics:read_pos', 'POS Analytics Dashboard', 'Access advanced POS sales analytics', 'Advanced Analytics', 'add_on_analytics')

ON CONFLICT (permission_key) DO UPDATE 
SET permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    plan_level = EXCLUDED.plan_level;

-- Step 3: Add Patient permissions (with better granularity)
INSERT INTO permissions (permission_key, permission_name, description, category, plan_level) VALUES
('patients:read', 'View Patient Records', 'Search and view patient information', 'Patient Management', 'full'),
('patients:create', 'Create Patient Records', 'Add new patients to the system', 'Patient Management', 'full'),
('patients:update', 'Update Patient Records', 'Edit patient contact info and details', 'Patient Management', 'full'),
('patients:delete', 'Delete Patient Records', 'Remove patient records (admin only)', 'Patient Management', 'full')
ON CONFLICT (permission_key) DO UPDATE 
SET permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    plan_level = EXCLUDED.plan_level;

-- Step 4: Add Clinical/Examination permissions (Dispenser needs read-only)
INSERT INTO permissions (permission_key, permission_name, description, category, plan_level) VALUES
('examinations:read', 'View Eye Examinations', 'View patient examination reports and diagnoses', 'Examination Management', 'full'),
('examinations:create', 'Perform Examinations', 'Create and record eye examinations', 'Examination Management', 'full'),
('examinations:update', 'Edit Examinations', 'Modify examination records', 'Examination Management', 'full'),
('examinations:delete', 'Delete Examinations', 'Remove examination records', 'Examination Management', 'full')
ON CONFLICT (permission_key) DO UPDATE 
SET permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    plan_level = EXCLUDED.plan_level;

-- Step 5: Add Prescription permissions (Dispenser needs read-only)
INSERT INTO permissions (permission_key, permission_name, description, category, plan_level) VALUES
('prescriptions:read', 'View Prescriptions', 'View patient prescriptions and Rx history', 'Prescription Management', 'full'),
('prescriptions:create', 'Create Prescriptions', 'Create new prescriptions', 'Prescription Management', 'full'),
('prescriptions:update', 'Edit Prescriptions', 'Modify prescriptions', 'Prescription Management', 'full'),
('prescriptions:sign', 'Sign Prescriptions', 'Digitally sign and finalize prescriptions', 'Prescription Management', 'full')
ON CONFLICT (permission_key) DO UPDATE 
SET permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    plan_level = EXCLUDED.plan_level;

-- Step 6: Add Order permissions (Dispenser needs create + read)
INSERT INTO permissions (permission_key, permission_name, description, category, plan_level) VALUES
('orders:read', 'View Orders', 'View order status and history', 'Order Management', 'full'),
('orders:create', 'Create Orders', 'Create new lab orders from prescriptions', 'Order Management', 'full'),
('orders:update', 'Edit Orders', 'Modify existing orders', 'Order Management', 'full'),
('orders:delete', 'Delete Orders', 'Cancel or remove orders', 'Order Management', 'full'),
('orders:update_status', 'Update Order Status', 'Change order status (e.g., lab completion)', 'Order Management', 'full')
ON CONFLICT (permission_key) DO UPDATE 
SET permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    plan_level = EXCLUDED.plan_level;

COMMIT;

-- Display results
SELECT '✅ POS Permissions Added:', COUNT(*) as count 
FROM permissions 
WHERE category = 'Point of Sale (POS)';

SELECT '✅ Patient Permissions Added:', COUNT(*) as count 
FROM permissions 
WHERE category = 'Patient Management';

SELECT '✅ Clinical Permissions Added:', COUNT(*) as count 
FROM permissions 
WHERE permission_key LIKE 'examinations:%' OR permission_key LIKE 'prescriptions:%';

SELECT '✅ Order Permissions Added:', COUNT(*) as count 
FROM permissions 
WHERE permission_key LIKE 'orders:%';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Dispenser permissions migration complete!';
  RAISE NOTICE '🔑 Total POS permissions: %', (SELECT COUNT(*) FROM permissions WHERE category = 'Point of Sale (POS)');
  RAISE NOTICE '📊 Ready for Default Dispenser role creation';
END $$;
