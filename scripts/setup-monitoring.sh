#!/bin/bash

# ILS 2.0 - Monitoring & Logging Setup Script
# Configures comprehensive monitoring for production deployment

set -e

echo "📊 ILS 2.0 - Monitoring & Logging Setup"
echo "======================================="

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

print_header "MONITORING ARCHITECTURE FOR ILS 2.0"

echo ""
print_info "Monitoring will cover:"
echo "  • Application Performance Metrics (APM)"
echo "  • Database Health & Query Performance"
echo "  • Redis Cache Performance"
echo "  • AI Service Response Times"
echo "  • File Storage Operations"
echo "  • User Activity & Business Metrics"
echo "  • Error Tracking & Alerting"
echo "  • System Resource Usage"
echo ""

print_header "BUILT-IN MONITORING FEATURES"

echo ""
print_info "🚀 Railway Monitoring (Included):"
echo ""

cat << 'EOF'
✅ Application Metrics
   • Response times, error rates, throughput
   • Memory usage, CPU utilization
   • Request counts, status codes
   • Custom business metrics

✅ Database Monitoring
   • PostgreSQL connection pool status
   • Query performance metrics
   • Database size and growth
   • Active connections and locks

✅ Redis Monitoring
   • Memory usage, hit rates
   • Connection counts, operations
   • Key expiration, eviction rates
   • Pub/Sub activity

✅ Log Aggregation
   • Structured JSON logging
   • Log levels and filtering
   • Error tracking and debugging
   • Audit trail logging

EOF

print_info "🔧 Additional Monitoring Options:"
echo ""

cat << 'EOF'
📊 External Monitoring (Optional):
   • Grafana Cloud - Free tier available
   • Datadog - Comprehensive APM
   • New Relic - Performance monitoring
   • Sentry - Error tracking

📱 Alerting & Notifications:
   • Slack integration for alerts
   • Email notifications for critical issues
   • SMS alerts for emergencies
   • Custom webhook integrations

EOF

print_header "ENVIRONMENT CONFIGURATION"

echo ""
print_info "Add these environment variables to Railway:"
echo ""

cat << 'EOF'
# Monitoring Configuration
METRICS_ENABLED=true
LOG_LEVEL=info
APM_ENABLED=true
HEALTH_CHECK_ENABLED=true

# Performance Monitoring
SLOW_QUERY_THRESHOLD=1000     # ms
MEMORY_THRESHOLD=0.8          # 80% memory usage
CPU_THRESHOLD=0.8             # 80% CPU usage
DISK_THRESHOLD=0.9            # 90% disk usage

# Error Tracking
ERROR_TRACKING_ENABLED=true
ERROR_NOTIFICATION_LEVEL=error
MAX_ERROR_RATE=0.05           # 5% error rate threshold

# Business Metrics
BUSINESS_METRICS_ENABLED=true
USER_ACTIVITY_TRACKING=true
API_USAGE_TRACKING=true

# Logging Configuration
LOG_FORMAT=json
LOG_TIMESTAMP=true
LOG_REQUEST_ID=true
LOG_TENANT_ID=true

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000   # 30 seconds
HEALTH_CHECK_TIMEOUT=5000     # 5 seconds
HEALTH_CHECK_ENDPOINTS=/health,/api/health

EOF

print_header "MONITORING ENDPOINTS"

echo ""
print_info "Built-in monitoring endpoints:"
echo ""

cat << 'EOF'
📊 Health Checks:
   GET /health                 # Basic health status
   GET /api/health            # Detailed health check
   GET /api/verification/status # Service verification

📈 Metrics:
   GET /api/metrics           # Application metrics
   GET /api/monitoring/redis  # Redis performance
   GET /api/monitoring/database # Database stats
   GET /api/monitoring/cache  # Cache performance

🔍 System Status:
   GET /api/system/status     # System overview
   GET /api/system/info       # Build and version info
   GET /api/system/uptime     # Uptime statistics

📋 Business Metrics:
   GET /api/analytics/usage   # Usage statistics
   GET /api/analytics/performance # Performance data
   GET /api/analytics/errors  # Error analytics

EOF

print_header "CUSTOM DASHBOARD SETUP"

echo ""
print_info "🎯 Admin Dashboard Features:"
echo ""

cat << 'EOF'
✅ Service Status Dashboard
   • Real-time service health
   • Component status indicators
   • Performance metrics overview
   • Error rate monitoring

✅ System Monitoring Dashboard
   • Resource usage charts
   • Database performance graphs
   • Redis cache statistics
   • API response time trends

✅ Business Intelligence Dashboard
   • User activity metrics
   • API usage analytics
   • AI service utilization
   • Prescription processing stats

✅ Alert Management
   • Real-time alert notifications
   • Alert history and trends
   • Escalation rules
   • Alert acknowledgment

EOF

print_header "LOGGING CONFIGURATION"

echo ""
print_info "📝 Structured Logging Features:"
echo ""

cat << 'EOF'
✅ Log Levels:
   • ERROR - Critical errors and failures
   • WARN  - Warning conditions and issues
   • INFO  - General information and events
   • DEBUG - Detailed debugging information

✅ Log Categories:
   • AUTH - Authentication and authorization
   • API - HTTP requests and responses
   • DB - Database operations and queries
   • AI - AI service interactions
   • BUSINESS - Business logic events
   • SECURITY - Security-related events

✅ Log Format:
   {
     "timestamp": "2024-01-01T12:00:00Z",
     "level": "info",
     "category": "api",
     "message": "Request processed",
     "requestId": "req_123",
     "tenantId": "company_456",
     "userId": "user_789",
     "duration": 150,
     "statusCode": 200
   }

EOF

print_header "PERFORMANCE MONITORING"

echo ""
print_info "⚡ Performance Metrics Collection:"
echo ""

cat << 'EOF'
✅ Application Performance:
   • Request/response times
   • Throughput (requests/second)
   • Error rates and status codes
   • Memory and CPU usage
   • Garbage collection stats

✅ Database Performance:
   • Query execution times
   • Connection pool usage
   • Index performance
   • Lock wait times
   • Query optimization suggestions

✅ Cache Performance:
   • Hit/miss ratios
   • Memory usage patterns
   • Eviction rates
   • Key distribution
   • Operation latencies

✅ AI Service Performance:
   • API response times
   • Token usage tracking
   • Cost monitoring
   • Model performance metrics
   • Error rates by model

EOF

print_header "ALERTING CONFIGURATION"

echo ""
print_info "🚨 Alert Rules and Thresholds:"
echo ""

cat << 'EOF'
🔴 Critical Alerts (Immediate):
   • Service downtime (>5 minutes)
   • Error rate >10%
   • Memory usage >90%
   • Database connection failures
   • AI service outages

🟡 Warning Alerts (Within 1 hour):
   • Error rate >5%
   • Response time >2 seconds
   • Memory usage >80%
   • Disk usage >85%
   • High API usage spikes

🔵 Info Alerts (Daily digest):
   • Performance trends
   • Usage statistics
   • System health summary
   • Scheduled maintenance reminders

EOF

print_header "TESTING MONITORING"

echo ""
print_info "🧪 Test monitoring functionality:"
echo ""

cat << 'EOF'
1. **Health Check Test**:
   curl https://your-app.railway.app/health

2. **Detailed Health Check**:
   curl https://your-app.railway.app/api/health

3. **Service Verification**:
   curl https://your-app.railway.app/api/verification/status

4. **Metrics Collection**:
   curl https://your-app.railway.app/api/metrics

5. **Redis Monitoring**:
   curl https://your-app.railway.app/api/monitoring/redis

6. **Database Monitoring**:
   curl https://your-app.railway.app/api/monitoring/database

7. **Performance Test**:
   curl -X POST https://your-app.railway.app/api/test/performance \
     -H "Content-Type: application/json" \
     -d '{"duration": 60, "load": 10}'

EOF

print_header "EXTERNAL MONITORING INTEGRATION"

echo ""
print_info "🔗 Optional external monitoring services:"
echo ""

cat << 'EOF'
📊 Grafana Cloud (Free Tier):
   • 10,000 metrics series
   • 50GB logs retention
   • 14 days metrics retention
   • 3 users free
   • Get started: grafana.com/products/cloud

🔍 Sentry (Error Tracking):
   • 5,000 errors/month free
   • Real-time error tracking
   • Stack trace analysis
   • Performance monitoring
   • Get started: sentry.io

📈 Datadog (APM):
   • 5 hosts free trial
   • Full-stack monitoring
   • Infrastructure monitoring
   • Log management
   • Get started: datadoghq.com

EOF

print_success "Monitoring setup guide completed!"
echo ""

print_info "📋 Next Steps:"
echo "1. Configure monitoring environment variables in Railway"
echo "2. Test built-in monitoring endpoints"
echo "3. Set up custom dashboards"
echo "4. Configure alert thresholds"
echo "5. (Optional) Integrate external monitoring services"
echo ""

print_info "🔗 Monitoring URLs:"
echo ""
echo "• Health Check: https://your-app.railway.app/health"
echo "• Service Status: https://your-app.railway.app/api/verification/status"
echo "• Metrics: https://your-app.railway.app/api/metrics"
echo "• Admin Dashboard: https://your-app.railway.app/admin/service-status"
echo ""

print_info "📊 Railway Built-in Monitoring:"
echo ""
echo "• Railway Dashboard: Metrics and logs included"
echo "• Application Metrics: Response times, errors, usage"
echo "• Resource Monitoring: CPU, memory, disk usage"
echo "• Log Streaming: Real-time log viewing"
echo "• Deployment Tracking: Build and deploy metrics"
echo ""

echo "📈 Your comprehensive monitoring system is ready!"
