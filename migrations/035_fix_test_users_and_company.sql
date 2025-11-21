-- Fix multi-tenant test data
-- 1. Create default test company
-- 2. Assign all test users to it
-- 3. Fix roles that were incorrectly set to company_admin

-- Step 1: Create or get default test company
INSERT INTO companies (
  id, 
  name, 
  type, 
  status, 
  email, 
  subscription_plan
) VALUES (
  'e635e4d5-0a44-4acf-a798-5ca3a450f601',
  'Test Company',
  'ecp',
  'active',
  'company@test.com',
  'full'
) ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  subscription_plan = 'full';

-- Step 2: Fix user with company_admin role back to their functional role
-- The user who created the company should be ecp, not company_admin
UPDATE users 
SET role = 'ecp'
WHERE role = 'company_admin' 
AND is_company_admin = TRUE;

-- Step 3: Assign all test users to the default test company
UPDATE users 
SET company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
WHERE email LIKE '%@test.com'
AND company_id IS NULL;

-- Step 4: Make admin@test.com a company admin
UPDATE users
SET is_company_admin = TRUE
WHERE email = 'admin@test.com';

-- Verification
SELECT 
  email, 
  role, 
  is_company_admin, 
  CASE WHEN company_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_company,
  account_status
FROM users 
ORDER BY email;
