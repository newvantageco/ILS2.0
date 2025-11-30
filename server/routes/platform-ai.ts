/**
 * Platform AI API Routes
 *
 * Provides endpoints for the integrated AI layer:
 * - Natural language commands and queries
 * - Predictive insights and alerts
 * - Quick actions and suggestions
 * - Context-aware assistance
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PlatformAIService, AIContext, AICommand } from "../services/PlatformAIService";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";

const router = Router();
const logger = createLogger("PlatformAIRoutes");

// Initialize service lazily
let aiService: PlatformAIService | null = null;

function getAIService(): PlatformAIService {
  if (!aiService) {
    aiService = new PlatformAIService(storage);
  }
  return aiService;
}

// Middleware to extract AI context from request
function extractAIContext(req: Request): AIContext {
  const user = req.user as any;
  return {
    userId: user?.id || "anonymous",
    companyId: user?.companyId || "",
    role: user?.role || "guest",
    currentPage: req.headers["x-current-page"] as string | undefined,
    recentActions: req.headers["x-recent-actions"]
      ? (req.headers["x-recent-actions"] as string).split(",")
      : undefined,
    preferences: user?.aiPreferences,
  };
}

// Validation schemas
const commandSchema = z.object({
  type: z.enum(["query", "action", "analysis", "prediction"]).default("query"),
  input: z.string().min(1).max(5000),
  conversationId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(["image", "document", "data"]),
        content: z.string(),
        mimeType: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/platform-ai/command
 * Process an AI command (query, action, analysis, prediction)
 */
router.post("/command", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = commandSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: validation.error.errors,
      });
    }

    const context = extractAIContext(req);
    const command: AICommand = {
      ...validation.data,
      context,
    };

    const service = getAIService();
    const response = await service.processCommand(command);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error({ error }, "Failed to process AI command");
    next(error);
  }
});

/**
 * GET /api/platform-ai/insights
 * Get proactive insights for the current user/context
 */
router.get("/insights", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const context = extractAIContext(req);
    const service = getAIService();
    const insights = await service.generateProactiveInsights(context);

    res.json({
      success: true,
      data: {
        insights,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to get AI insights");
    next(error);
  }
});

/**
 * GET /api/platform-ai/alerts
 * Get predictive alerts for the current user/context
 */
router.get("/alerts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const context = extractAIContext(req);
    const service = getAIService();
    const alerts = await service.generatePredictiveAlerts(context);

    res.json({
      success: true,
      data: {
        alerts,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to get AI alerts");
    next(error);
  }
});

/**
 * GET /api/platform-ai/quick-actions
 * Get context-aware quick actions
 */
router.get("/quick-actions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const context = extractAIContext(req);
    const service = getAIService();
    const actions = await service.getQuickActions(context);

    res.json({
      success: true,
      data: {
        actions,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to get quick actions");
    next(error);
  }
});

/**
 * POST /api/platform-ai/chat
 * Unified chat endpoint (replaces /api/master-ai/chat)
 */
router.post("/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, conversationId } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query is required",
      });
    }

    const context = extractAIContext(req);
    const command: AICommand = {
      type: "query",
      input: query,
      context,
      conversationId,
    };

    const service = getAIService();
    const response = await service.processCommand(command);

    res.json({
      success: true,
      response: response.content,
      confidence: response.confidence,
      sources: response.sources,
      suggestedActions: response.actions,
      followUpQuestions: response.followUpQuestions,
      insights: response.relatedInsights,
      conversationId: response.id,
    });
  } catch (error) {
    logger.error({ error }, "Failed to process chat");
    next(error);
  }
});

/**
 * GET /api/platform-ai/suggestions
 * Get AI-powered suggestions based on context
 */
router.get("/suggestions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const context = extractAIContext(req);
    const service = getAIService();

    const [insights, alerts, actions] = await Promise.all([
      service.generateProactiveInsights(context),
      service.generatePredictiveAlerts(context),
      service.getQuickActions(context),
    ]);

    res.json({
      success: true,
      data: {
        insights: insights.slice(0, 3),
        alerts: alerts.slice(0, 5),
        quickActions: actions.slice(0, 6),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to get suggestions");
    next(error);
  }
});

/**
 * POST /api/platform-ai/analyze
 * Request analysis on a specific topic
 */
router.post("/analyze", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, timeframe, filters } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({
        success: false,
        error: "Topic is required",
      });
    }

    const context = extractAIContext(req);
    const command: AICommand = {
      type: "analysis",
      input: `Analyze ${topic}${timeframe ? ` for ${timeframe}` : ""}`,
      context,
    };

    const service = getAIService();
    const response = await service.processCommand(command);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error({ error }, "Failed to run analysis");
    next(error);
  }
});

/**
 * POST /api/platform-ai/predict
 * Request a prediction on a specific metric
 */
router.post("/predict", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { metric, timeframe } = req.body;

    if (!metric || typeof metric !== "string") {
      return res.status(400).json({
        success: false,
        error: "Metric is required",
      });
    }

    const context = extractAIContext(req);
    const command: AICommand = {
      type: "prediction",
      input: `Predict ${metric} for ${timeframe || "next month"}`,
      context,
    };

    const service = getAIService();
    const response = await service.processCommand(command);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error({ error }, "Failed to generate prediction");
    next(error);
  }
});

export default router;
