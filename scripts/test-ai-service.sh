#!/bin/bash

# ILS 2.0 - AI Service Testing Script
# Tests all AI service endpoints after deployment

set -e

echo "🧪 ILS 2.0 - AI Service Testing"
echo "==============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
AI_SERVICE_URL=${1:-"https://your-space.hf.space"}
JWT_TOKEN=""

print_info "Testing AI Service at: $AI_SERVICE_URL"

# Function to test endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local description="$5"
    
    print_info "Testing: $description"
    
    local cmd="curl -s -o /dev/null -w '%{http_code}' -X $method"
    
    if [ -n "$data" ]; then
        cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    if [ -n "$JWT_TOKEN" ]; then
        cmd="$cmd -H 'Authorization: Bearer $JWT_TOKEN'"
    fi
    
    cmd="$cmd '$AI_SERVICE_URL$endpoint'"
    
    local status_code=$(eval "$cmd" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$description (HTTP $status_code)"
        return 0
    else
        print_error "$description (HTTP $status_code, expected $expected_status)"
        return 1
    fi
}

# Function to get JWT token
get_jwt_token() {
    print_info "Getting JWT token..."
    
    local response=$(curl -s -X POST "$AI_SERVICE_URL/api/v1/auth/token" \
        -H "Content-Type: application/json" \
        -d '{"tenant_id": "test", "user_id": "test"}' 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        JWT_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$JWT_TOKEN" ]; then
            print_success "JWT token obtained"
            return 0
        fi
    fi
    
    print_warning "Could not get JWT token, continuing without auth"
    return 1
}

echo ""
print_info "Starting AI Service Tests..."
echo ""

# Test 1: Health Check
test_endpoint "GET" "/health" "" "200" "Health Check Endpoint"

# Test 2: Root Endpoint
test_endpoint "GET" "/" "" "200" "Root Information Endpoint"

# Test 3: Authentication (Get Token)
get_jwt_token

# Test 4: Query Endpoint (with auth)
test_endpoint "POST" "/api/v1/query" \
    '{"query": "Show me recent orders", "tenant_id": "test"}' \
    "401" "Query Endpoint (expected 401 without valid token)"

# Test 5: Ophthalmic Knowledge Endpoint
test_endpoint "POST" "/api/v1/ophthalmic-knowledge" \
    '{"question": "What are the symptoms of glaucoma?", "tenant_id": "test"}' \
    "401" "Ophthalmic Knowledge Endpoint (expected 401 without valid token)"

# Test 6: Prescription Analysis Endpoint
test_endpoint "POST" "/api/v1/prescription/analyze" \
    '{"image_data": "base64_data", "tenant_id": "test"}' \
    "401" "Prescription Analysis Endpoint (expected 401 without valid token)"

echo ""
print_info "Testing with valid JWT token (if available)..."

if [ -n "$JWT_TOKEN" ]; then
    # Test with valid token
    test_endpoint "POST" "/api/v1/query" \
        '{"query": "Show me recent orders", "tenant_id": "test"}' \
        "200" "Query Endpoint (with valid token)"
        
    test_endpoint "POST" "/api/v1/ophthalmic-knowledge" \
        '{"question": "What are the symptoms of glaucoma?", "tenant_id": "test"}' \
        "200" "Ophthalmic Knowledge Endpoint (with valid token)"
else
    print_warning "Skipping authenticated tests - no JWT token available"
fi

echo ""
print_info "Testing OpenAI and Anthropic API integration..."

# Test OpenAI integration (will fail without API keys but should return proper error)
test_endpoint "POST" "/api/v1/ophthalmic-knowledge" \
    '{"question": "Test OpenAI integration", "tenant_id": "test", "model": "gpt-4"}' \
    "401" "OpenAI Integration Test (expected 401 without auth)"

echo ""
print_info "AI Service Testing Summary:"
echo ""
echo "🔗 Service URL: $AI_SERVICE_URL"
echo "🔑 JWT Token: ${JWT_TOKEN:0:20}..." 
echo ""
echo "📋 Test Results:"
echo "• Health Check: Should return 200"
echo "• Authentication: Should return JWT token"
echo "• Query Endpoints: Should work with valid token"
echo "• API Integration: Should handle missing API keys gracefully"
echo ""

print_info "Manual Testing Commands:"
echo ""
echo "# Health check:"
echo "curl $AI_SERVICE_URL/health"
echo ""
echo "# Get JWT token:"
echo "curl -X POST $AI_SERVICE_URL/api/v1/auth/token \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"tenant_id\": \"test\", \"user_id\": \"test\"}'"
echo ""
echo "# Test query with token:"
echo "curl -X POST $AI_SERVICE_URL/api/v1/query \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '{\"query\": \"Show me recent orders\", \"tenant_id\": \"test\"}'"
echo ""

print_success "AI Service testing completed!"
echo ""
print_warning "Remember to:"
echo "• Set OPENAI_API_KEY and ANTHROPIC_API_KEY in Space settings"
echo "• Update AI_SERVICE_URL in your main Railway application"
echo "• Test with real prescription images for OCR functionality"
echo ""

echo "🎯 Next Steps:"
echo "1. Configure environment variables in Hugging Face Space"
echo "2. Update Railway app with new AI_SERVICE_URL"
echo "3. Test integration between main app and AI service"
echo "4. Deploy Python analytics service (optional)"
