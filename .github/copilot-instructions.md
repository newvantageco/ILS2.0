# Copilot Instructions for Integrated Lens System (ILS)

## Project Architecture
This is a multi-tenant enterprise optical lab management platform with complex authentication and AI services.

**Key Stack**: React/TypeScript + Node.js/Express + PostgreSQL (Neon) + Drizzle ORM  
**Unique Features**: Dual AI systems, multi-tenant data isolation, OMA file processing, PDF generation

## Development Workflow

Start development servers:
```bash
npm run dev  # Uses start-dev.mjs - starts both Node.js (port 5000) and Python services (port 8000)
```

Critical: Both services must run together for AI features. Frontend proxy to `/api/*` routes to Node.js backend.

**Database operations:**
```bash
npm run db:push  # Push schema changes (uses Drizzle)
```

**Testing:**
```bash
npm run test:all  # Runs unit, integration, component, and e2e tests
./test-ai-integration.mjs  # AI-specific integration tests
./test-multi-tenancy.sh  # Multi-tenant isolation tests
```

## Authentication & Multi-Tenancy

**CRITICAL**: Every database query MUST include company filtering for multi-tenant isolation.

```typescript
// ✅ Correct - Always filter by company
const orders = await db.select().from(ordersTable).where(eq(ordersTable.companyId, user.companyId));

// ❌ Wrong - Missing company filter
const orders = await db.select().from(ordersTable);
```

Authentication supports both Replit Auth (OpenID Connect) and local email/password. Session-based with 7-day TTL.

Role hierarchy: `platform_admin` > `company_admin` > `admin` > `ecp|lab_tech|engineer|supplier`

## AI Architecture (Critical)

Two distinct AI systems running simultaneously:

1. **Master AI Service** (`/api/master-ai/*`) - Chat interface, RAG, document processing
2. **Platform AI Service** (`/api/platform-ai/*`) - Analytics, insights, Python-based ML

**Testing AI features:** Always verify tenant isolation - queries from Company A must never return Company B data.

## File Structure Patterns

- `shared/schema.ts` - Single source of truth for all database schemas and Zod validation
- `client/src/pages/` - Page components with role-based access patterns  
- `server/routes/` - Organized by feature (orders, auth, ai, etc.)
- `server/storage/` - Database access layer with company filtering
- `python-service/` - Separate service for ML/analytics

## Critical Code Patterns

**Zod Validation**: All API endpoints use schemas from `shared/schema.ts`
```typescript
const result = insertOrderSchema.parse(req.body);
```

**Role-based Access**: Check user roles before sensitive operations
```typescript
if (!["admin", "company_admin"].includes(user.role)) {
  return res.status(403).json({ error: "Insufficient permissions" });
}
```

**OMA File Processing**: Use `parseOMAFile()` from `@shared/omaParser` for prescription data

**PDF Generation**: Multiple services - `pdfService`, `labWorkTicketService`, `examinationFormService`

## Testing Conventions

- AI features: Test multi-tenant isolation first
- Authentication: Verify session management and role enforcement  
- Database: Always test company data separation
- File uploads: Test tenant-specific storage isolation

## Environment Variables

Required for development:
- `DATABASE_URL` - Neon PostgreSQL connection
- `SESSION_SECRET` - Session encryption  
- `ADMIN_SETUP_KEY` - Bootstrap admin account
- Optional: `MASTER_USER_*` variables for platform admin account

## Critical Gotchas

1. **Never trust client-provided tenant/company IDs** - Always extract from authenticated session
2. **AI queries are cached** - Clear cache when testing with identical questions
3. **Python service dependency** - Platform AI features fail silently without Python service running
4. **Drizzle schema changes** - Run `db:push` after modifying `shared/schema.ts`
5. **Multi-service startup** - Use `npm run dev`, not individual service commands

## Emergency Debugging

- Check `python-service` logs if AI analytics fail
- Verify session cookies for authentication issues
- Test company isolation: create users in different companies, verify data separation
- AI cache: Clear with `POST /api/platform-ai/clear-cache`