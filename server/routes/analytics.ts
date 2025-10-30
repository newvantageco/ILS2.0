import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  orders, 
  posTransactions, 
  posTransactionItems,
  products, 
  users,
  analyticsEvents,
  companies
} from '../../shared/schema';
import { and, eq, gte, lte, sql, desc, count, sum, avg, between } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interval: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

// Helper to get date range (default last 30 days)
const getDateRange = (startDate?: string, endDate?: string) => {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
};

/**
 * GET /api/analytics/overview
 * Get high-level business metrics overview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);

    // Get current period metrics
    const [currentMetrics] = await db.select({
      totalRevenue: sql<string>`COALESCE(SUM(${posTransactions.totalAmount}), 0)`,
      totalOrders: sql<number>`COUNT(DISTINCT ${posTransactions.id})`,
      averageOrderValue: sql<string>`COALESCE(AVG(${posTransactions.totalAmount}), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
    })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      );

    // Get previous period for comparison
    const periodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(start.getTime());

    const [previousMetrics] = await db.select({
      totalRevenue: sql<string>`COALESCE(SUM(${posTransactions.totalAmount}), 0)`,
      totalOrders: sql<number>`COUNT(DISTINCT ${posTransactions.id})`,
    })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, prevStart, prevEnd)
        )
      );

    // Calculate trends
    const prevRevenue = parseFloat(previousMetrics.totalRevenue);
    const revenueTrend = prevRevenue > 0 
      ? ((parseFloat(currentMetrics.totalRevenue) - prevRevenue) / prevRevenue) * 100
      : 0;

    const ordersTrend = previousMetrics.totalOrders > 0
      ? ((currentMetrics.totalOrders - previousMetrics.totalOrders) / previousMetrics.totalOrders) * 100
      : 0;

    // Get top selling products
    const topProducts = await db.select({
      productId: posTransactionItems.productId,
      productName: products.name,
      totalQuantity: sql<number>`SUM(${posTransactionItems.quantity})`,
      totalRevenue: sql<string>`SUM(${posTransactionItems.lineTotal})`,
    })
      .from(posTransactionItems)
      .innerJoin(posTransactions, eq(posTransactionItems.transactionId, posTransactions.id))
      .innerJoin(products, eq(posTransactionItems.productId, products.id))
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      )
      .groupBy(posTransactionItems.productId, products.name)
      .orderBy(desc(sql`SUM(${posTransactionItems.quantity})`))
      .limit(10);

    // Get payment method breakdown
    const paymentMethods = await db.select({
      method: posTransactions.paymentMethod,
      count: sql<number>`COUNT(*)`,
      total: sql<string>`SUM(${posTransactions.totalAmount})`,
    })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      )
      .groupBy(posTransactions.paymentMethod);

    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      metrics: {
        revenue: {
          current: parseFloat(currentMetrics.totalRevenue),
          trend: revenueTrend,
        },
        orders: {
          current: currentMetrics.totalOrders,
          trend: ordersTrend,
        },
        averageOrderValue: parseFloat(currentMetrics.averageOrderValue),
        transactionCount: currentMetrics.transactionCount,
      },
      topProducts,
      paymentMethods,
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

/**
 * GET /api/analytics/sales-trends
 * Get sales trends over time with customizable intervals
 */
router.get('/sales-trends', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate, interval = 'day' } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);

    // Build date truncation based on interval
    let dateTrunc;
    switch (interval) {
      case 'hour':
        dateTrunc = sql`date_trunc('hour', ${posTransactions.transactionDate})`;
        break;
      case 'week':
        dateTrunc = sql`date_trunc('week', ${posTransactions.transactionDate})`;
        break;
      case 'month':
        dateTrunc = sql`date_trunc('month', ${posTransactions.transactionDate})`;
        break;
      default:
        dateTrunc = sql`date_trunc('day', ${posTransactions.transactionDate})`;
    }

    const trends = await db.select({
      period: dateTrunc,
      revenue: sql<string>`SUM(${posTransactions.totalAmount})`,
      orders: sql<number>`COUNT(DISTINCT ${posTransactions.id})`,
      transactions: sql<number>`COUNT(*)`,
      averageValue: sql<string>`AVG(${posTransactions.totalAmount})`,
    })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      )
      .groupBy(dateTrunc)
      .orderBy(dateTrunc);

    res.json({
      interval,
      period: { start: start.toISOString(), end: end.toISOString() },
      data: trends.map(t => ({
        period: t.period,
        revenue: parseFloat(t.revenue),
        orders: t.orders,
        transactions: t.transactions,
        averageValue: parseFloat(t.averageValue),
      })),
    });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({ error: 'Failed to fetch sales trends' });
  }
});

/**
 * GET /api/analytics/product-performance
 * Detailed product performance metrics
 */
router.get('/product-performance', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);

    const performance = await db.select({
      productId: posTransactionItems.productId,
      productName: products.name,
      category: products.category,
      sku: products.sku,
      unitsSold: sql<number>`SUM(${posTransactionItems.quantity})`,
      revenue: sql<string>`SUM(${posTransactionItems.lineTotal})`,
      averagePrice: sql<string>`AVG(${posTransactionItems.unitPrice})`,
      transactionCount: sql<number>`COUNT(DISTINCT ${posTransactionItems.transactionId})`,
    })
      .from(posTransactionItems)
      .innerJoin(posTransactions, eq(posTransactionItems.transactionId, posTransactions.id))
      .innerJoin(products, eq(posTransactionItems.productId, products.id))
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      )
      .groupBy(
        posTransactionItems.productId,
        products.name,
        products.category,
        products.sku
      )
      .orderBy(desc(sql`SUM(${posTransactionItems.lineTotal})`));

    res.json({
      period: { start: start.toISOString(), end: end.toISOString() },
      products: performance.map(p => ({
        ...p,
        revenue: parseFloat(p.revenue),
        averagePrice: parseFloat(p.averagePrice),
      })),
    });
  } catch (error) {
    console.error('Error fetching product performance:', error);
    res.status(500).json({ error: 'Failed to fetch product performance' });
  }
});

/**
 * GET /api/analytics/category-breakdown
 * Sales breakdown by product category
 */
router.get('/category-breakdown', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);

    const categoryData = await db.select({
      category: products.category,
      revenue: sql<string>`SUM(${posTransactionItems.lineTotal})`,
      unitsSold: sql<number>`SUM(${posTransactionItems.quantity})`,
      transactionCount: sql<number>`COUNT(DISTINCT ${posTransactionItems.transactionId})`,
    })
      .from(posTransactionItems)
      .innerJoin(posTransactions, eq(posTransactionItems.transactionId, posTransactions.id))
      .innerJoin(products, eq(posTransactionItems.productId, products.id))
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      )
      .groupBy(products.category)
      .orderBy(desc(sql`SUM(${posTransactionItems.lineTotal})`));

    const totalRevenue = categoryData.reduce((sum, cat) => sum + parseFloat(cat.revenue), 0);

    res.json({
      period: { start: start.toISOString(), end: end.toISOString() },
      categories: categoryData.map(cat => ({
        category: cat.category,
        revenue: parseFloat(cat.revenue),
        percentage: totalRevenue > 0 ? (parseFloat(cat.revenue) / totalRevenue) * 100 : 0,
        unitsSold: cat.unitsSold,
        transactionCount: cat.transactionCount,
      })),
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch category breakdown' });
  }
});

/**
 * GET /api/analytics/staff-performance
 * Staff sales performance metrics
 */
router.get('/staff-performance', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);

    const staffPerformance = await db.select({
      staffId: posTransactions.staffId,
      staffName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
      transactionCount: sql<number>`COUNT(*)`,
      revenue: sql<string>`SUM(${posTransactions.totalAmount})`,
      averageTransaction: sql<string>`AVG(${posTransactions.totalAmount})`,
      cashTransactions: sql<number>`COUNT(*) FILTER (WHERE ${posTransactions.paymentMethod} = 'cash')`,
      cardTransactions: sql<number>`COUNT(*) FILTER (WHERE ${posTransactions.paymentMethod} = 'card')`,
    })
      .from(posTransactions)
      .innerJoin(users, eq(posTransactions.staffId, users.id))
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      )
      .groupBy(posTransactions.staffId, users.firstName, users.lastName, users.email)
      .orderBy(desc(sql`SUM(${posTransactions.totalAmount})`));

    res.json({
      period: { start: start.toISOString(), end: end.toISOString() },
      staff: staffPerformance.map(s => ({
        ...s,
        revenue: parseFloat(s.revenue),
        averageTransaction: parseFloat(s.averageTransaction),
      })),
    });
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({ error: 'Failed to fetch staff performance' });
  }
});

/**
 * GET /api/analytics/customer-insights
 * Customer behavior and insights
 */
router.get('/customer-insights', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);

    // Transaction frequency distribution
    const frequencyDistribution = await db.select({
      hour: sql<number>`EXTRACT(HOUR FROM ${posTransactions.transactionDate})`,
      count: sql<number>`COUNT(*)`,
      revenue: sql<string>`SUM(${posTransactions.totalAmount})`,
    })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      )
      .groupBy(sql`EXTRACT(HOUR FROM ${posTransactions.transactionDate})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${posTransactions.transactionDate})`);

    // Day of week analysis
    const dayOfWeekAnalysis = await db.select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${posTransactions.transactionDate})`,
      count: sql<number>`COUNT(*)`,
      revenue: sql<string>`SUM(${posTransactions.totalAmount})`,
    })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          between(posTransactions.transactionDate, start, end)
        )
      )
      .groupBy(sql`EXTRACT(DOW FROM ${posTransactions.transactionDate})`)
      .orderBy(sql`EXTRACT(DOW FROM ${posTransactions.transactionDate})`);

    // Average basket analysis
    const [basketMetrics] = await db.select({
      averageItems: sql<string>`AVG(item_count)`,
      averageValue: sql<string>`AVG(${posTransactions.totalAmount})`,
    })
      .from(
        db.select({
          transactionId: posTransactionItems.transactionId,
          itemCount: sql<number>`COUNT(*)`.as('item_count'),
        })
          .from(posTransactionItems)
          .innerJoin(posTransactions, eq(posTransactionItems.transactionId, posTransactions.id))
          .where(
            and(
              eq(posTransactions.companyId, companyId),
              eq(posTransactions.paymentStatus, 'completed'),
              between(posTransactions.transactionDate, start, end)
            )
          )
          .groupBy(posTransactionItems.transactionId)
          .as('basket_data')
      );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    res.json({
      period: { start: start.toISOString(), end: end.toISOString() },
      hourlyDistribution: frequencyDistribution.map(h => ({
        hour: h.hour,
        count: h.count,
        revenue: parseFloat(h.revenue),
      })),
      dayOfWeek: dayOfWeekAnalysis.map(d => ({
        day: dayNames[d.dayOfWeek],
        dayNumber: d.dayOfWeek,
        count: d.count,
        revenue: parseFloat(d.revenue),
      })),
      basketMetrics: {
        averageItems: parseFloat(basketMetrics?.averageItems || '0'),
        averageValue: parseFloat(basketMetrics?.averageValue || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching customer insights:', error);
    res.status(500).json({ error: 'Failed to fetch customer insights' });
  }
});

/**
 * GET /api/analytics/real-time
 * Real-time metrics for dashboard (today's data)
 */
router.get('/real-time', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [metrics] = await db.select({
      todayRevenue: sql<string>`COALESCE(SUM(${posTransactions.totalAmount}), 0)`,
      todayTransactions: sql<number>`COUNT(*)`,
      todayAverage: sql<string>`COALESCE(AVG(${posTransactions.totalAmount}), 0)`,
    })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          eq(posTransactions.paymentStatus, 'completed'),
          gte(posTransactions.transactionDate, today)
        )
      );

    // Last 10 transactions
    const recentTransactions = await db.select({
      id: posTransactions.id,
      totalAmount: posTransactions.totalAmount,
      transactionDate: posTransactions.transactionDate,
      paymentMethod: posTransactions.paymentMethod,
      staffName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
    })
      .from(posTransactions)
      .innerJoin(users, eq(posTransactions.staffId, users.id))
      .where(eq(posTransactions.companyId, companyId))
      .orderBy(desc(posTransactions.transactionDate))
      .limit(10);

    res.json({
      today: {
        revenue: parseFloat(metrics.todayRevenue),
        transactions: metrics.todayTransactions,
        average: parseFloat(metrics.todayAverage),
      },
      recentTransactions,
    });
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({ error: 'Failed to fetch real-time metrics' });
  }
});

/**
 * Advanced Analytics Endpoints
 */
import * as advancedAnalytics from '../storage/advancedAnalytics';

/**
 * GET /api/analytics/customer-lifetime-value
 * Get customer lifetime value analysis
 */
router.get('/customer-lifetime-value', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const clvData = await advancedAnalytics.getCustomerLifetimeValue(companyId, limit);
    res.json(clvData);
  } catch (error) {
    console.error('Error fetching CLV:', error);
    res.status(500).json({ error: 'Failed to fetch customer lifetime value' });
  }
});

/**
 * GET /api/analytics/product-affinity
 * Get products frequently bought together
 */
router.get('/product-affinity', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const minOccurrences = parseInt(req.query.minOccurrences as string) || 3;
    
    const affinityData = await advancedAnalytics.getProductAffinity(companyId, minOccurrences);
    res.json(affinityData);
  } catch (error) {
    console.error('Error fetching product affinity:', error);
    res.status(500).json({ error: 'Failed to fetch product affinity' });
  }
});

/**
 * GET /api/analytics/revenue-by-hour
 * Get revenue distribution by hour of day
 */
router.get('/revenue-by-hour', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);
    
    const hourlyData = await advancedAnalytics.getRevenueByHourOfDay(companyId, start, end);
    res.json(hourlyData);
  } catch (error) {
    console.error('Error fetching hourly revenue:', error);
    res.status(500).json({ error: 'Failed to fetch hourly revenue' });
  }
});

/**
 * GET /api/analytics/revenue-by-day-of-week
 * Get revenue distribution by day of week
 */
router.get('/revenue-by-day-of-week', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);
    
    const weekdayData = await advancedAnalytics.getRevenueByDayOfWeek(companyId, start, end);
    res.json(weekdayData);
  } catch (error) {
    console.error('Error fetching weekday revenue:', error);
    res.status(500).json({ error: 'Failed to fetch weekday revenue' });
  }
});

/**
 * GET /api/analytics/inventory-turnover
 * Get inventory turnover rates
 */
router.get('/inventory-turnover', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const days = parseInt(req.query.days as string) || 30;
    
    const turnoverData = await advancedAnalytics.getInventoryTurnover(companyId, days);
    res.json(turnoverData);
  } catch (error) {
    console.error('Error fetching inventory turnover:', error);
    res.status(500).json({ error: 'Failed to fetch inventory turnover' });
  }
});

/**
 * GET /api/analytics/peak-hours
 * Get peak sales hours
 */
router.get('/peak-hours', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);
    
    const peakData = await advancedAnalytics.getPeakSalesHours(companyId, start, end);
    res.json(peakData);
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    res.status(500).json({ error: 'Failed to fetch peak hours' });
  }
});

/**
 * GET /api/analytics/abandonment-funnel
 * Get abandonment analysis
 */
router.get('/abandonment-funnel', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);
    
    const funnelData = await advancedAnalytics.getAbandonmentAnalysis(companyId, start, end);
    res.json(funnelData);
  } catch (error) {
    console.error('Error fetching abandonment funnel:', error);
    res.status(500).json({ error: 'Failed to fetch abandonment funnel' });
  }
});

export default router;
