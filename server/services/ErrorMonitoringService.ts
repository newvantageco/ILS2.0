/**
 * Error Monitoring Service
 * 
 * Provides centralized error tracking, logging, and alerting for the SaaS platform
 * Integrates with external services (Sentry, DataDog, etc.) and internal logging
 */

import logger from '../utils/logger';
import { storage } from '../storage';

export interface ErrorContext {
  userId?: string;
  companyId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorMetrics {
  errorType: string;
  errorCount: number;
  lastOccurrence: Date;
  affectedUsers: number;
  avgResponseTime?: number;
}

export class ErrorMonitoringService {
  private static errorCache: Map<string, ErrorMetrics> = new Map();
  private static readonly ALERT_THRESHOLD = 10; // Alert after 10 errors of same type
  private static readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Track an error with full context
   */
  static async trackError(
    error: Error,
    context: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    const errorKey = `${error.name}:${error.message}`;
    
    // Log to console/file
    logger.error({
      err: error,
      context,
      severity,
      stack: error.stack,
    }, `Error tracked: ${error.message}`);

    // Update error metrics
    const metrics = this.errorCache.get(errorKey) || {
      errorType: error.name,
      errorCount: 0,
      lastOccurrence: new Date(),
      affectedUsers: 0,
    };

    metrics.errorCount++;
    metrics.lastOccurrence = new Date();
    if (context.userId) {
      metrics.affectedUsers++;
    }

    this.errorCache.set(errorKey, metrics);

    // Alert if threshold exceeded
    if (metrics.errorCount >= this.ALERT_THRESHOLD) {
      await this.sendAlert(error, metrics, context, severity);
    }

    // Store in database for analytics
    try {
      await this.storeErrorInDatabase(error, context, severity);
    } catch (dbError) {
      logger.error({ err: dbError as Error }, 'Failed to store error in database');
    }

    // Send to external monitoring service (Sentry, DataDog, etc.)
    if (process.env.SENTRY_DSN) {
      await this.sendToSentry(error, context, severity);
    }
  }

  /**
   * Track API error with performance metrics
   */
  static async trackApiError(
    error: Error,
    context: ErrorContext & { responseTimeMs: number }
  ): Promise<void> {
    await this.trackError(error, context, 'medium');

    // Track API-specific metrics
    if (context.companyId && context.endpoint) {
      try {
        await storage.createUsageEvent({
          companyId: context.companyId,
          userId: context.userId || 'system',
          featureName: context.endpoint,
          eventType: 'api_error',
          metadata: {
            errorType: error.name,
            errorMessage: error.message,
            statusCode: context.statusCode,
          },
          success: false,
          responseTimeMs: context.responseTimeMs,
        });
      } catch (trackError) {
        logger.error({ err: trackError as Error }, 'Failed to track API error metrics');
      }
    }
  }

  /**
   * Get error statistics for a time period
   */
  static async getErrorStats(
    startDate: Date,
    endDate: Date,
    companyId?: string
  ): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorRate: number;
    topErrors: Array<{ type: string; count: number; message: string }>;
  }> {
    // In production, query from database
    // For now, return aggregated metrics from cache
    const errorsByType: Record<string, number> = {};
    let totalErrors = 0;

    this.errorCache.forEach((metrics, key) => {
      if (metrics.lastOccurrence >= startDate && metrics.lastOccurrence <= endDate) {
        errorsByType[metrics.errorType] = (errorsByType[metrics.errorType] || 0) + metrics.errorCount;
        totalErrors += metrics.errorCount;
      }
    });

    const topErrors = Array.from(this.errorCache.entries())
      .filter(([, m]) => m.lastOccurrence >= startDate && m.lastOccurrence <= endDate)
      .map(([key, m]) => ({
        type: m.errorType,
        count: m.errorCount,
        message: key.split(':')[1] || key,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors,
      errorsByType,
      errorRate: totalErrors / ((endDate.getTime() - startDate.getTime()) / 1000 / 60), // errors per minute
      topErrors,
    };
  }

  /**
   * Send alert for critical errors
   */
  private static async sendAlert(
    error: Error,
    metrics: ErrorMetrics,
    context: ErrorContext,
    severity: string
  ): Promise<void> {
    logger.warn({
      error: error.message,
      errorType: metrics.errorType,
      occurrences: metrics.errorCount,
      affectedUsers: metrics.affectedUsers,
      severity,
      context,
    }, `🚨 Error threshold exceeded: ${error.message}`);

    // In production, send to alerting service (PagerDuty, Slack, etc.)
    // For now, just log at warn level
    if (severity === 'critical') {
      // Would trigger PagerDuty alert
      logger.error({ err: error, metrics, context }, 'CRITICAL ERROR - Immediate attention required');
    }
  }

  /**
   * Store error in database for analytics
   */
  private static async storeErrorInDatabase(
    error: Error,
    context: ErrorContext,
    severity: string
  ): Promise<void> {
    // Would insert into error_logs table
    // For now, we'll use the audit log system
    // In production, create dedicated error_logs table
  }

  /**
   * Send error to Sentry
   */
  private static async sendToSentry(
    error: Error,
    context: ErrorContext,
    severity: string
  ): Promise<void> {
    // Sentry integration would go here
    // Example:
    // Sentry.captureException(error, {
    //   level: severity,
    //   user: { id: context.userId },
    //   tags: {
    //     companyId: context.companyId,
    //     endpoint: context.endpoint,
    //   },
    //   extra: context.additionalData,
    // });
  }

  /**
   * Clear error cache (for testing or scheduled cleanup)
   */
  static clearCache(): void {
    this.errorCache.clear();
  }

  /**
   * Get current error metrics from cache
   */
  static getMetrics(): Map<string, ErrorMetrics> {
    return new Map(this.errorCache);
  }
}

export default ErrorMonitoringService;
