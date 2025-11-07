# Comprehensive ILS Codebase Audit Request

## Project Context
**Integrated Lens System (ILS)** - Enterprise optical lab management platform

### Technology Stack
- **Frontend**: React + TypeScript + Vite (client/)
- **Backend**: Express + TypeScript (server/)
- **Shared**: Zod schemas + Drizzle ORM (shared/schema.ts)
- **Python Services**: FastAPI analytics (python-service/), ML services (ai-service/)
- **Queue**: BullMQ + Redis workers (server/workers/)
- **Events**: Event-driven architecture (server/events/)
- **DB**: Neon Postgres (90+ tables)
- **Auth**: Passport.js + OIDC + local auth
- **Tests**: Jest, Vitest, Playwright

## Audit Scope

### 1. SECURITY ANALYSIS (CRITICAL PRIORITY)
Examine:
- [ ] Authentication flows (server/replitAuth.ts, server/localAuth.ts, server/middleware/auth.ts)
- [ ] Authorization and RBAC (server/middleware/auth.ts - requireRole())
- [ ] SQL injection risks (server/storage.ts - all DB queries)
- [ ] XSS vulnerabilities (client components)
- [ ] CSRF protection (server/middleware/security.ts)
- [ ] Session management (server/index.ts)
- [ ] API key exposure (.env, hardcoded secrets)
- [ ] Rate limiting coverage (server/middleware/rateLimiter.ts)
- [ ] Input validation (shared/schema.ts, server/routes/)
- [ ] File upload security (server/routes/)
- [ ] Multi-tenancy isolation (companyId filtering)

### 2. TYPESCRIPT & CODE QUALITY
Examine:
- [ ] `any` type usage across codebase
- [ ] Missing type definitions
- [ ] Type safety in server/storage.ts (1800+ lines)
- [ ] Type safety in server/routes.ts (5500+ lines)
- [ ] Unused imports and variables
- [ ] Complex functions (cyclomatic complexity > 10)
- [ ] Code duplication
- [ ] Naming conventions

### 3. ARCHITECTURE & DESIGN
Examine:
- [ ] Separation of concerns
- [ ] Dependency injection patterns
- [ ] Event-driven architecture (server/events/EventBus.ts)
- [ ] Worker patterns (server/workers/*.ts)
- [ ] API route organization (server/routes/)
- [ ] Shared schema as single source of truth (shared/schema.ts)
- [ ] Module coupling and cohesion
- [ ] Error propagation patterns

### 4. PERFORMANCE
Examine:
- [ ] N+1 query problems in server/storage.ts
- [ ] Missing database indexes
- [ ] Inefficient algorithms
- [ ] Memory leaks (event listeners, timers)
- [ ] Bundle size (client/)
- [ ] Lazy loading opportunities
- [ ] Caching strategies
- [ ] Background job efficiency (server/workers/)

### 5. ERROR HANDLING
Examine:
- [ ] Try-catch coverage
- [ ] Error middleware usage (server/middleware/errorHandler.ts)
- [ ] asyncHandler() wrapper usage
- [ ] Promise rejection handling
- [ ] Worker error handling (server/workers/)
- [ ] Event handler error handling (server/events/handlers/)
- [ ] User-facing error messages
- [ ] Logging completeness

### 6. TESTING GAPS
Examine:
- [ ] Unit test coverage (test/integration/)
- [ ] Integration test coverage
- [ ] Component test coverage (test/components/)
- [ ] E2E test coverage (test/e2e/)
- [ ] Critical path testing
- [ ] Edge case coverage
- [ ] Mock quality
- [ ] Test maintainability

### 7. DATABASE SCHEMA
Examine:
- [ ] Schema consistency (shared/schema.ts vs actual DB)
- [ ] Missing constraints
- [ ] Indexing strategy
- [ ] Multi-tenancy implementation (companyId)
- [ ] Legacy fields (organizationId vs companyId)
- [ ] Relationship integrity
- [ ] Migration safety
- [ ] Schema size (3,589 lines - is this manageable?)

### 8. CONFIGURATION & ENVIRONMENT
Examine:
- [ ] Environment variable usage
- [ ] Configuration validation
- [ ] Secrets management
- [ ] Development vs production configs
- [ ] Feature flags
- [ ] Redis fallback handling (server/queue/config.ts)
- [ ] Graceful degradation

### 9. DEPENDENCIES
Examine:
- [ ] Outdated packages
- [ ] Unused dependencies
- [ ] Security vulnerabilities (npm audit)
- [ ] License compatibility
- [ ] Bundle bloat
- [ ] Duplicate dependencies

### 10. API DESIGN
Examine:
- [ ] RESTful conventions
- [ ] Request validation (Zod schemas)
- [ ] Response consistency
- [ ] Pagination implementation
- [ ] Error response format
- [ ] API versioning
- [ ] Documentation completeness

## Output Format

For each issue found, provide:

```
## [SEVERITY] Issue Title
**File**: `path/to/file.ts:123-145`
**Priority**: 8/10

### Problem
Clear description of the issue and why it matters.

### Current Code
```typescript
// Show the problematic code
```

### Recommended Fix
```typescript
// Show the corrected code
```

### Impact
- Security: High/Medium/Low
- Performance: High/Medium/Low
- Maintainability: High/Medium/Low

### Effort
Estimated time to fix: 30 minutes / 2 hours / 1 day
```

## Severity Definitions
- **CRITICAL**: Security vulnerability, data loss risk, system crash
- **HIGH**: Significant bug, major performance issue, architectural flaw
- **MEDIUM**: Code quality issue, minor bug, technical debt
- **LOW**: Style issue, minor optimization, documentation gap

## Priority Ranking
Please rank all issues by priority (1-10) considering:
1. Security impact
2. User impact
3. Fix difficulty
4. Blast radius

## Key Files to Focus On

### High-impact files:
- `server/index.ts` (entry point, middleware setup)
- `server/routes.ts` (5500+ lines - API registry)
- `server/storage.ts` (1800+ lines - data access layer)
- `shared/schema.ts` (3589 lines - single source of truth)
- `server/middleware/auth.ts` (authorization)
- `server/middleware/security.ts` (security middleware)
- `server/events/EventBus.ts` (event system)
- `server/queue/config.ts` (background jobs)
- `client/src/hooks/` (data fetching patterns)

### Entry points to trace:
- User authentication flow
- Order creation flow (includes events, workers, PDF generation)
- Payment processing (server/routes/payments.ts)
- AI/ML inference (server/routes/aiEngine.ts)
- Analytics processing (python-service/)

## Success Criteria
- All CRITICAL issues identified with fixes
- Top 20 HIGH priority issues documented
- Quick wins highlighted (low effort, high impact)
- Architectural recommendations provided
- Testing strategy improvements suggested
- Performance optimization roadmap

## Start Here
Begin by examining the authentication and authorization flows, then move to data access patterns, then API endpoints, then frontend components.
