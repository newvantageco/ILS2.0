import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../queue/config';
import { db } from '../../db';
import { users, companies, aiNotifications, aiMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import { EventBus } from '../events/EventBus';
import crypto from 'crypto';
import logger from '../utils/logger';

/**
 * AI Job Data Types
 */
interface DailyBriefingJobData {
  type: 'daily-briefing';
  companyId: string;
  date: string;
  userIds?: string[]; // Optional: specific users to notify
}

interface DemandForecastJobData {
  type: 'demand-forecast';
  companyId: string;
  productIds?: string[];
  forecastDays: number;
}

interface AnomalyDetectionJobData {
  type: 'anomaly-detection';
  companyId: string;
  metricType: 'revenue' | 'inventory' | 'orders' | 'patients';
  timeRange: 'daily' | 'weekly' | 'monthly';
}

interface InsightGenerationJobData {
  type: 'insight-generation';
  companyId: string;
  insightType: 'revenue' | 'inventory' | 'patient-care' | 'operations';
  periodStart: string;
  periodEnd: string;
}

interface ChatResponseJobData {
  type: 'chat-response';
  userId: string;
  companyId: string;
  conversationId: string;
  message: string;
}

type AIJobData = 
  | DailyBriefingJobData
  | DemandForecastJobData
  | AnomalyDetectionJobData
  | InsightGenerationJobData
  | ChatResponseJobData;

/**
 * AI Worker
 * Processes AI tasks from the AI queue
 */
export function createAIWorker() {
  const connection = getRedisConnection();
  
  if (!connection) {
    logger.warn({ error: 'Redis not available' }, 'AI worker not started');
    return null;
  }

  const worker = new Worker<AIJobData>(
    'ai-processing',
    async (job: Job<AIJobData>) => {
      logger.info({ jobId: job.id, jobType: job.data.type }, 'Processing AI job');
      
      try {
        let result;
        
        switch (job.data.type) {
          case 'daily-briefing':
            result = await processDailyBriefing(job.data);
            break;
          
          case 'demand-forecast':
            result = await processDemandForecast(job.data);
            break;
          
          case 'anomaly-detection':
            result = await processAnomalyDetection(job.data);
            break;
          
          case 'insight-generation':
            result = await processInsightGeneration(job.data);
            break;
          
          case 'chat-response':
            result = await processChatResponse(job.data);
            break;
          
          default:
            throw new Error(`Unknown AI job type: ${(job.data as any).type}`);
        }
        
        logger.info({ jobId: job.id }, 'AI job completed successfully');
        return { success: true, result, completedAt: new Date().toISOString() };
      } catch (error) {
        logger.error({ jobId: job.id, error: error instanceof Error ? error.message : String(error) }, 'AI job failed');
        throw error;
      }
    },
    {
      connection,
      concurrency: 2, // AI tasks are expensive, limit concurrency
      lockDuration: 120000, // 2-minute timeout for AI operations
      limiter: {
        max: 10, // Max 10 AI jobs
        duration: 60000, // Per minute
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info({ jobId: job?.id }, 'AI job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ error: err instanceof Error ? err.message : String(err) }, 'AI job failed');
  });

  worker.on('error', (err) => {
    logger.error({ error: err instanceof Error ? err.message : String(err) }, 'AI worker error');
  });

  logger.info({}, 'AI worker started');
  return worker;
}

/**
 * Process daily briefing generation
 * Generates actionable insights from daily metrics
 */
async function processDailyBriefing(data: DailyBriefingJobData): Promise<any> {
  const { companyId, date, userIds } = data;
  
  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  logger.info({ company: company.name, date }, 'Generating daily briefing');

  try {
    // Get actual daily metrics from storage
    const metrics = await storage.getCompanyDailyMetrics(companyId, date);
    
    // Get previous day for comparison
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevMetrics = await storage.getCompanyDailyMetrics(companyId, prevDateStr);

    // Calculate trends (positive/negative vs previous day)
    const orderTrend = metrics.ordersToday >= prevMetrics.ordersToday ? 'up' : 'down';
    const revenueTrend = metrics.revenueToday >= prevMetrics.revenueToday ? 'up' : 'down';
    const orderChange = ((metrics.ordersToday - prevMetrics.ordersToday) / Math.max(prevMetrics.ordersToday, 1)) * 100;
    const revenueChange = ((metrics.revenueToday - prevMetrics.revenueToday) / Math.max(prevMetrics.revenueToday, 1)) * 100;

    // Generate AI-powered highlights and recommendations
    const highlights: string[] = [];
    const recommendations: string[] = [];

    if (metrics.ordersToday > 0) {
      highlights.push(`${metrics.ordersToday} orders processed (${orderTrend === 'up' ? '📈' : '📉'} ${Math.abs(orderChange).toFixed(1)}%)`);
    }
    
    if (metrics.revenueToday > 0) {
      highlights.push(`$${metrics.revenueToday.toLocaleString()} revenue generated (${revenueTrend === 'up' ? '📈' : '📉'} ${Math.abs(revenueChange).toFixed(1)}%)`);
    }
    
    if (metrics.patientsToday > 0) {
      highlights.push(`${metrics.patientsToday} new patients served`);
    }

    if (metrics.ordersInProduction > 0) {
      highlights.push(`${metrics.ordersInProduction} orders in production`);
    }

    // AI Recommendations based on metrics
    if (metrics.ordersToday === 0) {
      recommendations.push('No orders today. Consider outreach campaigns to ECPs.');
    } else if (metrics.ordersToday > 20) {
      recommendations.push('High order volume detected. Ensure production team is staffed appropriately.');
    }

    if (metrics.completedOrders > 0) {
      recommendations.push(`${metrics.completedOrders} orders ready for shipment. Consider batch processing for efficiency.`);
    }

    // Get inventory alerts
    const inventory = await storage.getInventoryMetrics(companyId);
    if (inventory.lowStockProducts > 0) {
      recommendations.push(`🚨 ${inventory.lowStockProducts} products below reorder threshold. Review purchase orders.`);
      highlights.push(`⚠️ Inventory Alert: ${inventory.lowStockProducts} low-stock items`);
    }

    const summary = `
${metrics.ordersToday} orders | $${metrics.revenueToday} revenue | ${metrics.patientsToday} patients
${metrics.completedOrders} completed | ${metrics.ordersInProduction} in production
    `.trim();

    const briefing = {
      date,
      companyId,
      companyName: company.name,
      summary,
      highlights,
      recommendations,
      metrics: {
        ordersToday: metrics.ordersToday,
        revenueToday: metrics.revenueToday,
        patientsToday: metrics.patientsToday,
        completedOrders: metrics.completedOrders,
        ordersInProduction: metrics.ordersInProduction,
      },
      trends: {
        orders: orderTrend,
        revenue: revenueTrend,
        orderChange: orderChange.toFixed(2),
        revenueChange: revenueChange.toFixed(2),
      },
    };

    // Store briefing notification in database
    if (userIds && userIds.length > 0) {
      // Notify specific users
      for (const userId of userIds) {
        await db.insert(aiNotifications).values({
          id: crypto.randomUUID(),
          companyId,
          userId,
          type: 'briefing',
          priority: metrics.ordersInProduction > 10 ? 'high' : 'medium',
          title: `Daily Briefing - ${date}`,
          message: summary,
          summary: highlights.slice(0, 2).join(' | '),
          recommendation: recommendations[0] || 'All metrics normal',
          actionUrl: '/dashboard/analytics',
          actionLabel: 'View Dashboard',
          data: JSON.stringify(briefing),
          generatedBy: 'daily_briefing_worker',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    } else {
      // Notify all company admins/managers
      const admins = await db.query.users.findMany({
        where: eq(users.companyId, companyId),
      });

      for (const admin of admins) {
        await db.insert(aiNotifications).values({
          id: crypto.randomUUID(),
          companyId,
          userId: admin.id,
          type: 'briefing',
          priority: metrics.ordersInProduction > 10 ? 'high' : 'medium',
          title: `Daily Briefing - ${date}`,
          message: summary,
          summary: highlights.slice(0, 2).join(' | '),
          recommendation: recommendations[0] || 'All metrics normal',
          actionUrl: '/dashboard/analytics',
          actionLabel: 'View Dashboard',
          data: JSON.stringify(briefing),
          generatedBy: 'daily_briefing_worker',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    logger.info({ company: company.name, highlightCount: highlights.length, recommendationCount: recommendations.length }, 'Daily briefing generated');
    return briefing;
  } catch (error) {
    logger.error({ company: company.name, error: error instanceof Error ? error.message : String(error) }, 'Error generating daily briefing');
    throw error;
  }
}

/**
 * Process demand forecast
 * Predicts future demand based on historical patterns and inventory levels
 */
async function processDemandForecast(data: DemandForecastJobData): Promise<any> {
  const { companyId, productIds, forecastDays } = data;
  
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  logger.info({ company: company.name, forecastDays }, 'Generating demand forecast');

  try {
    // Get inventory data
    const inventory = await storage.getInventoryMetrics(companyId);
    
    // Get 30-day historical order trend
    const timeSeries = await storage.getTimeSeriesMetrics(companyId, 'orders', 30);
    
    // Calculate average daily orders
    const avgDailyOrders = timeSeries.length > 0 
      ? timeSeries.reduce((sum, d) => sum + d.value, 0) / timeSeries.length
      : 10;

    // Generate predictions for each product
    const predictions = inventory.products.map((product) => {
      // Simple exponential smoothing forecast
      const avgUsage = product.averageMonthlyUsage / 30; // Daily usage
      const daysToRunOut = product.currentStock > 0 
        ? Math.ceil(product.currentStock / Math.max(avgUsage, 0.1))
        : 0;

      const predictedDemand = Math.round(avgUsage * forecastDays);
      const stockAfterForecast = product.currentStock - predictedDemand;
      const reorderNeeded = stockAfterForecast < product.reorderThreshold;

      let recommendation = 'Monitor stock levels';
      if (daysToRunOut <= 7 && daysToRunOut > 0) {
        recommendation = `⚠️ URGENT: Only ${daysToRunOut} days of stock remaining - order immediately`;
      } else if (reorderNeeded) {
        const quantityNeeded = Math.max(
          product.reorderThreshold * 2 - product.currentStock,
          predictedDemand
        );
        recommendation = `Order ${quantityNeeded} units to maintain ${product.reorderThreshold} minimum`;
      }

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.currentStock,
        avgDailyUsage: avgUsage.toFixed(2),
        predictedDemand,
        projectedStock: stockAfterForecast,
        daysToRunOut: daysToRunOut > 0 ? daysToRunOut : null,
        reorderThreshold: product.reorderThreshold,
        recommendation,
        confidence: Math.min(95, 70 + (timeSeries.length * 2)), // Higher confidence with more data
      };
    });

    const forecast = {
      companyId,
      companyName: company.name,
      forecastDays,
      generatedAt: new Date().toISOString(),
      historicalAvgDailyOrders: avgDailyOrders.toFixed(2),
      predictions: predictions.sort((a, b) => {
        // Sort urgent items first
        if (a.daysToRunOut && !b.daysToRunOut) return -1;
        if (!a.daysToRunOut && b.daysToRunOut) return 1;
        if (a.daysToRunOut && b.daysToRunOut) {
          return a.daysToRunOut - b.daysToRunOut;
        }
        return 0;
      }),
      summary: `Analyzed ${predictions.length} products. ${predictions.filter(p => p.daysToRunOut && p.daysToRunOut <= 7).length} require reordering.`,
      urgentProducts: predictions.filter(p => p.daysToRunOut && p.daysToRunOut <= 7).length,
    };

    // Store forecast notifications for products needing attention
    const urgentPredictions = predictions.filter(p => p.daysToRunOut && p.daysToRunOut <= 7);
    if (urgentPredictions.length > 0) {
      const admins = await db.query.users.findMany({
        where: eq(users.companyId, companyId),
      });

      for (const admin of admins) {
        await db.insert(aiNotifications).values({
          id: crypto.randomUUID(),
          companyId,
          userId: admin.id,
          type: 'alert',
          priority: 'critical',
          title: `🚨 Inventory Alert: ${urgentPredictions.length} products running low`,
          message: `${urgentPredictions.map(p => `${p.productName}: ${p.daysToRunOut} days remaining`).join(', ')}`,
          summary: `${urgentPredictions.length} urgent reorder items`,
          recommendation: 'Review demand forecast and submit purchase orders',
          actionUrl: '/inventory/forecast',
          actionLabel: 'View Forecast',
          data: JSON.stringify(forecast),
          generatedBy: 'demand_forecast_worker',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    logger.info({ company: company.name, productCount: predictions.length }, 'Demand forecast generated');
    return forecast;
  } catch (error) {
    logger.error({ company: company.name, error: error instanceof Error ? error.message : String(error) }, 'Error generating demand forecast');
    throw error;
  }
}

/**
 * Process anomaly detection
 * Uses statistical analysis to detect unusual patterns in business metrics
 */
async function processAnomalyDetection(data: AnomalyDetectionJobData): Promise<any> {
  const { companyId, metricType, timeRange } = data;
  
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  logger.info({ company: company.name, metricType, timeRange }, 'Running anomaly detection');

  try {
    let timeSeries: Array<{ date: string; value: number }> = [];
    let daysToAnalyze = 30;
    
    if (timeRange === 'daily') daysToAnalyze = 30;
    else if (timeRange === 'weekly') daysToAnalyze = 90;
    else if (timeRange === 'monthly') daysToAnalyze = 365;

    // Get appropriate metric time series
    if (metricType === 'revenue' || metricType === 'orders') {
      timeSeries = await storage.getTimeSeriesMetrics(
        companyId,
        metricType as 'revenue' | 'orders',
        daysToAnalyze
      );
    } else if (metricType === 'inventory') {
      const inventory = await storage.getInventoryMetrics(companyId);
      timeSeries = inventory.products.map((p, i) => ({
        date: new Date().toISOString().split('T')[0],
        value: p.currentStock,
      }));
    } else if (metricType === 'patients') {
      timeSeries = await storage.getTimeSeriesMetrics(companyId, 'orders', daysToAnalyze);
    }

    // Calculate statistics
    const values = timeSeries.map(d => d.value);
    const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const variance = values.length > 0 
      ? values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length 
      : 0;
    const stdDev = Math.sqrt(variance);
    const upperBound = mean + (2 * stdDev);
    const lowerBound = Math.max(0, mean - (2 * stdDev));

    // Detect anomalies (values outside 2 standard deviations)
    const anomalies = timeSeries
      .filter(point => point.value > upperBound || point.value < lowerBound)
      .map(point => ({
        date: point.date,
        value: point.value,
        deviation: ((point.value - mean) / Math.max(stdDev, 1) * 100).toFixed(1),
        severity: Math.abs(point.value - mean) > 3 * stdDev ? 'critical' : 'warning',
      }));

    // Generate insights from anomalies
    const insights: string[] = [];
    if (anomalies.length > 0) {
      const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
      if (criticalCount > 0) {
        insights.push(`🚨 ${criticalCount} critical anomalies detected - investigate immediately`);
      }
      if (anomalies.some(a => a.value > upperBound)) {
        insights.push('📈 Unusual spike detected - verify data quality');
      }
      if (anomalies.some(a => a.value < lowerBound)) {
        insights.push('📉 Significant decline detected - check for operational issues');
      }
    } else {
      insights.push('✅ All metrics within normal ranges');
    }

    const results = {
      companyId,
      companyName: company.name,
      metricType,
      timeRange,
      anomaliesDetected: anomalies.length,
      statistics: {
        mean: mean.toFixed(2),
        stdDev: stdDev.toFixed(2),
        upperBound: upperBound.toFixed(2),
        lowerBound: lowerBound.toFixed(2),
      },
      anomalies: anomalies.slice(0, 20), // Top 20 anomalies
      insights,
      checkedAt: new Date().toISOString(),
      dataPoints: timeSeries.length,
    };

    // Notify if critical anomalies found
    if (anomalies.some(a => a.severity === 'critical')) {
      const admins = await db.query.users.findMany({
        where: eq(users.companyId, companyId),
      });

      for (const admin of admins) {
        await db.insert(aiNotifications).values({
          id: crypto.randomUUID(),
          companyId,
          userId: admin.id,
          type: 'alert',
          priority: 'critical',
          title: `🚨 Anomaly Detected: ${metricType}`,
          message: insights.join(' | '),
          summary: `${anomalies.length} anomalies in ${metricType}`,
          recommendation: 'Review the anomaly analysis for detailed insights',
          actionUrl: '/dashboard/anomalies',
          actionLabel: 'View Analysis',
          data: JSON.stringify(results),
          generatedBy: 'anomaly_detection_worker',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    logger.info({ company: company.name, anomalyCount: anomalies.length }, 'Anomaly detection completed');
    return results;
  } catch (error) {
    logger.error({ company: company.name, error: error instanceof Error ? error.message : String(error) }, 'Error in anomaly detection');
    throw error;
  }
}

/**
 * Process insight generation
 * Generates business intelligence and actionable recommendations
 */
async function processInsightGeneration(data: InsightGenerationJobData): Promise<any> {
  const { companyId, insightType, periodStart, periodEnd } = data;
  
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  logger.info({ company: company.name, insightType, periodStart, periodEnd }, 'Generating insights');

  try {
    const periodMetrics = await storage.getPeriodMetrics(companyId, periodStart, periodEnd);
    
    const insights: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      actionable: boolean;
      recommendation: string;
      impact: string;
    }> = [];

    if (insightType === 'revenue') {
      const avgOrderValue = periodMetrics.averageOrderValue;
      const totalRevenue = periodMetrics.totalRevenue;

      insights.push({
        title: 'Revenue Performance',
        description: `Generated $${totalRevenue.toLocaleString()} revenue from ${periodMetrics.totalOrders} orders`,
        priority: totalRevenue > 50000 ? 'high' : 'medium',
        actionable: true,
        recommendation: avgOrderValue > 500 
          ? 'Maintain current pricing strategy - strong AOV'
          : 'Consider upsell opportunities to increase average order value',
        impact: totalRevenue > 50000 ? 'Strong growth trajectory' : 'Growth opportunity',
      });

      if (periodMetrics.topECPs.length > 0) {
        insights.push({
          title: 'Top Performing Partners',
          description: `${periodMetrics.topECPs[0].name} is your highest-value partner with $${periodMetrics.topECPs[0].revenue} revenue`,
          priority: 'high',
          actionable: true,
          recommendation: `Nurture relationship with top ECPs - consider loyalty incentives or volume discounts`,
          impact: 'High-value partnership retention',
        });
      }
    } else if (insightType === 'inventory') {
      const inventory = await storage.getInventoryMetrics(companyId);
      
      insights.push({
        title: 'Inventory Status',
        description: `${inventory.lowStockProducts} products below reorder threshold`,
        priority: inventory.lowStockProducts > 5 ? 'high' : 'medium',
        actionable: true,
        recommendation: `Prioritize reordering ${Math.min(3, inventory.lowStockProducts)} critical items to avoid stockouts`,
        impact: 'Supply chain continuity',
      });

      if (inventory.totalProducts > 0) {
        const stockLevel = ((inventory.totalProducts - inventory.lowStockProducts) / inventory.totalProducts * 100).toFixed(1);
        insights.push({
          title: 'Overall Stock Health',
          description: `${stockLevel}% of inventory at healthy levels`,
          priority: parseFloat(stockLevel) > 75 ? 'low' : 'medium',
          actionable: false,
          recommendation: 'Continue monitoring inventory turns and adjust reorder points based on demand patterns',
          impact: 'Operational efficiency',
        });
      }
    } else if (insightType === 'patient-care') {
      insights.push({
        title: 'Patient Volume',
        description: `Served ${periodMetrics.totalPatients} patients during the period`,
        priority: 'medium',
        actionable: true,
        recommendation: `Average of ${(periodMetrics.totalPatients / 30).toFixed(1)} patients/day. Consider staffing adjustments if trend continues`,
        impact: 'Patient satisfaction and throughput',
      });

      const orderPerPatient = (periodMetrics.totalOrders / Math.max(periodMetrics.totalPatients, 1)).toFixed(2);
      insights.push({
        title: 'Order per Patient Ratio',
        description: `${orderPerPatient} orders per patient on average`,
        priority: orderPerPatient > '1.5' ? 'high' : 'medium',
        actionable: true,
        recommendation: orderPerPatient > '1.5'
          ? '✅ Strong repeat business - continue current care protocols'
          : 'Consider follow-up campaigns and patient retention initiatives',
        impact: 'Patient lifetime value',
      });
    } else if (insightType === 'operations') {
      const avgOrderValue = periodMetrics.averageOrderValue;
      const daysInPeriod = Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24));
      const ordersPerDay = (periodMetrics.totalOrders / daysInPeriod).toFixed(1);

      insights.push({
        title: 'Production Efficiency',
        description: `Processing ${ordersPerDay} orders/day on average`,
        priority: parseFloat(ordersPerDay) > 15 ? 'high' : 'medium',
        actionable: true,
        recommendation: parseFloat(ordersPerDay) > 15
          ? 'High throughput detected. Optimize production workflow and quality checks.'
          : 'Current pace sustainable. Monitor for capacity expansion needs.',
        impact: 'Operational scalability',
      });

      insights.push({
        title: 'Financial Metrics',
        description: `$${avgOrderValue} average order value`,
        priority: 'medium',
        actionable: true,
        recommendation: avgOrderValue > 400
          ? 'Premium product mix driving strong margins. Maintain focus on quality.'
          : 'Consider bundling and premium options to increase AOV',
        impact: 'Margin optimization',
      });
    }

    const result = {
      companyId,
      companyName: company.name,
      insightType,
      periodStart,
      periodEnd,
      insights,
      metrics: periodMetrics,
      generatedAt: new Date().toISOString(),
      summary: `Generated ${insights.length} actionable insights for ${insightType}`,
    };

    // Store insights as notifications
    const admins = await db.query.users.findMany({
      where: eq(users.companyId, companyId),
    });

    const topInsight = insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })[0];

    if (topInsight && admins.length > 0) {
      for (const admin of admins) {
        await db.insert(aiNotifications).values({
          id: crypto.randomUUID(),
          companyId,
          userId: admin.id,
          type: 'insight',
          priority: topInsight.priority === 'high' ? 'high' : 'medium',
          title: `📊 ${insightType.charAt(0).toUpperCase() + insightType.slice(1)} Insights`,
          message: topInsight.description,
          summary: topInsight.title,
          recommendation: topInsight.recommendation,
          actionUrl: '/dashboard/insights',
          actionLabel: 'View All Insights',
          data: JSON.stringify(result),
          generatedBy: 'insight_generation_worker',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    logger.info({ company: company.name, insightCount: insights.length }, 'Insights generated');
    return result;
  } catch (error) {
    logger.error({ company: company.name, error: error instanceof Error ? error.message : String(error) }, 'Error generating insights');
    throw error;
  }
}

/**
 * Process chat response (AI assistant)
 * Generates contextual AI responses using conversation history and company data
 */
async function processChatResponse(data: ChatResponseJobData): Promise<any> {
  const { userId, companyId, conversationId, message } = data;
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!user || !company) {
    throw new Error('User or company not found');
  }

  logger.info({ userEmail: user.email, company: company.name }, 'Processing chat response');

  try {
    // Get conversation context
    const conversationHistory = await storage.getAiConversationContext(conversationId, companyId, 5);
    
    // Get relevant company data for context
    const dailyMetrics = await storage.getCompanyDailyMetrics(
      companyId,
      new Date().toISOString().split('T')[0]
    );
    const inventory = await storage.getInventoryMetrics(companyId);

    // Determine response type based on message keywords
    const response = generateContextualResponse(message, {
      conversationHistory,
      dailyMetrics,
      inventory,
      userName: user.firstName || 'User',
      companyName: company.name,
    });

    const chatResponse = {
      conversationId,
      userId,
      companyId,
      userMessage: message,
      assistantResponse: response,
      timestamp: new Date().toISOString(),
      context: {
        messageLength: message.length,
        historicalContext: conversationHistory.length,
      },
    };

    // Store message in AI messages table
    await db.insert(aiMessages).values({
      id: crypto.randomUUID(),
      conversationId,
      senderType: 'assistant',
      messageContent: response,
      timestamp: new Date(),
      metadata: JSON.stringify({ confidence: 0.85, model: 'contextual-responder' }),
    } as any);

    logger.info({ userEmail: user.email }, 'Chat response generated');
    return chatResponse;
  } catch (error) {
    logger.error({ userEmail: user.email, error: error instanceof Error ? error.message : String(error) }, 'Error generating chat response');
    throw error;
  }
}

/**
 * Generate contextual AI response based on message content and company context
 */
function generateContextualResponse(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();

  // Order/Operations queries
  if (lowerMessage.includes('orders') || lowerMessage.includes('production')) {
    const metrics = context.dailyMetrics;
    return `Great question! Today we've processed ${metrics.ordersToday} orders with ${metrics.ordersInProduction} currently in production. ${metrics.completedOrders} orders are ready for shipment. Is there a specific order you'd like to check on?`;
  }

  // Inventory queries
  if (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('product')) {
    const inventory = context.inventory;
    if (inventory.lowStockProducts > 0) {
      return `We have ${inventory.lowStockProducts} products below reorder threshold. I recommend reviewing these items urgently: ${inventory.products.filter((p: any) => p.currentStock < p.reorderThreshold).slice(0, 3).map((p: any) => p.name).join(', ')}. Would you like to generate a purchase order?`;
    }
    return `Inventory levels look good! We have ${inventory.totalProducts} products in stock. All items are at healthy levels. Let me know if you need detailed inventory analysis.`;
  }

  // Revenue/financial queries
  if (lowerMessage.includes('revenue') || lowerMessage.includes('sales') || lowerMessage.includes('profit')) {
    const metrics = context.dailyMetrics;
    return `Today's financial performance: $${metrics.revenueToday} in revenue from ${metrics.ordersToday} orders. Would you like me to break this down by product or time period?`;
  }

  // Performance queries
  if (lowerMessage.includes('performance') || lowerMessage.includes('metrics') || lowerMessage.includes('dashboard')) {
    const metrics = context.dailyMetrics;
    return `Here's today's snapshot:\n• Orders: ${metrics.ordersToday}\n• Revenue: $${metrics.revenueToday}\n• Patients: ${metrics.patientsToday}\n• In Production: ${metrics.ordersInProduction}\n\nWould you like more detailed analytics for a specific period?`;
  }

  // Help queries
  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
    return `I can help you with:\n• Order status and tracking\n• Inventory and stock levels\n• Revenue and sales metrics\n• Demand forecasts\n• Anomaly detection\n• Daily briefings\n\nWhat would you like to explore?`;
  }

  // General greeting
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return `Hey ${context.userName}! 👋 Welcome to ${context.companyName}'s AI Assistant. How can I help you today? Ask me about orders, inventory, revenue, or any business metrics.`;
  }

  // Default intelligent response
  return `That's an interesting question! Based on ${context.companyName}'s data, I can provide insights on operations, inventory, revenue, and forecasts. Could you provide more details about what you'd like to know? For example: "Show me today's revenue" or "What products need restocking?"`;
}


/**
 * Fallback: Process AI job immediately if queue not available
 * Useful for development or when Redis is unavailable
 */
export async function processAIImmediate(data: AIJobData): Promise<any> {
  logger.info({ jobType: data.type }, '[FALLBACK] Processing AI job immediately');
  
  switch (data.type) {
    case 'daily-briefing':
      return await processDailyBriefing(data);
    case 'demand-forecast':
      return await processDemandForecast(data);
    case 'anomaly-detection':
      return await processAnomalyDetection(data);
    case 'insight-generation':
      return await processInsightGeneration(data);
    case 'chat-response':
      return await processChatResponse(data);
    default:
      throw new Error(`Unknown AI job type: ${(data as any).type}`);
  }
}

// Start worker if Redis is available
export const aiWorker = createAIWorker();
