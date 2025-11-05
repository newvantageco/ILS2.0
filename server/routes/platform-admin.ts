import { Router } from 'express';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db';
import { marketInsights, platformStatistics, aggregatedMetrics } from '../../shared/schema.js';
import { platformAnalyticsService } from '../services/PlatformAnalyticsService.js';

const router = Router();

// Middleware to check platform admin access
const requirePlatformAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.role !== 'platform_admin') {
    return res.status(403).json({ error: 'Platform admin access required' });
  }

  next();
};

// Apply platform admin middleware to all routes
router.use(requirePlatformAdmin);

/**
 * GET /api/platform-admin/insights
 * Get list of available market insights with optional filters
 * Query params: insightType, category, region, accessLevel
 */
router.get('/insights', async (req, res) => {
  try {
    const { insightType, category, region, accessLevel } = req.query;

    const filters: any = {};
    if (insightType) filters.insightType = insightType as string;
    if (category) filters.category = category as string;
    if (region) filters.region = region as string;
    if (accessLevel) filters.accessLevel = accessLevel as string;

    const insights = await platformAnalyticsService.getAvailableInsights(
      Object.keys(filters).length > 0 ? filters : undefined
    );

    res.json({
      success: true,
      insights,
      count: insights.length
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch insights',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /api/platform-admin/insights/:id
 * Get detailed information about a specific insight
 */
router.get('/insights/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [insight] = await db
      .select()
      .from(marketInsights)
      .where(eq(marketInsights.id, id))
      .limit(1);

    if (!insight) {
      return res.status(404).json({ 
        success: false, 
        error: 'Insight not found' 
      });
    }

    res.json({
      success: true,
      insight
    });
  } catch (error) {
    console.error('Error fetching insight:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch insight',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /api/platform-admin/insights/:id/export
 * Export insight data as CSV
 */
router.get('/insights/:id/export', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify insight exists
    const [insight] = await db
      .select()
      .from(marketInsights)
      .where(eq(marketInsights.id, id))
      .limit(1);

    if (!insight) {
      return res.status(404).json({ 
        success: false, 
        error: 'Insight not found' 
      });
    }

    const csvContent = await platformAnalyticsService.exportInsightAsCSV(id);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="insight-${id}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting insight:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export insight',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/platform-admin/insights/generate
 * Generate a new market insight
 * Body: { type: string, periodStart: string, periodEnd: string, region?: string }
 */
router.post('/insights/generate', async (req, res) => {
  try {
    const { type, periodStart, periodEnd, region } = req.body;

    if (!type || !periodStart || !periodEnd) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: type, periodStart, periodEnd' 
      });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    let insightId: string | null = null;

    // Generate appropriate insight based on type
    switch (type) {
      case 'invoice_pricing':
        insightId = await platformAnalyticsService.generateInvoicePricingInsight(
          startDate,
          endDate,
          region
        );
        break;
      
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Unknown insight type: ${type}` 
        });
    }

    if (!insightId) {
      return res.status(422).json({ 
        success: false, 
        error: 'Insufficient data to generate insight',
        message: 'Minimum sample size not met for anonymization requirements'
      });
    }

    // Fetch the generated insight
    const [insight] = await db
      .select()
      .from(marketInsights)
      .where(eq(marketInsights.id, insightId))
      .limit(1);

    res.status(201).json({
      success: true,
      insight,
      message: 'Insight generated successfully'
    });
  } catch (error) {
    console.error('Error generating insight:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate insight',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /api/platform-admin/statistics
 * Get platform-wide statistics
 * Query params: startDate, endDate
 */
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required query params: startDate, endDate' 
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const statistics = await platformAnalyticsService.getPlatformStatistics(start, end);

    res.json({
      success: true,
      statistics,
      count: statistics.length,
      period: {
        start: startDate,
        end: endDate
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/platform-admin/statistics/generate
 * Generate statistics for a specific date
 * Body: { date: string }
 */
router.post('/statistics/generate', async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: date' 
      });
    }

    const targetDate = new Date(date);
    await platformAnalyticsService.generateDailyStatistics(targetDate);

    // Fetch the generated statistics
    // Convert Date to string in YYYY-MM-DD format for comparison
    const dateString = targetDate.toISOString().split('T')[0];
    const [stats] = await db
      .select()
      .from(platformStatistics)
      .where(eq(platformStatistics.date, dateString))
      .limit(1);

    res.status(201).json({
      success: true,
      statistics: stats,
      message: 'Statistics generated successfully'
    });
  } catch (error) {
    console.error('Error generating statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate statistics',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/platform-admin/metrics/refresh
 * Refresh aggregated metrics cache
 */
router.post('/metrics/refresh', async (req, res) => {
  try {
    await platformAnalyticsService.refreshAggregatedMetrics();

    // Fetch recently refreshed metrics
    const metrics = await db
      .select()
      .from(aggregatedMetrics)
      .where(eq(aggregatedMetrics.refreshStatus, 'current'))
      .orderBy(desc(aggregatedMetrics.lastRefreshed))
      .limit(10);

    res.json({
      success: true,
      message: 'Metrics refreshed successfully',
      refreshedMetrics: metrics.length,
      metrics
    });
  } catch (error) {
    console.error('Error refreshing metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to refresh metrics',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /api/platform-admin/metrics
 * Get aggregated metrics with optional filters
 * Query params: metricType, category, region
 */
router.get('/metrics', async (req, res) => {
  try {
    const { metricType, category, region } = req.query;

    const conditions: any[] = [eq(aggregatedMetrics.refreshStatus, 'current')];

    if (metricType) {
      conditions.push(eq(aggregatedMetrics.metricType, metricType as string));
    }
    if (category) {
      conditions.push(eq(aggregatedMetrics.category, category as string));
    }
    if (region) {
      conditions.push(eq(aggregatedMetrics.region, region as string));
    }

    const metrics = await db
      .select()
      .from(aggregatedMetrics)
      .where(and(...conditions))
      .orderBy(desc(aggregatedMetrics.lastRefreshed));

    res.json({
      success: true,
      metrics,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch metrics',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /api/platform-admin/dashboard
 * Get overview data for platform admin dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get latest statistics
    const [latestStats] = await db
      .select()
      .from(platformStatistics)
      .orderBy(desc(platformStatistics.date))
      .limit(1);

    // Get recent insights
    const recentInsights = await db
      .select()
      .from(marketInsights)
      .where(eq(marketInsights.status, 'published'))
      .orderBy(desc(marketInsights.createdAt))
      .limit(5);

    // Get current metrics
    const currentMetrics = await db
      .select()
      .from(aggregatedMetrics)
      .where(eq(aggregatedMetrics.refreshStatus, 'current'))
      .orderBy(desc(aggregatedMetrics.lastRefreshed))
      .limit(10);

    res.json({
      success: true,
      dashboard: {
        latestStatistics: latestStats || null,
        recentInsights,
        currentMetrics,
        summary: {
          totalInsights: recentInsights.length,
          totalMetrics: currentMetrics.length,
          lastUpdated: latestStats?.date || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data',
      message: (error as Error).message 
    });
  }
});

export default router;
