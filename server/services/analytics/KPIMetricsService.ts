/**
 * KPI Metrics Service
 *
 * Manages Key Performance Indicators and business metrics
 * Pre-defines common healthcare and business KPIs
 */

import { loggers } from '../../utils/logger.js';
import { AnalyticsEngineService, MetricDefinition, MetricCategory } from './AnalyticsEngineService.js';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * KPI target
 */
export interface KPITarget {
  metricId: string;
  targetValue: number;
  threshold: {
    critical: number; // Below this is critical
    warning: number; // Below this is warning
    good: number; // At or above this is good
    excellent: number; // At or above this is excellent
  };
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

/**
 * KPI status
 */
export type KPIStatus = 'excellent' | 'good' | 'warning' | 'critical';

/**
 * KPI with status
 */
export interface KPIWithStatus {
  metric: MetricDefinition;
  currentValue: number;
  targetValue: number;
  status: KPIStatus;
  percentOfTarget: number;
  trend?: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

/**
 * KPI category group
 */
export interface KPICategoryGroup {
  category: MetricCategory;
  kpis: KPIWithStatus[];
  overallStatus: KPIStatus;
}

/**
 * KPI Metrics Service
 */
export class KPIMetricsService {
  /**
   * In-memory stores (use database in production)
   */
  private static targets = new Map<string, KPITarget>();
  private static initialized = false;

  /**
   * Initialize default KPIs
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.registerDefaultKPIs();
    this.initialized = true;

    logger.info('KPI Metrics Service initialized');
  }

  /**
   * Register default KPIs
   */
  private static async registerDefaultKPIs(): Promise<void> {
    // Revenue KPIs
    await this.registerKPI({
      name: 'Total Revenue',
      description: 'Total revenue across all sources',
      category: 'revenue',
      unit: 'dollars',
      aggregation: 'sum',
      datasource: 'orders',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 100000,
        threshold: {
          critical: 60000,
          warning: 75000,
          good: 90000,
          excellent: 110000,
        },
        period: 'monthly',
      },
    });

    await this.registerKPI({
      name: 'Revenue per Patient',
      description: 'Average revenue per patient visit',
      category: 'revenue',
      unit: 'dollars',
      aggregation: 'avg',
      datasource: 'orders',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 250,
        threshold: {
          critical: 150,
          warning: 200,
          good: 240,
          excellent: 280,
        },
        period: 'monthly',
      },
    });

    await this.registerKPI({
      name: 'Collection Rate',
      description: 'Percentage of billed amount collected',
      category: 'revenue',
      unit: 'percentage',
      aggregation: 'avg',
      datasource: 'payments',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 95,
        threshold: {
          critical: 70,
          warning: 85,
          good: 92,
          excellent: 98,
        },
        period: 'monthly',
      },
    });

    // Patient KPIs
    await this.registerKPI({
      name: 'Active Patients',
      description: 'Number of active patients',
      category: 'patients',
      unit: 'count',
      aggregation: 'distinct_count',
      datasource: 'patients',
      refreshInterval: 86400,
      enabled: true,
      target: {
        targetValue: 5000,
        threshold: {
          critical: 3000,
          warning: 4000,
          good: 4800,
          excellent: 5500,
        },
        period: 'monthly',
      },
    });

    await this.registerKPI({
      name: 'New Patients',
      description: 'New patients this period',
      category: 'patients',
      unit: 'count',
      aggregation: 'count',
      datasource: 'patients',
      refreshInterval: 86400,
      enabled: true,
      target: {
        targetValue: 200,
        threshold: {
          critical: 100,
          warning: 150,
          good: 190,
          excellent: 220,
        },
        period: 'monthly',
      },
    });

    await this.registerKPI({
      name: 'Patient Retention Rate',
      description: 'Percentage of patients returning',
      category: 'patients',
      unit: 'percentage',
      aggregation: 'avg',
      datasource: 'patients',
      refreshInterval: 86400,
      enabled: true,
      target: {
        targetValue: 80,
        threshold: {
          critical: 50,
          warning: 65,
          good: 75,
          excellent: 85,
        },
        period: 'quarterly',
      },
    });

    // Appointment KPIs
    await this.registerKPI({
      name: 'Appointments Today',
      description: 'Total appointments scheduled for today',
      category: 'appointments',
      unit: 'count',
      aggregation: 'count',
      datasource: 'appointments',
      refreshInterval: 900,
      enabled: true,
      target: {
        targetValue: 50,
        threshold: {
          critical: 25,
          warning: 35,
          good: 45,
          excellent: 55,
        },
        period: 'daily',
      },
    });

    await this.registerKPI({
      name: 'Appointment Show Rate',
      description: 'Percentage of patients showing up for appointments',
      category: 'appointments',
      unit: 'percentage',
      aggregation: 'avg',
      datasource: 'appointments',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 90,
        threshold: {
          critical: 70,
          warning: 80,
          good: 88,
          excellent: 95,
        },
        period: 'monthly',
      },
    });

    await this.registerKPI({
      name: 'Average Wait Time',
      description: 'Average patient wait time in minutes',
      category: 'appointments',
      unit: 'minutes',
      aggregation: 'avg',
      datasource: 'appointments',
      refreshInterval: 1800,
      enabled: true,
      target: {
        targetValue: 15,
        threshold: {
          excellent: 10,
          good: 15,
          warning: 25,
          critical: 35,
        },
        period: 'daily',
      },
    });

    // Clinical KPIs
    await this.registerKPI({
      name: 'Patient Satisfaction Score',
      description: 'Average patient satisfaction rating (1-5)',
      category: 'clinical',
      unit: 'rating',
      aggregation: 'avg',
      datasource: 'surveys',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 4.5,
        threshold: {
          critical: 3.0,
          warning: 3.8,
          good: 4.3,
          excellent: 4.7,
        },
        period: 'monthly',
      },
    });

    await this.registerKPI({
      name: 'Average Visit Duration',
      description: 'Average duration of patient visits in minutes',
      category: 'clinical',
      unit: 'minutes',
      aggregation: 'avg',
      datasource: 'visits',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 30,
        threshold: {
          excellent: 25,
          good: 30,
          warning: 40,
          critical: 50,
        },
        period: 'monthly',
      },
    });

    // Telehealth KPIs
    await this.registerKPI({
      name: 'Telehealth Adoption Rate',
      description: 'Percentage of visits conducted via telehealth',
      category: 'telehealth',
      unit: 'percentage',
      aggregation: 'avg',
      datasource: 'visits',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 25,
        threshold: {
          critical: 10,
          warning: 15,
          good: 22,
          excellent: 30,
        },
        period: 'monthly',
      },
    });

    await this.registerKPI({
      name: 'Telehealth Completion Rate',
      description: 'Percentage of telehealth visits completed successfully',
      category: 'telehealth',
      unit: 'percentage',
      aggregation: 'avg',
      datasource: 'telehealth_visits',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 95,
        threshold: {
          critical: 75,
          warning: 85,
          good: 92,
          excellent: 98,
        },
        period: 'monthly',
      },
    });

    // Operational KPIs
    await this.registerKPI({
      name: 'Staff Utilization Rate',
      description: 'Percentage of staff time utilized',
      category: 'operational',
      unit: 'percentage',
      aggregation: 'avg',
      datasource: 'schedules',
      refreshInterval: 3600,
      enabled: true,
      target: {
        targetValue: 80,
        threshold: {
          critical: 50,
          warning: 65,
          good: 75,
          excellent: 85,
        },
        period: 'monthly',
      },
    });

    await this.registerKPI({
      name: 'Inventory Turnover',
      description: 'Number of times inventory is sold and replaced',
      category: 'inventory',
      unit: 'ratio',
      aggregation: 'avg',
      datasource: 'inventory',
      refreshInterval: 86400,
      enabled: true,
      target: {
        targetValue: 6,
        threshold: {
          critical: 2,
          warning: 4,
          good: 5.5,
          excellent: 7,
        },
        period: 'yearly',
      },
    });

    logger.info('Default KPIs registered');
  }

  /**
   * Register KPI
   */
  private static async registerKPI(config: {
    name: string;
    description: string;
    category: MetricCategory;
    unit: string;
    aggregation: MetricDefinition['aggregation'];
    datasource: string;
    refreshInterval: number;
    enabled: boolean;
    target: Omit<KPITarget, 'metricId'>;
  }): Promise<MetricDefinition> {
    // Register metric
    const metric = await AnalyticsEngineService.registerMetric({
      name: config.name,
      description: config.description,
      category: config.category,
      unit: config.unit,
      aggregation: config.aggregation,
      datasource: config.datasource,
      refreshInterval: config.refreshInterval,
      enabled: config.enabled,
    });

    // Set target
    const target: KPITarget = {
      metricId: metric.id,
      ...config.target,
    };

    this.targets.set(metric.id, target);

    return metric;
  }

  /**
   * Get KPI with status
   */
  static async getKPI(metricId: string): Promise<KPIWithStatus | null> {
    const metric = await AnalyticsEngineService.getMetric(metricId);
    const target = this.targets.get(metricId);

    if (!metric || !target) {
      return null;
    }

    const metricValue = await AnalyticsEngineService.getMetricValue(metricId, 'month');

    if (!metricValue) {
      return null;
    }

    const currentValue = metricValue.value;
    const percentOfTarget = (currentValue / target.targetValue) * 100;

    let status: KPIStatus;
    if (currentValue >= target.threshold.excellent) {
      status = 'excellent';
    } else if (currentValue >= target.threshold.good) {
      status = 'good';
    } else if (currentValue >= target.threshold.warning) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      metric,
      currentValue,
      targetValue: target.targetValue,
      status,
      percentOfTarget,
      trend: metricValue.trend,
      lastUpdated: metricValue.timestamp,
    };
  }

  /**
   * Get all KPIs for category
   */
  static async getKPIsByCategory(category: MetricCategory): Promise<KPICategoryGroup> {
    const metrics = await AnalyticsEngineService.listMetrics(category);

    const kpis: KPIWithStatus[] = [];

    for (const metric of metrics) {
      const kpi = await this.getKPI(metric.id);
      if (kpi) {
        kpis.push(kpi);
      }
    }

    // Calculate overall status
    const statusScores = { excellent: 4, good: 3, warning: 2, critical: 1 };
    const avgScore =
      kpis.reduce((sum, kpi) => sum + statusScores[kpi.status], 0) / kpis.length;

    let overallStatus: KPIStatus;
    if (avgScore >= 3.5) {
      overallStatus = 'excellent';
    } else if (avgScore >= 2.5) {
      overallStatus = 'good';
    } else if (avgScore >= 1.5) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'critical';
    }

    return {
      category,
      kpis,
      overallStatus,
    };
  }

  /**
   * Get all KPIs
   */
  static async getAllKPIs(): Promise<KPIWithStatus[]> {
    const categories: MetricCategory[] = [
      'revenue',
      'patients',
      'appointments',
      'clinical',
      'telehealth',
      'operational',
      'inventory',
      'marketing',
    ];

    const allKPIs: KPIWithStatus[] = [];

    for (const category of categories) {
      const group = await this.getKPIsByCategory(category);
      allKPIs.push(...group.kpis);
    }

    return allKPIs;
  }

  /**
   * Get KPI scorecard
   */
  static async getScorecard(): Promise<{
    categories: KPICategoryGroup[];
    overallScore: number;
    overallStatus: KPIStatus;
    totalKPIs: number;
    criticalKPIs: number;
    excellentKPIs: number;
  }> {
    const categories: MetricCategory[] = [
      'revenue',
      'patients',
      'appointments',
      'clinical',
      'telehealth',
      'operational',
    ];

    const categoryGroups: KPICategoryGroup[] = [];

    for (const category of categories) {
      const group = await this.getKPIsByCategory(category);
      if (group.kpis.length > 0) {
        categoryGroups.push(group);
      }
    }

    const allKPIs = categoryGroups.flatMap((g) => g.kpis);
    const totalKPIs = allKPIs.length;
    const criticalKPIs = allKPIs.filter((k) => k.status === 'critical').length;
    const excellentKPIs = allKPIs.filter((k) => k.status === 'excellent').length;

    const statusScores = { excellent: 4, good: 3, warning: 2, critical: 1 };
    const overallScore =
      allKPIs.reduce((sum, kpi) => sum + statusScores[kpi.status], 0) / totalKPIs;

    let overallStatus: KPIStatus;
    if (overallScore >= 3.5) {
      overallStatus = 'excellent';
    } else if (overallScore >= 2.5) {
      overallStatus = 'good';
    } else if (overallScore >= 1.5) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'critical';
    }

    return {
      categories: categoryGroups,
      overallScore,
      overallStatus,
      totalKPIs,
      criticalKPIs,
      excellentKPIs,
    };
  }

  /**
   * Set KPI target
   */
  static async setTarget(metricId: string, target: Omit<KPITarget, 'metricId'>): Promise<void> {
    const kpiTarget: KPITarget = {
      metricId,
      ...target,
    };

    this.targets.set(metricId, kpiTarget);

    logger.info({ metricId, targetValue: target.targetValue }, 'KPI target set');
  }

  /**
   * Get KPI target
   */
  static async getTarget(metricId: string): Promise<KPITarget | null> {
    return this.targets.get(metricId) || null;
  }
}
