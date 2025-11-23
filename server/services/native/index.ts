/**
 * Native Module Bindings for ILS 2.0
 *
 * High-performance Rust-powered computations with automatic fallback
 * to JavaScript implementations when native module is unavailable.
 *
 * The native module provides 10-50x performance improvements for:
 * - Statistical computations (mean, std dev, regression, etc.)
 * - Time series forecasting (Holt-Winters, exponential smoothing)
 * - Anomaly detection (Z-score, IQR, seasonal patterns)
 */

import { createLogger } from "../../utils/logger";

const logger = createLogger("NativeModule");

// Type definitions for native module
export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

export interface DescriptiveStats {
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export interface ForecastResult {
  predictedValue: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface StaffingResult {
  labTechs: number;
  engineers: number;
  reasoning: string;
}

export interface AccuracyMetrics {
  mape: number;
  rmse: number;
  mae: number;
  accuracy: number;
}

export interface SurgePeriod {
  startDate: string;
  endDate: string;
  peakValue: number;
  severity: "low" | "medium" | "high";
}

export interface AnomalyResult {
  index: number;
  value: number;
  severity: "low" | "medium" | "high";
  methods: string[];
  deviationPercent: number;
}

export interface RealTimeAnomalyResult {
  isAnomaly: boolean;
  severity: "low" | "medium" | "high";
  confidence: number;
  expectedMin: number;
  expectedMax: number;
  actualValue: number;
}

export interface SeasonalAnomalyResult {
  index: number;
  value: number;
  expectedValue: number;
  deviation: number;
}

export interface TrendChangeResult {
  index: number;
  oldTrend: number;
  newTrend: number;
  changePercent: number;
  significant: boolean;
}

export interface AnomalyAnalysisSummary {
  totalAnomalies: number;
  highSeverityCount: number;
  averageDeviation: number;
  significantTrendChanges: number;
  seasonalAnomalyCount: number;
  anomalies: AnomalyResult[];
  seasonalAnomalies: SeasonalAnomalyResult[];
  trendChanges: TrendChangeResult[];
}

// Native module interface
interface NativeModule {
  getVersion(): string;
  isNativeAvailable(): boolean;

  // Statistics
  mean(data: number[]): number;
  median(data: number[]): number;
  stdDev(data: number[]): number;
  variance(data: number[]): number;
  quantile(data: number[], q: number): number;
  iqr(data: number[]): number;
  zScores(data: number[]): number[];
  zScoresParallel(data: number[]): number[];
  movingAverage(data: number[], windowSize: number): number[];
  exponentialMovingAverage(data: number[], alpha: number): number[];
  linearRegression(x: number[], y: number[]): LinearRegressionResult;
  correlation(x: number[], y: number[]): number;
  covariance(x: number[], y: number[]): number;
  describe(data: number[]): DescriptiveStats;

  // Forecasting
  holtWinters(
    data: number[],
    alpha: number,
    beta: number,
    gamma: number,
    seasonLength: number
  ): number[];
  simpleExponentialSmoothing(data: number[], alpha: number): number[];
  predictNext(data: number[], steps: number, seasonLength: number): ForecastResult[];
  calculateStaffingNeeds(
    orderVolume: number,
    complexityScore: number,
    historicalEfficiency: number
  ): StaffingResult;
  calculateAccuracy(predictions: number[], actuals: number[]): AccuracyMetrics;
  identifySurges(
    predictedValues: number[],
    dates: string[],
    threshold: number
  ): SurgePeriod[];

  // Anomaly Detection
  detectAnomalies(data: number[], threshold: number): AnomalyResult[];
  detectAnomaliesRealtime(
    historicalData: number[],
    newValue: number,
    sensitivity: string
  ): RealTimeAnomalyResult;
  detectSeasonalAnomalies(data: number[], seasonalPeriod: number): SeasonalAnomalyResult[];
  detectTrendChanges(data: number[], windowSize: number): TrendChangeResult[];
  analyzeAnomalies(
    data: number[],
    threshold: number,
    seasonalPeriod: number,
    windowSize: number
  ): AnomalyAnalysisSummary;
}

// Try to load native module
let nativeModule: NativeModule | null = null;
let nativeAvailable = false;

try {
  // Attempt to load the native module
  // The path will be different based on the build output
  // napi-rs generates .node files in the same directory as the package
  const native = require("../../../native/ils-core/ils-core.node");
  nativeModule = native;
  nativeAvailable = true;
  logger.info("Native module loaded successfully", {
    version: native.getVersion?.() ?? "unknown",
  });
} catch (error) {
  logger.warn("Native module not available, using JavaScript fallback", {
    error: (error as Error).message,
  });
}

/**
 * Check if native module is available
 */
export function isNativeAvailable(): boolean {
  return nativeAvailable;
}

/**
 * Get native module version
 */
export function getNativeVersion(): string {
  return nativeModule?.getVersion() ?? "fallback";
}

// ============================================================
// STATISTICS EXPORTS
// ============================================================

export { statistics } from "./statistics";
export { forecasting } from "./forecasting";
export { anomaly } from "./anomaly";

// Re-export the native module for direct access if needed
export { nativeModule };
