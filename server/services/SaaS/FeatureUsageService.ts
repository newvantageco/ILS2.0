/**
 * Feature Usage Tracking Service
 * 
 * Tracks which features are being used by customers to:
 * - Understand product adoption and engagement
 * - Identify underutilized features
 * - Make data-driven product decisions
 * - Support pricing model (feature-based tiers)
 * - Predict churn (declining feature usage = churn risk)
 */

import logger from '../../utils/logger';
import { storage } from '../../storage';

export interface FeatureUsageMetric {
  featureName: string;
  usageCount: number;
  activeUsers: number;
  lastUsedAt: Date;
  tier: string;
  adoptionRate: number; // % of company users
  trend: 'increasing' | 'stable' | 'decreasing';
  revenueImpact: number; // £ revenue influenced by this feature
}

export interface CompanyFeatureUsage {
  companyId: string;
  totalFeatures: number;
  adoptedFeatures: number;
  adoptionRate: number; // % of available features adopted
  features: FeatureUsageMetric[];
  usageTrend: 'healthy' | 'declining' | 'plateauing';
  generatedAt: Date;
}

export class FeatureUsageService {
  private static readonly FEATURE_CATALOG = {
    // Core features
    'ai_recommendations': {
      tier: ['pro', 'premium', 'enterprise'],
      category: 'ai',
      description: 'AI-powered recommendations',
    },
    'advanced_reporting': {
      tier: ['premium', 'enterprise'],
      category: 'analytics',
      description: 'Advanced analytics and reporting',
    },
    'api_access': {
      tier: ['premium', 'enterprise'],
      category: 'integration',
      description: 'REST API access',
    },
    'custom_branding': {
      tier: ['enterprise'],
      category: 'admin',
      description: 'Custom branding and white-labeling',
    },
    'team_collaboration': {
      tier: ['pro', 'premium', 'enterprise'],
      category: 'team',
      description: 'Team collaboration tools',
    },
    'sso': {
      tier: ['enterprise'],
      category: 'security',
      description: 'Single Sign-On (SSO)',
    },
    'audit_logs': {
      tier: ['enterprise'],
      category: 'compliance',
      description: 'Detailed audit logging',
    },
    'priority_support': {
      tier: ['premium', 'enterprise'],
      category: 'support',
      description: 'Priority email/phone support',
    },
  };

  /**
   * Track feature usage event
   */
  static async trackFeatureUsage(
    companyId: string,
    userId: string,
    featureName: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    logger.debug(`[Features] Tracking usage: ${companyId} - ${featureName}`);

    try {
      // Insert usage event
      await storage.createUsageEvent({
        companyId,
        userId,
        featureName,
        eventType: 'feature_used',
        metadata,
        success: true,
      });

      // Update aggregated metrics
      const today = new Date();
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      await storage.upsertFeatureUsageMetric(companyId, featureName, {
        periodStart,
        periodEnd,
        lastUsedAt: today,
      });

      logger.debug(`[Features] Tracked usage for ${featureName}`);
    } catch (error) {
      logger.error({ err: error as Error }, `Failed to track feature usage: ${featureName}`);
      // Don't throw - tracking failures shouldn't break app functionality
    }
  }

  /**
   * Get feature adoption metrics for a company
   */
  static async getCompanyFeatureUsage(companyId: string): Promise<CompanyFeatureUsage> {
    logger.info(`[Features] Getting feature usage for company: ${companyId}`);

    // Query feature usage metrics from storage
    const featureMetrics = await storage.getCompanyFeatureUsage(companyId);
    
    const features: FeatureUsageMetric[] = featureMetrics.map((metric: any) => ({
      featureName: metric.featureName,
      usageCount: metric.usageCount || 0,
      activeUsers: metric.activeUsers || 0,
      lastUsedAt: metric.lastUsedAt || new Date(),
      tier: metric.tier || 'free',
      adoptionRate: 0, // Would calculate from active users
      trend: (metric.usageCount || 0) > 50 ? 'increasing' : 'stable',
      revenueImpact: 0, // Would calculate based on revenue attribution
    }));

    const adoptedFeatures = features.filter(f => f.usageCount > 0).length;
    const totalFeatures = Object.keys(this.FEATURE_CATALOG).length;

    const adoptionRate = totalFeatures > 0
      ? (adoptedFeatures / totalFeatures) * 100
      : 0;

    // Determine trend - compare with last calculation if available
    let usageTrend: 'healthy' | 'declining' | 'plateauing' = 'healthy';
    const totalCurrentUsage = features.reduce((sum, f) => sum + f.usageCount, 0);
    // In a real scenario, would compare with previous month's total
    if (totalCurrentUsage < 10) usageTrend = 'declining';
    else if (totalCurrentUsage < 100) usageTrend = 'plateauing';

    return {
      companyId,
      totalFeatures,
      adoptedFeatures,
      adoptionRate,
      features,
      usageTrend,
      generatedAt: new Date(),
    };
  }

  /**
   * Get feature adoption benchmarks
   * Compare customer vs industry average
   */
  static async getAdoptionBenchmarks(tier: string): Promise<{
    averageAdoptionRate: number;
    averageFeatureCount: number;
    topFeatures: string[];
    underutilizedFeatures: string[];
  }> {
    logger.info(`[Features] Getting adoption benchmarks for tier: ${tier}`);

    // TODO: Query all companies on this tier
    // Calculate averages
    // Identify top and underutilized features

    return {
      averageAdoptionRate: 0,
      averageFeatureCount: 0,
      topFeatures: [],
      underutilizedFeatures: [],
    };
  }

  /**
   * Identify at-risk customers based on feature usage decline
   */
  static async identifyRiskCustomers(
    minimumUsageDecline: number = 20 // %
  ): Promise<{
    companyId: string;
    usageDecline: number; // %
    featuresUnused: string[];
    riskScore: number; // 0-100
  }[]> {
    logger.info(`[Features] Identifying risk customers with >${minimumUsageDecline}% usage decline`);

    const riskCustomers: {
      companyId: string;
      usageDecline: number;
      featuresUnused: string[];
      riskScore: number;
    }[] = [];

    // TODO: Query all companies
    // Compare current month vs last month feature usage
    // Calculate decline %
    // Identify features that were used but aren't anymore
    // Calculate risk score

    return riskCustomers;
  }

  /**
   * Calculate feature-based upsell opportunities
   */
  static async calculateUpsellOpportunities(companyId: string): Promise<{
    currentTier: string;
    suggestedUpgradeTier: string;
    justification: string;
    expectedValue: number; // £
    features: string[]; // Features they'd gain
    probability: number; // 0-1 likelihood of conversion
  } | null> {
    logger.info(`[Features] Calculating upsell opportunities for company: ${companyId}`);

    // TODO: Get current subscription tier
    // TODO: Analyze feature usage
    // Check if they're hitting limits of current tier
    // E.g., if using API heavily but on tier without unlimited API = upsell

    // Scoring:
    // Using 80%+ of tier's features = ready to upsell
    // Requesting higher-tier features = high probability upsell
    // Heavy usage patterns = good expansion opportunity

    return null;
  }

  /**
   * Track feature-gated API calls
   */
  static async trackApiCall(
    companyId: string,
    featureName: string,
    success: boolean,
    responseTime: number
  ): Promise<void> {
    logger.debug(`[Features] API call: ${companyId} - ${featureName} (${responseTime}ms)`);

    try {
      await storage.createUsageEvent({
        companyId,
        userId: 'system', // API calls may not have user context
        featureName,
        eventType: 'api_call',
        success,
        responseTimeMs: responseTime,
        metadata: {
          timestamp: new Date().toISOString(),
          responseTime,
        },
      });
    } catch (error) {
      logger.error({ err: error as Error }, 'Failed to track API call');
    }
  }

  /**
   * Generate feature adoption report
   */
  static async generateAdoptionReport(): Promise<{
    totalCompanies: number;
    features: {
      name: string;
      adoptionRate: number; // % of customers
      averageUsageCount: number;
      trend: 'growing' | 'stable' | 'declining';
      recommendedForUpsell: boolean;
    }[];
    segments: {
      tier: string;
      averageAdoptionRate: number;
      topFeatures: string[];
      underutilizedFeatures: string[];
    }[];
  }> {
    logger.info('[Features] Generating adoption report');

    // TODO: Aggregate all feature usage data
    // Calculate adoption rates per feature
    // Identify trends
    // Segment by customer tier
    // Generate recommendations for product roadmap

    return {
      totalCompanies: 0,
      features: [],
      segments: [],
    };
  }

  /**
   * Check if customer has access to feature
   */
  static hasFeatureAccess(
    userTier: string,
    featureName: string
  ): boolean {
    const feature = this.FEATURE_CATALOG[featureName as keyof typeof this.FEATURE_CATALOG];
    if (!feature) {
      logger.warn(`[Features] Unknown feature: ${featureName}`);
      return false;
    }

    return feature.tier.includes(userTier);
  }

  /**
   * Get all features available for a tier
   */
  static getFeaturesForTier(tier: string): string[] {
    return Object.entries(this.FEATURE_CATALOG)
      .filter(([_, config]) => config.tier.includes(tier))
      .map(([name, _]) => name);
  }

  /**
   * Calculate feature ROI
   * Shows which features drive the most revenue impact
   */
  static async calculateFeatureROI(): Promise<{
    featureName: string;
    customerCount: number;
    revenuePerCustomer: number;
    totalRevenue: number;
    roi: number;
    tier: string;
  }[]> {
    logger.info('[Features] Calculating feature ROI');

    // TODO: For each feature:
    // - Count customers using it
    // - Calculate average revenue per customer
    // - Compare to feature maintenance costs
    // - Calculate ROI

    return [];
  }

  /**
   * Identify feature gaps
   * Features customers are requesting but don't have
   */
  static async identifyFeatureGaps(): Promise<{
    featureName: string;
    requestCount: number;
    tier: string;
    customerCount: number;
    suggestedPriority: 'critical' | 'high' | 'medium' | 'low';
  }[]> {
    logger.info('[Features] Identifying feature gaps');

    // TODO: Query user feedback and support tickets
    // Extract feature requests
    // Aggregate by requested feature
    // Prioritize by number of requests and customer tier

    return [];
  }
}

export default FeatureUsageService;
