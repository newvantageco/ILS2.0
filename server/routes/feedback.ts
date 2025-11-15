/**
 * Feedback & NPS Routes
 *
 * Handles user feedback collection, NPS surveys, feature requests, and bug reports.
 */

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { feedback, npsSurveys, users } from '@shared/schema';
import { isAuthenticated } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError } from '../utils/ApiError';
import logger from '../utils/logger';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Validation schemas
const feedbackSchema = z.object({
  type: z.enum(['general', 'feature', 'bug', 'improvement']),
  message: z.string().min(1).max(1000),
  email: z.string().email().optional(),
  context: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
});

const npsSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string().max(1000).optional(),
  trigger: z.string().optional(),
  context: z.string().optional(),
  timestamp: z.string().optional(),
});

/**
 * POST /api/feedback
 * Submit user feedback (feature request, bug report, general feedback)
 */
router.post(
  '/feedback',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validationResult = feedbackSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid feedback data', validationResult.error.errors);
    }

    const { type, message, email, context, userAgent } = validationResult.data;
    const userId = req.user?.id;

    // Insert feedback
    const [newFeedback] = await db.insert(feedback).values({
      userId,
      type,
      message,
      contactEmail: email,
      context,
      userAgent,
      status: 'new',
      createdAt: new Date(),
    }).returning();

    // Log for analytics
    logger.info('User feedback submitted', {
      feedbackId: newFeedback.id,
      userId,
      type,
      context,
    });

    res.json({
      success: true,
      feedback: newFeedback,
    });
  })
);

/**
 * POST /api/nps
 * Submit NPS (Net Promoter Score) survey response
 */
router.post(
  '/nps',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validationResult = npsSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid NPS data', validationResult.error.errors);
    }

    const { score, feedback: npsFeedback, trigger, context } = validationResult.data;
    const userId = req.user!.id;

    // Determine NPS category
    const category = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor';

    // Insert NPS response
    const [npsResponse] = await db.insert(npsSurveys).values({
      userId,
      score,
      category,
      feedback: npsFeedback || null,
      trigger: trigger || 'manual',
      context: context || null,
      createdAt: new Date(),
    }).returning();

    // Log for analytics
    logger.info('NPS survey submitted', {
      npsId: npsResponse.id,
      userId,
      score,
      category,
      trigger,
    });

    res.json({
      success: true,
      nps: npsResponse,
    });
  })
);

/**
 * GET /api/feedback
 * Get all feedback (admin only)
 */
router.get(
  '/feedback',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
    });

    if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const allFeedback = await db.query.feedback.findMany({
      orderBy: [desc(feedback.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      limit: 100,
    });

    res.json({ feedback: allFeedback });
  })
);

/**
 * GET /api/nps/stats
 * Get NPS statistics (admin only)
 */
router.get(
  '/nps/stats',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
    });

    if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const allNPS = await db.query.npsSurveys.findMany({
      orderBy: [desc(npsSurveys.createdAt)],
      limit: 500,
    });

    // Calculate NPS score
    const promoters = allNPS.filter((n) => n.category === 'promoter').length;
    const detractors = allNPS.filter((n) => n.category === 'detractor').length;
    const total = allNPS.length;

    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

    res.json({
      npsScore,
      totalResponses: total,
      breakdown: {
        promoters,
        passives: allNPS.filter((n) => n.category === 'passive').length,
        detractors,
      },
      recentResponses: allNPS.slice(0, 10),
    });
  })
);

export default router;
