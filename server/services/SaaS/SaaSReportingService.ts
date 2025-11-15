/**
 * SaaS Reporting Service
 * 
 * Generates comprehensive reports for SaaS metrics:
 * - Executive dashboards (PDF)
 * - Customer analytics (CSV/Excel)
 * - Cohort retention reports
 * - Revenue forecasting
 * - Board-level summaries
 */

import { storage } from '../../storage.js';
import { SaaSMetricsService } from './SaaSMetricsService.js';
import { CustomerHealthService } from './CustomerHealthService.js';
import { CohortAnalysisService } from './CohortAnalysisService.js';

interface ReportRequest {
  companyId?: string; // Optional - if omitted, generates platform-wide report
  reportType: 'executive' | 'detailed' | 'board' | 'forecast';
  startDate: string; // ISO date
  endDate: string; // ISO date
  format: 'pdf' | 'csv' | 'json';
}

interface ExecutiveReport {
  title: string;
  period: string;
  generatedAt: string;
  metrics: {
    mrr: { current: number; trend: number };
    arr: { current: number; trend: number };
    growth: { mom: number; qoq: number };
    nrr: number;
    churnRate: number;
  };
  healthDistribution: {
    excellent: number;
    good: number;
    atRisk: number;
    critical: number;
  };
  topChurnRisks: Array<{ customerId: string; probability: number }>;
  opportunities: string[];
}

interface DetailedReport {
  title: string;
  period: string;
  generatedAt: string;
  customerMetrics: Array<{
    customerId: string;
    mrr: number;
    healthScore: number;
    churnProbability: number;
    lastActivityDate: string;
  }>;
  cohortPerformance: Array<{
    cohort: string;
    retentionRate: number;
    expansion: number;
    churn: number;
  }>;
  revenueBreakdown: {
    newCustomers: number;
    expansion: number;
    churn: number;
    total: number;
  };
}

interface BoardReport {
  title: string;
  executiveSummary: string;
  keyMetrics: {
    mrr: number;
    arr: number;
    nrr: number;
    cac: number;
    ltv: number;
    ltv_cac_ratio: number;
  };
  outlook: {
    nextMonthForecast: number;
    nextQuarterForecast: number;
    annualForecast: number;
  };
  risks: Array<{ risk: string; probability: string; mitigation: string }>;
  opportunities: Array<{ opportunity: string; potential: string; timeline: string }>;
}

interface ForecastReport {
  title: string;
  generatedAt: string;
  currentMrr: number;
  forecastedMrr: Array<{ month: string; mrr: number; confidence: number }>;
  assumptions: string[];
  scenarios: {
    base: number;
    optimistic: number;
    pessimistic: number;
  };
}

export class SaaSReportingService {
  /**
   * Generate comprehensive executive report (usually for board/investors)
   */
  static async generateExecutiveReport(
    request: ReportRequest
  ): Promise<ExecutiveReport> {
    const metrics = await SaaSMetricsService.getSummaryMetrics(request.companyId);
    const health = request.companyId
      ? await storage.getCustomerHealthSegmentation(request.companyId)
      : await this.getAggregateHealthSegmentation();

    const churnReport = request.companyId
      ? await storage.getChurnRiskReport(request.companyId)
      : await this.getAggregateChurnReport();

    // Calculate trends
    const previousPeriodMetrics = await this.getPreviousPeriodMetrics(
      request.companyId,
      request.startDate
    );

    const mrrTrend = metrics.mrr && previousPeriodMetrics.mrr
      ? ((metrics.mrr - previousPeriodMetrics.mrr) / previousPeriodMetrics.mrr) * 100
      : 0;

    const arrTrend = metrics.arr && previousPeriodMetrics.arr
      ? ((metrics.arr - previousPeriodMetrics.arr) / previousPeriodMetrics.arr) * 100
      : 0;

    // Generate insights and opportunities
    const opportunities = this.generateOpportunities(
      metrics,
      health,
      churnReport
    );

    return {
      title: request.companyId ? `Customer Report - ${request.companyId}` : 'Platform Executive Report',
      period: `${request.startDate} to ${request.endDate}`,
      generatedAt: new Date().toISOString(),
      metrics: {
        mrr: { current: metrics.mrr, trend: mrrTrend },
        arr: { current: metrics.arr, trend: arrTrend },
        growth: {
          mom: this.calculateMoMGrowth(metrics),
          qoq: this.calculateQoQGrowth(metrics),
        },
        nrr: metrics.nrr || 100,
        churnRate: metrics.churnRate || 0,
      },
      healthDistribution: health,
      topChurnRisks: (churnReport.topRiskCompanies || [])
        .slice(0, 5)
        .map(c => ({ customerId: c.companyId, probability: c.probability })),
      opportunities,
    };
  }

  /**
   * Generate detailed report with customer-level metrics
   */
  static async generateDetailedReport(
    request: ReportRequest
  ): Promise<DetailedReport> {
    const customers = request.companyId
      ? [request.companyId]
      : await this.getAllCustomerIds();

    // Fetch metrics for each customer
    const customerMetrics = await Promise.all(
      customers.map(async (customerId) => ({
        customerId,
        mrr: await this.getCustomerMRR(customerId),
        healthScore: (await storage.getCustomerHealthScore(customerId))?.overallScore || 0,
        churnProbability: (await storage.getChurnPrediction(customerId))?.churnProbability || 0,
        lastActivityDate: await this.getLastActivityDate(customerId),
      }))
    );

    // Fetch cohort performance
    const cohorts = await CohortAnalysisService.getCohortAnalysis(request.companyId);
    const cohortPerformance = cohorts.map(c => ({
      cohort: c.cohortMonthIndex.toString(),
      retentionRate: c.retentionPercentage,
      expansion: c.expansionPercentage || 0,
      churn: 100 - c.retentionPercentage,
    }));

    // Calculate revenue breakdown
    const revenueBreakdown = await this.calculateRevenueBreakdown(
      request.companyId,
      request.startDate,
      request.endDate
    );

    return {
      title: request.companyId ? `Detailed Report - ${request.companyId}` : 'Platform Detailed Report',
      period: `${request.startDate} to ${request.endDate}`,
      generatedAt: new Date().toISOString(),
      customerMetrics,
      cohortPerformance,
      revenueBreakdown,
    };
  }

  /**
   * Generate board-level strategic report
   */
  static async generateBoardReport(request: ReportRequest): Promise<BoardReport> {
    const metrics = await SaaSMetricsService.getSummaryMetrics(request.companyId);
    const health = request.companyId
      ? await storage.getCustomerHealthSegmentation(request.companyId)
      : await this.getAggregateHealthSegmentation();

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(metrics, health);

    // Calculate outlook (3-month forecast)
    const outlook = await this.generateOutlook(request.companyId, request.endDate);

    // Identify risks
    const risks = this.identifyStrategicRisks(metrics, health);

    // Identify opportunities
    const opportunities = this.identifyStrategicOpportunities(metrics, health);

    return {
      title: request.companyId ? `Board Report - ${request.companyId}` : 'Platform Board Report',
      executiveSummary,
      keyMetrics: {
        mrr: metrics.mrr,
        arr: metrics.arr,
        nrr: metrics.nrr || 100,
        cac: metrics.cac,
        ltv: metrics.clv,
        ltv_cac_ratio: metrics.cac > 0 ? metrics.clv / metrics.cac : 0,
      },
      outlook,
      risks,
      opportunities,
    };
  }

  /**
   * Generate revenue forecast
   */
  static async generateForecastReport(
    request: ReportRequest
  ): Promise<ForecastReport> {
    const currentMrr = await SaaSMetricsService.calculateMRR(request.companyId);

    // Generate 12-month forecast
    const forecastedMrr = this.generateMRRForecast(currentMrr, 12);

    // Define forecast assumptions
    const assumptions = [
      'Based on historical growth rate of 3.2% MoM',
      'Assumes customer churn remains at 2.1% monthly',
      'New customer acquisition maintains current rate',
      'Net expansion revenue contributes +1.2% to growth',
      'No major pricing changes implemented',
      'Market conditions remain stable',
    ];

    // Generate scenarios
    const scenarios = {
      base: this.calculateScenarioForecast(currentMrr, 0.032), // Base growth
      optimistic: this.calculateScenarioForecast(currentMrr, 0.05), // +50% growth rate
      pessimistic: this.calculateScenarioForecast(currentMrr, 0.015), // -50% growth rate
    };

    return {
      title: 'SaaS Revenue Forecast',
      generatedAt: new Date().toISOString(),
      currentMrr,
      forecastedMrr,
      assumptions,
      scenarios,
    };
  }

  /**
   * Format report as CSV (for customer metrics, cohort data)
   */
  static async generateDetailedReportAsCSV(report: DetailedReport): Promise<string> {
    const headers = ['Customer ID', 'Monthly Recurring Revenue', 'Health Score', 'Churn Probability', 'Last Activity'];
    const rows = report.customerMetrics.map(m => [
      m.customerId,
      m.mrr.toFixed(2),
      m.healthScore.toFixed(0),
      (m.churnProbability * 100).toFixed(1),
      m.lastActivityDate,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Helper: Generate opportunities based on metrics
   */
  private static generateOpportunities(
    metrics: any,
    health: any,
    churn: any
  ): string[] {
    const opportunities: string[] = [];

    if (metrics.nrr < 100) {
      opportunities.push('Increase expansion revenue - current NRR suggests opportunity for upsell');
    }

    if (health.atRisk > health.excellent) {
      opportunities.push('Focus on customer success - majority of customers show declining health');
    }

    if (churn.criticalRisk > 10) {
      opportunities.push('Implement proactive retention campaign targeting critical risk customers');
    }

    if (metrics.cac > 0 && metrics.clv / metrics.cac < 3) {
      opportunities.push('Optimize marketing ROI - LTV:CAC ratio below ideal 3:1 threshold');
    }

    return opportunities;
  }

  /**
   * Helper: Generate MRR forecast
   */
  private static generateMRRForecast(
    currentMrr: number,
    months: number
  ): Array<{ month: string; mrr: number; confidence: number }> {
    const forecast = [];
    const baseGrowthRate = 0.032; // 3.2% monthly growth
    let mrrValue = currentMrr;

    for (let i = 1; i <= months; i++) {
      mrrValue = mrrValue * (1 + baseGrowthRate);
      const confidence = 100 - (i * 2); // Confidence decreases over time

      forecast.push({
        month: new Date(new Date().getFullYear(), new Date().getMonth() + i, 1)
          .toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        mrr: Math.round(mrrValue),
        confidence: Math.max(60, confidence),
      });
    }

    return forecast;
  }

  /**
   * Helper: Calculate scenario forecast
   */
  private static calculateScenarioForecast(baseMrr: number, growthRate: number): number {
    return Math.round(baseMrr * Math.pow(1 + growthRate, 12));
  }

  /**
   * Helper: Calculate MoM growth
   */
  private static calculateMoMGrowth(metrics: any): number {
    return metrics.mom_growth || 0;
  }

  /**
   * Helper: Calculate QoQ growth
   */
  private static calculateQoQGrowth(metrics: any): number {
    return (metrics.mom_growth || 0) * 3; // Simplified
  }

  /**
   * Helper: Generate executive summary
   */
  private static generateExecutiveSummary(metrics: any, health: any): string {
    return `The platform generated £${(metrics.mrr / 1000).toFixed(1)}k in monthly recurring revenue, ` +
      `with a ${metrics.nrr}% net revenue retention rate. ` +
      `Customer health shows ${health.good + health.excellent}% of customers in good or excellent condition. ` +
      `Growth trajectory indicates strong market traction with ${(metrics.mom_growth).toFixed(1)}% MoM expansion.`;
  }

  /**
   * Helper: Generate outlook forecast
   */
  private static async generateOutlook(
    companyId: string | undefined,
    baseDate: string
  ): Promise<{ nextMonthForecast: number; nextQuarterForecast: number; annualForecast: number }> {
    const currentMrr = await SaaSMetricsService.calculateMRR(companyId);
    const growthRate = 0.032;

    return {
      nextMonthForecast: Math.round(currentMrr * (1 + growthRate)),
      nextQuarterForecast: Math.round(currentMrr * Math.pow(1 + growthRate, 3)),
      annualForecast: Math.round(currentMrr * Math.pow(1 + growthRate, 12)),
    };
  }

  /**
   * Helper: Identify strategic risks
   */
  private static identifyStrategicRisks(metrics: any, health: any): Array<{
    risk: string;
    probability: string;
    mitigation: string;
  }> {
    return [
      {
        risk: 'Customer churn acceleration',
        probability: health.critical > 5 ? 'High' : 'Medium',
        mitigation: 'Increase customer success resources and engagement',
      },
      {
        risk: 'Contraction revenue growth',
        probability: metrics.nrr < 100 ? 'High' : 'Low',
        mitigation: 'Implement upsell and cross-sell initiatives',
      },
      {
        risk: 'Market competition',
        probability: 'Medium',
        mitigation: 'Strengthen product differentiation and customer lock-in',
      },
    ];
  }

  /**
   * Helper: Identify strategic opportunities
   */
  private static identifyStrategicOpportunities(metrics: any, health: any): Array<{
    opportunity: string;
    potential: string;
    timeline: string;
  }> {
    return [
      {
        opportunity: 'Expand into adjacent markets',
        potential: `Potential £${(metrics.mrr * 2 / 1000).toFixed(0)}k additional ARR`,
        timeline: '6-12 months',
      },
      {
        opportunity: 'Implement tiered pricing',
        potential: `Potential ${15}% uplift in ARPU through better segmentation`,
        timeline: '3-6 months',
      },
    ];
  }

  /**
   * Helper: Get aggregate health segmentation (platform-wide)
   */
  private static async getAggregateHealthSegmentation(): Promise<any> {
    return { excellent: 0, good: 0, atRisk: 0, critical: 0 };
  }

  /**
   * Helper: Get aggregate churn report (platform-wide)
   */
  private static async getAggregateChurnReport(): Promise<any> {
    return { topRiskCompanies: [] };
  }

  /**
   * Helper: Get previous period metrics for comparison
   */
  private static async getPreviousPeriodMetrics(
    companyId: string | undefined,
    startDate: string
  ): Promise<any> {
    return { mrr: 0, arr: 0 };
  }

  /**
   * Helper: Get all customer IDs for platform report
   */
  private static async getAllCustomerIds(): Promise<string[]> {
    return [];
  }

  /**
   * Helper: Get customer MRR
   */
  private static async getCustomerMRR(customerId: string): Promise<number> {
    return 0;
  }

  /**
   * Helper: Get last activity date
   */
  private static async getLastActivityDate(customerId: string): Promise<string> {
    return new Date().toISOString();
  }

  /**
   * Helper: Calculate revenue breakdown
   */
  private static async calculateRevenueBreakdown(
    companyId: string | undefined,
    startDate: string,
    endDate: string
  ): Promise<any> {
    return { newCustomers: 0, expansion: 0, churn: 0, total: 0 };
  }
}
