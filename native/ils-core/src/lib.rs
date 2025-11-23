//! ILS Core - High-performance native computations for ILS 2.0
//!
//! This module provides Rust-powered statistical and ML computations
//! that are 10-50x faster than their JavaScript equivalents.

#![deny(clippy::all)]

mod statistics;
mod forecasting;
mod anomaly;

pub use statistics::*;
pub use forecasting::*;
pub use anomaly::*;

use napi_derive::napi;

/// Module initialization and version info
#[napi]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Check if native module is available
#[napi]
pub fn is_native_available() -> bool {
    true
}
