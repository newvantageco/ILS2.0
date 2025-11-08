/**
 * Analytics Engine Service
 *
 * Core analytics processing engine for data aggregation, calculations,
 * and reporting across the platform
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Time period for analytics
 */
export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Aggregation function
 */
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct_count';

/**
 * Metric category
 */
export type MetricCategory =
  | 'revenue'
  | 'patients'
  | 'appointments'
  | 'clinical'
  | 'inventory'
  | 'telehealth'
  | 'marketing'
  | 'operational';

/**
 * Data point for time series
 */
export interface DataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

/**
 * Metric definition
 */
export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  unit: string; // e.g., 'dollars', 'count', 'percentage', 'minutes'
  aggregation: AggregationType;
  formula?: string; // For calculated metrics
  datasource: string;
  refreshInterval: number; // seconds
  enabled: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Metric value with metadata
 */
export interface MetricValue {
  metricId: string;
  metricName: string;
  value: number;
  unit: string;
  timestamp: Date;
  change?: number; // Percentage change from previous period
  trend?: 'up' | 'down' | 'stable';
  comparison?: {
    period: string;
    value: number;
    change: number;
  };
}

/**
 * Analytics query
 */
export interface AnalyticsQuery {
  metrics: string[]; // metric IDs
  dimensions?: string[]; // Group by dimensions
  filters?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: any;
  }>;
  timePeriod: TimePeriod;
  customStartDate?: Date;
  customEndDate?: Date;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
}

/**
 * Analytics result
 */
export interface AnalyticsResult {
  query: AnalyticsQuery;
  data: Array<{
    dimensions?: Record<string, any>;
    metrics: Record<string, number>;
    timestamp?: Date;
  }>;
  summary: {
    totalRows: number;
    executionTime: number; // milliseconds
    cacheHit: boolean;
  };
  generatedAt: Date;
}

/**
 * Cohort definition
 */
export interface Cohort {
  id: string;
  name: string;
  description: string;
  criteria: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  size?: number;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Cohort analysis result
 */
export interface CohortAnalysis {
  cohortId: string;
  cohortName: string;
  periods: Array<{
    period: string;
    activeCount: number;
    retentionRate: number;
    conversionRate?: number;
    revenue?: number;
  }>;
  totalSize: number;
  analysisDate: Date;
}

/**
 * Funnel step
 */
export interface FunnelStep {
  id: string;
  name: string;
  order: number;
  eventType: string;
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

/**
 * Funnel analysis
 */
export interface FunnelAnalysis {
  id: string;
  name: string;
  steps: Array<{
    step: FunnelStep;
    count: number;
    conversionRate: number;
    dropoffRate: number;
    avgTimeToNext?: number; // seconds
  }>;
  totalEntered: number;
  totalCompleted: number;
  overallConversionRate: number;
  avgCompletionTime: number;
  analysisDate: Date;
}

/**
 * Analytics Engine Service
 */
export class AnalyticsEngineService {
  /**
   * In-memory stores (use database in production)
   */
  private static metrics = new Map<string, MetricDefinition>();
  private static metricValues: Map<string, DataPoint[]> = new Map();
  private static cohorts = new Map<string, Cohort>();
  private static queryCache = new Map<string, AnalyticsResult>();

  /**
   * Configuration
   */
  private static readonly CACHE_TTL_SECONDS = 300; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly DEFAULT_LIMIT = 1000;

  // ========== Metric Management ==========

  /**
   * Register metric
   */
  static async registerMetric(definition: Omit<MetricDefinition, 'id' | 'createdAt'>): Promise<MetricDefinition> {
    const metric: MetricDefinition = {
      id: crypto.randomUUID(),
      ...definition,
      createdAt: new Date(),
    };

    this.metrics.set(metric.id, metric);

    logger.info({ metricId: metric.id, name: metric.name }, 'Metric registered');

    return metric;
  }

  /**
   * Get metric definition
   */
  static async getMetric(metricId: string): Promise<MetricDefinition | null> {
    return this.metrics.get(metricId) || null;
  }

  /**
   * List metrics
   */
  static async listMetrics(category?: MetricCategory): Promise<MetricDefinition[]> {
    let metrics = Array.from(this.metrics.values()).filter((m) => m.enabled);

    if (category) {
      metrics = metrics.filter((m) => m.category === category);
    }

    return metrics.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Record metric value
   */
  static async recordMetricValue(
    metricId: string,
    value: number,
    timestamp?: Date,
    metadata?: Record<string, any>
  ): Promise<void> {
    const metric = this.metrics.get(metricId);

    if (!metric) {
      throw new Error('Metric not found');
    }

    const dataPoint: DataPoint = {
      timestamp: timestamp || new Date(),
      value,
      metadata,
    };

    const values = this.metricValues.get(metricId) || [];
    values.push(dataPoint);
    this.metricValues.set(metricId, values);

    // Keep only last 90 days of data in memory
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const filtered = values.filter((v) => v.timestamp >= ninetyDaysAgo);
    this.metricValues.set(metricId, filtered);
  }

  /**
   * Get metric value
   */
  static async getMetricValue(
    metricId: string,
    period: TimePeriod,
    startDate?: Date,
    endDate?: Date
  ): Promise<MetricValue | null> {
    const metric = this.metrics.get(metricId);

    if (!metric) {
      return null;
    }

    const { start, end } = this.getDateRange(period, startDate, endDate);
    const values = this.metricValues.get(metricId) || [];

    const periodValues = values.filter(
      (v) => v.timestamp >= start && v.timestamp <= end
    );

    if (periodValues.length === 0) {
      return null;
    }

    const value = this.aggregate(
      periodValues.map((v) => v.value),
      metric.aggregation
    );

    // Calculate change from previous period
    const previousPeriod = this.getPreviousPeriod(start, end);
    const previousValues = values.filter(
      (v) => v.timestamp >= previousPeriod.start && v.timestamp <= previousPeriod.end
    );

    let change: number | undefined;
    let trend: MetricValue['trend'] | undefined;
    let comparison: MetricValue['comparison'] | undefined;

    if (previousValues.length > 0) {
      const previousValue = this.aggregate(
        previousValues.map((v) => v.value),
        metric.aggregation
      );

      change = previousValue !== 0 ? ((value - previousValue) / previousValue) * 100 : 0;
      trend = Math.abs(change) < 1 ? 'stable' : change > 0 ? 'up' : 'down';

      comparison = {
        period: this.formatPeriod(previousPeriod.start, previousPeriod.end),
        value: previousValue,
        change,
      };
    }

    return {
      metricId,
      metricName: metric.name,
      value,
      unit: metric.unit,
      timestamp: new Date(),
      change,
      trend,
      comparison,
    };
  }

  /**
   * Get metric time series
   */
  static async getMetricTimeSeries(
    metricId: string,
    period: TimePeriod,
    granularity: AnalyticsQuery['granularity'] = 'day',
    startDate?: Date,
    endDate?: Date
  ): Promise<DataPoint[]> {
    const metric = this.metrics.get(metricId);

    if (!metric) {
      return [];
    }

    const { start, end } = this.getDateRange(period, startDate, endDate);
    const values = this.metricValues.get(metricId) || [];

    const periodValues = values.filter(
      (v) => v.timestamp >= start && v.timestamp <= end
    );

    // Group by granularity
    const grouped = this.groupByTime(periodValues, granularity!);

    return grouped.map((group) => ({
      timestamp: group.timestamp,
      value: this.aggregate(
        group.values.map((v) => v.value),
        metric.aggregation
      ),
      label: this.formatTimestamp(group.timestamp, granularity!),
    }));
  }

  // ========== Query Execution ==========

  /**
   * Execute analytics query
   */
  static async executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.generateCacheKey(query);
    const cached = this.queryCache.get(cacheKey);

    if (cached) {
      const age = Date.now() - cached.generatedAt.getTime();
      if (age < this.CACHE_TTL_SECONDS * 1000) {
        logger.info({ cacheKey }, 'Analytics query cache hit');
        return cached;
      }
    }

    // Execute query
    const { start, end } = this.getDateRange(
      query.timePeriod,
      query.customStartDate,
      query.customEndDate
    );

    const data: AnalyticsResult['data'] = [];

    // Get metric values
    for (const metricId of query.metrics) {
      const metric = this.metrics.get(metricId);
      if (!metric) continue;

      const values = this.metricValues.get(metricId) || [];
      const periodValues = values.filter(
        (v) => v.timestamp >= start && v.timestamp <= end
      );

      // Apply filters
      let filtered = periodValues;
      if (query.filters) {
        filtered = this.applyFilters(filtered, query.filters);
      }

      // Group by dimensions or time
      if (query.dimensions && query.dimensions.length > 0) {
        const grouped = this.groupByDimensions(filtered, query.dimensions);
        grouped.forEach((group) => {
          data.push({
            dimensions: group.dimensions,
            metrics: {
              [metricId]: this.aggregate(
                group.values.map((v) => v.value),
                metric.aggregation
              ),
            },
          });
        });
      } else if (query.granularity) {
        const timeGrouped = this.groupByTime(filtered, query.granularity);
        timeGrouped.forEach((group) => {
          const existing = data.find(
            (d) => d.timestamp?.getTime() === group.timestamp.getTime()
          );

          if (existing) {
            existing.metrics[metricId] = this.aggregate(
              group.values.map((v) => v.value),
              metric.aggregation
            );
          } else {
            data.push({
              timestamp: group.timestamp,
              metrics: {
                [metricId]: this.aggregate(
                  group.values.map((v) => v.value),
                  metric.aggregation
                ),
              },
            });
          }
        });
      } else {
        // Single aggregated value
        const value = this.aggregate(
          filtered.map((v) => v.value),
          metric.aggregation
        );

        const existing = data[0];
        if (existing) {
          existing.metrics[metricId] = value;
        } else {
          data.push({
            metrics: { [metricId]: value },
          });
        }
      }
    }

    // Apply limit
    const limit = query.limit || this.DEFAULT_LIMIT;
    const limitedData = data.slice(0, limit);

    const result: AnalyticsResult = {
      query,
      data: limitedData,
      summary: {
        totalRows: limitedData.length,
        executionTime: Date.now() - startTime,
        cacheHit: false,
      },
      generatedAt: new Date(),
    };

    // Cache result
    this.cacheResult(cacheKey, result);

    logger.info(
      {
        metrics: query.metrics.length,
        rows: result.summary.totalRows,
        executionTime: result.summary.executionTime,
      },
      'Analytics query executed'
    );

    return result;
  }

  // ========== Cohort Analysis ==========

  /**
   * Create cohort
   */
  static async createCohort(
    name: string,
    description: string,
    criteria: Cohort['criteria']
  ): Promise<Cohort> {
    const cohort: Cohort = {
      id: crypto.randomUUID(),
      name,
      description,
      criteria,
      createdAt: new Date(),
    };

    this.cohorts.set(cohort.id, cohort);

    logger.info({ cohortId: cohort.id, name }, 'Cohort created');

    return cohort;
  }

  /**
   * Analyze cohort
   */
  static async analyzeCohort(
    cohortId: string,
    metricId: string,
    periods: number = 12
  ): Promise<CohortAnalysis> {
    const cohort = this.cohorts.get(cohortId);

    if (!cohort) {
      throw new Error('Cohort not found');
    }

    // In production, this would query the actual data
    // For now, generate sample analysis
    const analysis: CohortAnalysis = {
      cohortId,
      cohortName: cohort.name,
      periods: [],
      totalSize: 1000, // Sample size
      analysisDate: new Date(),
    };

    for (let i = 0; i < periods; i++) {
      const retentionRate = 100 - i * 5; // Sample retention decay
      analysis.periods.push({
        period: `Period ${i + 1}`,
        activeCount: Math.floor((1000 * retentionRate) / 100),
        retentionRate,
        conversionRate: Math.max(0, retentionRate - 10),
        revenue: Math.floor(Math.random() * 50000),
      });
    }

    return analysis;
  }

  // ========== Funnel Analysis ==========

  /**
   * Analyze funnel
   */
  static async analyzeFunnel(
    name: string,
    steps: FunnelStep[],
    startDate: Date,
    endDate: Date
  ): Promise<FunnelAnalysis> {
    // In production, this would query actual event data
    // For now, generate sample analysis
    const totalEntered = 10000;
    let previousCount = totalEntered;

    const analyzedSteps = steps.map((step, index) => {
      const dropoff = Math.random() * 0.3; // 0-30% dropoff
      const count = Math.floor(previousCount * (1 - dropoff));
      const conversionRate = (count / totalEntered) * 100;
      const dropoffRate = ((previousCount - count) / previousCount) * 100;

      previousCount = count;

      return {
        step,
        count,
        conversionRate,
        dropoffRate,
        avgTimeToNext: index < steps.length - 1 ? Math.floor(Math.random() * 3600) : undefined,
      };
    });

    const totalCompleted = analyzedSteps[analyzedSteps.length - 1]?.count || 0;

    return {
      id: crypto.randomUUID(),
      name,
      steps: analyzedSteps,
      totalEntered,
      totalCompleted,
      overallConversionRate: (totalCompleted / totalEntered) * 100,
      avgCompletionTime: steps.length * 1800, // Sample: 30 min per step
      analysisDate: new Date(),
    };
  }

  // ========== Helper Methods ==========

  /**
   * Get date range for period
   */
  private static getDateRange(
    period: TimePeriod,
    customStart?: Date,
    customEnd?: Date
  ): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    switch (period) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;

      case 'yesterday':
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;

      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;

      case 'month':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;

      case 'quarter':
        start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        break;

      case 'year':
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        break;

      case 'custom':
        if (!customStart || !customEnd) {
          throw new Error('Custom period requires start and end dates');
        }
        start = customStart;
        end = customEnd;
        break;

      default:
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
    }

    return { start, end };
  }

  /**
   * Get previous period
   */
  private static getPreviousPeriod(start: Date, end: Date): { start: Date; end: Date } {
    const duration = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - duration),
      end: new Date(start.getTime() - 1),
    };
  }

  /**
   * Aggregate values
   */
  private static aggregate(values: number[], type: AggregationType): number {
    if (values.length === 0) return 0;

    switch (type) {
      case 'sum':
        return values.reduce((sum, v) => sum + v, 0);

      case 'avg':
        return values.reduce((sum, v) => sum + v, 0) / values.length;

      case 'min':
        return Math.min(...values);

      case 'max':
        return Math.max(...values);

      case 'count':
        return values.length;

      case 'distinct_count':
        return new Set(values).size;

      default:
        return 0;
    }
  }

  /**
   * Group data points by time
   */
  private static groupByTime(
    values: DataPoint[],
    granularity: 'hour' | 'day' | 'week' | 'month'
  ): Array<{ timestamp: Date; values: DataPoint[] }> {
    const groups = new Map<string, DataPoint[]>();

    values.forEach((value) => {
      const key = this.getTimeKey(value.timestamp, granularity);
      const existing = groups.get(key) || [];
      existing.push(value);
      groups.set(key, existing);
    });

    return Array.from(groups.entries())
      .map(([key, vals]) => ({
        timestamp: this.parseTimeKey(key, granularity),
        values: vals,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get time key for grouping
   */
  private static getTimeKey(date: Date, granularity: 'hour' | 'day' | 'week' | 'month'): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();

    switch (granularity) {
      case 'hour':
        return `${year}-${month}-${day}-${hour}`;
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return `${weekStart.getFullYear()}-W${weekStart.getMonth()}-${weekStart.getDate()}`;
      case 'month':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Parse time key back to date
   */
  private static parseTimeKey(key: string, granularity: 'hour' | 'day' | 'week' | 'month'): Date {
    const parts = key.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);

    switch (granularity) {
      case 'hour':
        return new Date(year, month, parseInt(parts[2]), parseInt(parts[3]));
      case 'day':
        return new Date(year, month, parseInt(parts[2]));
      case 'week':
        return new Date(year, month, parseInt(parts[2]));
      case 'month':
        return new Date(year, month, 1);
      default:
        return new Date(year, month, parseInt(parts[2]));
    }
  }

  /**
   * Group by dimensions
   */
  private static groupByDimensions(
    values: DataPoint[],
    dimensions: string[]
  ): Array<{ dimensions: Record<string, any>; values: DataPoint[] }> {
    const groups = new Map<string, DataPoint[]>();

    values.forEach((value) => {
      const dimValues = dimensions.map((dim) => value.metadata?.[dim] || 'unknown');
      const key = dimValues.join('|');
      const existing = groups.get(key) || [];
      existing.push(value);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).map(([key, vals]) => {
      const dimValues = key.split('|');
      const dimensionObj: Record<string, any> = {};
      dimensions.forEach((dim, i) => {
        dimensionObj[dim] = dimValues[i];
      });

      return {
        dimensions: dimensionObj,
        values: vals,
      };
    });
  }

  /**
   * Apply filters
   */
  private static applyFilters(
    values: DataPoint[],
    filters: AnalyticsQuery['filters']
  ): DataPoint[] {
    if (!filters) return values;

    return values.filter((value) => {
      return filters.every((filter) => {
        const fieldValue = value.metadata?.[filter.field];

        switch (filter.operator) {
          case 'eq':
            return fieldValue === filter.value;
          case 'ne':
            return fieldValue !== filter.value;
          case 'gt':
            return fieldValue > filter.value;
          case 'gte':
            return fieldValue >= filter.value;
          case 'lt':
            return fieldValue < filter.value;
          case 'lte':
            return fieldValue <= filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(fieldValue);
          case 'contains':
            return String(fieldValue).includes(String(filter.value));
          default:
            return true;
        }
      });
    });
  }

  /**
   * Format period
   */
  private static formatPeriod(start: Date, end: Date): string {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  /**
   * Format timestamp
   */
  private static formatTimestamp(date: Date, granularity: 'hour' | 'day' | 'week' | 'month'): string {
    switch (granularity) {
      case 'hour':
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Generate cache key
   */
  private static generateCacheKey(query: AnalyticsQuery): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(query))
      .digest('hex');
  }

  /**
   * Cache result
   */
  private static cacheResult(key: string, result: AnalyticsResult): void {
    // Implement LRU cache eviction
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }

    this.queryCache.set(key, result);
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.queryCache.clear();
    logger.info('Analytics cache cleared');
  }
}
