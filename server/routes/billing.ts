/**
 * Metered Billing API Routes
 * 
 * Endpoints for usage tracking, billing analytics, and subscription management
 */

import { Router } from "express";
import { MeteredBillingService, PRICING } from "../services/MeteredBillingService";

const router = Router();
const billingService = new MeteredBillingService();

/**
 * GET /api/billing/usage/current
 * Get current month's usage for authenticated company
 */
router.get("/usage/current", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const usage = await billingService.getCurrentMonthUsage(companyId);

    res.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error("Failed to get current usage:", error);
    res.status(500).json({
      error: "Failed to retrieve usage",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/billing/usage/range
 * Get usage for a specific date range
 * Query params: startDate, endDate (ISO format)
 */
router.get("/usage/range", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required query parameters",
        required: ["startDate", "endDate"],
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
        expected: "ISO 8601 format (YYYY-MM-DD)",
      });
    }

    const usage = await billingService.getUsageSummary(companyId, start, end);

    res.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error("Failed to get usage range:", error);
    res.status(500).json({
      error: "Failed to retrieve usage",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/billing/analytics
 * Get usage analytics with trends and projections
 */
router.get("/analytics", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const analytics = await billingService.getUsageAnalytics(companyId);

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Failed to get analytics:", error);
    res.status(500).json({
      error: "Failed to retrieve analytics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/billing/track/:metric
 * Manually track usage for a metric (for testing or manual entries)
 * Body: { quantity?: number, metadata?: object }
 */
router.post("/track/:metric", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { metric } = req.params;
    const { quantity = 1, metadata } = req.body;

    // Validate metric
    const validMetrics = ["order", "invoice", "storage", "api_call", "ai_job"];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        error: "Invalid metric",
        validMetrics,
      });
    }

    await billingService.trackUsage(companyId, metric as any, quantity, metadata);

    res.json({
      success: true,
      message: `Tracked ${quantity} ${metric}(s)`,
    });
  } catch (error) {
    console.error("Failed to track usage:", error);
    res.status(500).json({
      error: "Failed to track usage",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/billing/pricing
 * Get current pricing configuration
 */
router.get("/pricing", (req, res) => {
  res.json({
    success: true,
    pricing: PRICING,
    description: {
      BASE_FEE: "Monthly platform access fee",
      PER_ORDER: "Per order created",
      PER_INVOICE: "Per invoice generated",
      PER_GB_STORAGE: "Per GB stored per month",
      PER_1000_API_CALLS: "Per 1,000 API calls",
      PER_AI_JOB: "Per AI job executed",
    },
  });
});

/**
 * POST /api/billing/calculate-storage
 * Trigger storage usage calculation
 * (Admin only - typically run via cron)
 */
router.post("/calculate-storage", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const gigabytes = await billingService.calculateStorageUsage(companyId);

    res.json({
      success: true,
      storageUsage: {
        gigabytes,
        cost: gigabytes * PRICING.PER_GB_STORAGE,
      },
    });
  } catch (error) {
    console.error("Failed to calculate storage:", error);
    res.status(500).json({
      error: "Failed to calculate storage",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/billing/report-to-stripe
 * Manually trigger Stripe usage reporting
 * (Admin only - typically run via cron)
 */
router.post("/report-to-stripe", async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.user?.role === "admin";
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const result = await billingService.batchReportDailyUsage();

    res.json({
      success: true,
      result,
      message: `Reported usage for ${result.successful} companies, ${result.failed} failed`,
    });
  } catch (error) {
    console.error("Failed to report to Stripe:", error);
    res.status(500).json({
      error: "Failed to report usage to Stripe",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/billing/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Metered Billing API",
    timestamp: new Date().toISOString(),
  });
});

export default router;
