# Multi-Tenant AI Platform - Subscriber Usage Guide

## Overview

This document explains how the AI model will be utilized by subscribers on the live platform, including:
- Multi-tenant architecture
- Tenant isolation
- Preventing duplicates and issues
- UI integration
- Subscription tiers and features

---

## 🏢 Multi-Tenant Architecture

### How It Works

```
Subscriber Company A              Subscriber Company B              Subscriber Company C
(Optical Shop 1)                  (Optical Shop 2)                  (Optical Shop 3)
        │                                 │                                 │
        │                                 │                                 │
        ▼                                 ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ILS Platform (Main Application)                         │
│                         https://ils-platform.com                                │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                    Authentication & Tenant Router                         │ │
│  │  • Validates JWT token                                                    │ │
│  │  • Extracts tenant_id from token                                         │ │
│  │  • Routes to tenant-specific resources                                   │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │  Tenant A       │     │  Tenant B       │     │  Tenant C       │        │
│  │  Database       │     │  Database       │     │  Database       │        │
│  │  - Sales        │     │  - Sales        │     │  - Sales        │        │
│  │  - Inventory    │     │  - Inventory    │     │  - Inventory    │        │
│  │  - Patients     │     │  - Patients     │     │  - Patients     │        │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ AI Queries with Tenant Context
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AI Service (Python)                                │
│                              http://ai-service:8080                             │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                          Tenant Router                                    │ │
│  │  • Request deduplication (prevents duplicate queries)                    │ │
│  │  • Rate limiting per tenant                                              │ │
│  │  • Usage tracking for billing                                            │ │
│  │  • Response caching                                                       │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                  Shared Llama Model (All Tenants)                        │ │
│  │  Meta-Llama-3.1-8B-Instruct (Base or Fine-Tuned)                        │ │
│  │  • Shared model instance                                                 │ │
│  │  • Tenant context in prompts (not in model)                             │ │
│  │  • Efficient resource usage                                              │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Tenant Isolation Strategy

### 1. **Database-Level Isolation**

Each subscriber has their own isolated database schema:

```sql
-- Tenant A
Database: ils_tenant_abc123_sales
Database: ils_tenant_abc123_inventory
Database: ils_tenant_abc123_patients_anon

-- Tenant B
Database: ils_tenant_xyz789_sales
Database: ils_tenant_xyz789_inventory
Database: ils_tenant_xyz789_patients_anon
```

**Security:**
- ✅ Complete data isolation
- ✅ No cross-tenant queries possible
- ✅ Each tenant's data is physically separated
- ✅ Connection strings are tenant-specific

### 2. **Application-Level Isolation**

```typescript
// Every request includes tenant context
interface TenantContext {
  tenantId: string;        // "abc123"
  tenantCode: string;      // "optical-shop-1"
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
  aiQueriesLimit: number;  // Queries per month
  aiQueriesUsed: number;   // Current usage
}

// Extracted from JWT token
const token = jwt.verify(tokenString, SECRET_KEY);
const tenantId = token.tenant_id;
```

### 3. **Model-Level Isolation**

**Single Shared Model with Tenant Context:**

```python
# The model itself is shared (efficient resource usage)
# But each query includes tenant-specific context

def query_with_tenant_context(tenant_id, query, db_connections):
    # Get tenant-specific database connection
    tenant_db = db_connections[tenant_id]
    
    # Query tenant's data only
    data = tenant_db.execute(query)
    
    # Model processes with tenant context
    result = model.generate(f"[Tenant: {tenant_id}] {query}", data)
    
    return result
```

**Benefits:**
- ✅ One model instance serves all tenants (cost-effective)
- ✅ Tenant context prevents data leakage
- ✅ Scalable to thousands of tenants
- ✅ Easy to update model for all tenants at once

---

## 🚫 Preventing Duplicates and Issues

### 1. **Request Deduplication**

Prevents the same query from being processed multiple times:

```typescript
// tenant_router.py

class TenantRouter:
    def check_duplicate_request(tenant_id, query, query_type):
        # Generate cache key
        cache_key = hash(f"{tenant_id}:{query_type}:{query.lower()}")
        
        # Check cache (5 minute TTL)
        if cache_key in cache and not_expired(cache[cache_key]):
            return cache[cache_key]  # Return cached response
        
        return None  # New request, process it
```

**Example:**
```
User clicks "Ask" button multiple times
→ First request: Processed
→ Second request (within 5 min): Returns cached response
→ Third request (within 5 min): Returns cached response
✅ No duplicate processing, no duplicate charges
```

### 2. **Rate Limiting**

Prevents abuse and ensures fair usage:

```typescript
// Rate limits per subscription tier
const RATE_LIMITS = {
  basic: 30,        // 30 queries per minute
  professional: 60, // 60 queries per minute
  enterprise: 120   // 120 queries per minute
};

function checkRateLimit(tenant_id, tier) {
  const recent_requests = get_last_minute_requests(tenant_id);
  
  if (recent_requests.length >= RATE_LIMITS[tier]) {
    throw new RateLimitError('Please wait before making more queries');
  }
  
  return true;
}
```

### 3. **Usage Tracking**

Every query is tracked for billing and monitoring:

```typescript
// ai_usage_logs table
{
  id: 1,
  tenant_id: "abc123",
  user_id: 456,
  query_type: "sales",
  question: "What were our top selling products?",
  tokens_used: 150,
  from_cache: false,
  response_time_ms: 1200,
  success: true,
  timestamp: "2025-11-03T14:30:00Z"
}
```

**Benefits:**
- ✅ Accurate billing
- ✅ Usage analytics
- ✅ Detect anomalies
- ✅ Track performance

### 4. **Idempotency Keys**

For critical operations, use idempotency keys:

```typescript
// Client-side
const idempotencyKey = `${userId}-${Date.now()}-${randomUUID()}`;

fetch('/api/ai/query', {
  method: 'POST',
  headers: {
    'X-Idempotency-Key': idempotencyKey
  },
  body: JSON.stringify({ question, query_type })
});

// Server-side
function handleQuery(req) {
  const key = req.headers['x-idempotency-key'];
  
  // Check if this key was already processed
  const existing = cache.get(key);
  if (existing) {
    return existing; // Return same response
  }
  
  // Process new request
  const response = processQuery(req.body);
  
  // Store with idempotency key (24h TTL)
  cache.set(key, response, 86400);
  
  return response;
}
```

---

## 🎨 UI Integration for Subscribers

### 1. **Dashboard Widget**

**Location:** Main dashboard, right sidebar

```tsx
// Dashboard.tsx
<div className="dashboard-layout">
  <div className="main-content">
    {/* Sales, inventory, etc. */}
  </div>
  
  <div className="sidebar">
    <AIAssistant 
      tenantId={currentTenant.id}
      userId={currentUser.id}
      userName={currentUser.name}
      subscriptionTier={currentTenant.subscriptionTier}
    />
  </div>
</div>
```

**Features:**
- Always visible (floating widget)
- Collapsible to save screen space
- Context-aware (knows current page)
- Persistent conversation history

### 2. **Contextual AI Helpers**

AI assistance embedded in specific features:

```tsx
// Sales Page
<SalesAnalytics>
  <AIQuickQuery 
    context="sales"
    suggestions={[
      "What were our top 3 products this month?",
      "Show revenue trend for the last quarter",
      "Which customer segment is growing fastest?"
    ]}
  />
</SalesAnalytics>

// Inventory Page
<InventoryManagement>
  <AIQuickQuery 
    context="inventory"
    suggestions={[
      "Which items are low in stock?",
      "What should I reorder this week?",
      "Show items with highest turnover"
    ]}
  />
</InventoryManagement>
```

### 3. **Smart Search Bar**

Global search with AI enhancement:

```tsx
<GlobalSearch>
  {/* Traditional search results */}
  <SearchResults />
  
  {/* AI-powered insights */}
  <AIInsights 
    query={searchTerm}
    context={currentPage}
  />
</GlobalSearch>
```

### 4. **Subscription Tier Indicators**

Show feature availability clearly:

```tsx
<FeatureCard>
  <FeatureIcon />
  <FeatureName>Patient Analytics AI</FeatureName>
  
  {/* Different states */}
  {tier === 'enterprise' && (
    <Badge color="green">Available</Badge>
  )}
  
  {tier === 'professional' && (
    <Badge color="orange">Upgrade to Enterprise</Badge>
  )}
  
  {tier === 'basic' && (
    <Badge color="red">Not Available</Badge>
    <UpgradeButton />
  )}
</FeatureCard>
```

---

## 📊 Subscription Tiers and Features

### Basic Tier ($49/month)
```json
{
  "ai_features": {
    "ophthalmic_knowledge": true,
    "sales_queries": false,
    "inventory_queries": false,
    "patient_analytics": false
  },
  "limits": {
    "queries_per_month": 500,
    "queries_per_minute": 30,
    "max_tokens_per_query": 300
  },
  "support": {
    "response_time": "48 hours",
    "channels": ["email"]
  }
}
```

**Available:**
- ✅ Ophthalmic knowledge queries
- ✅ Basic product recommendations
- ✅ General lens/frame information

**Not Available:**
- ❌ Sales analytics
- ❌ Inventory intelligence
- ❌ Patient trend analysis

### Professional Tier ($149/month)
```json
{
  "ai_features": {
    "ophthalmic_knowledge": true,
    "sales_queries": true,
    "inventory_queries": true,
    "patient_analytics": false
  },
  "limits": {
    "queries_per_month": 2000,
    "queries_per_minute": 60,
    "max_tokens_per_query": 500
  },
  "support": {
    "response_time": "24 hours",
    "channels": ["email", "chat"]
  }
}
```

**Available:**
- ✅ Everything in Basic
- ✅ Sales analytics and trends
- ✅ Inventory management queries
- ✅ Product performance insights

**Not Available:**
- ❌ Patient demographic analysis

### Enterprise Tier ($399/month)
```json
{
  "ai_features": {
    "ophthalmic_knowledge": true,
    "sales_queries": true,
    "inventory_queries": true,
    "patient_analytics": true
  },
  "limits": {
    "queries_per_month": -1,  // Unlimited
    "queries_per_minute": 120,
    "max_tokens_per_query": 1000
  },
  "support": {
    "response_time": "4 hours",
    "channels": ["email", "chat", "phone"],
    "dedicated_account_manager": true
  }
}
```

**Available:**
- ✅ Everything in Professional
- ✅ Patient analytics (anonymized)
- ✅ Unlimited queries
- ✅ Priority support
- ✅ Custom fine-tuning available

---

## 🔐 Security Measures

### 1. **JWT Token Security**

```typescript
// Token structure
{
  "user_id": 123,
  "tenant_id": "abc123",
  "email": "user@optical-shop-1.com",
  "role": "admin",
  "tier": "professional",
  "exp": 1730678400,  // Expiration timestamp
  "iat": 1730674800   // Issued at timestamp
}

// Token validation
function validateToken(token: string) {
  // 1. Verify signature
  const decoded = jwt.verify(token, SECRET_KEY);
  
  // 2. Check expiration
  if (decoded.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  // 3. Verify tenant exists
  const tenant = await db.tenants.findOne({ id: decoded.tenant_id });
  if (!tenant) {
    throw new Error('Invalid tenant');
  }
  
  // 4. Check subscription status
  if (tenant.subscriptionStatus !== 'active') {
    throw new Error('Subscription inactive');
  }
  
  return decoded;
}
```

### 2. **Database Connection Isolation**

```python
# Each tenant gets their own connection pool
class TenantDatabaseManager:
    def __init__(self):
        self.connection_pools = {}
    
    def get_connection(self, tenant_id):
        if tenant_id not in self.connection_pools:
            # Create new connection pool for this tenant
            self.connection_pools[tenant_id] = create_pool(
                host=DB_HOST,
                database=f"ils_{tenant_id}_sales",
                user=f"tenant_{tenant_id}_readonly",
                password=get_tenant_password(tenant_id),
                max_connections=10,
                # Read-only mode
                options="-c default_transaction_read_only=on"
            )
        
        return self.connection_pools[tenant_id]
```

### 3. **PII Protection**

```python
# Patient data is anonymized before AI access
def query_patient_analytics(tenant_id, question):
    # Only access anonymized database
    db = connect_to_anonymized_db(tenant_id)
    
    # Check for PII terms in question
    pii_terms = ['name', 'address', 'phone', 'email', 'ssn']
    if any(term in question.lower() for term in pii_terms):
        raise SecurityError(
            "Cannot query personally identifiable information. "
            "Only anonymized aggregate statistics are available."
        )
    
    # Query anonymized data only
    data = db.execute(question)
    return generate_answer(data)
```

---

## 🎯 Subscriber Usage Flow

### 1. **Login and Authentication**

```
User visits: https://ils-platform.com
  ↓
Enters credentials
  ↓
Server validates credentials
  ↓
Generates JWT token with tenant_id
  ↓
Returns token to client
  ↓
Client stores token (localStorage)
  ↓
All API requests include token in Authorization header
```

### 2. **Asking an AI Question**

```
User opens AI Assistant widget
  ↓
Selects query type (e.g., "Sales Analytics")
  ↓
Types question: "What were our top products last month?"
  ↓
Clicks "Send"
  ↓
Frontend: POST /api/ai/query
  Headers: Authorization: Bearer <JWT>
  Body: { question, query_type: "sales" }
  ↓
Backend validates JWT
  ↓
Extracts tenant_id from token
  ↓
Checks subscription tier and feature access
  ↓
Checks rate limit
  ↓
Checks for duplicate/cached response
  ↓
If cached: Return immediately
If not cached: Forward to AI service
  ↓
AI service queries tenant's sales database
  ↓
Model generates natural language answer
  ↓
Response cached and returned
  ↓
Usage logged for billing
  ↓
Frontend displays answer
```

### 3. **Usage Limits Display**

```tsx
// Shown in AI Assistant widget
<UsageIndicator>
  <ProgressBar 
    current={queriesUsed}
    max={queriesLimit}
    color={getColor(percentage)}
  />
  <Text>
    {queriesUsed} / {queriesLimit === -1 ? '∞' : queriesLimit} queries this month
  </Text>
  
  {percentage > 80 && tier !== 'enterprise' && (
    <WarningBanner>
      You've used {percentage}% of your monthly queries.
      <UpgradeLink>Upgrade for unlimited queries</UpgradeLink>
    </WarningBanner>
  )}
</UsageIndicator>
```

---

## 🚀 Deployment Checklist

### Pre-Launch

- [ ] All tenants have isolated database schemas
- [ ] JWT secret keys are secure and rotated
- [ ] Rate limiting configured per tier
- [ ] Usage tracking is operational
- [ ] Cache layer is configured (Redis)
- [ ] Model is fine-tuned on ophthalmic data
- [ ] Monitoring and alerting set up
- [ ] Backup and disaster recovery tested

### Launch

- [ ] Initial subscribers migrated
- [ ] AI widget deployed to all tenant dashboards
- [ ] Usage documentation published
- [ ] Support team trained on AI features
- [ ] Billing integration tested

### Post-Launch

- [ ] Monitor query patterns
- [ ] Track cache hit rates
- [ ] Analyze response times
- [ ] Collect user feedback
- [ ] Fine-tune model based on usage
- [ ] Optimize rate limits based on actual usage

---

## 📈 Monitoring and Metrics

### Key Metrics to Track

```typescript
// Per-tenant metrics
{
  tenant_id: "abc123",
  metrics: {
    queries_total: 1250,
    queries_successful: 1200,
    queries_failed: 50,
    queries_cached: 600,
    cache_hit_rate: 0.48,  // 48%
    avg_response_time_ms: 850,
    tokens_used_total: 187500,
    most_common_query_types: ["sales", "inventory"],
    errors: [
      { type: "rate_limit", count: 30 },
      { type: "timeout", count: 15 },
      { type: "invalid_query", count: 5 }
    ]
  }
}

// Platform-wide metrics
{
  total_queries: 125000,
  active_tenants: 100,
  avg_queries_per_tenant: 1250,
  model_uptime: 0.9995,  // 99.95%
  cache_hit_rate_global: 0.52
}
```

---

## ✅ Summary

### Tenant Isolation

- ✅ **Database isolation**: Each tenant has separate databases
- ✅ **Application isolation**: Tenant context in every request
- ✅ **Model isolation**: Shared model with tenant-specific context

### Duplicate Prevention

- ✅ **Request deduplication**: Cache recent queries (5 min TTL)
- ✅ **Idempotency keys**: Prevent accidental duplicate processing
- ✅ **Rate limiting**: Prevent abuse and ensure fair usage

### Issue Prevention

- ✅ **Usage tracking**: Monitor and bill accurately
- ✅ **Error handling**: Graceful degradation
- ✅ **Security**: JWT validation, database isolation, PII protection
- ✅ **Monitoring**: Real-time alerts for issues

### Subscriber Experience

- ✅ **Clear feature availability**: Tier-based UI
- ✅ **Transparent limits**: Show usage and remaining queries
- ✅ **Fast responses**: Caching and deduplication
- ✅ **Reliable service**: 99.95%+ uptime target

The platform is designed to scale to thousands of subscribers while maintaining complete isolation, preventing duplicates, and ensuring a smooth user experience!

