/**
 * Customer Health Scoring Service
 * 
 * Calculates composite health scores based on:
 * - Engagement (login frequency, active users)
 * - Adoption (feature usage, onboarding completion)
 * - Satisfaction (NPS, support ticket sentiment)
 * - Financial (payment history, growth trajectory)
 * - Technical (API errors, uptime impact)
 * 
 * Health scores guide support prioritization and identify expansion/churn risks.
 */

import logger from '../../utils/logger';
import { storage } from '../../storage';

export interface HealthScoreComponents {
  engagement: {
    score: number; // 0-100
    dayssinceLastLogin: number;
    dailyActiveUsers: number;
    sessionFrequency: number;
  };
  adoption: {
    score: number; // 0-100
    featureAdoptionRate: number; // %
    onboardingComplete: boolean;
    featuresUsed: number;
  };
  satisfaction: {
    score: number; // 0-100
    nps: number; // -100 to +100
    supportTickets: number;
    negativeTicketCount: number;
    resolutionTime: number; // hours
  };
  financial: {
    score: number; // 0-100
    paymentReliability: number; // %
    mrr: number; // £
    mrrGrowth: number; // % month-over-month
    arrCoverage: number; // months of expenses covered
  };
  technical: {
    score: number; // 0-100
    apiErrorRate: number; // %
    avgResponseTime: number; // ms
    uptime: number; // %
    criticalsIssues: number;
  };
}

export interface CustomerHealthScore {
  companyId: string;
  overallScore: number; // 0-100 weighted average
  scoreBreakdown: HealthScoreComponents;
  healthStatus: 'excellent' | 'good' | 'at_risk' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  scoreHistory: { date: Date; score: number }[];
  primaryConcerns: string[];
  recommendations: string[];
  lastCalculatedAt: Date;
}

export class CustomerHealthService {
  /**
   * Calculate engagement score
   */
  static async calculateEngagementScore(companyId: string): Promise<{
    score: number;
    dayssinceLastLogin: number;
    dailyActiveUsers: number;
    sessionFrequency: number;
  }> {
    logger.info(`[Health] Calculating engagement score for company: ${companyId}`);

    // TODO: Query sessions and login events
    let score = 100;
    const dayssinceLastLogin = 30;
    const dailyActiveUsers = 0;
    const sessionFrequency = 0;

    // Scoring logic
    // Days since login: >30 days = -50 points, >14 days = -25 points, >7 days = -10 points
    if (dayssinceLastLogin > 30) score -= 50;
    else if (dayssinceLastLogin > 14) score -= 25;
    else if (dayssinceLastLogin > 7) score -= 10;

    // Active users: If <10% of team is active = -30 points
    // If <50% of team is active = -15 points
    const expectedTeamSize = 10; // Default, would get from company data
    const activeUserRatio = dailyActiveUsers / expectedTeamSize;
    if (activeUserRatio < 0.1) score -= 30;
    else if (activeUserRatio < 0.5) score -= 15;

    return {
      score: Math.max(0, score),
      dayssinceLastLogin,
      dailyActiveUsers,
      sessionFrequency,
    };
  }

  /**
   * Calculate adoption score
   */
  static async calculateAdoptionScore(companyId: string): Promise<{
    score: number;
    featureAdoptionRate: number;
    onboardingComplete: boolean;
    featuresUsed: number;
  }> {
    logger.info(`[Health] Calculating adoption score for company: ${companyId}`);

    // TODO: Query feature_usage_metrics
    let score = 0;
    const featureAdoptionRate = 0; // %
    const onboardingComplete = true; // Would query company data
    const featuresUsed = 0;

    // Score based on feature adoption
    // <30% adoption = -40 points (major risk)
    // 30-50% adoption = -20 points
    // 50-70% adoption = -10 points
    // 70%+ adoption = baseline score
    if (featureAdoptionRate < 30) score -= 40;
    else if (featureAdoptionRate < 50) score -= 20;
    else if (featureAdoptionRate < 70) score -= 10;
    else score += 10; // Bonus for high adoption

    // Onboarding not complete = -25 points
    if (!onboardingComplete) score -= 25;

    score = Math.min(100, Math.max(0, 50 + score)); // Base score of 50

    return {
      score,
      featureAdoptionRate,
      onboardingComplete,
      featuresUsed,
    };
  }

  /**
   * Calculate satisfaction score
   */
  static async calculateSatisfactionScore(companyId: string): Promise<{
    score: number;
    nps: number;
    supportTickets: number;
    negativeTicketCount: number;
    resolutionTime: number;
  }> {
    logger.info(`[Health] Calculating satisfaction score for company: ${companyId}`);

    // TODO: Query NPS surveys and support tickets
    let score = 75; // Base score
    const nps = 0; // -100 to +100
    const supportTickets = 0;
    const negativeTicketCount = 0;
    const resolutionTime = 24; // hours

    // NPS scoring
    // Detractors (0-6): -30 points
    // Passive (7-8): -10 points
    // Promoters (9-10): +20 points
    if (nps < 0) score -= 30;
    else if (nps < 50) score -= 10;
    else score += 20;

    // Support ticket sentiment
    // High negative ticket ratio = -20 points
    if (supportTickets > 0) {
      const negativeRatio = negativeTicketCount / supportTickets;
      if (negativeRatio > 0.5) score -= 20;
      else if (negativeRatio > 0.25) score -= 10;
    }

    // Resolution time
    // >48 hours = -10 points
    // >72 hours = -20 points
    if (resolutionTime > 72) score -= 20;
    else if (resolutionTime > 48) score -= 10;

    return {
      score: Math.max(0, Math.min(100, score)),
      nps,
      supportTickets,
      negativeTicketCount,
      resolutionTime,
    };
  }

  /**
   * Calculate financial score
   */
  static async calculateFinancialScore(companyId: string): Promise<{
    score: number;
    paymentReliability: number;
    mrr: number;
    mrrGrowth: number;
    arrCoverage: number;
  }> {
    logger.info(`[Health] Calculating financial score for company: ${companyId}`);

    // TODO: Query subscription and payment data
    let score = 80;
    const paymentReliability = 100; // % of on-time payments
    const mrr = 0; // £
    const mrrGrowth = 0; // %
    const arrCoverage = 12; // months

    // Payment reliability
    // <95% = -30 points (payment issues)
    // 95-99% = -5 points
    if (paymentReliability < 95) score -= 30;
    else if (paymentReliability < 99) score -= 5;

    // Revenue growth
    // Negative MRR growth = -20 points
    // <5% growth = -10 points
    // >20% growth = +15 points
    if (mrrGrowth < 0) score -= 20;
    else if (mrrGrowth < 5) score -= 10;
    else if (mrrGrowth > 20) score += 15;

    // ARR coverage (runway)
    // <3 months = -30 points
    // 3-6 months = -10 points
    if (arrCoverage < 3) score -= 30;
    else if (arrCoverage < 6) score -= 10;

    return {
      score: Math.max(0, Math.min(100, score)),
      paymentReliability,
      mrr,
      mrrGrowth,
      arrCoverage,
    };
  }

  /**
   * Calculate technical score
   */
  static async calculateTechnicalScore(companyId: string): Promise<{
    score: number;
    apiErrorRate: number;
    avgResponseTime: number;
    uptime: number;
    criticalsIssues: number;
  }> {
    logger.info(`[Health] Calculating technical score for company: ${companyId}`);

    // TODO: Query API metrics and error logs
    let score = 90;
    const apiErrorRate = 0; // %
    const avgResponseTime = 200; // ms
    const uptime = 99.9; // %
    const criticalsIssues = 0;

    // Error rate
    // >1% = -30 points
    // >0.5% = -15 points
    if (apiErrorRate > 1) score -= 30;
    else if (apiErrorRate > 0.5) score -= 15;

    // Response time
    // >1000ms = -20 points
    // >500ms = -10 points
    if (avgResponseTime > 1000) score -= 20;
    else if (avgResponseTime > 500) score -= 10;

    // Critical issues
    // Each critical issue = -25 points
    score -= criticalsIssues * 25;

    // Uptime
    // <99% = -20 points
    // <99.5% = -10 points
    if (uptime < 99) score -= 20;
    else if (uptime < 99.5) score -= 10;

    return {
      score: Math.max(0, Math.min(100, score)),
      apiErrorRate,
      avgResponseTime,
      uptime,
      criticalsIssues,
    };
  }

  /**
   * Calculate composite health score
   */
  static async calculateHealthScore(companyId: string): Promise<CustomerHealthScore> {
    logger.info(`[Health] Calculating composite health score for company: ${companyId}`);

    const [engagement, adoption, satisfaction, financial, technical] = await Promise.all([
      this.calculateEngagementScore(companyId),
      this.calculateAdoptionScore(companyId),
      this.calculateSatisfactionScore(companyId),
      this.calculateFinancialScore(companyId),
      this.calculateTechnicalScore(companyId),
    ]);

    // Weighted average
    // Engagement: 20%, Adoption: 20%, Satisfaction: 20%, Financial: 25%, Technical: 15%
    const overallScore = Math.round(
      engagement.score * 0.2 +
      adoption.score * 0.2 +
      satisfaction.score * 0.2 +
      financial.score * 0.25 +
      technical.score * 0.15
    );

    // Determine health status
    let healthStatus: 'excellent' | 'good' | 'at_risk' | 'critical';
    if (overallScore >= 80) healthStatus = 'excellent';
    else if (overallScore >= 60) healthStatus = 'good';
    else if (overallScore >= 40) healthStatus = 'at_risk';
    else healthStatus = 'critical';

    // Identify primary concerns
    const concerns: string[] = [];
    if (engagement.score < 50) concerns.push('Low platform engagement');
    if (adoption.score < 50) concerns.push('Poor feature adoption');
    if (satisfaction.score < 50) concerns.push('Low satisfaction/NPS');
    if (financial.score < 50) concerns.push('Financial concerns');
    if (technical.score < 50) concerns.push('Technical issues');

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      engagement,
      adoption,
      satisfaction,
      financial,
      technical
    );

    // Get historical scores for trend
    const existingScore = await storage.getCustomerHealthScore(companyId);
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    let scoreHistory: { date: Date; score: number }[] = [
      { date: new Date(), score: overallScore },
    ];

    if (existingScore) {
      const prevScore = (existingScore as any).overallScore || overallScore;
      if (overallScore > prevScore + 5) trend = 'improving';
      else if (overallScore < prevScore - 5) trend = 'declining';
      
      scoreHistory = ((existingScore as any).scoreHistory || []).slice(-11);
      scoreHistory.push({ date: new Date(), score: overallScore });
    }

    const result: CustomerHealthScore = {
      companyId,
      overallScore,
      scoreBreakdown: {
        engagement,
        adoption,
        satisfaction,
        financial,
        technical,
      },
      healthStatus,
      trend,
      scoreHistory,
      primaryConcerns: concerns,
      recommendations,
      lastCalculatedAt: new Date(),
    };

    // Store the health score
    await storage.upsertCustomerHealthScore(companyId, {
      overallScore,
      engagementScore: engagement.score,
      adoptionScore: adoption.score,
      satisfactionScore: satisfaction.score,
      scoreHistory: scoreHistory.slice(-12), // Keep last 12 months
      trend,
      riskLevel: healthStatus,
      calculatedBy: 'CustomerHealthService',
    });

    return result;
  }

  /**
   * Generate health-based recommendations
   */
  private static generateRecommendations(
    engagement: any,
    adoption: any,
    satisfaction: any,
    financial: any,
    technical: any
  ): string[] {
    const recommendations: string[] = [];

    if (engagement.dayssinceLastLogin > 14) {
      recommendations.push('Low engagement - send re-engagement campaign');
    }

    if (adoption.featureAdoptionRate < 50) {
      recommendations.push('Low feature adoption - provide training or product demo');
    }

    if (satisfaction.nps < 20) {
      recommendations.push('Low NPS - conduct satisfaction survey and address concerns');
    }

    if (financial.mrrGrowth < 0) {
      recommendations.push('Declining revenue - identify expansion opportunities');
    }

    if (technical.criticalsIssues > 0) {
      recommendations.push('Critical technical issues - prioritize support');
    }

    return recommendations;
  }

  /**
   * Segment customers by health status
   */
  static async getHealthSegmentation(): Promise<{
    excellent: number;
    good: number;
    at_risk: number;
    critical: number;
    recommendations: Map<string, string[]>; // company => actions
  }> {
    logger.info('[Health] Segmenting customers by health status');

    // Query all health scores
    const allScores = await storage.getAllCustomerHealthScores();
    
    let excellent = 0;
    let good = 0;
    let at_risk = 0;
    let critical = 0;
    const recommendations = new Map<string, string[]>();

    for (const score of allScores) {
      const companyId = (score as any).companyId;
      const riskLevel = (score as any).riskLevel || 'good';
      
      switch (riskLevel) {
        case 'excellent':
          excellent++;
          break;
        case 'good':
          good++;
          break;
        case 'at_risk':
          at_risk++;
          recommendations.set(companyId, ['Increase engagement', 'Offer support']);
          break;
        case 'critical':
          critical++;
          recommendations.set(companyId, ['Urgent: Assign dedicated support', 'Schedule check-in call']);
          break;
      }
    }

    return {
      excellent,
      good,
      at_risk,
      critical,
      recommendations,
    };
  }
}

export default CustomerHealthService;
