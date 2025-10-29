#!/bin/bash

# ═══════════════════════════════════════════════════════════
# INTEGRATED LENS SYSTEM - FINAL COMPREHENSIVE TEST SUITE
# Tests all system components with correct API endpoints
# ═══════════════════════════════════════════════════════════

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"
PASSED=0
FAILED=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

# Test tracking
declare -a FAILED_TESTS
declare -a WARNINGS_LIST

log_test() {
    local category=$1
    local test_name=$2
    local result=$3
    local details=$4
    
    if [ "$result" == "PASS" ]; then
        echo -e "${GREEN}✅ [$category] $test_name${NC}"
        [ -n "$details" ] && echo -e "   ${BLUE}$details${NC}"
        ((PASSED++))
    elif [ "$result" == "WARN" ]; then
        echo -e "${YELLOW}⚠️  [$category] $test_name${NC}"
        [ -n "$details" ] && echo -e "   ${YELLOW}$details${NC}"
        ((WARNINGS++))
        WARNINGS_LIST+=("[$category] $test_name: $details")
    else
        echo -e "${RED}❌ [$category] $test_name${NC}"
        [ -n "$details" ] && echo -e "   ${YELLOW}$details${NC}"
        ((FAILED++))
        FAILED_TESTS+=("[$category] $test_name: $details")
    fi
}

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🧪 INTEGRATED LENS SYSTEM - COMPREHENSIVE TEST SUITE"
echo "   Final System-Wide Testing"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📅 Started: $(date)"
echo "🌐 Target: $BASE_URL"
echo ""

# ═══════════════════════════════════════════════════════════
# 1. DATABASE TESTS
# ═══════════════════════════════════════════════════════════

echo "1️⃣  DATABASE & SCHEMA TESTS"
echo "───────────────────────────────────────────────────────────"

# Test database connection
if psql postgres://neon:npg@localhost:5432/ils_db -c "SELECT 1" > /dev/null 2>&1; then
    log_test "Database" "Connection" "PASS" "Connected successfully"
else
    log_test "Database" "Connection" "FAIL" "Could not connect"
fi

# Test critical tables exist
for table in users orders patients companies sessions ai_conversations equipment notifications; do
    if psql postgres://neon:npg@localhost:5432/ils_db -c "\dt $table" 2>/dev/null | grep -q "$table"; then
        log_test "Database" "Table exists: $table" "PASS"
    else
        log_test "Database" "Table exists: $table" "FAIL"
    fi
done

# Get database statistics
echo ""
echo "📊 Database Statistics:"
psql postgres://neon:npg@localhost:5432/ils_db -t -A -F"," -c "
SELECT 
    'Users,' || COUNT(*) FROM users
UNION ALL SELECT 'Orders,' || COUNT(*) FROM orders
UNION ALL SELECT 'Patients,' || COUNT(*) FROM patients
UNION ALL SELECT 'Companies,' || COUNT(*) FROM companies
UNION ALL SELECT 'Equipment,' || COUNT(*) FROM equipment
UNION ALL SELECT 'Notifications,' || COUNT(*) FROM notifications
UNION ALL SELECT 'AI Conversations,' || COUNT(*) FROM ai_conversations;
" 2>/dev/null | column -t -s,

# ═══════════════════════════════════════════════════════════
# 2. SERVER HEALTH TESTS
# ═══════════════════════════════════════════════════════════

echo ""
echo "2️⃣  SERVER HEALTH & CONNECTIVITY"
echo "───────────────────────────────────────────────────────────"

# Test server is responding
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>&1)
if [ "$SERVER_STATUS" == "200" ]; then
    log_test "Server" "Main server health" "PASS" "Status: $SERVER_STATUS"
else
    log_test "Server" "Main server health" "FAIL" "Status: $SERVER_STATUS"
fi

# Test health endpoint
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health" 2>&1)
if echo "$HEALTH_RESPONSE" | jq -e '.status == "ok"' > /dev/null 2>&1; then
    log_test "Server" "Health endpoint" "PASS" "API healthy"
else
    log_test "Server" "Health endpoint" "FAIL" "Health check failed"
fi

# ═══════════════════════════════════════════════════════════
# 3. AUTHENTICATION & AUTHORIZATION
# ═══════════════════════════════════════════════════════════

echo ""
echo "3️⃣  AUTHENTICATION & AUTHORIZATION"
echo "───────────────────────────────────────────────────────────"

# Test login
LOGIN_RESPONSE=$(curl -s -c /tmp/ils_test_cookies.txt -X POST "$API_URL/auth/login-email" \
    -H "Content-Type: application/json" \
    -d '{"email":"saban@newvantageco.com","password":"B6cdcab52a!!"}' 2>&1)

if echo "$LOGIN_RESPONSE" | jq -e '.user.email' > /dev/null 2>&1; then
    USER_EMAIL=$(echo "$LOGIN_RESPONSE" | jq -r '.user.email')
    USER_ROLE=$(echo "$LOGIN_RESPONSE" | jq -r '.user.role')
    log_test "Auth" "User login" "PASS" "Logged in as $USER_EMAIL ($USER_ROLE)"
    HAS_AUTH=true
else
    log_test "Auth" "User login" "FAIL" "Login failed"
    HAS_AUTH=false
fi

# Test session validation
if [ "$HAS_AUTH" == "true" ]; then
    USER_CHECK=$(curl -s -b /tmp/ils_test_cookies.txt "$API_URL/user" 2>&1)
    if echo "$USER_CHECK" | jq -e '.email' > /dev/null 2>&1; then
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
    log_test "Auth" "Unauthorized access prevention" "WARN" "May need review (Status: $UNAUTH_RESPONSE)"
fi

# ═══════════════════════════════════════════════════════════
# 4. API ENDPOINTS - READ OPERATIONS
# ═══════════════════════════════════════════════════════════

echo ""
echo "4️⃣  API ENDPOINTS - READ OPERATIONS"
echo "───────────────────────────────────────────────────────────"

if [ "$HAS_AUTH" == "true" ]; then
    # Test GET endpoints
    for endpoint in "orders" "patients" "companies" "users" "equipment" "notifications" "technical-documents"; do
        RESPONSE=$(curl -s -w "\n%{http_code}" -b /tmp/ils_test_cookies.txt "$API_URL/$endpoint" 2>&1)
        STATUS=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)
        
        if [ "$STATUS" == "200" ]; then
            COUNT=$(echo "$BODY" | jq -r '. | length' 2>/dev/null || echo "N/A")
            log_test "API-GET" "$endpoint" "PASS" "Status: 200, Records: $COUNT"
        else
            log_test "API-GET" "$endpoint" "FAIL" "Status: $STATUS"
        fi
    done
else
    log_test "API-GET" "All endpoints" "FAIL" "No authentication"
fi

# ═══════════════════════════════════════════════════════════
# 5. API ENDPOINTS - WRITE OPERATIONS
# ═══════════════════════════════════════════════════════════

echo ""
echo "5️⃣  API ENDPOINTS - WRITE OPERATIONS"
echo "───────────────────────────────────────────────────────────"

if [ "$HAS_AUTH" == "true" ]; then
    # Test POST - Create patient
    NEW_PATIENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/patients" \
        -H "Content-Type: application/json" \
        -b /tmp/ils_test_cookies.txt \
        -d "{
            \"firstName\": \"Test\",
            \"lastName\": \"Patient\",
            \"email\": \"test-$(date +%s)@example.com\",
            \"phone\": \"555-$(date +%s | tail -c 5)\",
            \"dateOfBirth\": \"1990-01-01\"
        }" 2>&1)
    
    PATIENT_STATUS=$(echo "$NEW_PATIENT_RESPONSE" | tail -n1)
    PATIENT_BODY=$(echo "$NEW_PATIENT_RESPONSE" | head -n-1)
    
    if [ "$PATIENT_STATUS" == "201" ] || [ "$PATIENT_STATUS" == "200" ]; then
        PATIENT_ID=$(echo "$PATIENT_BODY" | jq -r '.id // .patient.id' 2>/dev/null)
        log_test "API-POST" "Create patient" "PASS" "Created ID: $PATIENT_ID"
        
        # Test PUT - Update patient
        if [ -n "$PATIENT_ID" ] && [ "$PATIENT_ID" != "null" ]; then
            UPDATE_RESPONSE=$(curl -s -w "%{http_code}" -X PUT "$API_URL/patients/$PATIENT_ID" \
                -H "Content-Type: application/json" \
                -b /tmp/ils_test_cookies.txt \
                -d '{"phone":"555-9999"}' 2>&1 | tail -n1)
            
            if [ "$UPDATE_RESPONSE" == "200" ]; then
                log_test "API-PUT" "Update patient" "PASS" "Updated successfully"
            else
                log_test "API-PUT" "Update patient" "FAIL" "Status: $UPDATE_RESPONSE"
            fi
            
            # Test GET single record
            GET_ONE_RESPONSE=$(curl -s -w "%{http_code}" -b /tmp/ils_test_cookies.txt "$API_URL/patients/$PATIENT_ID" 2>&1 | tail -n1)
            if [ "$GET_ONE_RESPONSE" == "200" ]; then
                log_test "API-GET" "Get single patient" "PASS" "Retrieved successfully"
            else
                log_test "API-GET" "Get single patient" "FAIL" "Status: $GET_ONE_RESPONSE"
            fi
        fi
    else
        log_test "API-POST" "Create patient" "FAIL" "Status: $PATIENT_STATUS"
    fi
    
    # Test order creation
    FIRST_PATIENT=$(curl -s -b /tmp/ils_test_cookies.txt "$API_URL/patients" 2>&1 | jq -r '.[0].id' 2>/dev/null)
    if [ -n "$FIRST_PATIENT" ] && [ "$FIRST_PATIENT" != "null" ]; then
        NEW_ORDER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/orders" \
            -H "Content-Type: application/json" \
            -b /tmp/ils_test_cookies.txt \
            -d "{
                \"patientId\": \"$FIRST_PATIENT\",
                \"orderType\": \"prescription\",
                \"status\": \"pending\",
                \"prescriptionData\": {
                    \"rightEye\": {\"sphere\": -2.5, \"cylinder\": -0.5, \"axis\": 180, \"add\": 1.5},
                    \"leftEye\": {\"sphere\": -2.0, \"cylinder\": -0.5, \"axis\": 170, \"add\": 1.5}
                }
            }" 2>&1)
        
        ORDER_STATUS=$(echo "$NEW_ORDER_RESPONSE" | tail -n1)
        if [ "$ORDER_STATUS" == "201" ] || [ "$ORDER_STATUS" == "200" ]; then
            log_test "API-POST" "Create order" "PASS" "Order created"
        else
            log_test "API-POST" "Create order" "FAIL" "Status: $ORDER_STATUS"
        fi
    fi
else
    log_test "API-WRITE" "All write operations" "FAIL" "No authentication"
fi

# ═══════════════════════════════════════════════════════════
# 6. MULTI-TENANT FUNCTIONALITY
# ═══════════════════════════════════════════════════════════

echo ""
echo "6️⃣  MULTI-TENANT FUNCTIONALITY"
echo "───────────────────────────────────────────────────────────"

if [ "$HAS_AUTH" == "true" ]; then
    # Test company management
    COMPANIES=$(curl -s -b /tmp/ils_test_cookies.txt "$API_URL/companies" 2>&1)
    COMPANY_COUNT=$(echo "$COMPANIES" | jq -r 'length' 2>/dev/null || echo "0")
    
    if [ "$COMPANY_COUNT" -gt 0 ]; then
        log_test "Multi-Tenant" "Company listing" "PASS" "Found $COMPANY_COUNT companies"
    else
        log_test "Multi-Tenant" "Company listing" "WARN" "No companies found"
    fi
    
    # Test company creation
    NEW_COMPANY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/companies" \
        -H "Content-Type: application/json" \
        -b /tmp/ils_test_cookies.txt \
        -d "{
            \"name\": \"Test Company $(date +%s)\",
            \"subscriptionPlan\": \"full\",
            \"contactEmail\": \"test-company-$(date +%s)@example.com\"
        }" 2>&1)
    
    COMPANY_STATUS=$(echo "$NEW_COMPANY" | tail -n1)
    if [ "$COMPANY_STATUS" == "201" ] || [ "$COMPANY_STATUS" == "200" ]; then
        log_test "Multi-Tenant" "Company creation" "PASS" "Company created"
    else
        log_test "Multi-Tenant" "Company creation" "FAIL" "Status: $COMPANY_STATUS"
    fi
fi

# ═══════════════════════════════════════════════════════════
# 7. AI ASSISTANT FEATURES
# ═══════════════════════════════════════════════════════════

echo ""
echo "7️⃣  AI ASSISTANT FEATURES"
echo "───────────────────────────────────────────────────────────"

if [ "$HAS_AUTH" == "true" ]; then
    # Test AI status endpoint
    AI_STATUS=$(curl -s -w "%{http_code}" -b /tmp/ils_test_cookies.txt "$API_URL/ai-assistant/status" 2>&1 | tail -n1)
    if [ "$AI_STATUS" == "200" ]; then
        log_test "AI" "AI Assistant status" "PASS" "AI system available"
    elif [ "$AI_STATUS" == "404" ]; then
        log_test "AI" "AI Assistant status" "WARN" "AI endpoints not available"
    else
        log_test "AI" "AI Assistant status" "FAIL" "Status: $AI_STATUS"
    fi
    
    # Test AI chat
    AI_CHAT=$(curl -s -w "%{http_code}" -X POST "$API_URL/ai-assistant/chat" \
        -H "Content-Type: application/json" \
        -b /tmp/ils_test_cookies.txt \
        -d '{"message":"What is the system status?"}' 2>&1 | tail -n1)
    
    if [ "$AI_CHAT" == "200" ]; then
        log_test "AI" "AI Chat" "PASS" "Chat operational"
    elif [ "$AI_CHAT" == "503" ] || [ "$AI_CHAT" == "501" ]; then
        log_test "AI" "AI Chat" "WARN" "AI service not configured (API key needed)"
    elif [ "$AI_CHAT" == "404" ]; then
        log_test "AI" "AI Chat" "WARN" "Endpoint not implemented"
    else
        log_test "AI" "AI Chat" "FAIL" "Status: $AI_CHAT"
    fi
fi

# ═══════════════════════════════════════════════════════════
# 8. ERROR HANDLING & VALIDATION
# ═══════════════════════════════════════════════════════════

echo ""
echo "8️⃣  ERROR HANDLING & VALIDATION"
echo "───────────────────────────────────────────────────────────"

if [ "$HAS_AUTH" == "true" ]; then
    # Test 404 handling
    NOT_FOUND=$(curl -s -w "%{http_code}" -b /tmp/ils_test_cookies.txt "$API_URL/nonexistent-endpoint" 2>&1 | tail -n1)
    if [ "$NOT_FOUND" == "404" ]; then
        log_test "Error" "404 handling" "PASS" "Proper 404 response"
    else
        log_test "Error" "404 handling" "FAIL" "Expected 404, got $NOT_FOUND"
    fi
    
    # Test invalid data validation
    INVALID_DATA=$(curl -s -w "%{http_code}" -X POST "$API_URL/patients" \
        -H "Content-Type: application/json" \
        -b /tmp/ils_test_cookies.txt \
        -d '{"firstName":""}' 2>&1 | tail -n1)
    
    if [ "$INVALID_DATA" == "400" ]; then
        log_test "Error" "Data validation" "PASS" "Invalid data rejected"
    else
        log_test "Error" "Data validation" "FAIL" "Expected 400, got $INVALID_DATA"
    fi
    
    # Test invalid ID format
    INVALID_ID=$(curl -s -w "%{http_code}" -b /tmp/ils_test_cookies.txt "$API_URL/orders/invalid-id-123" 2>&1 | tail -n1)
    if [ "$INVALID_ID" == "400" ] || [ "$INVALID_ID" == "404" ]; then
        log_test "Error" "Invalid ID handling" "PASS" "Invalid ID rejected"
    else
        log_test "Error" "Invalid ID handling" "FAIL" "Expected 400/404, got $INVALID_ID"
    fi
fi

# ═══════════════════════════════════════════════════════════
# 9. PERFORMANCE TESTS
# ═══════════════════════════════════════════════════════════

echo ""
echo "9️⃣  PERFORMANCE & LOAD HANDLING"
echo "───────────────────────────────────────────────────────────"

if [ "$HAS_AUTH" == "true" ]; then
    # Test response time
    START=$(date +%s%N)
    curl -s -b /tmp/ils_test_cookies.txt "$API_URL/orders" > /dev/null 2>&1
    END=$(date +%s%N)
    DURATION=$(((END - START) / 1000000))
    
    if [ $DURATION -lt 500 ]; then
        log_test "Performance" "API response time" "PASS" "${DURATION}ms"
    elif [ $DURATION -lt 1000 ]; then
        log_test "Performance" "API response time" "WARN" "${DURATION}ms (acceptable)"
    else
        log_test "Performance" "API response time" "FAIL" "${DURATION}ms (>1000ms)"
    fi
    
    # Test concurrent requests
    START=$(date +%s%N)
    for i in {1..5}; do
        curl -s -b /tmp/ils_test_cookies.txt "$API_URL/orders" > /dev/null 2>&1 &
    done
    wait
    END=$(date +%s%N)
    CONCURRENT_DURATION=$(((END - START) / 1000000))
    
    if [ $CONCURRENT_DURATION -lt 2000 ]; then
        log_test "Performance" "Concurrent requests (5)" "PASS" "${CONCURRENT_DURATION}ms"
    else
        log_test "Performance" "Concurrent requests (5)" "WARN" "${CONCURRENT_DURATION}ms"
    fi
    
    # Test large dataset handling
    LARGE_DATA=$(curl -s -w "\n%{http_code}" -b /tmp/ils_test_cookies.txt "$API_URL/orders?limit=100" 2>&1)
    LARGE_STATUS=$(echo "$LARGE_DATA" | tail -n1)
    
    if [ "$LARGE_STATUS" == "200" ]; then
        log_test "Performance" "Large dataset (100 limit)" "PASS" "Handled successfully"
    else
        log_test "Performance" "Large dataset (100 limit)" "FAIL" "Status: $LARGE_STATUS"
    fi
fi

# ═══════════════════════════════════════════════════════════
# 10. FRONTEND TESTS
# ═══════════════════════════════════════════════════════════

echo ""
echo "🔟  FRONTEND & UI TESTS"
echo "───────────────────────────────────────────────────────────"

# Test main page
FRONTEND=$(curl -s -w "%{http_code}" "$BASE_URL" 2>&1 | tail -n1)
if [ "$FRONTEND" == "200" ]; then
    log_test "Frontend" "Main page load" "PASS" "Page loads successfully"
else
    log_test "Frontend" "Main page load" "FAIL" "Status: $FRONTEND"
fi

# Test Vite dev server
VITE_CLIENT=$(curl -s -w "%{http_code}" "$BASE_URL/@vite/client" 2>&1 | tail -n1)
if [ "$VITE_CLIENT" == "200" ]; then
    log_test "Frontend" "Vite dev server" "PASS" "Vite HMR active"
else
    log_test "Frontend" "Vite dev server" "WARN" "Vite may not be running"
fi

# Test static assets
MAIN_SCRIPT=$(curl -s "$BASE_URL/src/main.tsx" 2>&1 | head -c 100)
if echo "$MAIN_SCRIPT" | grep -q "import\|React"; then
    log_test "Frontend" "Static assets" "PASS" "Assets accessible"
else
    log_test "Frontend" "Static assets" "FAIL" "Assets not loading"
fi

# Cleanup
rm -f /tmp/ils_test_cookies.txt

# ═══════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 COMPREHENSIVE TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
else
    SUCCESS_RATE="0.0"
fi

echo -e "${GREEN}✅ Passed:   $PASSED${NC}"
echo -e "${RED}❌ Failed:   $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo "📝 Total:    $TOTAL"
echo "📈 Success:  $SUCCESS_RATE%"

# Show failed tests
if [ $FAILED -gt 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "❌ FAILED TESTS:"
    echo "═══════════════════════════════════════════════════════════"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}• $test${NC}"
    done
fi

# Show warnings
if [ $WARNINGS -gt 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "⚠️  WARNINGS:"
    echo "═══════════════════════════════════════════════════════════"
    for warning in "${WARNINGS_LIST[@]}"; do
        echo -e "${YELLOW}• $warning${NC}"
    done
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Test completed: $(date)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Exit code based on failures
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
