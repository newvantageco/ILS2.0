/**
 * Anomaly Detection Module
 *
 * High-performance anomaly detection with native Rust implementation
 * and JavaScript fallback for development/unsupported platforms.
 */

import type {
  AnomalyResult,
  RealTimeAnomalyResult,
  SeasonalAnomalyResult,
  TrendChangeResult,
  AnomalyAnalysisSummary,
} from "./index";
import { statistics } from "./statistics";

// Try to load native module
let native: any = null;
try {
  native = require("../../../native/ils-core/ils-core.node");
} catch {
  // Will use fallback
}

// ============================================================
// FALLBACK IMPLEMENTATIONS
// ============================================================

function fallbackDetectAnomalies(data: number[], threshold: number): AnomalyResult[] {
  if (data.length < 3) return [];

  const m = statistics.mean(data);
  const sd = statistics.stdDev(data);
  const q1 = statistics.quantile(data, 0.25);
  const q3 = statistics.quantile(data, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const windowSize = Math.min(7, Math.max(3, Math.floor(data.length / 3)));
  const movAvg = statistics.movingAverage(data, windowSize);

  const results: AnomalyResult[] = [];

  for (let index = 0; index < data.length; index++) {
    const value = data[index];
    const methods: string[] = [];

    // Method 1: Z-Score
    const zScore = sd !== 0 ? Math.abs(value - m) / sd : 0;
    if (zScore > threshold) {
      methods.push("z-score");
    }

    // Method 2: IQR method
    if (value < lowerBound || value > upperBound) {
      methods.push("iqr");
    }

    // Method 3: Moving average deviation
    const movAvgIndex = index >= windowSize - 1 ? index - (windowSize - 1) : -1;
    if (movAvgIndex >= 0 && movAvgIndex < movAvg.length) {
      const avg = movAvg[movAvgIndex];
      if (avg !== 0) {
        const deviation = Math.abs(value - avg) / avg;
        if (deviation > 0.3) {
          methods.push("moving-avg");
        }
      }
    }

    if (methods.length > 0) {
      const deviationPercent = m !== 0 ? (Math.abs(value - m) / m) * 100 : 0;
      const severity = methods.length >= 2 ? "high" : zScore > threshold * 1.5 ? "medium" : "low";

      results.push({
        index,
        value,
        severity,
        methods,
        deviationPercent,
      });
    }
  }

  return results;
}

function fallbackDetectAnomaliesRealtime(
  historicalData: number[],
  newValue: number,
  sensitivity: string
): RealTimeAnomalyResult {
  const recentWindow = historicalData.slice(-14);
  const m = statistics.mean(recentWindow);
  const sd = statistics.stdDev(recentWindow);

  const thresholdMultiplier = sensitivity === "low" ? 3.0 : sensitivity === "high" ? 1.5 : 2.0;
  const threshold = sd * thresholdMultiplier;
  const deviation = Math.abs(newValue - m);
  const zScore = sd !== 0 ? deviation / sd : 0;

  const confidence = Math.min(100, (zScore / thresholdMultiplier) * 100);
  const severity = zScore > 3 ? "high" : zScore > 2 ? "medium" : "low";

  return {
    isAnomaly: deviation > threshold,
    severity,
    confidence,
    expectedMin: m - threshold,
    expectedMax: m + threshold,
    actualValue: newValue,
  };
}

function fallbackDetectSeasonalAnomalies(
  data: number[],
  seasonalPeriod: number
): SeasonalAnomalyResult[] {
  if (data.length < seasonalPeriod * 2) return [];

  const results: SeasonalAnomalyResult[] = [];

  for (let i = seasonalPeriod; i < data.length; i++) {
    const seasonalValues: number[] = [];
    for (let j = i - seasonalPeriod; j >= 0; j -= seasonalPeriod) {
      seasonalValues.push(data[j]);
    }

    if (seasonalValues.length < 2) continue;

    const expectedValue = statistics.mean(seasonalValues);
    const seasonalStd = statistics.stdDev(seasonalValues);
    const deviation = Math.abs(data[i] - expectedValue);
    const isAnomaly = deviation > seasonalStd * 2;

    if (isAnomaly) {
      results.push({
        index: i,
        value: data[i],
        expectedValue,
        deviation,
      });
    }
  }

  return results;
}

function fallbackDetectTrendChanges(data: number[], windowSize: number): TrendChangeResult[] {
  if (data.length < windowSize * 2) return [];

  const results: TrendChangeResult[] = [];

  for (let i = windowSize * 2; i < data.length; i++) {
    // Old window trend
    const oldWindow = data.slice(i - windowSize * 2, i - windowSize);
    const oldX = oldWindow.map((_, j) => j);
    const oldTrend = statistics.linearRegression(oldX, oldWindow).slope;

    // New window trend
    const newWindow = data.slice(i - windowSize, i);
    const newX = newWindow.map((_, j) => j);
    const newTrend = statistics.linearRegression(newX, newWindow).slope;

    // Check for significant change
    let changePercent = 0;
    if (oldTrend !== 0) {
      changePercent = (Math.abs(newTrend - oldTrend) / Math.abs(oldTrend)) * 100;
    } else if (newTrend !== 0) {
      changePercent = 100;
    }

    const significant = changePercent > 50;

    if (significant) {
      results.push({
        index: i,
        oldTrend,
        newTrend,
        changePercent,
        significant,
      });
    }
  }

  return results;
}

function fallbackAnalyzeAnomalies(
  data: number[],
  threshold: number,
  seasonalPeriod: number,
  windowSize: number
): AnomalyAnalysisSummary {
  const anomalies = fallbackDetectAnomalies(data, threshold);
  const seasonalAnomalies = fallbackDetectSeasonalAnomalies(data, seasonalPeriod);
  const trendChanges = fallbackDetectTrendChanges(data, windowSize);

  const totalAnomalies = anomalies.length;
  const highSeverityCount = anomalies.filter(a => a.severity === "high").length;
  const averageDeviation = anomalies.length > 0
    ? anomalies.reduce((sum, a) => sum + a.deviationPercent, 0) / anomalies.length
    : 0;

  return {
    totalAnomalies,
    highSeverityCount,
    averageDeviation,
    significantTrendChanges: trendChanges.length,
    seasonalAnomalyCount: seasonalAnomalies.length,
    anomalies,
    seasonalAnomalies,
    trendChanges,
  };
}

// ============================================================
// EXPORTS WITH NATIVE/FALLBACK SELECTION
// ============================================================

export const anomaly = {
  /**
   * Detect anomalies using multiple statistical methods
   */
  detectAnomalies: (data: number[], threshold: number): AnomalyResult[] => {
    return native?.detectAnomalies?.(data, threshold)
      ?? fallbackDetectAnomalies(data, threshold);
  },

  /**
   * Real-time anomaly detection with adaptive thresholds
   */
  detectAnomaliesRealtime: (
    historicalData: number[],
    newValue: number,
    sensitivity: string
  ): RealTimeAnomalyResult => {
    return native?.detectAnomaliesRealtime?.(historicalData, newValue, sensitivity)
      ?? fallbackDetectAnomaliesRealtime(historicalData, newValue, sensitivity);
  },

  /**
   * Detect seasonal anomalies
   */
  detectSeasonalAnomalies: (
    data: number[],
    seasonalPeriod: number
  ): SeasonalAnomalyResult[] => {
    return native?.detectSeasonalAnomalies?.(data, seasonalPeriod)
      ?? fallbackDetectSeasonalAnomalies(data, seasonalPeriod);
  },

  /**
   * Detect trend changes
   */
  detectTrendChanges: (data: number[], windowSize: number): TrendChangeResult[] => {
    return native?.detectTrendChanges?.(data, windowSize)
      ?? fallbackDetectTrendChanges(data, windowSize);
  },

  /**
   * Comprehensive anomaly analysis
   */
  analyzeAnomalies: (
    data: number[],
    threshold: number,
    seasonalPeriod: number,
    windowSize: number
  ): AnomalyAnalysisSummary => {
    return native?.analyzeAnomalies?.(data, threshold, seasonalPeriod, windowSize)
      ?? fallbackAnalyzeAnomalies(data, threshold, seasonalPeriod, windowSize);
  },
};
