/**
 * Subscription Management Service
 * 
 * Handles subscription lifecycle operations:
 * - Plan upgrades/downgrades with prorating
 * - Trial-to-paid conversions
 * - Pause/resume subscriptions
 * - Subscription renewal management
 * - Cancellation workflows with win-back campaigns
 */

import { storage } from '../../storage.js';
import { SaaSMetricsService } from './SaaSMetricsService.js';
import { CustomerHealthService } from './CustomerHealthService.js';
import { EventBus } from '../../events/EventBus.js';

interface UpgradeRequest {
  companyId: string;
  currentPlanId: string;
  newPlanId: string;
  prorationMode: 'immediate' | 'next_billing_cycle';
}

interface DowngradeRequest {
  companyId: string;
  currentPlanId: string;
  newPlanId: string;
  reason?: string;
  prorationMode: 'immediate' | 'next_billing_cycle';
}

interface TrialConversionRequest {
  companyId: string;
  planId: string;
  billingInterval: 'monthly' | 'annual';
}

interface PauseRequest {
  companyId: string;
  pauseEndDate?: string; // ISO date, if undefined = indefinite pause
  reason?: string;
}

interface RenewalRequest {
  companyId: string;
  renewalDate: string; // ISO date
  autoRenew: boolean;
}

interface UpgradeResult {
  success: boolean;
  previousMrr: number;
  newMrr: number;
  expansionMrr: number;
  prorationCredit?: number;
  chargeAmount?: number;
  activationDate: string;
  message: string;
}

interface DowngradeResult {
  success: boolean;
  previousMrr: number;
  newMrr: number;
  contractionMrr: number;
  refundAmount?: number;
  effectiveDate: string;
  retentionOffers?: Array<{
    offer: string;
    discount: number;
    validUntil: string;
  }>;
  message: string;
}

interface ConversionResult {
  success: boolean;
  trialEndDate: string;
  firstChargeDate: string;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  message: string;
}

export class SubscriptionManagementService {
  /**
   * Upgrade subscription to higher tier/plan
   * Triggers expansion revenue recording and health boost
   */
  static async upgradeSubscription(
    request: UpgradeRequest
  ): Promise<UpgradeResult> {
    try {
      // Get current subscription and plan pricing
      const subscription = await storage.getSubscriptionByCompanyId(request.companyId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate MRR for both plans (simplified - would need actual plan pricing from schema)
      const previousMrr = subscription.priceMonthly || 0;
      const newMrr = this.calculatePlanMRR(request.newPlanId); // Would query plan pricing
      const expansionMrr = newMrr - previousMrr;

      // Handle proration
      let chargeAmount = 0;
      let prorationCredit = 0;

      if (request.prorationMode === 'immediate') {
        // Calculate days remaining in billing cycle
        const daysRemaining = this.getDaysRemainingInCycle(subscription.billingCycleStart);
        const totalDaysInCycle = 30; // Simplified; would use actual cycle
        
        // Prorate the difference
        const dailyDifference = expansionMrr / totalDaysInCycle;
        chargeAmount = dailyDifference * daysRemaining;
      }

      const activationDate = request.prorationMode === 'immediate' 
        ? new Date().toISOString() 
        : subscription.renewalDate || new Date().toISOString();

      // Record usage event for analytics
      await storage.logUsageEvent(request.companyId, {
        eventType: 'plan_upgrade',
        properties: {
          fromPlan: request.currentPlanId,
          toPlan: request.newPlanId,
          previousMrr: previousMrr,
          newMrr: newMrr,
          chargeAmount: chargeAmount,
        },
        revenueImpact: expansionMrr,
      });

      // Emit upgrade event for triggered workflows
      await EventBus.publish('subscription.upgraded', {
        companyId: request.companyId,
        planId: request.newPlanId,
        expansionMrr: expansionMrr,
        chargeAmount: chargeAmount,
        effectiveDate: activationDate,
      }, { companyId: request.companyId });

      // Update metrics
      await SaaSMetricsService.calculateMRR(request.companyId);

      return {
        success: true,
        previousMrr,
        newMrr,
        expansionMrr,
        chargeAmount: chargeAmount > 0 ? chargeAmount : undefined,
        prorationCredit: prorationCredit > 0 ? prorationCredit : undefined,
        activationDate,
        message: `Successfully upgraded from ${request.currentPlanId} to ${request.newPlanId}`,
      };
    } catch (error) {
      throw new Error(`Upgrade failed: ${String(error)}`);
    }
  }

  /**
   * Downgrade subscription to lower tier/plan
   * Triggers contraction revenue recording and retention campaigns
   */
  static async downgradeSubscription(
    request: DowngradeRequest
  ): Promise<DowngradeResult> {
    try {
      const subscription = await storage.getSubscriptionByCompanyId(request.companyId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const previousMrr = subscription.priceMonthly || 0;
      const newMrr = this.calculatePlanMRR(request.newPlanId);
      const contractionMrr = previousMrr - newMrr;

      let refundAmount = 0;
      if (request.prorationMode === 'immediate') {
        const daysRemaining = this.getDaysRemainingInCycle(subscription.billingCycleStart);
        const totalDaysInCycle = 30;
        const dailyDifference = contractionMrr / totalDaysInCycle;
        refundAmount = dailyDifference * daysRemaining;
      }

      const effectiveDate = request.prorationMode === 'immediate'
        ? new Date().toISOString()
        : subscription.renewalDate || new Date().toISOString();

      // Record downgrade event
      await storage.logUsageEvent(request.companyId, {
        eventType: 'plan_downgrade',
        properties: {
          fromPlan: request.currentPlanId,
          toPlan: request.newPlanId,
          previousMrr: previousMrr,
          newMrr: newMrr,
          reason: request.reason,
          refundAmount: refundAmount,
        },
        revenueImpact: -contractionMrr,
      });

      // Generate retention offers
      const retentionOffers = this.generateRetentionOffers(
        request.companyId,
        previousMrr,
        newMrr,
        request.reason
      );

      // Emit downgrade event
      await EventBus.publish('subscription.downgraded', {
        companyId: request.companyId,
        fromPlan: request.currentPlanId,
        toPlan: request.newPlanId,
        contractionMrr: contractionMrr,
        reason: request.reason,
        refundAmount: refundAmount,
        effectiveDate: effectiveDate,
      }, { companyId: request.companyId });

      // Update health score (reduction for downgrade)
      await storage.upsertCustomerHealthScore(request.companyId, {
        engagementScore: Math.max(0, (await storage.getCustomerHealthScore(request.companyId))?.engagementScore || 50 - 15),
        satisfactionScore: Math.max(0, (await storage.getCustomerHealthScore(request.companyId))?.satisfactionScore || 50 - 10),
      });

      // Update metrics
      await SaaSMetricsService.calculateMRR(request.companyId);

      return {
        success: true,
        previousMrr,
        newMrr,
        contractionMrr,
        refundAmount: refundAmount > 0 ? refundAmount : undefined,
        effectiveDate,
        retentionOffers,
        message: `Successfully downgraded from ${request.currentPlanId} to ${request.newPlanId}`,
      };
    } catch (error) {
      throw new Error(`Downgrade failed: ${String(error)}`);
    }
  }

  /**
   * Convert trial subscription to paid subscription
   * Initiates first charge and sets renewal schedule
   */
  static async convertTrialToPaid(
    request: TrialConversionRequest
  ): Promise<ConversionResult> {
    try {
      const subscription = await storage.getSubscriptionByCompanyId(request.companyId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status !== 'trial') {
        throw new Error('Subscription is not in trial status');
      }

      const now = new Date();
      const planMrr = this.calculatePlanMRR(request.planId);
      const planArr = planMrr * 12;

      // Set first charge date (today) and next renewal date
      const firstChargeDate = now.toISOString();
      const renewalDate = request.billingInterval === 'monthly'
        ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
        : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();

      // Record conversion event
      await storage.logUsageEvent(request.companyId, {
        eventType: 'trial_to_paid_conversion',
        properties: {
          planId: request.planId,
          billingInterval: request.billingInterval,
          firstChargeAmount: planMrr,
          mrrValue: planMrr,
          arrValue: planArr,
        },
        revenueImpact: planMrr,
      });

      // Initialize health score for newly converted customer
      const health = await CustomerHealthService.calculateHealthScore(request.companyId);
      await storage.upsertCustomerHealthScore(request.companyId, health);

      // Record acquisition if not already recorded
      await storage.recordCustomerAcquisitionSource(request.companyId, {
        source: 'trial_conversion',
        channel: 'product',
        campaignId: 'trial_onboarding',
      });

      // Emit conversion event
      await EventBus.publish('subscription.trial_converted', {
        companyId: request.companyId,
        planId: request.planId,
        billingInterval: request.billingInterval,
        monthlyRecurringRevenue: planMrr,
        annualRecurringRevenue: planArr,
        firstChargeDate: firstChargeDate,
        renewalDate: renewalDate,
      }, { companyId: request.companyId });

      // Update MRR metrics
      await SaaSMetricsService.calculateMRR(request.companyId);

      return {
        success: true,
        trialEndDate: now.toISOString(),
        firstChargeDate: firstChargeDate,
        monthlyRecurringRevenue: planMrr,
        annualRecurringRevenue: planArr,
        message: `Trial successfully converted to paid subscription`,
      };
    } catch (error) {
      throw new Error(`Trial conversion failed: ${String(error)}`);
    }
  }

  /**
   * Pause an active subscription
   * Customer maintains access but is not charged during pause period
   */
  static async pauseSubscription(request: PauseRequest): Promise<void> {
    try {
      const subscription = await storage.getSubscriptionByCompanyId(request.companyId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status !== 'active') {
        throw new Error('Only active subscriptions can be paused');
      }

      const pauseEndDate = request.pauseEndDate
        ? new Date(request.pauseEndDate).toISOString()
        : undefined;

      // Log pause event
      await storage.logUsageEvent(request.companyId, {
        eventType: 'subscription_paused',
        properties: {
          pauseEndDate: pauseEndDate,
          reason: request.reason,
        },
        revenueImpact: 0,
      });

      // Emit pause event for handling pause-specific workflows
      await EventBus.publish('subscription.paused', {
        companyId: request.companyId,
        pauseEndDate: pauseEndDate,
        reason: request.reason,
      }, { companyId: request.companyId });
    } catch (error) {
      throw new Error(`Pause failed: ${String(error)}`);
    }
  }

  /**
   * Resume a paused subscription
   * Restarts charges from resumption date
   */
  static async resumeSubscription(companyId: string): Promise<void> {
    try {
      const subscription = await storage.getSubscriptionByCompanyId(companyId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status !== 'paused') {
        throw new Error('Only paused subscriptions can be resumed');
      }

      // Log resume event
      await storage.logUsageEvent(companyId, {
        eventType: 'subscription_resumed',
        properties: {
          previousPauseStartDate: subscription.pauseStartDate,
          resumeDate: new Date().toISOString(),
        },
        revenueImpact: 0,
      });

      // Emit resume event
      await EventBus.publish('subscription.resumed', {
        companyId: companyId,
        resumeDate: new Date().toISOString(),
      }, { companyId });
    } catch (error) {
      throw new Error(`Resume failed: ${String(error)}`);
    }
  }

  /**
   * Schedule subscription renewal
   * Sets auto-renewal and next billing date
   */
  static async scheduleRenewal(request: RenewalRequest): Promise<void> {
    try {
      const subscription = await storage.getSubscriptionByCompanyId(request.companyId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Log renewal schedule event
      await storage.logUsageEvent(request.companyId, {
        eventType: 'renewal_scheduled',
        properties: {
          renewalDate: request.renewalDate,
          autoRenew: request.autoRenew,
        },
        revenueImpact: 0,
      });

      // Emit renewal event for handling pre-renewal notifications
      await EventBus.publish('subscription.renewal_scheduled', {
        companyId: request.companyId,
        renewalDate: request.renewalDate,
        autoRenew: request.autoRenew,
      }, { companyId: request.companyId });
    } catch (error) {
      throw new Error(`Schedule renewal failed: ${String(error)}`);
    }
  }

  /**
   * Helper: Calculate MRR for a plan
   * In production, would query plan pricing from database
   */
  private static calculatePlanMRR(planId: string): number {
    const planPricing: Record<string, number> = {
      'starter': 29,
      'professional': 99,
      'enterprise': 299,
      'custom': 0, // Custom pricing handled separately
    };
    return planPricing[planId] || 0;
  }

  /**
   * Helper: Calculate remaining days in billing cycle
   */
  private static getDaysRemainingInCycle(cycleStart: Date | string): number {
    const start = new Date(cycleStart);
    const nextCycle = new Date(start);
    nextCycle.setMonth(nextCycle.getMonth() + 1);
    
    const now = new Date();
    const daysRemaining = Math.ceil(
      (nextCycle.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return Math.max(1, daysRemaining);
  }

  /**
   * Helper: Generate retention offers for downgrades
   * Offers discounts, feature add-ons, or trials to retain revenue
   */
  private static generateRetentionOffers(
    companyId: string,
    previousMrr: number,
    newMrr: number,
    reason?: string
  ): Array<{ offer: string; discount: number; validUntil: string }> {
    const offers = [];
    const contractionMrr = previousMrr - newMrr;

    // Offer 1: Discount to match downgraded plan
    // Bridges 25% of the gap with a discount
    const discountOfferAmount = contractionMrr * 0.25;
    if (discountOfferAmount > 0) {
      offers.push({
        offer: `${Math.round((discountOfferAmount / previousMrr) * 100)}% discount on current plan for 3 months`,
        discount: discountOfferAmount,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });
    }

    // Offer 2: Add-on features instead of downgrade
    if (reason?.includes('cost')) {
      offers.push({
        offer: 'Free advanced features for 3 months instead of downgrading',
        discount: contractionMrr * 0.5, // 50% cost reduction via feature access
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Offer 3: Retention credit
    offers.push({
      offer: `£${(contractionMrr * 0.1).toFixed(2)} account credit for staying with us`,
      discount: contractionMrr * 0.1,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    });

    return offers;
  }
}
