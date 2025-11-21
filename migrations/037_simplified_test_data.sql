-- Simplified Comprehensive Test Data
-- Run: cat migrations/037_simplified_test_data.sql | docker exec -i ils-postgres psql -U ils_user -d ils_db

-- Password hash for Test123!@#
-- $2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa

-- ========== CREATE ADDITIONAL TEST USERS ==========
INSERT INTO users (id, email, password, first_name, last_name, role, is_company_admin, company_id, account_status, subscription_plan, is_active, is_verified, can_prescribe, can_dispense)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'Owner', 'Admin', 'admin'::role, true, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, true, true),
  ('22222222-2222-2222-2222-222222222222', 'ecp1@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'Sarah', 'Johnson', 'ecp'::role, true, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, true, true),
  ('33333333-3333-3333-3333-333333333333', 'ecp2@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'Michael', 'Chen', 'ecp'::role, false, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, true, true),
  ('44444444-4444-4444-4444-444444444444', 'optometrist@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'Dr. Emily', 'Roberts', 'ecp'::role, false, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, true, true),
  ('55555555-5555-5555-5555-555555555555', 'lab1@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'David', 'Martinez', 'lab_tech'::role, false, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, false, false),
  ('66666666-6666-6666-6666-666666666666', 'lab2@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'Jennifer', 'Wilson', 'lab_tech'::role, false, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, false, false),
  ('77777777-7777-7777-7777-777777777777', 'dispenser@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'Robert', 'Brown', 'dispenser'::role, false, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, false, true),
  ('88888888-8888-8888-8888-888888888888', 'engineer@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'Lisa', 'Anderson', 'engineer'::role, false, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, false, false),
  ('99999999-9999-9999-9999-999999999999', 'supplier@test.com', '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa', 'James', 'Taylor', 'supplier'::role, false, 'e635e4d5-0a44-4acf-a798-5ca3a450f601', 'active', 'full', true, true, false, false)
ON CONFLICT (email) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  is_company_admin = EXCLUDED.is_company_admin,
  account_status = 'active'::account_status;

-- ========== CREATE TEST PATIENTS ==========
INSERT INTO patients (name, date_of_birth, email, phone, company_id, ecp_id, status)
VALUES
  ('John Smith', '1985-05-15', 'john.smith@email.com', '555-0101', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '22222222-2222-2222-2222-222222222222', 'active'),
  ('Emma Wilson', '1992-08-22', 'emma.wilson@email.com', '555-0102', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '22222222-2222-2222-2222-222222222222', 'active'),
  ('Oliver Brown', '1978-03-10', 'oliver.brown@email.com', '555-0103', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '22222222-2222-2222-2222-222222222222', 'active'),
  ('Sophia Davis', '1995-11-30', 'sophia.davis@email.com', '555-0104', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '22222222-2222-2222-2222-222222222222', 'active'),
  ('William Miller', '1988-07-18', 'william.miller@email.com', '555-0105', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '33333333-3333-3333-3333-333333333333', 'active'),
  ('Ava Garcia', '2000-01-25', 'ava.garcia@email.com', '555-0106', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '33333333-3333-3333-3333-333333333333', 'active'),
  ('James Rodriguez', '1970-09-08', 'james.rodriguez@email.com', '555-0107', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '44444444-4444-4444-4444-444444444444', 'active'),
  ('Isabella Martinez', '1998-12-14', 'isabella.martinez@email.com', '555-0108', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '44444444-4444-4444-4444-444444444444', 'active'),
  ('Lucas Anderson', '1982-04-20', 'lucas.anderson@email.com', '555-0109', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '44444444-4444-4444-4444-444444444444', 'active'),
  ('Mia Thompson', '1990-06-05', 'mia.thompson@email.com', '555-0110', 'e635e4d5-0a44-4acf-a798-5ca3a450f601', '44444444-4444-4444-4444-444444444444', 'active')
ON CONFLICT (email) DO NOTHING;

-- Verification query
SELECT 
  'Total Users' as metric, 
  COUNT(*)::text as count 
FROM users 
WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Total Patients', COUNT(*)::text FROM patients WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Admin Users', COUNT(*)::text FROM users WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601' AND is_company_admin = true
UNION ALL
SELECT 'ECP Users', COUNT(*)::text FROM users WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601' AND role = 'ecp'
UNION ALL
SELECT 'Lab Users', COUNT(*)::text FROM users WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601' AND role = 'lab_tech';

-- Show all test users
\echo ''
\echo '✅ Test Users Created:'
\echo '===================='
SELECT 
  email,
  role,
  CASE WHEN is_company_admin THEN 'YES' ELSE 'NO' END as admin,
  first_name || ' ' || last_name as name
FROM users
WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
ORDER BY role, email;

\echo ''
\echo '🔑 Password for ALL users: Test123!@#'
\echo '🌐 Login at: http://localhost:5005'
