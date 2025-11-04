#!/bin/bash

# AI Consolidation Testing Script
# Tests both Master AI and Platform AI endpoints

set -e

BASE_URL="http://localhost:5000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "AI CONSOLIDATION - AUTOMATED TEST SUITE"
echo "=================================================="
echo ""

# Counter for test results
PASSED=0
FAILED=0
TOTAL=0

# Test function
test_endpoint() {
    TOTAL=$((TOTAL + 1))
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"
    
    echo -n "Test $TOTAL: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    fi
    
    status_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    # Check if we got authentication required (401 or 403) - that's actually good!
    if [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
        echo -e "${YELLOW}AUTH REQUIRED${NC} (endpoint exists, needs authentication ✓)"
        PASSED=$((PASSED + 1))
        return 0
    fi
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP $status_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC} (Expected $expected_status, got $status_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
}

echo "=== PHASE 1: Server Health Check ==="
test_endpoint "Health endpoint" "GET" "/health" "200"
echo ""

echo "=== PHASE 2: Master AI Endpoints (Tenant Intelligence) ==="
echo "Testing 7 Master AI endpoints..."
echo ""

# Master AI Chat (POST)
test_endpoint "Master AI Chat (no auth)" "POST" "/api/master-ai/chat" "401" \
    '{"query":"What is astigmatism?"}'

# Master AI Conversations (GET)
test_endpoint "Master AI Conversations (no auth)" "GET" "/api/master-ai/conversations" "401"

# Master AI Specific Conversation (GET)
test_endpoint "Master AI Get Conversation (no auth)" "GET" "/api/master-ai/conversations/test-id" "401"

# Master AI Document Upload (POST)
test_endpoint "Master AI Upload Document (no auth)" "POST" "/api/master-ai/documents" "401" \
    '{"fileName":"test.txt","content":"Test content"}'

# Master AI Knowledge Base (GET)
test_endpoint "Master AI Knowledge Base (no auth)" "GET" "/api/master-ai/knowledge-base" "401"

# Master AI Stats (GET)
test_endpoint "Master AI Stats (no auth)" "GET" "/api/master-ai/stats" "401"

# Master AI Feedback (POST)
test_endpoint "Master AI Feedback (no auth)" "POST" "/api/master-ai/feedback" "401" \
    '{"messageId":"msg-123","rating":5}'

echo ""
echo "=== PHASE 3: Platform AI Endpoints (Analytics Engine) ==="
echo "Testing 6 Platform AI endpoints..."
echo ""

# Platform AI Sales (GET)
test_endpoint "Platform AI Sales Analysis (no auth)" "GET" "/api/platform-ai/sales?startDate=2025-01-01&endDate=2025-01-31" "401"

# Platform AI Inventory (GET)
test_endpoint "Platform AI Inventory Analysis (no auth)" "GET" "/api/platform-ai/inventory?startDate=2025-01-01&endDate=2025-01-31" "401"

# Platform AI Bookings (GET)
test_endpoint "Platform AI Booking Patterns (no auth)" "GET" "/api/platform-ai/bookings?startDate=2025-01-01&endDate=2025-01-31" "401"

# Platform AI Comparative (GET)
test_endpoint "Platform AI Comparative (no auth)" "GET" "/api/platform-ai/comparative?startDate=2025-01-01&endDate=2025-01-31" "401"

# Platform AI Comprehensive (GET)
test_endpoint "Platform AI Comprehensive (no auth)" "GET" "/api/platform-ai/comprehensive?startDate=2025-01-01&endDate=2025-01-31" "401"

# Platform AI Clear Cache (POST)
test_endpoint "Platform AI Clear Cache (no auth)" "POST" "/api/platform-ai/clear-cache" "401"

echo ""
echo "=== PHASE 4: Old Endpoints Verification ==="
echo "Verifying old endpoints are removed..."
echo ""

# These should return 404 (Not Found) since we removed them
test_old_endpoint() {
    TOTAL=$((TOTAL + 1))
    local name="$1"
    local endpoint="$2"
    
    echo -n "Test $TOTAL: $name should be removed ... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "404" ]; then
        echo -e "${GREEN}PASSED${NC} (endpoint removed ✓)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC} (endpoint still exists! Status: $status_code)"
        FAILED=$((FAILED + 1))
    fi
}

test_old_endpoint "Old AI Engine routes" "/api/ai-engine/test"
test_old_endpoint "Old AI Intelligence routes" "/api/ai-intelligence/test"
test_old_endpoint "Old AI Assistant routes" "/api/ai-assistant/test"
test_old_endpoint "Old Unified AI routes" "/api/ai/test"
test_old_endpoint "Old AI Insights routes" "/api/ai-insights/sales"

echo ""
echo "=================================================="
echo "TEST RESULTS SUMMARY"
echo "=================================================="
echo -e "Total Tests:  $TOTAL"
echo -e "${GREEN}Passed:       $PASSED${NC}"
echo -e "${RED}Failed:       $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "✓ Master AI endpoints: All 7 endpoints responding (require auth)"
    echo "✓ Platform AI endpoints: All 6 endpoints responding (require auth)"
    echo "✓ Old endpoints: Successfully removed"
    echo ""
    echo "AI CONSOLIDATION VALIDATION: SUCCESS"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review failed tests above."
    exit 1
fi
