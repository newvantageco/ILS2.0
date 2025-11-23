/**
 * Forecasting Module
 *
 * High-performance time series forecasting with native Rust implementation
 * and JavaScript fallback for development/unsupported platforms.
 */

import type {
  ForecastResult,
  StaffingResult,
  AccuracyMetrics,
  SurgePeriod,
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

function fallbackHoltWinters(
  data: number[],
  alpha: number,
  beta: number,
  gamma: number,
  seasonLength: number
): number[] {
  if (data.length < seasonLength * 2) {
    return fallbackSimpleExponentialSmoothing(data, alpha);
  }

  const forecasts: number[] = [];
  let level = data[0];
  let trend = 0;
  const seasonal: number[] = new Array(seasonLength).fill(1);

  // Initialize seasonal components
  for (let i = 0; i < seasonLength; i++) {
    const firstCycle = data.slice(i, i + seasonLength);
    const secondCycle = data.slice(i + seasonLength, i + 2 * seasonLength);
    if (secondCycle.length > 0) {
      const avg1 = statistics.mean(firstCycle);
      const avg2 = statistics.mean(secondCycle);
      const avg = (avg1 + avg2) / 2;
      if (avg !== 0) {
        seasonal[i] = avg1 / avg;
      }
    }
  }

  // Apply Holt-Winters
  for (let i = 0; i < data.length; i++) {
    const seasonalIndex = i % seasonLength;
    const lastLevel = level;
    const lastTrend = trend;

    const seasonalFactor = seasonal[seasonalIndex] !== 0 ? seasonal[seasonalIndex] : 1;

    level = alpha * (data[i] / seasonalFactor) + (1 - alpha) * (lastLevel + lastTrend);
    trend = beta * (level - lastLevel) + (1 - beta) * lastTrend;

    if (level !== 0) {
      seasonal[seasonalIndex] = gamma * (data[i] / level) + (1 - gamma) * seasonal[seasonalIndex];
    }

    forecasts.push((level + trend) * seasonal[seasonalIndex]);
  }

  return forecasts;
}

function fallbackSimpleExponentialSmoothing(data: number[], alpha: number): number[] {
  if (data.length === 0) return [];

  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

function fallbackPredictNext(
  data: number[],
  steps: number,
  seasonLength: number
): ForecastResult[] {
  if (data.length < seasonLength * 2) {
    return fallbackPredictSimple(data, steps);
  }

  const forecasts = fallbackHoltWinters(data, 0.3, 0.1, 0.1, seasonLength);
  const lastForecast = forecasts[forecasts.length - 1] || 0;

  // Calculate trend
  const recentData = data.slice(-7);
  const trend = calculateTrend(recentData);

  // Calculate error std dev
  const errors = data.map((val, i) => val - (forecasts[i] || val));
  const errorStd = statistics.stdDev(errors);

  // Extract seasonal pattern
  const seasonal = extractSeasonalPattern(data, seasonLength);

  const results: ForecastResult[] = [];

  for (let i = 0; i < steps; i++) {
    const seasonalIndex = (data.length + i) % seasonLength;
    const trendAdjustment = trend * (i + 1);
    const seasonalFactor = seasonal[seasonalIndex] || 1;
    const predictedValue = (lastForecast + trendAdjustment) * seasonalFactor;

    const confidenceMargin = 1.96 * errorStd * Math.sqrt(i + 1);
    const confidence = Math.max(0.6, 1 - i * 0.05);

    const trendDirection = trend > 0.1 ? "increasing" : trend < -0.1 ? "decreasing" : "stable";

    results.push({
      predictedValue: Math.max(0, Math.round(predictedValue)),
      confidence,
      lowerBound: Math.max(0, Math.round(predictedValue - confidenceMargin)),
      upperBound: Math.round(predictedValue + confidenceMargin),
      trend: trendDirection,
    });
  }

  return results;
}

function fallbackPredictSimple(data: number[], steps: number): ForecastResult[] {
  if (data.length === 0) return [];

  const smoothed = fallbackSimpleExponentialSmoothing(data, 0.3);
  const lastSmoothed = smoothed[smoothed.length - 1] || 0;
  const sd = statistics.stdDev(data);
  const trend = calculateTrend(data);

  const results: ForecastResult[] = [];

  for (let i = 0; i < steps; i++) {
    const predictedValue = lastSmoothed + trend * (i + 1);
    const confidenceMargin = 1.96 * sd * Math.sqrt(i + 1);
    const confidence = Math.max(0.5, 1 - i * 0.08);

    const trendDirection = trend > 0.1 ? "increasing" : trend < -0.1 ? "decreasing" : "stable";

    results.push({
      predictedValue: Math.max(0, Math.round(predictedValue)),
      confidence,
      lowerBound: Math.max(0, Math.round(predictedValue - confidenceMargin)),
      upperBound: Math.round(predictedValue + confidenceMargin),
      trend: trendDirection,
    });
  }

  return results;
}

function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;
  const x = data.map((_, i) => i);
  return statistics.linearRegression(x, data).slope;
}

function extractSeasonalPattern(data: number[], seasonLength: number): number[] {
  const seasonal = new Array(seasonLength).fill(1);

  if (data.length < seasonLength * 2) {
    return seasonal;
  }

  for (let i = 0; i < seasonLength; i++) {
    const values: number[] = [];
    for (let j = i; j < data.length; j += seasonLength) {
      values.push(data[j]);
    }
    if (values.length > 0) {
      seasonal[i] = statistics.mean(values);
    }
  }

  const seasonalMean = statistics.mean(seasonal);
  if (seasonalMean !== 0) {
    for (let i = 0; i < seasonal.length; i++) {
      seasonal[i] /= seasonalMean;
    }
  }

  return seasonal;
}

function fallbackCalculateStaffingNeeds(
  orderVolume: number,
  complexityScore: number,
  historicalEfficiency: number
): StaffingResult {
  const baseLabTechs = Math.ceil(orderVolume / (15 * historicalEfficiency));
  const complexOrders = orderVolume * complexityScore;
  const engineers = Math.ceil(complexOrders / 25);
  const labTechs = Math.ceil(baseLabTechs * 1.15);

  const reasoning = `Based on ${Math.round(orderVolume)} predicted orders with complexity score ${complexityScore.toFixed(2)} and ${(historicalEfficiency * 100).toFixed(0)}% efficiency, recommend ${labTechs} lab techs and ${engineers} engineers.`;

  return { labTechs, engineers, reasoning };
}

function fallbackCalculateAccuracy(predictions: number[], actuals: number[]): AccuracyMetrics {
  if (predictions.length === 0 || predictions.length !== actuals.length) {
    return { mape: 0, rmse: 0, mae: 0, accuracy: 0 };
  }

  const n = predictions.length;
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let sumPercentError = 0;

  for (let i = 0; i < n; i++) {
    const error = actuals[i] - predictions[i];
    sumAbsError += Math.abs(error);
    sumSquaredError += error * error;
    if (actuals[i] !== 0) {
      sumPercentError += Math.abs(error / actuals[i]) * 100;
    }
  }

  const mae = sumAbsError / n;
  const rmse = Math.sqrt(sumSquaredError / n);
  const mape = sumPercentError / n;
  const accuracy = Math.max(0, 100 - mape);

  return {
    mape: Math.round(mape * 10) / 10,
    rmse: Math.round(rmse * 10) / 10,
    mae: Math.round(mae * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
  };
}

function fallbackIdentifySurges(
  predictedValues: number[],
  dates: string[],
  threshold: number
): SurgePeriod[] {
  if (predictedValues.length === 0 || predictedValues.length !== dates.length) {
    return [];
  }

  const avgVolume = statistics.mean(predictedValues);
  const surges: SurgePeriod[] = [];
  let currentSurge: SurgePeriod | null = null;

  for (let i = 0; i < predictedValues.length; i++) {
    const ratio = avgVolume !== 0 ? predictedValues[i] / avgVolume : 1;
    const isHighVolume = ratio > threshold;

    if (isHighVolume && !currentSurge) {
      currentSurge = {
        startDate: dates[i],
        endDate: dates[i],
        peakValue: predictedValues[i],
        severity: determineSeverity(ratio),
      };
    } else if (isHighVolume && currentSurge) {
      currentSurge.endDate = dates[i];
      if (predictedValues[i] > currentSurge.peakValue) {
        currentSurge.peakValue = predictedValues[i];
        currentSurge.severity = determineSeverity(ratio);
      }
    } else if (!isHighVolume && currentSurge) {
      surges.push(currentSurge);
      currentSurge = null;
    }
  }

  if (currentSurge) {
    surges.push(currentSurge);
  }

  return surges;
}

function determineSeverity(ratio: number): "low" | "medium" | "high" {
  if (ratio > 1.5) return "high";
  if (ratio > 1.35) return "medium";
  return "low";
}

// ============================================================
// EXPORTS WITH NATIVE/FALLBACK SELECTION
// ============================================================

export const forecasting = {
  /**
   * Holt-Winters triple exponential smoothing
   */
  holtWinters: (
    data: number[],
    alpha: number,
    beta: number,
    gamma: number,
    seasonLength: number
  ): number[] => {
    return native?.holtWinters?.(data, alpha, beta, gamma, seasonLength)
      ?? fallbackHoltWinters(data, alpha, beta, gamma, seasonLength);
  },

  /**
   * Simple exponential smoothing
   */
  simpleExponentialSmoothing: (data: number[], alpha: number): number[] => {
    return native?.simpleExponentialSmoothing?.(data, alpha)
      ?? fallbackSimpleExponentialSmoothing(data, alpha);
  },

  /**
   * Predict future values using exponential smoothing
   */
  predictNext: (data: number[], steps: number, seasonLength: number): ForecastResult[] => {
    return native?.predictNext?.(data, steps, seasonLength)
      ?? fallbackPredictNext(data, steps, seasonLength);
  },

  /**
   * Calculate staffing requirements based on predicted order volume
   */
  calculateStaffingNeeds: (
    orderVolume: number,
    complexityScore: number,
    historicalEfficiency: number
  ): StaffingResult => {
    return native?.calculateStaffingNeeds?.(orderVolume, complexityScore, historicalEfficiency)
      ?? fallbackCalculateStaffingNeeds(orderVolume, complexityScore, historicalEfficiency);
  },

  /**
   * Calculate forecast accuracy metrics
   */
  calculateAccuracy: (predictions: number[], actuals: number[]): AccuracyMetrics => {
    return native?.calculateAccuracy?.(predictions, actuals)
      ?? fallbackCalculateAccuracy(predictions, actuals);
  },

  /**
   * Identify surge periods in forecast data
   */
  identifySurges: (
    predictedValues: number[],
    dates: string[],
    threshold: number
  ): SurgePeriod[] => {
    return native?.identifySurges?.(predictedValues, dates, threshold)
      ?? fallbackIdentifySurges(predictedValues, dates, threshold);
  },
};
