#!/bin/bash

# ILS 2.0 - Redis Setup Script
# Configures Redis for caching, sessions, and real-time features

set -e

echo "🔄 ILS 2.0 - Redis Setup"
echo "========================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_header() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

print_header "REDIS CONFIGURATION FOR ILS 2.0"

echo ""
print_info "Redis will be used for:"
echo "  • Session Management (user authentication)"
echo "  • Query Caching (database results)"
echo "  • AI Response Caching (API cost optimization)"
echo "  • Real-time Features (notifications, updates)"
echo "  • Rate Limiting (API abuse prevention)"
echo ""

print_header "RAILWAY REDIS SETUP"

echo ""
print_info "Step 1: Add Redis to your Railway project"
echo ""

cat << 'EOF'
1. Go to your Railway project dashboard
2. Click "+ New" → "Database" → "Add Redis"
3. Wait for Redis service to be running
4. Redis URL will be automatically provided as REDIS_URL

EOF

print_info "Step 2: Configure environment variables"
echo ""

cat << 'EOF'
Add these to your Railway project environment variables:

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Session Configuration
SESSION_STORE=redis
SESSION_TTL=86400  # 24 hours

# Cache Configuration
CACHE_TTL=3600     # 1 hour for general cache
AI_CACHE_TTL=1800  # 30 minutes for AI responses
QUERY_CACHE_TTL=300 # 5 minutes for database queries

# Rate Limiting
RATE_LIMIT_TTL=900 # 15 minutes
RATE_LIMIT_MAX=100 # Max requests per window

EOF

print_info "Step 3: Update your application configuration"
echo ""

cat << 'EOF'
The ILS 2.0 application will automatically detect and use Redis when:
- REDIS_URL is set in environment variables
- Redis service is running and accessible
- CacheService is properly initialized

EOF

print_header "REDIS FEATURES CONFIGURATION"

echo ""
print_info "🚀 Performance Optimizations:"
echo ""

cat << 'EOF'
• Database Query Caching: Frequent queries cached for 5 minutes
• AI Response Caching: GPT-4/Claude responses cached for 30 minutes
• Session Storage: User sessions stored in Redis for 24 hours
• API Rate Limiting: Request counts tracked in Redis
• Real-time Updates: Pub/Sub for live notifications

EOF

print_info "🔒 Security Features:"
echo ""

cat << 'EOF'
• Session Isolation: Separate session keys per tenant
• Cache Invalidation: Automatic cache clearing on data updates
• Rate Limiting: Per-tenant and per-user rate limits
• Memory Management: Automatic eviction policies
• Connection Pooling: Efficient connection management

EOF

print_header "TESTING REDIS CONNECTION"

echo ""
print_info "Test Redis connection in Railway shell:"
echo ""

cat << 'EOF'
# Open Railway shell for your main service
railway shell

# Test Redis connection
node -e "
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
client.on('connect', () => {
  console.log('✅ Redis connected successfully');
  process.exit(0);
});
client.on('error', (err) => {
  console.log('❌ Redis connection failed:', err.message);
  process.exit(1);
});
"

EOF

print_info "Test caching functionality:"
echo ""

cat << 'EOF'
# Test cache set/get
node -e "
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
client.connect().then(() => {
  return client.set('test-key', 'Hello ILS 2.0', { EX: 60 });
}).then(() => {
  return client.get('test-key');
}).then((value) => {
  console.log('✅ Cache test successful:', value);
  return client.quit();
}).catch((err) => {
  console.log('❌ Cache test failed:', err.message);
});
"

EOF

print_header "MONITORING REDIS"

echo ""
print_info "Redis monitoring commands:"
echo ""

cat << 'EOF'
# Check Redis info
curl https://your-app.railway.app/api/monitoring/redis

# View Redis metrics in Railway dashboard
# Service → Redis → Metrics tab

# Monitor memory usage
redis-cli info memory

# Monitor connections
redis-cli info clients

# Monitor slow queries
redis-cli slowlog get 10

EOF

print_header "PERFORMANCE TUNING"

echo ""
print_info "Redis configuration recommendations:"
echo ""

cat << 'EOF'
• Memory: Start with 256MB, scale based on usage
• Persistence: Enable RDB snapshots for backup
• Eviction Policy: allkeys-lru for cache workloads
• Max Connections: 100+ for concurrent users
• Timeout: 300 seconds for connection cleanup

EOF

print_info "Cache key strategies:"
echo ""

cat << 'EOF'
• Sessions: session:{tenantId}:{userId}
• Queries: query:{tenantId}:{hash}
• AI Responses: ai:{tenantId}:{model}:{hash}
• Rate Limits: ratelimit:{tenantId}:{userId}:{endpoint}
• Real-time: realtime:{tenantId}:{channel}

EOF

print_header "TROUBLESHOOTING"

echo ""
print_info "Common Redis issues and solutions:"
echo ""

cat << 'EOF'
❌ Connection Refused:
  • Check REDIS_URL environment variable
  • Verify Redis service is running
  • Check network connectivity

❌ Memory Issues:
  • Monitor Redis memory usage
  • Adjust eviction policies
  • Set appropriate TTL values

❌ Slow Performance:
  • Check Redis slow log
  • Optimize cache key patterns
  • Monitor connection pool usage

❌ Session Loss:
  • Verify SESSION_STORE=redis
  • Check session TTL settings
  • Monitor Redis memory pressure

EOF

print_success "Redis setup guide completed!"
echo ""

print_info "📋 Next Steps:"
echo "1. Add Redis service to Railway project"
echo "2. Configure environment variables"
echo "3. Test Redis connection"
echo "4. Monitor performance metrics"
echo "5. Adjust cache TTL values based on usage"
echo ""

print_info "🔗 Testing Commands:"
echo ""
echo "# Test Redis health:"
echo "curl https://your-app.railway.app/api/health"
echo ""
echo "# Test caching:"
echo "curl https://your-app.railway.app/api/test/cache"
echo ""
echo "# Monitor Redis metrics:"
echo "curl https://your-app.railway.app/api/monitoring/redis"
echo ""

echo "🚀 Your Redis caching system is ready to boost performance!"
