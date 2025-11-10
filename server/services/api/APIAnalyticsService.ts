/**
 * API Analytics Service
 *
 * Tracks API usage, performance, and provides insights for API consumers
 */

import { loggers } from '../../utils/logger.js';

const logger = loggers.api;

/**
 * API Request Log
 */
export interface APIRequestLog {
  id?: string;
  apiKeyId: string;
  companyId: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number; // milliseconds
  requestSize?: number; // bytes
  responseSize?: number; // bytes
  userAgent?: string;
  ipAddress?: string;
  errorMessage?: string;
  timestamp: Date;
}

/**
 * API Usage Statistics
 */
export interface APIUsageStats {
  apiKeyId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalDataTransferred: number; // bytes
  topEndpoints: Array<{
    path: string;
    count: number;
    avgResponseTime: number;
  }>;
  errorRate: number; // percentage
  startDate: Date;
  endDate: Date;
}

/**
 * Endpoint Statistics
 */
export interface EndpointStats {
  path: string;
  method: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastAccessed: Date;
}

/**
 * API Analytics Service
 */
export class APIAnalyticsService {
  /**
   * In-memory request log (use database/TimescaleDB in production)
   */
  private static requestLogs: APIRequestLog[] = [];

  /**
   * Maximum log entries to keep in memory
   */
  private static readonly MAX_LOG_ENTRIES = 10000;

  /**
   * Log an API request
   */
  static async logRequest(log: APIRequestLog): Promise<void> {
    // Add to in-memory store
    this.requestLogs.push({
      ...log,
      id: crypto.randomUUID(),
      timestamp: log.timestamp || new Date(),
    });

    // Trim old logs if exceeds max
    if (this.requestLogs.length > this.MAX_LOG_ENTRIES) {
      this.requestLogs = this.requestLogs.slice(-this.MAX_LOG_ENTRIES);
    }

    // In production, insert into database
    // await db.insert(apiRequestLogs).values(log);

    logger.debug(
      {
        apiKeyId: log.apiKeyId,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
      },
      'API request logged'
    );
  }

  /**
   * Get usage statistics for an API key
   */
  static async getUsageStats(
    apiKeyId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<APIUsageStats> {
    const now = new Date();
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const startDate = new Date(now.getTime() - periodMs[period]);

    // Filter logs for this API key and period
    const logs = this.requestLogs.filter(
      (log) =>
        log.apiKeyId === apiKeyId &&
        log.timestamp >= startDate &&
        log.timestamp <= now
    );

    if (logs.length === 0) {
      return {
        apiKeyId,
        period,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalDataTransferred: 0,
        topEndpoints: [],
        errorRate: 0,
        startDate,
        endDate: now,
      };
    }

    // Calculate statistics
    const totalRequests = logs.length;
    const successfulRequests = logs.filter((log) => log.statusCode < 400).length;
    const failedRequests = totalRequests - successfulRequests;
    const errorRate = (failedRequests / totalRequests) * 100;

    // Response times
    const responseTimes = logs.map((log) => log.responseTime).sort((a, b) => a - b);
    const averageResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = this.percentile(responseTimes, 0.95);
    const p99ResponseTime = this.percentile(responseTimes, 0.99);

    // Data transferred
    const totalDataTransferred = logs.reduce(
      (sum, log) => sum + (log.requestSize || 0) + (log.responseSize || 0),
      0
    );

    // Top endpoints
    const endpointCounts = new Map<string, { count: number; totalTime: number }>();
    logs.forEach((log) => {
      const key = `${log.method} ${log.path}`;
      const current = endpointCounts.get(key) || { count: 0, totalTime: 0 };
      endpointCounts.set(key, {
        count: current.count + 1,
        totalTime: current.totalTime + log.responseTime,
      });
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([path, stats]) => ({
        path,
        count: stats.count,
        avgResponseTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      apiKeyId,
      period,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      totalDataTransferred,
      topEndpoints,
      errorRate,
      startDate,
      endDate: now,
    };
  }

  /**
   * Get endpoint statistics
   */
  static async getEndpointStats(apiKeyId: string): Promise<EndpointStats[]> {
    const logs = this.requestLogs.filter((log) => log.apiKeyId === apiKeyId);

    const endpointMap = new Map<
      string,
      {
        method: string;
        path: string;
        count: number;
        totalTime: number;
        errors: number;
        lastAccessed: Date;
      }
    >();

    logs.forEach((log) => {
      const key = `${log.method}:${log.path}`;
      const current = endpointMap.get(key) || {
        method: log.method,
        path: log.path,
        count: 0,
        totalTime: 0,
        errors: 0,
        lastAccessed: log.timestamp,
      };

      endpointMap.set(key, {
        ...current,
        count: current.count + 1,
        totalTime: current.totalTime + log.responseTime,
        errors: current.errors + (log.statusCode >= 400 ? 1 : 0),
        lastAccessed:
          log.timestamp > current.lastAccessed ? log.timestamp : current.lastAccessed,
      });
    });

    return Array.from(endpointMap.values()).map((stats) => ({
      path: stats.path,
      method: stats.method,
      totalRequests: stats.count,
      averageResponseTime: stats.totalTime / stats.count,
      errorRate: (stats.errors / stats.count) * 100,
      lastAccessed: stats.lastAccessed,
    }));
  }

  /**
   * Get recent requests for an API key
   */
  static async getRecentRequests(
    apiKeyId: string,
    limit: number = 100
  ): Promise<APIRequestLog[]> {
    return this.requestLogs
      .filter((log) => log.apiKeyId === apiKeyId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get error logs for an API key
   */
  static async getErrorLogs(
    apiKeyId: string,
    limit: number = 50
  ): Promise<APIRequestLog[]> {
    return this.requestLogs
      .filter((log) => log.apiKeyId === apiKeyId && log.statusCode >= 400)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get slow requests (> threshold ms)
   */
  static async getSlowRequests(
    apiKeyId: string,
    thresholdMs: number = 1000,
    limit: number = 50
  ): Promise<APIRequestLog[]> {
    return this.requestLogs
      .filter(
        (log) => log.apiKeyId === apiKeyId && log.responseTime > thresholdMs
      )
      .slice(-limit)
      .reverse();
  }

  /**
   * Get usage over time (time series data)
   */
  static async getUsageTimeSeries(
    apiKeyId: string,
    period: 'hour' | 'day' | 'week',
    points: number = 24
  ): Promise<Array<{ timestamp: Date; requests: number; avgResponseTime: number }>> {
    const now = new Date();
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    };

    const totalPeriod = periodMs[period];
    const bucketSize = totalPeriod / points;
    const startTime = now.getTime() - totalPeriod;

    // Initialize buckets
    const buckets: Array<{
      timestamp: Date;
      requests: number;
      totalResponseTime: number;
    }> = [];

    for (let i = 0; i < points; i++) {
      buckets.push({
        timestamp: new Date(startTime + i * bucketSize),
        requests: 0,
        totalResponseTime: 0,
      });
    }

    // Fill buckets with data
    const logs = this.requestLogs.filter(
      (log) =>
        log.apiKeyId === apiKeyId &&
        log.timestamp.getTime() >= startTime &&
        log.timestamp.getTime() <= now.getTime()
    );

    logs.forEach((log) => {
      const bucketIndex = Math.floor(
        (log.timestamp.getTime() - startTime) / bucketSize
      );
      if (bucketIndex >= 0 && bucketIndex < points) {
        buckets[bucketIndex].requests++;
        buckets[bucketIndex].totalResponseTime += log.responseTime;
      }
    });

    // Calculate averages
    return buckets.map((bucket) => ({
      timestamp: bucket.timestamp,
      requests: bucket.requests,
      avgResponseTime:
        bucket.requests > 0 ? bucket.totalResponseTime / bucket.requests : 0,
    }));
  }

  /**
   * Get rate limit usage
   */
  static async getRateLimitUsage(
    apiKeyId: string
  ): Promise<{
    limit: number;
    used: number;
    remaining: number;
    resetAt: Date;
  }> {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const logsInCurrentHour = this.requestLogs.filter(
      (log) =>
        log.apiKeyId === apiKeyId &&
        log.timestamp >= hourStart &&
        log.timestamp < hourEnd
    );

    // Default rate limit (should come from API key settings)
    const limit = 1000;
    const used = logsInCurrentHour.length;
    const remaining = Math.max(0, limit - used);

    return {
      limit,
      used,
      remaining,
      resetAt: hourEnd,
    };
  }

  /**
   * Clean up old logs
   */
  static cleanupOldLogs(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const before = this.requestLogs.length;

    this.requestLogs = this.requestLogs.filter(
      (log) => log.timestamp >= cutoffDate
    );

    const removed = before - this.requestLogs.length;

    if (removed > 0) {
      logger.info({ removed }, 'Cleaned up old API request logs');
    }

    return removed;
  }

  /**
   * Calculate percentile from sorted array
   */
  private static percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get aggregate statistics across all API keys for a company
   */
  static async getCompanyStats(
    companyId: string,
    period: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    topAPIs: Array<{ apiKeyId: string; requests: number }>;
  }> {
    const periodMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const startDate = new Date(Date.now() - periodMs[period]);

    const logs = this.requestLogs.filter(
      (log) => log.companyId === companyId && log.timestamp >= startDate
    );

    const totalRequests = logs.length;
    const successfulRequests = logs.filter((log) => log.statusCode < 400).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    const averageResponseTime =
      totalRequests > 0
        ? logs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests
        : 0;

    // Top APIs by request count
    const apiCounts = new Map<string, number>();
    logs.forEach((log) => {
      apiCounts.set(log.apiKeyId, (apiCounts.get(log.apiKeyId) || 0) + 1);
    });

    const topAPIs = Array.from(apiCounts.entries())
      .map(([apiKeyId, requests]) => ({ apiKeyId, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      topAPIs,
    };
  }
}
