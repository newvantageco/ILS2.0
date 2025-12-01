/**
 * Unified AI Routes
 *
 * Consolidates all AI endpoints into a single router:
 * - /api/ai/chat - Conversational AI
 * - /api/ai/conversations - Conversation management
 * - /api/ai/briefing - Daily insights briefing
 * - /api/ai/predictions/:type - Demand/stockout/staffing forecasts
 * - /api/ai/actions - Execute autonomous actions
 * - /api/ai/quick-actions - Get suggested actions
 * - /api/ai/feedback - Submit feedback on AI responses
 *
 * SECURITY:
 * - All routes require authentication via secureRoute()
 * - Tenant isolation via setTenantContext middleware
 * - Rate limiting via aiQueryLimiter
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../../../db';
import { aiConversations, aiMessages, aiFeedback } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createUnifiedAIService } from '../../../services/unified-ai';
import { secureRoute } from '../../../middleware/secureRoute';
import { aiQueryLimiter } from '../../../middleware/rateLimiter';
import { createLogger } from '../../../utils/logger';
import { asyncHandler } from '../../../middleware/errorHandler';

const router = Router();
const logger = createLogger('AIRoutes');

// ============================================
// VALIDATION SCHEMAS
// ============================================

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
  context: z.record(z.any()).optional(),
});

const feedbackSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const actionSchema = z.object({
  type: z.enum(['create_purchase_order', 'send_reminder', 'update_inventory', 'generate_report']),
  params: z.record(z.any()),
});

const quickActionsSchema = z.object({
  currentPage: z.string().optional(),
  recentActions: z.array(z.string()).optional(),
  selectedItems: z.array(z.string()).optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAIService(req: Request) {
  const companyId = req.tenantId;
  if (!companyId) {
    throw new Error('Tenant context required');
  }
  return createUnifiedAIService(companyId);
}

function getUserId(req: Request): string {
  return req.user?.id || '';
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/ai/chat
 * Main conversational AI endpoint
 */
router.post(
  '/chat',
  ...secureRoute(),
  aiQueryLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = chatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const aiService = getAIService(req);
    const userId = getUserId(req);

    const response = await aiService.processQuery(
      {
        message: validation.data.message,
        conversationId: validation.data.conversationId,
        context: validation.data.context,
      },
      userId
    );

    res.json({
      success: true,
      data: response,
    });
  })
);

/**
 * GET /api/ai/conversations
 * List user's AI conversations
 */
router.get(
  '/conversations',
  ...secureRoute(),
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.tenantId;
    const userId = getUserId(req);
    const { limit = '20', offset = '0' } = req.query;

    const conversations = await db
      .select({
        id: aiConversations.id,
        title: aiConversations.title,
        createdAt: aiConversations.createdAt,
        updatedAt: aiConversations.updatedAt,
      })
      .from(aiConversations)
      .where(and(
        eq(aiConversations.companyId, companyId!),
        eq(aiConversations.userId, userId)
      ))
      .orderBy(desc(aiConversations.updatedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      success: true,
      data: {
        conversations,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * GET /api/ai/conversations/:id
 * Get a specific conversation with messages
 */
router.get(
  '/conversations/:id',
  ...secureRoute(),
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.tenantId;
    const userId = getUserId(req);
    const { id } = req.params;

    // Get conversation
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(and(
        eq(aiConversations.id, id),
        eq(aiConversations.companyId, companyId!),
        eq(aiConversations.userId, userId)
      ));

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Get messages
    const messages = await db
      .select({
        id: aiMessages.id,
        role: aiMessages.role,
        content: aiMessages.content,
        createdAt: aiMessages.createdAt,
      })
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, id))
      .orderBy(aiMessages.createdAt);

    res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  })
);

/**
 * DELETE /api/ai/conversations/:id
 * Delete a conversation
 */
router.delete(
  '/conversations/:id',
  ...secureRoute(),
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.tenantId;
    const userId = getUserId(req);
    const { id } = req.params;

    // Verify ownership
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(and(
        eq(aiConversations.id, id),
        eq(aiConversations.companyId, companyId!),
        eq(aiConversations.userId, userId)
      ));

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Delete messages first (foreign key)
    await db
      .delete(aiMessages)
      .where(eq(aiMessages.conversationId, id));

    // Delete conversation
    await db
      .delete(aiConversations)
      .where(eq(aiConversations.id, id));

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  })
);

/**
 * GET /api/ai/briefing
 * Get daily insights briefing
 */
router.get(
  '/briefing',
  ...secureRoute(),
  aiQueryLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const aiService = getAIService(req);
    const userId = getUserId(req);

    const briefing = await aiService.generateDailyBriefing(userId);

    res.json({
      success: true,
      data: briefing,
    });
  })
);

/**
 * GET /api/ai/predictions/:type
 * Get predictions for demand, stockout, or staffing
 */
router.get(
  '/predictions/:type',
  ...secureRoute(),
  aiQueryLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;

    if (!['demand', 'stockout', 'staffing'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prediction type. Must be: demand, stockout, or staffing',
      });
    }

    const aiService = getAIService(req);
    const predictions = await aiService.getPredictions(type as 'demand' | 'stockout' | 'staffing');

    res.json({
      success: true,
      data: predictions,
    });
  })
);

/**
 * POST /api/ai/actions
 * Execute an autonomous action
 */
router.post(
  '/actions',
  ...secureRoute(),
  aiQueryLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = actionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const aiService = getAIService(req);
    const userId = getUserId(req);

    const result = await aiService.executeAutonomousAction(
      validation.data,
      userId
    );

    res.json({
      success: result.success,
      data: result,
    });
  })
);

/**
 * POST /api/ai/quick-actions
 * Get context-aware suggested actions
 */
router.post(
  '/quick-actions',
  ...secureRoute(),
  asyncHandler(async (req: Request, res: Response) => {
    const validation = quickActionsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const aiService = getAIService(req);
    const actions = await aiService.getSuggestedActions(validation.data);

    res.json({
      success: true,
      data: {
        actions,
        generatedAt: new Date().toISOString(),
      },
    });
  })
);

/**
 * POST /api/ai/feedback
 * Submit feedback on an AI response
 */
router.post(
  '/feedback',
  ...secureRoute(),
  asyncHandler(async (req: Request, res: Response) => {
    const validation = feedbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const aiService = getAIService(req);
    const userId = getUserId(req);

    await aiService.recordFeedback(
      validation.data.messageId,
      validation.data.rating,
      validation.data.comment || null,
      userId
    );

    res.json({
      success: true,
      message: 'Feedback recorded',
    });
  })
);

// ============================================
// EXPORT
// ============================================

export default router;

// Export metadata for route auto-discovery
export const routeConfig = {
  path: '/ai',
  middleware: [], // secureRoute is applied per-route
};
