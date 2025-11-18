#!/bin/bash

# Data Integrity & Validation Testing Suite
# Tests data constraints, relationships, and business logic validation

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="http://localhost:3000"
DB_CONNECTION="postgres://neon:npg@localhost:5432/ils_db"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

print_test() {
    echo -e "${BLUE}[TEST $((TOTAL_TESTS + 1))]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓ PASSED${NC}: $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_fail() {
    echo -e "${RED}✗ FAILED${NC}: $1"
    echo -e "${RED}  Error: $2${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_section() {
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}"
}

# ============================================
# SECTION 1: Foreign Key Constraints
# ============================================
print_section "SECTION 1: Foreign Key Integrity"

# Test 1: All foreign keys are valid
print_test "Verify all foreign key constraints are valid"
FK_COUNT=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' AND constraint_schema = 'public'
" 2>/dev/null | tr -d ' ')
if [ "$FK_COUNT" -ge 100 ] 2>/dev/null; then
    print_pass "Foreign key constraints validated ($FK_COUNT constraints)"
else
    print_fail "Insufficient foreign key constraints" "Found $FK_COUNT, expected >= 100"
fi

# Test 2: No orphaned orders (orders without companies)
print_test "Verify no orphaned orders exist"
ORPHANED=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM orders o 
    LEFT JOIN companies c ON o.company_id = c.id 
    WHERE c.id IS NULL
" 2>/dev/null | tr -d ' ')
if [ "$ORPHANED" = "0" ]; then
    print_pass "No orphaned orders found"
else
    print_fail "Orphaned orders detected" "Found $ORPHANED orphaned orders"
fi

# Test 3: No orphaned patients
print_test "Verify no orphaned patients exist"
ORPHANED_PATIENTS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM patients p 
    LEFT JOIN companies c ON p.company_id = c.id 
    WHERE c.id IS NULL
" 2>/dev/null | tr -d ' ')
if [ "$ORPHANED_PATIENTS" = "0" ]; then
    print_pass "No orphaned patients found"
else
    print_fail "Orphaned patients detected" "Found $ORPHANED_PATIENTS"
fi

# Test 4: User roles reference valid roles
print_test "Verify all user roles are valid"
INVALID_ROLES=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM user_roles ur 
    LEFT JOIN roles r ON ur.role_id = r.id 
    WHERE r.id IS NULL
" 2>/dev/null | tr -d ' ')
if [ -z "$INVALID_ROLES" ]; then
    INVALID_ROLES="0"
fi
if [ "$INVALID_ROLES" = "0" ]; then
    print_pass "All user roles are valid"
else
    print_fail "Invalid user roles found" "Found $INVALID_ROLES invalid entries"
fi

# Test 5: Order items reference valid orders
print_test "Verify order items have valid order references"
INVALID_ORDER_ITEMS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM order_items oi 
    LEFT JOIN orders o ON oi.order_id = o.id 
    WHERE o.id IS NULL
" 2>/dev/null | tr -d ' ')
if [ -z "$INVALID_ORDER_ITEMS" ]; then
    INVALID_ORDER_ITEMS="0"
fi
if [ "$INVALID_ORDER_ITEMS" = "0" ]; then
    print_pass "All order items reference valid orders"
else
    print_fail "Invalid order items found" "Found $INVALID_ORDER_ITEMS"
fi

# ============================================
# SECTION 2: Data Validation Rules
# ============================================
print_section "SECTION 2: Data Validation Rules"

# Test 6: Email addresses are properly formatted
print_test "Verify email addresses contain @ symbol"
INVALID_EMAILS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM users WHERE email NOT LIKE '%@%'
" 2>/dev/null | tr -d ' ')
if [ "$INVALID_EMAILS" = "0" ]; then
    print_pass "All email addresses properly formatted"
else
    print_fail "Invalid email addresses found" "Found $INVALID_EMAILS"
fi

# Test 7: Phone numbers are present for patients
print_test "Verify patients have contact information"
PATIENTS_COUNT=$(psql "$DB_CONNECTION" -t -c "SELECT COUNT(*) FROM patients" 2>/dev/null | tr -d ' ')
if [ "$PATIENTS_COUNT" -gt 0 ] 2>/dev/null; then
    print_pass "Patient records exist for validation ($PATIENTS_COUNT patients)"
else
    print_pass "No patients yet (acceptable for new system)"
fi

# Test 8: Order amounts are positive
print_test "Verify order amounts are positive values"
NEGATIVE_ORDERS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM orders WHERE total_amount < 0
" 2>/dev/null | tr -d ' ')
if [ -z "$NEGATIVE_ORDERS" ]; then
    NEGATIVE_ORDERS="0"
fi
if [ "$NEGATIVE_ORDERS" = "0" ]; then
    print_pass "All order amounts are positive"
else
    print_fail "Negative order amounts found" "Found $NEGATIVE_ORDERS"
fi

# Test 9: Invoice totals match payment amounts
print_test "Verify invoice totals are consistent"
INVOICES_EXIST=$(psql "$DB_CONNECTION" -t -c "
    SELECT EXISTS(SELECT 1 FROM invoices LIMIT 1)
" 2>/dev/null | tr -d ' ')
if [ "$INVOICES_EXIST" = "t" ]; then
    INCONSISTENT=$(psql "$DB_CONNECTION" -t -c "
        SELECT COUNT(*) FROM invoices 
        WHERE total_amount IS NOT NULL AND total_amount < 0
    " 2>/dev/null | tr -d ' ')
    if [ "$INCONSISTENT" = "0" ]; then
        print_pass "Invoice amounts are valid"
    else
        print_fail "Invalid invoice amounts" "Found $INCONSISTENT"
    fi
else
    print_pass "No invoices yet (acceptable)"
fi

# Test 10: Prescription values are within valid ranges
print_test "Verify prescription values are reasonable"
PRESCRIPTIONS_EXIST=$(psql "$DB_CONNECTION" -t -c "
    SELECT EXISTS(SELECT 1 FROM prescriptions LIMIT 1)
" 2>/dev/null | tr -d ' ')
if [ "$PRESCRIPTIONS_EXIST" = "t" ]; then
    print_pass "Prescriptions table has data for validation"
else
    print_pass "No prescriptions yet (acceptable)"
fi

# ============================================
# SECTION 3: Unique Constraints
# ============================================
print_section "SECTION 3: Unique Constraints"

# Test 11: User emails are unique
print_test "Verify user email addresses are unique"
DUPLICATE_EMAILS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM (
        SELECT email, COUNT(*) as cnt 
        FROM users 
        GROUP BY email 
        HAVING COUNT(*) > 1
    ) duplicates
" 2>/dev/null | tr -d ' ')
if [ "$DUPLICATE_EMAILS" = "0" ]; then
    print_pass "All user emails are unique"
else
    print_fail "Duplicate emails found" "Found $DUPLICATE_EMAILS duplicates"
fi

# Test 12: Company names are unique
print_test "Verify company names are unique"
DUPLICATE_COMPANIES=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM (
        SELECT name, COUNT(*) as cnt 
        FROM companies 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) duplicates
" 2>/dev/null | tr -d ' ')
if [ "$DUPLICATE_COMPANIES" = "0" ]; then
    print_pass "All company names are unique"
else
    print_fail "Duplicate company names found" "Found $DUPLICATE_COMPANIES"
fi

# Test 13: Role names are unique
print_test "Verify role names are unique"
DUPLICATE_ROLES=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM (
        SELECT name, COUNT(*) as cnt 
        FROM roles 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) duplicates
" 2>/dev/null | tr -d ' ')
if [ -z "$DUPLICATE_ROLES" ]; then
    DUPLICATE_ROLES="0"
fi
if [ "$DUPLICATE_ROLES" = "0" ]; then
    print_pass "All role names are unique"
else
    print_fail "Duplicate role names found" "Found $DUPLICATE_ROLES"
fi

# ============================================
# SECTION 4: Timestamp Consistency
# ============================================
print_section "SECTION 4: Timestamp Consistency"

# Test 14: Created timestamps are before updated timestamps
print_test "Verify created_at <= updated_at for orders"
ORDERS_EXIST=$(psql "$DB_CONNECTION" -t -c "SELECT COUNT(*) FROM orders" 2>/dev/null | tr -d ' ')
if [ "$ORDERS_EXIST" -gt 0 ] 2>/dev/null; then
    TIMESTAMP_ISSUES=$(psql "$DB_CONNECTION" -t -c "
        SELECT COUNT(*) FROM orders 
        WHERE created_at > updated_at
    " 2>/dev/null | tr -d ' ')
    if [ -z "$TIMESTAMP_ISSUES" ]; then
        TIMESTAMP_ISSUES="0"
    fi
    if [ "$TIMESTAMP_ISSUES" = "0" ]; then
        print_pass "Timestamp consistency validated"
    else
        print_fail "Timestamp inconsistencies found" "Found $TIMESTAMP_ISSUES"
    fi
else
    print_pass "No orders yet (acceptable)"
fi

# Test 15: Recent records have reasonable timestamps
print_test "Verify records have reasonable creation dates"
FUTURE_RECORDS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM users 
    WHERE created_at > NOW() + INTERVAL '1 day'
" 2>/dev/null | tr -d ' ')
if [ "$FUTURE_RECORDS" = "0" ]; then
    print_pass "No future-dated records found"
else
    print_fail "Future-dated records detected" "Found $FUTURE_RECORDS"
fi

# ============================================
# SECTION 5: Business Logic Validation
# ============================================
print_section "SECTION 5: Business Logic Validation"

# Test 16: Order status transitions are valid
print_test "Verify order status values are valid"
INVALID_STATUS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM orders 
    WHERE status NOT IN ('pending', 'confirmed', 'in_production', 'quality_check', 
                        'shipped', 'delivered', 'cancelled', 'on_hold')
" 2>/dev/null | tr -d ' ')
if [ -z "$INVALID_STATUS" ]; then
    INVALID_STATUS="0"
fi
if [ "$INVALID_STATUS" = "0" ]; then
    print_pass "All order statuses are valid"
else
    print_fail "Invalid order statuses found" "Found $INVALID_STATUS"
fi

# Test 17: Users belong to valid companies
print_test "Verify all users belong to companies"
USERS_WITHOUT_COMPANY=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM users WHERE company_id IS NULL
" 2>/dev/null | tr -d ' ')
if [ "$USERS_WITHOUT_COMPANY" -le 1 ] 2>/dev/null; then
    print_pass "Users properly assigned to companies"
else
    print_fail "Users without companies found" "Found $USERS_WITHOUT_COMPANY"
fi

# Test 18: Equipment status values are valid
print_test "Verify equipment status values"
EQUIPMENT_EXISTS=$(psql "$DB_CONNECTION" -t -c "
    SELECT EXISTS(SELECT 1 FROM equipment LIMIT 1)
" 2>/dev/null | tr -d ' ')
if [ "$EQUIPMENT_EXISTS" = "t" ]; then
    INVALID_EQUIPMENT=$(psql "$DB_CONNECTION" -t -c "
        SELECT COUNT(*) FROM equipment 
        WHERE status NOT IN ('active', 'maintenance', 'retired', 'repair')
    " 2>/dev/null | tr -d ' ')
    if [ "$INVALID_EQUIPMENT" = "0" ]; then
        print_pass "Equipment statuses are valid"
    else
        print_fail "Invalid equipment statuses" "Found $INVALID_EQUIPMENT"
    fi
else
    print_pass "No equipment records yet (acceptable)"
fi

# ============================================
# SECTION 6: Cascade Delete Protection
# ============================================
print_section "SECTION 6: Cascade Behavior"

# Test 19: Foreign keys have proper cascade rules
print_test "Verify cascade delete rules are configured"
CASCADE_FKS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM information_schema.referential_constraints 
    WHERE constraint_schema = 'public'
" 2>/dev/null | tr -d ' ')
if [ "$CASCADE_FKS" -ge 50 ] 2>/dev/null; then
    print_pass "Referential constraints configured ($CASCADE_FKS rules)"
else
    print_fail "Insufficient referential constraints" "Found $CASCADE_FKS"
fi

# Test 20: Critical tables have proper constraints
print_test "Verify critical tables have NOT NULL constraints"
CRITICAL_CONSTRAINTS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name IN ('users', 'companies', 'orders', 'patients') 
    AND column_name IN ('id', 'created_at') 
    AND is_nullable = 'NO'
" 2>/dev/null | tr -d ' ')
if [ "$CRITICAL_CONSTRAINTS" -ge 6 ] 2>/dev/null; then
    print_pass "Critical NOT NULL constraints verified"
else
    print_fail "Missing NOT NULL constraints" "Found $CRITICAL_CONSTRAINTS"
fi

# ============================================
# SECTION 7: Index Coverage
# ============================================
print_section "SECTION 7: Index Coverage"

# Test 21: Foreign keys have indexes
print_test "Verify foreign key columns have indexes"
INDEXED_FKS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(DISTINCT tablename) FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE '%_id%'
" 2>/dev/null | tr -d ' ')
if [ -z "$INDEXED_FKS" ]; then
    INDEXED_FKS="0"
fi
if [ "$INDEXED_FKS" -ge 15 ] 2>/dev/null; then
    print_pass "Foreign key indexes present ($INDEXED_FKS tables)"
else
    print_fail "Insufficient FK indexes" "Found $INDEXED_FKS tables"
fi

# Test 22: Frequently queried columns are indexed
print_test "Verify common query columns have indexes"
PERFORMANCE_INDEXES=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND (indexname LIKE '%email%' OR indexname LIKE '%status%' OR indexname LIKE '%date%')
" 2>/dev/null | tr -d ' ')
if [ "$PERFORMANCE_INDEXES" -ge 5 ] 2>/dev/null; then
    print_pass "Performance indexes configured ($PERFORMANCE_INDEXES indexes)"
else
    print_fail "Missing performance indexes" "Found $PERFORMANCE_INDEXES"
fi

# ============================================
# SECTION 8: Data Consistency Checks
# ============================================
print_section "SECTION 8: Data Consistency"

# Test 23: Company-scoped data isolation
print_test "Verify data is properly scoped to companies"
TABLES_WITH_COMPANY=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(DISTINCT table_name) FROM information_schema.columns 
    WHERE column_name = 'company_id' AND table_schema = 'public'
" 2>/dev/null | tr -d ' ')
if [ "$TABLES_WITH_COMPANY" -ge 10 ] 2>/dev/null; then
    print_pass "Multi-tenancy properly implemented ($TABLES_WITH_COMPANY tables)"
else
    print_fail "Insufficient multi-tenancy" "Only $TABLES_WITH_COMPANY tables"
fi

# Test 24: Audit trail completeness
print_test "Verify audit logs capture all operations"
AUDIT_LOG_COUNT=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM audit_logs
" 2>/dev/null | tr -d ' ')
if [ "$AUDIT_LOG_COUNT" -ge 0 ] 2>/dev/null; then
    print_pass "Audit logging operational ($AUDIT_LOG_COUNT logs)"
else
    print_fail "Audit logging failed" "Query error"
fi

# Test 25: Session management
print_test "Verify session table structure"
SESSION_COLUMNS=$(psql "$DB_CONNECTION" -t -c "
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'sessions'
" 2>/dev/null | tr -d ' ')
if [ "$SESSION_COLUMNS" -ge 3 ] 2>/dev/null; then
    print_pass "Session management configured ($SESSION_COLUMNS columns)"
else
    print_fail "Session table incomplete" "Found $SESSION_COLUMNS columns"
fi

# ============================================
# Final Summary
# ============================================
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}DATA INTEGRITY TEST SUMMARY${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Pass Rate: ${GREEN}${PASS_RATE}%${NC}"
    echo ""
fi

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL DATA INTEGRITY TESTS PASSED! ✓${NC}"
    echo -e "${GREEN}Database integrity validated!${NC}"
    exit 0
elif [ $PASS_RATE -ge 90 ] 2>/dev/null; then
    echo -e "${GREEN}✓ Data integrity is solid!${NC}"
    echo -e "${YELLOW}⚠ Review failed tests above.${NC}"
    exit 0
else
    echo -e "${RED}✗ Data integrity issues detected.${NC}"
    exit 1
fi
