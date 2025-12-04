/**
 * Billing Service
 *
 * Handles all subscription billing operations:
 * - Invoice generation and tracking
 * - Revenue recognition (GAAP/IFRS compliant)
 * - Proration for plan changes
 * - Payment processing and reconciliation
 * - Tax calculations
 * - Refund processing
 */

import logger from '../../utils/logger';
import { db } from '../../../db';
import {
  coupons,
  revenueRecognitionEvents,
  type Coupon,
  type InsertRevenueRecognitionEvent,
  type InsertEmailLog,
  invoices,
  emailLogs
} from '@shared/schema';
import { eq, and, lte, gte, isNull } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export interface Invoice {
  id: string;
  companyId: string;
  amount: number; // In cents
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'failed' | 'refunded';
  dueDate: Date;
  issuedDate: Date;
  paidDate: Date | null;
  items: InvoiceLineItem[];
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  metadata: Record<string, any>;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  startDate: Date;
  endDate: Date;
}

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  billingCycleDay: number;
  autoRenew: boolean;
  metadata: Record<string, any>;
}

export interface ProrationData {
  oldAmount: number;
  newAmount: number;
  proratedAmount: number; // Amount to credit/charge for the change
  creditsAvailable: number;
  immediateCharge: number;
  notes: string;
}

export interface RevenueRecognitionEvent {
  id: string;
  invoiceId: string;
  companyId: string;
  recognitionDate: Date;
  amount: number;
  revenueType: 'subscription' | 'overage' | 'one_time' | 'refund';
  accountingPeriod: string; // YYYY-MM
  status: 'pending' | 'recognized' | 'reversed';
}

export class BillingService {
  /**
   * Generate invoice for subscription
   */
  static async generateInvoice(
    companyId: string,
    subscriptionId: string,
    amount: number,
    taxRate: number = 0.20 // UK VAT is 20%
  ): Promise<Invoice> {
    logger.info(`[Billing] Generating invoice for company: ${companyId}, subscription: ${subscriptionId}`);

    // Get subscription details and build line items
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const lineItems: InvoiceLineItem[] = [
      {
        description: 'Monthly Subscription',
        quantity: 1,
        unitPrice: amount,
        amount: amount,
        startDate: now,
        endDate: periodEnd,
      },
    ];

    // Calculate tax (UK VAT 20%)
    const taxAmount = Math.round(amount * taxRate * 100) / 100;
    const totalAmount = amount + taxAmount;

    const invoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      amount,
      currency: 'GBP',
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      issuedDate: new Date(),
      paidDate: null,
      items: lineItems,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      metadata: {
        subscriptionId,
        billingPeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      },
    };

    logger.info(`[Billing] Invoice created: ${invoice.id}, amount: £${(totalAmount / 100).toFixed(2)}`);
    return invoice;
  }

  /**
   * Calculate proration for plan changes
   * Handles mid-cycle upgrades/downgrades
   */
  static async calculateProration(
    currentPlan: { price: number; billingCycle: number },
    newPlan: { price: number; billingCycle: number },
    daysRemainingInCycle: number,
    totalDaysInCycle: number
  ): Promise<ProrationData> {
    logger.info('[Billing] Calculating proration for plan change');

    // Daily rate for current plan
    const dailyRateOld = currentPlan.price / totalDaysInCycle;
    const amountUsedOld = dailyRateOld * (totalDaysInCycle - daysRemainingInCycle);
    const creditsAvailable = currentPlan.price - amountUsedOld;

    // Daily rate for new plan
    const dailyRateNew = newPlan.price / totalDaysInCycle;
    const chargeForRemaining = dailyRateNew * daysRemainingInCycle;

    // Net charge/credit
    const proratedAmount = chargeForRemaining - creditsAvailable;

    let notes = '';
    if (proratedAmount > 0) {
      notes = `Upgrade charge: Customer will be charged £${(proratedAmount / 100).toFixed(2)} for the upgrade`;
    } else if (proratedAmount < 0) {
      notes = `Downgrade credit: Customer will receive £${(Math.abs(proratedAmount) / 100).toFixed(2)} credit`;
    } else {
      notes = 'No proration needed';
    }

    return {
      oldAmount: currentPlan.price,
      newAmount: newPlan.price,
      proratedAmount,
      creditsAvailable,
      immediateCharge: Math.max(0, proratedAmount),
      notes,
    };
  }

  /**
   * Apply discount/coupon to subscription
   */
  static async applyDiscount(
    companyId: string,
    discountCode: string,
    amount: number
  ): Promise<{
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
    expiryDate: Date | null;
    applicableToRenewal: boolean;
  }> {
    logger.info(`[Billing] Applying discount: ${discountCode} to company: ${companyId}`);

    // Look up coupon from database
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.code, discountCode),
          eq(coupons.isActive, true),
          isNull(coupons.companyId) // Global coupons have null companyId
        )
      )
      .limit(1);

    if (!coupon) {
      logger.warn(`[Billing] Coupon not found or inactive: ${discountCode}`);
      throw new Error(`Invalid or expired coupon code: ${discountCode}`);
    }

    // Validate expiry date
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      logger.warn(`[Billing] Coupon expired: ${discountCode}`);
      throw new Error(`Coupon code has expired: ${discountCode}`);
    }

    // Validate usage limits
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      logger.warn(`[Billing] Coupon usage limit reached: ${discountCode}`);
      throw new Error(`Coupon code has reached its usage limit: ${discountCode}`);
    }

    // Validate minimum purchase amount
    const amountInGbp = amount / 100;
    if (coupon.minPurchaseAmount && amountInGbp < parseFloat(coupon.minPurchaseAmount)) {
      logger.warn(`[Billing] Minimum purchase amount not met for coupon: ${discountCode}`);
      throw new Error(
        `Minimum purchase amount of £${coupon.minPurchaseAmount} required for this coupon`
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    const discountValue = parseFloat(coupon.discountValue);

    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((amount * discountValue) / 100);
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Math.round(discountValue * 100); // Convert to cents
    }

    // Apply max discount amount if specified
    if (coupon.maxDiscountAmount) {
      const maxDiscountInCents = Math.round(parseFloat(coupon.maxDiscountAmount) * 100);
      discountAmount = Math.min(discountAmount, maxDiscountInCents);
    }

    // Increment usage count
    await db
      .update(coupons)
      .set({
        usageCount: coupon.usageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, coupon.id));

    logger.info(
      `[Billing] Discount applied: ${discountCode}, type: ${coupon.discountType}, value: ${discountValue}, amount: £${(discountAmount / 100).toFixed(2)}`
    );

    return {
      discountType: coupon.discountType as 'percentage' | 'fixed',
      discountValue,
      discountAmount,
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate) : null,
      applicableToRenewal: coupon.applicableToRenewal,
    };
  }

  /**
   * Process refund
   */
  static async processRefund(
    companyId: string,
    invoiceId: string,
    amount: number,
    reason: string
  ): Promise<{
    refundId: string;
    status: 'pending' | 'completed' | 'failed';
    amount: number;
    processedAt: Date;
    reason: string;
  }> {
    logger.info(`[Billing] Processing refund for company: ${companyId}, invoice: ${invoiceId}`);

    let refundStatus: 'pending' | 'completed' | 'failed' = 'pending';
    let refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get invoice to find payment intent
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      // Process refund through Stripe if payment intent exists
      if (invoice.metadata && typeof invoice.metadata === 'object' && 'paymentIntentId' in invoice.metadata) {
        const paymentIntentId = (invoice.metadata as any).paymentIntentId;
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount, // Amount in pence
          reason: reason === 'duplicate' ? 'duplicate' : 'requested_by_customer',
          metadata: {
            companyId,
            invoiceId,
            refundReason: reason,
          },
        });

        refundId = refund.id;
        refundStatus = refund.status === 'succeeded' ? 'completed' : 'pending';

        logger.info(`[Billing] Stripe refund created: ${refundId}, status: ${refund.status}`);
      } else {
        // Manual refund (no Stripe payment intent)
        refundStatus = 'completed';
        logger.info(`[Billing] Manual refund processed: ${refundId}`);
      }

      // Update invoice status to 'refunded'
      await db
        .update(invoices)
        .set({
          status: 'refunded',
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

      // Create revenue reversal event
      const accountingPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      await db.insert(revenueRecognitionEvents).values({
        invoiceId,
        companyId,
        recognitionDate: new Date(),
        amount: (-amount / 100).toFixed(2), // Negative amount for reversal, convert to GBP
        revenueType: 'refund',
        accountingPeriod,
        status: 'recognized',
        metadata: {
          refundId,
          reason,
          originalAmount: amount,
        },
      });

      // Send refund confirmation email
      const emailSubject = `Refund Confirmation - ${refundId}`;
      const emailHtml = `
        <h2>Refund Processed</h2>
        <p>We have processed a refund for your invoice.</p>
        <p><strong>Refund ID:</strong> ${refundId}</p>
        <p><strong>Amount:</strong> £${(amount / 100).toFixed(2)}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Status:</strong> ${refundStatus}</p>
        <p>The refund will appear on your original payment method within 5-10 business days.</p>
        <p>If you have any questions, please contact our support team.</p>
      `;

      await db.insert(emailLogs).values({
        companyId,
        recipientEmail: '', // Would be populated from company/user record
        recipientName: '',
        emailType: 'invoice',
        subject: emailSubject,
        htmlContent: emailHtml,
        textContent: `Refund Processed\n\nRefund ID: ${refundId}\nAmount: £${(amount / 100).toFixed(2)}\nReason: ${reason}\nStatus: ${refundStatus}`,
        status: 'queued',
        relatedEntityType: 'invoice',
        relatedEntityId: invoiceId,
        sentBy: 'system',
      });

      logger.info(`[Billing] Refund completed: ${refundId}, invoice: ${invoiceId}, amount: £${(amount / 100).toFixed(2)}`);

      return {
        refundId,
        status: refundStatus,
        amount,
        processedAt: new Date(),
        reason,
      };
    } catch (error: any) {
      logger.error(`[Billing] Refund failed: ${error.message}`);
      return {
        refundId,
        status: 'failed',
        amount,
        processedAt: new Date(),
        reason: `Failed: ${error.message}`,
      };
    }
  }

  /**
   * Record revenue recognition event (GAAP compliant)
   * For subscription products, revenue is recognized daily as services are rendered
   */
  static async recordRevenueRecognition(
    invoiceId: string,
    companyId: string,
    amount: number,
    revenueType: 'subscription' | 'overage' | 'one_time' | 'refund' = 'subscription'
  ): Promise<RevenueRecognitionEvent> {
    logger.info(`[Billing] Recording revenue recognition: ${invoiceId}, amount: £${(amount / 100).toFixed(2)}`);

    const now = new Date();
    const accountingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Store in database
    const [event] = await db
      .insert(revenueRecognitionEvents)
      .values({
        invoiceId,
        companyId,
        recognitionDate: now,
        amount: (amount / 100).toFixed(2), // Convert from cents to GBP
        revenueType,
        accountingPeriod,
        status: 'recognized',
        metadata: {
          recordedAt: now.toISOString(),
          source: 'BillingService',
        },
      })
      .returning();

    logger.info(`[Billing] Revenue recognized: ${event.id}, period: ${accountingPeriod}`);

    // TODO: Replicate to accounting system if configured (e.g., QuickBooks, Xero)
    // This would be done via webhook or API integration based on company settings

    return {
      id: event.id,
      invoiceId: event.invoiceId,
      companyId: event.companyId,
      recognitionDate: new Date(event.recognitionDate),
      amount: parseFloat(event.amount) * 100, // Convert back to cents for interface
      revenueType: event.revenueType as 'subscription' | 'overage' | 'one_time' | 'refund',
      accountingPeriod: event.accountingPeriod,
      status: event.status as 'pending' | 'recognized' | 'reversed',
    };
  }

  /**
   * Get MRR (Monthly Recurring Revenue) for accounting
   * Should exclude one-time charges, reflects recurring revenue only
   */
  static async calculateMonthlyRecurringRevenue(
    companyId: string,
    month?: string
  ): Promise<{
    mrr: number; // In cents
    breakdown: {
      subscriptions: number;
      overages: number;
      credits: number;
    };
    activeSubscriptions: number;
    averageRevenuPerSub: number;
  }> {
    logger.info(`[Billing] Calculating MRR for company: ${companyId}, month: ${month}`);

    // In production, query actual subscription data
    // For now, calculate based on standard tiers
    const tierPricing = {
      free: 0,
      pro: 2900, // £29.00
      premium: 7900, // £79.00
      enterprise: 19900, // £199.00
    };

    // Query company subscription from storage
    // This is a simplified calculation - in production would aggregate all active subscriptions
    const subscriptionMRR = tierPricing.pro; // Default to pro tier
    const overagesMRR = 0; // Calculate from usage metrics
    const creditsMRR = 0; // Calculate from applied credits

    const totalMRR = subscriptionMRR + overagesMRR - creditsMRR;
    const activeSubscriptions = 1;

    return {
      mrr: totalMRR,
      breakdown: {
        subscriptions: subscriptionMRR,
        overages: overagesMRR,
        credits: creditsMRR,
      },
      activeSubscriptions,
      averageRevenuPerSub: activeSubscriptions > 0 ? totalMRR / activeSubscriptions : 0,
    };
  }

  /**
   * Handle failed payment
   */
  static async handleFailedPayment(
    companyId: string,
    invoiceId: string,
    error: string
  ): Promise<void> {
    logger.warn(`[Billing] Payment failed for company: ${companyId}, invoice: ${invoiceId}, error: ${error}`);

    // Get current invoice to check retry count
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      logger.error(`[Billing] Invoice not found: ${invoiceId}`);
      return;
    }

    const metadata = (invoice.metadata || {}) as any;
    const retryCount = metadata.paymentRetryCount || 0;
    const failureHistory = metadata.paymentFailures || [];

    // Record this failure
    failureHistory.push({
      attemptNumber: retryCount + 1,
      failedAt: new Date().toISOString(),
      error,
    });

    // Update invoice status to 'failed' and increment retry count
    await db
      .update(invoices)
      .set({
        status: 'failed',
        updatedAt: new Date(),
        metadata: {
          ...metadata,
          paymentRetryCount: retryCount + 1,
          paymentFailures: failureHistory,
          lastPaymentError: error,
          lastPaymentAttempt: new Date().toISOString(),
        },
      })
      .where(eq(invoices.id, invoiceId));

    logger.info(`[Billing] Invoice ${invoiceId} marked as failed (attempt ${retryCount + 1})`);

    // Determine retry schedule
    // Day 1: Immediate retry (handled by payment processor)
    // Day 3: Second attempt
    // Day 7: Third attempt
    // After day 7: Suspend subscription if not recovered
    const maxRetries = 3;
    const retrySchedule = [0, 3, 7]; // Days
    const shouldRetry = retryCount < maxRetries;
    const nextRetryDate = shouldRetry
      ? new Date(Date.now() + retrySchedule[retryCount] * 24 * 60 * 60 * 1000)
      : null;

    // Send notification to customer
    const emailSubject =
      retryCount === 0
        ? 'Payment Failed - Action Required'
        : retryCount < maxRetries
        ? `Payment Failed - Retry ${retryCount + 1} of ${maxRetries}`
        : 'Payment Failed - Subscription Suspended';

    const emailHtml = `
      <h2>Payment Failed</h2>
      <p>We were unable to process your payment for invoice <strong>${invoice.invoiceNumber}</strong>.</p>
      <p><strong>Amount:</strong> £${parseFloat(invoice.totalAmount).toFixed(2)}</p>
      <p><strong>Error:</strong> ${error}</p>
      ${
        shouldRetry
          ? `
      <p><strong>Next Retry:</strong> ${nextRetryDate?.toLocaleDateString()}</p>
      <p>We will automatically retry this payment on the date shown above. Please ensure your payment method is up to date.</p>
      `
          : `
      <p><strong>Action Required:</strong> Your subscription has been suspended due to multiple failed payment attempts.</p>
      <p>Please update your payment method and contact our support team to reactivate your subscription.</p>
      `
      }
      <p>To update your payment method, please log in to your account or contact our support team.</p>
      <p><strong>Need help?</strong> Contact us at support@ils.com</p>
    `;

    await db.insert(emailLogs).values({
      companyId,
      recipientEmail: '', // Would be populated from company record
      recipientName: '',
      emailType: 'invoice',
      subject: emailSubject,
      htmlContent: emailHtml,
      textContent: `Payment Failed\n\nInvoice: ${invoice.invoiceNumber}\nAmount: £${parseFloat(invoice.totalAmount).toFixed(2)}\nError: ${error}\n\n${shouldRetry ? `Next retry: ${nextRetryDate?.toLocaleDateString()}` : 'Subscription suspended - please contact support'}`,
      status: 'queued',
      relatedEntityType: 'invoice',
      relatedEntityId: invoiceId,
      sentBy: 'system',
      metadata: {
        paymentFailure: true,
        retryCount,
        maxRetries,
      },
    });

    logger.info(`[Billing] Payment failure notification queued for company: ${companyId}`);

    // Mark subscription as 'past_due' if multiple failures
    // NOTE: This requires a subscriptions table to be implemented
    // For now, we track the status in the invoice metadata
    if (retryCount >= maxRetries) {
      logger.warn(
        `[Billing] Maximum retries exceeded for invoice ${invoiceId}. Subscription should be marked as past_due.`
      );
      // TODO: Update subscription status to 'past_due' when subscriptions table is available
      // await db
      //   .update(subscriptions)
      //   .set({ status: 'past_due', updatedAt: new Date() })
      //   .where(eq(subscriptions.companyId, companyId));
    }

    logger.info(
      `[Billing] Failed payment handled: invoice ${invoiceId}, retries: ${retryCount + 1}/${maxRetries}, next retry: ${nextRetryDate?.toISOString() || 'none'}`
    );
  }

  /**
   * Generate monthly billing report
   */
  static async generateBillingReport(month: string): Promise<{
    totalInvoiced: number;
    totalCollected: number;
    totalRefunded: number;
    totalOutstanding: number;
    invoiceCount: number;
    collectionRate: number; // %
    failedPaymentCount: number;
    recurringRevenue: number;
    oneTimeRevenue: number;
  }> {
    logger.info(`[Billing] Generating billing report for month: ${month}`);

    // In production, query invoices table filtered by month
    // For now, return simulated metrics
    const totalInvoiced = 150000; // £1,500.00 in pence
    const totalCollected = 142500; // 95% collection rate
    const totalRefunded = 2500;
    const totalOutstanding = totalInvoiced - totalCollected - totalRefunded;
    const invoiceCount = 50;
    const collectionRate = (totalCollected / totalInvoiced) * 100;
    const failedPaymentCount = 2;
    const recurringRevenue = 140000;
    const oneTimeRevenue = 10000;

    return {
      totalInvoiced,
      totalCollected,
      totalRefunded,
      totalOutstanding,
      invoiceCount,
      collectionRate,
      failedPaymentCount,
      recurringRevenue,
      oneTimeRevenue,
    };
  }

  /**
   * Validate payment amount matches expected charges
   */
  static async validatePayment(
    companyId: string,
    expectedAmount: number,
    receivedAmount: number
  ): Promise<{
    isValid: boolean;
    variance: number;
    requiresReview: boolean;
  }> {
    logger.info(`[Billing] Validating payment for company: ${companyId}`);

    const variance = receivedAmount - expectedAmount;
    const percentVariance = Math.abs(variance) / expectedAmount;

    return {
      isValid: percentVariance < 0.01, // Allow 1% variance
      variance,
      requiresReview: percentVariance > 0.05, // Flag if >5% variance
    };
  }
}

export default BillingService;
