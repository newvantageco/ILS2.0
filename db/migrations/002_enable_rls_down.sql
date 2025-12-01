-- ============================================
-- Row-Level Security (RLS) ROLLBACK Migration
-- WARNING: This removes all tenant isolation at the database level
-- Only run this in development/testing environments
-- ============================================

-- ============================================
-- PART 1: Drop RLS Policies and Disable RLS on Priority 1 Tables
-- ============================================

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  RAISE NOTICE '=== Disabling RLS on Priority 1 Tables (Critical Healthcare Data) ===';

  -- Core patient and clinical data
  FOR table_name IN
    SELECT unnest(ARRAY[
      'patients', 'prescriptions', 'eye_examinations',
      'orders', 'invoices', 'products',
      'ai_conversations', 'ai_messages'
    ])
  LOOP
    -- Drop all policies on this table
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
      RAISE NOTICE 'Dropped policy % on %', policy_name, table_name;
    END LOOP;

    -- Disable RLS
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
    RAISE NOTICE 'Disabled RLS on %', table_name;
  END LOOP;

  RAISE NOTICE '=== Priority 1 Tables Complete ===';
END $$;

-- ============================================
-- PART 2: Drop RLS on Priority 2 Tables (Insurance & Billing)
-- ============================================

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  RAISE NOTICE '=== Disabling RLS on Priority 2 Tables ===';

  FOR table_name IN
    SELECT unnest(ARRAY[
      'patient_insurance', 'medical_claims', 'insurance_companies',
      'insurance_plans', 'eligibility_verifications', 'preauthorizations',
      'payments', 'stripe_payment_intents',
      'inventory_movements', 'product_variants', 'low_stock_alerts', 'purchase_orders'
    ])
  LOOP
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    END LOOP;

    BEGIN
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table % does not exist, skipping', table_name;
    END;
  END LOOP;

  RAISE NOTICE '=== Priority 2 Tables Complete ===';
END $$;

-- ============================================
-- PART 3: Drop RLS on Priority 3 Tables (Standard Business)
-- ============================================

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  RAISE NOTICE '=== Disabling RLS on Priority 3 Tables ===';

  FOR table_name IN
    SELECT unnest(ARRAY[
      'care_plans', 'care_plan_goals', 'care_plan_interventions', 'care_team_members',
      'consult_logs', 'equipment', 'test_rooms', 'test_room_bookings',
      'calibration_records', 'remote_sessions', 'clinical_anomalies',
      'oma_validations', 'dispense_records',
      'pos_transactions', 'pos_transaction_items', 'pdf_templates',
      'ai_analyses', 'ai_model_deployments', 'company_ai_settings',
      'ai_notifications', 'ai_dispensing_recommendations', 'ai_recommendation_items',
      'email_logs', 'email_templates', 'email_tracking_events',
      'api_keys', 'custom_webhooks', 'webhook_deliveries',
      'company_supplier_relationships'
    ])
  LOOP
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    END LOOP;

    BEGIN
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
    EXCEPTION WHEN undefined_table THEN
      NULL; -- Silently skip missing tables
    END;
  END LOOP;

  RAISE NOTICE '=== Priority 3 Tables Complete ===';
END $$;

-- ============================================
-- PART 4: Drop RLS on Analytics Tables
-- ============================================

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  RAISE NOTICE '=== Disabling RLS on Analytics Tables ===';

  FOR table_name IN
    SELECT unnest(ARRAY[
      'usage_events', 'usage_records', 'feature_usage_metrics', 'analytics_events',
      'customer_health_scores', 'churn_predictions', 'customer_acquisition_sources',
      'revenue_recognition_events', 'subscription_change_history', 'subscription_history',
      'risk_factors', 'risk_scores', 'risk_score_factors',
      'pdsa_cycles', 'pdsa_plan_steps'
    ])
  LOOP
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    END LOOP;

    BEGIN
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END LOOP;

  RAISE NOTICE '=== Analytics Tables Complete ===';
END $$;

-- ============================================
-- PART 5: Drop RLS on Users Table (Special Case)
-- ============================================

DO $$
DECLARE
  policy_name TEXT;
BEGIN
  RAISE NOTICE '=== Disabling RLS on Users Table ===';

  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_name);
    RAISE NOTICE 'Dropped policy %', policy_name;
  END LOOP;

  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Disabled RLS on users';
END $$;

-- ============================================
-- PART 6: Drop RLS on Training Data Tables
-- ============================================

DO $$
DECLARE
  policy_name TEXT;
BEGIN
  RAISE NOTICE '=== Disabling RLS on Training Data Tables ===';

  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'training_data_analytics'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON training_data_analytics', policy_name);
  END LOOP;

  BEGIN
    ALTER TABLE training_data_analytics DISABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  RAISE NOTICE '=== Training Data Tables Complete ===';
END $$;

-- ============================================
-- PART 7: Drop Helper Functions
-- ============================================

DROP FUNCTION IF EXISTS test_rls_isolation(TEXT, TEXT);
DROP FUNCTION IF EXISTS audit_tenant_access(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_tenant_rls_policies(TEXT, TEXT);
DROP FUNCTION IF EXISTS is_platform_admin();
DROP FUNCTION IF EXISTS get_current_user_role();
DROP FUNCTION IF EXISTS get_current_tenant();

RAISE NOTICE 'Dropped RLS helper functions';

-- ============================================
-- PART 8: Drop Monitoring Views
-- ============================================

DROP VIEW IF EXISTS rls_policy_coverage;
DROP VIEW IF EXISTS rls_enabled_tables;

RAISE NOTICE 'Dropped monitoring views';

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE WARNING '=== RLS ROLLBACK COMPLETE ===';
  RAISE WARNING 'All Row-Level Security has been disabled.';
  RAISE WARNING 'Database is now UNPROTECTED from cross-tenant access.';
  RAISE WARNING 'Application-level security is now the ONLY protection.';
END $$;
