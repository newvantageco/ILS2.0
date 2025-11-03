import { Router } from "express";
import { UnifiedAIService } from "../services/UnifiedAIService";
import type { IStorage } from "../storage";
import { authenticateUser } from "../middleware/auth";

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
   */
  router.post("/chat", authenticateUser, async (req, res) => {
    try {
      const { message, conversationId, context } = req.body;
      const user = (req as any).user;

      // Validate request
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Message is required"
        });
      }

      // Build query
      const query = {
        message: message.trim(),
        companyId: user.companyId,
        userId: user.userId,
        conversationId: conversationId || undefined,
        context: context || {}
      };

      // Get AI response
      const response = await aiService.chat(query);

      // Return response
      return res.json({
        success: true,
        data: {
          answer: response.answer,
          confidence: response.confidence,
          conversationId: response.conversationId,
          sources: response.sources,
          toolsUsed: response.toolsUsed,
          metadata: response.metadata
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

  return router;
}
