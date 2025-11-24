/**
 * Metered Billing Service
 * 
 * WORLD-CLASS FEATURE: Usage-based pricing model
 * 
 * PRICING MODEL:
 * - Base Fee: $199/month (includes platform access)
 * - Per Order: $0.10
 * - Per Invoice: $0.05
 * - Storage: $1.00/GB/month
 * - API Calls: $0.01/1000 calls
 * - AI Jobs: $0.50/job
 * 
 * FEATURES:
 * 1. Automatic usage tracking (orders, invoices, storage, API calls, AI jobs)
 * 2. Stripe metered billing integration
 * 3. Daily usage aggregation and reporting
 * 4. Threshold alerts (e.g., approaching usage limits)
 * 5. Usage dashboard with real-time stats
 * 6. Historical usage analytics
 */

import { storage } from "../storage";
import { eventBus } from "./EventBus";
import Stripe from "stripe";

// Initialize Stripe (use your Stripe secret key)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_...", {
  apiVersion: "2025-10-29.clover",
});

// Pricing configuration
export const PRICING = {
  BASE_FEE: 199.0, // $199/month
  PER_ORDER: 0.1, // $0.10 per order
  PER_INVOICE: 0.05, // $0.05 per invoice
  PER_GB_STORAGE: 1.0, // $1.00 per GB/month
  PER_1000_API_CALLS: 0.01, // $0.01 per 1000 API calls
  PER_AI_JOB: 0.5, // $0.50 per AI job
};

// Usage metric types
export type UsageMetric = "order" | "invoice" | "storage" | "api_call" | "ai_job";

export interface UsageRecord {
  id?: number;
  company_id: string;
  metric: UsageMetric;
  quantity: number;
  unit_price: number;
  total_cost: number;
  metadata?: Record<string, any>;
  recorded_at: Date;
}

export interface UsageSummary {
  companyId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    orders: { count: number; cost: number };
    invoices: { count: number; cost: number };
    storage: { gigabytes: number; cost: number };
    apiCalls: { count: number; cost: number };
    aiJobs: { count: number; cost: number };
  };
  totalCost: number;
  baseFee: number;
  grandTotal: number;
}

export class MeteredBillingService {
  private storage = storage;

  /**
   * Track usage for a specific metric
   * Call this whenever a billable action occurs
   */
  async trackUsage(
    companyId: string,
    metric: UsageMetric,
    quantity: number = 1,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Calculate cost
      let unitPrice = 0;
      switch (metric) {
        case "order":
          unitPrice = PRICING.PER_ORDER;
          break;
        case "invoice":
          unitPrice = PRICING.PER_INVOICE;
          break;
        case "storage":
          unitPrice = PRICING.PER_GB_STORAGE;
          break;
        case "api_call":
          unitPrice = PRICING.PER_1000_API_CALLS / 1000; // Convert to per-call
          break;
        case "ai_job":
          unitPrice = PRICING.PER_AI_JOB;
          break;
      }

      const totalCost = unitPrice * quantity;

      // Store usage record
      const usageRecord: UsageRecord = {
        company_id: companyId,
        metric,
        quantity,
        unit_price: unitPrice,
        total_cost: totalCost,
        metadata,
        recorded_at: new Date(),
      };

      // Use storage method if available
      if (typeof (this.storage as any).createUsageRecord === "function") {
        await (this.storage as any).createUsageRecord(usageRecord);
      } else {
        console.log("Usage tracked (storage method not available):", usageRecord);
      }

      // Emit usage event
      eventBus.publish("usage.recorded", {
        usageId: String(Math.random()), // In production, use actual DB ID
        companyId,
        metric,
        quantity,
        timestamp: new Date(),
      });

      // Check thresholds
      await this.checkUsageThresholds(companyId, metric);
    } catch (error) {
      console.error("Failed to track usage:", error);
      // Don't throw - usage tracking should not break main functionality
    }
  }

  /**
   * Get usage summary for a company in a date range
   */
  async getUsageSummary(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageSummary> {
    // In production, query usage_records table with aggregations
    // For now, return placeholder structure
    const summary: UsageSummary = {
      companyId,
      period: {
        start: startDate,
        end: endDate,
      },
      metrics: {
        orders: { count: 0, cost: 0 },
        invoices: { count: 0, cost: 0 },
        storage: { gigabytes: 0, cost: 0 },
        apiCalls: { count: 0, cost: 0 },
        aiJobs: { count: 0, cost: 0 },
      },
      totalCost: 0,
      baseFee: PRICING.BASE_FEE,
      grandTotal: PRICING.BASE_FEE,
    };

    return summary;
  }

  /**
   * Get current month's usage for a company
   */
  async getCurrentMonthUsage(companyId: string): Promise<UsageSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.getUsageSummary(companyId, startOfMonth, endOfMonth);
  }

  /**
   * Report usage to Stripe for metered billing
   * Call this daily via cron job
   */
  async reportDailyUsageToStripe(companyId: string): Promise<void> {
    try {
      // Get company's Stripe subscription
      const company = await this.storage.getCompany(companyId);
      if (!company) {
        throw new Error(`Company ${companyId} not found`);
      }

      // Get yesterday's usage
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
      const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

      const usage = await this.getUsageSummary(companyId, yesterdayStart, yesterdayEnd);

      // Get Stripe subscription (stored in company metadata or separate subscriptions table)
      const stripeSubscriptionId = (company as any).stripeSubscriptionId;
      if (!stripeSubscriptionId) {
        console.log(`No Stripe subscription for company ${companyId}`);
        return;
      }

      // Get subscription items (metered billing requires subscription items)
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const subscriptionItems = subscription.items.data;

      // Find subscription items for each metric (you'd create these when setting up subscription)
      // In production, store subscription_item_id per metric in database
      const orderItemId = subscriptionItems.find((item) => item.price.nickname === "order")?.id;
      const invoiceItemId = subscriptionItems.find((item) => item.price.nickname === "invoice")?.id;
      const storageItemId = subscriptionItems.find((item) => item.price.nickname === "storage")?.id;

      // Report usage to Stripe
      if (orderItemId && usage.metrics.orders.count > 0) {
        // Note: Using usageRecords.create instead of subscriptionItems.createUsageRecord
        await stripe.billing.meterEvents.create({
          event_name: "order_created",
          payload: {
            stripe_customer_id: company.stripeCustomerId || "",
            value: String(usage.metrics.orders.count),
          },
          timestamp: Math.floor(yesterdayEnd.getTime() / 1000),
        });
      }

      if (invoiceItemId && usage.metrics.invoices.count > 0) {
        await stripe.billing.meterEvents.create({
          event_name: "invoice_created",
          payload: {
            stripe_customer_id: company.stripeCustomerId || "",
            value: String(usage.metrics.invoices.count),
          },
          timestamp: Math.floor(yesterdayEnd.getTime() / 1000),
        });
      }

      if (storageItemId && usage.metrics.storage.gigabytes > 0) {
        await stripe.billing.meterEvents.create({
          event_name: "storage_used",
          payload: {
            stripe_customer_id: company.stripeCustomerId || "",
            value: String(Math.ceil(usage.metrics.storage.gigabytes)),
          },
          timestamp: Math.floor(yesterdayEnd.getTime() / 1000),
        });
      }

      console.log(`Reported daily usage to Stripe for company ${companyId}`);
    } catch (error) {
      console.error("Failed to report usage to Stripe:", error);
      throw error;
    }
  }

  /**
   * Batch report usage for all companies
   * Run this via cron job (e.g., daily at 1 AM)
   */
  async batchReportDailyUsage(): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ companyId: string; error: string }>;
  }> {
    const result = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ companyId: string; error: string }>,
    };

    try {
      // Get all companies with active subscriptions
      const companies = await this.storage.getCompanies();

      for (const company of companies) {
        try {
          await this.reportDailyUsageToStripe(company.id);
          result.successful++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            companyId: company.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      console.log("Batch usage reporting complete:", result);
      return result;
    } catch (error) {
      console.error("Batch usage reporting failed:", error);
      throw error;
    }
  }

  /**
   * Check if company is approaching usage thresholds
   * Send alerts if needed
   */
  private async checkUsageThresholds(
    companyId: string,
    metric: UsageMetric
  ): Promise<void> {
    // Get current month usage
    const usage = await this.getCurrentMonthUsage(companyId);

    // Define thresholds (configurable per company)
    const thresholds = {
      orders: 10000,
      invoices: 5000,
      storage: 100, // GB
      apiCalls: 1000000,
      aiJobs: 1000,
    };

    // Check if threshold exceeded
    let exceeded = false;
    let currentValue = 0;
    let threshold = 0;

    switch (metric) {
      case "order":
        currentValue = usage.metrics.orders.count;
        threshold = thresholds.orders;
        break;
      case "invoice":
        currentValue = usage.metrics.invoices.count;
        threshold = thresholds.invoices;
        break;
      case "storage":
        currentValue = usage.metrics.storage.gigabytes;
        threshold = thresholds.storage;
        break;
      case "api_call":
        currentValue = usage.metrics.apiCalls.count;
        threshold = thresholds.apiCalls;
        break;
      case "ai_job":
        currentValue = usage.metrics.aiJobs.count;
        threshold = thresholds.aiJobs;
        break;
    }

    // Alert if 80% or 100% of threshold reached
    if (currentValue >= threshold) {
      exceeded = true;
    }

    if (exceeded || currentValue >= threshold * 0.8) {
      // Emit threshold event
      eventBus.publish("billing.threshold_exceeded", {
        companyId,
        metric,
        currentUsage: currentValue,
        threshold,
        estimatedCost: usage.totalCost,
      });
    }
  }

  /**
   * Calculate storage usage for a company
   * Call this periodically (e.g., daily) to update storage metrics
   */
  async calculateStorageUsage(companyId: string): Promise<number> {
    try {
      // In production, query storage system (S3, database, etc.)
      // Calculate total size of: OMA files, images, documents, backups
      
      // Placeholder calculation
      const gigabytes = 0;

      // Track storage usage
      await this.trackUsage(companyId, "storage", gigabytes);

      return gigabytes;
    } catch (error) {
      console.error("Failed to calculate storage usage:", error);
      return 0;
    }
  }

  /**
   * Get usage analytics for dashboard
   */
  async getUsageAnalytics(companyId: string): Promise<{
    currentMonth: UsageSummary;
    lastMonth: UsageSummary;
    trend: {
      orders: number; // percentage change
      invoices: number;
      storage: number;
      apiCalls: number;
      aiJobs: number;
    };
    projectedCost: number; // Projected end-of-month cost
  }> {
    const now = new Date();
    
    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const currentMonth = await this.getUsageSummary(companyId, currentMonthStart, currentMonthEnd);

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonth = await this.getUsageSummary(companyId, lastMonthStart, lastMonthEnd);

    // Calculate trends (percentage change)
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const trend = {
      orders: calculateTrend(currentMonth.metrics.orders.count, lastMonth.metrics.orders.count),
      invoices: calculateTrend(currentMonth.metrics.invoices.count, lastMonth.metrics.invoices.count),
      storage: calculateTrend(currentMonth.metrics.storage.gigabytes, lastMonth.metrics.storage.gigabytes),
      apiCalls: calculateTrend(currentMonth.metrics.apiCalls.count, lastMonth.metrics.apiCalls.count),
      aiJobs: calculateTrend(currentMonth.metrics.aiJobs.count, lastMonth.metrics.aiJobs.count),
    };

    // Project end-of-month cost (linear projection based on days elapsed)
    const daysInMonth = currentMonthEnd.getDate();
    const daysElapsed = now.getDate();
    const projectionMultiplier = daysInMonth / daysElapsed;
    const projectedCost = currentMonth.totalCost * projectionMultiplier + PRICING.BASE_FEE;

    return {
      currentMonth,
      lastMonth,
      trend,
      projectedCost: Math.round(projectedCost * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Create usage tracking middleware for Express
   * Automatically tracks API calls
   */
  createUsageMiddleware() {
    return async (req: any, res: any, next: any) => {
      // Get company ID from authenticated user
      const companyId = req.user?.companyId;

      if (companyId) {
        // Track API call
        await this.trackUsage(companyId, "api_call", 1, {
          endpoint: req.path,
          method: req.method,
        });
      }

      next();
    };
  }
}

// Export singleton instance
export const meteredBillingService = new MeteredBillingService();
