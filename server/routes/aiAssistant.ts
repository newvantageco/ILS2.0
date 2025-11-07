/**
 * AI Assistant Routes
 * 
 * Company-specific AI assistant that learns over time
 * 
 * Routes:
 * POST /api/ai-assistant/ask - Ask a question
 * GET /api/ai-assistant/conversations - Get user's conversations
 * GET /api/ai-assistant/conversations/:id - Get specific conversation with messages
 * POST /api/ai-assistant/conversations/:id/feedback - Provide feedback on answer
 * 
 * POST /api/ai-assistant/knowledge/upload - Upload document
 * GET /api/ai-assistant/knowledge - Get company knowledge base
 * DELETE /api/ai-assistant/knowledge/:id - Delete knowledge base entry
 * 
 * GET /api/ai-assistant/learning-progress - Get company's AI learning progress
 * GET /api/ai-assistant/stats - Get AI usage statistics
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { checkSubscription } from "../middleware/subscription";
import { AIAssistantService } from "../services/AIAssistantService";
import { storage } from "../storage";
import { z } from "zod";
import multer from "multer";
import path from "path";

let aiAssistantService: AIAssistantService;

// Helper function to get authenticated user with companyId
async function getAuthenticatedUser(req: any): Promise<any> {
  const userId = req.user?.claims?.sub || req.user?.id;
  const user = await storage.getUserById_Internal(userId);
  return user;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/csv',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, TXT, CSV, and JSON files are allowed.'));
    }
  }
});

// Validation schemas
const askQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  conversationId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

const feedbackSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  rating: z.number().min(1).max(5),
  helpful: z.boolean().optional(),
  accurate: z.boolean().optional(),
  comments: z.string().optional(),
});

export function registerAiAssistantRoutes(app: Express): void {
  // Initialize service
  aiAssistantService = new AIAssistantService(storage);

  /**
   * POST /api/ai-assistant/ask
   * 
   * Ask the AI assistant a question
   * Protected by authentication and subscription check
   * 
   * Request body:
   * {
   *   question: string,
   *   conversationId?: string,
   *   context?: object
   * }
   */
  app.post("/api/ai-assistant/ask", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company to use AI assistant",
        });
      }

      const validation = askQuestionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { question, conversationId, context } = validation.data;

      // Get company config
      const company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(404).json({
          error: "Company not found",
        });
      }

      if (!company.aiEnabled) {
        return res.status(403).json({
          error: "AI assistant is disabled for your company",
        });
      }

      const config = {
        companyId: user.companyId,
        useExternalAi: company.useExternalAi ?? true,
        learningProgress: company.aiLearningProgress ?? 0,
        model: company.aiModel ?? 'gpt-4',
      };

      const response = await aiAssistantService.ask(
        {
          question,
          conversationId,
          context,
          userId: user.id,
        },
        config
      );

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      console.error("Error asking AI assistant:", error);
      res.status(500).json({
        error: "AI assistant error",
        message: error.message || "Failed to process question",
      });
    }
  });

  /**
   * GET /api/ai-assistant/conversations
   * 
   * Get user's conversations
   * Protected by authentication and subscription check
   * 
   * Query params:
   * ?limit=20&offset=0
   */
  app.get("/api/ai-assistant/conversations", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company",
        });
      }

      const conversations = await storage.getAiConversations(user.companyId, user.id);

      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error: any) {
      console.error("Error getting conversations:", error);
      res.status(500).json({
        error: "Failed to get conversations",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/ai-assistant/conversations/:id
   * 
   * Get specific conversation with all messages
   * Protected by authentication and subscription check
   */
  app.get("/api/ai-assistant/conversations/:id", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { id } = req.params;

      const conversation = await storage.getAiConversation(id);
      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found",
        });
      }

      // Check access - user must belong to same company
      if (conversation.companyId !== user.companyId) {
        return res.status(403).json({
          error: "Access denied",
        });
      }

      const messages = await storage.getAiMessages(id);

      res.status(200).json({
        success: true,
        data: {
          conversation,
          messages,
        },
      });
    } catch (error: any) {
      console.error("Error getting conversation:", error);
      res.status(500).json({
        error: "Failed to get conversation",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/ai-assistant/conversations/:id/feedback
   * 
   * Provide feedback on an AI response
   * Protected by authentication and subscription check
   * 
   * Request body:
   * {
   *   messageId: string,
   *   rating: number (1-5),
   *   helpful?: boolean,
   *   accurate?: boolean,
   *   comments?: string
   * }
   */
  app.post("/api/ai-assistant/conversations/:id/feedback", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { id: conversationId } = req.params;

      const validation = feedbackSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { messageId, rating, helpful, accurate, comments } = validation.data;

      // Verify conversation access
      const conversation = await storage.getAiConversation(conversationId);
      if (!conversation || conversation.companyId !== user.companyId) {
        return res.status(403).json({
          error: "Access denied",
        });
      }

      const feedback = await storage.createAiFeedback({
        messageId,
        userId: user.id,
        companyId: user.companyId,
        rating,
        helpful,
        accurate,
        comments,
      });

      res.status(200).json({
        success: true,
        data: feedback,
      });
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({
        error: "Failed to submit feedback",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/ai-assistant/knowledge/upload
   * 
   * Upload a document to the knowledge base
   * Protected by authentication and subscription check
   * 
   * Multipart form data:
   * - file: the document file
   * - category?: string (optional category)
   */
  app.post("/api/ai-assistant/knowledge/upload", 
    isAuthenticated, 
    checkSubscription,
    upload.single('file'), 
    async (req: any, res: Response) => {
      try {
        const user = await getAuthenticatedUser(req);
        if (!user.companyId) {
          return res.status(403).json({
            error: "User must belong to a company",
          });
        }

        if (!req.file) {
          return res.status(400).json({
            error: "No file uploaded",
          });
        }

        const file = req.file;
        
        // Extract text content (simplified - in production, use proper parsers)
        const content = file.buffer.toString('utf-8');
        
        const knowledge = await aiAssistantService.processDocument(
          user.companyId,
          user.id,
          {
            filename: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            content,
          }
        );

        res.status(200).json({
          success: true,
          data: knowledge,
          message: "Document uploaded and processed successfully",
        });
      } catch (error: any) {
        console.error("Error uploading document:", error);
        res.status(500).json({
          error: "Upload failed",
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/ai-assistant/knowledge
   * 
   * Get company's knowledge base
   * Protected by authentication and subscription check
   * 
   * Query params:
   * ?category=pricing&active=true
   */
  app.get("/api/ai-assistant/knowledge", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company",
        });
      }

      const knowledge = await storage.getAiKnowledgeBaseByCompany(user.companyId);

      res.status(200).json({
        success: true,
        data: knowledge,
      });
    } catch (error: any) {
      console.error("Error getting knowledge base:", error);
      res.status(500).json({
        error: "Failed to get knowledge base",
        message: error.message,
      });
    }
  });

  /**
   * DELETE /api/ai-assistant/knowledge/:id
   * 
   * Delete a knowledge base entry
   * Protected by authentication and subscription check
   */
  app.delete("/api/ai-assistant/knowledge/:id", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { id } = req.params;

      const knowledge = await storage.getAiKnowledgeBase(id);
      if (!knowledge) {
        return res.status(404).json({
          error: "Knowledge base entry not found",
        });
      }

      // Check access
      if (knowledge.companyId !== user.companyId) {
        return res.status(403).json({
          error: "Access denied",
        });
      }

      await storage.deleteAiKnowledgeBase(id);

      res.status(200).json({
        success: true,
        message: "Knowledge base entry deleted",
      });
    } catch (error: any) {
      console.error("Error deleting knowledge base entry:", error);
      res.status(500).json({
        error: "Failed to delete knowledge base entry",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/ai-assistant/learning-progress
   * 
   * Get company's AI learning progress
   * Protected by authentication and subscription check
   */
  app.get("/api/ai-assistant/learning-progress", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company",
        });
      }

      const company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(404).json({
          error: "Company not found",
        });
      }

      const learningData = await storage.getAiLearningDataByCompany(user.companyId);
      const knowledgeBase = await storage.getAiKnowledgeBaseByCompany(user.companyId);
      const conversations = await storage.getAiConversations(user.companyId);

      const progress = company.aiLearningProgress ?? 0;
      
      res.status(200).json({
        success: true,
        data: {
          progress,
          useExternalAi: company.useExternalAi ?? true,
          stats: {
            learnedQA: learningData.length,
            documents: knowledgeBase.length,
            conversations: conversations.length,
            avgConfidence: learningData.length > 0
              ? learningData.reduce((sum, l) => sum + parseFloat(l.confidence || '0'), 0) / learningData.length
              : 0,
          },
          status: progress >= 75 
            ? 'mostly_autonomous' 
            : progress >= 50 
            ? 'learning'
            : progress >= 25
            ? 'early_learning'
            : 'beginner',
        },
      });
    } catch (error: any) {
      console.error("Error getting learning progress:", error);
      res.status(500).json({
        error: "Failed to get learning progress",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/ai-assistant/stats
   * 
   * Get AI usage statistics for company
   * Protected by authentication and subscription check
   */
  app.get("/api/ai-assistant/stats", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company",
        });
      }

      const conversations = await storage.getAiConversations(user.companyId);
      const learningData = await storage.getAiLearningDataByCompany(user.companyId);
      const feedback = await storage.getAiFeedbackByCompany(user.companyId);

      // Calculate statistics
      const totalMessages = await Promise.all(
        conversations.map(c => storage.getAiMessages(c.id))
      ).then(messages => messages.flat());

      const externalAiUsage = totalMessages.filter(m => m.usedExternalAi && m.role === 'assistant').length;
      const localAnswers = totalMessages.filter(m => !m.usedExternalAi && m.role === 'assistant').length;

      const avgRating = feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : 0;

      res.status(200).json({
        success: true,
        data: {
          totalConversations: conversations.length,
          totalMessages: totalMessages.length,
          externalAiUsage,
          localAnswers,
          autonomyRate: totalMessages.length > 0 
            ? (localAnswers / totalMessages.length) * 100 
            : 0,
          learningEntries: learningData.length,
          avgUserRating: avgRating,
          totalFeedback: feedback.length,
        },
      });
    } catch (error: any) {
      console.error("Error getting stats:", error);
      res.status(500).json({
        error: "Failed to get stats",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/ai-assistant/train
   * 
   * Start training the neural network for the company
   * Protected by authentication and subscription check
   * 
   * Body: {
   *   epochs?: number,
   *   batchSize?: number
   * }
   */
  app.post("/api/ai-assistant/train", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company",
        });
      }

      const { epochs, batchSize } = req.body;

      const result = await aiAssistantService.trainNeuralNetwork(
        user.companyId,
        { epochs, batchSize }
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          progress: result.progress
        });
      }

      res.status(200).json({
        success: true,
        message: "Neural network training started",
        data: {
          progress: result.progress
        }
      });
    } catch (error: any) {
      console.error("Error starting training:", error);
      res.status(500).json({
        error: "Failed to start training",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/ai-assistant/training-status
   * 
   * Get neural network training status
   * Protected by authentication and subscription check
   */
  app.get("/api/ai-assistant/training-status", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company",
        });
      }

      const status = await aiAssistantService.getNeuralNetworkStatus(user.companyId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error("Error getting training status:", error);
      res.status(500).json({
        error: "Failed to get training status",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/ai-assistant/settings
   * 
   * Get AI provider settings and availability
   * Protected by authentication and subscription check
   */
  app.get("/api/ai-assistant/settings", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company",
        });
      }

      const company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Get learning progress
      const progressData = await storage.getAiLearningDataByCompany(user.companyId);
      const learningProgress = progressData.length > 0 
        ? Math.min(100, (progressData.length / 100) * 100) 
        : 0;

      // Get external AI availability
      const externalAIAvailability = aiAssistantService.getExternalAIAvailability();

      res.status(200).json({
        provider: 'openai', // Default provider
        model: 'gpt-4-turbo-preview', // Default model
        openaiAvailable: externalAIAvailability.openaiAvailable,
        anthropicAvailable: externalAIAvailability.anthropicAvailable,
        learningProgress: Math.floor(learningProgress),
      });
    } catch (error: any) {
      console.error("Error getting AI settings:", error);
      res.status(500).json({
        error: "Failed to get AI settings",
        message: error.message,
      });
    }
  });

  /**
   * PUT /api/ai-assistant/settings
   * 
   * Update AI provider settings (stored in user session for now)
   * Protected by authentication and subscription check
   */
  app.put("/api/ai-assistant/settings", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user.companyId) {
        return res.status(403).json({
          error: "User must belong to a company",
        });
      }

      const { provider, model } = req.body;

      if (!provider || !model) {
        return res.status(400).json({
          error: "Provider and model are required",
        });
      }

      // Store in session for now (can be persisted to DB later)
      req.session.aiProvider = provider;
      req.session.aiModel = model;

      res.status(200).json({
        success: true,
        message: "AI settings updated",
        data: { provider, model }
      });
    } catch (error: any) {
      console.error("Error updating AI settings:", error);
      res.status(500).json({
        error: "Failed to update AI settings",
        message: error.message,
      });
    }
  });
}

export function getAiAssistantService() {
  return aiAssistantService;
}
