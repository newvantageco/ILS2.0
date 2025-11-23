//! Time Series Forecasting
//!
//! High-performance implementations of forecasting algorithms including:
//! - Holt-Winters exponential smoothing (triple exponential smoothing)
//! - Simple exponential smoothing
//! - Trend analysis

use napi::bindgen_prelude::*;
use napi_derive::napi;
use rayon::prelude::*;

use crate::statistics::{mean, std_dev, linear_regression};

/// Holt-Winters triple exponential smoothing
///
/// Handles level, trend, and seasonality for accurate time series forecasting.
///
/// # Arguments
/// * `data` - Historical time series data
/// * `alpha` - Level smoothing parameter (0-1)
/// * `beta` - Trend smoothing parameter (0-1)
/// * `gamma` - Seasonal smoothing parameter (0-1)
/// * `season_length` - Length of one seasonal cycle (e.g., 7 for weekly)
#[napi]
pub fn holt_winters(
    data: Vec<f64>,
    alpha: f64,
    beta: f64,
    gamma: f64,
    season_length: u32,
) -> Vec<f64> {
    let season_len = season_length as usize;

    if data.len() < season_len * 2 {
        return simple_exponential_smoothing(data, alpha);
    }

    let mut forecasts = Vec::with_capacity(data.len());
    let mut level = data[0];
    let mut trend = 0.0;
    let mut seasonal: Vec<f64> = vec![1.0; season_len];

    // Initialize seasonal components
    for i in 0..season_len {
        let first_cycle: f64 = data[i..].iter().take(season_len).sum::<f64>() / season_len as f64;
        let second_start = (i + season_len).min(data.len());
        let second_end = (second_start + season_len).min(data.len());

        if second_end > second_start {
            let second_cycle: f64 = data[second_start..second_end].iter().sum::<f64>()
                / (second_end - second_start) as f64;
            let avg = (first_cycle + second_cycle) / 2.0;
            if avg != 0.0 {
                seasonal[i] = first_cycle / avg;
            }
        }
    }

    // Apply Holt-Winters algorithm
    for i in 0..data.len() {
        let seasonal_index = i % season_len;
        let last_level = level;
        let last_trend = trend;

        // Avoid division by zero
        let seasonal_factor = if seasonal[seasonal_index] != 0.0 {
            seasonal[seasonal_index]
        } else {
            1.0
        };

        // Update level
        level = alpha * (data[i] / seasonal_factor) + (1.0 - alpha) * (last_level + last_trend);

        // Update trend
        trend = beta * (level - last_level) + (1.0 - beta) * last_trend;

        // Update seasonal component
        if level != 0.0 {
            seasonal[seasonal_index] = gamma * (data[i] / level) + (1.0 - gamma) * seasonal[seasonal_index];
        }

        // Calculate forecast
        forecasts.push((level + trend) * seasonal[seasonal_index]);
    }

    forecasts
}

/// Simple exponential smoothing
#[napi]
pub fn simple_exponential_smoothing(data: Vec<f64>, alpha: f64) -> Vec<f64> {
    if data.is_empty() {
        return vec![];
    }

    let mut result = Vec::with_capacity(data.len());
    result.push(data[0]);

    for i in 1..data.len() {
        let smoothed = alpha * data[i] + (1.0 - alpha) * result[i - 1];
        result.push(smoothed);
    }

    result
}

/// Predict future values using exponential smoothing
#[napi]
pub fn predict_next(data: Vec<f64>, steps: u32, season_length: u32) -> Vec<ForecastResult> {
    let steps = steps as usize;
    let season_len = season_length as usize;

    if data.len() < season_len * 2 {
        return predict_simple(data, steps);
    }

    // Get Holt-Winters forecasts
    let forecasts = holt_winters(data.clone(), 0.3, 0.1, 0.1, season_length);
    let last_forecast = *forecasts.last().unwrap_or(&0.0);

    // Calculate trend from recent data
    let recent_data: Vec<f64> = data.iter().rev().take(7).cloned().collect();
    let trend = calculate_trend(&recent_data);

    // Calculate standard deviation for confidence intervals
    let errors: Vec<f64> = data.iter().zip(forecasts.iter())
        .map(|(actual, forecast)| actual - forecast)
        .collect();
    let error_std = std_dev(errors);

    // Extract seasonal pattern
    let seasonal = extract_seasonal_pattern(&data, season_len);

    let mut results = Vec::with_capacity(steps);

    for i in 0..steps {
        let seasonal_index = (data.len() + i) % season_len;
        let trend_adjustment = trend * (i + 1) as f64;
        let seasonal_factor = seasonal.get(seasonal_index).copied().unwrap_or(1.0);
        let predicted_value = (last_forecast + trend_adjustment) * seasonal_factor;

        // 95% confidence interval
        let confidence_margin = 1.96 * error_std * ((i + 1) as f64).sqrt();

        // Confidence decreases over time
        let confidence = (1.0 - (i as f64 * 0.05)).max(0.6);

        let trend_direction = if trend > 0.1 {
            "increasing".to_string()
        } else if trend < -0.1 {
            "decreasing".to_string()
        } else {
            "stable".to_string()
        };

        results.push(ForecastResult {
            predicted_value: predicted_value.max(0.0).round(),
            confidence,
            lower_bound: (predicted_value - confidence_margin).max(0.0).round(),
            upper_bound: (predicted_value + confidence_margin).round(),
            trend: trend_direction,
        });
    }

    results
}

/// Predict using simple exponential smoothing (fallback for insufficient data)
fn predict_simple(data: Vec<f64>, steps: usize) -> Vec<ForecastResult> {
    if data.is_empty() {
        return vec![];
    }

    let alpha = 0.3;
    let smoothed = simple_exponential_smoothing(data.clone(), alpha);
    let last_smoothed = *smoothed.last().unwrap_or(&0.0);
    let sd = std_dev(data.clone());
    let trend = calculate_trend(&data);

    let mut results = Vec::with_capacity(steps);

    for i in 0..steps {
        let predicted_value = last_smoothed + (trend * (i + 1) as f64);
        let confidence_margin = 1.96 * sd * ((i + 1) as f64).sqrt();
        let confidence = (1.0 - (i as f64 * 0.08)).max(0.5);

        let trend_direction = if trend > 0.1 {
            "increasing".to_string()
        } else if trend < -0.1 {
            "decreasing".to_string()
        } else {
            "stable".to_string()
        };

        results.push(ForecastResult {
            predicted_value: predicted_value.max(0.0).round(),
            confidence,
            lower_bound: (predicted_value - confidence_margin).max(0.0).round(),
            upper_bound: (predicted_value + confidence_margin).round(),
            trend: trend_direction,
        });
    }

    results
}

/// Calculate trend using linear regression
fn calculate_trend(data: &[f64]) -> f64 {
    if data.len() < 2 {
        return 0.0;
    }

    let x: Vec<f64> = (0..data.len()).map(|i| i as f64).collect();
    let y: Vec<f64> = data.to_vec();
    let result = linear_regression(x, y);
    result.slope
}

/// Extract seasonal pattern from data
fn extract_seasonal_pattern(data: &[f64], season_length: usize) -> Vec<f64> {
    let mut seasonal = vec![1.0; season_length];

    if data.len() < season_length * 2 {
        return seasonal;
    }

    // Calculate average for each position in the season
    for i in 0..season_length {
        let mut values = Vec::new();
        let mut j = i;
        while j < data.len() {
            values.push(data[j]);
            j += season_length;
        }
        if !values.is_empty() {
            seasonal[i] = mean(values);
        }
    }

    // Normalize seasonal factors
    let seasonal_mean = mean(seasonal.clone());
    if seasonal_mean != 0.0 {
        seasonal.iter_mut().for_each(|s| *s /= seasonal_mean);
    }

    seasonal
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct ForecastResult {
    pub predicted_value: f64,
    pub confidence: f64,
    pub lower_bound: f64,
    pub upper_bound: f64,
    pub trend: String,
}

/// Calculate staffing requirements based on predicted order volume
#[napi]
pub fn calculate_staffing_needs(
    order_volume: f64,
    complexity_score: f64,
    historical_efficiency: f64,
) -> StaffingResult {
    // Base calculation: 1 lab tech can handle ~15 orders/day
    let base_lab_techs = (order_volume / (15.0 * historical_efficiency)).ceil();
    let complex_orders = order_volume * complexity_score;
    let engineers = (complex_orders / 25.0).ceil();

    // Add buffer for quality control and breaks (15%)
    let lab_techs = (base_lab_techs * 1.15).ceil() as u32;

    let reasoning = format!(
        "Based on {} predicted orders with complexity score {:.2} and {:.0}% efficiency, recommend {} lab techs and {} engineers.",
        order_volume as u32,
        complexity_score,
        historical_efficiency * 100.0,
        lab_techs,
        engineers as u32
    );

    StaffingResult {
        lab_techs,
        engineers: engineers as u32,
        reasoning,
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct StaffingResult {
    pub lab_techs: u32,
    pub engineers: u32,
    pub reasoning: String,
}

/// Calculate forecast accuracy metrics (MAPE, RMSE, MAE)
#[napi]
pub fn calculate_accuracy(predictions: Vec<f64>, actuals: Vec<f64>) -> AccuracyMetrics {
    if predictions.is_empty() || predictions.len() != actuals.len() {
        return AccuracyMetrics {
            mape: 0.0,
            rmse: 0.0,
            mae: 0.0,
            accuracy: 0.0,
        };
    }

    let n = predictions.len() as f64;

    // Calculate in parallel for large datasets
    let (sum_abs_error, sum_squared_error, sum_percent_error): (f64, f64, f64) = predictions
        .par_iter()
        .zip(actuals.par_iter())
        .map(|(pred, actual)| {
            let error = actual - pred;
            let abs_error = error.abs();
            let percent_error = if *actual != 0.0 {
                (error / actual).abs() * 100.0
            } else {
                0.0
            };
            (abs_error, error * error, percent_error)
        })
        .reduce(
            || (0.0, 0.0, 0.0),
            |(a1, b1, c1), (a2, b2, c2)| (a1 + a2, b1 + b2, c1 + c2),
        );

    let mae = sum_abs_error / n;
    let rmse = (sum_squared_error / n).sqrt();
    let mape = sum_percent_error / n;
    let accuracy = (100.0 - mape).max(0.0);

    AccuracyMetrics {
        mape: (mape * 10.0).round() / 10.0,
        rmse: (rmse * 10.0).round() / 10.0,
        mae: (mae * 10.0).round() / 10.0,
        accuracy: (accuracy * 10.0).round() / 10.0,
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct AccuracyMetrics {
    pub mape: f64,
    pub rmse: f64,
    pub mae: f64,
    pub accuracy: f64,
}

/// Identify surge periods in forecast data
#[napi]
pub fn identify_surges(
    predicted_values: Vec<f64>,
    dates: Vec<String>,
    threshold: f64,
) -> Vec<SurgePeriod> {
    if predicted_values.is_empty() || predicted_values.len() != dates.len() {
        return vec![];
    }

    let avg_volume = mean(predicted_values.clone());
    let mut surges = Vec::new();
    let mut current_surge: Option<SurgePeriod> = None;

    for (i, &value) in predicted_values.iter().enumerate() {
        let ratio = if avg_volume != 0.0 { value / avg_volume } else { 1.0 };
        let is_high_volume = ratio > threshold;

        match (&mut current_surge, is_high_volume) {
            (None, true) => {
                current_surge = Some(SurgePeriod {
                    start_date: dates[i].clone(),
                    end_date: dates[i].clone(),
                    peak_value: value,
                    severity: determine_severity(ratio),
                });
            }
            (Some(ref mut surge), true) => {
                surge.end_date = dates[i].clone();
                if value > surge.peak_value {
                    surge.peak_value = value;
                    surge.severity = determine_severity(ratio);
                }
            }
            (Some(surge), false) => {
                surges.push(surge.clone());
                current_surge = None;
            }
            (None, false) => {}
        }
    }

    // Close any open surge
    if let Some(surge) = current_surge {
        surges.push(surge);
    }

    surges
}

fn determine_severity(ratio: f64) -> String {
    if ratio > 1.5 {
        "high".to_string()
    } else if ratio > 1.35 {
        "medium".to_string()
    } else {
        "low".to_string()
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct SurgePeriod {
    pub start_date: String,
    pub end_date: String,
    pub peak_value: f64,
    pub severity: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_exponential_smoothing() {
        let data = vec![10.0, 12.0, 14.0, 13.0, 15.0];
        let result = simple_exponential_smoothing(data, 0.3);
        assert_eq!(result.len(), 5);
        assert!((result[0] - 10.0).abs() < 1e-10);
    }

    #[test]
    fn test_predict_next() {
        let data: Vec<f64> = (0..30).map(|i| 50.0 + (i as f64 * 0.5) + ((i % 7) as f64 * 2.0)).collect();
        let predictions = predict_next(data, 7, 7);
        assert_eq!(predictions.len(), 7);
        assert!(predictions.iter().all(|p| p.predicted_value >= 0.0));
    }

    #[test]
    fn test_calculate_accuracy() {
        let predictions = vec![100.0, 105.0, 98.0, 102.0, 99.0];
        let actuals = vec![100.0, 100.0, 100.0, 100.0, 100.0];
        let metrics = calculate_accuracy(predictions, actuals);
        assert!(metrics.accuracy > 0.0);
        assert!(metrics.mape >= 0.0);
    }

    #[test]
    fn test_staffing_needs() {
        let result = calculate_staffing_needs(100.0, 1.0, 0.85);
        assert!(result.lab_techs >= 1);
        assert!(result.engineers >= 1);
    }
}
