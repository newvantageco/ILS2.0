/**
 * OMA Validation API Routes
 * 
 * Endpoints for validating orders against OMA files,
 * managing validation queue, and retrieving validation statistics
 */

import { Router } from "express";
import { OMAValidationService } from "../services/OMAValidationService";
import { storage } from "../storage";

const router = Router();
const omaValidationService = new OMAValidationService();

/**
 * POST /api/oma-validation/validate/:orderId
 * Validate a specific order
 */
router.post("/validate/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate order exists
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({
        error: "Order not found",
        orderId,
      });
    }

    // Perform validation
    const result = await omaValidationService.validateOrder(orderId);

    res.json({
      success: true,
      orderId,
      validation: {
        isValid: result.isValid,
        confidence: result.confidence,
        autoApproved: result.autoApproved,
        recommendedQueue: result.recommendedQueue,
        complexity: {
          score: result.complexity.overallScore,
          factors: result.complexity.factors,
          reasoning: result.complexity.reasoning,
        },
        issues: result.issues.map(issue => ({
          type: issue.type,
          severity: issue.severity,
          field: issue.field,
          message: issue.message,
          expected: issue.expectedValue,
          actual: issue.actualValue,
        })),
      },
    });
  } catch (error) {
    console.error("OMA validation error:", error);
    res.status(500).json({
      error: "Validation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/oma-validation/batch
 * Validate all pending orders
 */
router.post("/batch", async (req, res) => {
  try {
    const stats = await omaValidationService.batchValidatePendingOrders();

    res.json({
      success: true,
      stats,
      message: `Processed ${stats.processed} orders, ${stats.autoApproved} auto-approved, ${stats.needsReview} need review`,
    });
  } catch (error) {
    console.error("Batch validation error:", error);
    res.status(500).json({
      error: "Batch validation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/oma-validation/statistics
 * Get validation statistics
 */
router.get("/statistics", async (req, res) => {
  try {
    const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;
    const stats = await omaValidationService.getValidationStatistics(companyId);

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Statistics retrieval error:", error);
    res.status(500).json({
      error: "Failed to retrieve statistics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/oma-validation/queue/:queueType
 * Get orders in a specific queue (engineer, lab_tech, auto_approved)
 */
router.get("/queue/:queueType", async (req, res) => {
  try {
    const { queueType } = req.params;

    if (!["engineer", "lab_tech", "auto_approved"].includes(queueType)) {
      return res.status(400).json({
        error: "Invalid queue type",
        validTypes: ["engineer", "lab_tech", "auto_approved"],
      });
    }

    // In production, query oma_validations table filtered by recommended_queue
    // For now, return placeholder
    res.json({
      success: true,
      queue: queueType,
      orders: [],
      count: 0,
    });
  } catch (error) {
    console.error("Queue retrieval error:", error);
    res.status(500).json({
      error: "Failed to retrieve queue",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/oma-validation/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "OMA Validation API",
    timestamp: new Date().toISOString(),
  });
});

export default router;
