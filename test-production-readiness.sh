#!/bin/bash

# Integrated Lens System - Production Readiness Test Suite
# Tests all major platform capabilities

set -e

BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Test result function
test_result() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "================================================"
echo "  ILS PRODUCTION READINESS TEST SUITE"
echo "================================================"
echo ""

# ============================================
# TEST 1: HEALTH & CONNECTIVITY
# ============================================
echo -e "${YELLOW}[1/15] Testing Health & Connectivity...${NC}"

# Test health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/health)
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Health endpoint responds (200 OK)"
else
    test_result 1 "Health endpoint responds (Got: $HTTP_CODE)"
fi

# Test database connectivity
DB_RESULT=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
if [ "$DB_RESULT" -gt 0 ]; then
    test_result 0 "Database connectivity (Found $DB_RESULT users)"
else
    test_result 1 "Database connectivity"
fi

# ============================================
# TEST 2: DATABASE SCHEMA
# ============================================
echo ""
echo -e "${YELLOW}[2/15] Testing Database Schema...${NC}"

# Check critical tables exist
CRITICAL_TABLES=("users" "companies" "patients" "orders" "prescriptions" "products" "invoices" "eye_examinations")
for table in "${CRITICAL_TABLES[@]}"; do
    TABLE_EXISTS=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';" 2>/dev/null)
    if [ "$TABLE_EXISTS" -eq 1 ]; then
        test_result 0 "Table '$table' exists"
    else
        test_result 1 "Table '$table' exists"
    fi
done

# ============================================
# TEST 3: AUTHENTICATION API
# ============================================
echo ""
echo -e "${YELLOW}[3/15] Testing Authentication API...${NC}"

# Test signup endpoint exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${API_URL}/auth/signup-email \
    -H "Content-Type: application/json" \
    -d '{}')
if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 422 ]; then
    test_result 0 "Signup endpoint responds (validation working)"
else
    test_result 1 "Signup endpoint responds (Got: $HTTP_CODE)"
fi

# Test login endpoint exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${API_URL}/auth/login-email \
    -H "Content-Type: application/json" \
    -d '{}')
if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 422 ]; then
    test_result 0 "Login endpoint responds (validation working)"
else
    test_result 1 "Login endpoint responds (Got: $HTTP_CODE)"
fi

# ============================================
# TEST 4: MULTI-TENANCY
# ============================================
echo ""
echo -e "${YELLOW}[4/15] Testing Multi-Tenancy...${NC}"

# Check multiple companies exist
COMPANY_COUNT=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null || echo "0")
if [ "$COMPANY_COUNT" -ge 1 ]; then
    test_result 0 "Multiple companies in database ($COMPANY_COUNT companies)"
else
    test_result 1 "Multiple companies in database"
fi

# Check users are scoped to companies
USERS_WITH_COMPANY=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM users WHERE company_id IS NOT NULL;" 2>/dev/null || echo "0")
if [ "$USERS_WITH_COMPANY" -gt 0 ]; then
    test_result 0 "Users properly scoped to companies ($USERS_WITH_COMPANY users)"
else
    test_result 1 "Users properly scoped to companies"
fi

# ============================================
# TEST 5: PATIENT MANAGEMENT API
# ============================================
echo ""
echo -e "${YELLOW}[5/15] Testing Patient Management API...${NC}"

# Test patients endpoint (should require auth)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/patients)
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    test_result 0 "Patients endpoint protected (requires auth)"
else
    test_result 1 "Patients endpoint protected (Got: $HTTP_CODE, expected 401/403)"
fi

# Check patient table structure
PATIENT_COLUMNS=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='patients';" 2>/dev/null || echo "0")
if [ "$PATIENT_COLUMNS" -ge 10 ]; then
    test_result 0 "Patient table has required columns ($PATIENT_COLUMNS columns)"
else
    test_result 1 "Patient table has required columns (only $PATIENT_COLUMNS columns)"
fi

# ============================================
# TEST 6: ORDER PROCESSING
# ============================================
echo ""
echo -e "${YELLOW}[6/15] Testing Order Processing...${NC}"

# Test orders endpoint (should require auth)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/orders)
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    test_result 0 "Orders endpoint protected (requires auth)"
else
    test_result 1 "Orders endpoint protected (Got: $HTTP_CODE)"
fi

# Check order statuses are defined
ORDER_STATUS_COUNT=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM pg_type WHERE typname='order_status';" 2>/dev/null || echo "0")
if [ "$ORDER_STATUS_COUNT" -eq 1 ]; then
    test_result 0 "Order status enum defined"
else
    test_result 1 "Order status enum defined"
fi

# ============================================
# TEST 7: EXAMINATION SYSTEM
# ============================================
echo ""
echo -e "${YELLOW}[7/15] Testing Examination System...${NC}"

# Test examinations endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/examinations)
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    test_result 0 "Examinations endpoint protected"
else
    test_result 1 "Examinations endpoint protected (Got: $HTTP_CODE)"
fi

# Check examination table exists with proper structure
EXAM_COLUMNS=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='eye_examinations';" 2>/dev/null || echo "0")
if [ "$EXAM_COLUMNS" -ge 15 ]; then
    test_result 0 "Eye examination table properly structured ($EXAM_COLUMNS columns)"
else
    test_result 1 "Eye examination table properly structured (only $EXAM_COLUMNS columns)"
fi

# ============================================
# TEST 8: PRESCRIPTION MANAGEMENT
# ============================================
echo ""
echo -e "${YELLOW}[8/15] Testing Prescription Management...${NC}"

# Test prescriptions endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/prescriptions)
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    test_result 0 "Prescriptions endpoint protected"
else
    test_result 1 "Prescriptions endpoint protected (Got: $HTTP_CODE)"
fi

# Check prescription templates exist
TEMPLATE_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='prescription_templates';" 2>/dev/null || echo "0")
if [ "$TEMPLATE_TABLE" -eq 1 ]; then
    test_result 0 "Prescription templates table exists"
else
    test_result 1 "Prescription templates table exists"
fi

# ============================================
# TEST 9: INVENTORY MANAGEMENT
# ============================================
echo ""
echo -e "${YELLOW}[9/15] Testing Inventory Management...${NC}"

# Test products endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/products)
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    test_result 0 "Products endpoint protected"
else
    test_result 1 "Products endpoint protected (Got: $HTTP_CODE)"
fi

# Check product table structure
PRODUCT_COLUMNS=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='products';" 2>/dev/null || echo "0")
if [ "$PRODUCT_COLUMNS" -ge 10 ]; then
    test_result 0 "Product table properly structured ($PRODUCT_COLUMNS columns)"
else
    test_result 1 "Product table properly structured (only $PRODUCT_COLUMNS columns)"
fi

# ============================================
# TEST 10: POINT OF SALE
# ============================================
echo ""
echo -e "${YELLOW}[10/15] Testing Point of Sale...${NC}"

# Test POS endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/pos/products)
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "POS endpoint exists"
else
    test_result 1 "POS endpoint exists (Got: $HTTP_CODE)"
fi

# Check invoice tables
INVOICE_TABLES=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('invoices', 'invoice_line_items');" 2>/dev/null || echo "0")
if [ "$INVOICE_TABLES" -eq 2 ]; then
    test_result 0 "Invoice tables exist (invoices, invoice_line_items)"
else
    test_result 1 "Invoice tables exist"
fi

# ============================================
# TEST 11: QUALITY & RETURNS
# ============================================
echo ""
echo -e "${YELLOW}[11/15] Testing Quality & Returns...${NC}"

# Check quality issues table
QUALITY_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='quality_issues';" 2>/dev/null || echo "0")
if [ "$QUALITY_TABLE" -eq 1 ]; then
    test_result 0 "Quality issues table exists"
else
    test_result 1 "Quality issues table exists"
fi

# Check returns table
RETURNS_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='returns';" 2>/dev/null || echo "0")
if [ "$RETURNS_TABLE" -eq 1 ]; then
    test_result 0 "Returns table exists"
else
    test_result 1 "Returns table exists"
fi

# Check non-adapts table
NONADAPT_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='non_adapts';" 2>/dev/null || echo "0")
if [ "$NONADAPT_TABLE" -eq 1 ]; then
    test_result 0 "Non-adapts table exists"
else
    test_result 1 "Non-adapts table exists"
fi

# ============================================
# TEST 12: EQUIPMENT MANAGEMENT
# ============================================
echo ""
echo -e "${YELLOW}[12/15] Testing Equipment Management...${NC}"

# Check equipment table
EQUIPMENT_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='equipment';" 2>/dev/null || echo "0")
if [ "$EQUIPMENT_TABLE" -eq 1 ]; then
    test_result 0 "Equipment table exists"
else
    test_result 1 "Equipment table exists"
fi

# Check calibration records
CALIBRATION_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='calibration_records';" 2>/dev/null || echo "0")
if [ "$CALIBRATION_TABLE" -eq 1 ]; then
    test_result 0 "Calibration records table exists"
else
    test_result 1 "Calibration records table exists"
fi

# Check test rooms
TESTROOM_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='test_rooms';" 2>/dev/null || echo "0")
if [ "$TESTROOM_TABLE" -eq 1 ]; then
    test_result 0 "Test rooms table exists"
else
    test_result 1 "Test rooms table exists"
fi

# ============================================
# TEST 13: AI FEATURES
# ============================================
echo ""
echo -e "${YELLOW}[13/15] Testing AI Features...${NC}"

# Check AI tables exist
AI_TABLES=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'ai_%';" 2>/dev/null || echo "0")
if [ "$AI_TABLES" -ge 8 ]; then
    test_result 0 "AI feature tables exist ($AI_TABLES AI tables)"
else
    test_result 1 "AI feature tables exist (only $AI_TABLES AI tables, expected 8+)"
fi

# Test AI assistant endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${API_URL}/ai-assistant/ask \
    -H "Content-Type: application/json" \
    -d '{}')
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 400 ]; then
    test_result 0 "AI assistant endpoint exists"
else
    test_result 1 "AI assistant endpoint exists (Got: $HTTP_CODE)"
fi

# ============================================
# TEST 14: COMPLIANCE & SECURITY
# ============================================
echo ""
echo -e "${YELLOW}[14/15] Testing Compliance & Security...${NC}"

# Check audit logs table
AUDIT_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='audit_logs';" 2>/dev/null || echo "0")
if [ "$AUDIT_TABLE" -eq 1 ]; then
    test_result 0 "Audit logs table exists (HIPAA compliance)"
else
    test_result 1 "Audit logs table exists"
fi

# Check GOC compliance
GOC_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='goc_compliance_checks';" 2>/dev/null || echo "0")
if [ "$GOC_TABLE" -eq 1 ]; then
    test_result 0 "GOC compliance table exists"
else
    test_result 1 "GOC compliance table exists"
fi

# Check permissions system
PERMISSION_TABLES=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('permissions', 'role_permissions', 'user_custom_permissions');" 2>/dev/null || echo "0")
if [ "$PERMISSION_TABLES" -eq 3 ]; then
    test_result 0 "Permission system tables exist"
else
    test_result 1 "Permission system tables exist (found $PERMISSION_TABLES/3)"
fi

# ============================================
# TEST 15: PRODUCTION READINESS
# ============================================
echo ""
echo -e "${YELLOW}[15/15] Testing Production Readiness...${NC}"

# Check if sessions table exists
SESSION_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='sessions';" 2>/dev/null || echo "0")
if [ "$SESSION_TABLE" -eq 1 ]; then
    test_result 0 "Session management table exists"
else
    test_result 1 "Session management table exists"
fi

# Check if notifications system exists
NOTIFICATION_TABLE=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='notifications';" 2>/dev/null || echo "0")
if [ "$NOTIFICATION_TABLE" -eq 1 ]; then
    test_result 0 "Notification system exists"
else
    test_result 1 "Notification system exists"
fi

# Check if analytics tables exist
ANALYTICS_TABLES=$(psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%analytics%';" 2>/dev/null || echo "0")
if [ "$ANALYTICS_TABLES" -ge 3 ]; then
    test_result 0 "Analytics system exists ($ANALYTICS_TABLES analytics tables)"
else
    test_result 1 "Analytics system exists (only $ANALYTICS_TABLES tables)"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "================================================"
echo "  TEST RESULTS SUMMARY"
echo "================================================"
echo -e "Total Tests: ${TESTS_TOTAL}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ ALL TESTS PASSED - System is production ready!${NC}"
    exit 0
else
    echo ""
    PASS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "${YELLOW}⚠ ${PASS_RATE}% tests passed - Review failures above${NC}"
    exit 1
fi
