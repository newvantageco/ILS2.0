/**
 * Churn Prediction Service
 * 
 * ML-based service that predicts customer churn risk based on:
 * - Usage patterns (declining feature usage, API calls)
 * - Engagement metrics (login frequency, support tickets)
 * - Financial signals (payment failures, plan downgrades)
 * - Health score trends
 * 
 * Recommended actions are automatically suggested for at-risk customers.
 */

import logger from '../../utils/logger';
import { storage } from '../../storage';

export interface ChurnRiskFactors {
  factor: string;
  weight: number; // 0-1
  trend: 'improving' | 'stable' | 'declining';
  impact: 'high' | 'medium' | 'low';
}

export interface ChurnPredictionResult {
  companyId: string;
  churnProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedChurnDate: Date | null;
  topRiskFactors: ChurnRiskFactors[];
  recommendedActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: 'high' | 'medium' | 'low';
  }[];
  confidence: number; // 0-100
  lastAnalyzedAt: Date;
}

export class ChurnPredictionService {
  /**
   * Analyze usage trends to detect disengagement
   */
  static async analyzeUsageTrends(
    companyId: string,
    daysBack: number = 90
  ): Promise<{
    featureUsageDecline: number; // % decline
    activeUserDecline: number;
    apiCallDecline: number;
    trend: 'improving' | 'stable' | 'declining';
  }> {
    logger.info(`[Churn] Analyzing usage trends for company: ${companyId}, last ${daysBack} days`);

    // TODO: Query usage_events table
    // Compare current 30 days vs previous 30 days
    // Calculate decline percentages

    const featureUsageDecline = 0; // % change from previous period
    const activeUserDecline = 0;
    const apiCallDecline = 0;

    const trend =
      featureUsageDecline < -10 || activeUserDecline < -10 ? 'declining'
      : featureUsageDecline > 10 && activeUserDecline > 10 ? 'improving'
      : 'stable';

    return {
      featureUsageDecline,
      activeUserDecline,
      apiCallDecline,
      trend,
    };
  }

  /**
   * Analyze engagement metrics
   */
  static async analyzeEngagement(companyId: string): Promise<{
    dayssinceLastLogin: number;
    avgDailyActiveUsers: number;
    supportTicketsIncrease: number; // % increase can indicate frustration
    featureAdoptionRate: number; // % of available features being used
  }> {
    logger.info(`[Churn] Analyzing engagement for company: ${companyId}`);

    // TODO: Query sessions, feature_usage_metrics, support tickets
    // Calculate engagement indicators

    return {
      dayssinceLastLogin: 0,
      avgDailyActiveUsers: 0,
      supportTicketsIncrease: 0,
      featureAdoptionRate: 0,
    };
  }

  /**
   * Analyze financial warning signs
   */
  static async analyzeFinancialSignals(companyId: string): Promise<{
    failedPayments: number;
    daysOverdue: number;
    planDowngradeRecent: boolean;
    pricingTierDecline: number; // How many tiers down
  }> {
    logger.info(`[Churn] Analyzing financial signals for company: ${companyId}`);

    // TODO: Query subscription history, payment intents
    // Look for payment failures, downgrades

    return {
      failedPayments: 0,
      daysOverdue: 0,
      planDowngradeRecent: false,
      pricingTierDecline: 0,
    };
  }

  /**
   * Calculate composite churn risk score
   * Uses weighted combination of multiple signals
   */
  static async calculateChurnRisk(companyId: string): Promise<ChurnPredictionResult> {
    logger.info(`[Churn] Calculating churn risk for company: ${companyId}`);

    const [usageTrends, engagement, financialSignals] = await Promise.all([
      this.analyzeUsageTrends(companyId),
      this.analyzeEngagement(companyId),
      this.analyzeFinancialSignals(companyId),
    ]);

    const riskFactors: ChurnRiskFactors[] = [];
    let totalRiskScore = 0;
    const maxScore = 100;

    // Usage decline factor (weight: 30%)
    if (usageTrends.featureUsageDecline < -20) {
      const riskScore = 30;
      totalRiskScore += riskScore;
      riskFactors.push({
        factor: 'High feature usage decline',
        weight: 0.3,
        trend: usageTrends.trend,
        impact: 'high',
      });
    }

    // Engagement factor (weight: 25%)
    if (engagement.dayssinceLastLogin > 14) {
      const riskScore = 25;
      totalRiskScore += riskScore;
      riskFactors.push({
        factor: 'Low platform engagement',
        weight: 0.25,
        trend: 'declining',
        impact: 'high',
      });
    }

    // Financial problems (weight: 30%)
    if (financialSignals.failedPayments > 0 || financialSignals.daysOverdue > 0) {
      const riskScore = 30;
      totalRiskScore += riskScore;
      riskFactors.push({
        factor: 'Payment issues detected',
        weight: 0.3,
        trend: 'declining',
        impact: 'high',
      });
    }

    // Recent downgrade (weight: 15%)
    if (financialSignals.planDowngradeRecent) {
      const riskScore = 15;
      totalRiskScore += riskScore;
      riskFactors.push({
        factor: 'Recent plan downgrade',
        weight: 0.15,
        trend: 'declining',
        impact: 'medium',
      });
    }

    // Low feature adoption (weight: 15%)
    if (engagement.featureAdoptionRate < 0.3) {
      const riskScore = 15;
      totalRiskScore += riskScore;
      riskFactors.push({
        factor: 'Low feature adoption rate',
        weight: 0.15,
        trend: 'declining',
        impact: 'medium',
      });
    }

    // Normalize to 0-1 probability
    const churnProbability = Math.min(totalRiskScore / maxScore, 1);
    
    const riskLevel =
      churnProbability > 0.7 ? 'critical'
      : churnProbability > 0.5 ? 'high'
      : churnProbability > 0.3 ? 'medium'
      : 'low';

    // Calculate predicted churn date if risk is high
    let predictedChurnDate: Date | null = null;
    if (riskLevel === 'critical') {
      // Critical churn risk: typically happens within 30 days
      predictedChurnDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (riskLevel === 'high') {
      // High risk: within 60 days
      predictedChurnDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    }

    // Generate recommended actions
    const recommendedActions = this.generateRetentionActions(
      churnProbability,
      riskFactors,
      engagement,
      financialSignals
    );

    const confidence = Math.min(
      50 + riskFactors.length * 10, // More factors = higher confidence
      95 // Cap at 95%
    );

    const result: ChurnPredictionResult = {
      companyId,
      churnProbability,
      riskLevel,
      predictedChurnDate,
      topRiskFactors: riskFactors.slice(0, 5),
      recommendedActions,
      confidence,
      lastAnalyzedAt: new Date(),
    };

    // Store the prediction
    await storage.upsertChurnPrediction(companyId, {
      churnProbability: churnProbability.toString(),
      riskFactors,
      recommendedActions,
      modelVersion: '1.0',
      predictionScore: confidence,
      predictedChurnDate,
    });

    return result;
  }

  /**
   * Generate targeted retention actions based on risk profile
   */
  private static generateRetentionActions(
    churnProbability: number,
    riskFactors: ChurnRiskFactors[],
    engagement: Awaited<ReturnType<typeof this.analyzeEngagement>>,
    financialSignals: Awaited<ReturnType<typeof this.analyzeFinancialSignals>>
  ): ChurnPredictionResult['recommendedActions'] {
    const actions: ChurnPredictionResult['recommendedActions'] = [];

    // Low engagement - re-engagement campaign
    if (engagement.dayssinceLastLogin > 14) {
      actions.push({
        action: 'send_reengagement_email',
        priority: 'high',
        description: 'Send targeted re-engagement email with success stories and feature updates',
        expectedImpact: 'high',
      });

      actions.push({
        action: 'schedule_customer_check_in',
        priority: 'high',
        description: 'Schedule call with customer success team to understand pain points',
        expectedImpact: 'high',
      });
    }

    // Low feature adoption
    if (engagement.featureAdoptionRate < 0.3) {
      actions.push({
        action: 'send_feature_training',
        priority: 'medium',
        description: 'Send personalized feature training or webinar invitation',
        expectedImpact: 'medium',
      });

      actions.push({
        action: 'provide_onboarding_refresh',
        priority: 'medium',
        description: 'Offer refresher onboarding session with focus on unused features',
        expectedImpact: 'medium',
      });
    }

    // Payment issues
    if (financialSignals.failedPayments > 0) {
      actions.push({
        action: 'resolve_payment_issue',
        priority: 'high',
        description: 'Contact customer about payment failure and offer payment troubleshooting',
        expectedImpact: 'high',
      });

      actions.push({
        action: 'offer_flexible_payment',
        priority: 'medium',
        description: 'Offer flexible payment plan or payment method alternatives',
        expectedImpact: 'medium',
      });
    }

    // Recent downgrade - expansion opportunity
    if (financialSignals.planDowngradeRecent) {
      actions.push({
        action: 'conduct_satisfaction_survey',
        priority: 'high',
        description: 'Send survey to understand downgrade reasons',
        expectedImpact: 'medium',
      });

      actions.push({
        action: 'offer_upgrade_incentive',
        priority: 'medium',
        description: 'Offer discount or trial of upgraded features',
        expectedImpact: 'medium',
      });
    }

    // Critical churn risk - executive intervention
    if (churnProbability > 0.7) {
      actions.push({
        action: 'executive_outreach',
        priority: 'high',
        description: 'Have executive team reach out to customer',
        expectedImpact: 'high',
      });

      actions.push({
        action: 'offer_premium_support',
        priority: 'high',
        description: 'Offer complimentary premium support or success planning session',
        expectedImpact: 'high',
      });
    }

    return actions;
  }

  /**
   * Batch analyze churn risk for all companies
   */
  static async batchAnalyzeChurnRisk(companyIds: string[]): Promise<Map<string, ChurnPredictionResult>> {
    logger.info(`[Churn] Batch analyzing churn risk for ${companyIds.length} companies`);

    const results = new Map<string, ChurnPredictionResult>();

    for (const companyId of companyIds) {
      try {
        const prediction = await this.calculateChurnRisk(companyId);
        results.set(companyId, prediction);
      } catch (error) {
        logger.error(`[Churn] Error analyzing churn for company ${companyId}: ${String(error)}`);
      }
    }

    return results;
  }

  /**
   * Generate churn report
   */
  static async generateChurnReport(): Promise<{
    totalCompanies: number;
    criticalRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    avgChurnProbability: number;
    topRiskCompanies: { companyId: string; probability: number }[];
    recommendedActions: string[];
  }> {
    logger.info('[Churn] Generating churn report for all companies');

    // TODO: Query all companies and analyze churn risk
    // Group by risk level
    // Identify top recommendations

    return {
      totalCompanies: 0,
      criticalRisk: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      avgChurnProbability: 0,
      topRiskCompanies: [],
      recommendedActions: [],
    };
  }
}

export default ChurnPredictionService;
