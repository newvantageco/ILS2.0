/**
 * Quality Metrics Service
 *
 * Tracks clinical quality indicators, quality measures, and performance metrics
 * for compliance, accreditation, and quality improvement initiatives
 */

import { loggers } from '../../utils/logger.js';
import { db } from '../../db.js';
import { patients, orders } from '@shared/schema';
import { eq, gte, lte, and, sql } from 'drizzle-orm';

const logger = loggers.api;

/**
 * Quality Metric Definition
 */
export interface QualityMetric {
  id: string;
  name: string;
  description: string;
  category: 'clinical' | 'operational' | 'patient_safety' | 'access' | 'efficiency';
  type: 'rate' | 'percentage' | 'count' | 'average' | 'ratio';

  // Calculation
  numerator: string; // Description of what counts in numerator
  denominator: string; // Description of what counts in denominator
  calculation: (companyId: string, startDate: Date, endDate: Date) => Promise<MetricResult>;

  // Target and benchmarks
  target?: number;
  benchmarks?: {
    national?: number;
    regional?: number;
    topPerformer?: number;
  };

  // Metadata
  dataSource: string;
  reportingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  owner?: string;
  tags?: string[];
  active: boolean;
  createdAt: Date;
}

/**
 * Metric Result
 */
export interface MetricResult {
  metricId: string;
  metricName: string;
  period: {
    start: Date;
    end: Date;
  };
  value: number;
  numerator: number;
  denominator: number;
  target?: number;
  performance: 'above_target' | 'at_target' | 'below_target' | 'no_target';
  trend?: 'improving' | 'declining' | 'stable';
  comparisonToPrevious?: {
    previousValue: number;
    change: number;
    changePercent: number;
  };
  calculatedAt: Date;
}

/**
 * Quality Dashboard Summary
 */
export interface QualityDashboard {
  companyId: string;
  period: {
    start: Date;
    end: Date;
  };
  overallScore: number; // 0-100
  metrics: {
    total: number;
    aboveTarget: number;
    atTarget: number;
    belowTarget: number;
  };
  categories: Array<{
    category: string;
    score: number;
    metricsCount: number;
  }>;
  topPerformers: MetricResult[];
  needsAttention: MetricResult[];
  trends: {
    improving: number;
    declining: number;
    stable: number;
  };
}

/**
 * Quality Metrics Service
 */
export class QualityMetricsService {
  /**
   * In-memory metrics store (use database in production)
   */
  private static metrics = new Map<string, QualityMetric>();

  /**
   * In-memory results store (use database in production)
   */
  private static results: MetricResult[] = [];

  /**
   * Initialize default quality metrics
   */
  static initializeDefaultMetrics(): void {
    const defaultMetrics: Omit<QualityMetric, 'id' | 'createdAt'>[] = [
      {
        name: 'Annual Diabetic Eye Exam Rate',
        description: 'Percentage of diabetic patients who received annual eye exams',
        category: 'clinical',
        type: 'percentage',
        numerator: 'Diabetic patients with eye exam in past 12 months',
        denominator: 'Total diabetic patients',
        calculation: this.calculateDiabeticExamRate.bind(this),
        target: 85,
        benchmarks: {
          national: 75,
          topPerformer: 90,
        },
        dataSource: 'patients',
        reportingFrequency: 'quarterly',
        tags: ['diabetes', 'preventive care'],
        active: true,
      },

      {
        name: 'Pediatric Vision Screening Rate',
        description: 'Percentage of pediatric patients screened for vision problems',
        category: 'clinical',
        type: 'percentage',
        numerator: 'Pediatric patients with vision screening',
        denominator: 'Total pediatric patients (age < 18)',
        calculation: this.calculatePediatricScreeningRate.bind(this),
        target: 90,
        benchmarks: {
          national: 80,
          topPerformer: 95,
        },
        dataSource: 'patients',
        reportingFrequency: 'quarterly',
        tags: ['pediatric', 'screening'],
        active: true,
      },

      {
        name: 'Patient Appointment No-Show Rate',
        description: 'Percentage of scheduled appointments that were no-shows',
        category: 'access',
        type: 'percentage',
        numerator: 'No-show appointments',
        denominator: 'Total scheduled appointments',
        calculation: this.calculateNoShowRate.bind(this),
        target: 10, // Lower is better
        benchmarks: {
          national: 15,
          topPerformer: 5,
        },
        dataSource: 'appointments',
        reportingFrequency: 'monthly',
        tags: ['access', 'efficiency'],
        active: true,
      },

      {
        name: 'Average Days to Follow-up Appointment',
        description: 'Average time from exam to next scheduled follow-up',
        category: 'access',
        type: 'average',
        numerator: 'Total days to follow-up',
        denominator: 'Number of follow-up appointments',
        calculation: this.calculateAverageFollowupDays.bind(this),
        target: 30,
        benchmarks: {
          national: 45,
          topPerformer: 21,
        },
        dataSource: 'appointments',
        reportingFrequency: 'monthly',
        tags: ['access', 'follow-up'],
        active: true,
      },

      {
        name: 'Patient Retention Rate (12 months)',
        description: 'Percentage of patients who returned within 12 months',
        category: 'operational',
        type: 'percentage',
        numerator: 'Patients with visit in past 12 months',
        denominator: 'Total active patients',
        calculation: this.calculateRetentionRate.bind(this),
        target: 75,
        benchmarks: {
          national: 65,
          topPerformer: 85,
        },
        dataSource: 'patients',
        reportingFrequency: 'quarterly',
        tags: ['retention', 'engagement'],
        active: true,
      },

      {
        name: 'Order Fulfillment Time',
        description: 'Average time from order placement to completion',
        category: 'efficiency',
        type: 'average',
        numerator: 'Total hours to fulfill',
        denominator: 'Number of completed orders',
        calculation: this.calculateOrderFulfillmentTime.bind(this),
        target: 48, // 48 hours
        benchmarks: {
          national: 72,
          topPerformer: 24,
        },
        dataSource: 'orders',
        reportingFrequency: 'weekly',
        tags: ['efficiency', 'orders'],
        active: true,
      },

      {
        name: 'High-Risk Patient Monitoring Rate',
        description: 'Percentage of high-risk patients with documented monitoring',
        category: 'patient_safety',
        type: 'percentage',
        numerator: 'High-risk patients with monitoring in past 6 months',
        denominator: 'Total high-risk patients',
        calculation: this.calculateHighRiskMonitoringRate.bind(this),
        target: 95,
        benchmarks: {
          national: 85,
          topPerformer: 98,
        },
        dataSource: 'patients',
        reportingFrequency: 'monthly',
        tags: ['safety', 'monitoring'],
        active: true,
      },

      {
        name: 'Patient Satisfaction Score',
        description: 'Average patient satisfaction rating (1-5 scale)',
        category: 'operational',
        type: 'average',
        numerator: 'Total satisfaction score',
        denominator: 'Number of surveys',
        calculation: this.calculatePatientSatisfaction.bind(this),
        target: 4.5,
        benchmarks: {
          national: 4.2,
          topPerformer: 4.8,
        },
        dataSource: 'surveys',
        reportingFrequency: 'monthly',
        tags: ['satisfaction', 'patient experience'],
        active: true,
      },
    ];

    defaultMetrics.forEach((metric) => {
      const fullMetric: QualityMetric = {
        ...metric,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };

      this.metrics.set(fullMetric.id, fullMetric);
    });

    logger.info({ count: defaultMetrics.length }, 'Default quality metrics initialized');
  }

  /**
   * Get all metrics
   */
  static async getAllMetrics(category?: QualityMetric['category']): Promise<QualityMetric[]> {
    const allMetrics = Array.from(this.metrics.values()).filter((m) => m.active);

    if (category) {
      return allMetrics.filter((m) => m.category === category);
    }

    return allMetrics;
  }

  /**
   * Get metric by ID
   */
  static async getMetric(metricId: string): Promise<QualityMetric | null> {
    return this.metrics.get(metricId) || null;
  }

  /**
   * Calculate all metrics for a period
   */
  static async calculateAllMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult[]> {
    logger.info({ companyId, startDate, endDate }, 'Calculating all quality metrics');

    const metrics = await this.getAllMetrics();
    const results: MetricResult[] = [];

    for (const metric of metrics) {
      try {
        const result = await metric.calculation(companyId, startDate, endDate);
        results.push(result);

        // Store result
        this.results.push(result);
      } catch (error) {
        logger.error({ metricId: metric.id, error }, 'Failed to calculate metric');
      }
    }

    return results;
  }

  /**
   * Get quality dashboard summary
   */
  static async getQualityDashboard(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<QualityDashboard> {
    // Calculate all metrics
    const results = await this.calculateAllMetrics(companyId, startDate, endDate);

    // Count performance levels
    let aboveTarget = 0;
    let atTarget = 0;
    let belowTarget = 0;

    results.forEach((result) => {
      switch (result.performance) {
        case 'above_target':
          aboveTarget++;
          break;
        case 'at_target':
          atTarget++;
          break;
        case 'below_target':
          belowTarget++;
          break;
      }
    });

    // Calculate overall score (percentage of metrics meeting or exceeding target)
    const total = results.length;
    const overallScore = total > 0 ? ((aboveTarget + atTarget) / total) * 100 : 0;

    // Group by category
    const categoryMap = new Map<string, { total: number; score: number }>();

    results.forEach((result) => {
      const metric = this.metrics.get(result.metricId);
      if (!metric) return;

      const category = metric.category;
      const current = categoryMap.get(category) || { total: 0, score: 0 };

      current.total++;
      if (result.performance === 'above_target' || result.performance === 'at_target') {
        current.score++;
      }

      categoryMap.set(category, current);
    });

    const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      score: data.total > 0 ? (data.score / data.total) * 100 : 0,
      metricsCount: data.total,
    }));

    // Top performers (above target)
    const topPerformers = results
      .filter((r) => r.performance === 'above_target')
      .sort((a, b) => {
        if (!a.target || !b.target) return 0;
        const aDistance = Math.abs(a.value - a.target);
        const bDistance = Math.abs(b.value - b.target);
        return bDistance - aDistance;
      })
      .slice(0, 5);

    // Needs attention (below target)
    const needsAttention = results
      .filter((r) => r.performance === 'below_target')
      .sort((a, b) => {
        if (!a.target || !b.target) return 0;
        const aDistance = Math.abs(a.value - a.target);
        const bDistance = Math.abs(b.value - b.target);
        return bDistance - aDistance;
      })
      .slice(0, 5);

    // Count trends
    const trends = {
      improving: results.filter((r) => r.trend === 'improving').length,
      declining: results.filter((r) => r.trend === 'declining').length,
      stable: results.filter((r) => r.trend === 'stable').length,
    };

    return {
      companyId,
      period: { start: startDate, end: endDate },
      overallScore,
      metrics: {
        total,
        aboveTarget,
        atTarget,
        belowTarget,
      },
      categories,
      topPerformers,
      needsAttention,
      trends,
    };
  }

  /**
   * Get metric history
   */
  static async getMetricHistory(
    metricId: string,
    limit: number = 12
  ): Promise<MetricResult[]> {
    return this.results
      .filter((r) => r.metricId === metricId)
      .slice(-limit)
      .reverse();
  }

  // ========== Metric Calculations ==========

  /**
   * Calculate diabetic eye exam rate
   */
  private static async calculateDiabeticExamRate(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult> {
    // Get all patients (in production, would filter by diagnosis)
    const allPatients = await db
      .select()
      .from(patients)
      .where(eq(patients.companyId, companyId));

    // Mock: Assume 20% are diabetic
    const diabeticPatients = allPatients.filter((_, i) => i % 5 === 0);
    const denominator = diabeticPatients.length;

    // Count those with exams in past 12 months
    const oneYearAgo = new Date(endDate);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const numerator = diabeticPatients.filter((p) => {
      if (!p.lastExaminationDate) return false;
      return new Date(p.lastExaminationDate) >= oneYearAgo;
    }).length;

    const value = denominator > 0 ? (numerator / denominator) * 100 : 0;
    const target = 85;

    return {
      metricId: 'diabetic_exam_rate',
      metricName: 'Annual Diabetic Eye Exam Rate',
      period: { start: startDate, end: endDate },
      value,
      numerator,
      denominator,
      target,
      performance: this.evaluatePerformance(value, target, 'higher_is_better'),
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate pediatric screening rate
   */
  private static async calculatePediatricScreeningRate(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult> {
    const allPatients = await db
      .select()
      .from(patients)
      .where(eq(patients.companyId, companyId));

    // Calculate ages and filter pediatric
    const pediatricPatients = allPatients.filter((p) => {
      if (!p.dateOfBirth) return false;
      const age = Math.floor(
        (Date.now() - new Date(p.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      );
      return age < 18;
    });

    const denominator = pediatricPatients.length;

    // Count those with recent screenings
    const numerator = pediatricPatients.filter((p) => p.lastExaminationDate).length;

    const value = denominator > 0 ? (numerator / denominator) * 100 : 0;
    const target = 90;

    return {
      metricId: 'pediatric_screening_rate',
      metricName: 'Pediatric Vision Screening Rate',
      period: { start: startDate, end: endDate },
      value,
      numerator,
      denominator,
      target,
      performance: this.evaluatePerformance(value, target, 'higher_is_better'),
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate no-show rate (mock)
   */
  private static async calculateNoShowRate(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult> {
    // Mock data - in production would query appointments table
    const totalAppointments = 200;
    const noShows = 18;

    const value = (noShows / totalAppointments) * 100;
    const target = 10;

    return {
      metricId: 'no_show_rate',
      metricName: 'Patient Appointment No-Show Rate',
      period: { start: startDate, end: endDate },
      value,
      numerator: noShows,
      denominator: totalAppointments,
      target,
      performance: this.evaluatePerformance(value, target, 'lower_is_better'),
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate average follow-up days (mock)
   */
  private static async calculateAverageFollowupDays(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult> {
    // Mock data
    const totalDays = 3250;
    const followupCount = 120;
    const value = totalDays / followupCount;
    const target = 30;

    return {
      metricId: 'avg_followup_days',
      metricName: 'Average Days to Follow-up Appointment',
      period: { start: startDate, end: endDate },
      value,
      numerator: totalDays,
      denominator: followupCount,
      target,
      performance: this.evaluatePerformance(value, target, 'lower_is_better'),
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate retention rate
   */
  private static async calculateRetentionRate(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult> {
    const allPatients = await db
      .select()
      .from(patients)
      .where(eq(patients.companyId, companyId));

    const denominator = allPatients.length;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const numerator = allPatients.filter((p) => {
      if (!p.lastExaminationDate) return false;
      return new Date(p.lastExaminationDate) >= oneYearAgo;
    }).length;

    const value = denominator > 0 ? (numerator / denominator) * 100 : 0;
    const target = 75;

    return {
      metricId: 'retention_rate',
      metricName: 'Patient Retention Rate (12 months)',
      period: { start: startDate, end: endDate },
      value,
      numerator,
      denominator,
      target,
      performance: this.evaluatePerformance(value, target, 'higher_is_better'),
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate order fulfillment time
   */
  private static async calculateOrderFulfillmentTime(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult> {
    const completedOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.companyId, companyId),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );

    const denominator = completedOrders.length;

    // Calculate fulfillment times
    const totalHours = completedOrders.reduce((sum, order) => {
      // Mock: assume 24-72 hour fulfillment
      return sum + (Math.random() * 48 + 24);
    }, 0);

    const value = denominator > 0 ? totalHours / denominator : 0;
    const target = 48;

    return {
      metricId: 'order_fulfillment_time',
      metricName: 'Order Fulfillment Time',
      period: { start: startDate, end: endDate },
      value,
      numerator: totalHours,
      denominator,
      target,
      performance: this.evaluatePerformance(value, target, 'lower_is_better'),
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate high-risk monitoring rate (mock)
   */
  private static async calculateHighRiskMonitoringRate(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult> {
    // Mock data
    const highRiskPatients = 50;
    const monitored = 47;

    const value = (monitored / highRiskPatients) * 100;
    const target = 95;

    return {
      metricId: 'high_risk_monitoring',
      metricName: 'High-Risk Patient Monitoring Rate',
      period: { start: startDate, end: endDate },
      value,
      numerator: monitored,
      denominator: highRiskPatients,
      target,
      performance: this.evaluatePerformance(value, target, 'higher_is_better'),
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate patient satisfaction (mock)
   */
  private static async calculatePatientSatisfaction(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricResult> {
    // Mock data
    const totalScore = 892;
    const surveyCount = 200;

    const value = totalScore / surveyCount;
    const target = 4.5;

    return {
      metricId: 'patient_satisfaction',
      metricName: 'Patient Satisfaction Score',
      period: { start: startDate, end: endDate },
      value,
      numerator: totalScore,
      denominator: surveyCount,
      target,
      performance: this.evaluatePerformance(value, target, 'higher_is_better'),
      calculatedAt: new Date(),
    };
  }

  /**
   * Evaluate performance against target
   */
  private static evaluatePerformance(
    value: number,
    target: number,
    direction: 'higher_is_better' | 'lower_is_better'
  ): MetricResult['performance'] {
    const tolerance = 0.05; // 5% tolerance for "at target"

    if (direction === 'higher_is_better') {
      if (value >= target) return 'above_target';
      if (value >= target * (1 - tolerance)) return 'at_target';
      return 'below_target';
    } else {
      if (value <= target) return 'above_target';
      if (value <= target * (1 + tolerance)) return 'at_target';
      return 'below_target';
    }
  }
}

// Initialize default metrics on module load
QualityMetricsService.initializeDefaultMetrics();
