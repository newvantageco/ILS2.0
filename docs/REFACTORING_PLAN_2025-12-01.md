# ILS 2.0 Complete Refactoring Plan

## From Technical Debt to Production-Ready

**Created:** December 1, 2025
**Target Completion:** 8-12 weeks
**Priority:** Launch-blocking issues first

---

## Table of Contents

1. [Phase 1: Multi-Tenant Security (Week 1-3)](#phase-1-multi-tenant-security)
2. [Phase 2: AI Service Consolidation (Week 3-6)](#phase-2-ai-service-consolidation)
3. [Phase 3: Storage Decomposition (Week 5-7)](#phase-3-storage-decomposition)
4. [Phase 4: Route Organization (Week 7-8)](#phase-4-route-organization)
5. [Phase 5: Database Optimization (Week 8-9)](#phase-5-database-optimization)
6. [Phase 6: Dependency Cleanup (Week 9-10)](#phase-6-dependency-cleanup)
7. [Phase 7: Schema Modularization (Week 10-11)](#phase-7-schema-modularization)
8. [Phase 8: Hardening & Polish (Week 11-12)](#phase-8-hardening--polish)

---

## Phase 1: Multi-Tenant Security

**Timeline:** Week 1-3
**Risk Level:** CRITICAL
**Goal:** Eliminate all data leakage vectors

### Problem

```typescript
// Current: Mix of tenant-aware and internal methods
getUserById_Internal(id: string): Promise<User | undefined>;  // NO TENANT CHECK
getUser(id: string, companyId: string): Promise<User | undefined>;  // Has tenant check
```

### Solution: Database-Level Row Level Security (RLS)

#### Step 1.1: Add Tenant Context to All Tables

```sql
-- Migration: Add company_id to all tables that need tenant isolation
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id);
-- ... repeat for all tenant-scoped tables

-- Create indexes for performance
CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_patients_company ON patients(company_id);
```

#### Step 1.2: Enable PostgreSQL RLS

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy that checks current tenant
CREATE POLICY tenant_isolation_orders ON orders
  USING (company_id = current_setting('app.current_tenant')::varchar);

CREATE POLICY tenant_isolation_patients ON patients
  USING (company_id = current_setting('app.current_tenant')::varchar);
```

#### Step 1.3: Create Tenant Context Middleware

```typescript
// server/middleware/tenantContext.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function setTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user;

  if (!user?.companyId) {
    return res.status(403).json({ error: 'No tenant context' });
  }

  // Set PostgreSQL session variable for RLS
  await db.execute(sql`SELECT set_config('app.current_tenant', ${user.companyId}, true)`);

  // Also attach to request for application-level checks
  req.tenantId = user.companyId;

  next();
}

// Bypass for platform admins (with audit logging)
export async function setPlatformAdminContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== 'platform_admin') {
    return res.status(403).json({ error: 'Platform admin required' });
  }

  // Log cross-tenant access
  await auditLog({
    action: 'CROSS_TENANT_ACCESS',
    userId: req.user.id,
    targetTenant: req.query.tenantId,
    resource: req.path
  });

  // Set specified tenant or allow all
  const targetTenant = req.query.tenantId as string || '*';
  await db.execute(sql`SELECT set_config('app.current_tenant', ${targetTenant}, true)`);

  next();
}
```

#### Step 1.4: Eliminate _Internal Methods

```typescript
// BEFORE: Dangerous internal methods
export interface IStorage {
  getUserById_Internal(id: string): Promise<User | undefined>;
  getOrderById_Internal(id: string): Promise<OrderWithDetails | undefined>;
}

// AFTER: All methods require tenant context
export interface IStorage {
  getUser(id: string, tenantId: string): Promise<User | undefined>;
  getOrder(id: string, tenantId: string): Promise<OrderWithDetails | undefined>;

  // For auth flows that genuinely need cross-tenant (login, etc.)
  // Use separate AuthRepository with explicit audit logging
}

// Create separate AuthRepository for authentication-only queries
// server/repositories/AuthRepository.ts
export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | undefined> {
    // This is the ONLY place cross-tenant user lookup is allowed
    // Always audit logged
    await this.auditCrossTenantAccess('findUserByEmail', email);
    return db.query.users.findFirst({
      where: eq(users.email, normalizeEmail(email))
    });
  }
}
```

#### Step 1.5: Audit All Existing Queries

```bash
# Find all _Internal method usages
grep -r "_Internal" server/ --include="*.ts" > internal_method_audit.txt

# Find all raw SQL that might bypass RLS
grep -r "db.execute" server/ --include="*.ts" > raw_sql_audit.txt

# Find queries without companyId parameter
grep -r "storage\." server/routes --include="*.ts" | grep -v "companyId" > missing_tenant_audit.txt
```

### Deliverables

- [ ] RLS enabled on all tenant-scoped tables
- [ ] Tenant context middleware applied to all routes
- [ ] All `_Internal` methods eliminated or moved to AuthRepository
- [ ] Audit log for any cross-tenant access
- [ ] Integration tests for tenant isolation

---

## Phase 2: AI Service Consolidation

**Timeline:** Week 3-6
**Risk Level:** HIGH
**Goal:** 7 AI services → 1 UnifiedAIService

### Current State (7 Services)

```
/api/master-ai          → Chat, tools, learning
/api/platform-ai        → Commands, insights, predictions
/api/ai-notifications   → Proactive briefings
/api/ai-purchase-orders → Autonomous PO generation
/api/demand-forecasting → Predictive inventory
/api/ai-ml              → Generic ML endpoints
/api/ophthalmic-ai      → Domain-specific AI
```

### Target State (1 Unified Service)

```
/api/ai
  ├── /chat              → Conversational AI
  ├── /tools             → Function calling (orders, inventory, reports)
  ├── /insights          → Proactive notifications
  ├── /predictions       → Forecasting, demand, risk
  └── /actions           → Autonomous operations (PO generation)
```

### Step 2.1: Create UnifiedAIService

```typescript
// server/services/UnifiedAIService.ts
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import { AIToolRegistry } from './ai/ToolRegistry';
import { AIContextBuilder } from './ai/ContextBuilder';
import { AILearningEngine } from './ai/LearningEngine';

interface AIRequest {
  message: string;
  conversationId?: string;
  context?: {
    currentPage?: string;
    selectedEntity?: { type: string; id: string };
  };
}

interface AIResponse {
  message: string;
  toolResults?: ToolResult[];
  suggestions?: QuickAction[];
  confidence: number;
}

export class UnifiedAIService {
  private anthropic: Anthropic;
  private toolRegistry: AIToolRegistry;
  private contextBuilder: AIContextBuilder;
  private learningEngine: AILearningEngine;

  constructor(private companyId: string) {
    this.anthropic = new Anthropic();
    this.toolRegistry = new AIToolRegistry(companyId);
    this.contextBuilder = new AIContextBuilder(companyId);
    this.learningEngine = new AILearningEngine(companyId);
  }

  async processQuery(request: AIRequest): Promise<AIResponse> {
    // 1. Build context from company data
    const context = await this.contextBuilder.build({
      recentOrders: true,
      inventoryLevels: true,
      pendingTasks: true,
      companyPreferences: true,
      ...request.context
    });

    // 2. Get relevant learned patterns
    const learnedPatterns = await this.learningEngine.getRelevantPatterns(
      request.message
    );

    // 3. Build system prompt with context
    const systemPrompt = this.buildSystemPrompt(context, learnedPatterns);

    // 4. Call Claude with function calling
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools: this.toolRegistry.getTools(),
      messages: await this.getConversationHistory(request.conversationId, request.message)
    });

    // 5. Execute any tool calls
    const toolResults = await this.executeToolCalls(response);

    // 6. Learn from interaction
    await this.learningEngine.recordInteraction({
      query: request.message,
      response: response,
      toolsUsed: toolResults.map(t => t.toolName),
      companyId: this.companyId
    });

    // 7. Generate quick action suggestions
    const suggestions = await this.generateSuggestions(request, response);

    return {
      message: this.extractTextResponse(response),
      toolResults,
      suggestions,
      confidence: this.calculateConfidence(response)
    };
  }

  // Proactive insights (replaces ai-notifications)
  async generateDailyBriefing(): Promise<DailyBriefing> {
    const insights = await Promise.all([
      this.analyzeInventoryTrends(),
      this.analyzeSalesPatterns(),
      this.identifyRiskAreas(),
      this.suggestOptimizations()
    ]);

    return {
      date: new Date(),
      companyId: this.companyId,
      insights: insights.flat(),
      priorityActions: this.prioritizeActions(insights)
    };
  }

  // Autonomous actions (replaces ai-purchase-orders)
  async executeAutonomousAction(action: AutonomousAction): Promise<ActionResult> {
    // Validate action is within company's autonomy settings
    const settings = await this.getCompanyAISettings();

    if (!this.isActionAllowed(action, settings)) {
      return {
        executed: false,
        reason: 'Action exceeds autonomy limits',
        requiresApproval: true
      };
    }

    // Execute with full audit trail
    return await this.toolRegistry.executeTool(action.toolName, action.parameters);
  }

  // Predictions (replaces demand-forecasting)
  async getPredictions(type: PredictionType): Promise<Prediction[]> {
    switch (type) {
      case 'demand':
        return this.predictDemand();
      case 'stockout':
        return this.predictStockouts();
      case 'staffing':
        return this.predictStaffingNeeds();
      default:
        throw new Error(`Unknown prediction type: ${type}`);
    }
  }
}
```

### Step 2.2: Create Tool Registry

```typescript
// server/services/ai/ToolRegistry.ts
import { Tool } from '@anthropic-ai/sdk';

export class AIToolRegistry {
  private tools: Map<string, AITool> = new Map();

  constructor(private companyId: string) {
    this.registerCoreTools();
  }

  private registerCoreTools() {
    // Order Management
    this.register({
      name: 'get_orders',
      description: 'Retrieve orders with optional filters',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'in_production', 'completed'] },
          dateRange: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } } },
          limit: { type: 'number', default: 10 }
        }
      },
      handler: async (params) => {
        return storage.getOrders({ ...params, companyId: this.companyId });
      }
    });

    // Inventory Management
    this.register({
      name: 'check_inventory',
      description: 'Check current inventory levels and reorder points',
      parameters: {
        type: 'object',
        properties: {
          productIds: { type: 'array', items: { type: 'string' } },
          belowReorderPoint: { type: 'boolean' }
        }
      },
      handler: async (params) => {
        return inventoryService.checkLevels(this.companyId, params);
      }
    });

    // Purchase Order Creation (Autonomous)
    this.register({
      name: 'create_purchase_order',
      description: 'Create a purchase order for supplies',
      parameters: {
        type: 'object',
        properties: {
          supplierId: { type: 'string' },
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number' }
              }
            }
          },
          notes: { type: 'string' }
        },
        required: ['supplierId', 'lineItems']
      },
      handler: async (params) => {
        // Check autonomy limits before executing
        const settings = await this.getCompanySettings();
        const totalValue = params.lineItems.reduce((sum, item) =>
          sum + (item.quantity * item.unitPrice), 0);

        if (totalValue > settings.maxAutonomousPOValue) {
          return {
            success: false,
            requiresApproval: true,
            message: `PO value exceeds autonomous limit`
          };
        }

        return storage.createPurchaseOrder(params, 'ai-system');
      },
      requiresApproval: (params, settings) => {
        const total = params.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        return total > settings.maxAutonomousPOValue;
      }
    });

    // Report Generation
    this.register({
      name: 'generate_report',
      description: 'Generate business reports',
      parameters: {
        type: 'object',
        properties: {
          reportType: {
            type: 'string',
            enum: ['sales', 'inventory', 'orders', 'quality', 'financial']
          },
          dateRange: { type: 'object' },
          format: { type: 'string', enum: ['summary', 'detailed', 'chart_data'] }
        }
      },
      handler: async (params) => {
        return reportingService.generate(this.companyId, params);
      }
    });

    // Patient Lookup (with PHI protection)
    this.register({
      name: 'find_patient',
      description: 'Look up patient information',
      parameters: {
        type: 'object',
        properties: {
          searchTerm: { type: 'string' },
          searchField: { type: 'string', enum: ['name', 'email', 'phone', 'id'] }
        }
      },
      handler: async (params) => {
        // Return limited fields, never full PHI
        const patients = await storage.searchPatients(this.companyId, params);
        return patients.map(p => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          lastVisit: p.lastVisitDate,
          upcomingAppointment: p.nextAppointment
          // Deliberately exclude: DOB, SSN, full address, medical history
        }));
      }
    });
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters
    }));
  }

  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);

    // Audit log every tool execution
    await auditLog({
      action: 'AI_TOOL_EXECUTION',
      tool: name,
      params: this.sanitizeParams(params),
      companyId: this.companyId
    });

    return tool.handler(params);
  }
}
```

### Step 2.3: Create Unified Routes

```typescript
// server/routes/ai.ts
import { Router } from 'express';
import { UnifiedAIService } from '../services/UnifiedAIService';
import { secureRoute } from '../middleware/secureRoute';
import { aiQueryLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply security and rate limiting
router.use(...secureRoute());
router.use(aiQueryLimiter);

// Chat endpoint
router.post('/chat', async (req, res) => {
  const aiService = new UnifiedAIService(req.tenantId);

  const response = await aiService.processQuery({
    message: req.body.message,
    conversationId: req.body.conversationId,
    context: req.body.context
  });

  res.json(response);
});

// Get daily briefing
router.get('/briefing', async (req, res) => {
  const aiService = new UnifiedAIService(req.tenantId);
  const briefing = await aiService.generateDailyBriefing();
  res.json(briefing);
});

// Get predictions
router.get('/predictions/:type', async (req, res) => {
  const aiService = new UnifiedAIService(req.tenantId);
  const predictions = await aiService.getPredictions(req.params.type as PredictionType);
  res.json(predictions);
});

// Execute autonomous action
router.post('/actions', async (req, res) => {
  const aiService = new UnifiedAIService(req.tenantId);
  const result = await aiService.executeAutonomousAction(req.body);
  res.json(result);
});

// Get conversation history
router.get('/conversations', async (req, res) => {
  const conversations = await storage.getAiConversations(req.tenantId, req.user.id);
  res.json(conversations);
});

// Quick actions for current context
router.post('/quick-actions', async (req, res) => {
  const aiService = new UnifiedAIService(req.tenantId);
  const actions = await aiService.getSuggestedActions(req.body.context);
  res.json(actions);
});

export default router;
```

### Deliverables

- [ ] UnifiedAIService with all capabilities
- [ ] AIToolRegistry with 15+ tools
- [ ] Single /api/ai router
- [ ] Deprecation headers on old endpoints
- [ ] Migration guide for API consumers
- [ ] Remove old AI route files after 30 days

---

## Phase 3: Storage Decomposition

**Timeline:** Week 5-7
**Risk Level:** HIGH
**Goal:** Split 500+ method God object into domain repositories

### Current State

```typescript
// One massive interface with everything
export interface IStorage {
  // User methods (20+)
  getUser(...): Promise<User>;
  updateUser(...): Promise<User>;

  // Order methods (15+)
  getOrder(...): Promise<Order>;
  createOrder(...): Promise<Order>;

  // AI methods (25+)
  createAiConversation(...): Promise<AiConversation>;

  // Healthcare methods (50+)
  createInsuranceClaim(...): Promise<InsuranceClaim>;

  // ... 400+ more methods
}
```

### Target State

```
server/repositories/
├── UserRepository.ts        → User, roles, preferences
├── OrderRepository.ts       → Orders, timeline, line items
├── PatientRepository.ts     → Patients, examinations, prescriptions
├── InventoryRepository.ts   → Products, stock, adjustments
├── AIRepository.ts          → Conversations, knowledge, learning
├── BillingRepository.ts     → Invoices, payments, subscriptions
├── HealthcareRepository.ts  → Claims, measures, care plans
├── SupplierRepository.ts    → Suppliers, POs, documents
└── index.ts                 → Unified export
```

### Step 3.1: Create Base Repository

```typescript
// server/repositories/BaseRepository.ts
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

export abstract class BaseRepository<T> {
  constructor(
    protected table: PgTable,
    protected tenantId: string
  ) {}

  // Ensure all queries include tenant filter
  protected tenantFilter() {
    return eq(this.table['companyId'], this.tenantId);
  }

  async findById(id: string): Promise<T | undefined> {
    const results = await db
      .select()
      .from(this.table)
      .where(and(
        eq(this.table['id'], id),
        this.tenantFilter()
      ))
      .limit(1);

    return results[0] as T | undefined;
  }

  async findMany(filters: Partial<T> = {}): Promise<T[]> {
    let query = db.select().from(this.table).where(this.tenantFilter());

    // Apply additional filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        query = query.where(eq(this.table[key], value));
      }
    }

    return query as Promise<T[]>;
  }

  async create(data: Partial<T>): Promise<T> {
    const [result] = await db
      .insert(this.table)
      .values({
        ...data,
        companyId: this.tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return result as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | undefined> {
    const [result] = await db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(this.table['id'], id),
        this.tenantFilter()
      ))
      .returning();

    return result as T | undefined;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(this.table)
      .where(and(
        eq(this.table['id'], id),
        this.tenantFilter()
      ));

    return result.rowCount > 0;
  }
}
```

### Step 3.2: Create Repository Factory

```typescript
// server/repositories/index.ts
import { OrderRepository } from './OrderRepository';
import { UserRepository } from './UserRepository';
import { PatientRepository } from './PatientRepository';
import { AIRepository } from './AIRepository';
import { InventoryRepository } from './InventoryRepository';
import { BillingRepository } from './BillingRepository';
import { HealthcareRepository } from './HealthcareRepository';
import { SupplierRepository } from './SupplierRepository';

// Factory that creates tenant-scoped repositories
export function createRepositories(tenantId: string) {
  return {
    orders: new OrderRepository(tenantId),
    users: new UserRepository(tenantId),
    patients: new PatientRepository(tenantId),
    ai: new AIRepository(tenantId),
    inventory: new InventoryRepository(tenantId),
    billing: new BillingRepository(tenantId),
    healthcare: new HealthcareRepository(tenantId),
    suppliers: new SupplierRepository(tenantId)
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

// Middleware to attach repositories to request
export function attachRepositories(req: Request, res: Response, next: NextFunction) {
  if (!req.tenantId) {
    return next(new Error('Tenant context required'));
  }

  req.repos = createRepositories(req.tenantId);
  next();
}
```

### Deliverables

- [ ] BaseRepository with tenant isolation
- [ ] 8 domain repositories created
- [ ] Factory function for request-scoped instances
- [ ] All routes migrated from storage to repos
- [ ] Old storage.ts deprecated (keep for 30 days)
- [ ] Unit tests for each repository

---

## Phase 4: Route Organization

**Timeline:** Week 7-8
**Risk Level:** MEDIUM
**Goal:** 100+ imports → Auto-discovered domain modules

### Step 4.1: Create Route Module Structure

```
server/routes/
├── api/
│   ├── v1/
│   │   ├── index.ts           → Public API v1
│   │   └── ...
│   └── v2/                    → Future versioned API
├── domains/
│   ├── orders/
│   │   ├── index.ts           → Router export
│   │   ├── handlers.ts        → Request handlers
│   │   └── validation.ts      → Zod schemas
│   ├── patients/
│   ├── inventory/
│   ├── ai/
│   ├── billing/
│   ├── healthcare/
│   └── admin/
├── webhooks/
│   ├── stripe.ts
│   └── shopify.ts
├── auth/
│   ├── jwt.ts
│   ├── google.ts
│   └── mfa.ts
└── index.ts                   → Auto-discovery & registration
```

### Step 4.2: Route Auto-Discovery

```typescript
// server/routes/index.ts
import { Express, Router } from 'express';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import logger from '../utils/logger';

interface RouteModule {
  router: Router;
  path: string;
  middleware?: any[];
}

export async function registerAllRoutes(app: Express): Promise<void> {
  const domainsPath = join(__dirname, 'domains');

  // Auto-discover domain routes
  const domains = readdirSync(domainsPath).filter(f =>
    statSync(join(domainsPath, f)).isDirectory()
  );

  for (const domain of domains) {
    try {
      const module: RouteModule = await import(join(domainsPath, domain));

      const basePath = `/api/${domain}`;
      const middleware = module.middleware || [];

      app.use(basePath, ...middleware, module.router);

      logger.info({ domain, path: basePath }, 'Registered route domain');
    } catch (error) {
      logger.error({ domain, error }, 'Failed to load route domain');
    }
  }

  // Register versioned public API
  const v1Routes = await import('./api/v1');
  app.use('/api/v1', v1Routes.default);

  // Register webhooks (no auth)
  const webhooks = await import('./webhooks');
  app.use('/webhooks', webhooks.default);

  // Register auth routes
  const auth = await import('./auth');
  app.use('/api/auth', auth.default);

  logger.info({ totalDomains: domains.length }, 'All routes registered');
}
```

### Deliverables

- [ ] Domain-based folder structure
- [ ] Auto-discovery in routes/index.ts
- [ ] All routes migrated to domain modules
- [ ] Original routes.ts removed
- [ ] Route documentation generated

---

## Phase 5: Database Optimization

**Timeline:** Week 8-9
**Risk Level:** HIGH
**Goal:** Add missing indexes, fix N+1 queries

### Step 5.1: Migration for Indexes

```sql
-- migrations/20251201_add_performance_indexes.sql

-- Orders table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_status
  ON orders(company_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_created
  ON orders(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_ecp_status
  ON orders(ecp_id, status) WHERE status != 'completed';

-- Patients table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_company_name
  ON patients(company_id, last_name, first_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_company_email
  ON patients(company_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_search
  ON patients USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '')));

-- AI tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_conversations_company_user
  ON ai_conversations(company_id, user_id, updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_conversation
  ON ai_messages(conversation_id, created_at);

-- Invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_company_status
  ON invoices(company_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_company_due
  ON invoices(company_id, due_date) WHERE status = 'draft';

-- Appointments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_company_date
  ON appointment_bookings(company_id, start_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_patient
  ON appointment_bookings(patient_id, start_time DESC);

-- Audit logs (for compliance queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_company_date
  ON audit_logs(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user_action
  ON audit_logs(user_id, action, created_at DESC);
```

### Step 5.2: Fix N+1 Queries

```typescript
// BEFORE: N+1 query pattern
async function getOrdersWithPatients(companyId: string) {
  const orders = await db.select().from(orders).where(eq(orders.companyId, companyId));

  // N+1: One query per order!
  for (const order of orders) {
    order.patient = await db.select().from(patients).where(eq(patients.id, order.patientId));
  }

  return orders;
}

// AFTER: Single query with join
async function getOrdersWithPatients(companyId: string) {
  return db.query.orders.findMany({
    where: eq(orders.companyId, companyId),
    with: {
      patient: true,
      ecp: {
        columns: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
}
```

### Deliverables

- [ ] Index audit completed
- [ ] 15+ indexes added
- [ ] N+1 queries identified and fixed
- [ ] Query performance baselines established
- [ ] Slow query alerting configured

---

## Phase 6: Dependency Cleanup

**Timeline:** Week 9-10
**Risk Level:** MEDIUM
**Goal:** Remove duplicates, reduce bundle size

### Consolidation Plan

| Keep | Remove | Reason |
|------|--------|--------|
| `@anthropic-ai/sdk` | `openai`, `@tensorflow/tfjs-node` | Standardize on Claude |
| `@radix-ui/*` | `@mui/material`, `@mui/icons-material`, `@emotion/*` | Radix + Tailwind is lighter |
| `passport` + `passport-local` | Multiple auth strategies | Consolidate to JWT + local |
| `pino` | `morgan` | Pino is faster, structured |
| `drizzle-orm` | - | Keep, it's great |

### Deliverables

- [ ] 30+ packages removed
- [ ] Bundle size reduced by 40%+
- [ ] Single AI SDK (Anthropic)
- [ ] Single UI library (Radix)
- [ ] Security vulnerabilities reduced

---

## Phase 7: Schema Modularization

**Timeline:** Week 10-11
**Risk Level:** MEDIUM
**Goal:** Split 3000-line schema into domain modules

### Target Structure

```
shared/schema/
├── index.ts              → Re-exports everything
├── base.ts               → Common types, enums
├── users.ts              → Users, roles, preferences
├── orders.ts             → Orders, timeline, line items
├── patients.ts           → Patients, examinations
├── inventory.ts          → Products, stock
├── ai.ts                 → AI conversations, knowledge
├── billing.ts            → Invoices, payments, subscriptions
├── healthcare.ts         → Claims, measures, care plans
└── relations.ts          → All Drizzle relations
```

### Deliverables

- [ ] Schema split into 10 domain files
- [ ] All imports updated
- [ ] Relations in separate file
- [ ] Zod schemas co-located with tables
- [ ] Types exported with tables

---

## Phase 8: Hardening & Polish

**Timeline:** Week 11-12
**Risk Level:** LOW
**Goal:** Production readiness

### 8.1 Error Handling Consistency

```typescript
// server/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: any) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string) {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }

  static internal(message = 'Internal server error') {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}
```

### 8.2 HIPAA Audit Enhancement

```typescript
// server/middleware/hipaaAudit.ts
interface HIPAAAuditEntry {
  timestamp: Date;
  userId: string;
  userRole: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  phiAccessed: boolean;
  phiFields?: string[];
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  failureReason?: string;
}

export async function hipaaAuditLog(entry: Partial<HIPAAAuditEntry>) {
  const fullEntry: HIPAAAuditEntry = {
    timestamp: new Date(),
    ...entry
  } as HIPAAAuditEntry;

  // Write to separate audit table (immutable)
  await db.insert(hipaaAuditLogs).values(fullEntry);

  // Also send to external SIEM if configured
  if (process.env.SIEM_ENDPOINT) {
    await sendToSIEM(fullEntry);
  }
}
```

### 8.3 Session Cleanup Job

```typescript
// server/jobs/sessionCleanup.ts
import cron from 'node-cron';
import { db } from '../db';
import { sessions } from '@shared/schema';
import { lt } from 'drizzle-orm';
import logger from '../utils/logger';

export function startSessionCleanupJob() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await db
        .delete(sessions)
        .where(lt(sessions.expire, new Date()));

      logger.info({ deletedCount: result.rowCount }, 'Cleaned expired sessions');
    } catch (error) {
      logger.error({ error }, 'Session cleanup failed');
    }
  });

  logger.info('Session cleanup job scheduled');
}
```

### Deliverables

- [ ] Consistent error handling everywhere
- [ ] HIPAA audit trail complete
- [ ] Session cleanup job running
- [ ] Enhanced health checks
- [ ] API documentation generated
- [ ] Load testing completed
- [ ] Security scan passed

---

## Success Metrics

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Storage methods | 500+ | 0 (use repos) | Line count |
| AI services | 7 | 1 | Route count |
| Route imports | 100+ | 10-15 | routes/index.ts |
| Avg query time | Unknown | <50ms p95 | pg_stat_statements |
| Bundle size | Unknown | <2MB | source-map-explorer |
| Dependencies | 150+ | <80 | package.json |
| Schema file size | 3000+ lines | <500 per file | wc -l |
| Test coverage | Unknown | >80% | Jest coverage |

---

## Risk Mitigation

1. **Feature freeze during Phase 1-2** - Security and AI consolidation are too risky to do alongside new features
2. **Parallel testing environment** - All changes tested in staging with production data copy
3. **Incremental rollout** - Use feature flags to gradually enable new code paths
4. **Rollback plan** - Every phase has a documented rollback procedure
5. **Daily backups** - Database snapshots before every major migration

---

## Estimated Total Effort

| Phase | Weeks | Developer Days |
|-------|-------|----------------|
| 1. Multi-tenant Security | 3 | 15 |
| 2. AI Consolidation | 3 | 15 |
| 3. Storage Decomposition | 2 | 10 |
| 4. Route Organization | 1.5 | 7 |
| 5. Database Optimization | 1 | 5 |
| 6. Dependency Cleanup | 1 | 5 |
| 7. Schema Modularization | 1 | 5 |
| 8. Hardening | 1.5 | 7 |
| **TOTAL** | **12** | **69 dev days** |

With 1 developer: 12-14 weeks
With 2 developers: 6-8 weeks
With AI assistance (Claude Code): 4-6 weeks

---

*This plan prioritizes launch-blocking issues first. Phases can be parallelized where dependencies allow.*
