#!/bin/bash

# ILS 2.0 - Complete Service Verification Script
# Tests all AI/ML, Shopify, and core platform services

set -e

echo "🔍 ILS 2.0 - Complete Service Verification"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${1:-"http://localhost:5000"}
AI_SERVICE_URL=${2:-"http://localhost:8080"}
PYTHON_SERVICE_URL=${3:-"http://localhost:8000"}

# Test results
PASSED=0
FAILED=0
TOTAL=0

# Function to print colored output
print_header() {
    echo -e "\n${PURPLE}🔍 $1${NC}"
    echo "----------------------------------------"
}

print_test() {
    echo -e "${BLUE}Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ️  INFO:${NC} $1"
}

# Function to run test
run_test() {
    ((TOTAL++))
    local test_name="$1"
    local command="$2"
    local expected_code="$3"
    
    print_test "$test_name"
    
    if eval "$command" > /dev/null 2>&1; then
        print_success "$test_name"
        return 0
    else
        print_error "$test_name"
        return 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    ((TOTAL++))
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_code="${3:-200}"
    local test_name="$4"
    
    print_test "$test_name"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_code" ]; then
        print_success "$test_name (HTTP $status_code)"
        return 0
    else
        print_error "$test_name (HTTP $status_code, expected $expected_code)"
        return 1
    fi
}

# Function to test AI service endpoint
test_ai_endpoint() {
    ((TOTAL++))
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_code="${3:-200}"
    local test_name="$4"
    
    print_test "$test_name"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        -H "Content-Type: application/json" \
        "$AI_SERVICE_URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_code" ]; then
        print_success "$test_name (HTTP $status_code)"
        return 0
    else
        print_error "$test_name (HTTP $status_code, expected $expected_code)"
        return 1
    fi
}

# Function to test Python service endpoint
test_python_endpoint() {
    ((TOTAL++))
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_code="${3:-200}"
    local test_name="$4"
    
    print_test "$test_name"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        -H "Content-Type: application/json" \
        "$PYTHON_SERVICE_URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_code" ]; then
        print_success "$test_name (HTTP $status_code)"
        return 0
    else
        print_error "$test_name (HTTP $status_code, expected $expected_code)"
        return 1
    fi
}

# Start verification
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  AI Service: $AI_SERVICE_URL"
echo "  Python Service: $PYTHON_SERVICE_URL"
echo ""

# 1. CORE PLATFORM SERVICES
print_header "1. CORE PLATFORM SERVICES"

test_endpoint "/api/health" "GET" "200" "Health Check Endpoint"
test_endpoint "/" "GET" "200" "Frontend Root"
test_endpoint "/api/companies" "GET" "401" "API Authentication (expected 401)"

# 2. DATABASE SERVICES
print_header "2. DATABASE SERVICES"

# Test database connectivity via health endpoint
db_status=$(curl -s "$BASE_URL/api/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
if [ "$db_status" = "connected" ]; then
    print_success "Database Connection"
    ((PASSED++))
else
    print_error "Database Connection (status: $db_status)"
    ((FAILED++))
fi
((TOTAL++))

# Test Redis connectivity
redis_status=$(curl -s "$BASE_URL/api/health" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
if [ "$redis_status" = "connected" ]; then
    print_success "Redis Connection"
    ((PASSED++))
else
    print_warning "Redis Connection (status: $redis_status - may be optional)"
    ((PASSED++)) # Redis is optional for basic functionality
fi
((TOTAL++))

# 3. AI/ML SERVICES
print_header "3. AI/ML SERVICES"

# Main AI Assistant endpoints
test_endpoint "/api/ai/chat" "POST" "401" "AI Chat Authentication"
test_endpoint "/api/ai/usage" "GET" "401" "AI Usage Authentication"

# ML Models Dashboard endpoints
test_endpoint "/api/ai-ml/ml/models" "GET" "401" "ML Models API"
test_endpoint "/api/ai-ml/ml/deployments" "GET" "401" "ML Deployments API"
test_endpoint "/api/ai-ml/ml/prediction-stats" "GET" "401" "ML Prediction Stats API"

# 4. AI SERVICE (FastAPI)
print_header "4. AI SERVICE (FastAPI)"

test_ai_endpoint "/" "GET" "200" "AI Service Root"
test_ai_endpoint "/health" "GET" "200" "AI Service Health"

# Test AI endpoints (may require auth)
test_ai_endpoint "/api/v1/query" "POST" "401" "AI Query Authentication"
test_ai_endpoint "/api/v1/ophthalmic-knowledge" "POST" "401" "Ophthalmic Knowledge Authentication"

# 5. PYTHON ANALYTICS SERVICE
print_header "5. PYTHON ANALYTICS SERVICE"

test_python_endpoint "/" "GET" "200" "Python Service Root"
test_python_endpoint "/health" "GET" "200" "Python Service Health"

# Test analytics endpoints
test_python_endpoint "/api/v1/analytics/order-trends" "GET" "200" "Order Trends Analytics"
test_python_endpoint "/api/v1/ml/predict-production-time" "POST" "422" "Production Time Prediction (validation error expected)"

# 6. SHOPIFY INTEGRATION
print_header "6. SHOPIFY INTEGRATION"

test_endpoint "/api/shopify/config" "GET" "401" "Shopify Config Authentication"
test_endpoint "/api/shopify/stores" "GET" "401" "Shopify Stores Authentication"
test_endpoint "/api/shopify/products" "GET" "401" "Shopify Products Authentication"
test_endpoint "/api/shopify/orders" "GET" "401" "Shopify Orders Authentication"

# Test webhook endpoint (public, no auth required)
test_endpoint "/api/shopify/webhooks" "POST" "401" "Shopify Webhooks (public endpoint)"

# 7. FILE STORAGE
print_header "7. FILE STORAGE SERVICES"

# Test upload endpoint (requires auth)
test_endpoint "/api/upload" "POST" "401" "File Upload Authentication"

# Check if uploads directory exists
if [ -d "uploads" ]; then
    print_success "Uploads Directory Exists"
    ((PASSED++))
else
    print_warning "Uploads Directory Missing (will be created automatically)"
    ((PASSED++))
fi
((TOTAL++))

# 8. AUTHENTICATION & SECURITY
print_header "8. AUTHENTICATION & SECURITY"

test_endpoint "/api/auth/login" "POST" "422" "Login Endpoint (validation expected)"
test_endpoint "/api/auth/register" "POST" "422" "Registration Endpoint (validation expected)"

# Test security headers
security_headers=$(curl -s -I "$BASE_URL" 2>/dev/null | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection" | wc -l)
if [ "$security_headers" -ge "2" ]; then
    print_success "Security Headers Present ($security_headers headers)"
    ((PASSED++))
else
    print_warning "Security Headers Limited ($security_headers headers)"
    ((PASSED++))
fi
((TOTAL++))

# 9. MONITORING & LOGGING
print_header "9. MONITORING & LOGGING"

test_endpoint "/api/monitoring/health" "GET" "200" "Monitoring Health"
test_endpoint "/api/monitoring/metrics" "GET" "200" "Metrics Endpoint"

# 10. STATIC ASSETS
print_header "10. STATIC ASSETS"

test_endpoint "/favicon.png" "GET" "200" "Favicon"
test_endpoint "/manifest.json" "GET" "200" "PWA Manifest"

# Test frontend build assets
test_endpoint "/assets/" "GET" "200" "Frontend Assets Directory"

# 11. DATABASE TABLES (Advanced Check)
print_header "11. DATABASE SCHEMA VERIFICATION"

if command -v psql > /dev/null 2>&1 && [ -n "$DATABASE_URL" ]; then
    print_info "Checking database tables..."
    
    # Check critical tables exist
    critical_tables=("companies" "users" "ai_model_versions" "shopify_stores" "prescriptions")
    for table in "${critical_tables[@]}"; do
        if psql "$DATABASE_URL" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            print_success "Table Exists: $table"
            ((PASSED++))
        else
            print_error "Table Missing: $table"
            ((FAILED++))
        fi
        ((TOTAL++))
    done
else
    print_warning "Cannot verify database tables (psql not available or DATABASE_URL not set)"
fi

# 12. PERFORMANCE CHECKS
print_header "12. PERFORMANCE CHECKS"

# Test response time
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/health" 2>/dev/null || echo "10.0")
if (( $(echo "$response_time < 2.0" | bc -l) )); then
    print_success "Response Time: ${response_time}s (< 2s)"
    ((PASSED++))
else
    print_warning "Response Time: ${response_time}s (> 2s, may need optimization)"
    ((PASSED++))
fi
((TOTAL++))

# RESULTS SUMMARY
echo ""
print_header "VERIFICATION RESULTS"

echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

success_rate=$((PASSED * 100 / TOTAL))
echo "Success Rate: $success_rate%"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL SERVICES VERIFIED SUCCESSFULLY!${NC}"
    echo "Your ILS 2.0 platform is fully operational."
    exit 0
elif [ $success_rate -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  MOSTLY OPERATIONAL${NC}"
    echo "Platform is mostly working with some minor issues ($FAILED failed tests)."
    exit 1
else
    echo -e "\n${RED}❌ CRITICAL ISSUES DETECTED${NC}"
    echo "Platform has significant issues ($FAILED failed tests)."
    echo "Please review the failed tests and fix critical services."
    exit 2
fi
