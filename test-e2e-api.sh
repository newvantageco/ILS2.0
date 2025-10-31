#!/bin/bash

# End-to-End API Testing Script for Eye Examination System
# This script tests the backend API endpoints for the comprehensive eye examination workflow

echo "=========================================="
echo "Eye Examination System - API E2E Testing"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000"
API_URL="$BASE_URL/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_result() {
    local test_name=$1
    local status=$2
    local message=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        echo -e "  ${RED}Error: $message${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to check HTTP status
check_status() {
    local expected=$1
    local actual=$2
    
    if [ "$expected" = "$actual" ]; then
        return 0
    else
        return 1
    fi
}

echo "Step 1: Health Check"
echo "--------------------"

# Test 1: Server health check
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>&1)
if check_status "200" "$RESPONSE"; then
    print_result "Server Health Check" "PASS"
else
    print_result "Server Health Check" "FAIL" "Expected 200, got $RESPONSE"
fi

echo ""
echo "Step 2: Authentication & User Data"
echo "-----------------------------------"

# Test 2: Check authentication endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/user" 2>&1)
if [[ "$RESPONSE" =~ ^(200|401)$ ]]; then
    print_result "Auth Endpoint Accessible" "PASS"
else
    print_result "Auth Endpoint Accessible" "FAIL" "Expected 200 or 401, got $RESPONSE"
fi

echo ""
echo "Step 3: Patient Management"
echo "--------------------------"

# Test 3: Get patients list
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/patients" 2>&1)
if [[ "$RESPONSE" =~ ^(200|401)$ ]]; then
    print_result "Get Patients List" "PASS"
else
    print_result "Get Patients List" "FAIL" "Expected 200 or 401, got $RESPONSE"
fi

# Test 4: Get patients data (if authenticated)
PATIENTS_DATA=$(curl -s "$API_URL/patients" 2>&1)
if echo "$PATIENTS_DATA" | grep -q "^\["; then
    print_result "Patients Data Format (JSON Array)" "PASS"
    PATIENT_COUNT=$(echo "$PATIENTS_DATA" | grep -o '"id"' | wc -l)
    echo -e "  ${YELLOW}Info: Found $PATIENT_COUNT patients${NC}"
else
    print_result "Patients Data Format" "FAIL" "Response is not JSON array"
fi

echo ""
echo "Step 4: Examination Endpoints"
echo "-----------------------------"

# Test 5: GET examinations endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/examinations" 2>&1)
if [[ "$RESPONSE" =~ ^(200|401)$ ]]; then
    print_result "GET /api/examinations" "PASS"
else
    print_result "GET /api/examinations" "FAIL" "Expected 200 or 401, got $RESPONSE"
fi

# Test 6: GET examinations with patientId filter
if [ "$PATIENT_COUNT" -gt 0 ] && [ "$RESPONSE" = "200" ]; then
    EXAMS_DATA=$(curl -s "$API_URL/examinations" 2>&1)
    if echo "$EXAMS_DATA" | grep -q "^\["; then
        print_result "Examinations Data Format (JSON Array)" "PASS"
        EXAM_COUNT=$(echo "$EXAMS_DATA" | grep -o '"id"' | wc -l)
        echo -e "  ${YELLOW}Info: Found $EXAM_COUNT examinations${NC}"
    else
        print_result "Examinations Data Format" "FAIL" "Response is not JSON array"
    fi
fi

echo ""
echo "Step 5: Examination Data Structure Validation"
echo "----------------------------------------------"

# Test 7: Check if examination has required fields
if [ -n "$EXAMS_DATA" ] && echo "$EXAMS_DATA" | grep -q '"patientId"'; then
    print_result "Examination has patientId field" "PASS"
else
    print_result "Examination has patientId field" "FAIL" "patientId field not found"
fi

if [ -n "$EXAMS_DATA" ] && echo "$EXAMS_DATA" | grep -q '"examinationDate"'; then
    print_result "Examination has examinationDate field" "PASS"
else
    print_result "Examination has examinationDate field" "FAIL" "examinationDate field not found"
fi

if [ -n "$EXAMS_DATA" ] && echo "$EXAMS_DATA" | grep -q '"status"'; then
    print_result "Examination has status field" "PASS"
else
    print_result "Examination has status field" "FAIL" "status field not found"
fi

echo ""
echo "Step 6: Examination Tab Data Validation"
echo "---------------------------------------"

# Test 8: Check for tab data fields (JSONB)
if [ -n "$EXAMS_DATA" ] && echo "$EXAMS_DATA" | grep -q '"generalHistory"'; then
    print_result "Has generalHistory field" "PASS"
else
    print_result "Has generalHistory field" "FAIL" "generalHistory not found"
fi

if [ -n "$EXAMS_DATA" ] && echo "$EXAMS_DATA" | grep -q '"newRx"'; then
    print_result "Has newRx field" "PASS"
else
    print_result "Has newRx field" "FAIL" "newRx not found"
fi

if [ -n "$EXAMS_DATA" ] && echo "$EXAMS_DATA" | grep -q '"tonometry"'; then
    print_result "Has tonometry field" "PASS"
else
    print_result "Has tonometry field" "FAIL" "tonometry not found"
fi

if [ -n "$EXAMS_DATA" ] && echo "$EXAMS_DATA" | grep -q '"summary"'; then
    print_result "Has summary field" "PASS"
else
    print_result "Has summary field" "FAIL" "summary not found"
fi

echo ""
echo "Step 7: Database Connection"
echo "---------------------------"

# Test 9: Check if database is accessible
DB_CHECK=$(psql "postgresql://postgres:postgres@localhost:5432/ils_db" -t -c "SELECT COUNT(*) FROM eye_examinations;" 2>&1)
if [ $? -eq 0 ]; then
    print_result "Database Connection" "PASS"
    echo -e "  ${YELLOW}Info: Database has $(echo $DB_CHECK | xargs) examination records${NC}"
else
    print_result "Database Connection" "FAIL" "Could not connect to database"
fi

# Test 10: Check eye_examinations table structure
DB_COLUMNS=$(psql "postgresql://postgres:postgres@localhost:5432/ils_db" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'eye_examinations';" 2>&1)
if [ $? -eq 0 ]; then
    print_result "Eye Examinations Table Exists" "PASS"
    
    # Check for JSONB columns
    if echo "$DB_COLUMNS" | grep -q "general_history"; then
        print_result "Table has general_history column" "PASS"
    else
        print_result "Table has general_history column" "FAIL"
    fi
    
    if echo "$DB_COLUMNS" | grep -q "new_rx"; then
        print_result "Table has new_rx column" "PASS"
    else
        print_result "Table has new_rx column" "FAIL"
    fi
    
    if echo "$DB_COLUMNS" | grep -q "tonometry"; then
        print_result "Table has tonometry column" "PASS"
    else
        print_result "Table has tonometry column" "FAIL"
    fi
else
    print_result "Eye Examinations Table Exists" "FAIL" "Could not query table structure"
fi

echo ""
echo "Step 8: Frontend Accessibility"
echo "------------------------------"

# Test 11: Check if frontend page is accessible
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ecp/examination/new" 2>&1)
if check_status "200" "$FRONTEND_RESPONSE"; then
    print_result "Frontend Page Accessible (/ecp/examination/new)" "PASS"
else
    print_result "Frontend Page Accessible" "FAIL" "Expected 200, got $FRONTEND_RESPONSE"
fi

# Test 12: Check if frontend assets load
ASSETS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/assets/index.js" 2>&1)
if check_status "200" "$ASSETS_RESPONSE"; then
    print_result "Frontend Assets Load" "PASS"
else
    echo -e "  ${YELLOW}Warning: Frontend assets may not be built. Run 'npm run build' if needed.${NC}"
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Total Tests: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Open browser to: http://localhost:5000/ecp/examination/new"
    echo "2. Follow the END_TO_END_TESTING_GUIDE.md for manual testing"
    echo "3. Test all 8 tabs, save/load, print, and finalization"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some tests failed. Please check the errors above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "- Ensure the development server is running: npm run dev"
    echo "- Ensure the database is running and accessible"
    echo "- Check if you're logged in with appropriate permissions"
    exit 1
fi
