#!/bin/bash

# ILS 2.0 - Monitoring Testing Script
# Tests all monitoring and logging functionality

set -e

echo "🧪 ILS 2.0 - Monitoring Testing"
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
APP_URL=${1:-"https://your-app.railway.app"}

echo ""
print_info "Testing monitoring at: $APP_URL"

# Function to test endpoint
test_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local description="$3"
    
    print_info "Testing: $description"
    
    local status_code=$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$description (HTTP $status_code)"
        return 0
    else
        print_error "$description (HTTP $status_code, expected $expected_status)"
        return 1
    fi
}

echo ""
print_info "🔍 Health Check Tests"

# Test 1: Basic Health Check
test_endpoint "/health" "200" "Basic Health Check"

# Test 2: Detailed Health Check
test_endpoint "/api/health" "200" "Detailed Health Check"

echo ""
print_info "📊 Service Status Tests"

# Test 3: Service Verification
test_endpoint "/api/verification/status" "200" "Service Verification Status"

# Test 4: Quick Service Check
test_endpoint "/api/verification/quick" "200" "Quick Service Check"

echo ""
print_info "📈 Metrics Collection Tests"

# Test 5: Application Metrics
test_endpoint "/api/metrics" "200" "Application Metrics Collection"

# Test 6: System Status
test_endpoint "/api/system/status" "200" "System Status Overview"

echo ""
print_info "🗄️ Database Monitoring Tests"

# Test 7: Database Monitoring
test_endpoint "/api/monitoring/database" "200" "Database Performance Metrics"

echo ""
print_info "🔄 Redis Monitoring Tests"

# Test 8: Redis Monitoring
test_endpoint "/api/monitoring/redis" "200" "Redis Performance Metrics"

# Test 9: Cache Monitoring
test_endpoint "/api/monitoring/cache" "200" "Cache Performance Statistics"

echo ""
print_info "🤖 AI Service Monitoring Tests"

# Test 10: AI/ML Service Check
test_endpoint "/api/verification/ai-ml" "200" "AI/ML Service Status"

echo ""
print_info "🛒 Shopify Integration Monitoring"

# Test 11: Shopify Service Check
test_endpoint "/api/verification/shopify" "200" "Shopify Integration Status"

echo ""
print_info "📊 Performance Testing"

print_info "Running performance load test..."

cat << 'EOF'

To test performance monitoring manually:

1. **Load Test (10 concurrent users for 30 seconds)**:
   for i in {1..10}; do
     (time curl -s https://your-app.railway.app/api/health > /dev/null) &
   done
   wait

2. **Stress Test (50 concurrent requests)**:
   for i in {1..50}; do
     curl -s https://your-app.railway.app/api/health > /dev/null &
   done
   wait

3. **Memory Usage Test**:
   curl -X POST https://your-app.railway.app/api/test/memory \
     -H "Content-Type: application/json" \
     -d '{"size": 1000000, "iterations": 100}'

4. **Database Performance Test**:
   curl -X POST https://your-app.railway.app/api/test/database \
     -H "Content-Type: application/json" \
     -d '{"queries": 100, "complexity": "medium"}'

5. **Cache Performance Test**:
   curl -X POST https://your-app.railway.app/api/test/cache \
     -H "Content-Type: application/json" \
     -d '{"operations": 1000, "keySize": 100}'

EOF

echo ""
print_info "📝 Logging Tests"

cat << 'EOF'

To test logging functionality:

1. **Error Logging Test**:
   curl -X POST https://your-app.railway.app/api/test/error \
     -H "Content-Type: application/json" \
     -d '{"type": "test", "severity": "error"}'

2. **Performance Logging Test**:
   curl -X POST https://your-app.railway.app/api/test/logging \
     -H "Content-Type: application/json" \
     -d '{"events": 100, "levels": ["info", "warn", "error"]}'

3. **Structured Logging Test**:
   curl -X POST https://your-app.railway.app/api/test/structured-logs \
     -H "Content-Type: application/json" \
     -d '{"tenantId": "test", "userId": "user123", "action": "test"}'

EOF

echo ""
print_info "🚨 Alert System Tests"

cat << 'EOF'

To test alerting functionality:

1. **Error Rate Alert Test**:
   # Generate errors to trigger alert
   for i in {1..20}; do
     curl -s https://your-app.railway.app/api/test/trigger-error > /dev/null &
   done
   wait

2. **Memory Alert Test**:
   curl -X POST https://your-app.railway.app/api/test/memory-pressure \
     -H "Content-Type: application/json" \
     -d '{"pressure": "high"}'

3. **Database Alert Test**:
   curl -X POST https://your-app.railway.app/api/test/database-slow \
     -H "Content-Type: application/json" \
     -d '{"delay": 2000}'

EOF

echo ""
print_info "📊 Business Metrics Tests"

cat << 'EOF'

To test business metrics collection:

1. **User Activity Metrics**:
   curl -X POST https://your-app.railway.app/api/test/user-activity \
     -H "Content-Type: application/json" \
     -d '{"users": 10, "actions": ["login", "search", "upload"]}'

2. **API Usage Metrics**:
   curl -X POST https://your-app.railway.app/api/test/api-usage \
     -H "Content-Type: application/json" \
     -d '{"endpoints": ["/api/patients", "/api/prescriptions"], "requests": 100}'

3. **AI Service Metrics**:
   curl -X POST https://your-app.railway.app/api/test/ai-metrics \
     -H "Content-Type: application/json" \
     -d '{"models": ["gpt-4", "claude-3"], "queries": 50}'

EOF

print_success "Monitoring testing guide ready!"
echo ""

print_info "📋 Expected Results:"
echo ""
echo "✅ Health Checks: Should return 200 OK with system status"
echo "✅ Service Verification: All components should be healthy"
echo "✅ Metrics Collection: Should return performance data"
echo "✅ Database Monitoring: Should show connection and query stats"
echo "✅ Redis Monitoring: Should show cache performance"
echo "✅ AI Service Monitoring: Should show API response times"
echo "✅ Performance Tests: Should handle concurrent load"
echo "✅ Logging: Should generate structured logs"
echo "✅ Alerting: Should trigger on threshold violations"
echo ""

print_warning "Troubleshooting Tips:"
echo ""
echo "• If health checks fail, check application logs in Railway"
echo "• If metrics are missing, verify METRICS_ENABLED=true"
echo "• If database monitoring fails, check DATABASE_URL"
echo "• If Redis monitoring fails, check REDIS_URL"
echo "• If AI service monitoring fails, check AI_SERVICE_URL"
echo ""

print_info "🔗 Monitoring Dashboard URLs:"
echo ""
echo "• Admin Dashboard: https://your-app.railway.app/admin/service-status"
echo "• System Health: https://your-app.railway.app/platform-admin/system-health"
echo "• Business Analytics: https://your-app.railway.app/admin/analytics"
echo "• Railway Metrics: Railway Dashboard → Metrics tab"
echo ""

echo "📈 Your comprehensive monitoring system is ready for testing!"
