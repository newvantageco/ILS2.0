-- Enhanced Role-Based Access Control Migration
-- Adds owner role, feature permissions, and granular access control

-- Add new roles including owner, retail_assistant, dispenser, optometrist
DROP TYPE IF EXISTS user_role_enhanced CASCADE;
CREATE TYPE user_role_enhanced AS ENUM (
  'owner',
  'admin',
  'optometrist',
  'dispenser',
  'retail_assistant',
  'lab_tech',
  'engineer',
  'supplier'
);

-- Create permissions table for granular feature access
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'patient_management', 'inventory', 'sales', 'ai_assistant', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  permission_id VARCHAR NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, role, permission_id)
);

-- Create user_custom_permissions for individual overrides
CREATE TABLE IF NOT EXISTS user_custom_permissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id VARCHAR NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL,
  granted_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(user_id, permission_id)
);

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
-- AI Assistant permissions
('ai_assistant.access', 'Access AI Assistant chat', 'ai_assistant'),
('ai_assistant.upload_documents', 'Upload documents to AI knowledge base', 'ai_assistant'),
('ai_assistant.view_learning_progress', 'View AI learning progress', 'ai_assistant'),
('ai_assistant.manage_knowledge', 'Manage AI knowledge base', 'ai_assistant'),
('ai_assistant.export_data', 'Export AI conversation data', 'ai_assistant'),

-- Patient Management permissions
('patients.view', 'View patient records', 'patient_management'),
('patients.create', 'Create new patient records', 'patient_management'),
('patients.edit', 'Edit patient records', 'patient_management'),
('patients.delete', 'Delete patient records', 'patient_management'),
('patients.view_sensitive', 'View sensitive patient information', 'patient_management'),

-- Eye Test permissions
('eye_test.perform', 'Perform eye examinations', 'eye_test'),
('eye_test.view_results', 'View eye test results', 'eye_test'),
('eye_test.generate_prescription', 'Generate prescriptions', 'eye_test'),
('eye_test.advanced_tests', 'Perform advanced eye tests', 'eye_test'),
('eye_test.edit_results', 'Edit eye test results', 'eye_test'),

-- Prescription permissions
('prescriptions.view', 'View prescriptions', 'prescriptions'),
('prescriptions.create', 'Create prescriptions', 'prescriptions'),
('prescriptions.edit', 'Edit prescriptions', 'prescriptions'),
('prescriptions.approve', 'Approve prescriptions', 'prescriptions'),
('prescriptions.send', 'Send prescriptions to patients', 'prescriptions'),

-- Inventory permissions
('inventory.view', 'View inventory', 'inventory'),
('inventory.manage', 'Manage inventory (add/edit/delete)', 'inventory'),
('inventory.view_costs', 'View inventory costs and margins', 'inventory'),
('inventory.reorder', 'Place reorder requests', 'inventory'),
('inventory.adjust_stock', 'Adjust stock levels', 'inventory'),

-- POS/Sales permissions
('pos.access', 'Access point of sale', 'sales'),
('pos.make_sale', 'Process sales transactions', 'sales'),
('pos.refunds', 'Process refunds', 'sales'),
('pos.discounts', 'Apply discounts', 'sales'),
('pos.view_sales_history', 'View sales history', 'sales'),
('pos.end_of_day', 'Perform end of day cash reconciliation', 'sales'),

-- Orders permissions
('orders.view', 'View orders', 'orders'),
('orders.create', 'Create new orders', 'orders'),
('orders.edit', 'Edit orders', 'orders'),
('orders.cancel', 'Cancel orders', 'orders'),
('orders.view_all_company', 'View all company orders', 'orders'),

-- Company Management permissions
('company.view_profile', 'View company profile', 'company'),
('company.edit_profile', 'Edit company profile', 'company'),
('company.manage_users', 'Manage company users', 'company'),
('company.assign_roles', 'Assign roles to users', 'company'),
('company.configure_permissions', 'Configure role permissions', 'company'),
('company.view_analytics', 'View company analytics', 'company'),

-- Business Intelligence permissions
('bi.view_dashboard', 'View BI dashboard', 'business_intelligence'),
('bi.view_insights', 'View AI insights', 'business_intelligence'),
('bi.export_reports', 'Export BI reports', 'business_intelligence'),
('bi.configure_kpis', 'Configure KPIs and metrics', 'business_intelligence'),

-- Supplier permissions
('suppliers.view', 'View suppliers', 'suppliers'),
('suppliers.manage_relationships', 'Manage supplier relationships', 'suppliers'),
('suppliers.place_orders', 'Place orders with suppliers', 'suppliers'),
('suppliers.view_pricing', 'View supplier pricing', 'suppliers'),

-- Settings permissions
('settings.view', 'View settings', 'settings'),
('settings.edit_personal', 'Edit personal settings', 'settings'),
('settings.edit_company', 'Edit company settings', 'settings'),
('settings.manage_integrations', 'Manage integrations', 'settings'),

-- Appointments permissions
('appointments.view', 'View appointments', 'appointments'),
('appointments.create', 'Create appointments', 'appointments'),
('appointments.edit', 'Edit appointments', 'appointments'),
('appointments.cancel', 'Cancel appointments', 'appointments'),
('appointments.view_all_company', 'View all company appointments', 'appointments'),

-- Email/Communications permissions
('email.send_invoices', 'Send invoice emails', 'communications'),
('email.send_marketing', 'Send marketing emails', 'communications'),
('email.view_history', 'View email history', 'communications'),

-- Loyalty Program permissions
('loyalty.view', 'View loyalty program', 'loyalty'),
('loyalty.manage', 'Manage loyalty program', 'loyalty'),
('loyalty.apply_rewards', 'Apply loyalty rewards', 'loyalty')

ON CONFLICT (name) DO NOTHING;

-- Create default permission sets for each role
-- OWNER: Full access to everything
INSERT INTO role_permissions (company_id, role, permission_id, granted)
SELECT 
  c.id as company_id,
  'owner' as role,
  p.id as permission_id,
  true as granted
FROM companies c
CROSS JOIN permissions p
ON CONFLICT (company_id, role, permission_id) DO NOTHING;

-- OPTOMETRIST: Medical professional with patient care focus
WITH optometrist_permissions AS (
  SELECT id FROM permissions WHERE name IN (
    'ai_assistant.access',
    'patients.view', 'patients.create', 'patients.edit', 'patients.view_sensitive',
    'eye_test.perform', 'eye_test.view_results', 'eye_test.generate_prescription',
    'eye_test.advanced_tests', 'eye_test.edit_results',
    'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.approve', 'prescriptions.send',
    'inventory.view',
    'orders.view', 'orders.create',
    'company.view_profile',
    'bi.view_dashboard', 'bi.view_insights',
    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.view_all_company',
    'email.send_invoices',
    'settings.view', 'settings.edit_personal'
  )
)
INSERT INTO role_permissions (company_id, role, permission_id, granted)
SELECT c.id, 'optometrist', op.id, true
FROM companies c
CROSS JOIN optometrist_permissions op
ON CONFLICT (company_id, role, permission_id) DO NOTHING;

-- DISPENSER: Retail sales and patient service
WITH dispenser_permissions AS (
  SELECT id FROM permissions WHERE name IN (
    'ai_assistant.access',
    'patients.view', 'patients.create', 'patients.edit',
    'eye_test.view_results',
    'prescriptions.view',
    'inventory.view', 'inventory.reorder',
    'pos.access', 'pos.make_sale', 'pos.refunds', 'pos.discounts', 'pos.view_sales_history',
    'orders.view', 'orders.create',
    'company.view_profile',
    'bi.view_dashboard',
    'appointments.view', 'appointments.create', 'appointments.edit',
    'email.send_invoices',
    'loyalty.view', 'loyalty.apply_rewards',
    'settings.view', 'settings.edit_personal'
  )
)
INSERT INTO role_permissions (company_id, role, permission_id, granted)
SELECT c.id, 'dispenser', dp.id, true
FROM companies c
CROSS JOIN dispenser_permissions dp
ON CONFLICT (company_id, role, permission_id) DO NOTHING;

-- RETAIL_ASSISTANT: Basic retail and customer service
WITH retail_permissions AS (
  SELECT id FROM permissions WHERE name IN (
    'ai_assistant.access',
    'patients.view',
    'inventory.view',
    'pos.access', 'pos.make_sale', 'pos.view_sales_history',
    'orders.view',
    'appointments.view', 'appointments.create',
    'loyalty.view', 'loyalty.apply_rewards',
    'settings.view', 'settings.edit_personal'
  )
)
INSERT INTO role_permissions (company_id, role, permission_id, granted)
SELECT c.id, 'retail_assistant', rp.id, true
FROM companies c
CROSS JOIN retail_permissions rp
ON CONFLICT (company_id, role, permission_id) DO NOTHING;

-- ADMIN: Full access (same as owner)
INSERT INTO role_permissions (company_id, role, permission_id, granted)
SELECT 
  c.id as company_id,
  'admin' as role,
  p.id as permission_id,
  true as granted
FROM companies c
CROSS JOIN permissions p
ON CONFLICT (company_id, role, permission_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_company ON role_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_user ON user_custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Add updated_at trigger for role_permissions
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_updated_at();

COMMENT ON TABLE permissions IS 'Defines all available permissions in the system';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles per company (company-specific role permissions)';
COMMENT ON TABLE user_custom_permissions IS 'Individual user permission overrides';
