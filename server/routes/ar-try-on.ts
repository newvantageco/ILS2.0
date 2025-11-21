/**
 * AR Virtual Try-On Routes
 * API endpoints for AR-powered frame selection
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError } from '../utils/ApiError';
import logger from '../utils/logger';
import { db } from '../db';
import { products, arTryOnSessions, arTryOnFavorites } from '@shared/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

const router = Router();

// Validation schemas
const createSessionSchema = z.object({
  deviceInfo: z.object({
    userAgent: z.string(),
    screenWidth: z.number(),
    screenHeight: z.number(),
    cameraResolution: z.string().optional(),
  }),
});

const saveFavoriteSchema = z.object({
  sessionId: z.string(),
  productId: z.string(),
  screenshot: z.string().optional(), // Base64 encoded image
  notes: z.string().optional(),
});

const shareSessionSchema = z.object({
  sessionId: z.string(),
  shareMethod: z.enum(['email', 'sms', 'social', 'link']),
  recipient: z.string().optional(),
});

/**
 * GET /api/ar-try-on/frames
 * Get all frames available for virtual try-on
 */
router.get(
  '/frames',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.user?.companyId;

    // Get all frame products with 3D models
    const frames = await db
      .select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        model3dUrl: products.model3dUrl,
        colors: products.colors,
        category: products.category,
        inStock: products.stockQuantity,
      })
      .from(products)
      .where(
        and(
          eq(products.companyId, companyId!),
          eq(products.category, 'frames'),
          eq(products.isActive, true)
        )
      )
      .orderBy(desc(products.createdAt));

    // Filter frames that have 3D models
    const framesWithAR = frames.filter(frame => frame.model3dUrl);

    logger.info('AR frames fetched', {
      companyId,
      totalFrames: frames.length,
      arEnabledFrames: framesWithAR.length,
    });

    res.json({
      success: true,
      frames: framesWithAR,
      totalCount: framesWithAR.length,
    });
  })
);

/**
 * GET /api/ar-try-on/frames/:id
 * Get detailed frame info including 3D model
 */
router.get(
  '/frames/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const [frame] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, id),
          eq(products.companyId, companyId!),
          eq(products.category, 'frames')
        )
      )
      .limit(1);

    if (!frame) {
      return res.status(404).json({
        success: false,
        error: 'Frame not found',
      });
    }

    if (!frame.model3dUrl) {
      return res.status(400).json({
        success: false,
        error: 'Frame does not have 3D model for AR',
      });
    }

    res.json({
      success: true,
      frame,
    });
  })
);

/**
 * POST /api/ar-try-on/session
 * Create a new AR try-on session
 */
router.post(
  '/session',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = createSessionSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid session data', validationResult.error.errors);
    }

    const { deviceInfo } = validationResult.data;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    // Create session
    const [session] = await db
      .insert(arTryOnSessions)
      .values({
        userId,
        companyId: companyId!,
        deviceInfo: JSON.stringify(deviceInfo),
        startedAt: new Date(),
        status: 'active',
      })
      .returning();

    logger.info('AR try-on session created', {
      sessionId: session.id,
      userId,
      companyId,
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        startedAt: session.startedAt,
      },
    });
  })
);

/**
 * PUT /api/ar-try-on/session/:id/end
 * End an AR try-on session
 */
router.put(
  '/session/:id/end',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const [session] = await db
      .update(arTryOnSessions)
      .set({
        endedAt: new Date(),
        status: 'completed',
        duration: Math.floor((Date.now() - new Date(req.body.startedAt).getTime()) / 1000),
      })
      .where(
        and(
          eq(arTryOnSessions.id, id),
          eq(arTryOnSessions.userId, userId!)
        )
      )
      .returning();

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    logger.info('AR try-on session ended', {
      sessionId: id,
      duration: session.duration,
    });

    res.json({
      success: true,
      session,
    });
  })
);

/**
 * POST /api/ar-try-on/favorite
 * Save a favorite frame from try-on
 */
router.post(
  '/favorite',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = saveFavoriteSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid favorite data', validationResult.error.errors);
    }

    const { sessionId, productId, screenshot, notes } = validationResult.data;
    const userId = req.user?.id;

    // Verify session belongs to user
    const [session] = await db
      .select()
      .from(arTryOnSessions)
      .where(
        and(
          eq(arTryOnSessions.id, sessionId),
          eq(arTryOnSessions.userId, userId!)
        )
      )
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Save favorite
    const [favorite] = await db
      .insert(arTryOnFavorites)
      .values({
        userId: userId!,
        sessionId,
        productId,
        screenshot,
        notes,
        createdAt: new Date(),
      })
      .returning();

    logger.info('AR try-on favorite saved', {
      favoriteId: favorite.id,
      userId,
      productId,
    });

    res.json({
      success: true,
      favorite,
    });
  })
);

/**
 * GET /api/ar-try-on/favorites
 * Get user's favorite try-on frames
 */
router.get(
  '/favorites',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    const favorites = await db
      .select({
        id: arTryOnFavorites.id,
        productId: arTryOnFavorites.productId,
        screenshot: arTryOnFavorites.screenshot,
        notes: arTryOnFavorites.notes,
        createdAt: arTryOnFavorites.createdAt,
        product: products,
      })
      .from(arTryOnFavorites)
      .leftJoin(products, eq(arTryOnFavorites.productId, products.id))
      .where(eq(arTryOnFavorites.userId, userId!))
      .orderBy(desc(arTryOnFavorites.createdAt));

    res.json({
      success: true,
      favorites,
    });
  })
);

/**
 * DELETE /api/ar-try-on/favorites/:id
 * Remove a favorite
 */
router.delete(
  '/favorites/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await db
      .delete(arTryOnFavorites)
      .where(
        and(
          eq(arTryOnFavorites.id, id),
          eq(arTryOnFavorites.userId, userId!)
        )
      );

    logger.info('AR try-on favorite removed', { favoriteId: id, userId });

    res.json({
      success: true,
    });
  })
);

/**
 * POST /api/ar-try-on/share
 * Share try-on session
 */
router.post(
  '/share',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = shareSessionSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid share data', validationResult.error.errors);
    }

    const { sessionId, shareMethod, recipient } = validationResult.data;
    const userId = req.user?.id;

    // Verify session belongs to user
    const [session] = await db
      .select()
      .from(arTryOnSessions)
      .where(
        and(
          eq(arTryOnSessions.id, sessionId),
          eq(arTryOnSessions.userId, userId!)
        )
      )
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Get favorites from session
    const favorites = await db
      .select()
      .from(arTryOnFavorites)
      .where(eq(arTryOnFavorites.sessionId, sessionId));

    // Generate shareable link
    const shareLink = `${process.env.APP_URL}/ar-try-on/shared/${sessionId}`;

    // TODO: Implement actual sharing logic (email, SMS, etc.)
    // For now, just return the share link

    logger.info('AR try-on session shared', {
      sessionId,
      shareMethod,
      recipient,
    });

    res.json({
      success: true,
      shareLink,
      favoriteCount: favorites.length,
    });
  })
);

/**
 * GET /api/ar-try-on/analytics
 * Get AR try-on analytics for company
 */
router.get(
  '/analytics',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.user?.companyId;

    // Get session statistics
    const sessions = await db
      .select()
      .from(arTryOnSessions)
      .where(eq(arTryOnSessions.companyId, companyId!));

    const favorites = await db
      .select()
      .from(arTryOnFavorites)
      .where(eq(arTryOnFavorites.userId, req.user!.id));

    // Calculate metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const averageDuration = sessions
      .filter(s => s.duration)
      .reduce((sum, s) => sum + (s.duration || 0), 0) / (sessions.length || 1);

    // Get most popular frames
    const popularFrames = await db
      .select({
        productId: arTryOnFavorites.productId,
        count: db.$count(arTryOnFavorites.id),
      })
      .from(arTryOnFavorites)
      .groupBy(arTryOnFavorites.productId)
      .orderBy(desc(db.$count(arTryOnFavorites.id)))
      .limit(10);

    res.json({
      success: true,
      analytics: {
        totalSessions,
        completedSessions,
        averageDuration: Math.round(averageDuration),
        totalFavorites: favorites.length,
        popularFrames,
        conversionRate: completedSessions / (totalSessions || 1),
      },
    });
  })
);

export default router;
