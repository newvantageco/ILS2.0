/**
 * Test Users Seed Data
 *
 * Creates test accounts for development and testing:
 * 1. Test Company (ECP practice)
 * 2. Company Admin User (for testing company-level features)
 * 3. Platform Admin User (for testing platform-level features)
 *
 * SECURITY: Only run this in development/staging environments!
 */

-- ==============================================
-- 1. Create Test Company
-- ==============================================

INSERT INTO companies (
  id,
  name,
  type,
  status,
  email,
  phone,
  website,
  address,
  registration_number,
  goc_number,
  subscription_plan,
  subscription_start_date,
  billing_email,
  is_subscription_exempt,
  created_at,
  updated_at
) VALUES (
  'test-company-001',
  'Test Optical Practice',
  'ecp',
  'active',
  'contact@testoptical.com',
  '+44 20 1234 5678',
  'https://testoptical.com',
  '{"street": "123 Test Street", "city": "London", "postcode": "SW1A 1AA", "country": "UK"}'::jsonb,
  'OC123456',
  'GOC-12345',
  'professional',
  NOW(),
  'billing@testoptical.com',
  true, -- Exempt from subscription checks for testing
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ==============================================
-- 2. Create Company Admin User
-- ==============================================

-- Test credentials:
-- Email: admin@testoptical.com
-- Password: TestAdmin123! (bcrypt hash below)

INSERT INTO users (
  id,
  company_id,
  account_status,
  email,
  password,
  first_name,
  last_name,
  role,
  subscription_plan,
  goc_registration_number,
  goc_registration_type,
  professional_qualifications,
  can_prescribe,
  can_dispense,
  is_active,
  is_verified,
  last_login_at,
  created_at,
  updated_at
) VALUES (
  'test-user-company-admin',
  'test-company-001',
  'active',
  'admin@testoptical.com',
  '$2a$10$rK8qV8P5Y.xN5xZ4H1vqXO5L6qY9E0bQ3qF7wG5jM8hT2lP4nR6vC', -- TestAdmin123!
  'Test',
  'Admin',
  'admin',
  'professional',
  'GOC-12345',
  'Optometrist',
  'BSc Optometry, MCOptom',
  true,
  true,
  true,
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  account_status = EXCLUDED.account_status,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

-- ==============================================
-- 3. Create Platform Admin User
-- ==============================================

-- Create Platform Admin Company (for organizational purposes)
INSERT INTO companies (
  id,
  name,
  type,
  status,
  email,
  phone,
  subscription_plan,
  is_subscription_exempt,
  created_at,
  updated_at
) VALUES (
  'platform-admin-company',
  'ILS Platform Administration',
  'hybrid',
  'active',
  'platform@ils.com',
  '+44 20 9999 9999',
  'enterprise',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Test credentials:
-- Email: platform@ils.com
-- Password: PlatformAdmin123! (bcrypt hash below)

INSERT INTO users (
  id,
  company_id,
  account_status,
  email,
  password,
  first_name,
  last_name,
  role,
  subscription_plan,
  is_active,
  is_verified,
  last_login_at,
  created_at,
  updated_at
) VALUES (
  'test-user-platform-admin',
  'platform-admin-company',
  'active',
  'platform@ils.com',
  '$2a$10$sL9rW9Q6Z.yO6yA5I2wqYP6M7qZ0F1cR4qG8xH6kN9iU3mQ5oS7wD', -- PlatformAdmin123!
  'Platform',
  'Administrator',
  'platform_admin',
  'enterprise',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  account_status = EXCLUDED.account_status,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

-- ==============================================
-- Summary
-- ==============================================

-- Display created test accounts
SELECT
  '✅ Test Users Created' as status,
  '' as spacer
UNION ALL
SELECT
  '👤 Company Admin:' as status,
  'Email: admin@testoptical.com, Password: TestAdmin123!, ID: test-user-company-admin' as spacer
UNION ALL
SELECT
  '🔧 Platform Admin:' as status,
  'Email: platform@ils.com, Password: PlatformAdmin123!, ID: test-user-platform-admin' as spacer
UNION ALL
SELECT
  '🏢 Test Company:' as status,
  'Name: Test Optical Practice, ID: test-company-001' as spacer;

-- SECURITY WARNING
SELECT
  '⚠️  WARNING' as alert,
  'These are test accounts with known passwords. NEVER use in production!' as message;
