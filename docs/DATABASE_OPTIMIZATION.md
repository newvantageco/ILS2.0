# Database Optimization Guide

## Overview

ILS 2.0 uses PostgreSQL with Drizzle ORM. This guide covers database optimization strategies, monitoring, and best practices.

## Architecture

```
db/
├── index.ts              # Connection pool configuration
├── queryOptimizer.ts     # Query monitoring and caching
├── healthMonitor.ts      # Database health monitoring
├── preparedStatements.ts # Optimized query patterns
└── replicas.ts           # Read replica configuration
```

## Connection Pooling

### Configuration

The connection pool is configured in `db/index.ts`:

```typescript
new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || "20"),
  min: parseInt(process.env.DB_POOL_MIN || "5"),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500,
});
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Required | PostgreSQL connection string |
| `DB_POOL_MAX` | 20 | Maximum connections in pool |
| `DB_POOL_MIN` | 5 | Minimum connections in pool |
| `APP_NAME` | IntegratedLensSystem | Application name for monitoring |

### Scaling Guidelines

| Concurrent Users | DB_POOL_MAX | Notes |
|-----------------|-------------|-------|
| 1-100 | 10-20 | Development/small deployments |
| 100-500 | 20-50 | Standard production |
| 500-2000 | 50-100 | High-traffic production |
| 2000+ | 100+ + Read replicas | Enterprise scale |

## Query Optimization

### Query Optimizer

The `queryOptimizer` provides automatic query monitoring:

```typescript
import { optimizedRead, optimizedWrite } from './db/queryOptimizer';

// Read with caching
const orders = await optimizedRead(
  tenantId,
  'orders:active',
  () => db.select().from(orders).where(eq(orders.status, 'active')),
  { cacheTTL: 300 }
);

// Write with monitoring
await optimizedWrite(tenantId, () =>
  db.insert(orders).values(orderData)
);
```

### Prepared Statements

Use the prepared statement utilities for common queries:

```typescript
import { orderQueries, patientQueries } from './db/preparedStatements';

// Optimized order queries
const recentOrders = await orderQueries.recent(tenantId, 7);
const orderStats = await orderQueries.countByStatus(tenantId);

// Optimized patient queries
const patients = await patientQueries.searchByName(tenantId, 'Smith');
```

## Indexing Strategy

### Core Indexes

All multi-tenant tables have:
- `company_id` index for tenant isolation
- Compound index on `company_id` + most filtered column
- Partial indexes for common query patterns

### Key Indexes

```sql
-- Orders
CREATE INDEX idx_orders_company_status ON orders(company_id, status);
CREATE INDEX idx_orders_company_created ON orders(company_id, created_at DESC);

-- Patients
CREATE INDEX idx_patients_company_name ON patients(company_id, last_name, first_name);
CREATE INDEX idx_patients_search USING gin(to_tsvector('english', ...));

-- Appointments
CREATE INDEX idx_appointments_company_date ON appointment_bookings(company_id, start_time)
  WHERE status NOT IN ('cancelled', 'no_show');
```

### Adding New Indexes

When adding indexes:
1. Use `CONCURRENTLY` to avoid table locks
2. Test on staging with production-like data
3. Monitor index usage after deployment
4. Remove unused indexes (they slow writes)

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_new_index ON table(column);
```

## Health Monitoring

### Health Check API

```typescript
import { dbHealthMonitor, checkDatabaseHealth } from './db/healthMonitor';

// Quick health check
const { ok, message } = await checkDatabaseHealth();

// Full health report
const health = await dbHealthMonitor.runHealthCheck();
console.log({
  status: health.status,
  poolUtilization: health.pool.utilizationPercent,
  slowQueries: health.queryStats.slowQueries,
  issues: health.issues,
});
```

### Metrics

Available metrics:
- **Pool Metrics**: utilization, idle/active connections, waiting clients
- **Query Stats**: total, slow, cached, avg/p95 execution time
- **Table Stats**: row counts, dead tuples, vacuum status
- **Index Stats**: scans, unused indexes

### Starting Monitoring

```typescript
// Start automatic monitoring (every 60s)
dbHealthMonitor.startMonitoring(60000);

// Stop monitoring
dbHealthMonitor.stopMonitoring();
```

## Performance Best Practices

### 1. Always Use Tenant Filtering

```typescript
// GOOD: Tenant-scoped query
const orders = await db.select()
  .from(orders)
  .where(and(
    eq(orders.companyId, tenantId),
    eq(orders.status, 'pending')
  ));

// BAD: Missing tenant filter (security risk + slow)
const orders = await db.select()
  .from(orders)
  .where(eq(orders.status, 'pending'));
```

### 2. Use Pagination

```typescript
// GOOD: Paginated results
const orders = await db.select()
  .from(orders)
  .where(eq(orders.companyId, tenantId))
  .limit(50)
  .offset(page * 50);

// BAD: Fetching all records
const orders = await db.select()
  .from(orders)
  .where(eq(orders.companyId, tenantId));
```

### 3. Select Only Needed Columns

```typescript
// GOOD: Specific columns
const orderSummary = await db.select({
  id: orders.id,
  status: orders.status,
  total: orders.total,
}).from(orders);

// BAD: Selecting everything
const orders = await db.select().from(orders);
```

### 4. Use Batch Operations

```typescript
import { batchInsert } from './db/preparedStatements';

// GOOD: Batched insert
await batchInsert(orders, largeOrderArray, { chunkSize: 100 });

// BAD: Individual inserts in loop
for (const order of largeOrderArray) {
  await db.insert(orders).values(order);
}
```

### 5. Cache Expensive Queries

```typescript
import { optimizedRead } from './db/queryOptimizer';

// Cache dashboard statistics
const stats = await optimizedRead(
  tenantId,
  'dashboard:stats',
  () => calculateDashboardStats(tenantId),
  { cacheTTL: 300 } // 5 minutes
);
```

## Troubleshooting

### High Connection Pool Usage

1. Check for connection leaks (queries not releasing connections)
2. Review slow queries hogging connections
3. Increase `DB_POOL_MAX` if appropriate
4. Consider read replicas for read-heavy workloads

### Slow Queries

1. Check `EXPLAIN ANALYZE` for the query
2. Look for sequential scans (missing index)
3. Check for high row counts (add pagination)
4. Review join strategies

```typescript
const plan = await queryOptimizer.explainQuery(slowQuery);
console.log(plan.recommendations);
```

### Index Recommendations

```typescript
const recommendations = await queryOptimizer.analyzeIndexes();
for (const rec of recommendations) {
  console.log(`${rec.table}.${rec.columns.join(', ')}: ${rec.reason}`);
}
```

## Migration Best Practices

1. **Use transactions** for data migrations
2. **Create indexes concurrently** to avoid locks
3. **Test on staging** with production-sized data
4. **Have rollback plan** for every migration
5. **Monitor after deployment** for performance regressions

## Related Documentation

- [Row-Level Security](./INTERNAL_METHOD_MIGRATION.md)
- [Repository Pattern](./ROUTE_ORGANIZATION.md)
- [API Documentation](./API.md)
