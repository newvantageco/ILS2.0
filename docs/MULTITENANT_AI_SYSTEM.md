# Multi-Tenant AI System — Technical Documentation

**Version:** 1.0
**Last Updated:** November 2025
**Status:** Production

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [System Architecture](#3-system-architecture)
4. [Data Model](#4-data-model)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [AI Workflow](#6-ai-workflow)
7. [Multi-Tenant Isolation](#7-multi-tenant-isolation)
8. [Deployment](#8-deployment)
9. [Folder Structure](#9-folder-structure)
10. [Security](#10-security)
11. [Multi-Tenant Modes](#11-multi-tenant-modes)
12. [Testing Scenarios](#12-testing-scenarios)
13. [Performance & Scaling](#13-performance--scaling)
14. [Monitoring & Observability](#14-monitoring--observability)
15. [Best Practices](#15-best-practices)
16. [License](#16-license)

---

## 1. Overview

This document describes the architecture, workflows, and design principles of the ILS 2.0 multi-tenant AI SaaS system. The platform supports multiple customers (tenants) with strict data isolation, shared AI infrastructure, and tenant-specific customization.

### What is Multi-Tenant AI?

A **multi-tenant AI system** is a cloud-based architecture where:
- **Multiple customers (tenants)** share the same infrastructure and AI models
- **Data is strictly isolated** per tenant for security and compliance
- **AI models are shared** for cost efficiency and performance
- **Customization is per-tenant** through configuration, embeddings, and prompts

### Key Features

- 🏢 **Multi-Tenancy** - Complete data isolation per company
- 🤖 **Shared AI Models** - GPT-4, Claude, custom ML models
- 🔐 **Secure by Design** - JWT-based authentication with tenant claims
- 📊 **Tenant-Specific Context** - Custom embeddings, RAG, and prompts
- ⚡ **Scalable Architecture** - Horizontal scaling for growth
- 🎯 **Domain-Specific AI** - Ophthalmic/optical industry expertise

---

## 2. Architecture Principles

### 2.1 Multi-Tenancy with Strict Isolation

Every data entity is scoped to a `companyId` (tenant identifier):

```typescript
// All queries automatically filtered by companyId
const orders = await db.select()
  .from(ordersTable)
  .where(eq(ordersTable.companyId, req.user!.companyId));
```

**Benefits:**
- **Data Privacy** - No tenant can access another tenant's data
- **GDPR Compliance** - Clear data boundaries for privacy regulations
- **Cost Efficiency** - Shared infrastructure reduces per-tenant costs

### 2.2 Shared AI Models for Efficiency

Instead of deploying separate AI models per tenant, we use **shared models** with **tenant-specific context**:

```typescript
// Shared GPT-4 model
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: getTenantSystemPrompt(companyId) },
    { role: 'user', content: userQuery }
  ]
});
```

**Benefits:**
- **Cost Savings** - Single model deployment for all tenants
- **Performance** - Pre-warmed models with low latency
- **Maintenance** - Centralized model updates and improvements

### 2.3 Per-Tenant Configuration

Each tenant can customize AI behavior through:

1. **Custom System Prompts** - Tenant-specific instructions
2. **Knowledge Bases** - Tenant-specific documents and embeddings
3. **Fine-Tuned Models** - Optional tenant-specific model weights
4. **Feature Flags** - Enable/disable AI features per tenant

### 2.4 Secure Communication

All API requests include **JWT tokens with tenant claims**:

```typescript
// JWT payload structure
{
  "userId": "uuid",
  "companyId": "uuid",          // Tenant identifier
  "role": "ecp",
  "permissions": ["orders:read", "ai:chat"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

### 2.5 Scalable Storage and Compute

- **Database:** PostgreSQL with `companyId` partitioning
- **Compute:** Horizontal scaling of Node.js servers
- **AI Services:** Load-balanced Python FastAPI services
- **Caching:** Redis for tenant-specific cache layers

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React/Next.js)                    │
│                  JWT with tenant_id in token                 │
└─────────────────────────────────────────────────────────────┘
                              │
                        JWT Validation
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│         Express.js + Authentication + Rate Limiting          │
└─────────────────────────────────────────────────────────────┘
                              │
                    Tenant Router / Middleware
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────────────┬──────────────────┬──────────────────┐ │
│  │   Core Services  │   AI Services    │  Integration     │ │
│  │  - OrderService  │  - MasterAI      │  - ShopifyAPI    │ │
│  │  - PatientMgmt   │  - OphthalmicAI  │  - EmailService  │ │
│  │  - Prescription  │  - VisionAI      │  - PDFService    │ │
│  └──────────────────┴──────────────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌───────────────────────────┐   ┌──────────────────────────┐
│      Database Layer       │   │       AI Layer           │
├───────────────────────────┤   ├──────────────────────────┤
│   PostgreSQL (Neon)       │   │ Shared LLMs              │
│   ┌───────────────────┐   │   │ - OpenAI GPT-4           │
│   │ tenant_1_data     │   │   │ - Anthropic Claude       │
│   │ (companyId=uuid1) │   │   │ - GPT-4 Vision           │
│   ├───────────────────┤   │   │                          │
│   │ tenant_2_data     │   │   │ Tenant Embeddings        │
│   │ (companyId=uuid2) │   │   │ - Vector DB (pgvector)   │
│   ├───────────────────┤   │   │ - RAG Knowledge Base     │
│   │ tenant_3_data     │   │   │                          │
│   │ (companyId=uuid3) │   │   │ Configurable Prompts     │
│   └───────────────────┘   │   │ - System prompts         │
│                           │   │ - Context injection      │
└───────────────────────────┘   └──────────────────────────┘
```

### 3.2 Component Breakdown

#### Frontend (React/Vite)
- **Technology:** React 18.3, TypeScript 5.6, Vite
- **Authentication:** Session-based with JWT tokens
- **State Management:** TanStack Query for server state
- **UI Components:** shadcn/ui + Tailwind CSS

#### API Gateway (Express.js)
- **Authentication Middleware:** Validates JWT, extracts `companyId`
- **Authorization Middleware:** Role-based access control (RBAC)
- **Rate Limiting:** Per-tenant rate limits
- **Request Validation:** Zod schemas for type safety

#### Backend Services (Node.js)
- **Core Services:** Order management, patient records, inventory
- **AI Services:** MasterAI (general), OphthalmicAI (domain-specific), VisionAI (image analysis)
- **Integration Services:** Shopify, Stripe, Email (Resend), PDF generation

#### Database Layer (PostgreSQL)
- **ORM:** Drizzle ORM with TypeScript
- **Isolation:** All tables have `companyId` foreign key
- **Indexes:** Optimized queries with compound indexes on `(companyId, ...)`

#### AI Layer
- **LLM Providers:** OpenAI (GPT-4, GPT-4 Vision), Anthropic (Claude)
- **RAG System:** Python FastAPI service with embeddings
- **Vector Storage:** pgvector extension for PostgreSQL
- **Knowledge Base:** Tenant-specific document embeddings

---

## 4. Data Model

### 4.1 Core Entities

#### Companies (Tenants)
The root entity for multi-tenancy:

```typescript
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  domain: text('domain').unique(),

  // AI Configuration
  aiConfig: jsonb('ai_config').$type<{
    enabledModels: ('gpt4' | 'claude' | 'vision')[];
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    knowledgeBaseEnabled?: boolean;
  }>(),

  // Subscription
  subscriptionTier: text('subscription_tier').$type<'free' | 'pro' | 'premium' | 'enterprise'>(),
  subscriptionStatus: text('subscription_status').$type<'active' | 'trial' | 'suspended'>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### Users
User accounts scoped to a tenant:

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),

  // Authentication
  email: text('email').notNull(),
  passwordHash: text('password_hash'),

  // Profile
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role').$type<'platform_admin' | 'company_admin' | 'ecp' | 'lab_tech' | 'engineer'>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Unique email per company
  emailCompanyIdx: uniqueIndex('users_email_company_idx').on(table.email, table.companyId),
}));
```

#### AI Objects

**Embeddings** - Tenant-specific knowledge base:

```typescript
export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),

  // Embedding data
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI ada-002
  metadata: jsonb('metadata').$type<{
    source: string;
    documentId?: string;
    category?: string;
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
});
```

**AI Conversation Logs** - Audit trail for AI interactions:

```typescript
export const aiConversationLogs = pgTable('ai_conversation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  userId: uuid('user_id').notNull().references(() => users.id),

  // Conversation data
  conversationId: uuid('conversation_id').notNull(),
  role: text('role').$type<'user' | 'assistant' | 'system'>(),
  content: text('content').notNull(),
  model: text('model').$type<'gpt-4' | 'claude-3' | 'gpt-4-vision'>(),

  // Metadata
  tokensUsed: integer('tokens_used'),
  latencyMs: integer('latency_ms'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Fine-Tuned Models** (Optional) - Tenant-specific model weights:

```typescript
export const fineTunedModels = pgTable('fine_tuned_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),

  // Model information
  baseModel: text('base_model').notNull(), // e.g., 'gpt-4', 'claude-3'
  fineTunedModelId: text('fine_tuned_model_id').notNull(), // Provider's model ID
  purpose: text('purpose'), // e.g., 'prescription-validation'

  // Status
  status: text('status').$type<'training' | 'ready' | 'failed'>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  deployedAt: timestamp('deployed_at'),
});
```

### 4.2 Database Indexes for Performance

```sql
-- Companies
CREATE INDEX idx_companies_domain ON companies(domain);

-- Users
CREATE INDEX idx_users_company ON users(company_id);
CREATE UNIQUE INDEX idx_users_email_company ON users(email, company_id);

-- Embeddings
CREATE INDEX idx_embeddings_company ON embeddings(company_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- AI Logs
CREATE INDEX idx_ai_logs_company_created ON ai_conversation_logs(company_id, created_at DESC);
CREATE INDEX idx_ai_logs_conversation ON ai_conversation_logs(conversation_id);
```

---

## 5. Authentication & Authorization

### 5.1 JWT Token Structure

All API requests include a **JWT token** with tenant claims:

```typescript
interface JWTPayload {
  userId: string;          // Unique user identifier
  companyId: string;       // Tenant identifier (critical!)
  role: UserRole;          // User's role
  permissions: string[];   // Granular permissions
  iat: number;             // Issued at
  exp: number;             // Expiration
}

// Example JWT payload
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "role": "ecp",
  "permissions": ["orders:read", "orders:create", "ai:chat"],
  "iat": 1700000000,
  "exp": 1700086400
}
```

### 5.2 Authentication Middleware

```typescript
// server/middleware/auth.ts
import jwt from 'jsonwebtoken';

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.SESSION_SECRET!) as JWTPayload;

    // Attach user context to request
    req.user = {
      id: payload.userId,
      companyId: payload.companyId,  // Critical for tenant isolation!
      role: payload.role,
      permissions: payload.permissions,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 5.3 Tenant Isolation Middleware

```typescript
// Automatically inject companyId filter
export function requireTenantAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.companyId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }

  // All subsequent queries will use req.user.companyId
  next();
}

// Usage
app.get('/api/orders', authenticateUser, requireTenantAccess, async (req, res) => {
  // req.user.companyId is guaranteed to exist
  const orders = await storage.getOrdersByCompany(req.user!.companyId);
  res.json(orders);
});
```

### 5.4 Role-Based Access Control (RBAC)

```typescript
export const ROLE_PERMISSIONS = {
  platform_admin: ['*'], // All permissions
  company_admin: ['users:*', 'company:*', 'ai:*'],
  ecp: ['orders:create', 'orders:read', 'patients:*', 'ai:chat'],
  lab_tech: ['orders:read', 'orders:update', 'production:*'],
  engineer: ['production:*', 'technical:*'],
};

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];

    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Usage
app.post('/api/ai/chat',
  authenticateUser,
  requirePermission('ai:chat'),
  async (req, res) => {
    // User has permission to use AI chat
  }
);
```

---

## 6. AI Workflow

### 6.1 End-to-End AI Request Flow

```
┌──────────────┐
│ User sends   │
│ AI query     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 1. Authentication & Authorization    │
│    - Validate JWT token              │
│    - Extract companyId from token    │
│    - Check AI feature permissions    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 2. Load Tenant Context               │
│    - Fetch company AI config         │
│    - Get custom system prompt        │
│    - Load feature flags              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 3. Retrieve Tenant Knowledge (RAG)   │
│    - Generate query embedding        │
│    - Search tenant's vector DB       │
│    - Retrieve top-k relevant docs    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 4. Construct LLM Prompt              │
│    - System: tenant custom prompt    │
│    - Context: RAG results            │
│    - History: conversation context   │
│    - User: current query             │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 5. Call Shared AI Model              │
│    - Route to GPT-4 / Claude         │
│    - Apply tenant config (temp, etc) │
│    - Stream response                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 6. Post-Process & Log                │
│    - Filter sensitive data           │
│    - Log conversation (audit trail)  │
│    - Update usage metrics            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Return to    │
│ user (UI)    │
└──────────────┘
```

### 6.2 Implementation Example

```typescript
// server/routes/aiIntelligence.ts
app.post('/api/master-ai/chat', authenticateUser, asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;
  const { companyId, userId } = req.user!;

  // 1. Load tenant context
  const company = await storage.getCompanyById(companyId);
  const aiConfig = company.aiConfig || {};

  // 2. Retrieve tenant knowledge (RAG)
  let context = '';
  if (aiConfig.knowledgeBaseEnabled) {
    const embedding = await generateEmbedding(message);
    const relevantDocs = await storage.searchEmbeddings(companyId, embedding, { limit: 5 });
    context = relevantDocs.map(doc => doc.content).join('\n\n');
  }

  // 3. Construct prompt
  const systemPrompt = aiConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(context ? [{ role: 'system', content: `Knowledge Base:\n${context}` }] : []),
    { role: 'user', content: message }
  ];

  // 4. Call shared AI model
  const startTime = Date.now();
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature: aiConfig.temperature || 0.7,
    max_tokens: aiConfig.maxTokens || 500,
    stream: true,
  });

  // 5. Stream response
  res.setHeader('Content-Type', 'text/event-stream');
  let fullResponse = '';

  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullResponse += content;
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }

  // 6. Log conversation
  const latencyMs = Date.now() - startTime;
  await storage.createAILog({
    companyId,
    userId,
    conversationId: conversationId || randomUUID(),
    role: 'user',
    content: message,
    model: 'gpt-4',
    latencyMs,
  });

  await storage.createAILog({
    companyId,
    userId,
    conversationId: conversationId || randomUUID(),
    role: 'assistant',
    content: fullResponse,
    model: 'gpt-4',
    tokensUsed: fullResponse.split(' ').length, // Approximate
  });

  res.write('data: [DONE]\n\n');
  res.end();
}));
```

### 6.3 Tenant-Specific Memory and Embeddings

```typescript
// Generate embeddings for tenant knowledge base
export async function ingestTenantDocument(
  companyId: string,
  document: { content: string; metadata: any }
) {
  // Generate embedding using OpenAI
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: document.content,
  });

  const embedding = embeddingResponse.data[0].embedding;

  // Store in tenant's knowledge base
  await storage.createEmbedding({
    companyId,
    content: document.content,
    embedding,
    metadata: document.metadata,
  });
}

// Search tenant's knowledge base
export async function searchTenantKnowledge(
  companyId: string,
  query: string,
  options: { limit?: number } = {}
) {
  // Generate query embedding
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });

  const embedding = queryEmbedding.data[0].embedding;

  // Search using vector similarity (cosine)
  const results = await db.select()
    .from(embeddingsTable)
    .where(eq(embeddingsTable.companyId, companyId))
    .orderBy(sql`embedding <=> ${embedding}`)
    .limit(options.limit || 5);

  return results;
}
```

---

## 7. Multi-Tenant Isolation

### 7.1 Database-Level Isolation

**Row-Level Security (Conceptual):**

```sql
-- All queries automatically filtered by companyId
SELECT * FROM orders WHERE company_id = '<current-tenant>';
SELECT * FROM patients WHERE company_id = '<current-tenant>';
SELECT * FROM embeddings WHERE company_id = '<current-tenant>';
```

**Implementation in ORM:**

```typescript
// ✅ Correct - Always filter by companyId
export class DbStorage {
  async getOrdersByCompany(companyId: string) {
    return this.db.select()
      .from(ordersTable)
      .where(eq(ordersTable.companyId, companyId));
  }

  async getPatientsByCompany(companyId: string) {
    return this.db.select()
      .from(patientsTable)
      .where(eq(patientsTable.companyId, companyId));
  }
}

// ❌ NEVER do this - bypasses tenant isolation!
async getAllOrders() {
  return this.db.select().from(ordersTable); // Would return all tenants' data!
}
```

### 7.2 Application-Level Isolation

**Middleware Enforcement:**

```typescript
// Global middleware to enforce tenant context
app.use((req, res, next) => {
  if (req.user && !req.user.companyId) {
    return res.status(500).json({ error: 'Server error: missing tenant context' });
  }
  next();
});
```

**Storage Layer Enforcement:**

```typescript
export class DbStorage {
  // All methods require companyId
  async createOrder(companyId: string, data: OrderInput) {
    return this.db.insert(ordersTable).values({
      ...data,
      companyId, // Always set
    }).returning();
  }

  async updateOrder(companyId: string, orderId: string, data: Partial<OrderInput>) {
    // Ensure update only affects tenant's data
    return this.db.update(ordersTable)
      .set(data)
      .where(
        and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.companyId, companyId) // Critical!
        )
      );
  }
}
```

### 7.3 AI-Specific Isolation

**Embedding Isolation:**

```typescript
// Only search tenant's embeddings
async function searchEmbeddings(companyId: string, embedding: number[], limit: number) {
  return db.select()
    .from(embeddingsTable)
    .where(eq(embeddingsTable.companyId, companyId)) // Tenant filter
    .orderBy(sql`embedding <=> ${embedding}`)
    .limit(limit);
}
```

**Conversation Isolation:**

```typescript
// Only load tenant's conversation history
async function getConversationHistory(companyId: string, conversationId: string) {
  return db.select()
    .from(aiConversationLogsTable)
    .where(
      and(
        eq(aiConversationLogsTable.companyId, companyId),
        eq(aiConversationLogsTable.conversationId, conversationId)
      )
    )
    .orderBy(aiConversationLogsTable.createdAt);
}
```

### 7.4 Per-Tenant Logs and Audit Trails

```typescript
// All AI interactions logged per tenant
async function logAIInteraction(data: {
  companyId: string;
  userId: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
  tokensUsed?: number;
  latencyMs?: number;
}) {
  return db.insert(aiConversationLogsTable).values({
    ...data,
    createdAt: new Date(),
  });
}

// Query logs per tenant
async function getAIUsageStats(companyId: string, dateRange: { start: Date; end: Date }) {
  return db.select({
    totalConversations: sql<number>`COUNT(DISTINCT conversation_id)`,
    totalTokens: sql<number>`SUM(tokens_used)`,
    avgLatency: sql<number>`AVG(latency_ms)`,
  })
  .from(aiConversationLogsTable)
  .where(
    and(
      eq(aiConversationLogsTable.companyId, companyId),
      gte(aiConversationLogsTable.createdAt, dateRange.start),
      lte(aiConversationLogsTable.createdAt, dateRange.end)
    )
  );
}
```

### 7.5 GDPR-Compliant Design

**Data Export:**

```typescript
// Export all tenant data (GDPR Article 15)
async function exportTenantData(companyId: string) {
  const [
    users,
    patients,
    orders,
    aiLogs,
    embeddings
  ] = await Promise.all([
    storage.getUsersByCompany(companyId),
    storage.getPatientsByCompany(companyId),
    storage.getOrdersByCompany(companyId),
    storage.getAILogsByCompany(companyId),
    storage.getEmbeddingsByCompany(companyId),
  ]);

  return {
    companyId,
    exportedAt: new Date().toISOString(),
    users,
    patients,
    orders,
    aiLogs,
    embeddings,
  };
}
```

**Data Deletion:**

```typescript
// Delete all tenant data (GDPR Article 17 - Right to be Forgotten)
async function deleteTenantData(companyId: string) {
  await db.transaction(async (tx) => {
    // Delete in order respecting foreign key constraints
    await tx.delete(aiConversationLogsTable).where(eq(aiConversationLogsTable.companyId, companyId));
    await tx.delete(embeddingsTable).where(eq(embeddingsTable.companyId, companyId));
    await tx.delete(ordersTable).where(eq(ordersTable.companyId, companyId));
    await tx.delete(patientsTable).where(eq(patientsTable.companyId, companyId));
    await tx.delete(usersTable).where(eq(usersTable.companyId, companyId));
    await tx.delete(companiesTable).where(eq(companiesTable.id, companyId));
  });
}
```

---

## 8. Deployment

### 8.1 Supported Platforms

The multi-tenant AI system can be deployed on:

1. **Railway** (Recommended) - Fully managed platform
2. **AWS** - ECS, Lambda, RDS, S3
3. **Google Cloud Platform** - Cloud Run, Cloud SQL
4. **Kubernetes** - Self-managed orchestration
5. **Docker** - Container-based deployment

### 8.2 Railway Deployment (Recommended)

**Services:**

```yaml
# railway.toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm run start"
  healthcheckPath = "/api/health"
  restartPolicyType = "ON_FAILURE"

[[services]]
  name = "web"
  type = "web"

[[services]]
  name = "postgres"
  type = "database"
  provider = "postgresql"

[[services]]
  name = "redis"
  type = "database"
  provider = "redis"
```

**Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://...

# Session & Auth
SESSION_SECRET=<random-256-bit-string>

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Redis (optional)
REDIS_URL=redis://...

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_RAG_SYSTEM=true
```

**Deployment Steps:**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link project
railway link

# 4. Deploy
railway up
```

### 8.3 AWS Deployment

**Architecture:**

```
┌─────────────────────────────────────────┐
│         Application Load Balancer        │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│   ECS Task 1  │   │   ECS Task 2  │
│  (Node.js)    │   │  (Node.js)    │
└───────┬───────┘   └───────┬───────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌─────────────────┐
        │   RDS Postgres  │
        │   (Multi-AZ)    │
        └─────────────────┘
                  │
        ┌─────────────────┐
        │  ElastiCache    │
        │  (Redis)        │
        └─────────────────┘
```

**Infrastructure as Code (Terraform):**

```hcl
# main.tf
resource "aws_ecs_cluster" "ils_cluster" {
  name = "ils-multi-tenant-ai"
}

resource "aws_ecs_service" "web" {
  name            = "ils-web"
  cluster         = aws_ecs_cluster.ils_cluster.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "app"
    container_port   = 5000
  }
}

resource "aws_db_instance" "postgres" {
  identifier        = "ils-postgres"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  multi_az = true
  backup_retention_period = 30
}
```

### 8.4 Kubernetes Deployment

**Deployment Manifest:**

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ils-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ils-web
  template:
    metadata:
      labels:
        app: ils-web
    spec:
      containers:
      - name: web
        image: ils/web:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ils-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ils-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### 8.5 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ils
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis

  db:
    image: pgvector/pgvector:pg15
    environment:
      - POSTGRES_DB=ils
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 9. Folder Structure

```
/src
  /api                       # API endpoint handlers
    /ai
      masterAI.ts            # General AI assistant
      ophthalmicAI.ts        # Domain-specific AI
      visionAI.ts            # Image analysis
    /orders
      index.ts               # Order management
    /patients
      index.ts               # Patient records
    /companies
      index.ts               # Tenant management

  /middleware                # Express middleware
    auth.ts                  # JWT authentication
    tenantIsolation.ts       # Enforce companyId filtering
    validation.ts            # Zod request validation
    rateLimit.ts             # Per-tenant rate limiting
    errorHandler.ts          # Global error handling

  /services                  # Business logic services
    /ai
      RAGService.ts          # Retrieval-Augmented Generation
      EmbeddingService.ts    # Vector embeddings
      LLMService.ts          # LLM provider abstraction
    /email
      EmailService.ts        # Transactional emails
    /pdf
      PDFService.ts          # PDF generation

  /db                        # Database layer
    index.ts                 # Database connection
    schema.ts                # Drizzle schema definitions
    storage.ts               # Data access layer (DbStorage class)

  /config                    # Configuration
    ai.ts                    # AI model configs
    database.ts              # Database config
    redis.ts                 # Redis config
```

### 9.1 Key Files

**`server/middleware/auth.ts`** - Authentication

```typescript
export function authenticateUser(req, res, next) {
  // Validate JWT, extract companyId
}
```

**`server/middleware/tenantIsolation.ts`** - Tenant Isolation

```typescript
export function requireTenantAccess(req, res, next) {
  // Ensure companyId exists in request context
}
```

**`server/services/ai/RAGService.ts`** - RAG System

```typescript
export class RAGService {
  async searchKnowledge(companyId: string, query: string) {
    // Generate embedding, search vector DB
  }
}
```

**`server/db/storage.ts`** - Data Access Layer

```typescript
export class DbStorage {
  async getOrdersByCompany(companyId: string) { }
  async getEmbeddingsByCompany(companyId: string) { }
  async createAILog(data: AILogInput) { }
}
```

---

## 10. Security

### 10.1 Schema-Level Separation

**Foreign Key Constraints:**

```sql
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_company
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

ALTER TABLE embeddings
  ADD CONSTRAINT fk_embeddings_company
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;
```

**Unique Constraints:**

```sql
-- Email unique per company (not globally)
CREATE UNIQUE INDEX idx_users_email_company ON users(email, company_id);

-- Customer number unique per company
CREATE UNIQUE INDEX idx_patients_customer_number_company ON patients(customer_number, company_id);
```

### 10.2 Per-Tenant Logs

All actions logged with `companyId`:

```typescript
async function logAction(data: {
  companyId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
}) {
  await db.insert(auditLogsTable).values({
    ...data,
    timestamp: new Date(),
  });
}

// Usage
await logAction({
  companyId: req.user!.companyId,
  userId: req.user!.id,
  action: 'CREATE',
  resourceType: 'ORDER',
  resourceId: newOrder.id,
});
```

### 10.3 API Rate Limiting (Per-Tenant)

```typescript
import rateLimit from 'express-rate-limit';

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    const company = req.user?.company;
    // Different limits per subscription tier
    if (company?.subscriptionTier === 'enterprise') return 100;
    if (company?.subscriptionTier === 'premium') return 50;
    if (company?.subscriptionTier === 'pro') return 20;
    return 10; // Free tier
  },
  keyGenerator: (req) => req.user!.companyId, // Rate limit per tenant
  message: 'Too many AI requests, please try again later',
});

app.post('/api/master-ai/chat', authenticateUser, aiRateLimiter, async (req, res) => {
  // Handle AI chat
});
```

### 10.4 Input Sanitization

```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Validation schema
const aiChatSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long')
    .transform((val) => DOMPurify.sanitize(val)), // Sanitize HTML
  conversationId: z.string().uuid().optional(),
});

// Middleware
function validateRequest(schema: z.ZodSchema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
  };
}

// Usage
app.post('/api/master-ai/chat',
  authenticateUser,
  validateRequest(aiChatSchema),
  async (req, res) => {
    // req.body is validated and sanitized
  }
);
```

### 10.5 Secrets Management

**Environment Variables (Development):**

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
SESSION_SECRET=...
```

**Secrets Manager (Production):**

```typescript
// AWS Secrets Manager
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });

async function getSecret(secretName: string) {
  const response = await client.getSecretValue({ SecretId: secretName });
  return JSON.parse(response.SecretString!);
}

// Load secrets at startup
const secrets = await getSecret('ils/production');
process.env.OPENAI_API_KEY = secrets.OPENAI_API_KEY;
```

---

## 11. Multi-Tenant Modes

### 11.1 Mode 1: Shared Everything

**Architecture:**
- **Shared Database** - All tenants in one database
- **Shared AI Models** - All tenants use same LLM instances
- **Shared Infrastructure** - Single deployment

**Pros:**
- ✅ Most cost-efficient
- ✅ Easiest to maintain
- ✅ Best resource utilization

**Cons:**
- ❌ "Noisy neighbor" risk
- ❌ Limited customization
- ❌ Regulatory challenges for some industries

**Best For:** Startups, SMBs, SaaS with many small tenants

### 11.2 Mode 2: Shared AI + Isolated Data (ILS 2.0 Default)

**Architecture:**
- **Isolated Data** - Per-tenant schemas or row-level security
- **Shared AI Models** - All tenants use same LLM instances
- **Tenant-Specific Context** - Custom embeddings, prompts

**Pros:**
- ✅ Strong data isolation
- ✅ Cost-efficient AI infrastructure
- ✅ Tenant customization via RAG
- ✅ Compliance-friendly (GDPR, HIPAA)

**Cons:**
- ⚠️ Slightly more complex than Mode 1
- ⚠️ Requires careful companyId filtering

**Best For:** Healthcare SaaS, regulated industries, mid-market customers

**Implementation:**

```typescript
// Isolated data per tenant
const orders = await db.select()
  .from(ordersTable)
  .where(eq(ordersTable.companyId, companyId)); // Data isolation

// Shared AI model
const response = await openai.chat.completions.create({
  model: 'gpt-4', // Shared
  messages: [
    { role: 'system', content: getTenantSystemPrompt(companyId) }, // Tenant-specific
    { role: 'user', content: userQuery }
  ]
});
```

### 11.3 Mode 3: Fully Dedicated Per Tenant

**Architecture:**
- **Dedicated Database** - Each tenant has own database instance
- **Dedicated AI Deployment** - Each tenant has own LLM deployment
- **Dedicated Infrastructure** - Fully isolated stacks

**Pros:**
- ✅ Maximum isolation
- ✅ Custom scaling per tenant
- ✅ Regulatory compliance (HIPAA, GDPR, SOC2)
- ✅ Custom SLAs per tenant

**Cons:**
- ❌ Highest cost
- ❌ Complex to maintain
- ❌ Slower to onboard new tenants

**Best For:** Enterprise customers, regulated data, government contracts

**Implementation:**

```typescript
// Tenant-specific database connection
function getTenantDatabase(companyId: string) {
  const dbUrl = process.env[`DATABASE_URL_${companyId}`];
  return drizzle(postgres(dbUrl));
}

// Tenant-specific AI deployment
function getTenantLLM(companyId: string) {
  const apiKey = process.env[`OPENAI_API_KEY_${companyId}`];
  return new OpenAI({ apiKey });
}
```

---

## 12. Testing Scenarios

### 12.1 Cross-Tenant Isolation Tests

**Test:** Verify tenant A cannot access tenant B's data

```typescript
// test/integration/tenantIsolation.test.ts
describe('Tenant Isolation', () => {
  it('should not allow tenant A to access tenant B orders', async () => {
    // Create order for tenant A
    const orderA = await storage.createOrder(tenantA.id, { ... });

    // Attempt to fetch as tenant B
    const result = await storage.getOrdersByCompany(tenantB.id);

    // Should not include tenant A's order
    expect(result).not.toContainEqual(expect.objectContaining({ id: orderA.id }));
  });

  it('should not allow tenant A to access tenant B embeddings', async () => {
    // Create embedding for tenant B
    await storage.createEmbedding(tenantB.id, { content: 'secret data', ... });

    // Search as tenant A
    const results = await storage.searchEmbeddings(tenantA.id, queryEmbedding, { limit: 10 });

    // Should not return tenant B's embeddings
    results.forEach(result => {
      expect(result.companyId).toBe(tenantA.id);
    });
  });
});
```

### 12.2 Role-Based Access Tests

**Test:** Verify users can only perform actions allowed by their role

```typescript
describe('Role-Based Access Control', () => {
  it('should allow ECP to create orders', async () => {
    const req = createMockRequest({ user: { role: 'ecp', companyId: tenant.id } });
    const res = createMockResponse();

    await createOrderHandler(req, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it('should not allow lab_tech to delete orders', async () => {
    const req = createMockRequest({ user: { role: 'lab_tech', companyId: tenant.id } });
    const res = createMockResponse();

    await deleteOrderHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
  });

  it('should allow platform_admin to access all tenants', async () => {
    const req = createMockRequest({ user: { role: 'platform_admin' } });
    const res = createMockResponse();

    await getAllTenantsHandler(req, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
  });
});
```

### 12.3 AI Retrieval Accuracy Tests

**Test:** Verify RAG system returns relevant, tenant-scoped results

```typescript
describe('AI Retrieval Accuracy', () => {
  beforeAll(async () => {
    // Populate tenant A's knowledge base
    await storage.createEmbedding(tenantA.id, {
      content: 'Tenant A uses progressive lenses for presbyopia patients',
      embedding: await generateEmbedding('progressive lenses'),
    });

    // Populate tenant B's knowledge base
    await storage.createEmbedding(tenantB.id, {
      content: 'Tenant B specializes in orthokeratology',
      embedding: await generateEmbedding('orthokeratology'),
    });
  });

  it('should only retrieve tenant A knowledge for tenant A queries', async () => {
    const query = 'What lenses do we use for presbyopia?';
    const embedding = await generateEmbedding(query);

    const results = await storage.searchEmbeddings(tenantA.id, embedding, { limit: 5 });

    // Should return tenant A's knowledge
    expect(results).toContainEqual(
      expect.objectContaining({ content: expect.stringContaining('progressive lenses') })
    );

    // Should not return tenant B's knowledge
    expect(results).not.toContainEqual(
      expect.objectContaining({ content: expect.stringContaining('orthokeratology') })
    );
  });

  it('should return semantically similar results', async () => {
    const query = 'Tell me about nighttime contact lenses';
    const embedding = await generateEmbedding(query);

    const results = await storage.searchEmbeddings(tenantB.id, embedding, { limit: 1 });

    // Should return orthokeratology (semantic match)
    expect(results[0].content).toContain('orthokeratology');
  });
});
```

### 12.4 Load Testing

**Test:** Verify system handles concurrent multi-tenant load

```typescript
// test/load/multiTenant.load.test.ts
import autocannon from 'autocannon';

describe('Multi-Tenant Load Tests', () => {
  it('should handle 100 concurrent AI requests across 10 tenants', async () => {
    const result = await autocannon({
      url: 'http://localhost:5000/api/master-ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <tenant-jwt>',
      },
      body: JSON.stringify({
        message: 'What are the best lenses for astigmatism?',
      }),
      connections: 100,
      duration: 30,
    });

    // Assertions
    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.latency.p95).toBeLessThan(2000); // 95th percentile < 2s
    expect(result.requests.average).toBeGreaterThan(50); // > 50 req/s
  });
});
```

---

## 13. Performance & Scaling

### 13.1 Database Optimization

**Indexes for Multi-Tenant Queries:**

```sql
-- Compound indexes with companyId first
CREATE INDEX idx_orders_company_status ON orders(company_id, status);
CREATE INDEX idx_orders_company_created ON orders(company_id, created_at DESC);
CREATE INDEX idx_patients_company_name ON patients(company_id, name);
CREATE INDEX idx_embeddings_company_created ON embeddings(company_id, created_at DESC);

-- Vector index for similarity search
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Query Optimization:**

```typescript
// ✅ Efficient - Compound index (company_id, created_at)
const recentOrders = await db.select()
  .from(ordersTable)
  .where(eq(ordersTable.companyId, companyId))
  .orderBy(desc(ordersTable.createdAt))
  .limit(50);

// ✅ Efficient - Select only needed columns
const orderSummaries = await db.select({
  id: ordersTable.id,
  orderNumber: ordersTable.orderNumber,
  status: ordersTable.status,
})
.from(ordersTable)
.where(eq(ordersTable.companyId, companyId));

// ❌ Inefficient - No companyId filter
const allOrders = await db.select().from(ordersTable); // NEVER DO THIS!
```

### 13.2 Caching Strategy

**Multi-Tenant Redis Caching:**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache key pattern: {tenant}:{resource}:{id}
async function getCachedData<T>(
  companyId: string,
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cacheKey = `${companyId}:${key}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch and cache
  const data = await fetchFn();
  await redis.setex(cacheKey, ttl, JSON.stringify(data));

  return data;
}

// Usage
const companySettings = await getCachedData(
  companyId,
  'company:settings',
  () => storage.getCompanyById(companyId),
  3600 // 1 hour
);
```

**Cache Invalidation:**

```typescript
// Invalidate cache on data changes
async function updateOrder(companyId: string, orderId: string, data: any) {
  await storage.updateOrder(companyId, orderId, data);

  // Invalidate related caches
  await redis.del(`${companyId}:order:${orderId}`);
  await redis.del(`${companyId}:orders:list`);
}
```

### 13.3 Horizontal Scaling

**Load Balancing:**

```nginx
# nginx.conf
upstream ils_backend {
  least_conn; # Least connections algorithm

  server web1.ils.internal:5000;
  server web2.ils.internal:5000;
  server web3.ils.internal:5000;
}

server {
  listen 80;
  server_name api.ils.com;

  location /api/ {
    proxy_pass http://ils_backend;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

**Stateless Application Servers:**

```typescript
// Store sessions in Redis (not in-memory)
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
```

### 13.4 AI Model Optimization

**Response Streaming:**

```typescript
// Stream LLM responses for faster perceived latency
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  stream: true, // Enable streaming
});

res.setHeader('Content-Type', 'text/event-stream');

for await (const chunk of response) {
  const content = chunk.choices[0]?.delta?.content || '';
  res.write(`data: ${JSON.stringify({ content })}\n\n`);
}

res.write('data: [DONE]\n\n');
res.end();
```

**Embedding Caching:**

```typescript
// Cache embeddings to reduce API calls
async function getCachedEmbedding(text: string): Promise<number[]> {
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  const cacheKey = `embedding:${hash}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });

  const embedding = response.data[0].embedding;
  await redis.setex(cacheKey, 86400, JSON.stringify(embedding)); // 24 hours

  return embedding;
}
```

---

## 14. Monitoring & Observability

### 14.1 Metrics Collection

**Per-Tenant Metrics:**

```typescript
import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

// AI request counter (per tenant)
const aiRequestsCounter = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['company_id', 'model', 'status'],
  registers: [register],
});

// AI latency histogram
const aiLatencyHistogram = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'AI request duration in seconds',
  labelNames: ['company_id', 'model'],
  registers: [register],
});

// Usage
const startTime = Date.now();
try {
  const response = await callAIModel(model, messages);
  const duration = (Date.now() - startTime) / 1000;

  aiLatencyHistogram.labels(companyId, model).observe(duration);
  aiRequestsCounter.labels(companyId, model, 'success').inc();
} catch (error) {
  aiRequestsCounter.labels(companyId, model, 'error').inc();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 14.2 Logging

**Structured Logging with Tenant Context:**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' }),
  ],
});

// Log with tenant context
logger.info('AI request', {
  companyId,
  userId,
  model: 'gpt-4',
  tokensUsed: 234,
  latencyMs: 1245,
});

// Error logging
logger.error('AI request failed', {
  companyId,
  userId,
  model: 'gpt-4',
  error: error.message,
  stack: error.stack,
});
```

### 14.3 Health Checks

```typescript
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      aiServices: await checkAIServices(),
    },
  };

  const isHealthy = Object.values(health.checks).every(check => check.status === 'up');
  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase() {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
}

async function checkAIServices() {
  try {
    await openai.models.list();
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
}
```

### 14.4 Alerts

**Alerting Rules (Prometheus):**

```yaml
# prometheus/alerts.yml
groups:
- name: multi_tenant_ai
  rules:
  - alert: HighAIErrorRate
    expr: rate(ai_requests_total{status="error"}[5m]) > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High AI error rate for tenant {{ $labels.company_id }}"
      description: "Error rate is {{ $value }} errors/sec"

  - alert: SlowAIResponses
    expr: histogram_quantile(0.95, ai_request_duration_seconds_bucket) > 5
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Slow AI responses for tenant {{ $labels.company_id }}"
      description: "95th percentile latency is {{ $value }}s"
```

---

## 15. Best Practices

### 15.1 Always Filter by `companyId`

```typescript
// ✅ GOOD - Explicit tenant filtering
async function getOrders(companyId: string) {
  return db.select()
    .from(ordersTable)
    .where(eq(ordersTable.companyId, companyId));
}

// ❌ BAD - Missing tenant filtering
async function getAllOrders() {
  return db.select().from(ordersTable); // SECURITY RISK!
}
```

### 15.2 Validate JWT `companyId` on Every Request

```typescript
// ✅ GOOD - Middleware validates companyId
app.use('/api', authenticateUser, requireTenantAccess);

// ❌ BAD - Trusting client-provided companyId
app.post('/api/orders', async (req, res) => {
  const { companyId } = req.body; // NEVER DO THIS!
  // Attacker could set any companyId
});
```

### 15.3 Use Prepared Statements / Parameterized Queries

```typescript
// ✅ GOOD - Drizzle ORM with parameters
const orders = await db.select()
  .from(ordersTable)
  .where(
    and(
      eq(ordersTable.companyId, companyId),
      eq(ordersTable.status, status)
    )
  );

// ❌ BAD - String interpolation (SQL injection risk)
const orders = await db.execute(
  sql`SELECT * FROM orders WHERE company_id = '${companyId}'` // VULNERABLE!
);
```

### 15.4 Implement Rate Limiting Per Tenant

```typescript
// ✅ GOOD - Tenant-specific rate limits
const limiter = rateLimit({
  keyGenerator: (req) => req.user!.companyId,
  max: (req) => getTenantRateLimit(req.user!.companyId),
});

// ❌ BAD - Global rate limit (affects all tenants equally)
const limiter = rateLimit({ max: 100 });
```

### 15.5 Log All AI Interactions for Audit

```typescript
// ✅ GOOD - Comprehensive logging
await storage.createAILog({
  companyId,
  userId,
  conversationId,
  role: 'assistant',
  content: response,
  model: 'gpt-4',
  tokensUsed,
  latencyMs,
});

// ❌ BAD - No logging (compliance risk)
// Just return response without logging
```

### 15.6 Use Transactions for Multi-Table Operations

```typescript
// ✅ GOOD - Atomic transaction
await db.transaction(async (tx) => {
  const order = await tx.insert(ordersTable).values({ ... }).returning();
  await tx.insert(orderTimelineTable).values({ orderId: order.id, ... });
  await tx.insert(auditLogsTable).values({ resourceId: order.id, ... });
});

// ❌ BAD - Separate operations (can leave inconsistent state)
const order = await db.insert(ordersTable).values({ ... }).returning();
await db.insert(orderTimelineTable).values({ orderId: order.id, ... }); // May fail
```

### 15.7 Implement Graceful Degradation

```typescript
// ✅ GOOD - Fallback when AI unavailable
try {
  const response = await openai.chat.completions.create({ ... });
  return response;
} catch (error) {
  logger.error('OpenAI unavailable', { error });

  // Fallback to simpler logic
  return {
    content: 'AI service temporarily unavailable. Please try again later.',
    fallback: true,
  };
}

// ❌ BAD - Hard failure
const response = await openai.chat.completions.create({ ... }); // Crashes if API down
```

---

## 16. License

**Proprietary and Confidential**
Copyright © 2025 New Vantage Co. All rights reserved.

This software and associated documentation are proprietary to New Vantage Co and protected by copyright law. Unauthorized reproduction or distribution is prohibited.

For commercial licensing inquiries, contact: support@newvantageco.com

---

## Appendix A: Glossary

- **Multi-Tenancy:** Architecture where multiple customers (tenants) share infrastructure
- **RAG (Retrieval-Augmented Generation):** AI technique that retrieves context before generation
- **LLM (Large Language Model):** AI models like GPT-4, Claude
- **Embeddings:** Vector representations of text for semantic search
- **Vector Database:** Database optimized for similarity search (e.g., pgvector)
- **JWT (JSON Web Token):** Stateless authentication token
- **RBAC (Role-Based Access Control):** Permission system based on user roles
- **ORM (Object-Relational Mapping):** Database abstraction layer (e.g., Drizzle)

## Appendix B: Resources

- **[ILS 2.0 Architecture](./ARCHITECTURE.md)** - System architecture overview
- **[Database Schema](./DATABASE.md)** - Complete database documentation
- **[API Reference](../API_QUICK_REFERENCE.md)** - API endpoint documentation
- **[Testing Guide](./TESTING.md)** - Test documentation
- **[Railway Deployment](./RAILWAY_DEPLOYMENT.md)** - Deployment guide

---

**Document Version:** 1.0
**Last Updated:** November 25, 2025
**Maintained By:** New Vantage Co Engineering Team
