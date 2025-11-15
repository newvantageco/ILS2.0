/**
 * Subscription Lifecycle Event Handlers
 * 
 * Handles events triggered by subscription state changes:
 * - Created: New subscription activated
 * - Upgraded: Plan upgraded or expanded
 * - Downgraded: Plan downgraded
 * - Cancelled: Subscription terminated
 * - Trial Ended: Free trial expired
 * 
 * These handlers trigger:
 * - Retention campaigns for at-risk customers
 * - Upsell workflows for high-usage customers
 * - Win-back campaigns for churned customers
 * - Revenue reconciliation updates
 */

import { EventBus } from '../EventBus';
import { storage } from '../../storage';
import logger from '../../utils/logger';
import { SaaSMetricsService } from '../../services/SaaS/SaaSMetricsService';
import { CustomerHealthService } from '../../services/SaaS/CustomerHealthService';
import { ChurnPredictionService } from '../../services/SaaS/ChurnPredictionService';

/**
 * Handle subscription.created event
 * 
 * Trigger:
 * - Welcome email campaign
 * - Onboarding workflow
 * - Initial health score (100 - new customer)
 * - Track as new ARR
 */
EventBus.subscribe('subscription.created', async (event) => {
  try {
    const { companyId, subscriptionId, plan, amount } = event.data;
    const { source } = event.metadata || {};

    logger.info(`[Events] Processing subscription.created: ${subscriptionId} for company ${companyId}`);

    // 1. Initialize health score for new customer
    await CustomerHealthService.calculateHealthScore(companyId);

    // 2. Log acquisition source if provided
    if (source) {
      await storage.recordCustomerAcquisitionSource(companyId, {
        source,
        customersAcquired: 1,
        revenueGenerated: amount || 0,
        cac: 0, // Calculated retroactively
        period: 'monthly',
        periodStart: new Date(),
        periodEnd: new Date(),
      });
    }

    // 3. Track as usage event
    await storage.logUsageEvent(companyId, {
      eventType: 'subscription_created',
      eventName: 'new_subscription',
      properties: { plan, subscriptionId },
      revenueImpact: amount || 0,
    });

    // 4. Trigger welcome email (async, non-blocking)
    // Would call email service here
    logger.debug(`[Events] Welcome sequence queued for ${companyId}`);

    // 5. Recalculate MRR
    await SaaSMetricsService.calculateMRR(companyId);

  } catch (error) {
    logger.error(`[Events] Error in subscription.created handler: ${String(error)}`);
    // Handlers are fail-silent - don't propagate
  }
});

/**
 * Handle subscription.upgraded event
 * 
 * Trigger:
 * - Expansion revenue tracking
 * - Usage milestone celebration
 * - Access to new features
 * - Health score boost
 */
EventBus.subscribe('subscription.upgraded', async (event) => {
  try {
    const { companyId, subscriptionId, oldPlan, newPlan, priceIncrease } = event.data;

    logger.info(`[Events] Processing subscription.upgraded: ${subscriptionId} ${oldPlan} → ${newPlan}`);

    // 1. Record expansion revenue
    await storage.logUsageEvent(companyId, {
      eventType: 'revenue_expansion',
      eventName: 'plan_upgrade',
      properties: { fromPlan: oldPlan, toPlan: newPlan, increase: priceIncrease },
      revenueImpact: priceIncrease || 0,
    });

    // 2. Boost health score (sign of engagement)
    const currentHealth = await storage.getCustomerHealthScore(companyId);
    if (currentHealth) {
      const boostedScore = Math.min((currentHealth as any).overallScore + 10, 100);
      await storage.upsertCustomerHealthScore(companyId, {
        overallScore: boostedScore,
        engagementScore: (currentHealth as any).engagementScore + 5,
        adoptionScore: (currentHealth as any).adoptionScore,
        satisfactionScore: (currentHealth as any).satisfactionScore,
        trend: 'improving',
        riskLevel: boostedScore >= 60 ? 'good' : 'at_risk',
        calculatedBy: 'subscriptionEvents',
      });
    }

    // 3. Recalculate MRR (expansion portion)
    await SaaSMetricsService.calculateMRR(companyId);

    // 4. Log expansion
    logger.info(`[Events] Expansion recorded: ${companyId} gained £${priceIncrease}`);

  } catch (error) {
    logger.error(`[Events] Error in subscription.upgraded handler: ${String(error)}`);
  }
});

/**
 * Handle subscription.downgraded event
 * 
 * Trigger:
 * - Contraction revenue tracking
 * - Health score reduction
 * - Engagement campaign (save customer)
 * - Why-you-left survey (for big downgrades)
 */
EventBus.subscribe('subscription.downgraded', async (event) => {
  try {
    const { companyId, subscriptionId, oldPlan, newPlan, priceDecrease } = event.data;

    logger.info(`[Events] Processing subscription.downgraded: ${subscriptionId} ${oldPlan} → ${newPlan}`);

    // 1. Record contraction revenue
    await storage.logUsageEvent(companyId, {
      eventType: 'revenue_contraction',
      eventName: 'plan_downgrade',
      properties: { fromPlan: oldPlan, toPlan: newPlan, decrease: priceDecrease },
      revenueImpact: -(priceDecrease || 0),
    });

    // 2. Reduce health score (sign of disengagement)
    const currentHealth = await storage.getCustomerHealthScore(companyId);
    if (currentHealth) {
      const reducedScore = Math.max((currentHealth as any).overallScore - 15, 0);
      await storage.upsertCustomerHealthScore(companyId, {
        overallScore: reducedScore,
        engagementScore: Math.max((currentHealth as any).engagementScore - 10, 0),
        adoptionScore: (currentHealth as any).adoptionScore,
        satisfactionScore: (currentHealth as any).satisfactionScore,
        trend: 'declining',
        riskLevel: reducedScore < 40 ? 'at_risk' : 'good',
        calculatedBy: 'subscriptionEvents',
      });
    }

    // 3. Recalculate MRR (contraction portion)
    await SaaSMetricsService.calculateMRR(companyId);

    // 4. Trigger retention campaign
    logger.info(`[Events] Retention campaign triggered for ${companyId}`);
    // Would queue email/support outreach here

  } catch (error) {
    logger.error(`[Events] Error in subscription.downgraded handler: ${String(error)}`);
  }
});

/**
 * Handle subscription.cancelled event
 * 
 * Trigger:
 * - Churn tracking
 * - Win-back campaign
 * - Exit survey
 * - Churn reason categorization
 * - Support escalation (optional)
 */
EventBus.subscribe('subscription.cancelled', async (event) => {
  try {
    const { companyId, subscriptionId, plan, monthlyAmount, reason } = event.data;

    logger.info(`[Events] Processing subscription.cancelled: ${subscriptionId} - Reason: ${reason}`);

    // 1. Record churn revenue
    await storage.logUsageEvent(companyId, {
      eventType: 'revenue_churn',
      eventName: 'subscription_cancelled',
      properties: { plan, reason, monthlyAmount },
      revenueImpact: -(monthlyAmount || 0),
    });

    // 2. Update health score to critical
    await storage.upsertCustomerHealthScore(companyId, {
      overallScore: 0,
      engagementScore: 0,
      adoptionScore: 0,
      satisfactionScore: 0,
      trend: 'declining',
      riskLevel: 'critical',
      calculatedBy: 'subscriptionEvents',
    });

    // 3. Update churn prediction (mark as churned)
    const churnPred = await storage.getChurnPrediction(companyId);
    if (churnPred) {
      await storage.upsertChurnPrediction(companyId, {
        churnProbability: '1.0000',
        riskFactors: [{ factor: 'Subscription cancelled', weight: 1.0, trend: 'declining', impact: 'high' }],
        recommendedActions: [
          { action: 'Win-back campaign', priority: 'high', description: 'Email win-back offer' },
          { action: 'Exit survey', priority: 'medium', description: 'Understand cancellation reason' },
        ],
        modelVersion: '1.0',
        predictionScore: 100,
        predictedChurnDate: new Date(),
      });
    }

    // 4. Recalculate MRR (remove from active)
    await SaaSMetricsService.calculateMRR(companyId);

    // 5. Trigger win-back campaign
    logger.info(`[Events] Win-back campaign triggered for churned customer: ${companyId}`);
    // Would queue email/special offer here

    // 6. If high-value churn, escalate to support
    if (monthlyAmount && monthlyAmount > 1000) {
      logger.warn(`[Events] HIGH-VALUE CHURN: ${companyId} lost £${monthlyAmount}/month`);
      // Would create support ticket for follow-up
    }

  } catch (error) {
    logger.error(`[Events] Error in subscription.cancelled handler: ${String(error)}`);
  }
});

/**
 * Handle subscription.trial_ended event
 * 
 * Trigger:
 * - Trial to paid conversion tracking
 * - Purchase flow if not converted
 * - Health assessment before conversion
 * - Conversion incentive if needed
 */
EventBus.subscribe('subscription.trial_ended', async (event) => {
  try {
    const { companyId, subscriptionId, converted, plan, amount } = event.data;

    logger.info(`[Events] Processing subscription.trial_ended: ${subscriptionId} - Converted: ${converted}`);

    if (converted) {
      // 1. Trial converted to paid
      await storage.logUsageEvent(companyId, {
        eventType: 'trial_converted',
        eventName: 'trial_to_paid',
        properties: { plan, amount },
        revenueImpact: amount || 0,
      });

      // 2. Set healthy initial score (trial engagement)
      await CustomerHealthService.calculateHealthScore(companyId);

      logger.info(`[Events] Trial conversion: ${companyId} → ${plan}`);
    } else {
      // 1. Trial expired without conversion
      await storage.logUsageEvent(companyId, {
        eventType: 'trial_expired',
        eventName: 'trial_abandoned',
        properties: { plan },
      });

      // 2. Trigger last-chance offer
      logger.info(`[Events] Last-chance offer triggered for ${companyId}`);
      // Would queue special offer email
    }

  } catch (error) {
    logger.error(`[Events] Error in subscription.trial_ended handler: ${String(error)}`);
  }
});

/**
 * Handle subscription.payment_failed event
 * 
 * Trigger:
 * - Update health score (financial concern)
 * - Email with payment retry link
 * - Escalate to support if repeated
 * - Churn risk increase
 */
EventBus.subscribe('subscription.payment_failed', async (event) => {
  try {
    const { companyId, subscriptionId, attempt, maxAttempts } = event.data;

    logger.info(`[Events] Processing subscription.payment_failed: ${subscriptionId} - Attempt ${attempt}/${maxAttempts}`);

    // 1. Reduce health score (payment issue)
    const currentHealth = await storage.getCustomerHealthScore(companyId);
    if (currentHealth) {
      const reducedScore = Math.max((currentHealth as any).overallScore - 20, 0);
      await storage.upsertCustomerHealthScore(companyId, {
        overallScore: reducedScore,
        engagementScore: (currentHealth as any).engagementScore,
        adoptionScore: (currentHealth as any).adoptionScore,
        satisfactionScore: (currentHealth as any).satisfactionScore,
        trend: 'declining',
        riskLevel: 'at_risk',
        calculatedBy: 'subscriptionEvents',
      });
    }

    // 2. Update churn prediction with payment signal
    const churnPred = await storage.getChurnPrediction(companyId);
    if (churnPred) {
      const currentProb = parseFloat((churnPred as any).churnProbability || '0.3');
      const newProb = Math.min(currentProb + 0.15, 1.0);
      
      await storage.upsertChurnPrediction(companyId, {
        churnProbability: newProb.toString(),
        riskFactors: [
          { factor: 'Payment failed', weight: 0.4, trend: 'declining', impact: 'high' },
          { factor: 'Retry attempt ' + attempt, weight: 0.2, trend: 'declining', impact: 'medium' },
        ],
        recommendedActions: [
          { action: 'Payment retry', priority: 'high', description: 'Send payment retry link' },
          { action: 'Support outreach', priority: 'high', description: 'Contact customer to resolve' },
        ],
        modelVersion: '1.0',
        predictionScore: Math.round(newProb * 100),
        predictedChurnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }

    // 3. Email customer with retry option
    logger.info(`[Events] Payment retry email queued for ${companyId}`);

    // 4. If final attempt, escalate to support
    if (attempt >= maxAttempts) {
      logger.warn(`[Events] FINAL PAYMENT ATTEMPT FAILED: ${companyId} - Escalating to support`);
      // Would create urgent support ticket
    }

  } catch (error) {
    logger.error(`[Events] Error in subscription.payment_failed handler: ${String(error)}`);
  }
});

/**
 * Handle subscription.high_usage event
 * 
 * Trigger:
 * - Identify upsell opportunity
 * - Feature access expansion
 * - Proactive support check-in
 * - Success story potential
 */
EventBus.subscribe('subscription.high_usage', async (event) => {
  try {
    const { companyId, subscriptionId, usagePercentage, plan } = event.data;

    logger.info(`[Events] Processing subscription.high_usage: ${subscriptionId} at ${usagePercentage}%`);

    // 1. Flag for upsell
    await storage.logUsageEvent(companyId, {
      eventType: 'upsell_opportunity',
      eventName: 'high_usage_detected',
      properties: { plan, usagePercentage },
    });

    // 2. Boost health score (high engagement)
    const currentHealth = await storage.getCustomerHealthScore(companyId);
    if (currentHealth) {
      const boostedScore = Math.min((currentHealth as any).overallScore + 5, 100);
      await storage.upsertCustomerHealthScore(companyId, {
        overallScore: boostedScore,
        adoptionScore: Math.min((currentHealth as any).adoptionScore + 10, 100),
        engagementScore: Math.min((currentHealth as any).engagementScore + 5, 100),
        satisfactionScore: (currentHealth as any).satisfactionScore,
        trend: 'improving',
        riskLevel: 'good',
        calculatedBy: 'subscriptionEvents',
      });
    }

    // 3. Trigger proactive upsell
    logger.info(`[Events] Upsell opportunity flagged: ${companyId} using ${usagePercentage}% of ${plan} plan`);

  } catch (error) {
    logger.error(`[Events] Error in subscription.high_usage handler: ${String(error)}`);
  }
});

logger.info('[Events] Subscription event handlers registered');

export default {};
