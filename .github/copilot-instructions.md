# ILS 2.0 — AI Agent Guidance

> Enterprise optical lab management platform. Monorepo: React + Vite frontend, Express + TypeScript backend, shared Zod/Drizzle types, Python analytics, event-driven architecture with BullMQ workers. **Keep `shared/` as the contract boundary.**

## 🎯 The ILS Architecture Philosophy

ILS 2.0 is built on **strict separation of concerns**: contracts define interfaces, storage controls data, routes orchestrate, events coordinate. This enables 100+ engineers to work independently without breaking each other's code.

## Architecture at a Glance

**Frontend**: `client/` — React + TypeScript (Vite), shadcn/ui + Radix UI, TanStack Query, Wouter routing  
**Backend**: `server/` — Express + TypeScript (ESM), routes registered via `registerRoutes()` (5800+ lines in `server/routes.ts` + modular feature files in `server/routes/`)  
**Shared Contract**: `shared/schema.ts` — Drizzle ORM tables (110+ tables, 8400+ lines) + Zod validators. Use `createInsertSchema()` for API payloads. This is the **single source of truth** for client/server types  
**Data Layer**: `server/storage.ts` — Singleton DbStorage class (6200+ lines). **ALL DB access goes through here**, never query `db` directly in route handlers  
**Event Bus**: `server/events/EventBus.ts` — Pub/sub + auto-persistence. Emit via `EventBus.publish('order.created', { orderId, companyId })`. Handlers are async and fail-silent  
**Background Jobs**: BullMQ + Redis workers in `server/workers/` (email, PDF, notifications, AI, order processing). **Graceful fallback** if Redis unavailable via `*Immediate()` methods  
**Python Services**: `python-service/` (FastAPI analytics) and `ai-service/` (ML models) — independent processes consuming REST APIs, not direct DB access  
**Error Handling**: Centralized `ApiError` classes in `server/utils/ApiError.ts`. Routes wrapped with `asyncHandler()` from `server/middleware/errorHandler.ts`  

## Essential Workflows

```bash
npm install                  # One-time setup
npm run dev                  # Full stack: spawns Python, Node, client (from start-dev.mjs)
npm run dev:node             # Backend only
npm run dev:python           # Analytics service only

npm run check               # TypeScript check (fast)
npm run test:unit          # Unit tests only (Jest)
npm run test               # Integration tests (Jest)
npm run test:components    # React component tests (Vitest)
npm run test:e2e           # Playwright end-to-end
npm run test:all           # Full suite (ci pipeline)

npm run db:push            # Migrate schema changes (drizzle-kit → Neon)
npm run build && npm start # Production build + run
```

## Adding Features: The Workflow

**The ILS Development Pattern** (applies to 99% of changes):

**1. Update Zod schema** in `shared/schema.ts`:
```typescript
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  status: orderStatusEnum("status").default("pending"),
  companyId: varchar("company_id").notNull().references(() => companies.id), // REQUIRED for multi-tenancy
  // Add new columns here
});

// Export insert schema for validation (auto-generates from table)
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
```

**2. Run migration** to sync DB:
```bash
npm run db:push  # Creates migration, updates Neon (don't force unless absolutely necessary)
```

**3. Update `storage.ts`** — add/modify methods on `DbStorage` class (lines 1-6200):
```typescript
async getOrdersByCompany(companyId: string) {
  return await this.db.query.orders.findMany({
    where: eq(orders.companyId, companyId), // ALWAYS filter by companyId
  });
}
```

**4. Update route handler** in `server/routes.ts` or modular route file (e.g., `server/routes/queue.ts`):
```typescript
router.get("/orders", authenticateUser, asyncHandler(async (req, res) => {
  const companyId = req.user.companyId; // Extract from auth context
  const orders = await storage.getOrdersByCompany(companyId); // Use storage layer
  res.json(orders); // Implicit 200 response
}));
```
Key: Routes don't need explicit 200 responses. Errors throw via `asyncHandler()` which catches and formats.

**5. Update client** — hooks in `client/src/hooks/` or pages in `client/src/pages/`:
```typescript
const { data: orders } = useQuery({
  queryKey: ["orders"],
  queryFn: () => api.get("/api/orders").then(r => r.data),
});
```

**6. Emit events** after key state changes (triggers workers, analytics, etc.):
```typescript
const order = await storage.createOrder(data);
await EventBus.publish("order.created", { 
  orderId: order.id, 
  companyId: order.companyId 
});
// Workers automatically pick this up from /server/events/handlers/
```

## Critical Agent Patterns

### Type Safety & Validation Chain
**All data flows through Zod → Drizzle → TypeScript**. Never skip validation:
```typescript
// ❌ WRONG: Trusting req.body directly
const order = await storage.createOrder(req.body);

// ✅ RIGHT: Parse through Zod first
const parsed = insertOrderSchema.parse(req.body); // Throws ZodError if invalid
const order = await storage.createOrder(parsed);
```

### Storage Layer Indirection
**100% of DB queries go through `storage` singleton.** This enables:
- Mocking in tests (spy on storage methods)
- Tenant isolation enforcement
- Centralized query optimization
- Consistent error handling

```typescript
// ❌ WRONG: Direct DB query in route
const orders = await db.select().from(ordersTable).where(eq(ordersTable.id, id));

// ✅ RIGHT: Through storage
const orders = await storage.getOrdersByCompany(companyId);
```

### Error Handling Pattern
**All async routes must use `asyncHandler()`**. It catches promise rejections and passes to global error handler:
```typescript
router.post('/orders', asyncHandler(async (req, res) => {
  if (!order) throw new NotFoundError("Order");      // 404
  if (!hasPermission) throw new UnauthorizedError(); // 401
  if (invalid) throw new BadRequestError("Invalid order data");
  res.json(order);
  // No try/catch needed - asyncHandler catches everything
}));
```
Error response format: `{ success: false, error: { code: "NOT_FOUND", message: "...", details: {} } }`

### Multi-Tenancy Enforcement
**Every query MUST filter by `companyId`.** This is non-negotiable:
```typescript
// ❌ WRONG: Exposes all company data
const patient = await storage.getPatientById(patientId);

// ✅ RIGHT: Scoped to tenant
const patient = await storage.getPatientById(patientId, companyId);
```
Check `storage.ts` methods — they all take `companyId` as first or second parameter.

## Key Files & Patterns

| File | Purpose | Line Count |
|------|---------|-----------|
| `server/index.ts` | Bootstrap: middleware, crons, WebSocket, workers | 500 |
| `start-dev.mjs` | Dev orchestrator: spawns Python, Node, client | — |
| `server/routes.ts` | Main route registry + core endpoints | 5,800 |
| `server/routes/*.ts` | Modular features (bi.ts, queue.ts, payments.ts, etc.) | varies |
| `server/storage.ts` | DbStorage singleton — all DB queries | 6,200 |
| `shared/schema.ts` | Drizzle tables + Zod schemas (single source of truth) | 8,400 |
| `server/middleware/errorHandler.ts` | `asyncHandler()` wrapper + error formatting | 169 |
| `server/events/EventBus.ts` | Pub/sub + persistence | 307 |
| `server/workers/*.ts` | BullMQ: email, PDF, notifications, AI, order handlers | varies |
| `client/src/hooks/useAuth.ts` | Auth state + role checking | — |
| `jest.config.mjs` | Jest config: `@/` → `server/`, `@shared/` → `shared/` | — |

## Integration Points

**Auth**: JWT tokens + Google OAuth + local email/password (`server/middleware/auth-hybrid.ts`, `server/localAuth.ts`). JWT authentication is the primary method; session-based auth has been removed. Check `req.user` (typed: `AuthenticatedRequest`)  
**DB**: Neon Postgres (serverless). Connection via `db` singleton in `server/db.ts`. All queries through `storage` object  
**Email**: Resend API (`server/emailService.ts`). Enqueue via `addEmailJob()`, workers auto-process  
**PDF**: PDFKit (`server/pdfService.ts`). Enqueue via `addPDFJob()`  
**Background Jobs**: BullMQ + Redis (`server/queue/config.ts`). Check `redisAvailable` before enqueuing. Workers have `*Immediate()` fallbacks  
**Payments**: Stripe integration (`server/routes/payments.ts`). Subscription plans in `shared/schema.ts`  
**Real-time**: WebSocket in `server/websocket/` — event-driven broadcasts  
**AI/ML**: `ai-service/` uses Anthropic + OpenAI + TensorFlow.js. Routes: `server/routes/master-ai.ts`, `server/routes/ai-purchase-orders.ts`  
**Crons**: Node-cron in `server/jobs/` (daily briefing, inventory monitoring, clinical anomaly detection)  

## Testing Patterns

- **Jest** (integration/API): Mock `storage` or use test DB. Setup in `test/setup.ts`. Pattern: spy on storage methods
- **Vitest** (components): React Testing Library + jsdom in browser. Setup: `test/setup.vitest.ts`
- **Playwright** (E2E): Full browser tests in `test/e2e/`. Config: `playwright.config.ts`

```bash
npm run test:unit           # Fast feedback on changes
npm run test:coverage       # Jest coverage report
npm test                    # Integration suite
npm run test:ci             # Full CI pipeline
```

## Agent Development Workflow

### Before Writing Code
1. **Understand the feature boundary**: Is it frontend-only, backend-only, or full-stack?
2. **Check for existing patterns**: Search `server/routes/*.ts` for similar endpoints
3. **Validate schema first**: Does the data model already exist in `shared/schema.ts`?
4. **Check event precedents**: Look in `server/events/handlers/` for similar event subscribers

### Code Changes Order (Critical)
1. **Schema changes** → `shared/schema.ts` + `npm run db:push`
2. **Storage methods** → `server/storage.ts` 
3. **Route handlers** → `server/routes.ts` or modular file
4. **Event emissions** → After state-changing operations
5. **Client code** → `client/src/hooks/` + `client/src/pages/`
6. **Tests** → `test/integration/*.test.ts` or `test/components/*.test.tsx`

**Why this order?** Schema changes are foundation; storage depends on schema; routes depend on storage; events depend on routes working.

### Path Alias Usage (Always)
- **Backend code**: `import { storage } from '@/storage'` ← imports from `server/storage.ts`
- **Client code**: `import { useOrders } from '@/hooks/useOrders'` ← imports from `client/src/hooks/`
- **Shared**: `import { insertOrderSchema } from '@shared/schema'` ← always `@shared/`, never relative

### Testing Before Commit
```bash
npm run check              # Catch TypeScript errors early
npm run test:unit         # Fast feedback loop
npm test                  # Full integration suite
```
Agents should always run these before considering work complete.

## Common Pitfalls

❌ **Never edit DB directly** — Always: 1) Update `shared/schema.ts`, 2) `npm run db:push`, 3) Update `storage.ts` methods  
❌ **Missing `companyId` filter** — Every query must check tenant isolation  
❌ **Assuming Redis exists** — Check `redisAvailable` before background jobs. Use `*Immediate()` fallbacks  
❌ **Relative imports** — Use `@/` and `@shared/` aliases always  
❌ **Unhandled async errors** — Wrap routes with `asyncHandler()`  
❌ **Event handlers not async** — Handlers in `server/events/handlers/` must be `async` and handle errors  
❌ **Modifying request validation** — Change schemas in `shared/schema.ts` first, never add ad-hoc Zod in routes  
❌ **Forgetting EventBus metadata** — Include `companyId` so workers know tenant context: `EventBus.publish('order.created', data, { companyId })`  
❌ **Direct async/await in event handlers** — Events are fire-and-forget; handlers must not block the route response  

## Environment Variables

See `.env.example`. Key production vars:
- `DATABASE_URL` (Neon Postgres connection)
- `SESSION_SECRET` (session encryption)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional)
- `MASTER_USER_EMAIL`, `MASTER_USER_PASSWORD` (bootstrap admin)
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (AI services)
- `RESEND_API_KEY` (email)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` (payments)

## Event-Driven Architecture Patterns

### Publishing Events
Events provide loose coupling between components. Always emit after state-changing operations:
```typescript
// After order is created
const order = await storage.createOrder(data);

// Publish event with tenant context
await EventBus.publish("order.created", 
  { orderId: order.id, patientId: order.patientId }, 
  { 
    companyId: req.user.companyId, // REQUIRED for worker context
    source: 'api',
    correlationId: req.id 
  }
);
// Workers pick this up automatically - no blocking
res.json(order);
```

### Subscribing & Worker Pattern
In `server/workers/myWorker.ts`:
```typescript
import { EventBus } from '@/events/EventBus';

// Subscribe to event type
EventBus.subscribe('order.created', async (event) => {
  try {
    const { orderId, patientId } = event.data;
    const { companyId } = event.metadata;
    
    // Process with tenant isolation
    const order = await storage.getOrderById(orderId, companyId);
    // ... do work ...
  } catch (error) {
    console.error('Worker error:', error);
    // Handlers are fail-silent - errors don't propagate
  }
});
```

Then import worker in `server/index.ts`:
```typescript
import './workers/myWorker.js';
```

### BullMQ Background Jobs
For distributed, persistent jobs with retries:
```typescript
// Define job processor
const myQueue = new Queue('myJobs', { connection: redis });

myQueue.process(async (job) => {
  const { companyId, orderId } = job.data;
  // Heavy work here (PDF generation, ML inference, etc.)
  return { success: true };
});

// Enqueue job (in route handler)
if (redisAvailable) {
  await myQueue.add('process', { companyId, orderId }, { 
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
} else {
  // Immediate fallback
  await doWorkImmediately(companyId, orderId);
}
```

## Cross-Language Changes

When adding DB fields used by Python services:
1. Update `shared/schema.ts`
2. `npm run db:push`
3. Update `server/storage.ts` + routes
4. Update Python clients (`ai-service/api/`, `python-service/`)
5. Consider mapper/adapter if schema diverges

Python services consume via HTTP APIs (not direct DB access).

---

**Questions?** Review the files above or check `server/routes/*.ts` for examples in your domain.
