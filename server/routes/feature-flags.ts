import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { authenticateHybrid } from "../middleware/auth-hybrid";
import { createLogger } from "../utils/logger";

const router = Router();
const logger = createLogger('feature-flags');

// Validation schemas
const createFlagSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/, "Flag key must be lowercase alphanumeric with underscores"),
  name: z.string().min(1),
  description: z.string().optional(),
  enabled: z.boolean().optional().default(false),
  targetingType: z.enum(["all", "user", "company"]).optional().default("all"),
  targetIds: z.array(z.string()).optional(),
});

const updateFlagSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  targetingType: z.enum(["all", "user", "company"]).optional(),
  targetIds: z.array(z.string()).optional(),
});

const toggleFlagSchema = z.object({
  enabled: z.boolean(),
});

const evaluateFlagSchema = z.object({
  userId: z.string().optional(),
  companyId: z.string().optional(),
});

// Helper to check admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = req.user.claims.sub;
  const user = await storage.getUserById_Internal(userId);
  
  if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  (req as any).currentUser = user;
  next();
};

// Apply auth middleware to all routes
router.use(authenticateHybrid, requireAdmin);

/**
 * GET /api/feature-flags
 * List all feature flags
 */
router.get("/", async (req, res) => {
  try {
    const { enabled, targetingType, search } = req.query;

    // Mock feature flags - replace with database queries
    const flags = [
      {
        id: "flag-001",
        key: "ai_assistant_v2",
        name: "AI Assistant V2",
        description: "Enable new AI assistant with enhanced capabilities",
        enabled: true,
        targetingType: "all",
        targetIds: null,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-10-15"),
        createdBy: (req as any).currentUser.id,
      },
      {
        id: "flag-002",
        key: "advanced_analytics",
        name: "Advanced Analytics Dashboard",
        description: "Enable premium analytics features",
        enabled: true,
        targetingType: "company",
        targetIds: ["company-001", "company-003", "company-007"],
        createdAt: new Date("2025-08-15"),
        updatedAt: new Date("2025-10-20"),
        createdBy: (req as any).currentUser.id,
      },
      {
        id: "flag-003",
        key: "beta_ml_predictions",
        name: "Beta ML Predictions",
        description: "Enable machine learning prediction features (beta)",
        enabled: false,
        targetingType: "user",
        targetIds: ["user-123", "user-456"],
        createdAt: new Date("2025-10-01"),
        updatedAt: new Date("2025-10-25"),
        createdBy: (req as any).currentUser.id,
      },
      {
        id: "flag-004",
        key: "new_checkout_flow",
        name: "New Checkout Flow",
        description: "A/B test for redesigned checkout experience",
        enabled: true,
        targetingType: "user",
        targetIds: null,
        percentage: 50, // 50% rollout
        createdAt: new Date("2025-10-10"),
        updatedAt: new Date("2025-10-28"),
        createdBy: (req as any).currentUser.id,
      },
    ];

    // Apply filters
    let filtered = flags;
    
    if (enabled !== undefined) {
      filtered = filtered.filter(f => f.enabled === (enabled === 'true'));
    }
    
    if (targetingType) {
      filtered = filtered.filter(f => f.targetingType === targetingType);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(f => 
        f.key.toLowerCase().includes(searchLower) ||
        f.name.toLowerCase().includes(searchLower) ||
        (f.description && f.description.toLowerCase().includes(searchLower))
      );
    }

    res.json(filtered);
  } catch (error) {
    logger.error({ error, enabled, targetingType, search }, 'Error fetching feature flags');
    res.status(500).json({ message: "Failed to fetch feature flags" });
  }
});

/**
 * GET /api/feature-flags/:id
 * Get a specific feature flag
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Mock flag details
    const flag = {
      id,
      key: "ai_assistant_v2",
      name: "AI Assistant V2",
      description: "Enable new AI assistant with enhanced capabilities",
      enabled: true,
      targetingType: "all",
      targetIds: null,
      metadata: {
        releaseVersion: "2.5.0",
        rolloutStrategy: "gradual",
        documentation: "https://docs.example.com/features/ai-assistant-v2",
      },
      usage: {
        activeUsers: 1234,
        totalEvaluations: 45678,
        lastEvaluatedAt: new Date(Date.now() - 3600000),
      },
      history: [
        {
          action: "enabled",
          timestamp: new Date("2025-10-15"),
          userId: (req as any).currentUser.id,
          previousValue: false,
          newValue: true,
        },
        {
          action: "created",
          timestamp: new Date("2025-09-01"),
          userId: (req as any).currentUser.id,
        },
      ],
      createdAt: new Date("2025-09-01"),
      updatedAt: new Date("2025-10-15"),
      createdBy: (req as any).currentUser.id,
    };

    res.json(flag);
  } catch (error) {
    logger.error({ error, flagId: id }, 'Error fetching feature flag');
    res.status(500).json({ message: "Failed to fetch feature flag" });
  }
});

/**
 * POST /api/feature-flags
 * Create a new feature flag
 */
router.post("/", async (req, res) => {
  try {
    const validation = createFlagSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const flagData = validation.data;

    // Check if flag key already exists
    // In production, check database

    const newFlag = {
      id: `flag-${Date.now()}`,
      key: flagData.key,
      name: flagData.name,
      description: flagData.description || null,
      enabled: flagData.enabled || false,
      targetingType: flagData.targetingType || "all",
      targetIds: flagData.targetIds || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: (req as any).currentUser.id,
    };

    res.status(201).json(newFlag);
  } catch (error) {
    logger.error({ error, key: flagData?.key, enabled: flagData?.enabled }, 'Error creating feature flag');
    res.status(500).json({ message: "Failed to create feature flag" });
  }
});

/**
 * PATCH /api/feature-flags/:id
 * Update a feature flag
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateFlagSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const updates = validation.data;

    // Mock update
    const updatedFlag = {
      id,
      ...updates,
      updatedAt: new Date(),
      updatedBy: (req as any).currentUser.id,
    };

    res.json(updatedFlag);
  } catch (error) {
    logger.error({ error, flagId: id, updates }, 'Error updating feature flag');
    res.status(500).json({ message: "Failed to update feature flag" });
  }
});

/**
 * PATCH /api/feature-flags/:id/toggle
 * Toggle a feature flag on/off
 */
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const validation = toggleFlagSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const { enabled } = validation.data;

    // Mock toggle
    const updatedFlag = {
      id,
      enabled,
      updatedAt: new Date(),
      toggledBy: (req as any).currentUser.id,
    };

    res.json(updatedFlag);
  } catch (error) {
    logger.error({ error, flagId: id, enabled }, 'Error toggling feature flag');
    res.status(500).json({ message: "Failed to toggle feature flag" });
  }
});

/**
 * DELETE /api/feature-flags/:id
 * Delete a feature flag
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // In production, soft delete or archive the flag
    res.json({ 
      message: "Feature flag deleted successfully", 
      id,
      deletedAt: new Date()
    });
  } catch (error) {
    logger.error({ error, flagId: id }, 'Error deleting feature flag');
    res.status(500).json({ message: "Failed to delete feature flag" });
  }
});

/**
 * POST /api/feature-flags/:id/evaluate
 * Evaluate if a flag is enabled for a specific context
 */
router.post("/:id/evaluate", async (req, res) => {
  try {
    const { id } = req.params;
    const validation = evaluateFlagSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const { userId, companyId } = validation.data;

    // Mock evaluation logic
    // In production, implement proper targeting logic
    const evaluation = {
      flagId: id,
      enabled: true,
      reason: "Flag enabled for all users",
      targetingMatch: true,
      evaluatedAt: new Date(),
      context: {
        userId,
        companyId,
      },
    };

    res.json(evaluation);
  } catch (error) {
    logger.error({ error, flagId: id, userId, companyId }, 'Error evaluating feature flag');
    res.status(500).json({ message: "Failed to evaluate feature flag" });
  }
});

/**
 * GET /api/feature-flags/:id/usage
 * Get usage statistics for a feature flag
 */
router.get("/:id/usage", async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = "7d" } = req.query;

    // Mock usage statistics
    const usage = {
      flagId: id,
      timeRange,
      totalEvaluations: 45678,
      uniqueUsers: 1234,
      enabledCount: 43210,
      disabledCount: 2468,
      averageEvaluationsPerDay: 6525,
      history: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        evaluations: Math.floor(Math.random() * 2000) + 5000,
        uniqueUsers: Math.floor(Math.random() * 500) + 1000,
        enabled: Math.floor(Math.random() * 1800) + 4500,
      })).reverse(),
    };

    res.json(usage);
  } catch (error) {
    logger.error({ error, flagId: id, timeRange }, 'Error fetching feature flag usage');
    res.status(500).json({ message: "Failed to fetch feature flag usage" });
  }
});

/**
 * POST /api/feature-flags/bulk-evaluate
 * Evaluate multiple flags at once
 */
router.post("/bulk-evaluate", async (req, res) => {
  try {
    const { userId, companyId, flagKeys } = req.body;

    if (!flagKeys || !Array.isArray(flagKeys)) {
      return res.status(400).json({ message: "flagKeys array required" });
    }

    // Mock bulk evaluation
    const evaluations = flagKeys.reduce((acc: any, key: string) => {
      acc[key] = {
        enabled: Math.random() > 0.3, // Random for demo
        reason: "Mock evaluation",
      };
      return acc;
    }, {});

    res.json({
      evaluations,
      context: {
        userId,
        companyId,
      },
      evaluatedAt: new Date(),
    });
  } catch (error) {
    logger.error({ error, flagCount: flagKeys?.length, userId, companyId }, 'Error bulk evaluating feature flags');
    res.status(500).json({ message: "Failed to bulk evaluate feature flags" });
  }
});

export default router;
