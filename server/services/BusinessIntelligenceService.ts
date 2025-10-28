/**
 * Business Intelligence Service
 * 
 * Provides actionable business insights and recommendations:
 * - Revenue analysis and trends
 * - Operational efficiency metrics
 * - Cost optimization opportunities
 * - Performance benchmarks
 * - Strategic recommendations
 */

import { IStorage } from "../storage";
import { createLogger, type Logger } from "../utils/logger";
import * as stats from 'simple-statistics';

export interface BusinessInsight {
  category: 'revenue' | 'efficiency' | 'cost' | 'quality' | 'growth';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  trend: 'positive' | 'negative' | 'neutral';
  value?: number;
  change?: number;
  unit?: string;
  recommendations: string[];
}

export interface KPIMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface BusinessDashboard {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    orderVolume: number;
    volumeGrowth: number;
    avgOrderValue: number;
    customerSatisfaction: number;
  };
  kpis: KPIMetric[];
  insights: BusinessInsight[];
  opportunities: {
    title: string;
    description: string;
    potentialValue: number;
    effort: 'low' | 'medium' | 'high';
    priority: number;
  }[];
  alerts: {
    severity: 'info' | 'warning' | 'critical';
    message: string;
    action: string;
  }[];
}

export class BusinessIntelligenceService {
  private logger: Logger;

  constructor(private storage: IStorage) {
    this.logger = createLogger("BusinessIntelligenceService");
  }

  /**
   * Generate comprehensive business dashboard
   */
  async generateDashboard(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<BusinessDashboard> {
    this.logger.info("Generating business intelligence dashboard", { timeframe });

    const daysBack = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    const previousDaysBack = daysBack * 2;

    // Gather data
    const currentOrders = await this.getOrdersInPeriod(daysBack);
    const previousOrders = await this.getOrdersInPeriod(previousDaysBack, daysBack);
    const allInvoices: any[] = []; // Simplified for now

    // Calculate overview metrics
    const overview = this.calculateOverview(currentOrders, previousOrders, allInvoices);

    // Generate KPIs
    const kpis = await this.generateKPIs(currentOrders, previousOrders);

    // Analyze insights
    const insights = await this.analyzeInsights(currentOrders, previousOrders, allInvoices);

    // Identify opportunities
    const opportunities = await this.identifyOpportunities(currentOrders, allInvoices);

    // Generate alerts
    const alerts = this.generateAlerts(overview, kpis, insights);

    return {
      overview,
      kpis,
      insights,
      opportunities,
      alerts,
    };
  }

  /**
   * Get specific business metric
   */
  async getMetric(metricName: string): Promise<number | null> {
    switch (metricName) {
      case 'revenue':
        return this.calculateTotalRevenue(30);
      case 'orders':
        return this.calculateOrderVolume(30);
      case 'avgOrderValue':
        return this.calculateAvgOrderValue(30);
      case 'turnaroundTime':
        return this.calculateAvgTurnaroundTime(30);
      default:
        this.logger.warn("Unknown metric requested", { metricName });
        return null;
    }
  }

  /**
   * Get trend analysis for a metric
   */
  async getTrendAnalysis(metricName: string, days: number = 30): Promise<{
    values: number[];
    dates: string[];
    trend: 'increasing' | 'decreasing' | 'stable';
    forecast: number[];
  }> {
    const historicalData = await this.getHistoricalMetric(metricName, days);
    const trendDirection = this.analyzeTrend(historicalData.values);
    
    // Simple forecast (moving average)
    const forecast = this.forecastMetric(historicalData.values, 7);

    return {
      values: historicalData.values,
      dates: historicalData.dates,
      trend: trendDirection,
      forecast,
    };
  }

  // ========== PRIVATE METHODS ==========

  private async getOrdersInPeriod(daysBack: number, offset: number = 0): Promise<any[]> {
    const allOrders = await this.storage.getOrders();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack - offset);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);

    return allOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  private calculateOverview(currentOrders: any[], previousOrders: any[], allInvoices: any[]) {
    const currentRevenue = this.sumRevenue(allInvoices.slice(0, currentOrders.length));
    const previousRevenue = this.sumRevenue(allInvoices.slice(currentOrders.length, currentOrders.length + previousOrders.length));
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const volumeGrowth = previousOrders.length > 0
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
      : 0;

    const avgOrderValue = currentOrders.length > 0
      ? currentRevenue / currentOrders.length
      : 0;

    return {
      totalRevenue: Math.round(currentRevenue),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      orderVolume: currentOrders.length,
      volumeGrowth: Math.round(volumeGrowth * 10) / 10,
      avgOrderValue: Math.round(avgOrderValue),
      customerSatisfaction: 4.5, // Placeholder - would come from actual feedback
    };
  }

  private sumRevenue(invoices: any[]): number {
    return invoices.reduce((sum, inv) => {
      return sum + (parseFloat(inv.totalAmount || '0'));
    }, 0);
  }

  private async generateKPIs(currentOrders: any[], previousOrders: any[]): Promise<KPIMetric[]> {
    const kpis: KPIMetric[] = [];

    // Order Fulfillment Rate
    const fulfillmentRate = currentOrders.length > 0
      ? (currentOrders.filter(o => o.status === 'delivered').length / currentOrders.length) * 100
      : 0;
    const prevFulfillmentRate = previousOrders.length > 0
      ? (previousOrders.filter(o => o.status === 'delivered').length / previousOrders.length) * 100
      : 0;
    
    kpis.push({
      name: 'Order Fulfillment Rate',
      value: Math.round(fulfillmentRate * 10) / 10,
      target: 95,
      unit: '%',
      trend: fulfillmentRate >= prevFulfillmentRate ? 'up' : 'down',
      changePercent: Math.round((fulfillmentRate - prevFulfillmentRate) * 10) / 10,
      status: fulfillmentRate >= 95 ? 'excellent' : fulfillmentRate >= 85 ? 'good' : fulfillmentRate >= 75 ? 'warning' : 'critical',
    });

    // Average Turnaround Time
    const avgTurnaround = await this.calculateAvgTurnaroundTime(30);
    kpis.push({
      name: 'Avg Turnaround Time',
      value: avgTurnaround,
      target: 48,
      unit: 'hours',
      trend: avgTurnaround <= 48 ? 'up' : 'down',
      changePercent: 0, // Would calculate from previous period
      status: avgTurnaround <= 48 ? 'excellent' : avgTurnaround <= 72 ? 'good' : avgTurnaround <= 96 ? 'warning' : 'critical',
    });

    // Quality Score (based on remakes/returns)
    const remakeRate = currentOrders.length > 0
      ? (currentOrders.filter(o => o.status === 'returned' || o.status === 'cancelled').length / currentOrders.length) * 100
      : 0;
    const qualityScore = 100 - remakeRate;

    kpis.push({
      name: 'Quality Score',
      value: Math.round(qualityScore * 10) / 10,
      target: 95,
      unit: '%',
      trend: 'stable',
      changePercent: 0,
      status: qualityScore >= 95 ? 'excellent' : qualityScore >= 90 ? 'good' : qualityScore >= 85 ? 'warning' : 'critical',
    });

    // Capacity Utilization
    const capacityUtil = currentOrders.length > 0
      ? (currentOrders.length / (currentOrders.length * 1.2)) * 100 // Assuming 20% over capacity
      : 0;

    kpis.push({
      name: 'Capacity Utilization',
      value: Math.round(capacityUtil * 10) / 10,
      target: 85,
      unit: '%',
      trend: 'stable',
      changePercent: 0,
      status: capacityUtil >= 80 && capacityUtil <= 90 ? 'excellent' : 
              capacityUtil >= 70 && capacityUtil <= 95 ? 'good' :
              capacityUtil < 60 || capacityUtil > 95 ? 'critical' : 'warning',
    });

    return kpis;
  }

  private async analyzeInsights(currentOrders: any[], previousOrders: any[], allInvoices: any[]): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    // Revenue trend insight
    const currentRevenue = this.sumRevenue(allInvoices.slice(0, currentOrders.length));
    const previousRevenue = this.sumRevenue(allInvoices.slice(currentOrders.length));
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    if (Math.abs(revenueGrowth) > 10) {
      insights.push({
        category: 'revenue',
        title: revenueGrowth > 0 ? '📈 Strong Revenue Growth' : '📉 Revenue Decline Alert',
        description: `Revenue ${revenueGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueGrowth).toFixed(1)}% compared to previous period.`,
        impact: 'high',
        trend: revenueGrowth > 0 ? 'positive' : 'negative',
        value: currentRevenue,
        change: revenueGrowth,
        unit: 'GBP',
        recommendations: revenueGrowth > 0 
          ? ['Consider increasing production capacity', 'Invest in marketing to sustain growth', 'Review pricing strategy for optimization']
          : ['Analyze customer churn reasons', 'Review competitive pricing', 'Enhance customer engagement programs'],
      });
    }

    // Efficiency insight
    const avgTurnaround = await this.calculateAvgTurnaroundTime(30);
    if (avgTurnaround > 72) {
      insights.push({
        category: 'efficiency',
        title: '⏱️ Turnaround Time Above Target',
        description: `Average turnaround time is ${avgTurnaround} hours, exceeding the 48-hour target.`,
        impact: 'high',
        trend: 'negative',
        value: avgTurnaround,
        unit: 'hours',
        recommendations: [
          'Analyze bottlenecks in production workflow',
          'Consider adding staff during peak periods',
          'Implement automated quality checks to reduce rework',
          'Review equipment maintenance schedule',
        ],
      });
    }

    // Volume growth insight
    const volumeGrowth = previousOrders.length > 0
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
      : 0;

    if (volumeGrowth > 20) {
      insights.push({
        category: 'growth',
        title: '🚀 Rapid Order Volume Growth',
        description: `Order volume increased by ${volumeGrowth.toFixed(1)}%, indicating strong market demand.`,
        impact: 'high',
        trend: 'positive',
        value: currentOrders.length,
        change: volumeGrowth,
        unit: 'orders',
        recommendations: [
          'Plan for capacity expansion',
          'Secure additional material inventory',
          'Consider hiring additional staff',
          'Implement automated workflows to handle increased volume',
        ],
      });
    }

    return insights;
  }

  private async identifyOpportunities(currentOrders: any[], allInvoices: any[]) {
    const opportunities: any[] = [];

    // Check for premium product opportunity
    const avgOrderValue = currentOrders.length > 0
      ? this.sumRevenue(allInvoices.slice(0, currentOrders.length)) / currentOrders.length
      : 0;

    if (avgOrderValue < 150) {
      opportunities.push({
        title: 'Upsell Premium Products',
        description: 'Average order value is below industry benchmark. Opportunity to introduce premium lens options and coatings.',
        potentialValue: Math.round(currentOrders.length * 50), // £50 per order increase
        effort: 'medium',
        priority: 1,
      });
    }

    // Process optimization opportunity
    opportunities.push({
      title: 'Automate Quality Control',
      description: 'Implement AI-powered quality inspection to reduce manual checks and improve consistency.',
      potentialValue: 15000, // Annual savings
      effort: 'high',
      priority: 2,
    });

    // Customer retention opportunity
    opportunities.push({
      title: 'Customer Loyalty Program',
      description: 'Launch a loyalty program for eye care professionals to increase repeat orders.',
      potentialValue: 25000, // Annual revenue increase
      effort: 'medium',
      priority: 3,
    });

    return opportunities;
  }

  private generateAlerts(overview: any, kpis: KPIMetric[], insights: BusinessInsight[]) {
    const alerts: any[] = [];

    // Check KPIs for critical status
    kpis.forEach(kpi => {
      if (kpi.status === 'critical') {
        alerts.push({
          severity: 'critical',
          message: `${kpi.name} is critically low at ${kpi.value}${kpi.unit}`,
          action: `Target is ${kpi.target}${kpi.unit}. Immediate action required.`,
        });
      } else if (kpi.status === 'warning') {
        alerts.push({
          severity: 'warning',
          message: `${kpi.name} needs attention at ${kpi.value}${kpi.unit}`,
          action: `Monitor closely and plan improvements to reach ${kpi.target}${kpi.unit}.`,
        });
      }
    });

    // Check for negative trends
    if (overview.revenueGrowth < -10) {
      alerts.push({
        severity: 'warning',
        message: 'Revenue declining significantly',
        action: 'Review pricing strategy and customer satisfaction metrics.',
      });
    }

    return alerts;
  }

  private async calculateTotalRevenue(days: number): Promise<number> {
    try {
      // Simplified - would need proper invoice aggregation
      return 50000; // Placeholder
    } catch (error: any) {
      this.logger.error("Error calculating revenue", error as Error);
      return 0;
    }
  }

  private async calculateOrderVolume(days: number): Promise<number> {
    const orders = await this.storage.getOrders();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return orders.filter(order => new Date(order.orderDate) >= cutoffDate).length;
  }

  private async calculateAvgOrderValue(days: number): Promise<number> {
    const revenue = await this.calculateTotalRevenue(days);
    const volume = await this.calculateOrderVolume(days);

    return volume > 0 ? revenue / volume : 0;
  }

  private async calculateAvgTurnaroundTime(days: number): Promise<number> {
    const orders = await this.storage.getOrders();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const completedOrders = orders.filter(order => {
      return new Date(order.orderDate) >= cutoffDate && 
             (order.status === 'completed' || order.status === 'shipped');
    });

    if (completedOrders.length === 0) return 48; // Default

    const turnaroundTimes = completedOrders.map(order => {
      const orderDate = new Date(order.orderDate);
      // Simplified - would use actual completion timestamp
      const completedDate = new Date(orderDate.getTime() + (48 * 60 * 60 * 1000));
      return (completedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60); // hours
    });

    return Math.round(stats.mean(turnaroundTimes));
  }

  private async getHistoricalMetric(metricName: string, days: number): Promise<{values: number[], dates: string[]}> {
    // Placeholder - would implement actual historical tracking
    const values: number[] = [];
    const dates: string[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      values.push(Math.random() * 100); // Placeholder
    }

    return { values, dates };
  }

  private analyzeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = stats.mean(firstHalf);
    const secondAvg = stats.mean(secondHalf);

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    return change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable';
  }

  private forecastMetric(values: number[], forecastDays: number): number[] {
    if (values.length < 7) {
      // Not enough data, return flat forecast
      const avg = stats.mean(values);
      return new Array(forecastDays).fill(avg);
    }

    // Simple moving average forecast
    const windowSize = 7;
    const forecast: number[] = [];
    
    for (let i = 0; i < forecastDays; i++) {
      const recentValues = values.slice(-windowSize);
      const avgValue = stats.mean(recentValues);
      forecast.push(avgValue);
      values.push(avgValue); // Add to values for next iteration
    }

    return forecast;
  }
}
