#!/bin/bash

################################################################################
# Production Smoke Tests
#
# Quick validation tests to run after deployment
# Tests critical user journeys without requiring authentication
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:5000}"
TIMEOUT=10

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test helper
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local description="$5"

    ((TESTS_RUN++))

    log_info "Testing: $description"

    local response_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        --max-time "$TIMEOUT" \
        "${BASE_URL}${endpoint}")

    if [ "$response_code" -eq "$expected_status" ]; then
        log_success "$name - Status: $response_code"
        return 0
    else
        log_error "$name - Expected: $expected_status, Got: $response_code"
        return 1
    fi
}

# Test with response body
test_endpoint_body() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_pattern="$4"
    local description="$5"

    ((TESTS_RUN++))

    log_info "Testing: $description"

    local response=$(curl -s -X "$method" --max-time "$TIMEOUT" "${BASE_URL}${endpoint}")

    if echo "$response" | grep -q "$expected_pattern"; then
        log_success "$name - Found expected pattern"
        return 0
    else
        log_error "$name - Pattern '$expected_pattern' not found in response"
        echo "Response: $response"
        return 1
    fi
}

# Test response time
test_response_time() {
    local name="$1"
    local endpoint="$2"
    local max_time_ms="$3"
    local description="$4"

    ((TESTS_RUN++))

    log_info "Testing: $description"

    local time_total=$(curl -s -o /dev/null -w "%{time_total}" \
        --max-time "$TIMEOUT" \
        "${BASE_URL}${endpoint}")

    # Convert to milliseconds
    local time_ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)

    if [ "$time_ms" -le "$max_time_ms" ]; then
        log_success "$name - Response time: ${time_ms}ms (max: ${max_time_ms}ms)"
        return 0
    else
        log_warning "$name - Response time: ${time_ms}ms exceeds max: ${max_time_ms}ms"
        return 1
    fi
}

################################################################################
# Test Suites
################################################################################

test_health_endpoints() {
    echo ""
    echo "================================"
    echo "🏥 Health Check Tests"
    echo "================================"

    test_endpoint \
        "Health Check" \
        "GET" \
        "/api/health" \
        200 \
        "Main health endpoint"

    test_endpoint_body \
        "Health Status" \
        "GET" \
        "/api/health" \
        "healthy" \
        "Health endpoint returns 'healthy' status"

    test_response_time \
        "Health Check Performance" \
        "/api/health" \
        1000 \
        "Health check responds quickly"
}

test_api_endpoints() {
    echo ""
    echo "================================"
    echo "🔌 API Endpoint Tests"
    echo "================================"

    # Test that protected endpoints require auth
    test_endpoint \
        "Protected Endpoint" \
        "GET" \
        "/api/patients" \
        401 \
        "Protected endpoint requires authentication"

    # Test login endpoint exists
    test_endpoint \
        "Login Endpoint" \
        "POST" \
        "/api/auth/login" \
        400 \
        "Login endpoint exists (400 = missing credentials)"

    # Test monitoring endpoints
    test_endpoint \
        "Monitoring Health" \
        "GET" \
        "/api/monitoring/health" \
        200 \
        "Monitoring health endpoint"
}

test_static_assets() {
    echo ""
    echo "================================"
    echo "📦 Static Assets Tests"
    echo "================================"

    # Test that index.html is served
    test_endpoint \
        "Root Path" \
        "GET" \
        "/" \
        200 \
        "Root path serves application"

    # Test favicon (if it exists)
    test_endpoint \
        "Favicon" \
        "GET" \
        "/favicon.ico" \
        200 \
        "Favicon is accessible"
}

test_error_handling() {
    echo ""
    echo "================================"
    echo "🚨 Error Handling Tests"
    echo "================================"

    # Test 404
    test_endpoint \
        "404 Handler" \
        "GET" \
        "/non-existent-endpoint-$(date +%s)" \
        404 \
        "Non-existent endpoint returns 404"

    # Test invalid method
    test_endpoint \
        "Method Not Allowed" \
        "DELETE" \
        "/api/health" \
        404 \
        "Invalid HTTP method handled"
}

test_security_headers() {
    echo ""
    echo "================================"
    echo "🔒 Security Headers Tests"
    echo "================================"

    ((TESTS_RUN++))
    log_info "Testing: Security headers present"

    local headers=$(curl -s -I "${BASE_URL}/api/health")

    local has_security_headers=0

    if echo "$headers" | grep -qi "x-frame-options"; then
        log_success "X-Frame-Options header present"
        ((has_security_headers++))
    else
        log_warning "X-Frame-Options header missing"
    fi

    if echo "$headers" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options header present"
        ((has_security_headers++))
    else
        log_warning "X-Content-Type-Options header missing"
    fi

    if [ "$has_security_headers" -ge 2 ]; then
        log_success "Security Headers - Basic security headers present"
    else
        log_warning "Security Headers - Some security headers missing"
    fi
}

test_cors() {
    echo ""
    echo "================================"
    echo "🌐 CORS Configuration Tests"
    echo "================================"

    ((TESTS_RUN++))
    log_info "Testing: CORS headers"

    local cors_header=$(curl -s -I -H "Origin: https://example.com" \
        "${BASE_URL}/api/health" | grep -i "access-control-allow")

    if [ -n "$cors_header" ]; then
        log_success "CORS headers present"
    else
        log_info "No CORS headers (may be intentional)"
    fi
}

test_database_connectivity() {
    echo ""
    echo "================================"
    echo "🗄️  Database Connectivity Tests"
    echo "================================"

    ((TESTS_RUN++))
    log_info "Testing: Database connection via health check"

    local health_response=$(curl -s "${BASE_URL}/api/health")

    if echo "$health_response" | grep -q '"database".*"healthy"'; then
        log_success "Database connection healthy"
    else
        log_error "Database connection unhealthy or not reported"
    fi
}

test_performance() {
    echo ""
    echo "================================"
    echo "⚡ Performance Tests"
    echo "================================"

    # Test multiple endpoints for performance
    test_response_time \
        "API Response Time" \
        "/api/health" \
        500 \
        "API responds within 500ms"

    test_response_time \
        "Root Page Load" \
        "/" \
        2000 \
        "Root page loads within 2s"
}

test_monitoring() {
    echo ""
    echo "================================"
    echo "📊 Monitoring Tests"
    echo "================================"

    test_endpoint \
        "Metrics Endpoint" \
        "GET" \
        "/api/monitoring/metrics" \
        200 \
        "Metrics endpoint accessible"

    test_endpoint \
        "Health Endpoint" \
        "GET" \
        "/api/monitoring/health" \
        200 \
        "Monitoring health endpoint"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    echo "========================================"
    echo "🧪 PRODUCTION SMOKE TESTS"
    echo "========================================"
    echo "Target: $BASE_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo "========================================"

    # Check if server is reachable
    log_info "Checking if server is reachable..."
    if ! curl -s --max-time 5 "${BASE_URL}/api/health" > /dev/null 2>&1; then
        log_error "Server is not reachable at $BASE_URL"
        echo ""
        echo "Please ensure the server is running and accessible."
        echo "Usage: $0 [BASE_URL]"
        echo "Example: $0 https://api.ils.example.com"
        exit 1
    fi
    log_success "Server is reachable"

    # Run all test suites
    test_health_endpoints
    test_api_endpoints
    test_static_assets
    test_error_handling
    test_security_headers
    test_cors
    test_database_connectivity
    test_performance
    test_monitoring

    # Print summary
    echo ""
    echo "========================================"
    echo "📊 TEST SUMMARY"
    echo "========================================"
    echo "Total Tests:  $TESTS_RUN"
    echo "Passed:       $TESTS_PASSED"
    echo "Failed:       $TESTS_FAILED"
    echo "========================================"

    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
        echo "========================================"
        exit 0
    else
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
        echo "========================================"
        exit 1
    fi
}

# Run main function
main
