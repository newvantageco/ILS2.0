/**
 * Integration Monitoring Service
 *
 * Monitors integration health, performance, uptime, and provides
 * alerting for integration issues
 */

import { loggers } from '../../utils/logger.js';
import type { IntegrationConfig, SyncJob } from './IntegrationFramework.js';

const logger = loggers.api;

/**
 * Health Status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Alert Severity
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Integration Health Check
 */
export interface HealthCheck {
  integrationId: string;
  integrationName: string;
  status: HealthStatus;
  lastCheckedAt: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  consecutiveFailures: number;
  metrics: {
    uptime: number; // percentage
    avgResponseTime: number; // milliseconds
    errorRate: number; // percentage
    lastSyncDuration?: number; // milliseconds
  };
  issues: string[];
}

/**
 * Integration Alert
 */
export interface IntegrationAlert {
  id: string;
  integrationId: string;
  severity: AlertSeverity;
  type:
    | 'connection_failed'
    | 'sync_failed'
    | 'high_error_rate'
    | 'slow_response'
    | 'auth_expired'
    | 'quota_exceeded'
    | 'custom';
  message: string;
  details?: Record<string, any>;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  integrationId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    avgSyncDuration: number;
    minSyncDuration: number;
    maxSyncDuration: number;
    p50SyncDuration: number;
    p95SyncDuration: number;
    p99SyncDuration: number;
  };
}

/**
 * Uptime Report
 */
export interface UptimeReport {
  integrationId: string;
  period: {
    start: Date;
    end: Date;
  };
  uptime: number; // percentage
  downtime: number; // minutes
  incidents: Array<{
    start: Date;
    end?: Date;
    duration: number; // minutes
    reason: string;
  }>;
}

/**
 * Integration Monitoring Service
 */
export class IntegrationMonitoring {
  /**
   * In-memory health checks
   */
  private static healthChecks = new Map<string, HealthCheck>();

  /**
   * In-memory alerts
   */
  private static alerts: IntegrationAlert[] = [];

  /**
   * Alert thresholds
   */
  private static readonly THRESHOLDS = {
    CONSECUTIVE_FAILURES: 3,
    ERROR_RATE_WARNING: 10, // 10%
    ERROR_RATE_CRITICAL: 25, // 25%
    SLOW_RESPONSE_MS: 5000, // 5 seconds
    UPTIME_WARNING: 95, // 95%
    UPTIME_CRITICAL: 90, // 90%
  };

  /**
   * Perform health check for an integration
   */
  static async checkHealth(
    integration: IntegrationConfig,
    recentJobs: SyncJob[]
  ): Promise<HealthCheck> {
    const now = new Date();

    // Get existing health check or create new
    let healthCheck = this.healthChecks.get(integration.id);

    if (!healthCheck) {
      healthCheck = {
        integrationId: integration.id,
        integrationName: integration.name,
        status: 'unknown',
        lastCheckedAt: now,
        consecutiveFailures: 0,
        metrics: {
          uptime: 100,
          avgResponseTime: 0,
          errorRate: 0,
        },
        issues: [],
      };
    }

    // Update last checked
    healthCheck.lastCheckedAt = now;
    healthCheck.issues = [];

    // Check if integration is active
    if (integration.status !== 'active') {
      healthCheck.status = 'unhealthy';
      healthCheck.issues.push(`Integration is ${integration.status}`);
      this.healthChecks.set(integration.id, healthCheck);
      return healthCheck;
    }

    // Analyze recent jobs
    const completedJobs = recentJobs.filter((j) => j.status === 'completed' || j.status === 'failed');

    if (completedJobs.length === 0) {
      healthCheck.status = 'unknown';
      healthCheck.issues.push('No recent sync activity');
      this.healthChecks.set(integration.id, healthCheck);
      return healthCheck;
    }

    // Calculate metrics
    const totalJobs = completedJobs.length;
    const failedJobs = completedJobs.filter((j) => j.status === 'failed');
    const successfulJobs = completedJobs.filter((j) => j.status === 'completed');

    const errorRate = (failedJobs.length / totalJobs) * 100;
    const uptime = (successfulJobs.length / totalJobs) * 100;

    // Calculate response times
    const durations = completedJobs
      .filter((j) => j.duration)
      .map((j) => j.duration!);

    const avgResponseTime =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    healthCheck.metrics = {
      uptime,
      avgResponseTime,
      errorRate,
      lastSyncDuration: durations[durations.length - 1],
    };

    // Update success/failure tracking
    const lastJob = recentJobs[0];
    if (lastJob) {
      if (lastJob.status === 'completed') {
        healthCheck.lastSuccessAt = lastJob.completedAt;
        healthCheck.consecutiveFailures = 0;
      } else if (lastJob.status === 'failed') {
        healthCheck.lastFailureAt = lastJob.completedAt;
        healthCheck.consecutiveFailures++;
      }
    }

    // Determine health status
    if (healthCheck.consecutiveFailures >= this.THRESHOLDS.CONSECUTIVE_FAILURES) {
      healthCheck.status = 'unhealthy';
      healthCheck.issues.push(
        `${healthCheck.consecutiveFailures} consecutive failures`
      );

      // Create alert
      await this.createAlert({
        integrationId: integration.id,
        severity: 'critical',
        type: 'sync_failed',
        message: `Integration has failed ${healthCheck.consecutiveFailures} times consecutively`,
        details: { consecutiveFailures: healthCheck.consecutiveFailures },
      });
    } else if (errorRate >= this.THRESHOLDS.ERROR_RATE_CRITICAL) {
      healthCheck.status = 'unhealthy';
      healthCheck.issues.push(`High error rate: ${errorRate.toFixed(1)}%`);

      await this.createAlert({
        integrationId: integration.id,
        severity: 'critical',
        type: 'high_error_rate',
        message: `Error rate is ${errorRate.toFixed(1)}%`,
        details: { errorRate },
      });
    } else if (errorRate >= this.THRESHOLDS.ERROR_RATE_WARNING) {
      healthCheck.status = 'degraded';
      healthCheck.issues.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);

      await this.createAlert({
        integrationId: integration.id,
        severity: 'warning',
        type: 'high_error_rate',
        message: `Error rate is ${errorRate.toFixed(1)}%`,
        details: { errorRate },
      });
    } else if (avgResponseTime > this.THRESHOLDS.SLOW_RESPONSE_MS) {
      healthCheck.status = 'degraded';
      healthCheck.issues.push(
        `Slow response time: ${avgResponseTime.toFixed(0)}ms`
      );

      await this.createAlert({
        integrationId: integration.id,
        severity: 'warning',
        type: 'slow_response',
        message: `Average response time is ${avgResponseTime.toFixed(0)}ms`,
        details: { avgResponseTime },
      });
    } else if (uptime < this.THRESHOLDS.UPTIME_WARNING) {
      healthCheck.status = 'degraded';
      healthCheck.issues.push(`Low uptime: ${uptime.toFixed(1)}%`);
    } else {
      healthCheck.status = 'healthy';
    }

    this.healthChecks.set(integration.id, healthCheck);

    logger.info(
      {
        integrationId: integration.id,
        status: healthCheck.status,
        uptime,
        errorRate,
      },
      'Health check completed'
    );

    return healthCheck;
  }

  /**
   * Get health check for an integration
   */
  static getHealthCheck(integrationId: string): HealthCheck | null {
    return this.healthChecks.get(integrationId) || null;
  }

  /**
   * Get all health checks
   */
  static getAllHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get health checks by status
   */
  static getHealthChecksByStatus(status: HealthStatus): HealthCheck[] {
    return Array.from(this.healthChecks.values()).filter(
      (hc) => hc.status === status
    );
  }

  /**
   * Create an alert
   */
  static async createAlert(
    alert: Omit<IntegrationAlert, 'id' | 'createdAt'>
  ): Promise<IntegrationAlert> {
    // Check for duplicate recent alerts
    const recentAlerts = this.alerts.filter(
      (a) =>
        a.integrationId === alert.integrationId &&
        a.type === alert.type &&
        !a.resolvedAt &&
        Date.now() - a.createdAt.getTime() < 3600000 // Within last hour
    );

    if (recentAlerts.length > 0) {
      logger.debug(
        { integrationId: alert.integrationId, type: alert.type },
        'Skipping duplicate alert'
      );
      return recentAlerts[0];
    }

    const newAlert: IntegrationAlert = {
      ...alert,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    this.alerts.push(newAlert);

    // Trim alerts if too many
    if (this.alerts.length > 10000) {
      this.alerts = this.alerts.slice(-10000);
    }

    logger.info(
      { alertId: newAlert.id, integrationId: alert.integrationId, severity: alert.severity },
      'Alert created'
    );

    // In production, would send notifications via email, Slack, etc.

    return newAlert;
  }

  /**
   * Get alerts for an integration
   */
  static getAlerts(
    integrationId: string,
    filters?: {
      severity?: AlertSeverity;
      resolved?: boolean;
    }
  ): IntegrationAlert[] {
    let alerts = this.alerts.filter((a) => a.integrationId === integrationId);

    if (filters?.severity) {
      alerts = alerts.filter((a) => a.severity === filters.severity);
    }

    if (filters?.resolved !== undefined) {
      alerts = alerts.filter((a) => (a.resolvedAt !== undefined) === filters.resolved);
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<IntegrationAlert | null> {
    const alert = this.alerts.find((a) => a.id === alertId);

    if (!alert) return null;

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    logger.info({ alertId, acknowledgedBy }, 'Alert acknowledged');

    return alert;
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(
    alertId: string,
    resolvedBy: string
  ): Promise<IntegrationAlert | null> {
    const alert = this.alerts.find((a) => a.id === alertId);

    if (!alert) return null;

    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    logger.info({ alertId, resolvedBy }, 'Alert resolved');

    return alert;
  }

  /**
   * Calculate performance metrics
   */
  static calculatePerformanceMetrics(
    integrationId: string,
    jobs: SyncJob[],
    startDate: Date,
    endDate: Date
  ): PerformanceMetrics {
    const completedJobs = jobs.filter((j) => j.status === 'completed' || j.status === 'failed');

    const totalSyncs = completedJobs.length;
    const successfulSyncs = completedJobs.filter((j) => j.status === 'completed').length;
    const failedSyncs = completedJobs.filter((j) => j.status === 'failed').length;

    const totalRecords = completedJobs.reduce((sum, j) => sum + j.totalRecords, 0);
    const successfulRecords = completedJobs.reduce((sum, j) => sum + j.successfulRecords, 0);
    const failedRecords = completedJobs.reduce((sum, j) => sum + j.failedRecords, 0);

    // Calculate duration metrics
    const durations = completedJobs
      .filter((j) => j.duration)
      .map((j) => j.duration!)
      .sort((a, b) => a - b);

    const avgSyncDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const minSyncDuration = durations.length > 0 ? durations[0] : 0;
    const maxSyncDuration = durations.length > 0 ? durations[durations.length - 1] : 0;

    const p50SyncDuration = this.percentile(durations, 0.5);
    const p95SyncDuration = this.percentile(durations, 0.95);
    const p99SyncDuration = this.percentile(durations, 0.99);

    return {
      integrationId,
      period: {
        start: startDate,
        end: endDate,
      },
      metrics: {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        totalRecords,
        successfulRecords,
        failedRecords,
        avgSyncDuration,
        minSyncDuration,
        maxSyncDuration,
        p50SyncDuration,
        p95SyncDuration,
        p99SyncDuration,
      },
    };
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
   * Generate uptime report
   */
  static generateUptimeReport(
    integrationId: string,
    jobs: SyncJob[],
    startDate: Date,
    endDate: Date
  ): UptimeReport {
    const completedJobs = jobs.filter((j) => j.status === 'completed' || j.status === 'failed');

    const totalJobs = completedJobs.length;
    const successfulJobs = completedJobs.filter((j) => j.status === 'completed').length;

    const uptime = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 100;

    // Calculate downtime from failed jobs
    const failedJobs = completedJobs.filter((j) => j.status === 'failed');

    const incidents = failedJobs.map((job) => ({
      start: job.startedAt,
      end: job.completedAt,
      duration: job.duration ? job.duration / 60000 : 0, // Convert to minutes
      reason: job.errors[0]?.error || 'Unknown error',
    }));

    const downtime = incidents.reduce((sum, inc) => sum + inc.duration, 0);

    return {
      integrationId,
      period: {
        start: startDate,
        end: endDate,
      },
      uptime,
      downtime,
      incidents,
    };
  }

  /**
   * Get monitoring dashboard
   */
  static getMonitoringDashboard(): {
    summary: {
      totalIntegrations: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
      unknown: number;
    };
    alerts: {
      total: number;
      critical: number;
      error: number;
      warning: number;
      info: number;
      unresolved: number;
    };
    recentIssues: IntegrationAlert[];
  } {
    const healthChecks = this.getAllHealthChecks();

    const summary = {
      totalIntegrations: healthChecks.length,
      healthy: healthChecks.filter((hc) => hc.status === 'healthy').length,
      degraded: healthChecks.filter((hc) => hc.status === 'degraded').length,
      unhealthy: healthChecks.filter((hc) => hc.status === 'unhealthy').length,
      unknown: healthChecks.filter((hc) => hc.status === 'unknown').length,
    };

    const unresolvedAlerts = this.alerts.filter((a) => !a.resolvedAt);

    const alerts = {
      total: this.alerts.length,
      critical: this.alerts.filter((a) => a.severity === 'critical').length,
      error: this.alerts.filter((a) => a.severity === 'error').length,
      warning: this.alerts.filter((a) => a.severity === 'warning').length,
      info: this.alerts.filter((a) => a.severity === 'info').length,
      unresolved: unresolvedAlerts.length,
    };

    const recentIssues = [...this.alerts]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      summary,
      alerts,
      recentIssues,
    };
  }

  /**
   * Clean up old alerts
   */
  static cleanupAlerts(olderThanDays: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const before = this.alerts.length;

    this.alerts = this.alerts.filter((alert) => alert.createdAt >= cutoffDate);

    const removed = before - this.alerts.length;

    if (removed > 0) {
      logger.info({ removed }, 'Cleaned up old integration alerts');
    }

    return removed;
  }
}
