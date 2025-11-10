/**
 * System Monitoring Service
 *
 * Monitors system health, performance metrics, and provides alerts
 * for platform administrators
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';
import os from 'os';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * System health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'critical';

/**
 * Alert severity
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Metric type
 */
export type MetricType = 'counter' | 'gauge' | 'histogram';

/**
 * System component
 */
export interface SystemComponent {
  id: string;
  name: string;
  type: 'service' | 'database' | 'cache' | 'queue' | 'storage' | 'api';
  status: HealthStatus;
  lastCheck: Date;
  uptime: number; // seconds
  responseTime?: number; // ms
  errorRate?: number; // percentage
  message?: string;
}

/**
 * System metrics
 */
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // percentage
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number; // bytes
    used: number;
    free: number;
    usagePercentage: number;
  };
  disk: {
    total: number; // bytes
    used: number;
    free: number;
    usagePercentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
  };
  application: {
    activeRequests: number;
    requestsPerSecond: number;
    averageResponseTime: number; // ms
    errorRate: number; // percentage
    activeUsers: number;
    activeSessions: number;
  };
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

/**
 * System alert
 */
export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  component: string;
  message: string;
  details?: string;
  threshold?: number;
  currentValue?: number;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Health check
 */
export interface HealthCheck {
  overall: HealthStatus;
  components: SystemComponent[];
  lastCheck: Date;
  uptime: number; // seconds
}

/**
 * System Monitoring Service
 */
export class SystemMonitoringService {
  /**
   * In-memory stores (use database/time-series DB in production)
   */
  private static components = new Map<string, SystemComponent>();
  private static metrics: PerformanceMetric[] = [];
  private static alerts: SystemAlert[] = [];
  private static systemStartTime = Date.now();

  /**
   * Configuration
   */
  private static readonly METRICS_RETENTION_HOURS = 24;
  private static readonly ALERT_RETENTION_DAYS = 30;
  private static readonly HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Thresholds
   */
  private static readonly THRESHOLDS = {
    cpu: {
      warning: 70,
      critical: 90,
    },
    memory: {
      warning: 80,
      critical: 95,
    },
    disk: {
      warning: 80,
      critical: 90,
    },
    responseTime: {
      warning: 1000, // ms
      critical: 3000,
    },
    errorRate: {
      warning: 1, // percentage
      critical: 5,
    },
  };

  /**
   * Initialize default components
   */
  static {
    this.registerDefaultComponents();
    this.startHealthCheckLoop();
  }

  // ========== Component Registration ==========

  /**
   * Register default components
   */
  private static registerDefaultComponents(): void {
    this.registerComponent({
      id: 'api-server',
      name: 'API Server',
      type: 'api',
      status: 'healthy',
    });

    this.registerComponent({
      id: 'database',
      name: 'PostgreSQL Database',
      type: 'database',
      status: 'healthy',
    });

    this.registerComponent({
      id: 'redis-cache',
      name: 'Redis Cache',
      type: 'cache',
      status: 'healthy',
    });

    this.registerComponent({
      id: 'file-storage',
      name: 'File Storage',
      type: 'storage',
      status: 'healthy',
    });

    this.registerComponent({
      id: 'message-queue',
      name: 'Message Queue',
      type: 'queue',
      status: 'healthy',
    });
  }

  /**
   * Register component
   */
  static registerComponent(
    component: Omit<SystemComponent, 'lastCheck' | 'uptime'>
  ): SystemComponent {
    const newComponent: SystemComponent = {
      ...component,
      lastCheck: new Date(),
      uptime: 0,
    };

    this.components.set(newComponent.id, newComponent);

    logger.info({ componentId: newComponent.id, name: component.name }, 'Component registered');

    return newComponent;
  }

  /**
   * Update component status
   */
  static updateComponentStatus(
    componentId: string,
    status: HealthStatus,
    message?: string,
    metrics?: {
      responseTime?: number;
      errorRate?: number;
    }
  ): void {
    const component = this.components.get(componentId);

    if (!component) {
      return;
    }

    const previousStatus = component.status;
    component.status = status;
    component.lastCheck = new Date();
    component.message = message;

    if (metrics) {
      if (metrics.responseTime !== undefined) {
        component.responseTime = metrics.responseTime;
      }
      if (metrics.errorRate !== undefined) {
        component.errorRate = metrics.errorRate;
      }
    }

    this.components.set(componentId, component);

    // Create alert if status degraded
    if (previousStatus !== status && (status === 'degraded' || status === 'unhealthy' || status === 'critical')) {
      const severity: AlertSeverity =
        status === 'critical' ? 'critical' : status === 'unhealthy' ? 'error' : 'warning';

      this.createAlert(severity, componentId, `Component ${component.name} is ${status}`, message);
    }
  }

  // ========== Health Checks ==========

  /**
   * Start health check loop
   */
  private static startHealthCheckLoop(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL_MS);
  }

  /**
   * Perform health checks
   */
  private static async performHealthChecks(): Promise<void> {
    // Check system resources
    const systemMetrics = this.collectSystemMetrics();

    // Check CPU
    if (systemMetrics.cpu.usage > this.THRESHOLDS.cpu.critical) {
      this.updateComponentStatus('api-server', 'critical', `CPU usage at ${systemMetrics.cpu.usage.toFixed(1)}%`);
    } else if (systemMetrics.cpu.usage > this.THRESHOLDS.cpu.warning) {
      this.updateComponentStatus('api-server', 'degraded', `CPU usage at ${systemMetrics.cpu.usage.toFixed(1)}%`);
    }

    // Check memory
    if (systemMetrics.memory.usagePercentage > this.THRESHOLDS.memory.critical) {
      this.updateComponentStatus('api-server', 'critical', `Memory usage at ${systemMetrics.memory.usagePercentage.toFixed(1)}%`);
    } else if (systemMetrics.memory.usagePercentage > this.THRESHOLDS.memory.warning) {
      this.updateComponentStatus('api-server', 'degraded', `Memory usage at ${systemMetrics.memory.usagePercentage.toFixed(1)}%`);
    }

    // Check disk
    if (systemMetrics.disk.usagePercentage > this.THRESHOLDS.disk.critical) {
      this.updateComponentStatus('file-storage', 'critical', `Disk usage at ${systemMetrics.disk.usagePercentage.toFixed(1)}%`);
    } else if (systemMetrics.disk.usagePercentage > this.THRESHOLDS.disk.warning) {
      this.updateComponentStatus('file-storage', 'degraded', `Disk usage at ${systemMetrics.disk.usagePercentage.toFixed(1)}%`);
    }

    // Update component uptimes
    const now = Date.now();
    this.components.forEach((component) => {
      component.uptime = Math.floor((now - this.systemStartTime) / 1000);
      this.components.set(component.id, component);
    });
  }

  /**
   * Get health status
   */
  static getHealthStatus(): HealthCheck {
    const components = Array.from(this.components.values());

    // Determine overall status
    let overall: HealthStatus = 'healthy';

    if (components.some((c) => c.status === 'critical')) {
      overall = 'critical';
    } else if (components.some((c) => c.status === 'unhealthy')) {
      overall = 'unhealthy';
    } else if (components.some((c) => c.status === 'degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      components,
      lastCheck: new Date(),
      uptime: Math.floor((Date.now() - this.systemStartTime) / 1000),
    };
  }

  // ========== Metrics Collection ==========

  /**
   * Collect system metrics
   */
  static collectSystemMetrics(): SystemMetrics {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = 100 - (100 * totalIdle) / totalTick;

    // Disk usage (simplified - in production, use actual disk monitoring)
    const diskTotal = 1024 * 1024 * 1024 * 100; // 100GB sample
    const diskUsed = diskTotal * 0.45; // 45% sample usage
    const diskFree = diskTotal - diskUsed;

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        cores: cpus.length,
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercentage: (usedMem / totalMem) * 100,
      },
      disk: {
        total: diskTotal,
        used: diskUsed,
        free: diskFree,
        usagePercentage: (diskUsed / diskTotal) * 100,
      },
      network: {
        bytesIn: 0, // In production, track actual network metrics
        bytesOut: 0,
        connectionsActive: 0,
      },
      application: {
        activeRequests: 0, // Track from middleware
        requestsPerSecond: 0,
        averageResponseTime: 0,
        errorRate: 0,
        activeUsers: 0,
        activeSessions: 0,
      },
    };

    return metrics;
  }

  /**
   * Record performance metric
   */
  static recordMetric(
    name: string,
    type: MetricType,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      id: crypto.randomUUID(),
      name,
      type,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // Clean up old metrics
    const cutoff = new Date(Date.now() - this.METRICS_RETENTION_HOURS * 60 * 60 * 1000);
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
  }

  /**
   * Get metrics
   */
  static getMetrics(
    name?: string,
    startTime?: Date,
    endTime?: Date
  ): PerformanceMetric[] {
    let metrics = this.metrics;

    if (name) {
      metrics = metrics.filter((m) => m.name === name);
    }

    if (startTime) {
      metrics = metrics.filter((m) => m.timestamp >= startTime);
    }

    if (endTime) {
      metrics = metrics.filter((m) => m.timestamp <= endTime);
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // ========== Alerts ==========

  /**
   * Create alert
   */
  static createAlert(
    severity: AlertSeverity,
    component: string,
    message: string,
    details?: string,
    threshold?: number,
    currentValue?: number
  ): SystemAlert {
    const alert: SystemAlert = {
      id: crypto.randomUUID(),
      severity,
      component,
      message,
      details,
      threshold,
      currentValue,
      createdAt: new Date(),
    };

    this.alerts.push(alert);

    // Clean up old alerts
    const cutoff = new Date(Date.now() - this.ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter((a) => a.createdAt >= cutoff);

    logger.warn({ alertId: alert.id, severity, component, message }, 'System alert created');

    // In production: Send notifications (email, SMS, Slack, PagerDuty)

    return alert;
  }

  /**
   * Get alerts
   */
  static getAlerts(
    severity?: AlertSeverity,
    component?: string,
    acknowledged?: boolean
  ): SystemAlert[] {
    let alerts = this.alerts;

    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity);
    }

    if (component) {
      alerts = alerts.filter((a) => a.component === component);
    }

    if (acknowledged !== undefined) {
      alerts = alerts.filter((a) => !!a.acknowledgedAt === acknowledged);
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Acknowledge alert
   */
  static acknowledgeAlert(alertId: string, userId: string): SystemAlert | null {
    const alert = this.alerts.find((a) => a.id === alertId);

    if (!alert) {
      return null;
    }

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    logger.info({ alertId, userId }, 'Alert acknowledged');

    return alert;
  }

  /**
   * Resolve alert
   */
  static resolveAlert(alertId: string, userId: string): SystemAlert | null {
    const alert = this.alerts.find((a) => a.id === alertId);

    if (!alert) {
      return null;
    }

    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;

    logger.info({ alertId, userId }, 'Alert resolved');

    return alert;
  }

  // ========== Statistics ==========

  /**
   * Get system statistics
   */
  static getStatistics(): {
    uptime: number;
    totalAlerts: number;
    criticalAlerts: number;
    unacknowledgedAlerts: number;
    healthyComponents: number;
    totalComponents: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const alerts = this.getAlerts();
    const components = Array.from(this.components.values());

    return {
      uptime: Math.floor((Date.now() - this.systemStartTime) / 1000),
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter((a) => a.severity === 'critical' && !a.resolvedAt).length,
      unacknowledgedAlerts: alerts.filter((a) => !a.acknowledgedAt).length,
      healthyComponents: components.filter((c) => c.status === 'healthy').length,
      totalComponents: components.length,
      averageResponseTime: this.calculateAverageResponseTime(),
      errorRate: this.calculateErrorRate(),
    };
  }

  /**
   * Calculate average response time
   */
  private static calculateAverageResponseTime(): number {
    const components = Array.from(this.components.values());
    const responseTimes = components
      .filter((c) => c.responseTime !== undefined)
      .map((c) => c.responseTime!);

    if (responseTimes.length === 0) {
      return 0;
    }

    return responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
  }

  /**
   * Calculate error rate
   */
  private static calculateErrorRate(): number {
    const components = Array.from(this.components.values());
    const errorRates = components
      .filter((c) => c.errorRate !== undefined)
      .map((c) => c.errorRate!);

    if (errorRates.length === 0) {
      return 0;
    }

    return errorRates.reduce((sum, er) => sum + er, 0) / errorRates.length;
  }
}
