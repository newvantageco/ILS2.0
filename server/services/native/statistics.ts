/**
 * Statistics Module
 *
 * High-performance statistical functions with native Rust implementation
 * and JavaScript fallback for development/unsupported platforms.
 */

import type {
  LinearRegressionResult,
  DescriptiveStats,
} from "./index";

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

function fallbackMean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

function fallbackMedian(data: number[]): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function fallbackStdDev(data: number[]): number {
  if (data.length < 2) return 0;
  const m = fallbackMean(data);
  const variance = data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (data.length - 1);
  return Math.sqrt(variance);
}

function fallbackVariance(data: number[]): number {
  if (data.length < 2) return 0;
  const m = fallbackMean(data);
  return data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (data.length - 1);
}

function fallbackQuantile(data: number[], q: number): number {
  if (data.length === 0 || q < 0 || q > 1) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function fallbackIqr(data: number[]): number {
  return fallbackQuantile(data, 0.75) - fallbackQuantile(data, 0.25);
}

function fallbackZScores(data: number[]): number[] {
  if (data.length < 2) return data.map(() => 0);
  const m = fallbackMean(data);
  const sd = fallbackStdDev(data);
  if (sd === 0) return data.map(() => 0);
  return data.map(x => (x - m) / sd);
}

function fallbackMovingAverage(data: number[], windowSize: number): number[] {
  if (data.length < windowSize || windowSize === 0) return [];
  const result: number[] = [];
  let sum = data.slice(0, windowSize).reduce((a, b) => a + b, 0);
  result.push(sum / windowSize);

  for (let i = windowSize; i < data.length; i++) {
    sum = sum - data[i - windowSize] + data[i];
    result.push(sum / windowSize);
  }

  return result;
}

function fallbackEma(data: number[], alpha: number): number[] {
  if (data.length === 0) return [];
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

function fallbackLinearRegression(x: number[], y: number[]): LinearRegressionResult {
  if (x.length !== y.length || x.length === 0) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) {
    return { slope: 0, intercept: fallbackMean(y), rSquared: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssRes = x.reduce((sum, xi, i) => sum + Math.pow(y[i] - (slope * xi + intercept), 2), 0);
  const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  return { slope, intercept, rSquared };
}

function fallbackCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const num = n * sumXY - sumX * sumY;
  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denom === 0 ? 0 : num / denom;
}

function fallbackCovariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const meanX = fallbackMean(x);
  const meanY = fallbackMean(y);
  return x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / (x.length - 1);
}

function fallbackDescribe(data: number[]): DescriptiveStats {
  if (data.length === 0) {
    return {
      count: 0, mean: 0, stdDev: 0, min: 0, q1: 0,
      median: 0, q3: 0, max: 0, iqr: 0, skewness: 0, kurtosis: 0,
    };
  }

  const n = data.length;
  const m = fallbackMean(data);
  const sd = fallbackStdDev(data);
  const sorted = [...data].sort((a, b) => a - b);

  let skewness = 0;
  let kurtosis = 0;

  if (sd !== 0 && n > 2) {
    skewness = data.reduce((sum, x) => sum + Math.pow((x - m) / sd, 3), 0) * n / ((n - 1) * (n - 2));
  }

  if (sd !== 0 && n > 3) {
    kurtosis = data.reduce((sum, x) => sum + Math.pow((x - m) / sd, 4), 0) / n - 3;
  }

  return {
    count: n,
    mean: m,
    stdDev: sd,
    min: sorted[0],
    q1: fallbackQuantile(data, 0.25),
    median: fallbackMedian(data),
    q3: fallbackQuantile(data, 0.75),
    max: sorted[n - 1],
    iqr: fallbackIqr(data),
    skewness,
    kurtosis,
  };
}

// ============================================================
// EXPORTS WITH NATIVE/FALLBACK SELECTION
// ============================================================

export const statistics = {
  /**
   * Calculate the mean (average) of a dataset
   */
  mean: (data: number[]): number => {
    return native?.mean?.(data) ?? fallbackMean(data);
  },

  /**
   * Calculate the median of a dataset
   */
  median: (data: number[]): number => {
    return native?.median?.(data) ?? fallbackMedian(data);
  },

  /**
   * Calculate the standard deviation of a dataset
   */
  stdDev: (data: number[]): number => {
    return native?.stdDev?.(data) ?? fallbackStdDev(data);
  },

  /**
   * Calculate the variance of a dataset
   */
  variance: (data: number[]): number => {
    return native?.variance?.(data) ?? fallbackVariance(data);
  },

  /**
   * Calculate quantile (percentile) of a dataset
   */
  quantile: (data: number[], q: number): number => {
    return native?.quantile?.(data, q) ?? fallbackQuantile(data, q);
  },

  /**
   * Calculate Interquartile Range (IQR)
   */
  iqr: (data: number[]): number => {
    return native?.iqr?.(data) ?? fallbackIqr(data);
  },

  /**
   * Calculate z-scores for all values in a dataset
   */
  zScores: (data: number[]): number[] => {
    return native?.zScores?.(data) ?? fallbackZScores(data);
  },

  /**
   * Calculate z-scores in parallel (for large datasets)
   */
  zScoresParallel: (data: number[]): number[] => {
    return native?.zScoresParallel?.(data) ?? fallbackZScores(data);
  },

  /**
   * Calculate moving average
   */
  movingAverage: (data: number[], windowSize: number): number[] => {
    return native?.movingAverage?.(data, windowSize) ?? fallbackMovingAverage(data, windowSize);
  },

  /**
   * Calculate exponential moving average
   */
  exponentialMovingAverage: (data: number[], alpha: number): number[] => {
    return native?.exponentialMovingAverage?.(data, alpha) ?? fallbackEma(data, alpha);
  },

  /**
   * Calculate linear regression coefficients
   */
  linearRegression: (x: number[], y: number[]): LinearRegressionResult => {
    return native?.linearRegression?.(x, y) ?? fallbackLinearRegression(x, y);
  },

  /**
   * Calculate correlation coefficient (Pearson's r)
   */
  correlation: (x: number[], y: number[]): number => {
    return native?.correlation?.(x, y) ?? fallbackCorrelation(x, y);
  },

  /**
   * Calculate covariance
   */
  covariance: (x: number[], y: number[]): number => {
    return native?.covariance?.(x, y) ?? fallbackCovariance(x, y);
  },

  /**
   * Get descriptive statistics for a dataset
   */
  describe: (data: number[]): DescriptiveStats => {
    return native?.describe?.(data) ?? fallbackDescribe(data);
  },
};
