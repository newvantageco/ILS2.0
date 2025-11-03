/**
 * Currency Service
 * Provides real-time GBP to USD conversion rates
 */

interface CurrencyRate {
  rate: number;
  lastUpdated: Date;
}

class CurrencyService {
  private cache: Map<string, CurrencyRate> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY || '';

  /**
   * Get GBP to USD exchange rate
   * Uses multiple fallback APIs for reliability
   */
  async getGBPtoUSD(): Promise<number> {
    const cached = this.cache.get('GBP_USD');
    
    // Return cached rate if still valid
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      // Try primary API: exchangerate-api.com (free tier available)
      const rate = await this.fetchFromExchangeRateAPI();
      this.cache.set('GBP_USD', { rate, lastUpdated: new Date() });
      return rate;
    } catch (error) {
      console.error('Primary API failed, trying fallback:', error);
      
      try {
        // Fallback: Open Exchange Rates
        const rate = await this.fetchFromOpenExchangeRates();
        this.cache.set('GBP_USD', { rate, lastUpdated: new Date() });
        return rate;
      } catch (fallbackError) {
        console.error('Fallback API failed:', fallbackError);
        
        // Return cached rate if available, even if expired
        if (cached) {
          console.warn('Using expired cache due to API failures');
          return cached.rate;
        }
        
        // Last resort: return approximate rate
        console.warn('Using approximate exchange rate');
        return 1.27; // Approximate GBP to USD rate as of Nov 2025
      }
    }
  }

  /**
   * Primary API: exchangerate-api.com
   */
  private async fetchFromExchangeRateAPI(): Promise<number> {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/GBP');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.rates.USD;
  }

  /**
   * Fallback API: Open Exchange Rates
   * Requires API key for production use
   */
  private async fetchFromOpenExchangeRates(): Promise<number> {
    const url = this.API_KEY
      ? `https://openexchangerates.org/api/latest.json?app_id=${this.API_KEY}&base=GBP&symbols=USD`
      : 'https://openexchangerates.org/api/latest.json?base=GBP&symbols=USD';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.rates.USD;
  }

  /**
   * Convert GBP amount to USD
   */
  async convertGBPtoUSD(gbpAmount: number): Promise<number> {
    const rate = await this.getGBPtoUSD();
    return gbpAmount * rate;
  }

  /**
   * Convert USD amount to GBP
   */
  async convertUSDtoGBP(usdAmount: number): Promise<number> {
    const rate = await this.getGBPtoUSD();
    return usdAmount / rate;
  }

  /**
   * Format currency with symbol
   */
  formatCurrency(amount: number, currency: 'GBP' | 'USD'): string {
    const formatted = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    return formatted;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache age in minutes
   */
  getCacheAge(): number | null {
    const cached = this.cache.get('GBP_USD');
    if (!cached) return null;
    
    return Math.floor((Date.now() - cached.lastUpdated.getTime()) / (60 * 1000));
  }
}

export const currencyService = new CurrencyService();
export default currencyService;
