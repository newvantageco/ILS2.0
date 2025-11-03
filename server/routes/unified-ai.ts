import { Router } from "express";
import { UnifiedAIService } from "../services/UnifiedAIService";
import type { IStorage } from "../storage";
import { authenticateUser } from "../middleware/auth";
import { checkSubscription, isFeatureAllowed } from "../middleware/subscription";
import { aiRateLimiter } from "../middleware/rateLimiting";

/**
 * Unified AI API Routes
 * Consolidates all AI functionality into single endpoint
 */
export function createUnifiedAIRoutes(storage: IStorage): Router {
  const router = Router();
  const aiService = new UnifiedAIService(storage);

  /**
   * POST /api/ai/chat
   * Unified chat endpoint for all AI interactions
   * Protected by authentication, subscription check, and rate limiting
   */
  router.post("/chat", authenticateUser, checkSubscription, aiRateLimiter, async (req, res) => {
    try {
      const { message, conversationId, context } = req.body;
      const user = (req as any).user;
      const subscription = (req as any).subscription;

      // Validate request
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Message is required"
        });
      }

      // Determine query type from context
      const queryType = context?.queryType || 'ophthalmic_knowledge';

      // Check feature access (unless platform admin)
      if (!subscription.isPlatformAdmin && !isFeatureAllowed(queryType, subscription)) {
        return res.status(403).json({
          success: false,
          error: 'Feature not available in your subscription plan',
          upgradeRequired: true,
          requiredFeature: queryType,
          currentPlan: subscription.companyPlan,
          message: `Upgrade to access ${queryType} features`
        });
      }

      // Build query with subscription context
      const query = {
        message: message.trim(),
        companyId: user.companyId,
        userId: user.userId,
        conversationId: conversationId || undefined,
        context: {
          ...context,
          subscriptionTier: subscription.companyPlan,
          isPlatformAdmin: subscription.isPlatformAdmin,
          allowedFeatures: subscription.allowedFeatures
        }
      };

      // Get AI response
      const response = await aiService.chat(query);

      // Return response with subscription info
      return res.json({
        success: true,
        data: {
          answer: response.answer,
          confidence: response.confidence,
          conversationId: response.conversationId,
          sources: response.sources,
          toolsUsed: response.toolsUsed,
          metadata: {
            ...response.metadata,
            subscriptionPlan: subscription.companyPlan,
            isPlatformAdmin: subscription.isPlatformAdmin
          }
        }
      });

    } catch (error: any) {
      console.error("Unified AI chat error:", error);
      
      return res.status(500).json({
        success: false,
        error: error.message || "An error occurred processing your request"
      });
    }
  });

  /**
   * GET /api/ai/health
   * Health check for AI services
   */
  router.get("/health", async (req, res) => {
    try {
      // TODO: Add actual health checks for Python RAG and OpenAI
      return res.json({
        success: true,
        services: {
          unified: "operational",
          rag: "unknown",
          openai: "unknown"
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Health check failed"
      });
    }
  });

  /**
   * GET /api/ai/usage
   * Get current AI usage statistics for the authenticated user's company
   */
  router.get("/usage", authenticateUser, checkSubscription, async (req, res) => {
    try {
      const user = (req as any).user;
      const subscription = (req as any).subscription;

      // Get rate limit headers from previous requests
      const limit = res.getHeader('X-RateLimit-Limit') as string;
      const remaining = res.getHeader('X-RateLimit-Remaining') as string;
      const resetAt = res.getHeader('X-RateLimit-Reset') as string;

      return res.json({
        success: true,
        data: {
          subscriptionPlan: subscription.companyPlan,
          allowedFeatures: subscription.allowedFeatures,
          isPlatformAdmin: subscription.isPlatformAdmin,
          rateLimit: {
            limit: limit ? parseInt(limit) : 1000,
            remaining: remaining ? parseInt(remaining) : 1000,
            resetAt: resetAt || new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error("Usage stats error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch usage statistics"
      });
    }
  });

  return router;
}
