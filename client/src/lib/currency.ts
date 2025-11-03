/**
 * Currency utilities for handling GBP and USD conversions
 */

export interface ExchangeRate {
  rate: number;
  timestamp: number;
  lastUpdated: string;
}

// Cache exchange rate for 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;
let cachedRate: ExchangeRate | null = null;

/**
 * Fetch live GBP to USD exchange rate
 * Uses exchangerate-api.com (free tier allows 1500 requests/month)
 */
export async function fetchGBPToUSDRate(): Promise<number> {
  // Check cache first
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate;
  }

  try {
    // Using exchangerate-api.com free API (no key required for basic usage)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/GBP');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const rate = data.rates.USD;

    // Cache the result
    cachedRate = {
      rate,
      timestamp: Date.now(),
      lastUpdated: new Date().toISOString(),
    };

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback to approximate rate if API fails
    return 1.27; // Approximate GBP to USD rate as fallback
  }
}

/**
 * Convert GBP amount to USD
 */
export function convertGBPToUSD(gbpAmount: number, rate: number): number {
  return gbpAmount * rate;
}

/**
 * Format currency as GBP
 */
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

/**
 * Format currency as USD
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get cached exchange rate info
 */
export function getCachedRate(): ExchangeRate | null {
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate;
  }
  return null;
}

/**
 * Clear cached exchange rate (useful for manual refresh)
 */
export function clearCachedRate(): void {
  cachedRate = null;
}
