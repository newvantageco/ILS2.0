-- Seed Permission Categories and Permissions for Dynamic RBAC System
-- This is a SQL-only version of seedPermissions.ts for easy execution

BEGIN;

-- Insert Permission Categories
INSERT INTO permission_categories (name, description, display_order) VALUES
('Company Management', 'Manage company settings, billing, and profile', 1),
('User Management', 'Manage users, roles, and team members', 2),
('Patient Management', 'View, create, and edit patient records', 3),
('Order Management', 'Create, edit, and manage orders', 4),
('Prescription Management', 'Create, edit, and manage prescriptions', 5),
('Examination Management', 'Perform and manage eye examinations', 6),
('Inventory Management', 'Track and manage inventory and stock', 7),
('Lab Production', 'Manage lens production and lab operations', 8),
('Equipment Management', 'Manage equipment and calibration', 9),
('Supplier Management', 'Manage suppliers and vendor relationships', 10),
('Purchasing', 'Create and manage purchase orders', 11),
('Reports', 'Access reports and basic analytics', 12),
('Advanced Analytics', 'Access advanced analytics and BI features', 13),
('AI Features', 'Access AI-powered insights and automation', 14)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- Insert Permissions
INSERT INTO permissions (permission_key, permission_name, description, category, plan_level) VALUES
-- Company Management (free)
('company:view', 'View Company Details', 'View company information and settings', 'Company Management', 'free'),
('company:edit', 'Edit Company Details', 'Edit company information and settings', 'Company Management', 'free'),
('company:manage_billing', 'Manage Billing', 'Access billing and subscription management', 'Company Management', 'free'),

-- User Management (free for basic, full for advanced)
('users:view', 'View Users', 'View list of users and their details', 'User Management', 'free'),
('users:invite', 'Invite Users', 'Send invitations to new users', 'User Management', 'free'),
('users:edit', 'Edit Users', 'Edit user information and status', 'User Management', 'free'),
('users:delete', 'Delete Users', 'Remove users from the system', 'User Management', 'full'),
('users:manage_roles', 'Manage User Roles', 'Assign and modify user roles', 'User Management', 'full'),

-- Patient Management (full plan required for creation)
('patients:view', 'View Patients', 'View patient records and history', 'Patient Management', 'free'),
('patients:create', 'Create Patients', 'Add new patient records', 'Patient Management', 'full'),
('patients:edit', 'Edit Patients', 'Edit patient information', 'Patient Management', 'full'),
('patients:delete', 'Delete Patients', 'Remove patient records', 'Patient Management', 'full'),
('patients:export', 'Export Patient Data', 'Export patient data to files', 'Patient Management', 'full'),

-- Order Management (free for viewing, full for creation)
('orders:view', 'View Orders', 'View order list and details', 'Order Management', 'free'),
('orders:create', 'Create Orders', 'Create new orders', 'Order Management', 'full'),
('orders:edit', 'Edit Orders', 'Modify existing orders', 'Order Management', 'full'),
('orders:delete', 'Delete Orders', 'Cancel or remove orders', 'Order Management', 'full'),
('orders:approve', 'Approve Orders', 'Approve orders for processing', 'Order Management', 'full'),
('orders:export', 'Export Orders', 'Export order data to files', 'Order Management', 'full'),

-- Prescription Management (full plan)
('prescriptions:view', 'View Prescriptions', 'View prescription details', 'Prescription Management', 'full'),
('prescriptions:create', 'Create Prescriptions', 'Create new prescriptions', 'Prescription Management', 'full'),
('prescriptions:edit', 'Edit Prescriptions', 'Modify prescriptions', 'Prescription Management', 'full'),
('prescriptions:delete', 'Delete Prescriptions', 'Remove prescriptions', 'Prescription Management', 'full'),
('prescriptions:sign', 'Sign Prescriptions', 'Digitally sign prescriptions', 'Prescription Management', 'full'),

-- Examination Management (full plan)
('examinations:view', 'View Examinations', 'View examination records', 'Examination Management', 'full'),
('examinations:create', 'Perform Examinations', 'Conduct and record eye exams', 'Examination Management', 'full'),
('examinations:edit', 'Edit Examinations', 'Modify examination records', 'Examination Management', 'full'),
('examinations:delete', 'Delete Examinations', 'Remove examination records', 'Examination Management', 'full'),

-- Inventory Management (full plan)
('inventory:view', 'View Inventory', 'View stock levels and inventory', 'Inventory Management', 'full'),
('inventory:edit', 'Edit Inventory', 'Adjust stock levels', 'Inventory Management', 'full'),
('inventory:manage', 'Manage Inventory', 'Full inventory management including transfers', 'Inventory Management', 'full'),
('inventory:export', 'Export Inventory', 'Export inventory data', 'Inventory Management', 'full'),

-- Lab Production (full plan)
('lab:view_jobs', 'View Lab Jobs', 'View production jobs and queue', 'Lab Production', 'full'),
('lab:create_jobs', 'Create Lab Jobs', 'Create new production jobs', 'Lab Production', 'full'),
('lab:manage_jobs', 'Manage Lab Jobs', 'Update job status and manage workflow', 'Lab Production', 'full'),
('lab:quality_control', 'Quality Control', 'Perform QC checks and approvals', 'Lab Production', 'full'),

-- Equipment Management (full plan)
('equipment:view', 'View Equipment', 'View equipment list and status', 'Equipment Management', 'full'),
('equipment:manage', 'Manage Equipment', 'Add, edit, and maintain equipment', 'Equipment Management', 'full'),
('equipment:calibrate', 'Calibrate Equipment', 'Perform equipment calibration', 'Equipment Management', 'full'),

-- Supplier Management (full plan)
('suppliers:view', 'View Suppliers', 'View supplier information', 'Supplier Management', 'full'),
('suppliers:manage', 'Manage Suppliers', 'Add and edit supplier details', 'Supplier Management', 'full'),

-- Purchasing (full plan)
('purchasing:view', 'View Purchase Orders', 'View PO list and details', 'Purchasing', 'full'),
('purchasing:create', 'Create Purchase Orders', 'Create new purchase orders', 'Purchasing', 'full'),
('purchasing:approve', 'Approve Purchase Orders', 'Approve POs for processing', 'Purchasing', 'full'),

-- Reports (free for basic, full for advanced)
('reports:view', 'View Reports', 'Access basic reports', 'Reports', 'free'),
('reports:export', 'Export Reports', 'Export report data', 'Reports', 'full'),

-- Advanced Analytics (add_on_analytics plan)
('analytics:view', 'View Analytics Dashboard', 'Access advanced analytics and BI dashboard', 'Advanced Analytics', 'add_on_analytics'),
('analytics:export', 'Export Analytics', 'Export analytics data and charts', 'Advanced Analytics', 'add_on_analytics'),
('analytics:custom_reports', 'Create Custom Reports', 'Build custom analytics reports', 'Advanced Analytics', 'add_on_analytics'),

-- AI Features (full for basic, add_on_analytics for advanced)
('ai:assistant', 'AI Assistant', 'Access basic AI assistant features', 'AI Features', 'full'),
('ai:insights', 'AI Insights', 'Access AI-powered insights', 'AI Features', 'add_on_analytics'),
('ai:predictive', 'Predictive Analytics', 'Access AI predictive models', 'AI Features', 'add_on_analytics'),
('ai:automation', 'AI Automation', 'Use AI-powered automation features', 'AI Features', 'add_on_analytics')
ON CONFLICT (permission_key) DO UPDATE 
SET permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    plan_level = EXCLUDED.plan_level;

COMMIT;

-- Display results
SELECT 'Permission Categories:', COUNT(*) as count FROM permission_categories;
SELECT 'Permissions:', COUNT(*) as count FROM permissions;
SELECT 'By Plan Level:', plan_level, COUNT(*) as count FROM permissions GROUP BY plan_level ORDER BY plan_level;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Permission seeding complete!';
  RAISE NOTICE '📊 Categories: %', (SELECT COUNT(*) FROM permission_categories);
  RAISE NOTICE '🔑 Permissions: %', (SELECT COUNT(*) FROM permissions);
END $$;
