/**
 * Advanced Analytics Service for ILS 2.0
 * 
 * Comprehensive analytics and reporting system including:
 * - Business intelligence metrics
 * - Prescription analytics
 * - Order performance tracking
 * - AI model analytics
 * - Financial reporting
 * - User behavior analysis
 */

import { logger } from '../utils/logger';
import { db } from '../db';
import { eq, desc, and, gte, lte, sql, count, sum, avg } from 'drizzle-orm';
import * as schema from '@shared/schema';

export interface PrescriptionAnalytics {
  totalPrescriptions: number;
  prescriptionsByMonth: Array<{ month: string; count: number }>;
  prescriptionsByType: Record<string, number>;
  prescriptionsByECP: Record<string, number>;
  averageProcessingTime: number;
  aiAccuracyRate: number;
  topPrescribedMedications: Array<{
    medication: string;
    count: number;
    percentage: number;
  }>;
}

export interface OrderAnalytics {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  ordersByMonth: Array<{ month: string; count: number; revenue: number }>;
  averageOrderValue: number;
  orderFulfillmentTime: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface AIAnalytics {
  totalAnalyses: number;
  accuracyByModel: Record<string, number>;
  processingTimeByModel: Record<string, number>;
  analysesByType: Record<string, number>;
  confidenceScores: {
    average: number;
    distribution: Array<{ range: string; count: number }>;
  };
  errorRates: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
  };
}

export interface UserAnalytics {
  userGrowthMetrics: {
    totalUsers: number;
    newUsersThisMonth: number;
    newUsersThisWeek: number;
    userRetentionRate: number;
    churnRate: number;
  };
  userActivityMetrics: {
    activeUsersToday: number;
    activeUsersThisWeek: number;
    activeUsersThisMonth: number;
    averageSessionDuration: number;
    pageViewsPerSession: number;
  };
  userDemographics: {
    usersByRole: Record<string, number>;
    usersByECP: Record<string, number>;
    geographicDistribution: Record<string, number>;
  };
}

export interface FinancialAnalytics {
  totalRevenue: number;
  revenueByMonth: Array<{ month: string; revenue: number; profit: number }>;
  revenueBySource: Record<string, number>;
  averageRevenuePerUser: number;
  subscriptionMetrics: {
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
    subscriptionGrowthRate: number;
  };
  costAnalysis: {
    totalCosts: number;
    costsByCategory: Record<string, number>;
    profitMargins: number;
  };
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'prescription' | 'order' | 'ai' | 'user' | 'financial' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on-demand';
  parameters: Record<string, any>;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  active: boolean;
}

export class AnalyticsService {
  /**
   * Get comprehensive prescription analytics
   */
  async getPrescriptionAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    ecpId?: string;
  } = {}): Promise<PrescriptionAnalytics> {
    try {
      const { startDate, endDate, ecpId } = options;
      
      // Build base query
      let baseQuery = db.select().from(schema.prescriptions);
      
      if (startDate) {
        baseQuery = baseQuery.where(gte(schema.prescriptions.createdAt, startDate));
      }
      
      if (endDate) {
        baseQuery = baseQuery.where(lte(schema.prescriptions.createdAt, endDate));
      }
      
      if (ecpId) {
        baseQuery = baseQuery.where(eq(schema.prescriptions.ecpId, ecpId));
      }

      // Get total prescriptions
      const totalResult = await db
        .select({ count: count() })
        .from(schema.prescriptions)
        .where(and(
          startDate ? gte(schema.prescriptions.createdAt, startDate) : undefined,
          endDate ? lte(schema.prescriptions.createdAt, endDate) : undefined,
          ecpId ? eq(schema.prescriptions.ecpId, ecpId) : undefined
        ));
      
      const totalPrescriptions = totalResult[0].count;

      // Get prescriptions by month
      const monthlyResult = await db
        .select({
          month: sql`DATE_TRUNC('month', ${schema.prescriptions.createdAt})::text`,
          count: count()
        })
        .from(schema.prescriptions)
        .where(and(
          startDate ? gte(schema.prescriptions.createdAt, startDate) : undefined,
          endDate ? lte(schema.prescriptions.createdAt, endDate) : undefined,
          ecpId ? eq(schema.prescriptions.ecpId, ecpId) : undefined
        ))
        .groupBy(sql`DATE_TRUNC('month', ${schema.prescriptions.createdAt})`)
        .orderBy(sql`DATE_TRUNC('month', ${schema.prescriptions.createdAt})`);

      // Get prescriptions by type
      const typeResult = await db
        .select({
          type: schema.prescriptions.type,
          count: count()
        })
        .from(schema.prescriptions)
        .where(and(
          startDate ? gte(schema.prescriptions.createdAt, startDate) : undefined,
          endDate ? lte(schema.prescriptions.createdAt, endDate) : undefined,
          ecpId ? eq(schema.prescriptions.ecpId, ecpId) : undefined
        ))
        .groupBy(schema.prescriptions.type);

      // Get AI accuracy rate (simplified)
      const aiAccuracyResult = await db
        .select({
          total: count(),
          accurate: count(sql`CASE WHEN ${schema.prescriptions.aiConfidence} > 0.8 THEN 1 END`)
        })
        .from(schema.prescriptions)
        .where(and(
          startDate ? gte(schema.prescriptions.createdAt, startDate) : undefined,
          endDate ? lte(schema.prescriptions.createdAt, endDate) : undefined,
          ecpId ? eq(schema.prescriptions.ecpId, ecpId) : undefined,
          sql`${schema.prescriptions.aiConfidence} IS NOT NULL`
        ));

      const accuracyData = aiAccuracyResult[0];
      const aiAccuracyRate = accuracyData.total > 0 
        ? (accuracyData.accurate / accuracyData.total) * 100 
        : 0;

      return {
        totalPrescriptions,
        prescriptionsByMonth: monthlyResult.map(row => ({
          month: row.month,
          count: parseInt(row.count as string)
        })),
        prescriptionsByType: typeResult.reduce((acc, row) => {
          acc[row.type || 'unknown'] = parseInt(row.count as string);
          return acc;
        }, {} as Record<string, number>),
        prescriptionsByECP: {}, // Would need to join with users table
        averageProcessingTime: 0, // Would need to track processing times
        aiAccuracyRate,
        topPrescribedMedications: [] // Would need medication data
      };
    } catch (error) {
      logger.error({ error, options }, 'Failed to get prescription analytics');
      throw error;
    }
  }

  /**
   * Get comprehensive order analytics
   */
  async getOrderAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  } = {}): Promise<OrderAnalytics> {
    try {
      const { startDate, endDate, status } = options;

      // Get total orders
      const totalResult = await db
        .select({ count: count() })
        .from(schema.orders)
        .where(and(
          startDate ? gte(schema.orders.createdAt, startDate) : undefined,
          endDate ? lte(schema.orders.createdAt, endDate) : undefined,
          status ? eq(schema.orders.status, status) : undefined
        ));
      
      const totalOrders = totalResult[0].count;

      // Get orders by status
      const statusResult = await db
        .select({
          status: schema.orders.status,
          count: count()
        })
        .from(schema.orders)
        .where(and(
          startDate ? gte(schema.orders.createdAt, startDate) : undefined,
          endDate ? lte(schema.orders.createdAt, endDate) : undefined
        ))
        .groupBy(schema.orders.status);

      // Get orders by month with revenue
      const monthlyResult = await db
        .select({
          month: sql`DATE_TRUNC('month', ${schema.orders.createdAt})::text`,
          count: count(),
          revenue: sum(schema.orders.totalAmount).mapWith(Number)
        })
        .from(schema.orders)
        .where(and(
          startDate ? gte(schema.orders.createdAt, startDate) : undefined,
          endDate ? lte(schema.orders.createdAt, endDate) : undefined
        ))
        .groupBy(sql`DATE_TRUNC('month', ${schema.orders.createdAt})`)
        .orderBy(sql`DATE_TRUNC('month', ${schema.orders.createdAt})`);

      // Get average order value
      const avgResult = await db
        .select({
          average: avg(schema.orders.totalAmount).mapWith(Number)
        })
        .from(schema.orders)
        .where(and(
          startDate ? gte(schema.orders.createdAt, startDate) : undefined,
          endDate ? lte(schema.orders.createdAt, endDate) : undefined
        ));

      return {
        totalOrders,
        ordersByStatus: statusResult.reduce((acc, row) => {
          acc[row.status || 'unknown'] = parseInt(row.count as string);
          return acc;
        }, {} as Record<string, number>),
        ordersByMonth: monthlyResult.map(row => ({
          month: row.month,
          count: parseInt(row.count as string),
          revenue: row.revenue || 0
        })),
        averageOrderValue: avgResult[0]?.average || 0,
        orderFulfillmentTime: 0, // Would need to track fulfillment times
        revenueByMonth: monthlyResult.map(row => ({
          month: row.month,
          revenue: row.revenue || 0
        })),
        topProducts: [] // Would need to join with order items
      };
    } catch (error) {
      logger.error({ error, options }, 'Failed to get order analytics');
      throw error;
    }
  }

  /**
   * Get AI model analytics
   */
  async getAIAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    modelType?: string;
  } = {}): Promise<AIAnalytics> {
    try {
      const { startDate, endDate, modelType } = options;

      // Get total AI analyses
      const totalResult = await db
        .select({ count: count() })
        .from(schema.aiAnalyses)
        .where(and(
          startDate ? gte(schema.aiAnalyses.createdAt, startDate) : undefined,
          endDate ? lte(schema.aiAnalyses.createdAt, endDate) : undefined,
          modelType ? eq(schema.aiAnalyses.modelType, modelType) : undefined
        ));
      
      const totalAnalyses = totalResult[0].count;

      // Get accuracy by model
      const accuracyResult = await db
        .select({
          modelType: schema.aiAnalyses.modelType,
          total: count(),
          accurate: count(sql`CASE WHEN ${schema.aiAnalyses.confidence} > 0.8 THEN 1 END`),
          avgConfidence: avg(schema.aiAnalyses.confidence).mapWith(Number)
        })
        .from(schema.aiAnalyses)
        .where(and(
          startDate ? gte(schema.aiAnalyses.createdAt, startDate) : undefined,
          endDate ? lte(schema.aiAnalyses.createdAt, endDate) : undefined
        ))
        .groupBy(schema.aiAnalyses.modelType);

      // Get analyses by type
      const typeResult = await db
        .select({
          analysisType: schema.aiAnalyses.analysisType,
          count: count()
        })
        .from(schema.aiAnalyses)
        .where(and(
          startDate ? gte(schema.aiAnalyses.createdAt, startDate) : undefined,
          endDate ? lte(schema.aiAnalyses.createdAt, endDate) : undefined
        ))
        .groupBy(schema.aiAnalyses.analysisType);

      // Get confidence score distribution
      const confidenceResult = await db
        .select({
          confidence: schema.aiAnalyses.confidence
        })
        .from(schema.aiAnalyses)
        .where(and(
          startDate ? gte(schema.aiAnalyses.createdAt, startDate) : undefined,
          endDate ? lte(schema.aiAnalyses.createdAt, endDate) : undefined,
          sql`${schema.aiAnalyses.confidence} IS NOT NULL`
        ));

      // Calculate confidence distribution
      const confidenceDistribution = [
        { range: '0.0-0.2', count: 0 },
        { range: '0.2-0.4', count: 0 },
        { range: '0.4-0.6', count: 0 },
        { range: '0.6-0.8', count: 0 },
        { range: '0.8-1.0', count: 0 }
      ];

      confidenceResult.forEach(row => {
        const confidence = row.confidence || 0;
        if (confidence <= 0.2) confidenceDistribution[0].count++;
        else if (confidence <= 0.4) confidenceDistribution[1].count++;
        else if (confidence <= 0.6) confidenceDistribution[2].count++;
        else if (confidence <= 0.8) confidenceDistribution[3].count++;
        else confidenceDistribution[4].count++;
      });

      const avgConfidence = confidenceResult.length > 0
        ? confidenceResult.reduce((sum, row) => sum + (row.confidence || 0), 0) / confidenceResult.length
        : 0;

      return {
        totalAnalyses,
        accuracyByModel: accuracyResult.reduce((acc, row) => {
          const accuracy = row.total > 0 ? (row.accurate / row.total) * 100 : 0;
          acc[row.modelType || 'unknown'] = accuracy;
          return acc;
        }, {} as Record<string, number>),
        processingTimeByModel: {}, // Would need processing time data
        analysesByType: typeResult.reduce((acc, row) => {
          acc[row.analysisType || 'unknown'] = parseInt(row.count as string);
          return acc;
        }, {} as Record<string, number>),
        confidenceScores: {
          average: avgConfidence,
          distribution: confidenceDistribution
        },
        errorRates: {
          totalErrors: 0,
          errorRate: 0,
          errorsByType: {}
        }
      };
    } catch (error) {
      logger.error({ error, options }, 'Failed to get AI analytics');
      throw error;
    }
  }

  /**
   * Get user behavior analytics
   */
  async getUserAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    role?: string;
  } = {}): Promise<UserAnalytics> {
    try {
      const { startDate, endDate, role } = options;

      // Get user growth metrics
      const totalUsersResult = await db
        .select({ count: count() })
        .from(schema.users)
        .where(role ? eq(schema.users.role, role) : undefined);

      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const newUsersMonthResult = await db
        .select({ count: count() })
        .from(schema.users)
        .where(and(
          gte(schema.users.createdAt, monthAgo),
          role ? eq(schema.users.role, role) : undefined
        ));

      const newUsersWeekResult = await db
        .select({ count: count() })
        .from(schema.users)
        .where(and(
          gte(schema.users.createdAt, weekAgo),
          role ? eq(schema.users.role, role) : undefined
        ));

      // Get users by role
      const roleResult = await db
        .select({
          role: schema.users.role,
          count: count()
        })
        .from(schema.users)
        .groupBy(schema.users.role);

      return {
        userGrowthMetrics: {
          totalUsers: totalUsersResult[0].count,
          newUsersThisMonth: newUsersMonthResult[0].count,
          newUsersThisWeek: newUsersWeekResult[0].count,
          userRetentionRate: 0, // Would need historical data
          churnRate: 0 // Would need churn tracking
        },
        userActivityMetrics: {
          activeUsersToday: 0, // Would need activity tracking
          activeUsersThisWeek: 0,
          activeUsersThisMonth: 0,
          averageSessionDuration: 0,
          pageViewsPerSession: 0
        },
        userDemographics: {
          usersByRole: roleResult.reduce((acc, row) => {
            acc[row.role || 'unknown'] = parseInt(row.count as string);
            return acc;
          }, {} as Record<string, number>),
          usersByECP: {}, // Would need ECP data
          geographicDistribution: {} // Would need location data
        }
      };
    } catch (error) {
      logger.error({ error, options }, 'Failed to get user analytics');
      throw error;
    }
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<FinancialAnalytics> {
    try {
      const { startDate, endDate } = options;

      // Get total revenue from orders
      const revenueResult = await db
        .select({
          total: sum(schema.orders.totalAmount).mapWith(Number)
        })
        .from(schema.orders)
        .where(and(
          startDate ? gte(schema.orders.createdAt, startDate) : undefined,
          endDate ? lte(schema.orders.createdAt, endDate) : undefined,
          eq(schema.orders.status, 'completed')
        ));

      // Get revenue by month
      const monthlyRevenueResult = await db
        .select({
          month: sql`DATE_TRUNC('month', ${schema.orders.createdAt})::text`,
          revenue: sum(schema.orders.totalAmount).mapWith(Number)
        })
        .from(schema.orders)
        .where(and(
          startDate ? gte(schema.orders.createdAt, startDate) : undefined,
          endDate ? lte(schema.orders.createdAt, endDate) : undefined,
          eq(schema.orders.status, 'completed')
        ))
        .groupBy(sql`DATE_TRUNC('month', ${schema.orders.createdAt})`)
        .orderBy(sql`DATE_TRUNC('month', ${schema.orders.createdAt})`);

      // Get average revenue per user
      const userCountResult = await db
        .select({ count: count() })
        .from(schema.users);

      const totalRevenue = revenueResult[0]?.total || 0;
      const totalUsers = userCountResult[0].count;
      const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      return {
        totalRevenue,
        revenueByMonth: monthlyRevenueResult.map(row => ({
          month: row.month,
          revenue: row.revenue || 0,
          profit: (row.revenue || 0) * 0.3 // Simplified profit calculation
        })),
        revenueBySource: {
          orders: totalRevenue,
          subscriptions: 0, // Would need subscription data
          other: 0
        },
        averageRevenuePerUser,
        subscriptionMetrics: {
          activeSubscriptions: 0, // Would need subscription tracking
          monthlyRecurringRevenue: 0,
          subscriptionGrowthRate: 0
        },
        costAnalysis: {
          totalCosts: totalRevenue * 0.7, // Simplified cost calculation
          costsByCategory: {
            infrastructure: totalRevenue * 0.3,
            ai_services: totalRevenue * 0.2,
            support: totalRevenue * 0.1,
            other: totalRevenue * 0.1
          },
          profitMargins: 30 // Simplified profit margin
        }
      };
    } catch (error) {
      logger.error({ error, options }, 'Failed to get financial analytics');
      throw error;
    }
  }

  /**
   * Generate custom report
   */
  async generateReport(config: ReportConfig): Promise<{
    data: any;
    metadata: {
      generatedAt: Date;
      recordCount: number;
      parameters: Record<string, any>;
    };
  }> {
    try {
      let data: any = {};

      switch (config.type) {
        case 'prescription':
          data = await this.getPrescriptionAnalytics(config.parameters);
          break;
        case 'order':
          data = await this.getOrderAnalytics(config.parameters);
          break;
        case 'ai':
          data = await this.getAIAnalytics(config.parameters);
          break;
        case 'user':
          data = await this.getUserAnalytics(config.parameters);
          break;
        case 'financial':
          data = await this.getFinancialAnalytics(config.parameters);
          break;
        default:
          throw new Error(`Unknown report type: ${config.type}`);
      }

      return {
        data,
        metadata: {
          generatedAt: new Date(),
          recordCount: JSON.stringify(data).length,
          parameters: config.parameters
        }
      };
    } catch (error) {
      logger.error({ error, config }, 'Failed to generate report');
      throw error;
    }
  }

  /**
   * Schedule report generation
   */
  async scheduleReport(config: Omit<ReportConfig, 'id' | 'createdAt' | 'nextRun'>): Promise<ReportConfig> {
    try {
      const reportConfig: ReportConfig = {
        ...config,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        nextRun: this.calculateNextRun(config.frequency)
      };

      // In a real implementation, you would save this to a database
      logger.info('Report scheduled', { reportConfig });

      return reportConfig;
    } catch (error) {
      logger.error({ error, config }, 'Failed to schedule report');
      throw error;
    }
  }

  /**
   * Calculate next run date based on frequency
   */
  private calculateNextRun(frequency: ReportConfig['frequency']): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case 'on-demand':
        return now;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
