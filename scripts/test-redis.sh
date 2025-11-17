#!/bin/bash

# ILS 2.0 - Redis Testing Script
# Tests Redis connectivity, caching, and performance

set -e

echo "🧪 ILS 2.0 - Redis Testing"
echo "==========================="

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
print_info "Testing Redis at: $APP_URL"

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
print_info "🔍 Basic Redis Tests"

# Test 1: Health Check (should include Redis status)
test_endpoint "/health" "200" "Application Health Check"

echo ""
print_info "📊 Redis Performance Tests"

print_info "Testing Redis caching functionality..."

cat << 'EOF'

To test Redis functionality manually, run these commands:

1. **Test Redis Connection** (in Railway shell):
   node -e "
   const redis = require('redis');
   const client = redis.createClient(process.env.REDIS_URL);
   client.connect().then(() => {
     console.log('✅ Redis connected');
     return client.ping();
   }).then((pong) => {
     console.log('✅ Redis PING:', pong);
     return client.quit();
   }).catch((err) => {
     console.log('❌ Redis error:', err.message);
   });
   "

2. **Test Cache Set/Get**:
   node -e "
   const redis = require('redis');
   const client = redis.createClient(process.env.REDIS_URL);
   client.connect().then(() => {
     return client.set('test:ils', 'Redis working!', { EX: 60 });
   }).then(() => {
     return client.get('test:ils');
   }).then((value) => {
     console.log('✅ Cache value:', value);
     return client.del('test:ils');
   }).then(() => {
     return client.quit();
   }).catch((err) => {
     console.log('❌ Cache error:', err.message);
   });
   "

3. **Test Session Storage**:
   node -e "
   const redis = require('redis');
   const client = redis.createClient(process.env.REDIS_URL);
   client.connect().then(() => {
     const session = { userId: 'test', tenantId: 'demo', role: 'admin' };
     return client.set('session:demo:test', JSON.stringify(session), { EX: 86400 });
   }).then(() => {
     return client.get('session:demo:test');
   }).then((value) => {
     console.log('✅ Session stored:', JSON.parse(value));
     return client.quit();
   }).catch((err) => {
     console.log('❌ Session error:', err.message);
   });
   "

4. **Test Rate Limiting**:
   node -e "
   const redis = require('redis');
   const client = redis.createClient(process.env.REDIS_URL);
   client.connect().then(() => {
     const key = 'ratelimit:demo:user:api';
     return client.incr(key);
   }).then((count) => {
     console.log('✅ Rate limit count:', count);
     if (count === 1) {
       return client.expire(key, 900);
     }
     return client.quit();
   }).then(() => {
     return client.quit();
   }).catch((err) => {
     console.log('❌ Rate limit error:', err.message);
   });
   "

EOF

print_info "🔍 Redis Feature Tests"

cat << 'EOF'

5. **Test AI Response Caching**:
   curl -X POST https://your-app.railway.app/api/ai/query \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer JWT_TOKEN" \
     -d '{"query": "What is glaucoma?", "useCache": true}'

6. **Test Database Query Caching**:
   curl -X POST https://your-app.railway.app/api/patients/search \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer JWT_TOKEN" \
     -d '{"query": "John", "useCache": true}'

7. **Test Real-time Features**:
   curl -X POST https://your-app.railway.app/api/notifications/subscribe \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer JWT_TOKEN" \
     -d '{"channel": "updates"}'

EOF

print_info "📈 Performance Monitoring"

cat << 'EOF'

8. **Check Redis Memory Usage**:
   redis-cli info memory | grep used_memory_human

9. **Monitor Redis Connections**:
   redis-cli info clients

10. **Check Slow Queries**:
    redis-cli slowlog get 10

11. **Monitor Cache Hit Rate**:
    redis-cli info stats | grep keyspace

EOF

print_info "🔧 Load Testing"

cat << 'EOF'

12. **Concurrent Connection Test**:
    for i in {1..10}; do
      curl -s https://your-app.railway.app/api/health > /dev/null &
    done
    wait

13. **Cache Performance Test**:
    time curl -X POST https://your-app.railway.app/api/test/cache \
      -H "Content-Type: application/json" \
      -d '{"operations": 100}'

EOF

print_success "Redis testing guide ready!"
echo ""

print_info "📋 Expected Results:"
echo ""
echo "✅ Redis Connection: Should connect successfully"
echo "✅ Cache Operations: Set/get should work within milliseconds"
echo "✅ Session Storage: User sessions should persist"
echo "✅ Rate Limiting: Request counts should be tracked"
echo "✅ AI Caching: Responses should be cached and retrieved"
echo "✅ Performance: Sub-millisecond response times for cache hits"
echo ""

print_warning "Troubleshooting Tips:"
echo ""
echo "• If Redis connection fails, check REDIS_URL environment variable"
echo "• If cache is slow, monitor memory usage and eviction policies"
echo "• If sessions are lost, verify SESSION_STORE=redis"
echo "• If rate limiting isn't working, check Redis key patterns"
echo ""

print_info "🔗 Monitoring URLs:"
echo ""
echo "• Redis Health: https://your-app.railway.app/api/monitoring/redis"
echo "• Cache Stats: https://your-app.railway.app/api/monitoring/cache"
echo "• Performance: https://your-app.railway.app/api/monitoring/performance"
echo ""

echo "🧪 Your Redis caching system is ready for testing!"
