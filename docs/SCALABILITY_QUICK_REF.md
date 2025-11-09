# ⚡ Scalability Quick Reference Card

**For Developers: Essential patterns for handling thousands of companies**

---

## 🎯 Golden Rules

1. **Always paginate** - Never return unbounded result sets
2. **Cache aggressively** - 60%+ hit rate is achievable
3. **Use read replicas** - For list queries and analytics
4. **Rate limit expensive ops** - Protect shared resources
5. **Monitor per company** - Track metrics individually

---

## 📝 Code Patterns

### ✅ Pagination (Required for all list endpoints)

```typescript
import { extractPaginationParams, createPaginatedResponse } from '@shared/pagination';

// Extract params from query
const params = extractPaginationParams(req.query);

// Apply to query
const data = await db.select()
  .from(orders)
  .where(eq(orders.companyId, companyId))
  .limit(params.limit)
  .offset((params.page - 1) * params.limit);

// Get total count
const [{ count: total }] = await db
  .select({ count: count() })
  .from(orders)
  .where(eq(orders.companyId, companyId));

// Return paginated response
res.json(createPaginatedResponse(data, params.page, params.limit, total));
```

---

### ✅ Caching (Use for expensive queries)

```typescript
import { cacheService, CacheNamespaces } from './services/CacheService';

// Get or compute (cache-aside pattern)
const data = await cacheService.getOrSet(
  companyId,
  'cache-key',
  async () => {
    // Expensive operation
    return await db.select()...;
  },
  {
    namespace: CacheNamespaces.PRODUCTS, // or ORDERS, PATIENTS, etc.
    ttl: 300 // 5 minutes
  }
);

// Invalidate when data changes
await cacheService.invalidateCompany(companyId, CacheNamespaces.PRODUCTS);
```

---

### ✅ Rate Limiting (Protect expensive endpoints)

```typescript
import { companyRateLimiter, aiRateLimiter, strictRateLimiter } from './middleware/rateLimiting';

// Apply to all routes
app.use('/api', companyRateLimiter);

// Specific endpoint limiting
app.post('/api/ai/analyze', aiRateLimiter, handler);
app.post('/api/expensive', strictRateLimiter, handler);
```

---

### ✅ Resource Quotas (Enforce subscription limits)

```typescript
import { checkPatientQuota, checkOrderQuota } from './middleware/resourceQuotas';

// Apply to creation endpoints
app.post('/api/patients', checkPatientQuota(), handler);
app.post('/api/orders', checkOrderQuota(), handler);
```

---

### ✅ Read Replicas (Distribute read load)

```typescript
import { db, dbRead } from '../db/replicas';

// WRITES - Always use primary
await db.insert(orders).values(newOrder);
await db.update(orders).set({ status: 'shipped' }).where(...);

// READS - Use replica for non-critical reads
const orders = await dbRead.select()
  .from(orders)
  .where(eq(orders.companyId, companyId));

// CRITICAL READS - Use primary (auth, recent writes)
const user = await db.select()
  .from(users)
  .where(eq(users.id, userId));
```

---

### ✅ Metrics (Auto-collected per company)

```typescript
import { metricsMiddleware } from './services/MetricsCollectorService';

// Apply globally
app.use(metricsMiddleware());

// Metrics are automatically tracked per company
```

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T: Return all records
```typescript
// BAD - Could return millions of rows
const orders = await db.select().from(orders);
```

### ✅ DO: Always paginate
```typescript
// GOOD - Limited, paginated results
const params = extractPaginationParams(req.query);
const orders = await db.select()
  .from(orders)
  .limit(params.limit)
  .offset((params.page - 1) * params.limit);
```

---

### ❌ DON'T: Ignore caching
```typescript
// BAD - Hits database every time
const products = await db.select().from(products);
```

### ✅ DO: Use cache for expensive queries
```typescript
// GOOD - Cached for 5 minutes
const products = await cacheService.getOrSet(
  companyId, 
  'products',
  () => db.select().from(products),
  { ttl: 300 }
);
```

---

### ❌ DON'T: Use primary for all reads
```typescript
// BAD - Primary handles all load
const analytics = await db.select()
  .from(orders)
  .where(...)
  .orderBy(...);
```

### ✅ DO: Use read replicas for analytics
```typescript
// GOOD - Distributed to replica
const analytics = await dbRead.select()
  .from(orders)
  .where(...)
  .orderBy(...);
```

---

### ❌ DON'T: Allow unlimited operations
```typescript
// BAD - No rate limiting
app.post('/api/expensive-ai-operation', handler);
```

### ✅ DO: Apply rate limiting
```typescript
// GOOD - Protected by rate limiter
app.post('/api/expensive-ai-operation', aiRateLimiter, handler);
```

---

## 📊 Cache Namespaces

Use these predefined namespaces for consistency:

```typescript
import { CacheNamespaces } from './services/CacheService';

CacheNamespaces.PRODUCTS        // Product catalog
CacheNamespaces.ORDERS          // Order data
CacheNamespaces.PATIENTS        // Patient records
CacheNamespaces.METRICS         // Dashboard metrics
CacheNamespaces.AI_RECOMMENDATIONS  // AI recommendations
CacheNamespaces.INVENTORY       // Inventory levels
CacheNamespaces.ANALYTICS       // Analytics data
CacheNamespaces.USER_PERMISSIONS  // User permissions
```

---

## 🎚️ Rate Limit Tiers

**Automatic based on subscription plan:**

| Tier | Requests | Window |
|------|----------|--------|
| FREE | 500 | 15 min |
| BASIC | 2,000 | 15 min |
| PROFESSIONAL | 5,000 | 15 min |
| ENTERPRISE | 20,000 | 15 min |

**Specialized limiters:**
- `strictRateLimiter` - 10 req/min (very expensive ops)
- `uploadRateLimiter` - 100 uploads/hour
- `aiRateLimiter` - 50 AI requests per 5 min

---

## 📈 Pagination Limits by Resource

```typescript
import { ResourceLimits, getResourceLimit } from '@shared/pagination';

// Small: users, companies (max 100)
const limit = getResourceLimit('SMALL', requestedLimit);

// Medium: orders, patients (max 500)
const limit = getResourceLimit('MEDIUM', requestedLimit);

// Large: transactions, logs (max 1000)
const limit = getResourceLimit('LARGE', requestedLimit);

// XLarge: analytics, metrics (max 5000)
const limit = getResourceLimit('XLARGE', requestedLimit);
```

---

## 🔍 Monitoring Endpoints

```bash
# Health checks
GET /api/health/database
GET /api/health/cache

# Metrics
GET /api/admin/metrics/summary
GET /api/admin/metrics/company/:companyId
GET /api/admin/metrics/problems

# Quotas
GET /api/admin/quotas/:companyId
```

---

## ⚙️ Environment Variables

**Minimum required:**
```bash
DATABASE_URL=postgresql://...
```

**Recommended for production:**
```bash
DATABASE_URL=postgresql://...
DATABASE_READ_REPLICAS=postgresql://...
REDIS_URL=redis://...
DB_POOL_MAX=20
DB_POOL_MIN=5
```

---

## 🎓 When to Use What

### Use Primary Database When:
- ✅ Writing data (INSERT, UPDATE, DELETE)
- ✅ Authentication checks
- ✅ Authorization verification
- ✅ Reading recently written data
- ✅ Financial transactions

### Use Read Replicas When:
- ✅ List views (orders, patients, products)
- ✅ Analytics queries
- ✅ Dashboard metrics
- ✅ Search operations
- ✅ Historical data

### Use Caching When:
- ✅ Data changes infrequently (< every 5 min)
- ✅ Query is expensive (> 100ms)
- ✅ Same data requested repeatedly
- ✅ List of options/config (product types, statuses)

### Apply Rate Limiting To:
- ✅ All API endpoints (base tier)
- ✅ AI/ML operations (strict)
- ✅ File uploads (medium)
- ✅ Expensive computations (strict)
- ✅ External API calls (medium)

---

## 🚦 Performance Targets

**Your API should achieve:**
- ✅ P95 response time < 500ms
- ✅ Cache hit rate > 60%
- ✅ Error rate < 5%
- ✅ Database pool < 80% utilized
- ✅ Replication lag < 5 seconds

---

## 📞 Quick Help

**Problem:** Database connection errors  
**Solution:** Check DB_POOL_MAX, increase if needed

**Problem:** Slow queries  
**Solution:** Add caching, use read replicas, check indexes

**Problem:** Rate limit violations  
**Solution:** Review subscription tier, optimize API usage

**Problem:** Out of memory  
**Solution:** Verify pagination on all list endpoints

**Problem:** High error rate for one company  
**Solution:** Check `/api/admin/metrics/company/:id`

---

## ✅ Checklist for New Endpoints

- [ ] Add pagination to list endpoints
- [ ] Apply rate limiting
- [ ] Use caching for expensive queries
- [ ] Use read replicas for read operations
- [ ] Apply resource quotas for creation endpoints
- [ ] Add company filter to all queries
- [ ] Test with high load
- [ ] Monitor metrics

---

**Keep this card handy while developing!** 🚀

**Full Documentation:** `SCALABILITY_IMPLEMENTATION_COMPLETE.md`  
**Environment Config:** `.env.scalability.example`  
**Summary:** `SCALABILITY_SUMMARY.md`
