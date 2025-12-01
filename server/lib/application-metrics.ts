/**
 * Application-Level Metrics
 *
 * Provides business KPI metrics and system health monitoring using Prometheus.
 *
 * Metrics Categories:
 * - HTTP: Request counts, latencies, error rates by endpoint
 * - Business: Orders, revenue, patients, prescriptions
 * - Database: Query latency, connection pool, slow queries
 * - Cache: Hit/miss ratios, response times
 * - External Services: AI, payment, email service health
 *
 * @module server/lib/application-metrics
 */

import client from 'prom-client';
import { register } from './metrics';
import { createLogger } from '../utils/logger';

const logger = createLogger('ApplicationMetrics');
const enabled = process.env.METRICS_ENABLED === 'true';

// ============================================
// HTTP METRICS
// ============================================

/**
 * HTTP request counter by method, path, and status
 */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
  registers: enabled ? [register] : [],
});

/**
 * HTTP request duration histogram
 */
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: enabled ? [register] : [],
});

/**
 * Active HTTP requests gauge
 */
export const httpActiveRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  registers: enabled ? [register] : [],
});

/**
 * HTTP error rate (5xx responses)
 */
export const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors (5xx)',
  labelNames: ['method', 'path', 'error_type'],
  registers: enabled ? [register] : [],
});

// ============================================
// BUSINESS METRICS
// ============================================

/**
 * Orders processed counter
 */
export const ordersProcessedTotal = new client.Counter({
  name: 'business_orders_processed_total',
  help: 'Total number of orders processed',
  labelNames: ['status', 'type'],
  registers: enabled ? [register] : [],
});

/**
 * Revenue gauge (current period)
 */
export const revenueGauge = new client.Gauge({
  name: 'business_revenue_total',
  help: 'Total revenue in current period (pence/cents)',
  labelNames: ['currency', 'period'],
  registers: enabled ? [register] : [],
});

/**
 * Active patients gauge
 */
export const activePatientsGauge = new client.Gauge({
  name: 'business_active_patients',
  help: 'Number of active patients',
  labelNames: ['tenant_id'],
  registers: enabled ? [register] : [],
});

/**
 * Prescriptions issued counter
 */
export const prescriptionsIssuedTotal = new client.Counter({
  name: 'business_prescriptions_issued_total',
  help: 'Total number of prescriptions issued',
  labelNames: ['type'],
  registers: enabled ? [register] : [],
});

/**
 * Examinations completed counter
 */
export const examinationsCompletedTotal = new client.Counter({
  name: 'business_examinations_completed_total',
  help: 'Total number of eye examinations completed',
  labelNames: ['type', 'practitioner_type'],
  registers: enabled ? [register] : [],
});

/**
 * Inventory levels gauge
 */
export const inventoryLevelGauge = new client.Gauge({
  name: 'business_inventory_level',
  help: 'Current inventory level by category',
  labelNames: ['category', 'status'],
  registers: enabled ? [register] : [],
});

/**
 * Low stock alerts counter
 */
export const lowStockAlertsTotal = new client.Counter({
  name: 'business_low_stock_alerts_total',
  help: 'Total number of low stock alerts triggered',
  labelNames: ['category'],
  registers: enabled ? [register] : [],
});

// ============================================
// DATABASE METRICS
// ============================================

/**
 * Database query duration histogram
 */
export const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: enabled ? [register] : [],
});

/**
 * Database connection pool gauge
 */
export const dbConnectionPoolGauge = new client.Gauge({
  name: 'db_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['status'],
  registers: enabled ? [register] : [],
});

/**
 * Slow queries counter
 */
export const dbSlowQueriesTotal = new client.Counter({
  name: 'db_slow_queries_total',
  help: 'Total number of slow queries (>1s)',
  labelNames: ['operation'],
  registers: enabled ? [register] : [],
});

/**
 * Database errors counter
 */
export const dbErrorsTotal = new client.Counter({
  name: 'db_errors_total',
  help: 'Total number of database errors',
  labelNames: ['error_type'],
  registers: enabled ? [register] : [],
});

// ============================================
// CACHE METRICS
// ============================================

/**
 * Cache operations counter
 */
export const cacheOperationsTotal = new client.Counter({
  name: 'cache_operations_total',
  help: 'Total cache operations',
  labelNames: ['operation', 'result'],
  registers: enabled ? [register] : [],
});

/**
 * Cache hit ratio gauge
 */
export const cacheHitRatioGauge = new client.Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio (0-1)',
  registers: enabled ? [register] : [],
});

// ============================================
// EXTERNAL SERVICE METRICS
// ============================================

/**
 * External service request duration
 */
export const externalServiceDuration = new client.Histogram({
  name: 'external_service_duration_seconds',
  help: 'External service request duration',
  labelNames: ['service', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: enabled ? [register] : [],
});

/**
 * External service errors counter
 */
export const externalServiceErrorsTotal = new client.Counter({
  name: 'external_service_errors_total',
  help: 'Total external service errors',
  labelNames: ['service', 'error_type'],
  registers: enabled ? [register] : [],
});

/**
 * AI service usage counter
 */
export const aiServiceUsageTotal = new client.Counter({
  name: 'ai_service_usage_total',
  help: 'Total AI service API calls',
  labelNames: ['provider', 'model', 'operation'],
  registers: enabled ? [register] : [],
});

/**
 * AI tokens consumed counter
 */
export const aiTokensConsumedTotal = new client.Counter({
  name: 'ai_tokens_consumed_total',
  help: 'Total AI tokens consumed',
  labelNames: ['provider', 'model', 'type'],
  registers: enabled ? [register] : [],
});

// ============================================
// AUDIT/COMPLIANCE METRICS
// ============================================

/**
 * PHI access counter
 */
export const phiAccessTotal = new client.Counter({
  name: 'compliance_phi_access_total',
  help: 'Total PHI data accesses',
  labelNames: ['resource_type', 'action'],
  registers: enabled ? [register] : [],
});

/**
 * Authentication events counter
 */
export const authEventsTotal = new client.Counter({
  name: 'security_auth_events_total',
  help: 'Total authentication events',
  labelNames: ['event_type', 'result'],
  registers: enabled ? [register] : [],
});

/**
 * Rate limit hits counter
 */
export const rateLimitHitsTotal = new client.Counter({
  name: 'security_rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['endpoint', 'limit_type'],
  registers: enabled ? [register] : [],
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number
): void {
  if (!enabled) return;

  const normalizedPath = normalizePath(path);
  const durationSec = durationMs / 1000;

  httpRequestsTotal.labels(method, normalizedPath, String(statusCode)).inc();
  httpRequestDuration.labels(method, normalizedPath, String(statusCode)).observe(durationSec);

  if (statusCode >= 500) {
    httpErrorsTotal.labels(method, normalizedPath, 'server_error').inc();
  }
}

/**
 * Record database query metrics
 */
export function recordDbQuery(
  operation: string,
  table: string,
  durationMs: number
): void {
  if (!enabled) return;

  const durationSec = durationMs / 1000;
  dbQueryDuration.labels(operation, table).observe(durationSec);

  if (durationMs > 1000) {
    dbSlowQueriesTotal.labels(operation).inc();
    logger.warn({ operation, table, durationMs }, 'Slow database query detected');
  }
}

/**
 * Record external service call
 */
export function recordExternalService(
  service: string,
  operation: string,
  durationMs: number,
  error?: string
): void {
  if (!enabled) return;

  externalServiceDuration.labels(service, operation).observe(durationMs / 1000);

  if (error) {
    externalServiceErrorsTotal.labels(service, error).inc();
  }
}

/**
 * Record AI usage
 */
export function recordAiUsage(
  provider: string,
  model: string,
  operation: string,
  inputTokens: number,
  outputTokens: number
): void {
  if (!enabled) return;

  aiServiceUsageTotal.labels(provider, model, operation).inc();
  aiTokensConsumedTotal.labels(provider, model, 'input').inc(inputTokens);
  aiTokensConsumedTotal.labels(provider, model, 'output').inc(outputTokens);
}

/**
 * Record business event
 */
export function recordBusinessEvent(
  event: 'order' | 'prescription' | 'examination' | 'patient',
  details: Record<string, string>
): void {
  if (!enabled) return;

  switch (event) {
    case 'order':
      ordersProcessedTotal.labels(details.status || 'unknown', details.type || 'standard').inc();
      break;
    case 'prescription':
      prescriptionsIssuedTotal.labels(details.type || 'optical').inc();
      break;
    case 'examination':
      examinationsCompletedTotal.labels(
        details.type || 'routine',
        details.practitionerType || 'optometrist'
      ).inc();
      break;
  }
}

/**
 * Record PHI access for compliance
 */
export function recordPhiAccess(resourceType: string, action: string): void {
  if (!enabled) return;
  phiAccessTotal.labels(resourceType, action).inc();
}

/**
 * Record authentication event
 */
export function recordAuthEvent(eventType: string, result: 'success' | 'failure'): void {
  if (!enabled) return;
  authEventsTotal.labels(eventType, result).inc();
}

/**
 * Normalize path for metrics (remove IDs to prevent cardinality explosion)
 */
function normalizePath(path: string): string {
  return path
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Limit path depth
    .split('/').slice(0, 5).join('/');
}

/**
 * Update connection pool metrics
 */
export function updateConnectionPool(active: number, idle: number, waiting: number): void {
  if (!enabled) return;
  dbConnectionPoolGauge.labels('active').set(active);
  dbConnectionPoolGauge.labels('idle').set(idle);
  dbConnectionPoolGauge.labels('waiting').set(waiting);
}

/**
 * Update cache hit ratio
 */
export function updateCacheHitRatio(hits: number, misses: number): void {
  if (!enabled) return;
  const total = hits + misses;
  if (total > 0) {
    cacheHitRatioGauge.set(hits / total);
  }
}

// ============================================
// METRICS COLLECTION MIDDLEWARE
// ============================================

import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware to collect HTTP metrics
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!enabled) return next();

    const startTime = Date.now();
    httpActiveRequests.inc();

    res.on('finish', () => {
      httpActiveRequests.dec();
      const duration = Date.now() - startTime;
      recordHttpRequest(req.method, req.path, res.statusCode, duration);
    });

    next();
  };
}

// ============================================
// HEALTH CHECK SERVICE
// ============================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    externalServices: ComponentHealth;
  };
  uptime: number;
  timestamp: string;
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
  lastCheck?: string;
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalServices: await checkExternalServices(),
  };

  // Determine overall status
  const statuses = Object.values(checks).map(c => c.status);
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (statuses.includes('down')) {
    overallStatus = 'unhealthy';
  } else if (statuses.includes('degraded')) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<ComponentHealth> {
  try {
    const start = Date.now();
    // Import dynamically to avoid circular deps
    const { db, isDatabaseAvailable } = await import('../db');
    const { sql } = await import('drizzle-orm');

    if (!isDatabaseAvailable()) {
      return { status: 'down', message: 'Database not configured' };
    }

    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - start;

    if (latencyMs > 1000) {
      return { status: 'degraded', latencyMs, message: 'High latency' };
    }

    return { status: 'up', latencyMs, lastCheck: new Date().toISOString() };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<ComponentHealth> {
  try {
    const start = Date.now();
    const { getRedisConnection } = await import('../queue/config');
    const redis = getRedisConnection();

    if (!redis) {
      return { status: 'down', message: 'Redis not configured' };
    }

    await redis.ping();
    const latencyMs = Date.now() - start;

    if (latencyMs > 100) {
      return { status: 'degraded', latencyMs, message: 'High latency' };
    }

    return { status: 'up', latencyMs, lastCheck: new Date().toISOString() };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check external services health
 */
async function checkExternalServices(): Promise<ComponentHealth> {
  // This would check Stripe, AI providers, email service, etc.
  // For now, return a basic status
  return {
    status: 'up',
    message: 'External services not individually checked',
    lastCheck: new Date().toISOString(),
  };
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  // HTTP
  recordHttpRequest,
  metricsMiddleware,
  // Database
  recordDbQuery,
  updateConnectionPool,
  // External
  recordExternalService,
  recordAiUsage,
  // Business
  recordBusinessEvent,
  // Compliance
  recordPhiAccess,
  recordAuthEvent,
  // Cache
  updateCacheHitRatio,
  // Health
  performHealthCheck,
};
