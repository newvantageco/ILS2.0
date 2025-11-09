/**
 * Platform AI Service - Analytics & Predictions Engine
 * 
 * Provides cross-tenant intelligence through Python ML:
 * 1. Sales forecasting with LinearRegression (7-day predictions)
 * 2. Inventory optimization (stockout/overstock alerts)
 * 3. Booking pattern analysis (utilization, no-shows)
 * 4. Comparative benchmarking (0-100 scoring, rankings)
 * 5. Intelligent caching (1-hour TTL)
 * 
 * Uses: pandas, numpy, scikit-learn, scipy
 */

import { spawn } from 'child_process';
import path from 'path';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { 
  dailyPracticeMetrics, 
  inventoryPerformanceMetrics,
  // testRoomBookings, // TODO: Add this table to bi-schema.ts
  platformPracticeComparison
} from '../../shared/bi-schema';

interface AIInsight {
  type: 'positive' | 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  recommendation: string;
}

interface SalesTrendAnalysis {
  status: string;
  current_avg_revenue: number;
  trend_slope: number;
  volatility: number;
  predictions: Array<{
    date: string;
    predicted_revenue: number;
    confidence_interval: number;
  }>;
  day_patterns: Record<string, number>;
  insights: AIInsight[];
}

interface InventoryAnalysis {
  status: string;
  summary: {
    total_products: number;
    popular_items_count: number;
    slow_movers_count: number;
    overstock_count: number;
    stockout_risk_count: number;
  };
  popular_items: any[];
  slow_movers: any[];
  overstock_items: any[];
  stockout_risk: any[];
  insights: AIInsight[];
}

interface BookingAnalysis {
  status: string;
  utilization_metrics: {
    average_utilization: number;
    peak_utilization: number;
    no_show_rate: number;
  };
  peak_hours: number[];
  off_peak_hours: number[];
  busiest_day: string;
  slowest_day: string;
  hourly_utilization: Record<number, number>;
  insights: AIInsight[];
}

interface ComparativeAnalysis {
  status: string;
  performance_score: number;
  insights: AIInsight[];
  platform_ranking: string;
}

export class PlatformAIService {
  private db: NodePgDatabase;
  private pythonPath: string;
  private insightsCache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number = 3600000; // 1 hour in milliseconds

  constructor(db: NodePgDatabase) {
    this.db = db;
    this.pythonPath = path.join(__dirname, '../../python/bi_analytics_ai.py');
    this.insightsCache = new Map();
  }

  /**
   * Execute Python analytics script
   */
  private async executePythonAnalysis(command: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [
        this.pythonPath,
        command,
        JSON.stringify(data)
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${stderr}`));
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${stdout}`));
          }
        }
      });
    });
  }

  /**
   * Get cached insights or fetch new ones
   */
  private getCached<T>(key: string): T | null {
    const cached = this.insightsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.insightsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Analyze sales trends for a company
   */
  async analyzeSalesTrends(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesTrendAnalysis> {
    const cacheKey = `sales_${companyId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    const cached = this.getCached<SalesTrendAnalysis>(cacheKey);
    if (cached) return cached;

    // Fetch daily metrics from database
    const metrics = await this.db
      .select()
      .from(dailyPracticeMetrics)
      .where(
        and(
          eq(dailyPracticeMetrics.companyId, companyId),
          gte(dailyPracticeMetrics.metricDate, startDate),
          lte(dailyPracticeMetrics.metricDate, endDate)
        )
      )
      .orderBy(dailyPracticeMetrics.metricDate);

    const salesData = metrics.map(m => ({
      date: m.metricDate.toISOString(),
      revenue: m.netRevenue,
      transactions: m.totalPatientsSeen
    }));

    const analysis = await this.executePythonAnalysis('analyze_sales', {
      sales_data: salesData
    });

    this.setCache(cacheKey, analysis);
    return analysis;
  }

  /**
   * Analyze inventory performance
   */
  async analyzeInventoryPerformance(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<InventoryAnalysis> {
    const cacheKey = `inventory_${companyId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    const cached = this.getCached<InventoryAnalysis>(cacheKey);
    if (cached) return cached;

    // Fetch inventory metrics
    const metrics = await this.db
      .select()
      .from(inventoryPerformanceMetrics)
      .where(
        and(
          eq(inventoryPerformanceMetrics.companyId, companyId),
          gte(inventoryPerformanceMetrics.periodStart, startDate),
          lte(inventoryPerformanceMetrics.periodEnd, endDate)
        )
      );

    // Extract inventory data from topItems JSON field
    const inventoryData = metrics.flatMap(m => {
      const topItems = (m.topItems as any) || [];
      return Array.isArray(topItems) ? topItems.map((item: any) => ({
        name: item.name || item.sku,
        product_name: item.name || item.sku,
        units_sold: item.units || 0,
        current_stock: 0, // Not available in this schema
        revenue: parseFloat(item.revenue || '0')
      })) : [];
    });

    const analysis = await this.executePythonAnalysis('analyze_inventory', {
      inventory_data: inventoryData
    });

    this.setCache(cacheKey, analysis);
    return analysis;
  }

  /**
   * Analyze booking patterns (DISABLED - requires testRoomBookings table)
   */
  async analyzeBookingPatterns(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BookingAnalysis> {
    // TODO: Implement when testRoomBookings table is added to bi-schema
    return {
      status: 'disabled',
      utilization_metrics: {
        average_utilization: 0,
        peak_utilization: 0,
        no_show_rate: 0
      },
      peak_hours: [],
      off_peak_hours: [],
      busiest_day: 'N/A',
      slowest_day: 'N/A',
      hourly_utilization: {},
      insights: [{
        type: 'info',
        title: 'Booking Analysis Disabled',
        message: 'Booking analysis requires testRoomBookings table implementation',
        recommendation: 'Add testRoomBookings table to bi-schema.ts to enable this feature'
      }]
    };
    
    /* DISABLED UNTIL TABLE EXISTS
    const cacheKey = `bookings_${companyId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    const cached = this.getCached<BookingAnalysis>(cacheKey);
    if (cached) return cached;

    // Fetch booking data from test rooms
    const bookings = await this.db
      .select()
      .from(testRoomBookings)
      .where(
        and(
          gte(testRoomBookings.startTime, startDate),
          lte(testRoomBookings.startTime, endDate)
        )
      );

    const bookingData = bookings.map(b => ({
      datetime: b.startTime.toISOString(),
      status: b.status,
      duration: 60, // Default duration
      total_slots: 10 // Assume 10 slots per hour
    }));

    const analysis = await this.executePythonAnalysis('analyze_bookings', {
      booking_data: bookingData
    });

    this.setCache(cacheKey, analysis);
    return analysis;
    */
  }

  /**
   * Generate comparative insights against platform benchmarks
   */
  async generateComparativeInsights(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ComparativeAnalysis> {
    const cacheKey = `compare_${companyId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    const cached = this.getCached<ComparativeAnalysis>(cacheKey);
    if (cached) return cached;

    // Get company metrics
    const companyMetrics = await this.db
      .select()
      .from(dailyPracticeMetrics)
      .where(
        and(
          eq(dailyPracticeMetrics.companyId, companyId),
          gte(dailyPracticeMetrics.metricDate, startDate),
          lte(dailyPracticeMetrics.metricDate, endDate)
        )
      );

    const companyAvg = {
      revenue: companyMetrics.reduce((sum, m) => sum + Number(m.netRevenue), 0) / companyMetrics.length,
      retention_rate: companyMetrics.reduce((sum, m) => sum + Number(m.conversionRate || 0), 0) / companyMetrics.length,
      no_show_rate: companyMetrics.reduce((sum, m) => sum + Number(m.noShowRate), 0) / companyMetrics.length
    };

    // Get platform benchmarks
    const platformMetrics = await this.db
      .select()
      .from(platformPracticeComparison)
      .where(
        and(
          gte(platformPracticeComparison.periodStart, startDate),
          lte(platformPracticeComparison.periodEnd, endDate)
        )
      )
      .orderBy(desc(platformPracticeComparison.periodEnd))
      .limit(1);

    const platformBenchmarks = platformMetrics.length > 0 ? {
      revenue: Number(platformMetrics[0].totalRevenue),
      retention_rate: Number(platformMetrics[0].patientRetentionRate || 75), // Use actual retention or default
      no_show_rate: 100 - Number(platformMetrics[0].conversionRate || 90) // Estimate from conversion rate
    } : companyAvg;

    const analysis = await this.executePythonAnalysis('compare_performance', {
      company_metrics: companyAvg,
      platform_benchmarks: platformBenchmarks
    });

    this.setCache(cacheKey, analysis);
    return analysis;
  }

  /**
   * Get comprehensive AI insights for a company
   */
  async getComprehensiveInsights(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    sales: SalesTrendAnalysis;
    inventory: InventoryAnalysis;
    bookings: BookingAnalysis;
    comparative: ComparativeAnalysis;
    summary: {
      total_insights: number;
      critical_count: number;
      warning_count: number;
      positive_count: number;
      top_priority_actions: string[];
    };
  }> {
    // Run all analyses in parallel
    const [sales, inventory, bookings, comparative] = await Promise.all([
      this.analyzeSalesTrends(companyId, startDate, endDate),
      this.analyzeInventoryPerformance(companyId, startDate, endDate),
      this.analyzeBookingPatterns(companyId, startDate, endDate),
      this.generateComparativeInsights(companyId, startDate, endDate)
    ]);

    // Aggregate insights
    const allInsights = [
      ...sales.insights,
      ...inventory.insights,
      ...bookings.insights,
      ...comparative.insights
    ];

    const criticalInsights = allInsights.filter(i => i.type === 'critical');
    const warningInsights = allInsights.filter(i => i.type === 'warning');
    const positiveInsights = allInsights.filter(i => i.type === 'positive');

    // Extract top priority actions
    const topPriorityActions = [
      ...criticalInsights.map(i => i.recommendation),
      ...warningInsights.slice(0, 2).map(i => i.recommendation)
    ].slice(0, 5);

    return {
      sales,
      inventory,
      bookings,
      comparative,
      summary: {
        total_insights: allInsights.length,
        critical_count: criticalInsights.length,
        warning_count: warningInsights.length,
        positive_count: positiveInsights.length,
        top_priority_actions: topPriorityActions
      }
    };
  }

  /**
   * Clear insights cache (for manual refresh)
   */
  clearCache(): void {
    this.insightsCache.clear();
  }
}
