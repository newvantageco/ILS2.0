# 🔄 ILS 2.0 - Redis Configuration Guide

## **OVERVIEW**

Configure Redis for high-performance caching, session management, and real-time features to significantly improve your ILS 2.0 platform's speed, scalability, and user experience.

---

## **🎯 REDIS ARCHITECTURE**

### **Multi-Layer Caching Strategy**
```
Application Layer
├── Session Cache (24h TTL)
├── Query Cache (5min TTL)
├── AI Response Cache (30min TTL)
├── Rate Limiting (15min TTL)
└── Real-time Pub/Sub
```

### **Cache Key Patterns**
```
session:{tenantId}:{userId}           # User sessions
query:{tenantId}:{hash}               # Database queries
ai:{tenantId}:{model}:{hash}          # AI responses
ratelimit:{tenantId}:{userId}:{endpoint} # Rate limits
realtime:{tenantId}:{channel}         # Live updates
cache:{tenantId}:{type}:{id}          # General cache
```

---

## **🚀 QUICK SETUP**

### **Option 1: Railway Redis (Recommended)**
1. **Add Redis Service**: Railway → "+ New" → "Database" → "Add Redis"
2. **Configure Variables**: Add Redis environment variables
3. **Test Connection**: Verify Redis is accessible
4. **Deploy**: Railway will automatically redeploy

### **Option 2: External Redis**
1. **Create Redis Instance**: AWS ElastiCache, DigitalOcean, etc.
2. **Get Connection URL**: `redis://user:pass@host:port`
3. **Configure Variables**: Set REDIS_URL in Railway
4. **Test Connection**: Verify connectivity

---

## **🔧 ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**
```bash
# Redis Connection
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Session Management
SESSION_STORE=redis
SESSION_TTL=86400          # 24 hours
SESSION_SECRET=your-secret-key

# Cache Configuration
CACHE_TTL=3600             # 1 hour general cache
AI_CACHE_TTL=1800          # 30 minutes AI responses
QUERY_CACHE_TTL=300        # 5 minutes database queries
PRESCRIPTION_CACHE_TTL=7200 # 2 hours prescription data

# Rate Limiting
RATE_LIMIT_TTL=900         # 15 minutes
RATE_LIMIT_MAX=100         # Max requests per window
RATE_LIMIT_WINDOW=900      # Window size in seconds

# Real-time Features
REDIS_PUBSUB_ENABLED=true
NOTIFICATION_TTL=86400     # 24 hours
```

---

## **📊 CACHING STRATEGIES**

### **1. Session Management**
```javascript
// Session storage in Redis
const sessionKey = `session:${tenantId}:${userId}`;
await redis.setex(sessionKey, SESSION_TTL, JSON.stringify(sessionData));
```

**Benefits**:
- Fast session lookup (<1ms)
- Automatic session expiration
- Multi-server session sync
- Memory efficient storage

### **2. Database Query Caching**
```javascript
// Query result caching
const queryHash = crypto.createHash('md5').update(query).digest('hex');
const cacheKey = `query:${tenantId}:${queryHash}`;
await redis.setex(cacheKey, QUERY_CACHE_TTL, JSON.stringify(results));
```

**Cache Strategy**:
- **Read-heavy queries**: Patient lists, product catalogs
- **Expensive queries**: Analytics, reports, joins
- **Reference data**: Settings, configurations, templates
- **TTL Strategy**: 5 minutes for dynamic data, 1 hour for static

### **3. AI Response Caching**
```javascript
// AI service response caching
const aiHash = crypto.createHash('md5').update(prompt).digest('hex');
const cacheKey = `ai:${tenantId}:${model}:${aiHash}`;
await redis.setex(cacheKey, AI_CACHE_TTL, JSON.stringify(aiResponse));
```

**Cost Optimization**:
- **GPT-4 Queries**: Cache for 30 minutes
- **Claude 3 Queries**: Cache for 30 minutes
- **OCR Results**: Cache for 2 hours
- **Analysis Results**: Cache for 1 hour

### **4. Rate Limiting**
```javascript
// Per-tenant rate limiting
const rateLimitKey = `ratelimit:${tenantId}:${userId}:${endpoint}`;
const current = await redis.incr(rateLimitKey);
if (current === 1) {
  await redis.expire(rateLimitKey, RATE_LIMIT_TTL);
}
```

**Rate Limiting Strategy**:
- **Per-tenant limits**: Prevent abuse per organization
- **Per-user limits**: Individual user throttling
- **Endpoint-specific**: Different limits per API type
- **Burst protection**: Handle traffic spikes

---

## **🔍 MONITORING & METRICS**

### **Key Performance Indicators**
```bash
# Redis memory usage
redis-cli info memory | grep used_memory_human

# Connection count
redis-cli info clients | grep connected_clients

# Cache hit rate
redis-cli info stats | grep keyspace_hits,keyspace_misses

# Slow queries
redis-cli slowlog get 10
```

### **Application Metrics**
- **Cache Hit Ratio**: Target >80%
- **Response Times**: <1ms for cache hits
- **Memory Usage**: Monitor eviction rates
- **Connection Pool**: Track active connections
- **Error Rates**: Redis connection failures

### **Monitoring Endpoints**
```bash
# Redis health check
GET /api/monitoring/redis

# Cache statistics
GET /api/monitoring/cache

# Performance metrics
GET /api/monitoring/performance
```

---

## **🧪 TESTING & VALIDATION**

### **Connection Testing**
```bash
# Test Redis connectivity
node -e "
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
client.connect().then(() => console.log('✅ Redis connected'))
  .catch(err => console.log('❌ Redis failed:', err.message));
"
```

### **Performance Testing**
```bash
# Cache performance test
curl -X POST /api/test/cache \
  -H "Content-Type: application/json" \
  -d '{"operations": 1000}'

# Load test with concurrent users
for i in {1..50}; do
  curl -s /api/health > /dev/null &
done
wait
```

### **Feature Testing**
```bash
# Session management test
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# AI caching test
curl -X POST /api/ai/query \
  -H "Authorization: Bearer TOKEN" \
  -d '{"query": "What is glaucoma?", "useCache": true}'

# Rate limiting test
for i in {1..105}; do
  curl -s /api/test/ratelimit > /dev/null &
done
```

---

## **🔒 SECURITY CONFIGURATION**

### **Access Control**
```bash
# Redis password protection
requirepass your-redis-password

# Network security
bind 127.0.0.1 10.0.0.1
protected-mode yes
```

### **Data Isolation**
- **Tenant Separation**: All keys prefixed with tenantId
- **Session Isolation**: Separate session namespaces
- **Cache Isolation**: Per-tenant cache keys
- **Rate Limiting**: Isolated per-tenant counters

### **Security Best Practices**
- **Connection Security**: Use TLS for external Redis
- **Key Naming**: No sensitive data in key names
- **Data Encryption**: Encrypt sensitive cached values
- **Access Logging**: Monitor Redis access patterns

---

## **💰 PERFORMANCE OPTIMIZATION**

### **Memory Management**
```bash
# Redis memory optimization
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### **Connection Pooling**
```javascript
// Redis connection pool configuration
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 5000,
    lazyConnect: true,
  },
  retry_delay_on_failover: 100,
  maxRetriesPerRequest: 3,
});
```

### **Cache Optimization**
- **Key Expiration**: Set appropriate TTL values
- **Memory Monitoring**: Track eviction rates
- **Connection Reuse**: Use connection pooling
- **Batch Operations**: Use MGET/MSET for multiple keys
- **Compression**: Compress large cached values

---

## **🚨 TROUBLESHOOTING**

### **Common Issues**

#### **Connection Failures**
```bash
# Check Redis URL
echo $REDIS_URL

# Test connectivity
telnet redis-host 6379

# Check logs
railway logs
```

#### **Memory Issues**
```bash
# Check memory usage
redis-cli info memory

# Monitor eviction
redis-cli config get maxmemory-policy

# Clean up expired keys
redis-cli --scan --pattern "expired:*" | xargs redis-cli del
```

#### **Performance Issues**
```bash
# Check slow queries
redis-cli slowlog get 10

# Monitor connections
redis-cli info clients

# Check hit rate
redis-cli info stats
```

---

## **📈 SCALING CONSIDERATIONS**

### **Vertical Scaling**
- **Memory**: Increase based on cache size requirements
- **CPU**: Monitor for high connection counts
- **Network**: Ensure sufficient bandwidth

### **Horizontal Scaling**
- **Redis Cluster**: For large-scale deployments
- **Read Replicas**: For read-heavy workloads
- **Sharding**: Distribute data across multiple instances

### **Capacity Planning**
```bash
# Estimate memory requirements
cache_size = (item_count * avg_item_size) * (1 + overhead_factor)

# Example: 10,000 items, 1KB each, 30% overhead
# 10,000 * 1KB * 1.3 = ~13MB required
```

---

## **🎯 SUCCESS CRITERIA**

Your Redis configuration is successful when:

✅ **Connection Healthy**: Redis connects reliably  
✅ **Session Management**: User sessions persist across restarts  
✅ **Cache Performance**: >80% hit ratio, <1ms response times  
✅ **Rate Limiting**: API abuse prevention working  
✅ **Memory Usage**: Stable with appropriate eviction  
✅ **Monitoring**: All metrics visible and healthy  
✅ **Security**: Tenant isolation and access control working  

---

## **🚀 NEXT STEPS**

1. **Add Redis Service**: Railway → "+ New" → "Database" → "Add Redis"
2. **Configure Environment**: Add all Redis variables to Railway
3. **Test Connection**: Run `./scripts/test-redis.sh`
4. **Monitor Performance**: Check metrics and optimize TTL values
5. **Scale as Needed**: Adjust memory and connection limits

---

## **📞 SUPPORT**

- **Railway Redis Docs**: [docs.railway.app/reference/redis](https://docs.railway.app/reference/redis)
- **Redis Documentation**: [redis.io/documentation](https://redis.io/documentation)
- **Node Redis Client**: [github.com/redis/node-redis](https://github.com/redis/node-redis)
- **ILS Documentation**: `./docs/`

---

**🚀 Your high-performance Redis caching system is ready!**
