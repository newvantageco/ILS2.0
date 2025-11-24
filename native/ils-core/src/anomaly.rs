//! Anomaly Detection
//!
//! High-performance anomaly detection algorithms including:
//! - Z-score based detection
//! - IQR (Interquartile Range) based detection
//! - Moving average deviation detection
//! - Seasonal anomaly detection
//! - Trend change detection

use napi_derive::napi;
use rayon::prelude::*;

use crate::statistics::{mean, std_dev, quantile, moving_average, linear_regression};

/// Detect anomalies using multiple statistical methods
///
/// Combines Z-score, IQR, and moving average deviation for robust detection.
/// Points detected by multiple methods are considered more significant.
#[napi]
pub fn detect_anomalies(data: Vec<f64>, threshold: f64) -> Vec<AnomalyResult> {
    if data.len() < 3 {
        return vec![];
    }

    let m = mean(data.clone());
    let sd = std_dev(data.clone());

    // Calculate IQR bounds
    let q1 = quantile(data.clone(), 0.25);
    let q3 = quantile(data.clone(), 0.75);
    let iqr = q3 - q1;
    let lower_bound = q1 - 1.5 * iqr;
    let upper_bound = q3 + 1.5 * iqr;

    // Calculate moving average
    let window_size = (data.len() / 3).max(3).min(7) as u32;
    let mov_avg = moving_average(data.clone(), window_size);

    let results: Vec<Option<AnomalyResult>> = data
        .par_iter()
        .enumerate()
        .map(|(index, &value)| {
            let mut methods = Vec::new();

            // Method 1: Z-Score
            let z_score = if sd != 0.0 {
                (value - m).abs() / sd
            } else {
                0.0
            };
            if z_score > threshold {
                methods.push("z-score".to_string());
            }

            // Method 2: IQR method
            if value < lower_bound || value > upper_bound {
                methods.push("iqr".to_string());
            }

            // Method 3: Moving average deviation
            let mov_avg_index = if index >= (window_size as usize - 1) {
                index - (window_size as usize - 1)
            } else {
                return None; // Not enough data for moving average comparison
            };

            if mov_avg_index < mov_avg.len() {
                let avg = mov_avg[mov_avg_index];
                if avg != 0.0 {
                    let deviation = (value - avg).abs() / avg;
                    if deviation > 0.3 {
                        methods.push("moving-avg".to_string());
                    }
                }
            }

            if methods.is_empty() {
                return None;
            }

            let deviation_percent = if m != 0.0 {
                ((value - m).abs() / m) * 100.0
            } else {
                0.0
            };

            let severity = if methods.len() >= 2 {
                "high".to_string()
            } else if z_score > threshold * 1.5 {
                "medium".to_string()
            } else {
                "low".to_string()
            };

            Some(AnomalyResult {
                index: index as u32,
                value,
                severity,
                methods,
                deviation_percent,
            })
        })
        .collect();

    results.into_iter().flatten().collect()
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct AnomalyResult {
    pub index: u32,
    pub value: f64,
    pub severity: String,
    pub methods: Vec<String>,
    pub deviation_percent: f64,
}

/// Real-time anomaly detection with adaptive thresholds
///
/// Uses recent data to calculate dynamic thresholds for detecting
/// anomalies in new incoming values.
#[napi]
pub fn detect_anomalies_realtime(
    historical_data: Vec<f64>,
    new_value: f64,
    sensitivity: String,
) -> RealTimeAnomalyResult {
    // Use recent data for adaptive threshold (last 14 data points)
    let recent_window: Vec<f64> = historical_data
        .iter()
        .rev()
        .take(14)
        .cloned()
        .collect();

    let m = mean(recent_window.clone());
    let sd = std_dev(recent_window);

    // Adjust threshold based on sensitivity
    let threshold_multiplier = match sensitivity.as_str() {
        "low" => 3.0,
        "medium" => 2.0,
        "high" => 1.5,
        _ => 2.0,
    };

    let threshold = sd * threshold_multiplier;
    let deviation = (new_value - m).abs();
    let z_score = if sd != 0.0 { deviation / sd } else { 0.0 };

    // Calculate confidence based on how far outside normal range
    let confidence = ((z_score / threshold_multiplier) * 100.0).min(100.0);

    let severity = if z_score > 3.0 {
        "high".to_string()
    } else if z_score > 2.0 {
        "medium".to_string()
    } else {
        "low".to_string()
    };

    RealTimeAnomalyResult {
        is_anomaly: deviation > threshold,
        severity,
        confidence,
        expected_min: m - threshold,
        expected_max: m + threshold,
        actual_value: new_value,
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct RealTimeAnomalyResult {
    pub is_anomaly: bool,
    pub severity: String,
    pub confidence: f64,
    pub expected_min: f64,
    pub expected_max: f64,
    pub actual_value: f64,
}

/// Detect seasonal anomalies by comparing with historical same-period values
///
/// Useful for detecting unusual patterns in weekly/monthly cycles.
#[napi]
pub fn detect_seasonal_anomalies(
    data: Vec<f64>,
    seasonal_period: u32,
) -> Vec<SeasonalAnomalyResult> {
    let period = seasonal_period as usize;

    if data.len() < period * 2 {
        return vec![];
    }

    let results: Vec<SeasonalAnomalyResult> = (period..data.len())
        .into_par_iter()
        .filter_map(|i| {
            // Get historical values for same seasonal position
            let mut seasonal_values = Vec::new();
            let mut j = i.saturating_sub(period);
            while j < i {
                seasonal_values.push(data[j]);
                if j >= period {
                    j -= period;
                } else {
                    break;
                }
            }

            if seasonal_values.len() < 2 {
                return None;
            }

            let expected_value = mean(seasonal_values.clone());
            let seasonal_std = std_dev(seasonal_values);
            let deviation = (data[i] - expected_value).abs();
            let is_anomaly = deviation > seasonal_std * 2.0;

            if !is_anomaly {
                return None;
            }

            Some(SeasonalAnomalyResult {
                index: i as u32,
                value: data[i],
                expected_value,
                deviation,
            })
        })
        .collect();

    results
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct SeasonalAnomalyResult {
    pub index: u32,
    pub value: f64,
    pub expected_value: f64,
    pub deviation: f64,
}

/// Detect trend changes and shifts in data patterns
///
/// Identifies points where the trend significantly changes direction or magnitude.
#[napi]
pub fn detect_trend_changes(data: Vec<f64>, window_size: u32) -> Vec<TrendChangeResult> {
    let window = window_size as usize;

    if data.len() < window * 2 {
        return vec![];
    }

    let results: Vec<TrendChangeResult> = (window * 2..data.len())
        .into_par_iter()
        .filter_map(|i| {
            // Calculate trend for previous window
            let old_window: Vec<f64> = data[(i - window * 2)..(i - window)].to_vec();
            let old_x: Vec<f64> = (0..old_window.len()).map(|j| j as f64).collect();
            let old_trend = linear_regression(old_x, old_window).slope;

            // Calculate trend for current window
            let new_window: Vec<f64> = data[(i - window)..i].to_vec();
            let new_x: Vec<f64> = (0..new_window.len()).map(|j| j as f64).collect();
            let new_trend = linear_regression(new_x, new_window).slope;

            // Check if trend has significantly changed
            let change_percent = if old_trend != 0.0 {
                ((new_trend - old_trend).abs() / old_trend.abs()) * 100.0
            } else if new_trend != 0.0 {
                100.0 // Changed from zero
            } else {
                0.0
            };

            let significant = change_percent > 50.0;

            if !significant {
                return None;
            }

            Some(TrendChangeResult {
                index: i as u32,
                old_trend,
                new_trend,
                change_percent,
                significant,
            })
        })
        .collect();

    results
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct TrendChangeResult {
    pub index: u32,
    pub old_trend: f64,
    pub new_trend: f64,
    pub change_percent: f64,
    pub significant: bool,
}

/// Comprehensive anomaly analysis
///
/// Runs all anomaly detection methods and returns a combined summary.
#[napi]
pub fn analyze_anomalies(
    data: Vec<f64>,
    threshold: f64,
    seasonal_period: u32,
    window_size: u32,
) -> AnomalyAnalysisSummary {
    // Run all detection methods
    let anomalies = detect_anomalies(data.clone(), threshold);
    let seasonal_anomalies = detect_seasonal_anomalies(data.clone(), seasonal_period);
    let trend_changes = detect_trend_changes(data, window_size);

    let total_anomalies = anomalies.len() as u32;
    let high_severity_count = anomalies.iter().filter(|a| a.severity == "high").count() as u32;

    let average_deviation = if !anomalies.is_empty() {
        anomalies.iter().map(|a| a.deviation_percent).sum::<f64>() / anomalies.len() as f64
    } else {
        0.0
    };

    AnomalyAnalysisSummary {
        total_anomalies,
        high_severity_count,
        average_deviation,
        significant_trend_changes: trend_changes.len() as u32,
        seasonal_anomaly_count: seasonal_anomalies.len() as u32,
        anomalies,
        seasonal_anomalies,
        trend_changes,
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct AnomalyAnalysisSummary {
    pub total_anomalies: u32,
    pub high_severity_count: u32,
    pub average_deviation: f64,
    pub significant_trend_changes: u32,
    pub seasonal_anomaly_count: u32,
    pub anomalies: Vec<AnomalyResult>,
    pub seasonal_anomalies: Vec<SeasonalAnomalyResult>,
    pub trend_changes: Vec<TrendChangeResult>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_anomalies() {
        // Data with obvious outlier at index 5
        let data = vec![10.0, 11.0, 10.5, 11.2, 10.8, 100.0, 10.9, 11.1, 10.7, 11.0];
        let anomalies = detect_anomalies(data, 2.0);

        assert!(!anomalies.is_empty());
        // The value 100.0 should be detected as anomaly
        assert!(anomalies.iter().any(|a| (a.value - 100.0).abs() < 0.1));
    }

    #[test]
    fn test_detect_realtime() {
        let historical = vec![10.0, 11.0, 10.5, 11.2, 10.8, 10.9, 11.1, 10.7, 11.0, 10.5];

        // Normal value
        let result = detect_anomalies_realtime(historical.clone(), 11.0, "medium".to_string());
        assert!(!result.is_anomaly);

        // Anomalous value
        let result = detect_anomalies_realtime(historical, 50.0, "medium".to_string());
        assert!(result.is_anomaly);
    }

    #[test]
    fn test_trend_changes() {
        // Data with clear trend change in the middle
        let mut data: Vec<f64> = (0..20).map(|i| 10.0 + (i as f64 * 0.5)).collect();
        // Reverse the trend
        for i in 20..40 {
            data.push(20.0 - ((i - 20) as f64 * 0.5));
        }

        let changes = detect_trend_changes(data, 5);
        // Should detect the trend reversal
        assert!(!changes.is_empty());
    }

    #[test]
    fn test_seasonal_anomalies() {
        // Weekly pattern with anomaly
        let mut data = Vec::new();
        for week in 0..4 {
            for day in 0..7 {
                let base = 100.0 + (day as f64 * 5.0);
                // Add anomaly in week 2, day 3
                if week == 2 && day == 3 {
                    data.push(base + 100.0);
                } else {
                    data.push(base);
                }
            }
        }

        let anomalies = detect_seasonal_anomalies(data, 7);
        assert!(!anomalies.is_empty());
    }
}
