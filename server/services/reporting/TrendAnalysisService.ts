/**
 * Trend Analysis Service
 *
 * Analyzes patient data trends over time and provides predictions
 * for clinical decision support and population health management
 */

import { loggers } from '../../utils/logger.js';
import { db } from '../../db.js';
import { patients, orders } from '@shared/schema';
import { eq, gte, lte, and, sql } from 'drizzle-orm';

const logger = loggers.api;

/**
 * Trend Data Point
 */
export interface TrendDataPoint {
  date: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

/**
 * Trend Analysis Result
 */
export interface TrendAnalysis {
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  dataPoints: TrendDataPoint[];

  // Statistical analysis
  statistics: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    trendStrength: number; // -1 to 1
    changePercent: number; // Overall change percentage
  };

  // Predictions
  predictions?: TrendDataPoint[];
  confidenceInterval?: {
    lower: TrendDataPoint[];
    upper: TrendDataPoint[];
  };
}

/**
 * Patient Trend Analysis
 */
export interface PatientTrend {
  patientId: string;
  metric: string;
  trends: TrendAnalysis;
  alerts?: Array<{
    type: 'anomaly' | 'threshold' | 'prediction';
    severity: 'low' | 'medium' | 'high';
    message: string;
    date: Date;
  }>;
}

/**
 * Cohort Analysis
 */
export interface CohortAnalysis {
  cohortName: string;
  cohortSize: number;
  period: string;
  metrics: {
    retention: number;
    conversion: number;
    averageValue: number;
  };
  breakdown: Array<{
    period: string;
    active: number;
    retained: number;
    retentionRate: number;
  }>;
}

/**
 * Trend Analysis Service
 */
export class TrendAnalysisService {
  /**
   * Analyze patient visit trends
   */
  static async analyzeVisitTrends(
    companyId: string,
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<TrendAnalysis> {
    logger.info({ companyId, startDate, endDate, period }, 'Analyzing visit trends');

    // Get patient data with last examination dates
    const patientData = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.companyId, companyId),
          gte(patients.lastExaminationDate, startDate),
          lte(patients.lastExaminationDate, endDate)
        )
      );

    // Group by period
    const dataPoints = this.groupByPeriod(
      patientData,
      period,
      startDate,
      endDate,
      (patient) => patient.lastExaminationDate
    );

    // Calculate statistics
    const statistics = this.calculateStatistics(dataPoints);

    // Generate predictions
    const predictions = this.generatePredictions(dataPoints, 3); // 3 periods ahead

    return {
      metric: 'patient_visits',
      period,
      startDate,
      endDate,
      dataPoints,
      statistics,
      predictions,
    };
  }

  /**
   * Analyze patient age distribution trends
   */
  static async analyzeAgeTrends(companyId: string): Promise<{
    ageGroups: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    averageAge: number;
    medianAge: number;
  }> {
    logger.info({ companyId }, 'Analyzing age distribution trends');

    // Get all patients
    const allPatients = await db
      .select()
      .from(patients)
      .where(eq(patients.companyId, companyId));

    // Calculate ages
    const ages = allPatients
      .map((p) => {
        if (!p.dateOfBirth) return null;
        const birthDate = new Date(p.dateOfBirth);
        return Math.floor(
          (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        );
      })
      .filter((age): age is number => age !== null);

    // Define age groups
    const ageRanges = [
      { range: '0-17', min: 0, max: 17 },
      { range: '18-39', min: 18, max: 39 },
      { range: '40-64', min: 40, max: 64 },
      { range: '65+', min: 65, max: 150 },
    ];

    const totalPatients = ages.length;

    const ageGroups = ageRanges.map((range) => {
      const count = ages.filter((age) => age >= range.min && age <= range.max).length;

      return {
        range: range.range,
        count,
        percentage: totalPatients > 0 ? (count / totalPatients) * 100 : 0,
      };
    });

    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    const sortedAges = [...ages].sort((a, b) => a - b);
    const medianAge = sortedAges[Math.floor(sortedAges.length / 2)];

    return {
      ageGroups,
      averageAge,
      medianAge,
    };
  }

  /**
   * Analyze order revenue trends
   */
  static async analyzeRevenueTrends(
    companyId: string,
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<TrendAnalysis> {
    logger.info({ companyId, startDate, endDate, period }, 'Analyzing revenue trends');

    // Get orders in date range
    const orderData = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.companyId, companyId),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );

    // Group by period and sum totals
    const groupedData = new Map<string, number>();

    orderData.forEach((order) => {
      const periodKey = this.getPeriodKey(order.createdAt, period);
      const currentTotal = groupedData.get(periodKey) || 0;
      groupedData.set(periodKey, currentTotal + (order.totalAmount || 0));
    });

    // Convert to data points
    const dataPoints: TrendDataPoint[] = [];
    const periods = this.generatePeriods(startDate, endDate, period);

    periods.forEach((periodDate) => {
      const periodKey = this.getPeriodKey(periodDate, period);
      const value = groupedData.get(periodKey) || 0;

      dataPoints.push({
        date: periodDate,
        value,
      });
    });

    // Calculate statistics
    const statistics = this.calculateStatistics(dataPoints);

    // Generate predictions
    const predictions = this.generatePredictions(dataPoints, 3);

    return {
      metric: 'revenue',
      period,
      startDate,
      endDate,
      dataPoints,
      statistics,
      predictions,
    };
  }

  /**
   * Analyze patient retention
   */
  static async analyzePatientRetention(
    companyId: string,
    months: number = 12
  ): Promise<CohortAnalysis[]> {
    logger.info({ companyId, months }, 'Analyzing patient retention');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get all patients
    const allPatients = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.companyId, companyId),
          gte(patients.createdAt, startDate),
          lte(patients.createdAt, endDate)
        )
      );

    // Group patients by month of first visit
    const cohorts = new Map<string, any[]>();

    allPatients.forEach((patient) => {
      const cohortMonth = new Date(patient.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!cohorts.has(cohortMonth)) {
        cohorts.set(cohortMonth, []);
      }
      cohorts.get(cohortMonth)!.push(patient);
    });

    // Analyze each cohort
    const cohortAnalyses: CohortAnalysis[] = [];

    cohorts.forEach((cohortPatients, cohortMonth) => {
      const cohortSize = cohortPatients.length;
      const breakdown: CohortAnalysis['breakdown'] = [];

      // For each subsequent month, calculate retention
      const cohortStartDate = new Date(cohortMonth + '-01');

      for (let i = 0; i <= 12; i++) {
        const checkDate = new Date(cohortStartDate);
        checkDate.setMonth(checkDate.getMonth() + i);

        const retained = cohortPatients.filter((patient) => {
          if (!patient.lastExaminationDate) return false;

          const lastExam = new Date(patient.lastExaminationDate);
          return lastExam >= checkDate;
        }).length;

        const retentionRate = cohortSize > 0 ? (retained / cohortSize) * 100 : 0;

        breakdown.push({
          period: `Month ${i}`,
          active: retained,
          retained,
          retentionRate,
        });
      }

      cohortAnalyses.push({
        cohortName: cohortMonth,
        cohortSize,
        period: cohortMonth,
        metrics: {
          retention: breakdown[breakdown.length - 1]?.retentionRate || 0,
          conversion: 100, // All patients started as conversions
          averageValue: 0, // Would calculate from orders
        },
        breakdown,
      });
    });

    return cohortAnalyses.sort((a, b) => b.period.localeCompare(a.period));
  }

  /**
   * Detect anomalies in patient data
   */
  static detectAnomalies(
    dataPoints: TrendDataPoint[],
    threshold: number = 2.0 // Standard deviations
  ): Array<{ index: number; value: number; deviation: number }> {
    if (dataPoints.length < 3) return [];

    const values = dataPoints.map((dp) => dp.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies: Array<{ index: number; value: number; deviation: number }> = [];

    dataPoints.forEach((dp, index) => {
      const deviation = Math.abs(dp.value - mean) / stdDev;

      if (deviation > threshold) {
        anomalies.push({
          index,
          value: dp.value,
          deviation,
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate period key for grouping
   */
  private static getPeriodKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    const d = new Date(date);

    switch (period) {
      case 'daily':
        return d.toISOString().slice(0, 10); // YYYY-MM-DD

      case 'weekly':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().slice(0, 10);

      case 'monthly':
        return d.toISOString().slice(0, 7); // YYYY-MM

      default:
        return d.toISOString().slice(0, 10);
    }
  }

  /**
   * Generate periods between start and end dates
   */
  private static generatePeriods(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly'
  ): Date[] {
    const periods: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      periods.push(new Date(current));

      switch (period) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return periods;
  }

  /**
   * Group data by period
   */
  private static groupByPeriod(
    data: any[],
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    dateExtractor: (item: any) => Date | null
  ): TrendDataPoint[] {
    const groupedData = new Map<string, number>();

    data.forEach((item) => {
      const itemDate = dateExtractor(item);
      if (!itemDate) return;

      const periodKey = this.getPeriodKey(itemDate, period);
      groupedData.set(periodKey, (groupedData.get(periodKey) || 0) + 1);
    });

    // Generate complete period range
    const periods = this.generatePeriods(startDate, endDate, period);

    return periods.map((periodDate) => {
      const periodKey = this.getPeriodKey(periodDate, period);
      return {
        date: periodDate,
        value: groupedData.get(periodKey) || 0,
      };
    });
  }

  /**
   * Calculate statistics for data points
   */
  private static calculateStatistics(
    dataPoints: TrendDataPoint[]
  ): TrendAnalysis['statistics'] {
    if (dataPoints.length === 0) {
      return {
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        trend: 'stable',
        trendStrength: 0,
        changePercent: 0,
      };
    }

    const values = dataPoints.map((dp) => dp.value);

    // Basic statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(sortedValues.length / 2)];

    const min = Math.min(...values);
    const max = Math.max(...values);

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Trend calculation using linear regression
    const n = dataPoints.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = values;

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Normalize slope to -1 to 1 range
    const trendStrength = Math.max(-1, Math.min(1, slope / (mean || 1)));

    const trend: 'increasing' | 'decreasing' | 'stable' =
      Math.abs(trendStrength) < 0.1
        ? 'stable'
        : trendStrength > 0
        ? 'increasing'
        : 'decreasing';

    // Calculate overall change percentage
    const firstValue = values[0] || 0;
    const lastValue = values[values.length - 1] || 0;
    const changePercent =
      firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return {
      mean,
      median,
      min,
      max,
      stdDev,
      trend,
      trendStrength,
      changePercent,
    };
  }

  /**
   * Generate predictions using simple linear regression
   */
  private static generatePredictions(
    dataPoints: TrendDataPoint[],
    periods: number
  ): TrendDataPoint[] {
    if (dataPoints.length < 2) return [];

    const n = dataPoints.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = dataPoints.map((dp) => dp.value);

    // Calculate linear regression parameters
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const predictions: TrendDataPoint[] = [];
    const lastDate = dataPoints[dataPoints.length - 1].date;

    for (let i = 1; i <= periods; i++) {
      const predictedValue = slope * (n + i - 1) + intercept;

      // Calculate next period date
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + i); // Assume monthly for now

      predictions.push({
        date: nextDate,
        value: Math.max(0, predictedValue), // Ensure non-negative
        label: 'predicted',
      });
    }

    return predictions;
  }

  /**
   * Compare two periods
   */
  static comparePeriods(
    current: TrendDataPoint[],
    previous: TrendDataPoint[]
  ): {
    currentTotal: number;
    previousTotal: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  } {
    const currentTotal = current.reduce((sum, dp) => sum + dp.value, 0);
    const previousTotal = previous.reduce((sum, dp) => sum + dp.value, 0);

    const change = currentTotal - previousTotal;
    const changePercent =
      previousTotal !== 0 ? (change / previousTotal) * 100 : 0;

    const trend: 'up' | 'down' | 'stable' =
      Math.abs(changePercent) < 5 ? 'stable' : changePercent > 0 ? 'up' : 'down';

    return {
      currentTotal,
      previousTotal,
      change,
      changePercent,
      trend,
    };
  }

  /**
   * Get seasonal patterns
   */
  static detectSeasonalPatterns(
    dataPoints: TrendDataPoint[]
  ): {
    hasSeasonality: boolean;
    peakMonths: number[];
    lowMonths: number[];
    seasonalityStrength: number;
  } {
    if (dataPoints.length < 12) {
      return {
        hasSeasonality: false,
        peakMonths: [],
        lowMonths: [],
        seasonalityStrength: 0,
      };
    }

    // Group by month
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    dataPoints.forEach((dp) => {
      const month = dp.date.getMonth();
      monthlyAverages[month] += dp.value;
      monthlyCounts[month]++;
    });

    // Calculate averages
    const averages = monthlyAverages.map((sum, i) =>
      monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : 0
    );

    const overallMean = averages.reduce((a, b) => a + b, 0) / 12;

    // Find peaks and lows
    const peakMonths = averages
      .map((avg, month) => ({ month, avg }))
      .filter((m) => m.avg > overallMean * 1.2)
      .map((m) => m.month);

    const lowMonths = averages
      .map((avg, month) => ({ month, avg }))
      .filter((m) => m.avg < overallMean * 0.8)
      .map((m) => m.month);

    // Calculate seasonality strength (coefficient of variation)
    const variance =
      averages.reduce((sum, avg) => sum + Math.pow(avg - overallMean, 2), 0) / 12;
    const stdDev = Math.sqrt(variance);
    const seasonalityStrength =
      overallMean > 0 ? (stdDev / overallMean) * 100 : 0;

    return {
      hasSeasonality: seasonalityStrength > 20, // > 20% variation
      peakMonths,
      lowMonths,
      seasonalityStrength,
    };
  }
}
