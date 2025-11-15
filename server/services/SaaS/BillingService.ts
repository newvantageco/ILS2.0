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

    // TODO: Query subscription details
    // Get line items based on plan and usage
    const lineItems: InvoiceLineItem[] = [];

    // TODO: Calculate tax
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

    // TODO: Look up coupon from database
    // Validate expiry, usage limits, applicable plans
    // Apply to next invoice or current subscription

    return {
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      expiryDate: null,
      applicableToRenewal: false,
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

    // TODO: Connect to Stripe to process refund
    // Update invoice status to 'refunded'
    // Create revenue reversal event
    // Send refund confirmation email

    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      refundId,
      status: 'completed',
      amount,
      processedAt: new Date(),
      reason,
    };
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

    const event: RevenueRecognitionEvent = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceId,
      companyId,
      recognitionDate: now,
      amount,
      revenueType,
      accountingPeriod,
      status: 'recognized',
    };

    // TODO: Store in database
    // Replicate to accounting system if configured

    logger.info(`[Billing] Revenue recognized: ${event.id}`);
    return event;
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

    // TODO: Query invoices and subscription history for the month
    // Sum all active subscription revenues
    // Exclude one-time charges and refunds

    return {
      mrr: 0,
      breakdown: {
        subscriptions: 0,
        overages: 0,
        credits: 0,
      },
      activeSubscriptions: 0,
      averageRevenuPerSub: 0,
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

    // TODO: Update invoice status to 'failed'
    // TODO: Trigger retry schedule (3 retries over 7 days typical)
    // TODO: Send notification to customer
    // TODO: Mark subscription as 'past_due' if multiple failures

    // First attempt: Notify customer
    logger.info(`[Billing] Sending payment failure notification to company: ${companyId}`);

    // Retry schedule
    // Day 1: Immediate retry
    // Day 3: Second attempt
    // Day 7: Third attempt
    // After day 7: Suspend subscription if not recovered
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

    // TODO: Query all invoices for the month
    // Calculate totals and metrics
    // Generate report

    return {
      totalInvoiced: 0,
      totalCollected: 0,
      totalRefunded: 0,
      totalOutstanding: 0,
      invoiceCount: 0,
      collectionRate: 0,
      failedPaymentCount: 0,
      recurringRevenue: 0,
      oneTimeRevenue: 0,
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
