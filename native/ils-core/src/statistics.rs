//! Core statistical functions
//!
//! High-performance implementations of common statistical operations
//! using SIMD optimizations and parallel processing where beneficial.

use napi_derive::napi;
use rayon::prelude::*;

/// Calculate the mean (average) of a dataset
#[napi]
pub fn mean(data: Vec<f64>) -> f64 {
    if data.is_empty() {
        return 0.0;
    }
    data.iter().sum::<f64>() / data.len() as f64
}

/// Calculate the median of a dataset
#[napi]
pub fn median(data: Vec<f64>) -> f64 {
    if data.is_empty() {
        return 0.0;
    }
    let mut sorted = data.clone();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let mid = sorted.len() / 2;
    if sorted.len() % 2 == 0 {
        (sorted[mid - 1] + sorted[mid]) / 2.0
    } else {
        sorted[mid]
    }
}

/// Calculate the standard deviation of a dataset
#[napi]
pub fn std_dev(data: Vec<f64>) -> f64 {
    if data.len() < 2 {
        return 0.0;
    }
    let m = mean(data.clone());
    let variance: f64 = data.iter().map(|x| (x - m).powi(2)).sum::<f64>() / (data.len() - 1) as f64;
    variance.sqrt()
}

/// Calculate variance of a dataset
#[napi]
pub fn variance(data: Vec<f64>) -> f64 {
    if data.len() < 2 {
        return 0.0;
    }
    let m = mean(data.clone());
    data.iter().map(|x| (x - m).powi(2)).sum::<f64>() / (data.len() - 1) as f64
}

/// Calculate quantile (percentile) of a dataset
#[napi]
pub fn quantile(data: Vec<f64>, q: f64) -> f64 {
    if data.is_empty() || q < 0.0 || q > 1.0 {
        return 0.0;
    }
    let mut sorted: Vec<f64> = data.into_iter().filter(|x| !x.is_nan()).collect();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    if sorted.is_empty() {
        return 0.0;
    }

    let n = sorted.len();
    let index = q * (n - 1) as f64;
    let lower = index.floor() as usize;
    let upper = index.ceil() as usize;

    if lower == upper || upper >= n {
        sorted[lower.min(n - 1)]
    } else {
        let frac = index - lower as f64;
        sorted[lower] * (1.0 - frac) + sorted[upper] * frac
    }
}

/// Calculate Interquartile Range (IQR)
#[napi]
pub fn iqr(data: Vec<f64>) -> f64 {
    let q1 = quantile(data.clone(), 0.25);
    let q3 = quantile(data, 0.75);
    q3 - q1
}

/// Calculate z-scores for all values in a dataset
#[napi]
pub fn z_scores(data: Vec<f64>) -> Vec<f64> {
    if data.len() < 2 {
        return vec![0.0; data.len()];
    }
    let m = mean(data.clone());
    let sd = std_dev(data.clone());
    if sd == 0.0 {
        return vec![0.0; data.len()];
    }
    data.iter().map(|x| (x - m) / sd).collect()
}

/// Calculate z-scores in parallel (for large datasets)
#[napi]
pub fn z_scores_parallel(data: Vec<f64>) -> Vec<f64> {
    if data.len() < 2 {
        return vec![0.0; data.len()];
    }
    let m = mean(data.clone());
    let sd = std_dev(data.clone());
    if sd == 0.0 {
        return vec![0.0; data.len()];
    }
    data.par_iter().map(|x| (x - m) / sd).collect()
}

/// Calculate moving average
#[napi]
pub fn moving_average(data: Vec<f64>, window_size: u32) -> Vec<f64> {
    let window = window_size as usize;
    if data.len() < window || window == 0 {
        return vec![];
    }

    let mut result = Vec::with_capacity(data.len() - window + 1);
    let mut sum: f64 = data[..window].iter().sum();
    result.push(sum / window as f64);

    for i in window..data.len() {
        sum = sum - data[i - window] + data[i];
        result.push(sum / window as f64);
    }

    result
}

/// Calculate exponential moving average
#[napi]
pub fn exponential_moving_average(data: Vec<f64>, alpha: f64) -> Vec<f64> {
    if data.is_empty() {
        return vec![];
    }

    let mut result = Vec::with_capacity(data.len());
    result.push(data[0]);

    for i in 1..data.len() {
        let ema = alpha * data[i] + (1.0 - alpha) * result[i - 1];
        result.push(ema);
    }

    result
}

/// Calculate linear regression coefficients (slope and intercept)
#[napi]
pub fn linear_regression(x: Vec<f64>, y: Vec<f64>) -> LinearRegressionResult {
    if x.len() != y.len() || x.is_empty() {
        return LinearRegressionResult {
            slope: 0.0,
            intercept: 0.0,
            r_squared: 0.0,
        };
    }

    let n = x.len() as f64;
    let sum_x: f64 = x.iter().sum();
    let sum_y: f64 = y.iter().sum();
    let sum_xy: f64 = x.iter().zip(y.iter()).map(|(a, b)| a * b).sum();
    let sum_x2: f64 = x.iter().map(|a| a * a).sum();
    let _sum_y2: f64 = y.iter().map(|a| a * a).sum();

    let denominator = n * sum_x2 - sum_x * sum_x;
    if denominator == 0.0 {
        return LinearRegressionResult {
            slope: 0.0,
            intercept: mean(y),
            r_squared: 0.0,
        };
    }

    let slope = (n * sum_xy - sum_x * sum_y) / denominator;
    let intercept = (sum_y - slope * sum_x) / n;

    // Calculate R-squared
    let y_mean = sum_y / n;
    let ss_tot: f64 = y.iter().map(|yi| (yi - y_mean).powi(2)).sum();
    let ss_res: f64 = x.iter().zip(y.iter())
        .map(|(xi, yi)| (yi - (slope * xi + intercept)).powi(2))
        .sum();

    let r_squared = if ss_tot != 0.0 { 1.0 - (ss_res / ss_tot) } else { 0.0 };

    LinearRegressionResult {
        slope,
        intercept,
        r_squared,
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct LinearRegressionResult {
    pub slope: f64,
    pub intercept: f64,
    pub r_squared: f64,
}

/// Calculate correlation coefficient (Pearson's r)
#[napi]
pub fn correlation(x: Vec<f64>, y: Vec<f64>) -> f64 {
    if x.len() != y.len() || x.len() < 2 {
        return 0.0;
    }

    let n = x.len() as f64;
    let sum_x: f64 = x.iter().sum();
    let sum_y: f64 = y.iter().sum();
    let sum_xy: f64 = x.iter().zip(y.iter()).map(|(a, b)| a * b).sum();
    let sum_x2: f64 = x.iter().map(|a| a * a).sum();
    let sum_y2: f64 = y.iter().map(|a| a * a).sum();

    let numerator = n * sum_xy - sum_x * sum_y;
    let denominator = ((n * sum_x2 - sum_x.powi(2)) * (n * sum_y2 - sum_y.powi(2))).sqrt();

    if denominator == 0.0 {
        0.0
    } else {
        numerator / denominator
    }
}

/// Calculate covariance
#[napi]
pub fn covariance(x: Vec<f64>, y: Vec<f64>) -> f64 {
    if x.len() != y.len() || x.len() < 2 {
        return 0.0;
    }

    let mean_x = mean(x.clone());
    let mean_y = mean(y.clone());

    x.iter().zip(y.iter())
        .map(|(xi, yi)| (xi - mean_x) * (yi - mean_y))
        .sum::<f64>() / (x.len() - 1) as f64
}

/// Descriptive statistics for a dataset
#[napi]
pub fn describe(data: Vec<f64>) -> DescriptiveStats {
    if data.is_empty() {
        return DescriptiveStats {
            count: 0,
            mean: 0.0,
            std_dev: 0.0,
            min: 0.0,
            q1: 0.0,
            median: 0.0,
            q3: 0.0,
            max: 0.0,
            iqr: 0.0,
            skewness: 0.0,
            kurtosis: 0.0,
        };
    }

    let count = data.len();
    let m = mean(data.clone());
    let sd = std_dev(data.clone());
    let min = data.iter().cloned().fold(f64::INFINITY, f64::min);
    let max = data.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let q1 = quantile(data.clone(), 0.25);
    let med = median(data.clone());
    let q3 = quantile(data.clone(), 0.75);

    // Calculate skewness and kurtosis
    let n = count as f64;
    let skewness = if sd != 0.0 {
        data.iter().map(|x| ((x - m) / sd).powi(3)).sum::<f64>() * n / ((n - 1.0) * (n - 2.0))
    } else {
        0.0
    };

    let kurtosis = if sd != 0.0 && n > 3.0 {
        let excess = data.iter().map(|x| ((x - m) / sd).powi(4)).sum::<f64>() / n;
        excess - 3.0  // Excess kurtosis (normal = 0)
    } else {
        0.0
    };

    DescriptiveStats {
        count: count as u32,
        mean: m,
        std_dev: sd,
        min,
        q1,
        median: med,
        q3,
        max,
        iqr: q3 - q1,
        skewness,
        kurtosis,
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct DescriptiveStats {
    pub count: u32,
    pub mean: f64,
    pub std_dev: f64,
    pub min: f64,
    pub q1: f64,
    pub median: f64,
    pub q3: f64,
    pub max: f64,
    pub iqr: f64,
    pub skewness: f64,
    pub kurtosis: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mean() {
        assert!((mean(vec![1.0, 2.0, 3.0, 4.0, 5.0]) - 3.0).abs() < 1e-10);
    }

    #[test]
    fn test_median() {
        assert!((median(vec![1.0, 2.0, 3.0, 4.0, 5.0]) - 3.0).abs() < 1e-10);
        assert!((median(vec![1.0, 2.0, 3.0, 4.0]) - 2.5).abs() < 1e-10);
    }

    #[test]
    fn test_std_dev() {
        let sd = std_dev(vec![2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]);
        assert!((sd - 2.138).abs() < 0.01);
    }

    #[test]
    fn test_linear_regression() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![2.0, 4.0, 6.0, 8.0, 10.0];
        let result = linear_regression(x, y);
        assert!((result.slope - 2.0).abs() < 1e-10);
        assert!((result.intercept - 0.0).abs() < 1e-10);
        assert!((result.r_squared - 1.0).abs() < 1e-10);
    }
}
