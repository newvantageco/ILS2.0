/**
 * Per-Company Metrics Collection Service
 * Tracks response times, error rates, and resource usage per company
 * Essential for monitoring at scale with thousands of companies
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/CacheService';

interface RequestMetrics {
  timestamp: number;
  duration: number;
  statusCode: number;
  method: string;
  path: string;
  error?: string;
}

interface CompanyMetrics {
  requestCount: number;
  errorCount: number;
  totalDuration: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  lastUpdated: number;
}

interface AggregatedMetrics {
  lastHour: CompanyMetrics;
  last24Hours: CompanyMetrics;
  last7Days: CompanyMetrics;
}

class MetricsCollectorService {
  private readonly METRICS_BUFFER_SIZE = 1000;
  private readonly METRICS_FLUSH_INTERVAL = 60000; // 1 minute
  private metricsBuffer: Map<string, RequestMetrics[]> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushTimer();
  }

  /**
   * Record a request metric
   */
  recordRequest(
    companyId: string,
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    error?: string
  ): void {
    const metric: RequestMetrics = {
      timestamp: Date.now(),
      duration,
      statusCode,
      method,
      path,
      error,
    };

    if (!this.metricsBuffer.has(companyId)) {
      this.metricsBuffer.set(companyId, []);
    }

    const buffer = this.metricsBuffer.get(companyId)!;
    buffer.push(metric);

    // Prevent memory bloat
    if (buffer.length > this.METRICS_BUFFER_SIZE) {
      buffer.shift();
    }
  }

  /**
   * Calculate metrics from raw data
   */
  private calculateMetrics(metrics: RequestMetrics[]): CompanyMetrics {
    if (metrics.length === 0) {
      return {
        requestCount: 0,
        errorCount: 0,
        totalDuration: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        lastUpdated: Date.now(),
      };
    }

    const requestCount = metrics.length;
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const avgResponseTime = totalDuration / requestCount;

    // Calculate percentiles
    const sortedDurations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);
    const p95ResponseTime = sortedDurations[p95Index] || 0;
    const p99ResponseTime = sortedDurations[p99Index] || 0;

    const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

    // Calculate requests per minute
    const timeRange = metrics[metrics.length - 1].timestamp - metrics[0].timestamp;
    const minutes = timeRange / 60000;
    const requestsPerMinute = minutes > 0 ? requestCount / minutes : 0;

    return {
      requestCount,
      errorCount,
      totalDuration,
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Filter metrics by time window
   */
  private filterByTimeWindow(metrics: RequestMetrics[], windowMs: number): RequestMetrics[] {
    const cutoff = Date.now() - windowMs;
    return metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get metrics for a company
   */
  async getCompanyMetrics(companyId: string): Promise<AggregatedMetrics | null> {
    try {
      // Try to get from cache first
      const cached = await cacheService.get<AggregatedMetrics>(companyId, 'metrics', {
        namespace: 'monitoring',
        ttl: 60, // 1 minute cache
      });

      if (cached) {
        return cached;
      }

      // Calculate from buffer
      const buffer = this.metricsBuffer.get(companyId) || [];
      
      const lastHour = this.calculateMetrics(
        this.filterByTimeWindow(buffer, 60 * 60 * 1000)
      );
      
      const last24Hours = this.calculateMetrics(
        this.filterByTimeWindow(buffer, 24 * 60 * 60 * 1000)
      );
      
      const last7Days = this.calculateMetrics(buffer);

      const aggregated: AggregatedMetrics = {
        lastHour,
        last24Hours,
        last7Days,
      };

      // Cache the result
      await cacheService.set(companyId, 'metrics', aggregated, {
        namespace: 'monitoring',
        ttl: 60,
      });

      return aggregated;
    } catch (error) {
      console.error('Error getting company metrics:', error);
      return null;
    }
  }

  /**
   * Get real-time metrics for all companies
   */
  async getAllCompaniesMetrics(): Promise<Map<string, CompanyMetrics>> {
    const result = new Map<string, CompanyMetrics>();
    const entries = Array.from(this.metricsBuffer.entries());

    for (const [companyId, buffer] of entries) {
      const recentMetrics = this.filterByTimeWindow(buffer, 60 * 60 * 1000); // Last hour
      const metrics = this.calculateMetrics(recentMetrics);
      result.set(companyId, metrics);
    }

    return result;
  }

  /**
   * Get companies with performance issues
   */
  async getProblematicCompanies(): Promise<Array<{
    companyId: string;
    metrics: CompanyMetrics;
    issues: string[];
  }>> {
    const allMetrics = await this.getAllCompaniesMetrics();
    const problematic: Array<{
      companyId: string;
      metrics: CompanyMetrics;
      issues: string[];
    }> = [];

    const entries = Array.from(allMetrics.entries());
    for (const [companyId, metrics] of entries) {
      const issues: string[] = [];

      if (metrics.errorRate > 10) {
        issues.push(`High error rate: ${metrics.errorRate}%`);
      }

      if (metrics.avgResponseTime > 1000) {
        issues.push(`Slow response time: ${metrics.avgResponseTime}ms`);
      }

      if (metrics.requestsPerMinute > 100) {
        issues.push(`High request rate: ${metrics.requestsPerMinute} req/min`);
      }

      if (issues.length > 0) {
        problematic.push({ companyId, metrics, issues });
      }
    }

    return problematic.sort((a, b) => b.issues.length - a.issues.length);
  }

  /**
   * Flush metrics buffer to persistent storage
   */
  private async flushMetrics(): Promise<void> {
    try {
      const entries = Array.from(this.metricsBuffer.entries());
      for (const [companyId, buffer] of entries) {
        if (buffer.length === 0) continue;

        // Store aggregated metrics in cache
        const metrics = this.calculateMetrics(buffer);
        await cacheService.set(companyId, 'metrics_snapshot', metrics, {
          namespace: 'monitoring',
          ttl: 3600, // 1 hour
        });

        // In production, you would also:
        // 1. Write to time-series database (InfluxDB, TimescaleDB)
        // 2. Send to monitoring service (Datadog, New Relic)
        // 3. Trigger alerts if thresholds exceeded
      }

      // Clean up old metrics (keep last hour only)
      const bufferEntries = Array.from(this.metricsBuffer.entries());
      for (const [companyId, buffer] of bufferEntries) {
        this.metricsBuffer.set(
          companyId,
          this.filterByTimeWindow(buffer, 60 * 60 * 1000)
        );
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }

  /**
   * Start periodic metrics flush
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushMetrics().catch(err => {
        console.error('Metrics flush error:', err);
      });
    }, this.METRICS_FLUSH_INTERVAL);
  }

  /**
   * Stop metrics collection
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollectorService();

/**
 * Express middleware to collect metrics
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const companyId = req.user?.companyId;

    // Capture original send/json methods
    const originalSend = res.send;
    const originalJson = res.json;

    let finished = false;

    const recordMetric = () => {
      if (finished) return;
      finished = true;

      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const method = req.method;
      const path = req.route?.path || req.path;

      // Only record if we have a company ID
      if (companyId) {
        const error = statusCode >= 400 ? `${statusCode} ${res.statusMessage}` : undefined;
        metricsCollector.recordRequest(companyId, method, path, statusCode, duration, error);
      }
    };

    // Override send
    res.send = function (body?: any) {
      recordMetric();
      return originalSend.call(this, body);
    };

    // Override json
    res.json = function (body?: any) {
      recordMetric();
      return originalJson.call(this, body);
    };

    // Also record on finish event (catches all responses)
    res.on('finish', recordMetric);

    next();
  };
}

/**
 * Get metrics summary for monitoring dashboard
 */
export async function getMetricsSummary() {
  const allMetrics = await metricsCollector.getAllCompaniesMetrics();
  const problematic = await metricsCollector.getProblematicCompanies();

  let totalRequests = 0;
  let totalErrors = 0;
  let avgResponseTime = 0;

  const values = Array.from(allMetrics.values());
  for (const metrics of values) {
    totalRequests += metrics.requestCount;
    totalErrors += metrics.errorCount;
    avgResponseTime += metrics.avgResponseTime;
  }

  avgResponseTime = allMetrics.size > 0 ? avgResponseTime / allMetrics.size : 0;

  return {
    totalCompanies: allMetrics.size,
    totalRequests,
    totalErrors,
    avgResponseTime: Math.round(avgResponseTime),
    errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 10000) / 100 : 0,
    problematicCompanies: problematic.length,
    healthyCompanies: allMetrics.size - problematic.length,
  };
}

// Graceful shutdown
process.on('SIGTERM', () => {
  metricsCollector.shutdown();
});
