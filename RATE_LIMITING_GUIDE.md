# 🚀 ILS 2.0 - Rate Limiting Implementation Guide

## **OVERVIEW**

Comprehensive rate limiting system for the ILS 2.0 platform that protects AI/ML endpoints from abuse, controls OpenAI API costs, ensures fair usage across all users, and provides real-time monitoring and analytics.

---

## **🎯 RATE LIMITING ARCHITECTURE**

### **Multi-Tier Rate Limiting**
```
Rate Limiting System
├── Global Level (IP-based)
│   ├── 1000 requests/hour per IP
│   ├── DDoS protection
│   └── Abuse prevention
├── Tenant Level (Organization-based)
│   ├── Subscription tier limits
│   ├── Cost control per organization
│   └── Usage monitoring
├── User Level (Individual-based)
│   ├── Personal usage limits
│   ├── Feature-specific restrictions
│   └── Performance optimization
└── Endpoint Level (API-specific)
    ├── OCR processing limits
    ├── AI analysis restrictions
    ├── ML model testing caps
    └── Shopify widget quotas
```

---

## **⚙️ CONFIGURATION**

### **Environment Variables**
```bash
# Rate Limiting Configuration
RATE_LIMITING_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Rate Limit Tiers
FREE_TIER_REQUESTS_PER_MINUTE=10
BASIC_TIER_REQUESTS_PER_MINUTE=30
PROFESSIONAL_TIER_REQUESTS_PER_MINUTE=100
ENTERPRISE_TIER_REQUESTS_PER_MINUTE=500

# Cost Control
OCR_RATE_LIMIT=10          # requests/minute
AI_ANALYSIS_RATE_LIMIT=20  # requests/minute
ML_MODELS_RATE_LIMIT=15    # requests/minute
SHOPIFY_WIDGETS_RATE_LIMIT=50  # requests/minute

# Burst Protection
BURST_LIMIT=5              # requests/10 seconds
BURST_WINDOW_MS=10000      # 10 seconds

# Global Limits
GLOBAL_RATE_LIMIT=1000     # requests/hour
GLOBAL_WINDOW_MS=3600000   # 1 hour
```

### **Redis Configuration**
```bash
# Redis for distributed rate limiting
redis-cli --version  # Should be 6.0+
redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

---

## **📊 RATE LIMIT TIERS**

### **Subscription-Based Limits**
```javascript
const rateLimitTiers = {
  free: {
    name: 'Free',
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 500,
    burstLimit: 20,
    costPerRequest: 0.01
  },
  basic: {
    name: 'Basic',
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 2000,
    burstLimit: 50,
    costPerRequest: 0.008
  },
  professional: {
    name: 'Professional',
    requestsPerMinute: 100,
    requestsPerHour: 2000,
    requestsPerDay: 10000,
    burstLimit: 150,
    costPerRequest: 0.006
  },
  enterprise: {
    name: 'Enterprise',
    requestsPerMinute: 500,
    requestsPerHour: 10000,
    requestsPerDay: 50000,
    burstLimit: 750,
    costPerRequest: 0.004
  }
};
```

---

## **🔧 ENDPOINT-SPECIFIC LIMITS**

### **AI/ML Endpoints - Cost Control Focus**
```javascript
// OCR Processing (Highest Cost - OpenAI Vision API)
/api/ai/ocr/prescription: {
  windowMs: 60000,        // 1 minute
  maxRequests: 10,        // Very restrictive
  burstProtection: true,
  costControl: true
}

// AI Analysis (High Cost - OpenAI GPT-4)
/api/ai/analyze: {
  windowMs: 60000,        // 1 minute
  maxRequests: 20,        // Restrictive
  burstProtection: true
}

// ML Models Testing (Medium Cost)
/api/v1/models/test: {
  windowMs: 60000,        // 1 minute
  maxRequests: 15,        // Moderate
  burstProtection: false
}

// Shopify Widgets (Business Critical)
/api/shopify/widgets/*: {
  windowMs: 60000,        // 1 minute
  maxRequests: 50,        // Lenient for business
  tenantBased: true,
  burstProtection: true
}
```

### **General API Endpoints**
```javascript
// Analytics (Data Processing)
/api/analytics: {
  windowMs: 60000,        // 1 minute
  maxRequests: 200,       // Lenient
  skipSuccessfulRequests: true
}

// Authentication (Security Focus)
/api/auth/*: {
  windowMs: 900000,       // 15 minutes
  maxRequests: 5,         // Very restrictive
  skipSuccessfulRequests: true
}

// Webhooks (Business Integration)
/api/webhooks/*: {
  windowMs: 900000,       // 15 minutes
  maxRequests: 1000,      // Very lenient
  ipBased: false
}
```

---

## **🛡️ SECURITY FEATURES**

### **Bypass Protection**
```javascript
// IP Spoofing Protection
const clientIP = req.headers['x-forwarded-for'] || 
                req.headers['x-real-ip'] || 
                req.connection.remoteAddress;

// User Agent Validation
const suspiciousAgents = ['bot', 'crawler', 'scraper', 'automated'];
const userAgent = req.headers['user-agent']?.toLowerCase() || '';

// Request Pattern Analysis
const requestSignature = `${clientIP}:${userAgent}:${endpoint}`;
```

### **Rate Limit Evasion Detection**
```javascript
// Detect rapid IP changes
const ipHistory = await redis.lrange(`ip_history:${userId}`, 0, 10);
const uniqueIPs = new Set(ipHistory).size;

if (uniqueIPs > 5) {
  // Flag for potential abuse
  await securityService.flagSuspiciousActivity(userId, 'rapid_ip_change');
}

// Detect concurrent sessions
const activeSessions = await redis.scard(`sessions:${userId}`);
if (activeSessions > 3) {
  // Potential session abuse
  return createRateLimitResponse('Too many concurrent sessions');
}
```

---

## **📈 MONITORING AND ANALYTICS**

### **Real-time Metrics**
```javascript
const rateLimitMetrics = {
  // Current Usage
  currentRequests: 1250,
  requestsPerMinute: 45,
  activeUsers: 85,
  activeTenants: 12,
  
  // Limits and Usage
  totalCapacity: 10000,
  usedCapacity: 12.5,
  remainingCapacity: 87.5,
  
  // Violations
  rateLimitViolations: 23,
  blockedRequests: 156,
  suspiciousActivity: 3,
  
  // Performance
  averageResponseTime: 145,  // ms
  rateLimitOverhead: 12,     // ms
  redisLatency: 2.3,         // ms
  
  // Cost Control
  estimatedCostSavings: 234.50,
  preventedAbuseRequests: 1567,
  costPerRequest: 0.008
};
```

### **Usage Analytics**
```javascript
// Get usage analytics for dashboard
const analytics = await rateLimitingService.getUsageAnalytics(tenantId, 'day');

// Response format
{
  totalRequests: 1250,
  uniqueEndpoints: 8,
  totalCost: 10.00,
  endpointBreakdown: {
    '/api/ai/ocr/prescription': 450,
    '/api/ai/analyze': 320,
    '/api/v1/models/test': 180,
    '/api/shopify/widgets/prescription/upload': 300
  },
  hourlyUsage: {
    0: 45, 1: 32, 2: 28, ..., 23: 67
  },
  timeRange: 'day',
  tenantId: 'tenant-123',
  generatedAt: '2024-01-15T10:30:00Z'
}
```

---

## **🔍 TESTING PROCEDURES**

### **Automated Testing**
```bash
# Run comprehensive rate limiting tests
./scripts/test-rate-limiting.sh https://your-app.railway.app

# Test specific endpoints
curl -X POST https://your-app.railway.app/api/ai/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -v 2>&1 | grep -i "rate.limit"

# Load testing with rate limits
for i in {1..100}; do
  curl -s -X POST https://your-app.railway.app/api/ai/ocr/prescription \
    -H "Content-Type: application/json" \
    -d '{"test": true}' &
done
wait
```

### **Manual Testing Checklist**
```bash
✅ OCR rate limit triggers at 10 requests/minute
✅ AI analysis limit triggers at 20 requests/minute
✅ ML models limit triggers at 15 requests/minute
✅ Shopify widgets limit triggers at 50 requests/minute
✅ Burst protection triggers at 5 requests/10 seconds
✅ Global limit triggers at 1000 requests/hour
✅ Rate limit headers present in responses
✅ Recovery works after timeout period
✅ Different tiers have appropriate limits
✅ IP-based limits work correctly
```

---

## **🚨 ERROR HANDLING**

### **Rate Limit Exceeded Responses**
```javascript
// Standard 429 Response
{
  error: 'Rate limit exceeded',
  message: 'You have reached the limit for this endpoint.',
  retryAfter: 60,
  resetTime: '2024-01-15T10:31:00Z',
  limit: 10,
  windowMs: 60000,
  upgradeUrl: '/pricing'
}

// Cost Control Response
{
  error: 'Cost control limit exceeded',
  message: 'Your organization has reached the usage limit for this feature.',
  costControl: true,
  retryAfter: 3600,
  upgradeUrl: '/pricing'
}

// Burst Protection Response
{
  error: 'Burst rate limit exceeded',
  message: 'Too many requests in quick succession.',
  retryAfter: 10,
  burstProtection: true
}
```

### **Rate Limit Headers**
```javascript
// Success Response Headers
{
  'RateLimit-Limit': '10',
  'RateLimit-Remaining': '7',
  'RateLimit-Reset': '1705123860',
  'RateLimit-Used': '3',
  'X-RateLimit-Limit': '10',
  'X-RateLimit-Remaining': '7',
  'X-RateLimit-Reset': '1705123860'
}

// Rate Limit Exceeded Headers
{
  'Retry-After': '60',
  'RateLimit-Limit': '10',
  'RateLimit-Remaining': '0',
  'RateLimit-Reset': '1705123860'
}
```

---

## **🔧 IMPLEMENTATION DETAILS**

### **Redis Key Structure**
```javascript
// Rate Limit Keys
rate_limit:{identifier}:{endpoint}           // User/tenant limits
tier_limit:{tenantId}:{endpoint}:{period}    // Subscription limits
burst:{identifier}                           // Burst protection
cost:{tenantId}                              // Cost control
usage:{tenantId}:{timestamp}                 // Analytics data

// Key Examples
rate_limit:user-123:/api/ai/ocr/prescription
tier_limit:tenant-456:/api/ai/ocr/prescription:minute:1705123800
burst:user-123
cost:tenant-456
usage:tenant-456:1705123860
```

### **Sliding Window Algorithm**
```javascript
// Remove old entries
await redis.zremrangebyscore(key, 0, windowStart);

// Add current request
await redis.zadd(key, now, `${now}-${Math.random()}`);

// Count requests in window
const totalHits = await redis.zcard(key);

// Set expiration for cleanup
await redis.expire(key, Math.ceil(windowMs / 1000) + 1);
```

---

## **📊 PERFORMANCE OPTIMIZATION**

### **Redis Optimization**
```javascript
// Use Redis Pipeline for Atomic Operations
const pipeline = redis.pipeline();
pipeline.zremrangebyscore(key, 0, windowStart);
pipeline.zadd(key, now, requestKey);
pipeline.zcard(key);
pipeline.expire(key, ttl);
const results = await pipeline.exec();

// Memory Efficient Key Design
const key = `rl:${identifier}:${endpoint}:${Math.floor(now / windowMs)}`;

// Automatic Cleanup
redis.config('set', 'maxmemory-policy', 'allkeys-lru');
```

### **Performance Benchmarks**
```javascript
const performanceTargets = {
  rateLimitCheckTime: 5,      // ms
  redisOperationTime: 2,     // ms
  totalOverhead: 50,         // ms
  memoryUsagePerKey: 100,    // bytes
  keysPerMillionRequests: 1000,
  accuracy: 99.9             // percentage
};
```

---

## **🔄 MAINTENANCE**

### **Daily Tasks**
```bash
# Monitor rate limiting performance
curl https://your-app.railway.app/api/admin/rate-limiting/status

# Check Redis memory usage
redis-cli info memory | grep used_memory_human

# Review rate limit violations
curl https://your-app.railway.app/api/admin/rate-limiting/violations

# Cleanup old rate limit data
redis-cli --scan --pattern "rate_limit:*" | head -100 | xargs redis-cli del
```

### **Weekly Tasks**
```bash
# Analyze usage patterns
curl https://your-app.railway.app/api/admin/rate-limiting/analytics?range=week

# Review and adjust limits
./scripts/adjust-rate-limits.sh

# Update subscription tiers
./scripts/update-subscription-tiers.sh

# Performance optimization
./scripts/optimize-rate-limiting.sh
```

---

## **🎯 SUCCESS CRITERIA**

Your rate limiting implementation is successful when:

✅ **Cost Control**: OpenAI API costs reduced by 80%+  
✅ **Abuse Prevention**: 99.9% of abusive requests blocked  
✅ **Fair Usage**: All users have appropriate access based on tier  
✅ **Performance**: <50ms additional latency per request  
✅ **Reliability**: 99.99% uptime for rate limiting service  
✅ **Monitoring**: Real-time analytics and alerting working  
✅ **Scalability**: Handles 10,000+ concurrent requests  
✅ **Security**: Bypass attempts detected and blocked  
✅ **Recovery**: Graceful degradation on Redis failures  
✅ **Compliance**: GDPR and data privacy requirements met  

---

## **📞 TROUBLESHOOTING**

### **Common Issues**

#### **Rate Limits Not Triggering**
```bash
# Check Redis connection
redis-cli ping

# Verify middleware registration
grep -r "setupRateLimiting" server/

# Check key generation
curl -v -X POST https://your-app.railway.app/api/ai/ocr/prescription \
  -H "Content-Type: application/json" -d '{"test": true}'
```

#### **Performance Issues**
```bash
# Monitor Redis latency
redis-cli --latency-history

# Check memory usage
redis-cli info memory

# Optimize Redis configuration
redis-cli config set maxmemory-policy allkeys-lru
```

#### **Bypass Attempts**
```bash
# Monitor suspicious activity
curl https://your-app.railway.app/api/admin/security/suspicious-activity

# Check IP validation
grep -r "clientIP" server/middleware/

# Review rate limit keys
redis-cli keys "rate_limit:*" | head -10
```

---

## **🚀 DEPLOYMENT CHECKLIST**

### **Pre-deployment**
```bash
✅ Redis cluster configured and tested
✅ Environment variables set
✅ Rate limits configured per tier
✅ Monitoring dashboards created
✅ Alert thresholds defined
✅ Load testing completed
✅ Security testing passed
✅ Documentation updated
```

### **Production Deployment**
```bash
# Deploy rate limiting service
./scripts/deploy-rate-limiting.sh

# Verify configuration
curl https://your-app.railway.app/api/admin/rate-limiting/health

# Test functionality
./scripts/test-rate-limiting.sh https://your-app.railway.app

# Monitor performance
curl https://your-app.railway.app/api/admin/rate-limiting/metrics
```

---

**🚀 Your comprehensive rate limiting system is ready for production!**
