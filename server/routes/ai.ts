/**
 * AI Service Integration Router
 * 
 * Handles all AI-related requests with multi-tenant isolation,
 * rate limiting, caching, and usage tracking.
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { extractTenantContext } from '../middleware/tenantContext';
import { aiRateLimiter } from '../middleware/aiRateLimiting';
import { AIService } from '../services/aiService';
import * as usageTracking from '../services/aiUsageTracking';
import * as deduplication from '../services/aiQueryDeduplication';

const router = express.Router();

// Validation schemas
const querySchema = z.object({
  question: z.string().min(5).max(500),
  query_type: z.enum(['knowledge', 'sales', 'inventory', 'patient_analytics']),
  context: z.string().optional(),
});

const recommendationSchema = z.object({
  productType: z.string(),
  patientPrescription: z.object({
    od_sphere: z.number().optional(),
    od_cylinder: z.number().optional(),
    os_sphere: z.number().optional(),
    os_cylinder: z.number().optional(),
  }).optional(),
});

/**
 * POST /api/ai/query
 * 
 * Main AI query endpoint with tenant isolation
 */
router.post(
  '/query',
  requireAuth,
  extractTenantContext,
  aiRateLimiter,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validation = querySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: validation.error.errors,
        });
      }
      
      const { question, query_type, context } = validation.data;
      const tenantContext = req.tenantContext!;
      const userId = req.user!.id;
      
      // Check for cached response (prevent duplicates)
      const cacheKey = deduplication.generateCacheKey(
        tenantContext.tenantId,
        query_type,
        question
      );
      
      const cached = deduplication.checkCache(cacheKey);
      
      if (cached) {
        console.log(`[AI] Returning cached response for tenant ${tenantContext.tenantCode}`);
        
        return res.json({
          ...cached,
          cached: true,
        });
      }
      
      // Execute AI query
      const aiService = new AIService(tenantContext);
      let result;
      
      switch (query_type) {
        case 'knowledge':
          result = await aiService.queryOphthalmicKnowledge(question, context);
          break;
        case 'sales':
          result = await aiService.querySales(question);
          break;
        case 'inventory':
          result = await aiService.queryInventory(question);
          break;
        case 'patient_analytics':
          result = await aiService.queryPatientAnalytics(question);
          break;
        default:
          return res.status(400).json({ error: 'Invalid query type' });
      }
      
      const responseTime = Date.now() - startTime;
      
      // Cache the response
      deduplication.cacheResponse(cacheKey, result, tenantContext.tenantId);
      
      // Track usage
      await usageTracking.trackUsage({
        tenantId: tenantContext.tenantId,
        userId: parseInt(userId || '0'),
        queryType: query_type,
        tokensUsed: result.tokensUsed || 0,
        fromCache: false,
        responseTime,
        query: question,
        answer: result.answer
      });
      
      // Return result
      res.json({
        ...result,
        cached: false,
        responseTime,
        queriesRemaining: (tenantContext.aiQueriesLimit || 1000) === -1 
          ? -1 
          : (tenantContext.aiQueriesLimit || 1000) - (tenantContext.aiQueriesUsed || 0) - 1,
      });
      
    } catch (error) {
      console.error('[AI] Query failed:', error);
      
      const responseTime = Date.now() - startTime;
      
      // Track failed query
      if (req.tenantContext && req.user) {
        await usageTracking.trackUsage({
          tenantId: req.tenantContext.tenantId,
          userId: parseInt(req.user.id || '0'),
          queryType: req.body.query_type || 'unknown',
          tokensUsed: 0,
          fromCache: false,
          responseTime,
          query: req.body.question || '',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'AI query failed',
        message: 'An error occurred while processing your request. Please try again.',
      });
    }
  }
);

/**
 * GET /api/ai/limits
 * 
 * Get current AI usage limits for tenant
 */
router.get(
  '/limits',
  requireAuth,
  extractTenantContext,
  async (req: Request, res: Response) => {
    try {
      const tenantContext = req.tenantContext!;
      
      const limit = tenantContext.aiQueriesLimit || 1000;
      const used = tenantContext.aiQueriesUsed || 0;
      
      const remaining = limit === -1
        ? -1 // Unlimited
        : Math.max(0, limit - used);
      
      res.json({
        limit,
        used,
        remaining,
        tier: tenantContext.subscriptionTier,
        unlimited: limit === -1,
      });
      
    } catch (error) {
      console.error('[AI] Failed to get limits:', error);
      res.status(500).json({ error: 'Failed to retrieve usage limits' });
    }
  }
);

/**
 * GET /api/ai/usage/stats
 * 
 * Get AI usage statistics for tenant
 */
router.get(
  '/usage/stats',
  requireAuth,
  extractTenantContext,
  async (req: Request, res: Response) => {
    try {
      const tenantContext = req.tenantContext!;
      const period = (req.query.period as 'day' | 'week' | 'month') || 'month';
      
      const stats = await usageTracking.getTenantUsageStats(
        tenantContext.tenantId
      );
      
      res.json({
        period,
        stats,
        tenantId: tenantContext.tenantId,
        generatedAt: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('[AI] Failed to get usage stats:', error);
      res.status(500).json({ error: 'Failed to retrieve usage statistics' });
    }
  }
);

/**
 * POST /api/ai/recommendation
 * 
 * Get AI product recommendations
 */
router.post(
  '/recommendation',
  requireAuth,
  extractTenantContext,
  aiRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const validation = recommendationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: validation.error.errors,
        });
      }
      
      const { productType, patientPrescription } = validation.data;
      const tenantContext = req.tenantContext!;
      
      const aiService = new AIService(tenantContext);
      const recommendation = await aiService.getProductRecommendation(
        productType,
        patientPrescription
      );
      
      res.json(recommendation);
      
    } catch (error) {
      console.error('[AI] Recommendation failed:', error);
      res.status(500).json({ error: 'Failed to generate recommendation' });
    }
  }
);

/**
 * POST /api/ai/cache/invalidate
 * 
 * Invalidate AI cache for tenant (admin only)
 */
router.post(
  '/cache/invalidate',
  requireAuth,
  extractTenantContext,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const tenantContext = req.tenantContext!;
      
      const clearedCount = deduplication.invalidateTenantCache(tenantContext.tenantId);
      
      res.json({
        success: true,
        message: 'Cache invalidated successfully',
        clearedEntries: clearedCount
      });
      
    } catch (error) {
      console.error('[AI] Cache invalidation failed:', error);
      res.status(500).json({ error: 'Failed to invalidate cache' });
    }
  }
);

/**
 * GET /api/ai/health
 * 
 * Check AI service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const aiService = new AIService({ 
      tenantId: 'health-check',
      tenantCode: 'health-check',
      subscriptionTier: 'enterprise',
      aiQueriesLimit: -1,
      aiQueriesUsed: 0,
    });
    
    const health = await aiService.checkHealth();
    
    res.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      ...health,
    });
    
  } catch (error) {
    console.error('[AI] Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'AI service unavailable',
    });
  }
});

export default router;
