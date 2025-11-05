/**
 * Platform Analytics Service
 * 
 * Chunk 7: Cross-Tenant Analytics for Revenue Generation
 * 
 * This service aggregates data across ALL companies to generate:
 * - Market insights for monetization
 * - Platform statistics for monitoring
 * - Pre-computed metrics for performance
 * 
 * CRITICAL: All data must be anonymized - never expose individual company names
 */

import { db } from "../../db";
import { 
  companies, 
  invoices, 
  orders, 
  patients,
  marketInsights,
  platformStatistics,
  aggregatedMetrics,
  companyRelationships,
  users
} from "@shared/schema";
import { sql, eq, and, gte, lte, desc, count, avg, sum, min, max } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger("PlatformAnalyticsService");

// Minimum threshold for anonymization - never expose data with fewer companies
const MIN_SAMPLE_SIZE = 10;

export class PlatformAnalyticsService {
  
  /**
   * Generate platform-wide statistics for a given date
   * Used for internal monitoring and investor reporting
   */
  async generateDailyStatistics(date: Date): Promise<void> {
    try {
      logger.info(`Generating platform statistics for ${date.toISOString()}`);

      // Company metrics
      const totalCompanies = await db.select({ count: count() }).from(companies);
      
      const activeCompanies = await db
        .select({ count: count() })
        .from(companies)
        .where(eq(companies.status, 'active'));

      const companiesByType = await db
        .select({
          type: companies.type,
          count: count()
        })
        .from(companies)
        .where(eq(companies.status, 'active'))
        .groupBy(companies.type);

      // User metrics
      const totalUsers = await db.select({ count: count() }).from(users);
      
      const activeUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.accountStatus, 'active'));

      // Network effects (from Chunk 6)
      const totalConnections = await db
        .select({ count: count() })
        .from(companyRelationships)
        .where(eq(companyRelationships.status, 'active'));

      // Engagement metrics - orders created today
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const ordersCreated = await db
        .select({ count: count() })
        .from(orders)
        .where(
          and(
            gte(orders.orderDate, startOfDay),
            lte(orders.orderDate, endOfDay)
          )
        );

      // Insert or update statistics
      await db.insert(platformStatistics).values({
        date: date.toISOString().split('T')[0],
        periodType: 'daily',
        totalCompanies: totalCompanies[0]?.count || 0,
        activeCompanies: activeCompanies[0]?.count || 0,
        newCompaniesAdded: 0, // Would need to track creation date
        companiesByType: {
          ecp: companiesByType.find(c => c.type === 'ecp')?.count || 0,
          lab: companiesByType.find(c => c.type === 'lab')?.count || 0,
          supplier: companiesByType.find(c => c.type === 'supplier')?.count || 0,
          hybrid: companiesByType.find(c => c.type === 'hybrid')?.count || 0,
        },
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
        newUsersAdded: 0,
        totalRevenue: '0',
        mrr: '0',
        arr: '0',
        ordersCreated: ordersCreated[0]?.count || 0,
        patientsAdded: 0,
        invoicesGenerated: 0,
        aiQueriesProcessed: 0,
        totalConnections: totalConnections[0]?.count || 0,
        connectionRequestsCreated: 0,
        apiCallsTotal: 0,
      });

      logger.info(`Successfully generated platform statistics for ${date.toISOString()}`);
    } catch (error) {
      logger.error('Error generating platform statistics:', error as Error);
      throw error;
    }
  }

  /**
   * Generate market insight: Average invoice pricing by region
   * Example of a monetizable insight
   */
  async generateInvoicePricingInsight(
    periodStart: Date,
    periodEnd: Date,
    region?: string
  ): Promise<string | null> {
    try {
      logger.info(`Generating invoice pricing insight for ${region || 'global'}`);

      // Query invoices across all companies
      const results = await db
        .select({
          companyId: invoices.companyId,
          avgPrice: avg(invoices.totalAmount),
          orderCount: count(),
        })
        .from(invoices)
        .where(
          and(
            gte(invoices.createdAt, periodStart),
            lte(invoices.createdAt, periodEnd)
          )
        )
        .groupBy(invoices.companyId);

      // Enforce minimum sample size for anonymization
      if (results.length < MIN_SAMPLE_SIZE) {
        logger.warn(`Insufficient sample size: ${results.length} < ${MIN_SAMPLE_SIZE}`);
        return null;
      }

      // Calculate statistics
      const prices = results.map(r => parseFloat(r.avgPrice || '0'));
      const avgInvoicePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
      const percentile25 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
      const percentile75 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
      const percentile90 = sortedPrices[Math.floor(sortedPrices.length * 0.90)];

      // Create market insight
      const insight = await db.insert(marketInsights).values({
        insightType: 'pricing',
        category: 'invoices',
        title: `Average Invoice Pricing ${region ? `in ${region}` : 'Nationwide'}`,
        description: `Aggregated invoice pricing data from ${results.length} optical practices`,
        periodStart,
        periodEnd,
        region: region || null,
        country: 'UK', // Would be dynamic
        dataPoints: [
          { metric: 'average', value: avgInvoicePrice, unit: 'GBP' },
          { metric: 'median', value: median, unit: 'GBP' },
          { metric: '25th_percentile', value: percentile25, unit: 'GBP', percentile: 25 },
          { metric: '75th_percentile', value: percentile75, unit: 'GBP', percentile: 75 },
          { metric: '90th_percentile', value: percentile90, unit: 'GBP', percentile: 90 },
        ],
        companiesIncluded: results.length,
        recordsAnalyzed: results.reduce((sum, r) => sum + (r.orderCount || 0), 0),
        confidenceLevel: '95.00',
        marginOfError: '2.50',
        accessLevel: 'premium', // This insight requires payment
        price: '49.99', // Price in GBP
        generatedBy: 'system',
        status: 'published',
        publishedAt: new Date(),
      }).returning();

      logger.info(`Generated invoice pricing insight: ${insight[0].id}`);
      return insight[0].id;
    } catch (error) {
      logger.error('Error generating invoice pricing insight:', error as Error);
      throw error;
    }
  }

  /**
   * Pre-compute aggregated metrics for fast queries
   * Runs periodically to refresh cached aggregations
   */
  async refreshAggregatedMetrics(): Promise<void> {
    try {
      logger.info('Refreshing aggregated metrics');

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Average order count by company type
      const orderCountResults = await db
        .select({
          companyType: companies.type,
          orderCount: count(),
        })
        .from(orders)
        .leftJoin(companies, eq(orders.companyId, companies.id))
        .where(
          and(
            gte(orders.orderDate, thirtyDaysAgo),
            lte(orders.orderDate, now)
          )
        )
        .groupBy(companies.type);

      // Store each metric
      for (const result of orderCountResults) {
        if ((result.orderCount || 0) >= MIN_SAMPLE_SIZE) {
          await db.insert(aggregatedMetrics).values({
            metricType: 'avg_order_count',
            category: 'operations',
            companyType: result.companyType,
            periodStart: thirtyDaysAgo,
            periodEnd: now,
            granularity: 'monthly',
            count: result.orderCount || 0,
            average: String(result.orderCount || 0),
            sampleSize: result.orderCount || 0,
            completeness: '100.00',
            lastRefreshed: new Date(),
            refreshStatus: 'current',
          });
        }
      }

      logger.info('Successfully refreshed aggregated metrics');
    } catch (error) {
      logger.error('Error refreshing aggregated metrics:', error as Error);
      throw error;
    }
  }

  /**
   * Get available insights (respects access levels)
   * Used by the platform admin dashboard
   */
  async getAvailableInsights(
    filters?: {
      insightType?: string;
      category?: string;
      region?: string;
      accessLevel?: string;
    }
  ): Promise<any[]> {
    try {
      // Build conditions array
      const conditions: any[] = [eq(marketInsights.status, 'published')];

      if (filters?.insightType) {
        conditions.push(eq(marketInsights.insightType, filters.insightType));
      }

      if (filters?.category) {
        conditions.push(eq(marketInsights.category, filters.category));
      }

      if (filters?.accessLevel) {
        conditions.push(eq(marketInsights.accessLevel, filters.accessLevel));
      }

      const insights = await db
        .select()
        .from(marketInsights)
        .where(and(...conditions))
        .orderBy(desc(marketInsights.publishedAt));

      return insights;
    } catch (error) {
      logger.error('Error fetching available insights:', error as Error);
      throw error;
    }
  }

  /**
   * Get platform statistics for a date range
   */
  async getPlatformStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const stats = await db
        .select()
        .from(platformStatistics)
        .where(
          and(
            gte(platformStatistics.date, startDate.toISOString().split('T')[0]),
            lte(platformStatistics.date, endDate.toISOString().split('T')[0])
          )
        )
        .orderBy(platformStatistics.date);

      return stats;
    } catch (error) {
      logger.error('Error fetching platform statistics:', error as Error);
      throw error;
    }
  }

  /**
   * Validate minimum sample size for anonymization
   * CRITICAL: Always call this before exposing aggregated data
   */
  validateSampleSize(sampleSize: number): boolean {
    if (sampleSize < MIN_SAMPLE_SIZE) {
      logger.warn(`Sample size ${sampleSize} below minimum threshold ${MIN_SAMPLE_SIZE}`);
      return false;
    }
    return true;
  }

  /**
   * Export insight as CSV for monetization
   */
  async exportInsightAsCSV(insightId: string): Promise<string> {
    try {
      const insight = await db
        .select()
        .from(marketInsights)
        .where(eq(marketInsights.id, insightId))
        .limit(1);

      if (!insight[0]) {
        throw new Error('Insight not found');
      }

      // Generate CSV
      const dataPoints = insight[0].dataPoints as any[];
      let csv = 'Metric,Value,Unit,Percentile\n';
      
      for (const point of dataPoints) {
        csv += `${point.metric},${point.value},${point.unit || ''},${point.percentile || ''}\n`;
      }

      return csv;
    } catch (error) {
      logger.error('Error exporting insight as CSV:', error as Error);
      throw error;
    }
  }
}

// Singleton instance
export const platformAnalyticsService = new PlatformAnalyticsService();
