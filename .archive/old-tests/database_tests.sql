-- ILS Database Testing Script
-- Run this script to verify database integrity and functionality
-- Usage: psql $DATABASE_URL -f database_tests.sql

\echo '========================================='
\echo 'ILS Database Testing Script'
\echo 'Date: 2025-10-28'
\echo '========================================='
\echo ''

-- Set output format
\pset border 2
\x auto

\echo '1. CHECKING DATABASE CONNECTION'
\echo '----------------------------------------'
SELECT version();
SELECT current_database(), current_user;
\echo ''

\echo '2. LISTING ALL TABLES'
\echo '----------------------------------------'
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
\echo ''

\echo '3. CHECKING TABLE STRUCTURES'
\echo '----------------------------------------'

\echo 'Users Table:'
\d users

\echo 'Organizations Table:'
\d organizations

\echo 'Orders Table:'
\d orders

\echo 'Patients Table:'
\d patients

\echo 'Prescriptions Table:'
\d prescriptions

\echo ''

\echo '4. VERIFYING INDEXES'
\echo '----------------------------------------'
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
\echo ''

\echo '5. CHECKING FOREIGN KEY CONSTRAINTS'
\echo '----------------------------------------'
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
\echo ''

\echo '6. DATA INTEGRITY CHECKS'
\echo '----------------------------------------'

\echo 'Checking for null values in required fields (users):'
SELECT COUNT(*) AS users_with_null_email
FROM users
WHERE email IS NULL;

SELECT COUNT(*) AS users_with_null_role
FROM users
WHERE role IS NULL;

\echo 'Checking for orphaned orders (orders without valid customer):'
SELECT COUNT(*) AS orphaned_orders
FROM orders o
LEFT JOIN users u ON o.customer_id = u.id
WHERE u.id IS NULL;

\echo 'Checking for orphaned prescriptions (prescriptions without valid patient):'
SELECT COUNT(*) AS orphaned_prescriptions
FROM prescriptions p
LEFT JOIN patients pat ON p.patient_id = pat.id
WHERE pat.id IS NULL;

\echo ''

\echo '7. DATABASE STATISTICS'
\echo '----------------------------------------'

\echo 'Row counts for main tables:'
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'patients', COUNT(*) FROM patients
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'consult_logs', COUNT(*) FROM consult_logs
UNION ALL
SELECT 'analytics_events', COUNT(*) FROM analytics_events
UNION ALL
SELECT 'quality_issues', COUNT(*) FROM quality_issues
UNION ALL
SELECT 'returns', COUNT(*) FROM returns
UNION ALL
SELECT 'non_adapts', COUNT(*) FROM non_adapts
ORDER BY row_count DESC;

\echo ''

\echo '8. USER STATISTICS'
\echo '----------------------------------------'
\echo 'Users by role:'
SELECT 
    role,
    COUNT(*) AS count
FROM users
WHERE role IS NOT NULL
GROUP BY role
ORDER BY count DESC;

\echo 'Users by account status:'
SELECT 
    account_status,
    COUNT(*) AS count
FROM users
GROUP BY account_status
ORDER BY count DESC;

\echo 'Users by subscription plan:'
SELECT 
    subscription_plan,
    COUNT(*) AS count
FROM users
WHERE subscription_plan IS NOT NULL
GROUP BY subscription_plan
ORDER BY count DESC;

\echo ''

\echo '9. ORDER STATISTICS'
\echo '----------------------------------------'
\echo 'Orders by status:'
SELECT 
    status,
    COUNT(*) AS count
FROM orders
GROUP BY status
ORDER BY count DESC;

\echo 'Orders by lens type:'
SELECT 
    lens_type,
    COUNT(*) AS count
FROM orders
WHERE lens_type IS NOT NULL
GROUP BY lens_type
ORDER BY count DESC;

\echo 'Recent orders (last 10):'
SELECT 
    id,
    customer_name,
    status,
    created_at,
    updated_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

\echo ''

\echo '10. RELATIONSHIP TESTS'
\echo '----------------------------------------'
\echo 'Orders with customer details:'
SELECT 
    o.id AS order_id,
    o.status,
    u.email AS customer_email,
    org.name AS organization_name,
    o.created_at
FROM orders o
JOIN users u ON o.customer_id = u.id
JOIN organizations org ON u.organization_id = org.id
ORDER BY o.created_at DESC
LIMIT 5;

\echo 'Prescriptions with patient and prescriber:'
SELECT 
    p.id AS prescription_id,
    pat.first_name || ' ' || pat.last_name AS patient_name,
    u.email AS prescriber_email,
    p.created_at
FROM prescriptions p
JOIN patients pat ON p.patient_id = pat.id
JOIN users u ON p.prescriber_id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

\echo ''

\echo '11. DATA QUALITY CHECKS'
\echo '----------------------------------------'

\echo 'Checking email format (users):'
SELECT COUNT(*) AS invalid_emails
FROM users
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$';

\echo 'Checking for duplicate emails:'
SELECT 
    email,
    COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

\echo 'Checking for orders without customer name:'
SELECT COUNT(*) AS orders_without_customer_name
FROM orders
WHERE customer_name IS NULL OR customer_name = '';

\echo 'Checking prescription validity (not expired):'
SELECT COUNT(*) AS expired_prescriptions
FROM prescriptions
WHERE expires_at < CURRENT_DATE;

\echo ''

\echo '12. PERFORMANCE CHECKS'
\echo '----------------------------------------'

\echo 'Query performance for order retrieval:'
EXPLAIN ANALYZE
SELECT o.*, u.email
FROM orders o
JOIN users u ON o.customer_id = u.id
WHERE o.status = 'pending'
LIMIT 10;

\echo 'Query performance for user lookup:'
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'admin@ils.com';

\echo ''

\echo '13. ENUM VALUE CHECKS'
\echo '----------------------------------------'

\echo 'Valid role enum values:'
SELECT enum_range(NULL::user_role);

\echo 'Valid order status enum values:'
SELECT enum_range(NULL::order_status);

\echo 'Valid account status enum values:'
SELECT enum_range(NULL::account_status);

\echo 'Valid subscription plan enum values:'
SELECT enum_range(NULL::subscription_plan);

\echo ''

\echo '14. TIMESTAMP CHECKS'
\echo '----------------------------------------'

\echo 'Checking for future timestamps (data anomalies):'
SELECT 
    'users' AS table_name,
    COUNT(*) AS future_timestamps
FROM users
WHERE created_at > CURRENT_TIMESTAMP
UNION ALL
SELECT 
    'orders',
    COUNT(*)
FROM orders
WHERE created_at > CURRENT_TIMESTAMP;

\echo 'Orders with updated_at before created_at (data integrity issue):'
SELECT COUNT(*) AS invalid_timestamps
FROM orders
WHERE updated_at < created_at;

\echo ''

\echo '15. QUALITY ISSUES & RETURNS'
\echo '----------------------------------------'

\echo 'Quality issues by type:'
SELECT 
    issue_type,
    COUNT(*) AS count
FROM quality_issues
GROUP BY issue_type
ORDER BY count DESC;

\echo 'Quality issues by status:'
SELECT 
    status,
    COUNT(*) AS count
FROM quality_issues
GROUP BY status
ORDER BY count DESC;

\echo 'Returns by status:'
SELECT 
    status,
    COUNT(*) AS count
FROM returns
GROUP BY status
ORDER BY count DESC;

\echo 'Non-adapts by resolution type:'
SELECT 
    resolution_type,
    COUNT(*) AS count
FROM non_adapts
WHERE resolution_type IS NOT NULL
GROUP BY resolution_type
ORDER BY count DESC;

\echo ''

\echo '16. ANALYTICS EVENTS'
\echo '----------------------------------------'

\echo 'Analytics events by type:'
SELECT 
    event_type,
    COUNT(*) AS count
FROM analytics_events
GROUP BY event_type
ORDER BY count DESC;

\echo 'Recent analytics events:'
SELECT 
    event_type,
    source_type,
    timestamp
FROM analytics_events
ORDER BY timestamp DESC
LIMIT 10;

\echo ''

\echo '17. DATABASE SIZE INFORMATION'
\echo '----------------------------------------'

SELECT 
    pg_size_pretty(pg_database_size(current_database())) AS database_size;

\echo 'Table sizes:'
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

\echo ''

\echo '18. AUDIT LOG CHECK (if exists)'
\echo '----------------------------------------'
-- Check if audit log table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
) AS audit_log_exists;

\echo ''

\echo '19. SESSION MANAGEMENT'
\echo '----------------------------------------'

\echo 'Active sessions count:'
SELECT COUNT(*) AS active_sessions
FROM sessions
WHERE expire > CURRENT_TIMESTAMP;

\echo 'Expired sessions count:'
SELECT COUNT(*) AS expired_sessions
FROM sessions
WHERE expire <= CURRENT_TIMESTAMP;

\echo ''

\echo '20. TEST DATA VERIFICATION'
\echo '----------------------------------------'

\echo 'Sample user record:'
SELECT 
    id,
    email,
    role,
    account_status,
    subscription_plan,
    created_at
FROM users
LIMIT 1;

\echo 'Sample order record:'
SELECT 
    id,
    customer_name,
    status,
    lens_type,
    created_at
FROM orders
LIMIT 1;

\echo ''
\echo '========================================='
\echo 'Database Testing Complete!'
\echo '========================================='
\echo ''
\echo 'RECOMMENDATIONS:'
\echo '1. Review any orphaned records found'
\echo '2. Check invalid email formats'
\echo '3. Verify timestamp anomalies'
\echo '4. Ensure all foreign key relationships are valid'
\echo '5. Monitor table sizes and create indexes if needed'
\echo ''
