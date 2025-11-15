/**
 * SaaS Metrics Service
 * 
 * Tracks core SaaS KPIs:
 * - MRR: Monthly Recurring Revenue
 * - ARR: Annual Recurring Revenue
 * - CAC: Customer Acquisition Cost
 * - CLV: Customer Lifetime Value
 * - Churn Rate: % of customers lost monthly
 * - LTV:CAC Ratio: Revenue quality metric (should be 3:1+)
 * - NRR: Net Revenue Retention (growth metric)
 * 
 * These are critical for SaaS business health monitoring.
 */

import logger from '../../utils/logger';
import { storage } from '../../storage';

export interface MRRData {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  breakdown: {
    [tier: string]: {
      subscriptions: number;
      mrr: number;
    };
  };
  mom_growth: number; // Month-over-month growth %
  timestamp: Date;
}

export interface CACData {
  totalSpent: number;
  period: 'month' | 'quarter' | 'year';
  newCustomers: number;
  cac: number; // CAC per customer
  timestamp: Date;
}

export interface CLVData {
  avgLifetimeValue: number;
  avgMonthlyChurn: number;
  avgMonthlyRevenue: number;
  customerSegments: {
    [segment: string]: {
      clv: number;
      customers: number;
      avgRetention: number;
    };
  };
  timestamp: Date;
}

export interface ChurnData {
  monthlyChurnRate: number; // % of customers churned
  quarterlyChurnRate: number;
  annualChurnRate: number;
  churned: number;
  retained: number;
  churnedByReason: {
    [reason: string]: number;
  };
  timestamp: Date;
}

export interface NRRData {
  nrr: number; // >100% = growth, <100% = contraction
  breakdown: {
    startingMRR: number;
    expansion: number; // Upsells
    contraction: number; // Downgrades
    churn: number; // Lost revenue
    endingMRR: number;
  };
  timestamp: Date;
}

export interface SaaSMetricsSummary {
  mrr: MRRData;
  arr: { arr: number; timestamp: Date };
  cac: CACData;
  clv: CLVData;
  churn: ChurnData;
  nrr: NRRData;
  health: {
    ltvToCacRatio: number; // Should be >=3
    cumulativeGrossMargin: number;
    paybackPeriod: number; // months
    magic_number: number; // (MRR - previous MRR) / sales & marketing spend
  };
  generated_at: Date;
}

export class SaaSMetricsService {
  /**
   * Calculate Monthly Recurring Revenue
   */
  static async calculateMRR(companyId: string): Promise<MRRData> {
    logger.info(`[SaaS] Calculating MRR for company: ${companyId}`);

    // Query active subscriptions from storage
    const subscriptions = await storage.getCompanySubscriptions(companyId);
    
    // Calculate MRR by summing up active monthly subscriptions
    let mrr = 0;
    const breakdown: { [tier: string]: { subscriptions: number; mrr: number } } = {};
    
    for (const sub of subscriptions) {
      const tier = (sub as any).plan || 'standard';
      const monthlyAmount = (sub as any).monthlyAmount || (sub as any).price || 0;
      
      if (!breakdown[tier]) {
        breakdown[tier] = { subscriptions: 0, mrr: 0 };
      }
      breakdown[tier].subscriptions++;
      breakdown[tier].mrr += monthlyAmount;
      mrr += monthlyAmount;
    }

    // Get previous month's MRR for MoM growth
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMrrData = await storage.getMonthlyRecurringRevenue(
      companyId,
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1
    );
    
    const previousMRR = previousMrrData ? Number(previousMrrData.totalMRR) : mrr;
    const mom_growth = previousMRR > 0 ? ((mrr - previousMRR) / previousMRR) * 100 : 0;

    // Store the calculated MRR for trending
    await storage.upsertMonthlyRecurringRevenue(companyId, {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      totalMRR: mrr,
      arr: mrr * 12,
      breakdown,
      newMRR: Math.max(0, mrr - previousMRR),
      momGrowth: mom_growth,
    });

    return {
      mrr,
      arr: mrr * 12,
      activeSubscriptions: subscriptions.length,
      breakdown,
      mom_growth,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate Customer Acquisition Cost
   * Formula: Total Marketing & Sales Spend / New Customers Acquired
   */
  static async calculateCAC(
    companyId: string,
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<CACData> {
    logger.info(`[SaaS] Calculating CAC for company: ${companyId}, period: ${period}`);

    // Get acquisition source data
    const sources = await storage.getCustomerAcquisitionSources(companyId);
    
    // Calculate totals for the period
    let totalSpent = 0;
    let newCustomers = 0;
    
    for (const source of sources) {
      const sourceData = source as any;
      if (sourceData.period === period) {
        totalSpent += sourceData.totalCost || 0;
        newCustomers += sourceData.customersAcquired || 0;
      }
    }
    
    const cac = newCustomers > 0 ? totalSpent / newCustomers : 0;

    return {
      totalSpent,
      period,
      newCustomers,
      cac,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate Customer Lifetime Value
   * Formula: (ARPU × Gross Margin) / Monthly Churn Rate
   * Where ARPU = Average Revenue Per User
   */
  static async calculateCLV(companyId: string): Promise<CLVData> {
    logger.info(`[SaaS] Calculating CLV for company: ${companyId}`);

    // Get MRR data to calculate ARPU
    const mrrData = await this.calculateMRR(companyId);
    const subscriptions = await storage.getCompanySubscriptions(companyId);
    
    const arpu = subscriptions.length > 0
      ? mrrData.mrr / subscriptions.length
      : 0;
    
    // Gross margin for SaaS typically 70-80%
    const grossMargin = 0.75;
    
    // Get churn data
    const churnData = await this.calculateChurn(companyId);
    const monthlyChurnRate = churnData.monthlyChurnRate / 100; // Convert to decimal
    
    const avgLifetimeValue = monthlyChurnRate > 0
      ? (arpu * grossMargin) / monthlyChurnRate
      : 0;

    const customerSegments: {
      [segment: string]: {
        clv: number;
        customers: number;
        avgRetention: number;
      };
    } = {};

    // Break down by tier if available
    for (const [tier, tierData] of Object.entries(mrrData.breakdown || {})) {
      const tierInfo = tierData as any;
      const tierCLV = arpu > 0 ? (tierInfo.mrr / tierInfo.subscriptions * grossMargin) / (monthlyChurnRate || 0.05) : 0;
      customerSegments[tier] = {
        clv: tierCLV,
        customers: tierInfo.subscriptions,
        avgRetention: monthlyChurnRate > 0 ? 1 - monthlyChurnRate : 0.95,
      };
    }

    return {
      avgLifetimeValue,
      avgMonthlyChurn: monthlyChurnRate,
      avgMonthlyRevenue: arpu,
      customerSegments,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate Monthly Churn Rate
   * Formula: (Lost Customers / Starting Customers) × 100
   */
  static async calculateChurn(companyId: string): Promise<ChurnData> {
    logger.info(`[SaaS] Calculating Churn for company: ${companyId}`);

    // Query subscription events for the month
    // Look for status changes to 'cancelled' or 'expired'
    const subscriptions = await storage.getCompanySubscriptions(companyId);
    
    // Count active vs churned (simplified - in production would track status changes)
    const active = subscriptions.filter((s: any) => s.status === 'active' || !s.status).length;
    const churned = subscriptions.filter((s: any) => s.status === 'cancelled' || s.status === 'expired').length;
    const retained = active;
    const total = active + churned;

    const monthlyChurnRate = total > 0 ? (churned / total) * 100 : 0;
    const quarterlyChurnRate = monthlyChurnRate * 3; // Simplified
    const annualChurnRate = monthlyChurnRate * 12; // Simplified

    const churnedByReason: { [reason: string]: number } = {
      'too_expensive': 0,
      'not_using': 0,
      'switched_competitor': 0,
      'other': 0,
    };

    return {
      monthlyChurnRate,
      quarterlyChurnRate,
      annualChurnRate,
      churned,
      retained,
      churnedByReason,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate Net Revenue Retention
   * Shows how much revenue you're retaining, accounting for expansion, contraction, churn
   * Formula: (Starting MRR + Expansion - Contraction - Churn) / Starting MRR × 100
   * >100% = net growth (good), <100% = contraction (bad)
   */
  static async calculateNRR(companyId: string): Promise<NRRData> {
    logger.info(`[SaaS] Calculating NRR for company: ${companyId}`);

    // Get MRR data
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Get starting MRR (last month)
    const lastMonthData = await storage.getMonthlyRecurringRevenue(
      companyId,
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1
    );
    const startingMRR = lastMonthData ? Number(lastMonthData.totalMRR) : 0;
    
    // Get current MRR with breakdown
    const currentMrrData = await this.calculateMRR(companyId);
    const expansion = lastMonthData ? Number(lastMonthData.expansionMRR) : 0;
    const contraction = lastMonthData ? Number(lastMonthData.contractionMRR) : 0;
    const churnMRR = lastMonthData ? Number(lastMonthData.churnMRR) : 0;
    
    const endingMRR = currentMrrData.mrr;
    const nrr = startingMRR > 0 ? (endingMRR / startingMRR) * 100 : 100;

    return {
      nrr,
      breakdown: {
        startingMRR,
        expansion,
        contraction,
        churn: churnMRR,
        endingMRR,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get comprehensive SaaS health summary
   */
  static async getComprehensiveSaaSMetrics(companyId: string): Promise<SaaSMetricsSummary> {
    logger.info(`[SaaS] Getting comprehensive SaaS metrics for company: ${companyId}`);

    const [mrr, cac, clv, churn, nrr] = await Promise.all([
      this.calculateMRR(companyId),
      this.calculateCAC(companyId, 'month'),
      this.calculateCLV(companyId),
      this.calculateChurn(companyId),
      this.calculateNRR(companyId),
    ]);

    // LTV:CAC Ratio should be >= 3:1 for healthy SaaS
    const ltvToCacRatio = cac.cac > 0 ? clv.avgLifetimeValue / cac.cac : 0;

    // Cumulative Gross Margin (typically 70-80% for SaaS)
    // Would be calculated from actual costs
    const cumulativeGrossMargin = 0.75;

    // Payback Period: How long to recover CAC? (CAC / Monthly Profit)
    // Ideally <12 months
    const monthlyProfit = (mrr.mrr * cumulativeGrossMargin) - (cac.totalSpent / (30 * 24));
    const paybackPeriod = monthlyProfit > 0 ? cac.cac / monthlyProfit : Infinity;

    // Magic Number: Month-over-month revenue growth relative to sales spend
    // Formula: (MRR_current - MRR_prev) / Sales&Marketing Spend
    // >0.75 is excellent, >0.5 is good, <0.25 is concerning
    const magicNumber = cac.totalSpent > 0
      ? (mrr.mom_growth / 100 * mrr.mrr) / cac.totalSpent
      : 0;

    return {
      mrr,
      arr: { arr: mrr.arr, timestamp: new Date() },
      cac,
      clv,
      churn,
      nrr,
      health: {
        ltvToCacRatio,
        cumulativeGrossMargin,
        paybackPeriod,
        magic_number: magicNumber,
      },
      generated_at: new Date(),
    };
  }

  /**
   * Get SaaS health status with recommendations
   */
  static async getSaaSHealthStatus(companyId: string): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  }> {
    const metrics = await this.getComprehensiveSaaSMetrics(companyId);
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check LTV:CAC ratio
    if (metrics.health.ltvToCacRatio < 1) {
      issues.push('LTV:CAC ratio < 1:1 - spending more to acquire than earning');
      recommendations.push('Reduce acquisition costs or improve customer retention');
      score -= 30;
    } else if (metrics.health.ltvToCacRatio < 3) {
      issues.push('LTV:CAC ratio < 3:1 - suboptimal unit economics');
      recommendations.push('Focus on retention improvements to increase CLV');
      score -= 15;
    }

    // Check churn rate
    if (metrics.churn.monthlyChurnRate > 10) {
      issues.push(`High monthly churn rate: ${metrics.churn.monthlyChurnRate.toFixed(2)}%`);
      recommendations.push('Investigate churn reasons and implement retention initiatives');
      score -= 25;
    } else if (metrics.churn.monthlyChurnRate > 5) {
      issues.push(`Elevated monthly churn: ${metrics.churn.monthlyChurnRate.toFixed(2)}%`);
      score -= 10;
    }

    // Check NRR
    if (metrics.nrr.nrr < 100) {
      issues.push(`NRR < 100% (${metrics.nrr.nrr.toFixed(1)}%) - losing revenue from existing customers`);
      recommendations.push('Implement upsell/expansion strategies for existing customers');
      score -= 20;
    }

    // Check payback period
    if (metrics.health.paybackPeriod > 12) {
      issues.push(`CAC payback period: ${metrics.health.paybackPeriod.toFixed(1)} months (>12 is concerning)`);
      recommendations.push('Improve gross margins or reduce acquisition costs');
      score -= 15;
    }

    // Check magic number
    if (metrics.health.magic_number < 0.25) {
      issues.push('Magic number < 0.25 - insufficient revenue growth vs. sales spending');
      recommendations.push('Optimize marketing spend or improve sales efficiency');
      score -= 10;
    }

    const status = score >= 70 ? 'healthy' : score >= 40 ? 'warning' : 'critical';

    return {
      status,
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations,
    };
  }
}

export default SaaSMetricsService;
