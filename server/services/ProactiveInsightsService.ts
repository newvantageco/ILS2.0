/**
 * Proactive Insights Service
 * 
 * Generates automated daily briefings and real-time alerts for business owners.
 * Runs analysis every morning at 8 AM and creates notifications for:
 * - Revenue performance vs. previous periods
 * - Low stock alerts
 * - Patients needing recall
 * - Pending orders requiring attention
 * - Top performing products
 * 
 * Turns the AI from reactive (waits for questions) to proactive (provides insights).
 */

import { createLogger } from "../utils/logger";
import { AIDataAccess, type QueryContext } from "./AIDataAccess";
import { ExternalAIService } from "./ExternalAIService";

const logger = createLogger("ProactiveInsights");

export interface Insight {
  type: 'positive' | 'warning' | 'critical' | 'info';
  priority: number; // 1-5, higher = more urgent
  title: string;
  message: string;
  recommendation?: string;
  actionUrl?: string; // Link to relevant page
  data?: Record<string, any>; // Supporting data
}

export interface DailyBriefing {
  companyId: string;
  generatedAt: Date;
  summary: string;
  insights: Insight[];
  metrics: {
    revenue: {
      yesterday: number;
      weekAverage: number;
      monthTotal: number;
      changePercent: number;
    };
    orders: {
      pending: number;
      completed: number;
      total: number;
    };
    inventory: {
      lowStockCount: number;
      criticalItems: string[];
    };
    patients: {
      total: number;
      needingRecall: number;
    };
  };
}

export class ProactiveInsightsService {
  private externalAI: ExternalAIService;

  constructor() {
    this.externalAI = new ExternalAIService();
  }

  /**
   * Generate a complete daily briefing for a company
   */
  async generateDailyBriefing(companyId: string, userId: string): Promise<DailyBriefing> {
    logger.info("Generating daily briefing", { companyId });

    const context: QueryContext = {
      companyId,
      userId,
    };

    try {
      // Gather all metrics in parallel
      const [
        todayRevenue,
        weekRevenue,
        monthRevenue,
        orderStats,
        lowStockItems,
        topProducts,
        patientStats,
        pendingOrders,
      ] = await Promise.all([
        this.getRevenueForPeriod(context, this.getDateRange('today')),
        this.getRevenueForPeriod(context, this.getDateRange('week')),
        this.getRevenueForPeriod(context, this.getDateRange('month')),
        AIDataAccess.getOrderStats(context),
        AIDataAccess.getLowStockItems(context, 10),
        AIDataAccess.getTopSellingProducts(context, 5),
        AIDataAccess.getPatientStats(context),
        AIDataAccess.getPendingOrders(context),
      ]);

      // Calculate yesterday's revenue
      const yesterdayRevenue = await this.getRevenueForPeriod(
        context, 
        this.getDateRange('yesterday')
      );

      // Calculate averages
      const weekAverage = weekRevenue.totalRevenue / 7;
      const changePercent = weekAverage > 0 
        ? ((yesterdayRevenue.totalRevenue - weekAverage) / weekAverage) * 100
        : 0;

      // Generate insights
      const insights = await this.analyzeMetrics({
        yesterdayRevenue,
        weekAverage,
        monthRevenue: monthRevenue.totalRevenue,
        changePercent,
        orderStats,
        lowStockItems,
        topProducts,
        patientStats,
        pendingOrders,
      });

      // Generate summary using AI
      const summary = await this.generateAISummary(insights);

      const briefing: DailyBriefing = {
        companyId,
        generatedAt: new Date(),
        summary,
        insights,
        metrics: {
          revenue: {
            yesterday: yesterdayRevenue.totalRevenue,
            weekAverage,
            monthTotal: monthRevenue.totalRevenue,
            changePercent,
          },
          orders: {
            pending: orderStats.byStatus['pending'] || 0,
            completed: orderStats.byStatus['complete'] || 0,
            total: orderStats.total,
          },
          inventory: {
            lowStockCount: lowStockItems.length,
            criticalItems: lowStockItems.slice(0, 3).map(i => i.name || 'Unknown'),
          },
          patients: {
            total: patientStats.totalPatients,
            needingRecall: patientStats.needingRecall,
          },
        },
      };

      logger.info("Daily briefing generated", { 
        companyId, 
        insightCount: insights.length 
      });

      return briefing;
    } catch (error) {
      logger.error("Failed to generate daily briefing", error as Error);
      throw error;
    }
  }

  /**
   * Analyze metrics and generate actionable insights
   */
  private async analyzeMetrics(data: {
    yesterdayRevenue: any;
    weekAverage: number;
    monthRevenue: number;
    changePercent: number;
    orderStats: any;
    lowStockItems: any[];
    topProducts: any[];
    patientStats: any;
    pendingOrders: any[];
  }): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Revenue insights
    if (data.changePercent > 20) {
      insights.push({
        type: 'positive',
        priority: 4,
        title: '📈 Revenue Surge',
        message: `Yesterday's revenue was $${data.yesterdayRevenue.totalRevenue.toFixed(2)}, up ${data.changePercent.toFixed(1)}% from your weekly average!`,
        recommendation: 'Analyze what drove this increase to replicate the success.',
      });
    } else if (data.changePercent < -20) {
      insights.push({
        type: 'warning',
        priority: 4,
        title: '📉 Revenue Below Average',
        message: `Yesterday's revenue was $${data.yesterdayRevenue.totalRevenue.toFixed(2)}, down ${Math.abs(data.changePercent).toFixed(1)}% from your weekly average.`,
        recommendation: 'Review recent trends and consider promotional activities.',
      });
    }

    // Low stock alerts
    if (data.lowStockItems.length > 0) {
      const criticalItems = data.lowStockItems.filter(item => 
        (item.stockQuantity || 0) <= 5
      );

      if (criticalItems.length > 0) {
        insights.push({
          type: 'critical',
          priority: 5,
          title: '🚨 Critical Stock Alert',
          message: `${criticalItems.length} items are critically low (≤5 units): ${criticalItems.slice(0, 3).map(i => i.name).join(', ')}`,
          recommendation: 'Create purchase orders immediately to avoid stockouts.',
          actionUrl: '/inventory',
          data: { items: criticalItems },
        });
      } else {
        insights.push({
          type: 'warning',
          priority: 3,
          title: '⚠️ Low Stock Warning',
          message: `${data.lowStockItems.length} items are running low on stock.`,
          recommendation: 'Review inventory levels and plan upcoming orders.',
          actionUrl: '/inventory',
        });
      }
    }

    // Patient recall insights
    if (data.patientStats.needingRecall > 0) {
      insights.push({
        type: 'info',
        priority: 2,
        title: '👥 Patient Recalls Due',
        message: `${data.patientStats.needingRecall} patients are due for their next eye exam.`,
        recommendation: 'Send recall notifications to maintain patient relationships and generate revenue.',
        actionUrl: '/patients',
      });
    }

    // Pending orders
    if (data.pendingOrders.length > 10) {
      insights.push({
        type: 'warning',
        priority: 3,
        title: '📦 High Pending Orders',
        message: `You have ${data.pendingOrders.length} orders pending completion.`,
        recommendation: 'Review and process orders to maintain customer satisfaction.',
        actionUrl: '/orders',
      });
    }

    // Top products
    if (data.topProducts.length > 0) {
      const topProduct = data.topProducts[0];
      insights.push({
        type: 'positive',
        priority: 1,
        title: '⭐ Best Seller',
        message: `${topProduct.name} is your top seller with ${topProduct.quantitySold} units sold recently.`,
        recommendation: 'Ensure adequate stock of this popular item.',
        data: { topProducts: data.topProducts },
      });
    }

    return insights.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate AI-powered summary of the day
   */
  private async generateAISummary(insights: Insight[]): Promise<string> {
    if (insights.length === 0) {
      return "No significant insights today. Your business is running smoothly!";
    }

    try {
      const insightText = insights.map(i => 
        `${i.type.toUpperCase()}: ${i.title} - ${i.message}`
      ).join('\n');

      const prompt = `You are a business advisor. Summarize these daily insights in 2-3 sentences that are encouraging and actionable:\n\n${insightText}`;

      const response = await this.externalAI.generateResponse([
        { role: 'system', content: 'You are a helpful business advisor for optometry practices.' },
        { role: 'user', content: prompt }
      ], {
        provider: 'ollama',
        model: 'llama3.1:latest',
        temperature: 0.7,
        maxTokens: 150,
      });

      return response.content || this.getDefaultSummary(insights);
    } catch (error) {
      logger.error("Failed to generate AI summary", error as Error);
      return this.getDefaultSummary(insights);
    }
  }

  /**
   * Fallback summary without AI
   */
  private getDefaultSummary(insights: Insight[]): string {
    const critical = insights.filter(i => i.type === 'critical').length;
    const positive = insights.filter(i => i.type === 'positive').length;

    if (critical > 0) {
      return `You have ${critical} critical alert${critical > 1 ? 's' : ''} requiring immediate attention today.`;
    } else if (positive > 0) {
      return `Good morning! Your business has ${positive} positive development${positive > 1 ? 's' : ''} to celebrate today.`;
    } else {
      return "Your daily briefing is ready. Review the insights below for today's priorities.";
    }
  }

  /**
   * Get revenue for a specific time period
   */
  private async getRevenueForPeriod(context: QueryContext, timeframe: { start: Date; end: Date }) {
    return await AIDataAccess.getRevenueData({
      ...context,
      timeframe,
    });
  }

  /**
   * Helper to get date ranges
   */
  private getDateRange(period: 'today' | 'yesterday' | 'week' | 'month'): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      
      case 'yesterday':
        return {
          start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
          end: today,
        };
      
      case 'week':
        return {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: today,
        };
      
      case 'month':
        return {
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: today,
        };
    }
  }

  /**
   * Generate real-time alert for specific events
   */
  async generateAlert(
    companyId: string,
    userId: string,
    alertType: 'low_stock' | 'pending_order' | 'patient_recall',
    data: any
  ): Promise<Insight> {
    logger.info("Generating real-time alert", { companyId, alertType });

    switch (alertType) {
      case 'low_stock':
        return {
          type: 'critical',
          priority: 5,
          title: '🚨 Stock Alert',
          message: `${data.productName} is down to ${data.quantity} units!`,
          recommendation: 'Reorder immediately to prevent stockout.',
          actionUrl: '/inventory',
          data,
        };

      case 'pending_order':
        return {
          type: 'warning',
          priority: 3,
          title: '📦 Order Waiting',
          message: `Order #${data.orderNumber} has been pending for ${data.days} days.`,
          recommendation: 'Review and complete this order.',
          actionUrl: `/orders/${data.orderId}`,
          data,
        };

      case 'patient_recall':
        return {
          type: 'info',
          priority: 2,
          title: '👤 Patient Recall',
          message: `${data.patientName} is due for their annual exam.`,
          recommendation: 'Send recall notification.',
          actionUrl: `/patients/${data.patientId}`,
          data,
        };

      default:
        throw new Error(`Unknown alert type: ${alertType}`);
    }
  }
}
