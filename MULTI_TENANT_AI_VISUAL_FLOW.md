# Multi-Tenant AI Platform - Visual Architecture

## Complete System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                              SUBSCRIBER COMPANIES                                       │
│                                                                                         │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐                │
│  │   Optical Shop A │    │   Optical Shop B │    │   Optical Shop C │                │
│  │   (Tenant: abc)  │    │   (Tenant: xyz)  │    │   (Tenant: def)  │                │
│  │                  │    │                  │    │                  │                │
│  │  👤 User Login   │    │  👤 User Login   │    │  👤 User Login   │                │
│  │  ├─ JWT Token    │    │  ├─ JWT Token    │    │  ├─ JWT Token    │                │
│  │  └─ tenant: abc  │    │  └─ tenant: xyz  │    │  └─ tenant: def  │                │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘                │
│           │                        │                        │                          │
│           └────────────────────────┼────────────────────────┘                          │
│                                    │                                                   │
│                        HTTPS with JWT Token                                            │
│                                    │                                                   │
└────────────────────────────────────┼───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                           LOAD BALANCER / NGINX                                         │
│                           https://ils-platform.com                                      │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │  SSL Termination → Rate Limiting → Request Routing → Health Checks               │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                     MAIN APPLICATION (Node.js/Express)                                  │
│                     Port: 5000                                                          │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      AUTHENTICATION MIDDLEWARE                                    │  │
│  │                                                                                   │  │
│  │  1. Extract JWT from Authorization header                                        │  │
│  │  2. Verify JWT signature                                                         │  │
│  │  3. Check token expiration                                                       │  │
│  │  4. Extract tenant_id, user_id, role                                            │  │
│  │  5. Validate tenant exists and is active                                        │  │
│  │  6. Attach tenant context to request                                            │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                                    │
│                                    ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                       TENANT CONTEXT EXTRACTION                                   │  │
│  │                                                                                   │  │
│  │  req.tenantContext = {                                                           │  │
│  │    tenantId: "abc123",                                                           │  │
│  │    tenantCode: "optical-shop-a",                                                 │  │
│  │    subscriptionTier: "professional",                                             │  │
│  │    aiQueriesLimit: 2000,                                                         │  │
│  │    aiQueriesUsed: 450,                                                           │  │
│  │    features: {                                                                    │  │
│  │      sales_queries: true,                                                        │  │
│  │      inventory_queries: true,                                                    │  │
│  │      patient_analytics: false                                                    │  │
│  │    }                                                                              │  │
│  │  }                                                                                │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                                    │
│  ┌────────────────────────────────┴─────────────────────────────────┐                  │
│  │                                                                   │                  │
│  ▼                                                                   ▼                  │
│  Regular Endpoints                                          AI Endpoints                │
│  (Sales, Inventory, etc.)                                   (POST /api/ai/query)       │
│  │                                                           │                          │
│  ├─ GET /api/sales                                          ├─ Rate Limiting Check     │
│  ├─ GET /api/inventory                                      ├─ Feature Access Check    │
│  ├─ GET /api/patients                                       ├─ Duplicate Detection     │
│  └─ POST /api/orders                                        └─ Forward to AI Service   │
│                                                                     │                   │
└─────────────────────────────────────────────────────────────────────┼───────────────────┘
                                                                      │
                                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                        AI SERVICE (Python/FastAPI)                                      │
│                        Port: 8080                                                       │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           TENANT ROUTER                                           │  │
│  │                                                                                   │  │
│  │  Function: Route AI queries with isolation and deduplication                     │  │
│  │                                                                                   │  │
│  │  1. Receive request with tenant_id                                               │  │
│  │  2. Check rate limit for this tenant                                            │  │
│  │  3. Generate cache key: hash(tenant_id + query + query_type)                    │  │
│  │  4. Check if response is cached (5 min TTL)                                     │  │
│  │  5. If cached: Return immediately (cache hit)                                   │  │
│  │  6. If not cached: Process new request                                          │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                                    │
│                      ┌─────────────┴──────────────┐                                    │
│                      │                            │                                    │
│                      ▼                            ▼                                    │
│           Cache Hit (Cached Response)   Cache Miss (New Query)                         │
│                      │                            │                                    │
│                      │                            ▼                                    │
│                      │              ┌─────────────────────────────┐                    │
│                      │              │  RAG QUERY ENGINE           │                    │
│                      │              │                             │                    │
│                      │              │  1. Get tenant DB config    │                    │
│                      │              │  2. Connect to tenant DB    │                    │
│                      │              │     (read-only)             │                    │
│                      │              │  3. Execute SQL query       │                    │
│                      │              │  4. Get relevant data       │                    │
│                      │              │                             │                    │
│                      │              └─────────────┬───────────────┘                    │
│                      │                            │                                    │
│                      │                            ▼                                    │
│                      │              ┌─────────────────────────────┐                    │
│                      │              │  LLAMA MODEL                │                    │
│                      │              │  (Shared Across Tenants)    │                    │
│                      │              │                             │                    │
│                      │              │  Model: Llama-3.1-8B        │                    │
│                      │              │  Location: Port 8000        │                    │
│                      │              │                             │                    │
│                      │              │  Prompt Format:             │                    │
│                      │              │  [Tenant: abc123]           │                    │
│                      │              │  [Query Type: sales]        │                    │
│                      │              │  [Data: {...}]              │                    │
│                      │              │  Question: What were...     │                    │
│                      │              │                             │                    │
│                      │              └─────────────┬───────────────┘                    │
│                      │                            │                                    │
│                      │                            ▼                                    │
│                      │              Generate Natural Language Answer                   │
│                      │                            │                                    │
│                      └────────────────────────────┼────────────────────────────┐       │
│                                                   │                            │       │
│                                                   ▼                            │       │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        RESPONSE PROCESSING                                        │  │
│  │                                                                                   │  │
│  │  1. Format response                                                               │  │
│  │  2. Cache response (tenant-specific key, 5-60 min TTL)                          │  │
│  │  3. Log usage:                                                                    │  │
│  │     - tenant_id                                                                   │  │
│  │     - user_id                                                                     │  │
│  │     - query_type                                                                  │  │
│  │     - tokens_used                                                                 │  │
│  │     - from_cache (true/false)                                                     │  │
│  │     - response_time                                                               │  │
│  │     - timestamp                                                                   │  │
│  │  4. Update tenant usage counter                                                   │  │
│  │  5. Return response                                                               │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                        TENANT-ISOLATED DATABASES                                        │
│                        PostgreSQL Cluster                                               │
│                                                                                         │
│  ┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐           │
│  │  Tenant A (abc)    │    │  Tenant B (xyz)    │    │  Tenant C (def)    │           │
│  │                    │    │                    │    │                    │           │
│  │  Sales DB          │    │  Sales DB          │    │  Sales DB          │           │
│  │  ├─ transactions   │    │  ├─ transactions   │    │  ├─ transactions   │           │
│  │  ├─ products       │    │  ├─ products       │    │  ├─ products       │           │
│  │  └─ revenue        │    │  └─ revenue        │    │  └─ revenue        │           │
│  │                    │    │                    │    │                    │           │
│  │  Inventory DB      │    │  Inventory DB      │    │  Inventory DB      │           │
│  │  ├─ stock_levels   │    │  ├─ stock_levels   │    │  ├─ stock_levels   │           │
│  │  ├─ suppliers      │    │  ├─ suppliers      │    │  ├─ suppliers      │           │
│  │  └─ reorder_points │    │  └─ reorder_points │    │  └─ reorder_points │           │
│  │                    │    │                    │    │                    │           │
│  │  Patient DB (Anon) │    │  Patient DB (Anon) │    │  Patient DB (Anon) │           │
│  │  ├─ demographics   │    │  ├─ demographics   │    │  ├─ demographics   │           │
│  │  ├─ prescriptions  │    │  ├─ prescriptions  │    │  ├─ prescriptions  │           │
│  │  └─ purchases      │    │  └─ purchases      │    │  └─ purchases      │           │
│  │                    │    │                    │    │                    │           │
│  │  🔒 Read-Only      │    │  🔒 Read-Only      │    │  🔒 Read-Only      │           │
│  │  🔒 No PII         │    │  🔒 No PII         │    │  🔒 No PII         │           │
│  │  🔒 Isolated       │    │  🔒 Isolated       │    │  🔒 Isolated       │           │
│  │                    │    │                    │    │                    │           │
│  └────────────────────┘    └────────────────────┘    └────────────────────┘           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                            MONITORING & LOGGING                                         │
│                                                                                         │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐                │
│  │  Usage Tracking  │    │  Error Logging   │    │  Performance     │                │
│  │                  │    │                  │    │  Monitoring      │                │
│  │  • Queries/day   │    │  • Rate limits   │    │  • Response time │                │
│  │  • Tokens used   │    │  • Timeouts      │    │  • Cache hits    │                │
│  │  • Cache hits    │    │  • Failed queries│    │  • Model uptime  │                │
│  │  • Per tenant    │    │  • Auth failures │    │  • DB latency    │                │
│  │                  │    │                  │    │                  │                │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘                │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           BILLING INTEGRATION                                     │  │
│  │                                                                                   │  │
│  │  • Track queries per tenant                                                       │  │
│  │  • Calculate overage charges                                                      │  │
│  │  • Generate monthly invoices                                                      │  │
│  │  • Usage reports for subscribers                                                  │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Example: "What were our top products last month?"

```
USER (Tenant A)
  │
  │ 1. Types question in AI Assistant
  │    "What were our top 3 products last month?"
  │
  ▼
FRONTEND (React)
  │
  │ 2. POST /api/ai/query
  │    Headers: {
  │      Authorization: "Bearer eyJhbGc..."
  │    }
  │    Body: {
  │      question: "What were our top 3 products last month?",
  │      query_type: "sales"
  │    }
  │
  ▼
NGINX (Load Balancer)
  │
  │ 3. SSL termination
  │ 4. Rate limiting check
  │ 5. Route to backend
  │
  ▼
NODE.JS (Main App)
  │
  │ 6. Auth Middleware
  │    - Decode JWT
  │    - Extract: tenant_id = "abc123"
  │    - Extract: user_id = 456
  │    - Validate subscription active
  │
  │ 7. Tenant Context Middleware
  │    - Load tenant config from DB
  │    - Attach to request:
  │      {
  │        tenantId: "abc123",
  │        tier: "professional",
  │        queries_used: 450,
  │        queries_limit: 2000
  │      }
  │
  │ 8. Feature Check
  │    - query_type = "sales"
  │    - tier = "professional"
  │    ✅ Feature available
  │
  │ 9. Forward to AI Service
  │    POST http://ai-service:8080/api/v1/query
  │    Headers: {
  │      Authorization: "Bearer ...",
  │      X-Tenant-ID: "abc123",
  │      X-User-ID: "456"
  │    }
  │
  ▼
PYTHON AI SERVICE
  │
  │ 10. Tenant Router
  │     - tenant_id = "abc123"
  │     - Generate cache key:
  │       hash("abc123:sales:what were our top 3 products last month")
  │       = "a7f3e9c2..."
  │
  │ 11. Check Cache
  │     - Check Redis for key "a7f3e9c2..."
  │     - Not found (first time asking)
  │
  │ 12. Check Rate Limit
  │     - Get recent requests for tenant "abc123"
  │     - Count: 45 requests in last minute
  │     - Limit: 60 requests/min (professional tier)
  │     ✅ Under limit
  │
  │ 13. RAG Engine
  │     - Load tenant DB config:
  │       conn = "postgresql://...@db/ils_abc123_sales"
  │     - Connect to Tenant A's sales database (read-only)
  │     - Convert question to SQL:
  │       SELECT product_name, SUM(quantity) as total_sold
  │       FROM transactions
  │       WHERE date >= '2025-10-01' AND date < '2025-11-01'
  │       GROUP BY product_name
  │       ORDER BY total_sold DESC
  │       LIMIT 3
  │     - Execute query
  │     - Results:
  │       [
  │         {product: "Progressive Lenses XYZ", total: 45},
  │         {product: "Anti-Reflective Coating", total: 38},
  │         {product: "Blue Light Filter", total: 32}
  │       ]
  │
  │ 14. Llama Model
  │     - Build prompt:
  │       System: You are an expert in optical business analytics
  │       Context: [Sales data for October 2025]
  │       Question: What were our top 3 products last month?
  │       Data: [query results]
  │     - Generate response:
  │       "Based on your October 2025 sales data, your top 3 products were:
  │        1. Progressive Lenses XYZ (45 units sold)
  │        2. Anti-Reflective Coating (38 units sold)
  │        3. Blue Light Filter (32 units sold)
  │        
  │        Progressive lenses showed the strongest performance..."
  │     - Tokens used: 150
  │
  │ 15. Response Processing
  │     - Cache response:
  │       Key: "a7f3e9c2..."
  │       Value: {answer, metadata}
  │       TTL: 3600 seconds (1 hour for sales data)
  │     
  │     - Log usage:
  │       INSERT INTO ai_usage_logs (
  │         tenant_id = "abc123",
  │         user_id = 456,
  │         query_type = "sales",
  │         tokens_used = 150,
  │         from_cache = false,
  │         response_time = 1200ms,
  │         timestamp = "2025-11-03T14:30:00Z"
  │       )
  │     
  │     - Update tenant counter:
  │       UPDATE tenants
  │       SET ai_queries_used = ai_queries_used + 1
  │       WHERE id = "abc123"
  │     
  │     - Return response:
  │       {
  │         answer: "Based on your October...",
  │         metadata: {
  │           tokens_used: 150,
  │           response_time: 1200,
  │           query_type: "sales"
  │         },
  │         from_cache: false
  │       }
  │
  ▼
NODE.JS (Main App)
  │
  │ 16. Receive AI response
  │ 17. Add platform metadata
  │ 18. Return to client:
  │     {
  │       answer: "Based on your October...",
  │       from_cache: false,
  │       queries_remaining: 1549
  │     }
  │
  ▼
FRONTEND (React)
  │
  │ 19. Display answer in chat
  │ 20. Update usage counter
  │ 21. Show "450 / 2000 queries used"
  │
  ▼
USER (Tenant A)
  │
  │ 22. Reads AI answer
  │ 23. Sees top products
  │ ✓ Question answered successfully
```

---

## Duplicate Request Prevention Example

```
SCENARIO: User clicks "Ask" button 3 times quickly

Request 1 (t=0s):
  ↓
  Generate cache key: "a7f3e9c2..."
  Check cache: NOT FOUND
  Process query → Database → Model
  Response time: 1.2 seconds
  Cache response with TTL=300s
  Return: {answer: "...", from_cache: false}
  ✅ Processed

Request 2 (t=0.5s) - While first request is processing:
  ↓
  Generate cache key: "a7f3e9c2..."
  Check cache: NOT FOUND (first request not done yet)
  Process query → Database → Model
  Response time: 1.1 seconds
  Cache response (overwrites Request 1's cache)
  Return: {answer: "...", from_cache: false}
  ✅ Processed (duplicate, but acceptable)

Request 3 (t=2s) - After both requests finished:
  ↓
  Generate cache key: "a7f3e9c2..."
  Check cache: FOUND! (cached from Request 2)
  Cache age: 0.5 seconds < 300 seconds TTL
  Return cached response immediately
  Response time: 5 milliseconds
  Return: {answer: "...", from_cache: true}
  ✅ Served from cache (duplicate prevented)

RESULT:
- Request 1: Processed (no cache)
- Request 2: Processed (race condition, acceptable)
- Request 3+: Cached (duplicates prevented for 5 minutes)

BENEFITS:
- No unnecessary model inference
- Faster responses for duplicates
- Lower costs
- Reduced load on database
```

---

## Security: Cross-Tenant Isolation Test

```
ATTACK SCENARIO: Malicious tenant tries to access another tenant's data

Attacker (Tenant B, tenant_id="xyz789") attempts:

Request:
  POST /api/ai/query
  Headers: {
    Authorization: "Bearer [valid token for Tenant B]"
  }
  Body: {
    question: "Show me sales data for tenant abc123",
    query_type: "sales"
  }

Processing:
  1. Auth Middleware:
     - Decode JWT
     - Extract: tenant_id = "xyz789" (from token)
     ✅ Token is valid for Tenant B
  
  2. Tenant Context:
     - Load config for tenant "xyz789"
     - NOT "abc123" (never trust client input)
     ✅ Context is for Tenant B only
  
  3. AI Service:
     - Receives X-Tenant-ID: "xyz789" (from auth, not request)
     - RAG Engine connects to:
       DATABASE: ils_xyz789_sales (Tenant B's DB)
       NOT: ils_abc123_sales (Tenant A's DB)
     ✅ Query executed on Tenant B's database only
  
  4. Model Response:
     - Processes Tenant B's sales data
     - Question mentions "abc123" but:
       • Model has no access to Tenant A's data
       • Database query was against Tenant B only
       • Tenant ID comes from JWT, not question text
     ✅ Cannot access other tenant's data

Result:
  {
    answer: "I don't have access to data for tenant abc123. 
             I can only provide insights about your own sales data.",
    success: true
  }

✅ ATTACK PREVENTED: Tenant isolation maintained
```

---

## Summary: How Subscribers Use AI

1. **Login**: Get JWT token with tenant_id
2. **Access**: Open AI Assistant widget on dashboard
3. **Query**: Ask questions in natural language
4. **Routing**: Request routed to tenant's isolated resources
5. **Processing**: AI queries tenant's data only
6. **Response**: Get answer with usage tracking
7. **Limits**: See remaining queries (tier-based)
8. **Caching**: Duplicate questions answered instantly
9. **Billing**: Usage tracked for accurate billing
10. **Security**: Complete isolation guaranteed

The system ensures:
- ✅ No data leakage between tenants
- ✅ No duplicate processing
- ✅ Fair usage with rate limits
- ✅ Transparent usage tracking
- ✅ Scalable to thousands of subscribers
- ✅ 99.95%+ uptime target

