#!/bin/bash

# ILS 2.0 - Local Service Testing Script
# Quick verification that all services are running locally

set -e

echo "🧪 ILS 2.0 - Local Service Testing"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL=${1:-"http://localhost:5000"}
AI_SERVICE_URL=${2:-"http://localhost:8080"}
PYTHON_SERVICE_URL=${3:-"http://localhost:8000"}

print_status() {
    echo -e "${BLUE}Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
}

print_error() {
    echo -e "${RED}❌ FAIL:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
}

echo "Configuration:"
echo "  Main Platform: $BASE_URL"
echo "  AI Service: $AI_SERVICE_URL"
echo "  Python Service: $PYTHON_SERVICE_URL"
echo ""

# Test 1: Main Platform Health
print_status "Main Platform Health"
if curl -s "$BASE_URL/health" > /dev/null; then
    print_success "Main platform is responding"
else
    print_error "Main platform is not responding"
fi

# Test 2: AI Service Health
print_status "AI Service Health"
if curl -s "$AI_SERVICE_URL/health" > /dev/null; then
    print_success "AI service is responding"
else
    print_warning "AI service is not responding (may not be started)"
fi

# Test 3: Python Service Health
print_status "Python Analytics Service Health"
if curl -s "$PYTHON_SERVICE_URL/health" > /dev/null; then
    print_success "Python service is responding"
else
    print_warning "Python service is not responding (may not be started)"
fi

# Test 4: Frontend
print_status "Frontend Application"
if curl -s "$BASE_URL/" | grep -q "html"; then
    print_success "Frontend is serving HTML"
else
    print_error "Frontend is not responding correctly"
fi

# Test 5: API Endpoints
print_status "API Authentication"
auth_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/companies")
if [ "$auth_response" = "401" ]; then
    print_success "API authentication is working (returns 401 as expected)"
else
    print_warning "API authentication unexpected response: $auth_response"
fi

# Test 6: Database Connection
print_status "Database Connection"
db_status=$(curl -s "$BASE_URL/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
if [ "$db_status" = "connected" ]; then
    print_success "Database connection is healthy"
else
    print_error "Database connection issue: $db_status"
fi

# Test 7: Verification API
print_status "Service Verification API"
if curl -s "$BASE_URL/api/verification/quick" > /dev/null; then
    print_success "Service verification API is working"
else
    print_error "Service verification API is not responding"
fi

echo ""
echo "🎯 Quick Commands for Testing:"
echo ""
echo "Start all services locally:"
echo "npm run dev                    # Start main platform"
echo "cd ai-service && uvicorn main:app --reload  # Start AI service"
echo "cd python-service && uvicorn main:app --reload  # Start Python service"
echo ""
echo "Test individual services:"
echo "curl $BASE_URL/health          # Main platform health"
echo "curl $AI_SERVICE_URL/health    # AI service health"
echo "curl $PYTHON_SERVICE_URL/health # Python service health"
echo ""
echo "Full verification:"
echo "curl $BASE_URL/api/verification/status | jq '.'"
echo ""
echo "Access service dashboard:"
echo "Visit: $BASE_URL/admin/service-status"
echo ""
echo "📊 Service Status Dashboard: $BASE_URL/admin/service-status"
