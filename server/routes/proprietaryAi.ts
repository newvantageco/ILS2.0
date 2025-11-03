/**
 * Proprietary AI API Routes
 * 
 * Tenant-specific AI assistant for optometry and spectacle dispensing
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import type { IStorage } from "../storage";
import { ProprietaryAIService } from "../services/ProprietaryAIService";
import { createLogger } from "../utils/logger";

const logger = createLogger("ProprietaryAIRoutes");

// Helper function to get authenticated user with companyId
async function getAuthenticatedUser(req: any, storage: IStorage): Promise<any> {
  const userId = req.user?.claims?.sub || req.user?.id;
  const user = await storage.getUser(userId);
  return user;
}

export function registerProprietaryAIRoutes(app: Express, storage: IStorage) {
  const aiService = new ProprietaryAIService(storage);

  /**
   * POST /api/proprietary-ai/ask
   * Ask the proprietary AI a question (optometry/spectacle dispensing only)
   */
  app.post("/api/proprietary-ai/ask", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req, storage);
      const { question, conversationId, context } = req.body;

      if (!user || !user.companyId) {
        return res.status(403).json({ error: "User must belong to a company" });
      }

      if (!question || question.trim().length === 0) {
        return res.status(400).json({ error: "Question is required" });
      }

      logger.info("Proprietary AI query", {
        userId: user.id,
        companyId: user.companyId,
        questionLength: question.length
      });

      const response = await aiService.ask({
        question,
        companyId: user.companyId,
        userId: user.id!,
        conversationId,
        context
      });

      res.json(response);
    } catch (error) {
      logger.error("Error in proprietary AI ask", error as Error);
      res.status(500).json({ error: "Failed to process question" });
    }
  });

  /**
   * POST /api/proprietary-ai/conversation/new
   * Start a new conversation
   */
  app.post("/api/proprietary-ai/conversation/new", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req, storage);
      const { title } = req.body;

      if (!user || !user.companyId) {
        return res.status(403).json({ error: "User must belong to a company" });
      }

      const conversation = await storage.createAiConversation({
        companyId: user.companyId,
        userId: user.id!,
        title: title || "New Conversation",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.json(conversation);
    } catch (error) {
      logger.error("Error creating conversation", error as Error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  /**
   * GET /api/proprietary-ai/conversations
   * Get user's conversations
   */
  app.get("/api/proprietary-ai/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req, storage);

      if (!user || !user.companyId) {
        return res.status(403).json({ error: "User must belong to a company" });
      }

      const conversations = await storage.getAiConversations(user.companyId, user.id);
      res.json(conversations);
    } catch (error) {
      logger.error("Error fetching conversations", error as Error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  /**
   * GET /api/proprietary-ai/conversation/:id
   * Get conversation with messages
   */
  app.get("/api/proprietary-ai/conversation/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const conversationId = req.params.id;

      const conversation = await storage.getAiConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (conversation.userId !== user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getAiMessages(conversationId);

      res.json({ conversation, messages });
    } catch (error) {
      logger.error("Error fetching conversation", error as Error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  /**
   * POST /api/proprietary-ai/feedback
   * Provide feedback on AI response
   */
  app.post("/api/proprietary-ai/feedback", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req, storage);

      const { messageId, rating, helpful, accurate, comments } = req.body;

      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const feedback = await storage.createAiFeedback({
        messageId,
        userId: user.id,
        companyId: user.companyId,
        rating: rating ? parseInt(rating) : 0,
        helpful: helpful === true,
        accurate: accurate === true,
        comments: comments || null,
        createdAt: new Date()
      });

      res.json(feedback);
    } catch (error) {
      logger.error("Error saving feedback", error as Error);
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  /**
   * GET /api/proprietary-ai/stats
   * Get AI usage statistics for company
   */
  app.get("/api/proprietary-ai/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req, storage);

      if (!user || !user.companyId) {
        return res.status(403).json({ error: "User must belong to a company" });
      }

      const conversations = await storage.getAiConversations(user.companyId);
      const learningData = await storage.getAiLearningDataByCompany(user.companyId);
      const knowledgeBase = await storage.getAiKnowledgeBaseByCompany(user.companyId);

      // Calculate stats
      const totalConversations = conversations.length;
      const totalMessages = await Promise.all(
        conversations.map((c: any) => storage.getAiMessages(c.id))
      ).then(results => results.flat().length);

      const externalAIUsage = learningData.filter(l => 
        l.sourceType === 'external_ai'
      ).length;

      const localAnswers = learningData.filter(l => 
        l.sourceType !== 'external_ai'
      ).length;

      const autonomyRate = totalMessages > 0 
        ? ((localAnswers / (localAnswers + externalAIUsage)) * 100).toFixed(1)
        : '0';

      res.json({
        totalConversations,
        totalMessages,
        externalAIUsage,
        localAnswers,
        autonomyRate: parseFloat(autonomyRate),
        knowledgeBaseDocuments: knowledgeBase.length,
        learnedPatterns: learningData.length,
        domain: 'Optometry & Spectacle Dispensing'
      });
    } catch (error) {
      logger.error("Error fetching stats", error as Error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  /**
   * GET /api/proprietary-ai/learning-progress
   * Get learning progress for company
   */
  app.get("/api/proprietary-ai/learning-progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req, storage);

      if (!user || !user.companyId) {
        return res.status(403).json({ error: "User must belong to a company" });
      }

      const learningData = await storage.getAiLearningDataByCompany(user.companyId);
      const knowledgeBase = await storage.getAiKnowledgeBaseByCompany(user.companyId);

      const totalLearning = learningData.length;
      const totalDocuments = knowledgeBase.length;
      const totalKnowledge = totalLearning + (totalDocuments * 10); // Documents worth 10 points each

      // Calculate progress (0-100%)
      const progress = Math.min((totalKnowledge / 500) * 100, 100);

      let phase: string;
      if (progress >= 75) phase = 'Expert';
      else if (progress >= 50) phase = 'Advanced';
      else if (progress >= 25) phase = 'Learning';
      else phase = 'Beginner';

      res.json({
        progress: Math.round(progress),
        phase,
        totalLearning,
        totalDocuments,
        lastUpdated: learningData.length > 0 
          ? learningData[learningData.length - 1].createdAt 
          : null,
        domain: 'Optometry & Spectacle Dispensing',
        capabilities: {
          optometry: progress >= 25,
          spectacleDispensing: progress >= 25,
          lensManufacturing: progress >= 50,
          prescriptionInterpretation: progress >= 25,
          frameFitting: progress >= 50,
          advancedDiagnostics: progress >= 75
        }
      });
    } catch (error) {
      logger.error("Error fetching learning progress", error as Error);
      res.status(500).json({ error: "Failed to fetch learning progress" });
    }
  });

  logger.info("Proprietary AI routes registered");
}
