<!-- Copilot / AI agent instructions for the Integrated Lens System (ILS) -->```markdown

<!-- Copilot / AI agent instructions for the Integrated Lens System (ILS) -->

# ILS — Quick, actionable guidance for AI coding agents

# ILS — Quick, actionable guidance for AI coding agents

Enterprise optical lab management platform. This monorepo contains a React + Vite client, an Express TypeScript server, shared Zod/Drizzle types, Python analytics services, background workers with BullMQ, and event-driven architecture. Focus on small, testable edits and keep `shared/` as the contract boundary.

Be concise. This monorepo contains a React + Vite client, an Express TypeScript server, shared Zod/Drizzle types, and a few Python microservices. Focus on small, testable edits and keep `shared/` as the contract boundary.

## Big Picture Architecture

- Big picture (quick)

**Frontend**: `client/` — React + TypeScript (Vite), shadcn/ui + Radix UI components, TanStack Query for server state, Wouter routing    - Frontend: `client/` — React + TypeScript (Vite). UI components: `client/src/components`; pages: `client/src/pages`.

**Backend**: `server/` — Express + TypeScript (ESM), modular route registration pattern via `registerRoutes()`, middleware-heavy (auth, rate limiting, audit)    - Backend: `server/` — Express + TypeScript (ESM). Entry: `server/index.ts`. Dev orchestration: `start-dev.mjs` (root).

**Shared Contract**: `shared/schema.ts` — Drizzle ORM schemas + Zod validation (single source of truth). Use `createInsertSchema()` from `drizzle-zod` for API validation    - Shared contract: `shared/` — Zod schemas + Drizzle types (single source of truth for payload shapes).

**Python Services**: `python-service/` (FastAPI analytics on :8000) and `ai-service/` (ML models) — independent processes    - Python services: `python-service/` and `ai-service/` — independent processes with their own `requirements.txt` and start scripts.

**Background Jobs**: BullMQ + Redis workers in `server/workers/` (email, PDF, notifications, AI). Graceful degradation if Redis unavailable  

**Events**: Event-driven pub/sub via `server/events/EventBus.ts` (Node EventEmitter). Handlers in `server/events/handlers/`  - Essential workflows (concrete)

**Data Layer**: `server/storage.ts` exports singleton `storage` object (DbStorage class) — all DB access goes through this    - Install dependencies: run `npm install` at repo root.

**Multi-tenancy**: Users belong to `companies` (via `companyId`). Most entities are tenant-scoped. Legacy `organizationId` field exists but use `companyId`  - Full-stack dev: `npm run dev` — runs `start-dev.mjs` which spawns client, server and optional Python services.

  - Server-only dev: `npm run dev:node` (uses `tsx server/index.ts`).

## Essential Workflows  - Python service dev: `npm run dev:python` (invokes `python-service/start-service.sh`).

  - DB migrations: `npm run db:push` (drizzle-kit push).

**Setup**: `npm install` at repo root    - Tests: unit/integration: `npm test`; component tests: `npm run test:components` (Vitest); e2e: `npm run test:e2e` (Playwright). Use `npm run test:unit` for fast feedback.

**Dev mode**: `npm run dev` — runs `start-dev.mjs` which spawns Python service (:8000), then Node dev server (:5000)    - Build: `npm run build` (client via Vite, server bundled with esbuild). Production start: `npm run start`.

**Server only**: `npm run dev:node` (uses tsx watch mode)  

**Python only**: `npm run dev:python`  - Project conventions to respect

**DB migrations**: `npm run db:push` (drizzle-kit push to Neon Postgres)    - ESM modules only — always use `import` / `export` (package.json is \"type\": \"module\").

**Tests**:  - Shared types live in `shared/schema.ts` (Zod + Drizzle). Update Zod shapes first when changing APIs and follow up with migrations if DB schemas change.

- Unit tests: `npm run test:unit` (Jest, server/integration only)  - Path aliases (tsconfig): `@/*` → `client/src/*`, `@shared/*` → `shared/*`. Use these aliases in imports.

- Integration tests: `npm run test:integration` or `npm test` (Jest)  - Dev TypeScript: `noEmit: true` in `tsconfig.json` — build output happens during `npm run build`.

- Component tests: `npm run test:components` (Vitest + jsdom for React components)

- E2E tests: `npm run test:e2e` (Playwright)- Integration points & libraries to watch

- Full suite: `npm run test:all` (TypeScript check + all test suites)  - Auth: Replit OIDC + Passport (look for `server/replitAuth.*`).

  - DB: Neon Postgres via `drizzle-orm` + `drizzle-zod`. See `scripts/migrate-storage.ts` for migration examples.

**Build**: `npm run build` (client via Vite, server via esbuild to `dist/`)    - Email: `resend` library is used for notification flows.

**Production**: `npm run start` (NODE_ENV=production node dist/index.js)  - AI/ML: `ai-service/` uses model client libraries (Anthropic, OpenAI, TFJS). Follow existing call and batching patterns there.



## Project Conventions to Respect- Editing API surfaces (concrete contract steps)

  1. Update Zod schema in `shared/schema.ts` (authoritative shape).

**ESM only**: Always use `import`/`export` (package.json has `"type": "module"`)    2. Update server validation/handlers (e.g., `server/routes.ts` or route files). Add tests.

**Path aliases** (tsconfig):  3. Update client hooks/pages under `client/src/hooks` and `client/src/pages`.

- `@/*` → `client/src/*` (or `server/*` in Jest context)  4. If DB changes are needed, add a migration and run `npm run db:push`.

- `@shared/*` → `shared/*`

- Quick file cheat-sheet (start here)

**Shared schema workflow** (critical):  - `server/index.ts` — server bootstrap

1. Update Drizzle schema in `shared/schema.ts` (add/modify table columns)  - `start-dev.mjs` — orchestrates local dev processes

2. Export Zod insert/update schemas using `createInsertSchema()` (see existing patterns like `insertOrderSchema`)  - `shared/schema.ts` — Zod + Drizzle contract

3. Run `npm run db:push` to sync DB  - `server/routes.ts` — API patterns and validation

4. Update `server/storage.ts` methods (storage layer)  - `scripts/migrate-storage.ts` — migration helper

5. Update route handlers in `server/routes/` or `server/routes.ts` (use Zod validation)  - `python-service/start-service.sh` — how Python services are started in dev

6. Update client hooks/pages (`client/src/hooks`, `client/src/pages`)

- Validation & quality gates

**Modular routes**: Large feature sets in `server/routes/` (e.g. `aiIntelligence.ts`, `bi.ts`, `payments.ts`) export `registerXXXRoutes(app: Express)` functions. Called from main `registerRoutes()` in `server/routes.ts`  - Run `npm run check` (TypeScript) and targeted tests (`npm run test:unit` or `npm test`) before proposing non-trivial PRs.

  - Keep changes small and self-contained. When touching multiple layers, prefer separate commits (shared → server → client).

**Auth pattern**: Use `isAuthenticated` middleware (from `server/replitAuth.ts`) or `authenticateUser`/`requireRole()` (from `server/middleware/auth.ts`). Auth state in `req.user` (typed as `AuthenticatedUser`)

- Notes for cross-language changes

**Rate limiting**: Apply per-route or globally. Importers from `server/middleware/security.ts`: `globalRateLimiter`, `authRateLimiter`. More specialized limiters in `server/middleware/rateLimiter.ts`  - Treat `shared/` as the cross-language contract. When adding fields used by Python services, update `shared/` and notify the Python code owner or add a small adapter in `ai-service/` or `python-service/`.



**Error handling**: Use `asyncHandler()` wrapper (from `server/middleware/errorHandler.ts`) to catch async errors. Throw custom errors like `BadRequestError`, `UnauthorizedError`, `NotFoundError` (defined in same file)If any section is unclear or you want file-level examples or tests added, tell me which area and I will expand with exact snippets and minimal tests.



**Background jobs**: Enqueue via `addEmailJob()`, `addPDFJob()`, `addNotificationJob()` (from `server/queue/`). Workers auto-start on server boot (imported in `server/index.ts`). Check `redisAvailable` from `server/queue/config.ts` for fallback logic```


**Event-driven**: Emit domain events via `EventBus.publish()` (from `server/events/EventBus.ts`). Subscribe in handlers (`server/events/handlers/`). Example: `order.created` event triggers LIMS, analytics, PDF generation workers

## Integration Points & Libraries

**Auth**: Passport.js + Replit OIDC + local email/password (see `server/replitAuth.ts`, `server/localAuth.ts`). Master user provisioning via env vars (`MASTER_USER_EMAIL`, etc.) in `server/masterUser.ts`  
**DB**: Neon Postgres (serverless) via Drizzle ORM. Connection in `server/db.ts`. All queries through `storage` singleton  
**Email**: Resend API (via `server/emailService.ts` and `server/services/EmailService.ts`). Background jobs for async sending  
**PDF**: PDFKit (via `server/pdfService.ts` and `server/services/PDFService.ts`). Background worker for generation  
**AI/ML**: `ai-service/` uses Anthropic, OpenAI, TensorFlow.js. Server routes in `server/routes/aiEngine.ts`, `server/routes/proprietaryAi.ts`  
**Payments**: Stripe integration in `server/routes/payments.ts`. Subscription plans in `shared/schema.ts` (subscriptionPlans table)  
**Real-time**: WebSocket server in `server/websocket/`. Broadcast via `WebSocketBroadcaster` (event-driven broadcasts)  
**Monitoring**: Prometheus metrics exported via `server/lib/metrics.ts`. Route: `/metrics` (see `server/routes/metrics.ts`)  
**Cron jobs**: Node-cron scheduled tasks in `server/jobs/` (daily briefing, inventory monitoring, clinical anomaly detection, etc.). Auto-start in `server/index.ts`

## Quick File Cheat-Sheet

**Server entry**: `server/index.ts` (middleware setup, cron start, WebSocket init, master user provision)  
**Dev orchestrator**: `start-dev.mjs` (spawns Python, then Node)  
**Schema authority**: `shared/schema.ts` (Drizzle tables + Zod schemas)  
**Route registry**: `server/routes.ts` → `registerRoutes()` function (5500+ lines, monolithic but modular via sub-registrations)  
**Data access layer**: `server/storage.ts` → `storage` singleton (1800+ lines, all queries)  
**Event bus**: `server/events/EventBus.ts` (pub/sub, async replay, dead letter queue)  
**Queue config**: `server/queue/config.ts` (Redis connection, queue init, graceful degradation)  
**Workers**: `server/workers/emailWorker.ts`, `pdfWorker.ts`, `notificationWorker.ts`, `aiWorker.ts`, `OrderCreated*Worker.ts`  
**Middleware**: `server/middleware/auth.ts`, `security.ts`, `rateLimiter.ts`, `errorHandler.ts`, `audit.ts`, `validation.ts`  
**Python entry**: `python-service/main.py` (FastAPI app)  
**AI service**: `ai-service/` (ML training, RAG, model endpoints)  
**Migration helpers**: `scripts/migrate-storage.ts` (run with `npm run migrate-storage`)

## Testing Patterns

**Jest** (integration/API tests): Mock `storage` object or use test DB. Setup in `test/setup.ts`. Pattern: import route handlers, spy on storage methods  
**Vitest** (component tests): React Testing Library + jsdom. Setup in `test/setup.vitest.ts`. Alias `@/` → `client/src/`  
**Playwright** (E2E): Full browser tests in `test/e2e/`. Config in `playwright.config.ts`  
**Coverage**: `npm run test:coverage` (Jest with coverage reporter)

## Validation & Quality Gates

**Pre-commit**: Run `npm run check` (tsc) + `npm run test:unit` for fast feedback  
**Pre-PR**: Run `npm run test:ci` (includes coverage, integration, components)  
**Keep changes small**: When touching multiple layers (shared → server → client), prefer separate commits or PRs for clarity

## Common Pitfalls

**Multi-tenancy**: Always filter queries by `companyId` for tenant isolation. Check existing patterns in `storage.ts`  
**Redis optional**: Don't assume Redis is available. Check `redisAvailable` flag before enqueuing jobs. Workers have `*Immediate()` fallback functions (e.g., `sendEmailImmediate()`)  
**Async event handlers**: Event handlers in `server/events/handlers/` should be async and handle errors gracefully (events are fire-and-forget by default)  
**Schema changes**: Never edit DB directly. Always update `shared/schema.ts` first, then `npm run db:push`. Drizzle migrations in `migrations/` are auto-generated  
**Path resolution**: Use `@/` and `@shared/` aliases everywhere. Avoid relative paths like `../../../shared`  
**Session management**: Uses `express-session` + Redis store (or memory store fallback). Session secret in env var `SESSION_SECRET`

## Environment Variables (Critical)

See `.env.example` for full list. Key ones:
- `DATABASE_URL` (Neon Postgres connection string)
- `SESSION_SECRET` (session encryption)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional, for queues/sessions)
- `MASTER_USER_EMAIL`, `MASTER_USER_PASSWORD` (bootstrap admin account)
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (AI services)
- `RESEND_API_KEY` (email)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` (payments)

## Cross-Language Changes

Python services consume data via HTTP APIs (not direct DB access). When adding fields to orders/patients/etc.:
1. Update `shared/schema.ts`
2. Update `server/storage.ts` and API routes
3. Update Python service clients (`ai-service/api/`, `python-service/`)
4. Consider adding adapter/mapper in Python if schema diverges

---

**Need more detail?** Ask about specific areas: auth flows, event patterns, worker implementation, testing strategies, or feature modules.
