/**
 * Performance Monitoring Middleware
 * Tracks API response times, database queries, and system metrics
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import type { AuthenticatedRequest } from './auth';

// Performance metrics storage (in-memory, will move to Redis/DB later)
interface PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  companyId?: string;
  userId?: string;
  queryCount?: number;
  queriesDuration?: number;
  cacheHit?: boolean;
}

interface QueryMetric {
  query: string;
  duration: number;
  timestamp: Date;
  endpoint?: string;
}

// In-memory storage (replace with Redis in production)
const metricsBuffer: PerformanceMetric[] = [];
const slowQueries: QueryMetric[] = [];
const MAX_BUFFER_SIZE = 1000;
const SLOW_QUERY_THRESHOLD = 100; // ms
const SLOW_REQUEST_THRESHOLD = 1000; // ms

/**
 * Request performance monitoring middleware
 * Tracks response time and status for each request
 */
export const performanceMonitoring = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = performance.now();
  const startDate = new Date();

  // Track query count and duration
  let queryCount = 0;
  let queriesDuration = 0;

  // Store original send to capture response
  const originalSend = res.send;
  const originalJson = res.json;

  // Capture when response is sent
  res.send = function (data: any) {
    const duration = performance.now() - startTime;
    logPerformanceMetric(req, res, duration, startDate, queryCount, queriesDuration);
    return originalSend.call(this, data);
  };

  res.json = function (data: any) {
    const duration = performance.now() - startTime;
    logPerformanceMetric(req, res, duration, startDate, queryCount, queriesDuration);
    return originalJson.call(this, data);
  };

  // Attach query counter to request
  (req as any).trackQuery = (duration: number) => {
    queryCount++;
    queriesDuration += duration;
  };

  next();
};

/**
 * Log performance metric
 */
function logPerformanceMetric(
  req: AuthenticatedRequest,
  res: Response,
  duration: number,
  timestamp: Date,
  queryCount: number,
  queriesDuration: number
) {
  const metric: PerformanceMetric = {
    endpoint: req.path,
    method: req.method,
    statusCode: res.statusCode,
    duration: Math.round(duration),
    timestamp,
    companyId: req.user?.companyId,
    userId: req.user?.id,
    queryCount: queryCount || undefined,
    queriesDuration: queriesDuration > 0 ? Math.round(queriesDuration) : undefined,
  };

  // Add to buffer
  metricsBuffer.push(metric);
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift(); // Remove oldest
  }

  // Log slow requests
  if (duration > SLOW_REQUEST_THRESHOLD) {
    console.warn('⚠️  Slow request detected:', {
      endpoint: `${req.method} ${req.path}`,
      duration: `${duration.toFixed(2)}ms`,
      queryCount,
      queriesDuration: queriesDuration > 0 ? `${queriesDuration.toFixed(2)}ms` : undefined,
      companyId: req.user?.companyId,
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = duration > SLOW_REQUEST_THRESHOLD ? '🐌' : duration > 500 ? '⚡' : '✅';
    console.log(
      `${emoji} ${req.method} ${req.path} - ${duration.toFixed(2)}ms` +
      (queryCount > 0 ? ` (${queryCount} queries, ${queriesDuration.toFixed(2)}ms)` : '')
    );
  }
}

/**
 * Track database query performance
 */
export function trackQuery(query: string, duration: number, endpoint?: string) {
  const metric: QueryMetric = {
    query: query.substring(0, 200), // Truncate long queries
    duration: Math.round(duration),
    timestamp: new Date(),
    endpoint,
  };

  if (duration > SLOW_QUERY_THRESHOLD) {
    slowQueries.push(metric);
    if (slowQueries.length > MAX_BUFFER_SIZE) {
      slowQueries.shift();
    }

    console.warn('⚠️  Slow query detected:', {
      query: metric.query,
      duration: `${duration.toFixed(2)}ms`,
      endpoint,
    });
  }
}

/**
 * Get performance statistics
 */
export function getPerformanceStats() {
  if (metricsBuffer.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorRate: 0,
    };
  }

  const totalRequests = metricsBuffer.length;
  const averageResponseTime =
    metricsBuffer.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
  const slowRequests = metricsBuffer.filter(m => m.duration > SLOW_REQUEST_THRESHOLD).length;
  const errorRequests = metricsBuffer.filter(m => m.statusCode >= 400).length;
  const errorRate = (errorRequests / totalRequests) * 100;

  // Group by endpoint
  const endpointStats = metricsBuffer.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        errors: 0,
      };
    }
    acc[key].count++;
    acc[key].totalDuration += metric.duration;
    acc[key].maxDuration = Math.max(acc[key].maxDuration, metric.duration);
    acc[key].minDuration = Math.min(acc[key].minDuration, metric.duration);
    if (metric.statusCode >= 400) {
      acc[key].errors++;
    }
    return acc;
  }, {} as Record<string, any>);

  // Top 10 slowest endpoints
  const slowestEndpoints = Object.entries(endpointStats)
    .map(([endpoint, stats]: [string, any]) => ({
      endpoint,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      maxDuration: Math.round(stats.maxDuration),
      count: stats.count,
      errorRate: ((stats.errors / stats.count) * 100).toFixed(2),
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime),
    slowRequests,
    errorRate: errorRate.toFixed(2),
    slowestEndpoints,
    recentSlowQueries: slowQueries.slice(-10),
  };
}

/**
 * Get metrics for specific time window
 */
export function getMetricsWindow(minutesAgo: number = 5) {
  const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000);
  const recentMetrics = metricsBuffer.filter(m => m.timestamp >= cutoff);

  if (recentMetrics.length === 0) {
    return {
      requests: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
    };
  }

  const sortedDurations = recentMetrics
    .map(m => m.duration)
    .sort((a, b) => a - b);

  const p95Index = Math.floor(sortedDurations.length * 0.95);
  const p99Index = Math.floor(sortedDurations.length * 0.99);

  const errors = recentMetrics.filter(m => m.statusCode >= 400).length;

  return {
    requests: recentMetrics.length,
    avgResponseTime: Math.round(
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
    ),
    p95ResponseTime: Math.round(sortedDurations[p95Index] || 0),
    p99ResponseTime: Math.round(sortedDurations[p99Index] || 0),
    errorRate: ((errors / recentMetrics.length) * 100).toFixed(2),
  };
}

/**
 * Clear old metrics (cleanup job)
 */
export function clearOldMetrics(hoursAgo: number = 24) {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  // Remove old metrics
  const beforeSize = metricsBuffer.length;
  for (let i = metricsBuffer.length - 1; i >= 0; i--) {
    if (metricsBuffer[i].timestamp < cutoff) {
      metricsBuffer.splice(i, 1);
    }
  }

  // Remove old slow queries
  const beforeSlowSize = slowQueries.length;
  for (let i = slowQueries.length - 1; i >= 0; i--) {
    if (slowQueries[i].timestamp < cutoff) {
      slowQueries.splice(i, 1);
    }
  }

  console.log(`🧹 Cleaned up ${beforeSize - metricsBuffer.length} old metrics and ${beforeSlowSize - slowQueries.length} old slow queries`);
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024), // MB
  };
}

/**
 * System health check
 */
export function getSystemHealth() {
  const mem = getMemoryUsage();
  const stats = getPerformanceStats();
  const recent = getMetricsWindow(5);

  return {
    status: recent.errorRate > 10 || recent.avgResponseTime > 2000 ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    memory: mem,
    performance: {
      last5Minutes: recent,
      overall: {
        totalRequests: stats.totalRequests,
        avgResponseTime: stats.averageResponseTime,
        errorRate: stats.errorRate,
      },
    },
  };
}

/**
 * Export metrics for Prometheus/monitoring systems
 */
export function getPrometheusMetrics() {
  const stats = getPerformanceStats();
  const mem = getMemoryUsage();
  const recent = getMetricsWindow(5);

  return `
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total ${stats.totalRequests}

# HELP api_request_duration_ms Average API request duration in milliseconds
# TYPE api_request_duration_ms gauge
api_request_duration_ms ${stats.averageResponseTime}

# HELP api_request_duration_p95_ms 95th percentile API request duration
# TYPE api_request_duration_p95_ms gauge
api_request_duration_p95_ms ${recent.p95ResponseTime}

# HELP api_request_duration_p99_ms 99th percentile API request duration
# TYPE api_request_duration_p99_ms gauge
api_request_duration_p99_ms ${recent.p99ResponseTime}

# HELP api_error_rate API error rate percentage
# TYPE api_error_rate gauge
api_error_rate ${stats.errorRate}

# HELP api_slow_requests_total Total number of slow requests
# TYPE api_slow_requests_total counter
api_slow_requests_total ${stats.slowRequests}

# HELP process_heap_bytes Process heap memory in bytes
# TYPE process_heap_bytes gauge
process_heap_bytes ${mem.heapUsed * 1024 * 1024}

# HELP process_rss_bytes Process RSS memory in bytes
# TYPE process_rss_bytes gauge
process_rss_bytes ${mem.rss * 1024 * 1024}
`.trim();
}
