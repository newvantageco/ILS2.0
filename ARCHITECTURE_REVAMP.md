# Architecture Revamp - "Boring Infrastructure" Migration

**Date**: November 25, 2025  
**Goal**: Move from "Clever" (fragile, custom) to "Boring" (standard, robust)

## Summary of Changes

### 1. ✅ Simplified `server/db.ts`

**Before**: Conditional logic switching between Neon and pg drivers based on URL patterns  
**After**: Single standard `pg` Pool driver for all environments

```typescript
// Now just standard pooling - environment controls database via DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

**Note**: Neon's PgBouncer endpoint works with standard pg driver - no special SDK needed.

### 2. ✅ Neutered `DatabaseOptimizer.ts`

**Removed dangerous operations**:
- `applyAutomaticOptimizations()` - now warns and returns empty
- `createOptimizedIndexes()` - now warns and suggests Drizzle Kit

**Changed from ALTER SYSTEM to infrastructure comments**:
- Recommendations no longer suggest `ALTER SYSTEM SET` commands
- Now direct to docker-compose.yml or Railway dashboard

**Added Prometheus-ready metrics**:
```typescript
getMetricsForPrometheus(): Record<string, number>
// Returns: db_total_connections, db_cache_hit_ratio, db_slow_queries_count, etc.
```

### 3. ✅ Removed Custom Migration Runner

**Archived**: `scripts/run-sql-migrations.ts` → `archive/legacy-scripts/`

**New workflow using Drizzle Kit**:
```bash
# Modify schema in shared/schema.ts, then:
npm run db:generate  # Creates SQL migration files
npm run db:migrate   # Applies migrations safely
npm run db:push      # Direct push for development
npm run db:studio    # GUI for database inspection
```

### 4. ✅ Infrastructure-as-Code for Database Tuning

**docker-compose.yml** - Production settings:
```yaml
command:
  - "postgres"
  - "-c" 
  - "max_connections=200"
  - "-c"
  - "shared_buffers=256MB"
  - "-c"
  - "effective_cache_size=768MB"
  - "-c"
  - "work_mem=16MB"
  - "-c"
  - "log_min_duration_statement=1000"
```

**docker-compose.dev.yml** - Development settings:
```yaml
command:
  - "postgres"
  - "-c" 
  - "max_connections=100"
  - "-c"
  - "shared_buffers=128MB"
  - "-c"
  - "log_statement=all"  # Verbose for debugging
```

### 5. ✅ Removed Unused Dependency

- Removed `@neondatabase/serverless` from package.json
- Standard `pg` package handles all PostgreSQL connections

---

## Migration Guide

### For Developers

1. **Schema Changes**: Edit `shared/schema.ts`, then run:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

2. **Local Development**: Use `docker-compose.dev.yml` - tuning is automatic

3. **Do NOT**:
   - Call `databaseOptimizer.applyAutomaticOptimizations()` - deprecated
   - Call `databaseOptimizer.createOptimizedIndexes()` - deprecated
   - Use ALTER SYSTEM in any application code

### For Infrastructure/DevOps

1. **Database Tuning**: Modify `docker-compose.yml` postgres command args
2. **Railway**: Set environment variables in Railway dashboard
3. **Monitoring**: Use `databaseOptimizer.getMetricsForPrometheus()` for Grafana

---

## Build Verification

```
✓ Build succeeded
✓ dist/index.js (3.7mb)
✓ All lint errors fixed
```

---

## Benefits

| Before | After |
|--------|-------|
| Custom migration runner | Drizzle Kit (battle-tested) |
| App-level DB tuning | Infrastructure-as-Code |
| Conditional driver logic | Single standard driver |
| Markdown reports | Prometheus metrics |
| "Clever" | "Boring" ✅ |
