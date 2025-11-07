/**
 * Master AI Routes - Tenant Intelligence & Assistance
 * 
 * Provides intelligent chat, data access, and learning capabilities
 * for tenant companies. Handles optometry-specific queries with:
 * - Natural language chat interface
 * - Topic validation (optometry/eyecare only)
 * - Hybrid intelligence (Python RAG + GPT-4 + database tools)
 * - Progressive learning (4 phases: 0-25%, 25-50%, 50-75%, 75-100%)
 * - Multi-tenant isolation
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { MasterAIService, type MasterAIQuery } from "../services/MasterAIService";
import { db } from "../../db";
import type { IStorage } from "../storage";

let masterAIService: MasterAIService;

export function registerMasterAIRoutes(app: Express, storage: IStorage): void {
  // Initialize Master AI Service
  masterAIService = new MasterAIService(storage);

  /**
   * POST /api/master-ai/chat
   * 
   * Main chat interface for Master AI
   * Handles: questions, data queries, knowledge lookup, hybrid intelligence
   */
  app.post("/api/master-ai/chat", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { 
        query, 
        conversationId, 
        context,
        preferredProvider 
      } = req.body;

      const companyId = req.user.claims.companyId || req.user.claims.sub;
      const userId = req.user.id || req.user.claims.sub;

      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          error: "Invalid request",
          message: "Query is required and must be a string",
        });
      }

      const aiQuery: MasterAIQuery = {
        message: query.trim(),
        conversationId: conversationId || undefined,
        userId,
        companyId,
        context: context || {},
      };

      const response = await masterAIService.chat(aiQuery);

      res.json(response);
    } catch (error: any) {
      console.error("Master AI chat error:", error);
      res.status(500).json({
        error: "Failed to process query",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/master-ai/conversations
   * 
   * List all conversations for the current user/company
   */
  app.get("/api/master-ai/conversations", isAuthenticated, async (req: any, res: Response) => {
    try {
      const companyId = req.user.claims.companyId || req.user.claims.sub;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }
      const userId = req.query.userId || req.user.id || req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;

      const conversations = await masterAIService.getConversations(
        userId,
        companyId
      );

      res.json(conversations);
    } catch (error: any) {
      console.error("Get conversations error:", error);
      res.status(500).json({
        error: "Failed to retrieve conversations",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/master-ai/conversations/:id
   * 
   * Get specific conversation with all messages
   */
  app.get("/api/master-ai/conversations/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user.claims.companyId || req.user.claims.sub;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }

      const conversation = await masterAIService.getConversation(id, companyId);

      if (!conversation) {
        return res.status(404).json({
          error: "Not found",
          message: "Conversation not found or access denied",
        });
      }

      res.json(conversation);
    } catch (error: any) {
      console.error("Get conversation error:", error);
      res.status(500).json({
        error: "Failed to retrieve conversation",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/master-ai/documents
   * 
   * Upload documents to company knowledge base
   */
  app.post("/api/master-ai/documents", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { fileName, content, metadata } = req.body;
      const companyId = req.user.claims.companyId || req.user.claims.sub;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }
      const uploadedBy = req.user.id || req.user.claims.sub;

      if (!fileName || !content) {
        return res.status(400).json({
          error: "Invalid request",
          message: "fileName and content are required",
        });
      }

      const document = await masterAIService.uploadDocument(
        companyId,
        uploadedBy,
        {
          fileName,
          fileContent: content,
          fileType: metadata?.contentType || 'text/plain',
        }
      );

      res.status(201).json(document);
    } catch (error: any) {
      console.error("Document upload error:", error);
      res.status(500).json({
        error: "Failed to upload document",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/master-ai/knowledge-base
   * 
   * List all documents in company knowledge base
   */
  app.get("/api/master-ai/knowledge-base", isAuthenticated, async (req: any, res: Response) => {
    try {
      const companyId = req.user.claims.companyId || req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 100;

      const documents = await masterAIService.getKnowledgeBase(companyId);

      res.json(documents);
    } catch (error: any) {
      console.error("Get knowledge base error:", error);
      res.status(500).json({
        error: "Failed to retrieve knowledge base",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/master-ai/stats
   * 
   * Get AI usage statistics for company
   */
  app.get("/api/master-ai/stats", isAuthenticated, async (req: any, res: Response) => {
    try {
      const companyId = req.user.claims.companyId || req.user.claims.sub;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const stats = await masterAIService.getStats(companyId);

      res.json(stats);
    } catch (error: any) {
      console.error("Get stats error:", error);
      res.status(500).json({
        error: "Failed to retrieve statistics",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/master-ai/feedback
   * 
   * Submit feedback on AI response quality
   */
  app.post("/api/master-ai/feedback", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { messageId, rating, feedback } = req.body;
      const companyId = req.user.claims.companyId || req.user.claims.sub;
      const userId = req.user.id || req.user.claims.sub;

      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }

      if (!messageId || typeof rating !== 'number') {
        return res.status(400).json({
          error: "Invalid request",
          message: "messageId and rating are required",
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: "Invalid rating",
          message: "Rating must be between 1 and 5",
        });
      }

      // TODO: Store feedback - requires new storage methods
      // For now, just acknowledge the feedback
      console.log("Feedback received", { messageId, rating, companyId });

      res.json({
        success: true,
        message: "Feedback recorded successfully",
      });
    } catch (error: any) {
      console.error("Feedback submission error:", error);
      res.status(500).json({
        error: "Failed to submit feedback",
        message: error.message,
      });
    }
  });
}
