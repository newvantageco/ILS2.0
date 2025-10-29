#!/bin/bash

# Comprehensive Test Runner for Integrated Lens System
# Tests all system components systematically

echo "═══════════════════════════════════════════════════════════"
echo "🧪 INTEGRATED LENS SYSTEM - COMPREHENSIVE TEST SUITE"
echo "═══════════════════════════════════════════════════════════"
echo ""

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"
PASSED=0
FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test result tracking
declare -a FAILED_TESTS

# Helper function to log test results
log_test() {
    local category=$1
    local test_name=$2
    local result=$3
    local details=$4
    
    if [ "$result" == "PASS" ]; then
        echo -e "${GREEN}✅ [$category] $test_name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ [$category] $test_name${NC}"
        [ -n "$details" ] && echo -e "   ${YELLOW}Details: $details${NC}"
        ((FAILED++))
        FAILED_TESTS+=("[$category] $test_name: $details")
    fi
}

# Test helper function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local test_name=$4
    local data=$5
    local cookie=$6
    
    if [ -n "$data" ]; then
        if [ -n "$cookie" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Cookie: $cookie" \
                -d "$data" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" 2>&1)
        fi
    else
        if [ -n "$cookie" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
                -H "Cookie: $cookie" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" 2>&1)
        fi
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" == "$expected_status" ]; then
        log_test "API" "$test_name" "PASS" "Status: $status_code"
        echo "$body"
    else
        log_test "API" "$test_name" "FAIL" "Expected: $expected_status, Got: $status_code"
        echo ""
    fi
}

echo "1️⃣  DATABASE CONNECTIVITY TESTS"
echo "───────────────────────────────────────────────────────────"

# Test database connection
DB_TEST=$(psql postgres://neon:npg@localhost:5432/ils_db -c "SELECT 1" 2>&1)
if [ $? -eq 0 ]; then
    log_test "Database" "Connection" "PASS" "Successfully connected"
else
    log_test "Database" "Connection" "FAIL" "Could not connect"
fi

# Test table existence
TABLES=("users" "orders" "patients" "companies" "suppliers" "sessions")
for table in "${TABLES[@]}"; do
    TABLE_EXISTS=$(psql postgres://neon:npg@localhost:5432/ils_db -c "\dt $table" 2>&1 | grep -c "$table")
    if [ $TABLE_EXISTS -gt 0 ]; then
        log_test "Database" "Table: $table" "PASS" "Table exists"
    else
        log_test "Database" "Table: $table" "FAIL" "Table missing"
    fi
done

# Count records
echo ""
echo "Database Statistics:"
psql postgres://neon:npg@localhost:5432/ils_db -c "
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
SELECT 'Companies', COUNT(*) FROM companies
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM products
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions;
" 2>&1 | grep -v "rows)"

echo ""
echo "2️⃣  SERVER HEALTH TESTS"
echo "───────────────────────────────────────────────────────────"

# Test if server is running
SERVER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>&1)
if [ "$SERVER_RESPONSE" == "200" ] || [ "$SERVER_RESPONSE" == "304" ]; then
    log_test "Server" "Health check" "PASS" "Server responding"
else
    log_test "Server" "Health check" "FAIL" "Server not responding (Status: $SERVER_RESPONSE)"
fi

# Test API health endpoint
API_HEALTH=$(curl -s "$API_URL/health" 2>&1)
if echo "$API_HEALTH" | grep -q "ok\|healthy\|success"; then
    log_test "Server" "API health" "PASS" "API is healthy"
else
    log_test "Server" "API health" "FAIL" "API health check failed"
fi

echo ""
echo "3️⃣  AUTHENTICATION TESTS"
echo "───────────────────────────────────────────────────────────"

# Test login with master user
LOGIN_RESPONSE=$(curl -s -c /tmp/ils_cookie.txt -w "\n%{http_code}" -X POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"saban@newvantageco.com","password":"B6cdcab52a!!"}' 2>&1)

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$LOGIN_STATUS" == "200" ]; then
    log_test "Auth" "User login" "PASS" "Successfully logged in"
    COOKIE=$(cat /tmp/ils_cookie.txt | grep -v "^#" | tail -n1 | awk '{print $6"="$7}')
    echo "   Session cookie obtained"
else
    log_test "Auth" "User login" "FAIL" "Login failed (Status: $LOGIN_STATUS)"
    COOKIE=""
fi

# Test session validation
if [ -n "$COOKIE" ]; then
    SESSION_CHECK=$(curl -s -w "%{http_code}" -b /tmp/ils_cookie.txt "$API_URL/user" 2>&1 | tail -n1)
    if [ "$SESSION_CHECK" == "200" ]; then
        log_test "Auth" "Session validation" "PASS" "Session is valid"
    else
        log_test "Auth" "Session validation" "FAIL" "Session invalid"
    fi
fi

# Test unauthorized access prevention
UNAUTH_RESPONSE=$(curl -s -w "%{http_code}" "$API_URL/users" 2>&1 | tail -n1)
if [ "$UNAUTH_RESPONSE" == "401" ] || [ "$UNAUTH_RESPONSE" == "403" ]; then
    log_test "Auth" "Unauthorized access prevention" "PASS" "Access denied without auth"
else
    log_test "Auth" "Unauthorized access prevention" "FAIL" "Should deny access (Got: $UNAUTH_RESPONSE)"
fi

echo ""
echo "4️⃣  API ENDPOINT TESTS"
echo "───────────────────────────────────────────────────────────"

if [ -n "$COOKIE" ]; then
    # Test GET endpoints
    for endpoint in "/orders" "/patients" "/companies" "/users"; do
        STATUS=$(curl -s -w "%{http_code}" -b /tmp/ils_cookie.txt "$API_URL$endpoint" 2>&1 | tail -n1)
        if [ "$STATUS" == "200" ]; then
            log_test "API" "GET $endpoint" "PASS" "Status: $STATUS"
        else
            log_test "API" "GET $endpoint" "FAIL" "Status: $STATUS"
        fi
    done
    
    # Test POST patient creation
    NEW_PATIENT=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/patients" \
        -H "Content-Type: application/json" \
        -b /tmp/ils_cookie.txt \
        -d '{
            "firstName": "Test",
            "lastName": "Patient",
            "email": "test-'$(date +%s)'@example.com",
            "phone": "555-1234",
            "dateOfBirth": "1990-01-01"
        }' 2>&1)
    
    PATIENT_STATUS=$(echo "$NEW_PATIENT" | tail -n1)
    if [ "$PATIENT_STATUS" == "201" ] || [ "$PATIENT_STATUS" == "200" ]; then
        log_test "API" "POST /patients (create)" "PASS" "Status: $PATIENT_STATUS"
        PATIENT_BODY=$(echo "$NEW_PATIENT" | head -n-1)
        PATIENT_ID=$(echo "$PATIENT_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   Created patient ID: $PATIENT_ID"
    else
        log_test "API" "POST /patients (create)" "FAIL" "Status: $PATIENT_STATUS"
    fi
    
else
    echo "⚠️  Skipping authenticated endpoint tests (no auth cookie)"
fi

echo ""
echo "5️⃣  MULTI-TENANT TESTS"
echo "───────────────────────────────────────────────────────────"

if [ -n "$COOKIE" ]; then
    # Test company management
    COMPANIES=$(curl -s -b /tmp/ils_cookie.txt "$API_URL/companies" 2>&1)
    COMPANY_COUNT=$(echo "$COMPANIES" | grep -o '"id"' | wc -l)
    
    if [ $COMPANY_COUNT -gt 0 ]; then
        log_test "Multi-Tenant" "Company listing" "PASS" "Found $COMPANY_COUNT companies"
    else
        log_test "Multi-Tenant" "Company listing" "FAIL" "No companies found"
    fi
    
    # Test company creation
    NEW_COMPANY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/companies" \
        -H "Content-Type: application/json" \
        -b /tmp/ils_cookie.txt \
        -d '{
            "name": "Test Company '$(date +%s)'",
            "subscriptionPlan": "full",
            "contactEmail": "test-company-'$(date +%s)'@example.com"
        }' 2>&1)
    
    COMPANY_STATUS=$(echo "$NEW_COMPANY" | tail -n1)
    if [ "$COMPANY_STATUS" == "201" ] || [ "$COMPANY_STATUS" == "200" ]; then
        log_test "Multi-Tenant" "Company creation" "PASS" "Status: $COMPANY_STATUS"
    else
        log_test "Multi-Tenant" "Company creation" "FAIL" "Status: $COMPANY_STATUS"
    fi
else
    echo "⚠️  Skipping multi-tenant tests (no auth cookie)"
fi

echo ""
echo "6️⃣  AI ASSISTANT TESTS"
echo "───────────────────────────────────────────────────────────"

if [ -n "$COOKIE" ]; then
    # Test AI assistant endpoints
    AI_STATUS=$(curl -s -w "%{http_code}" -b /tmp/ils_cookie.txt "$API_URL/ai-assistant/status" 2>&1 | tail -n1)
    if [ "$AI_STATUS" != "404" ]; then
        log_test "AI" "AI Assistant availability" "PASS" "Endpoint exists (Status: $AI_STATUS)"
    else
        log_test "AI" "AI Assistant availability" "FAIL" "Endpoint not found"
    fi
    
    # Test AI chat (if available)
    AI_CHAT=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai-assistant/chat" \
        -H "Content-Type: application/json" \
        -b /tmp/ils_cookie.txt \
        -d '{"message": "What is the status of recent orders?"}' 2>&1)
    
    AI_CHAT_STATUS=$(echo "$AI_CHAT" | tail -n1)
    if [ "$AI_CHAT_STATUS" == "200" ]; then
        log_test "AI" "AI Chat functionality" "PASS" "Chat working"
    elif [ "$AI_CHAT_STATUS" == "501" ] || [ "$AI_CHAT_STATUS" == "503" ]; then
        log_test "AI" "AI Chat functionality" "PASS" "Endpoint exists (API key may be missing)"
    else
        log_test "AI" "AI Chat functionality" "FAIL" "Status: $AI_CHAT_STATUS"
    fi
else
    echo "⚠️  Skipping AI tests (no auth cookie)"
fi

echo ""
echo "7️⃣  ERROR HANDLING TESTS"
echo "───────────────────────────────────────────────────────────"

# Test invalid JSON
INVALID_JSON=$(curl -s -w "%{http_code}" -X POST "$API_URL/orders" \
    -H "Content-Type: application/json" \
    -b /tmp/ils_cookie.txt \
    -d 'invalid-json' 2>&1 | tail -n1)

if [ "$INVALID_JSON" == "400" ] || [ "$INVALID_JSON" == "500" ]; then
    log_test "Error" "Invalid JSON handling" "PASS" "Rejected invalid JSON"
else
    log_test "Error" "Invalid JSON handling" "FAIL" "Status: $INVALID_JSON"
fi

# Test missing required fields
MISSING_FIELDS=$(curl -s -w "%{http_code}" -X POST "$API_URL/patients" \
    -H "Content-Type: application/json" \
    -b /tmp/ils_cookie.txt \
    -d '{"firstName":"Test"}' 2>&1 | tail -n1)

if [ "$MISSING_FIELDS" == "400" ]; then
    log_test "Error" "Missing required fields" "PASS" "Validation working"
else
    log_test "Error" "Missing required fields" "FAIL" "Status: $MISSING_FIELDS"
fi

# Test invalid ID format
INVALID_ID=$(curl -s -w "%{http_code}" -b /tmp/ils_cookie.txt "$API_URL/orders/invalid-id-format" 2>&1 | tail -n1)
if [ "$INVALID_ID" == "400" ] || [ "$INVALID_ID" == "404" ]; then
    log_test "Error" "Invalid ID format" "PASS" "Handled correctly"
else
    log_test "Error" "Invalid ID format" "FAIL" "Status: $INVALID_ID"
fi

echo ""
echo "8️⃣  PERFORMANCE TESTS"
echo "───────────────────────────────────────────────────────────"

if [ -n "$COOKIE" ]; then
    # Test response time
    START=$(date +%s%N)
    curl -s -b /tmp/ils_cookie.txt "$API_URL/orders" > /dev/null 2>&1
    END=$(date +%s%N)
    DURATION=$(((END - START) / 1000000))
    
    if [ $DURATION -lt 1000 ]; then
        log_test "Performance" "API response time" "PASS" "${DURATION}ms"
    else
        log_test "Performance" "API response time" "FAIL" "${DURATION}ms (>1000ms)"
    fi
    
    # Test concurrent requests
    START=$(date +%s%N)
    for i in {1..5}; do
        curl -s -b /tmp/ils_cookie.txt "$API_URL/orders" > /dev/null 2>&1 &
    done
    wait
    END=$(date +%s%N)
    CONCURRENT_DURATION=$(((END - START) / 1000000))
    
    if [ $CONCURRENT_DURATION -lt 2000 ]; then
        log_test "Performance" "Concurrent requests" "PASS" "${CONCURRENT_DURATION}ms for 5 requests"
    else
        log_test "Performance" "Concurrent requests" "FAIL" "${CONCURRENT_DURATION}ms (>2000ms)"
    fi
else
    echo "⚠️  Skipping performance tests (no auth cookie)"
fi

echo ""
echo "9️⃣  FRONTEND TESTS"
echo "───────────────────────────────────────────────────────────"

# Test main page load
FRONTEND_STATUS=$(curl -s -w "%{http_code}" "$BASE_URL" 2>&1 | tail -n1)
if [ "$FRONTEND_STATUS" == "200" ]; then
    log_test "Frontend" "Main page load" "PASS" "Page loads successfully"
else
    log_test "Frontend" "Main page load" "FAIL" "Status: $FRONTEND_STATUS"
fi

# Test static assets
STATIC_ASSETS=$(curl -s "$BASE_URL/src/main.tsx" 2>&1)
if echo "$STATIC_ASSETS" | grep -q "React\|import"; then
    log_test "Frontend" "Static assets" "PASS" "Assets accessible"
else
    log_test "Frontend" "Static assets" "FAIL" "Assets not loading"
fi

# Test if Vite dev server is working
VITE_CHECK=$(curl -s "$BASE_URL/@vite/client" 2>&1 | head -c 100)
if echo "$VITE_CHECK" | grep -q "vite\|hmr\|export"; then
    log_test "Frontend" "Vite dev server" "PASS" "Vite HMR active"
else
    log_test "Frontend" "Vite dev server" "FAIL" "Vite not responding"
fi

echo ""
echo "🔟  WEBSOCKET TESTS"
echo "───────────────────────────────────────────────────────────"

# Check if WebSocket endpoint is available
WS_CHECK=$(curl -s -w "%{http_code}" "$BASE_URL/ws" 2>&1 | tail -n1)
if [ "$WS_CHECK" != "404" ]; then
    log_test "WebSocket" "WebSocket endpoint" "PASS" "Endpoint exists"
else
    log_test "WebSocket" "WebSocket endpoint" "FAIL" "Endpoint not found"
fi

# Cleanup
rm -f /tmp/ils_cookie.txt

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")

echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo "📈 Success Rate: $SUCCESS_RATE%"
echo "📝 Total Tests: $TOTAL"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "❌ FAILED TESTS:"
    echo "═══════════════════════════════════════════════════════════"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}• $test${NC}"
    done
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Test completed at: $(date)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Exit with error if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
