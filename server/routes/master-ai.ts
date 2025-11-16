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
import { createLogger } from "../utils/logger";

const logger = createLogger('master-ai');

let masterAIService: MasterAIService;

export function registerMasterAIRoutes(app: Express, storage: IStorage): void {
  // Initialize Master AI Service
  masterAIService = new MasterAIService(storage);

  /**
   * @swagger
   * /api/master-ai/chat:
   *   post:
   *     summary: Chat with Master AI
   *     description: |
   *       Main chat interface for Master AI tenant intelligence. Provides intelligent
   *       assistance with optometry-specific queries, data access, and knowledge lookup.
   *
   *       **Features:**
   *       - Topic validation (optometry/eyecare only)
   *       - Hybrid intelligence (Python RAG + GPT-4 + database tools)
   *       - Progressive learning capabilities
   *       - Multi-tenant isolation
   *     tags:
   *       - Master AI
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - query
   *             properties:
   *               query:
   *                 type: string
   *                 description: The user's question or query
   *                 example: "What are progressive lenses?"
   *               conversationId:
   *                 type: string
   *                 description: Optional conversation ID to continue existing chat
   *                 example: "conv-123abc"
   *               context:
   *                 type: object
   *                 description: Additional context for the query
   *                 example: { patientId: "pat-456" }
   *               preferredProvider:
   *                 type: string
   *                 enum: [openai, anthropic, ollama]
   *                 description: Preferred AI provider
   *                 example: "openai"
   *     responses:
   *       200:
   *         description: Successful response from AI
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 response:
   *                   type: string
   *                   description: AI-generated response
   *                 conversationId:
   *                   type: string
   *                   description: Conversation ID for follow-up
   *                 isRelevant:
   *                   type: boolean
   *                   description: Whether query is optometry-related
   *                 rejectionReason:
   *                   type: string
   *                   description: Reason if query was rejected
   *                 sources:
   *                   type: array
   *                   description: Knowledge base sources used
   *                   items:
   *                     type: object
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
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
      logger.error({ error, query, companyId, userId }, 'Master AI chat error');
      res.status(500).json({
        error: "Failed to process query",
        message: error.message,
      });
    }
  });

  /**
   * @swagger
   * /api/master-ai/conversations:
   *   get:
   *     summary: List AI conversations
   *     description: Retrieve all Master AI conversations for the current user/company
   *     tags:
   *       - Master AI
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *         description: Filter by specific user ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Maximum number of conversations to return
   *     responses:
   *       200:
   *         description: List of conversations
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   userId:
   *                     type: string
   *                   companyId:
   *                     type: string
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                   lastMessageAt:
   *                     type: string
   *                     format: date-time
   *                   messageCount:
   *                     type: integer
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
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
      logger.error({ error, userId, companyId, limit }, 'Get conversations error');
      res.status(500).json({
        error: "Failed to retrieve conversations",
        message: error.message,
      });
    }
  });

  /**
   * @swagger
   * /api/master-ai/conversations/{id}:
   *   get:
   *     summary: Get conversation details
   *     description: Retrieve a specific conversation with all messages
   *     tags:
   *       - Master AI
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Conversation ID
   *     responses:
   *       200:
   *         description: Conversation details with messages
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 userId:
   *                   type: string
   *                 companyId:
   *                   type: string
   *                 messages:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       role:
   *                         type: string
   *                         enum: [user, assistant]
   *                       content:
   *                         type: string
   *                       timestamp:
   *                         type: string
   *                         format: date-time
   *       404:
   *         description: Conversation not found
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
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
      logger.error({ error, conversationId: id, companyId }, 'Get conversation error');
      res.status(500).json({
        error: "Failed to retrieve conversation",
        message: error.message,
      });
    }
  });

  /**
   * @swagger
   * /api/master-ai/documents:
   *   post:
   *     summary: Upload document to knowledge base
   *     description: Upload a document to the company's knowledge base for AI reference
   *     tags:
   *       - Master AI
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fileName
   *               - content
   *             properties:
   *               fileName:
   *                 type: string
   *                 description: Name of the document
   *                 example: "lens-catalog-2024.pdf"
   *               content:
   *                 type: string
   *                 description: Document content (text or base64 encoded)
   *               metadata:
   *                 type: object
   *                 properties:
   *                   contentType:
   *                     type: string
   *                     example: "application/pdf"
   *                   tags:
   *                     type: array
   *                     items:
   *                       type: string
   *     responses:
   *       201:
   *         description: Document uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 fileName:
   *                   type: string
   *                 uploadedAt:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
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
      logger.error({ error, fileName, companyId, uploadedBy }, 'Document upload error');
      res.status(500).json({
        error: "Failed to upload document",
        message: error.message,
      });
    }
  });

  /**
   * @swagger
   * /api/master-ai/knowledge-base:
   *   get:
   *     summary: List knowledge base documents
   *     description: Retrieve all documents in the company's knowledge base
   *     tags:
   *       - Master AI
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of documents to return
   *     responses:
   *       200:
   *         description: List of knowledge base documents
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   fileName:
   *                     type: string
   *                   fileType:
   *                     type: string
   *                   uploadedBy:
   *                     type: string
   *                   uploadedAt:
   *                     type: string
   *                     format: date-time
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  app.get("/api/master-ai/knowledge-base", isAuthenticated, async (req: any, res: Response) => {
    try {
      const companyId = req.user.claims.companyId || req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 100;

      const documents = await masterAIService.getKnowledgeBase(companyId);

      res.json(documents);
    } catch (error: any) {
      logger.error({ error, companyId, limit }, 'Get knowledge base error');
      res.status(500).json({
        error: "Failed to retrieve knowledge base",
        message: error.message,
      });
    }
  });

  /**
   * @swagger
   * /api/master-ai/stats:
   *   get:
   *     summary: Get AI usage statistics
   *     description: Retrieve AI usage statistics and analytics for the company
   *     tags:
   *       - Master AI
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for statistics (defaults to 30 days ago)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for statistics (defaults to today)
   *     responses:
   *       200:
   *         description: Usage statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalQueries:
   *                   type: integer
   *                 totalConversations:
   *                   type: integer
   *                 averageResponseTime:
   *                   type: number
   *                 topTopics:
   *                   type: array
   *                   items:
   *                     type: object
   *                 providerUsage:
   *                   type: object
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
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
      logger.error({ error, companyId, startDate, endDate }, 'Get stats error');
      res.status(500).json({
        error: "Failed to retrieve statistics",
        message: error.message,
      });
    }
  });

  /**
   * @swagger
   * /api/master-ai/feedback:
   *   post:
   *     summary: Submit AI response feedback
   *     description: Provide feedback on AI response quality to improve future responses
   *     tags:
   *       - Master AI
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - messageId
   *               - rating
   *             properties:
   *               messageId:
   *                 type: string
   *                 description: ID of the AI message being rated
   *                 example: "msg-123abc"
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 description: Rating from 1 (poor) to 5 (excellent)
   *                 example: 4
   *               feedback:
   *                 type: string
   *                 description: Optional detailed feedback text
   *                 example: "Response was helpful but could be more concise"
   *     responses:
   *       200:
   *         description: Feedback recorded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid request (missing fields or invalid rating)
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
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
      logger.info({ messageId, rating, companyId, userId, feedback }, 'Feedback received');

      res.json({
        success: true,
        message: "Feedback recorded successfully",
      });
    } catch (error: any) {
      logger.error({ error, messageId, rating, companyId, userId }, 'Feedback submission error');
      res.status(500).json({
        error: "Failed to submit feedback",
        message: error.message,
      });
    }
  });
}
