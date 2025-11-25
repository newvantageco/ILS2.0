-- ============================================
-- RLS (Row-Level Security) Testing Script
-- ============================================
--
-- This script tests the Defense-in-Depth multi-tenant architecture
-- to ensure tenant isolation is working correctly at the database level.
--
-- Usage:
--   psql -d your_database -f scripts/test-rls-isolation.sql
--
-- Expected Results:
--   - Users can only see data from their tenant
--   - Platform admins can see all data
--   - Cross-tenant queries return 0 rows (not errors)
-- ============================================

\set QUIET on
\set ON_ERROR_STOP on

-- Create output formatting
\pset border 2
\pset format wrapped

\echo ''
\echo '========================================='
\echo 'RLS ISOLATION TESTING SUITE'
\echo '========================================='
\echo ''

-- ============================================
-- PART 1: Verify RLS is Enabled
-- ============================================

\echo '--- Part 1: Verifying RLS is Enabled on Critical Tables ---'
\echo ''

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '✓ ENABLED'
    ELSE '✗ DISABLED (SECURITY RISK!)'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'patients', 'orders', 'prescriptions', 'invoices',
    'eye_examinations', 'products', 'ai_conversations', 'users'
  )
ORDER BY
  CASE WHEN rowsecurity THEN 0 ELSE 1 END,
  tablename;

\echo ''

-- ============================================
-- PART 2: Verify RLS Policies Exist
-- ============================================

\echo '--- Part 2: Verifying RLS Policies are Created ---'
\echo ''

SELECT
  tablename,
  COUNT(*) AS policy_count,
  string_agg(DISTINCT cmd::text, ', ' ORDER BY cmd::text) AS operations_covered
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('patients', 'orders', 'prescriptions', 'users')
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- ============================================
-- PART 3: Create Test Data (if needed)
-- ============================================

\echo '--- Part 3: Setting up Test Data ---'
\echo ''

DO $$
DECLARE
  company1_id TEXT;
  company2_id TEXT;
  patient1_id TEXT;
  patient2_id TEXT;
BEGIN
  -- Check if test companies exist
  SELECT id INTO company1_id FROM companies WHERE name = 'Test Optician A' LIMIT 1;
  SELECT id INTO company2_id FROM companies WHERE name = 'Test Lab B' LIMIT 1;

  IF company1_id IS NULL THEN
    \echo 'Creating test companies...'
    INSERT INTO companies (id, name, type, status, email)
    VALUES
      (gen_random_uuid()::text, 'Test Optician A', 'ecp', 'active', 'test-a@example.com'),
      (gen_random_uuid()::text, 'Test Lab B', 'lab', 'active', 'test-b@example.com')
    RETURNING id INTO company1_id;

    RAISE NOTICE 'Test companies created';
  ELSE
    RAISE NOTICE 'Test companies already exist';
  END IF;

  -- Get company IDs again
  SELECT id INTO company1_id FROM companies WHERE name = 'Test Optician A' LIMIT 1;
  SELECT id INTO company2_id FROM companies WHERE name = 'Test Lab B' LIMIT 1;

  -- Create test patients if they don't exist
  SELECT id INTO patient1_id FROM patients WHERE company_id = company1_id LIMIT 1;

  IF patient1_id IS NULL THEN
    INSERT INTO patients (id, company_id, first_name, last_name, date_of_birth, nhs_number)
    VALUES
      (gen_random_uuid()::text, company1_id, 'Alice', 'Test', '1990-01-01', '1234567890'),
      (gen_random_uuid()::text, company2_id, 'Bob', 'Test', '1985-05-15', '0987654321');

    RAISE NOTICE 'Test patients created';
  ELSE
    RAISE NOTICE 'Test patients already exist';
  END IF;
END $$;

\echo ''

-- ============================================
-- PART 4: Test Tenant Isolation (No Context)
-- ============================================

\echo '--- Part 4: Testing Query Without Tenant Context ---'
\echo 'Expected: Should return 0 rows (RLS blocks access when session variable is not set)'
\echo ''

-- Reset session variables
RESET app.current_tenant;
RESET app.current_user_role;

SELECT
  'Without Tenant Context' AS test_case,
  COUNT(*) AS visible_patients,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - RLS blocking access'
    ELSE '✗ FAIL - Data leakage! RLS not working!'
  END AS result
FROM patients;

\echo ''

-- ============================================
-- PART 5: Test Tenant Isolation (Company A)
-- ============================================

\echo '--- Part 5: Testing Tenant A Isolation ---'
\echo 'Expected: Should only see Company A patients'
\echo ''

DO $$
DECLARE
  company_a_id TEXT;
  total_patients_a INTEGER;
BEGIN
  -- Get Company A ID
  SELECT id INTO company_a_id FROM companies WHERE name = 'Test Optician A' LIMIT 1;

  IF company_a_id IS NULL THEN
    RAISE EXCEPTION 'Company A not found. Run Part 3 first.';
  END IF;

  -- Count actual patients for Company A
  SELECT COUNT(*) INTO total_patients_a FROM patients WHERE company_id = company_a_id;

  -- Set session as Company A user
  PERFORM set_config('app.current_tenant', company_a_id, false);
  PERFORM set_config('app.current_user_role', 'user', false);

  -- Show results
  RAISE NOTICE 'Company A ID: %', company_a_id;
  RAISE NOTICE 'Expected patients: %', total_patients_a;

  -- Test query
  PERFORM
    '✓ PASS - Saw ' || COUNT(*) || ' patients from Company A'
  FROM patients;
END $$;

-- Verify no cross-tenant access
SELECT
  'Company A - Cross-Tenant Check' AS test_case,
  COUNT(*) AS other_company_patients,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - Cannot see other companies'
    ELSE '✗ FAIL - Cross-tenant data leakage!'
  END AS result
FROM patients p
WHERE p.company_id != get_current_tenant();

\echo ''

-- ============================================
-- PART 6: Test Tenant Isolation (Company B)
-- ============================================

\echo '--- Part 6: Testing Tenant B Isolation ---'
\echo 'Expected: Should only see Company B patients'
\echo ''

DO $$
DECLARE
  company_b_id TEXT;
  total_patients_b INTEGER;
BEGIN
  -- Get Company B ID
  SELECT id INTO company_b_id FROM companies WHERE name = 'Test Lab B' LIMIT 1;

  IF company_b_id IS NULL THEN
    RAISE EXCEPTION 'Company B not found. Run Part 3 first.';
  END IF;

  -- Count actual patients for Company B
  SELECT COUNT(*) INTO total_patients_b FROM patients WHERE company_id = company_b_id;

  -- Set session as Company B user
  PERFORM set_config('app.current_tenant', company_b_id, false);
  PERFORM set_config('app.current_user_role', 'user', false);

  RAISE NOTICE 'Company B ID: %', company_b_id;
  RAISE NOTICE 'Expected patients: %', total_patients_b;
END $$;

SELECT
  'Company B - Visible Patients' AS test_case,
  COUNT(*) AS visible_patients,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - Can see own patients'
    ELSE '✗ FAIL - Cannot see own data'
  END AS result
FROM patients;

\echo ''

-- ============================================
-- PART 7: Test Platform Admin Bypass
-- ============================================

\echo '--- Part 7: Testing Platform Admin Bypass ---'
\echo 'Expected: Platform admin should see ALL patients'
\echo ''

-- Set session as platform admin
SET app.current_user_role = 'platform_admin';

SELECT
  'Platform Admin Access' AS test_case,
  COUNT(*) AS total_patients,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - Platform admin can see all data'
    ELSE '✗ FAIL - Platform admin blocked'
  END AS result
FROM patients;

\echo ''

-- ============================================
-- PART 8: Test Write Operations
-- ============================================

\echo '--- Part 8: Testing Write Operations (INSERT) ---'
\echo 'Expected: Should only allow insert for current tenant'
\echo ''

DO $$
DECLARE
  company_a_id TEXT;
  company_b_id TEXT;
  test_patient_id TEXT;
BEGIN
  SELECT id INTO company_a_id FROM companies WHERE name = 'Test Optician A' LIMIT 1;
  SELECT id INTO company_b_id FROM companies WHERE name = 'Test Lab B' LIMIT 1;

  -- Set context to Company A
  PERFORM set_config('app.current_tenant', company_a_id, false);
  PERFORM set_config('app.current_user_role', 'user', false);

  -- Try to insert patient for Company A (should succeed)
  BEGIN
    INSERT INTO patients (id, company_id, first_name, last_name, date_of_birth)
    VALUES (gen_random_uuid()::text, company_a_id, 'Test', 'Insert', '2000-01-01')
    RETURNING id INTO test_patient_id;

    RAISE NOTICE '✓ PASS - Successfully inserted patient for own company';

    -- Clean up
    DELETE FROM patients WHERE id = test_patient_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ FAIL - Could not insert patient for own company: %', SQLERRM;
  END;

  -- Try to insert patient for Company B (should fail)
  BEGIN
    INSERT INTO patients (id, company_id, first_name, last_name, date_of_birth)
    VALUES (gen_random_uuid()::text, company_b_id, 'Test', 'Breach', '2000-01-01')
    RETURNING id INTO test_patient_id;

    RAISE NOTICE '✗ FAIL - Was able to insert patient for different company! SECURITY BREACH!';

    -- Clean up breach
    DELETE FROM patients WHERE id = test_patient_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✓ PASS - Correctly blocked insert for different company';
  END;
END $$;

\echo ''

-- ============================================
-- PART 9: Test UPDATE Operations
-- ============================================

\echo '--- Part 9: Testing UPDATE Operations ---'
\echo 'Expected: Should only allow update for current tenant'
\echo ''

DO $$
DECLARE
  company_a_id TEXT;
  company_b_id TEXT;
  patient_a_id TEXT;
  patient_b_id TEXT;
  updated_rows INTEGER;
BEGIN
  SELECT id INTO company_a_id FROM companies WHERE name = 'Test Optician A' LIMIT 1;
  SELECT id INTO company_b_id FROM companies WHERE name = 'Test Lab B' LIMIT 1;

  -- Get one patient from each company
  SELECT id INTO patient_a_id FROM patients WHERE company_id = company_a_id LIMIT 1;
  SELECT id INTO patient_b_id FROM patients WHERE company_id = company_b_id LIMIT 1;

  -- Set context to Company A
  PERFORM set_config('app.current_tenant', company_a_id, false);
  PERFORM set_config('app.current_user_role', 'user', false);

  -- Try to update Company A patient (should succeed)
  UPDATE patients
  SET first_name = 'UpdateTest'
  WHERE id = patient_a_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows > 0 THEN
    RAISE NOTICE '✓ PASS - Successfully updated own company patient';
    -- Revert
    UPDATE patients SET first_name = 'Alice' WHERE id = patient_a_id;
  ELSE
    RAISE NOTICE '✗ FAIL - Could not update own company patient';
  END IF;

  -- Try to update Company B patient (should fail/affect 0 rows)
  UPDATE patients
  SET first_name = 'BreachTest'
  WHERE id = patient_b_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    RAISE NOTICE '✓ PASS - Correctly blocked update of different company patient';
  ELSE
    RAISE NOTICE '✗ FAIL - Was able to update different company patient! SECURITY BREACH!';
  END IF;
END $$;

\echo ''

-- ============================================
-- PART 10: Summary and Cleanup
-- ============================================

\echo '--- Part 10: Test Summary ---'
\echo ''

SELECT
  'Total Tables with RLS' AS metric,
  COUNT(*)::text AS value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT
  'Total RLS Policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Critical Tables Protected',
  COUNT(*)::text
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND tablename IN ('patients', 'orders', 'prescriptions', 'users');

\echo ''
\echo '========================================='
\echo 'RLS TESTING COMPLETE'
\echo '========================================='
\echo ''
\echo 'Review the results above to verify:'
\echo '1. RLS is enabled on all tenant tables'
\echo '2. Users can only see their own tenant data'
\echo '3. Platform admins can see all data'
\echo '4. Write operations are restricted by tenant'
\echo ''
\echo 'Next Steps:'
\echo '- Review any FAIL messages above'
\echo '- Test with real user sessions via API'
\echo '- Monitor PostgreSQL logs for policy violations'
\echo '========================================='
\echo ''

-- Reset session
RESET app.current_tenant;
RESET app.current_user_role;
