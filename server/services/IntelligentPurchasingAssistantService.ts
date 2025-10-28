import { db } from '../db';
import { and, desc, eq, sql, sum, count } from 'drizzle-orm';
import {
  biRecommendations,
  eciProductSalesAnalytics,
  orders,
  products,
  invoices,
  invoiceLineItems,
  users,
  analyticsEvents,
} from '../../shared/schema';
import { createLogger, type Logger } from '../utils/logger';

interface SalesData {
  productType: string;
  brand?: string;
  model?: string;
  count: number;
  revenue: number;
}

interface ProductPairing {
  item1Type: string;
  item1Brand?: string;
  item2Type: string;
  item2Brand?: string;
  frequency: number;
  averageOrderValue: number;
}

interface RecommendationData {
  type: 'stocking' | 'upsell' | 'cross_sell' | 'breakage_reduction' | 'error_reduction';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  actionItems: Array<{ action: string; details?: string }>;
  estimatedRevenueLift?: number;
  estimatedErrorReduction?: number;
  dataSource: any;
}

export class IntelligentPurchasingAssistantService {
  private static instance: IntelligentPurchasingAssistantService;
  private logger: Logger;

  private constructor() {
    this.logger = createLogger('IntelligentPurchasingAssistantService');
  }

  public static getInstance(): IntelligentPurchasingAssistantService {
    if (!IntelligentPurchasingAssistantService.instance) {
      IntelligentPurchasingAssistantService.instance = new IntelligentPurchasingAssistantService();
    }
    return IntelligentPurchasingAssistantService.instance;
  }

  /**
   * Analyzes ECP's sales data combined with LIMS data to generate BI recommendations
   */
  async analyzeEcpForRecommendations(ecpId: string): Promise<RecommendationData[]> {
    try {
      this.logger.info('Analyzing ECP for BI recommendations', { ecpId });

      const recommendations: RecommendationData[] = [];

      // Get sales data from POS (products and invoices)
      const salesAnalysis = await this.analyzeSalesData(ecpId);

      // Get lens/order data from LIMS
      const limsAnalysis = await this.analyzeLimsData(ecpId);

      // Generate stocking recommendations
      const stockingRecs = await this.generateStockingRecommendations(ecpId, salesAnalysis);
      recommendations.push(...stockingRecs);

      // Generate cross-sell recommendations
      const crossSellRecs = await this.generateCrossSellRecommendations(ecpId, salesAnalysis);
      recommendations.push(...crossSellRecs);

      // Generate error reduction recommendations
      const errorRecs = await this.generateErrorReductionRecommendations(ecpId, limsAnalysis);
      recommendations.push(...errorRecs);

      // Generate breakage reduction recommendations
      const breakageRecs = await this.generateBreakageReductionRecommendations(ecpId, salesAnalysis, limsAnalysis);
      recommendations.push(...breakageRecs);

      this.logger.info('BI analysis complete', {
        ecpId,
        recommendationCount: recommendations.length,
      });

      return recommendations;
    } catch (error) {
      this.logger.error('Error analyzing ECP for recommendations', error as Error, { ecpId });
      throw error;
    }
  }

  /**
   * Creates and stores BI recommendations for an ECP
   */
  async createRecommendation(
    ecpId: string,
    recommendation: RecommendationData
  ): Promise<any> {
    try {
      const inserted = await db.insert(biRecommendations).values({
        ecpId,
        recommendationType: recommendation.type,
        priority: recommendation.priority,
        title: recommendation.title,
        description: recommendation.description,
        impact: recommendation.impact,
        actionItems: recommendation.actionItems,
        dataSource: recommendation.dataSource,
        estimatedRevenueLift: recommendation.estimatedRevenueLift?.toString(),
        estimatedErrorReduction: recommendation.estimatedErrorReduction?.toString(),
        acknowledged: false,
        metadata: {
          createdAt: new Date().toISOString(),
          generatedFrom: 'intelligent_purchasing_assistant',
        },
      }).returning();

      // Create analytics event
      await db.insert(analyticsEvents).values({
        eventType: 'order_created',
        sourceId: ecpId,
        sourceType: 'bi_recommendation',
        data: {
          recommendationId: inserted[0]?.id,
          type: recommendation.type,
          priority: recommendation.priority,
        },
        organizationId: (await db.query.users.findFirst({
          where: eq(users.id, ecpId),
          columns: { organizationId: true }
        }))?.organizationId || ''
      });

      this.logger.info('BI recommendation created', {
        ecpId,
        recommendationId: inserted[0]?.id,
        type: recommendation.type,
      });

      return inserted[0];
    } catch (error) {
      this.logger.error('Error creating BI recommendation', error as Error, { ecpId });
      throw error;
    }
  }

  /**
   * Retrieves active recommendations for an ECP
   */
  async getActiveRecommendations(ecpId: string, limit: number = 20): Promise<any[]> {
    try {
      return await db
        .select()
        .from(biRecommendations)
        .where(
          and(
            eq(biRecommendations.ecpId, ecpId),
            eq(biRecommendations.acknowledged, false)
          )
        )
        .orderBy(desc(biRecommendations.priority), desc(biRecommendations.createdAt))
        .limit(limit);
    } catch (error) {
      this.logger.error('Error fetching active recommendations', error as Error, { ecpId });
      throw error;
    }
  }

  /**
   * Acknowledges a recommendation
   */
  async acknowledgeRecommendation(
    recommendationId: string,
    userId: string
  ): Promise<void> {
    try {
      await db
        .update(biRecommendations)
        .set({
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        })
        .where(eq(biRecommendations.id, recommendationId));

      this.logger.info('Recommendation acknowledged', { recommendationId, userId });
    } catch (error) {
      this.logger.error('Error acknowledging recommendation', error as Error, { recommendationId });
      throw error;
    }
  }

  /**
   * Tracks implementation start
   */
  async startImplementation(recommendationId: string): Promise<void> {
    try {
      await db
        .update(biRecommendations)
        .set({
          implementationStartedAt: new Date(),
        })
        .where(eq(biRecommendations.id, recommendationId));

      this.logger.info('Implementation started', { recommendationId });
    } catch (error) {
      this.logger.error('Error starting implementation', error as Error, { recommendationId });
      throw error;
    }
  }

  /**
   * Tracks implementation completion
   */
  async completeImplementation(recommendationId: string): Promise<void> {
    try {
      await db
        .update(biRecommendations)
        .set({
          implementationCompletedAt: new Date(),
        })
        .where(eq(biRecommendations.id, recommendationId));

      this.logger.info('Implementation completed', { recommendationId });
    } catch (error) {
      this.logger.error('Error completing implementation', error as Error, { recommendationId });
      throw error;
    }
  }

  /**
   * Analyzes ECP's POS sales data
   */
  private async analyzeSalesData(ecpId: string): Promise<any> {
    try {
      // Get product sales from invoices
      const sales = await db
        .select({
          productType: products.productType,
          brand: products.brand,
          model: products.model,
          count: count().as('count'),
          totalRevenue: sum(invoiceLineItems.totalPrice).as('total_revenue'),
        })
        .from(invoiceLineItems)
        .leftJoin(products, eq(products.id, invoiceLineItems.productId))
        .leftJoin(invoices, eq(invoices.id, invoiceLineItems.invoiceId))
        .where(eq(invoices.ecpId, ecpId))
        .groupBy(
          products.productType,
          products.brand,
          products.model,
          invoiceLineItems.productId
        );

      return {
        topSellingProducts: sales.slice(0, 10),
        totalSalesCount: sales.reduce((sum, item) => sum + item.count, 0),
        totalRevenue: sales.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0),
      };
    } catch (error) {
      this.logger.warn('Error analyzing sales data', { ecpId, error: error instanceof Error ? error.message : String(error) });
      return { topSellingProducts: [], totalSalesCount: 0, totalRevenue: 0 };
    }
  }

  /**
   * Analyzes ECP's LIMS order data
   */
  private async analyzeLimsData(ecpId: string): Promise<any> {
    try {
      // Get order statistics
      const orderStats = await db
        .select({
          lensType: orders.lensType,
          lensMaterial: orders.lensMaterial,
          frameType: orders.frameType,
          count: count().as('count'),
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.ecpId, ecpId))
        .groupBy(
          orders.lensType,
          orders.lensMaterial,
          orders.frameType,
          orders.status
        );

      // Calculate error/remake rates
      const errorData = await db
        .select({
          lensType: orders.lensType,
          frameType: orders.frameType,
          errorCount: count().as('error_count'),
        })
        .from(orders)
        .where(
          and(
            eq(orders.ecpId, ecpId),
            eq(orders.status, 'on_hold')
          )
        )
        .groupBy(orders.lensType, orders.frameType);

      return {
        orderStats,
        errorData,
        totalOrders: orderStats.reduce((sum, item) => sum + item.count, 0),
      };
    } catch (error) {
      this.logger.warn('Error analyzing LIMS data', { ecpId, error: error instanceof Error ? error.message : String(error) });
      return { orderStats: [], errorData: [], totalOrders: 0 };
    }
  }

  /**
   * Generate stocking recommendations based on sales patterns
   */
  private async generateStockingRecommendations(
    ecpId: string,
    salesAnalysis: any
  ): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    if (!salesAnalysis.topSellingProducts || salesAnalysis.topSellingProducts.length === 0) {
      return recommendations;
    }

    for (const product of salesAnalysis.topSellingProducts.slice(0, 3)) {
      if (product.count > 20) { // Threshold for recommendation
        const monthlyAverage = product.count / 12;
        const stockRecommendation: RecommendationData = {
          type: 'stocking',
          priority: product.count > 50 ? 'high' : 'medium',
          title: `Optimize stocking: ${product.brand || 'Product'} ${product.model || ''}`,
          description: `We see you sold ${product.count} units of ${product.brand} ${product.model} over the past 12 months (avg ${monthlyAverage.toFixed(1)}/month). Increasing stock levels could improve availability and customer satisfaction.`,
          impact: `Potential revenue lift from reduced stockouts and improved customer retention.`,
          actionItems: [
            {
              action: `Increase monthly stock order for ${product.brand} by 20-30%`,
              details: `Current estimated demand: ${Math.ceil(monthlyAverage)} units/month`,
            },
            {
              action: 'Negotiate volume discount with supplier',
              details: `Annual volume justifies higher order quantities`,
            },
          ],
          estimatedRevenueLift: Number(product.totalRevenue) * 0.15,
          dataSource: {
            source: 'POS_SALES_DATA',
            period: '12_months',
            productBrand: product.brand,
            totalUnitsSold: product.count,
            totalRevenue: product.totalRevenue,
          },
        };

        recommendations.push(stockRecommendation);
      }
    }

    return recommendations;
  }

  /**
   * Generate cross-sell and upsell recommendations
   */
  private async generateCrossSellRecommendations(
    ecpId: string,
    salesAnalysis: any
  ): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    // Example: If frames are top sellers, recommend lens packages
    const topProduct = salesAnalysis.topSellingProducts?.[0];

    if (topProduct?.productType === 'frame') {
      const frameUpsellRec: RecommendationData = {
        type: 'cross_sell',
        priority: 'medium',
        title: `Cross-sell premium lens options with ${topProduct.brand} frames`,
        description: `Your top-selling frame is ${topProduct.brand} ${topProduct.model}. Create bundled packages with premium lens materials (1.67, 1.74) to increase average order value.`,
        impact: 'Increase average transaction value by 25-35% through intelligent bundling.',
        actionItems: [
          {
            action: 'Create 3 bundled packages',
            details: 'Frame + standard lens, Frame + premium lens, Frame + designer lens',
          },
          {
            action: 'Train staff on bundle benefits',
            details: 'Emphasize superior optics and durability of premium options',
          },
        ],
        estimatedRevenueLift: Number(topProduct.totalRevenue) * 0.30,
        dataSource: {
          source: 'POS_SALES_DATA',
          topProductType: topProduct.productType,
          topProductBrand: topProduct.brand,
        },
      };

      recommendations.push(frameUpsellRec);
    }

    return recommendations;
  }

  /**
   * Generate error reduction recommendations based on LIMS data
   */
  private async generateErrorReductionRecommendations(
    ecpId: string,
    limsAnalysis: any
  ): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    if (!limsAnalysis.errorData || limsAnalysis.errorData.length === 0) {
      return recommendations;
    }

    for (const error of limsAnalysis.errorData) {
      if (error.error_count > 5) {
        const errorReduction: RecommendationData = {
          type: 'error_reduction',
          priority: 'high',
          title: `Reduce errors for ${error.lensType} in ${error.frameType || 'standard'} frames`,
          description: `We detected ${error.error_count} orders on hold for ${error.lensType} lenses in ${error.frameType || 'standard'} frames. This combination may have complexity issues that our Principal Engineer can help resolve.`,
          impact: `Reducing errors by even 20% could save substantial time and improve patient satisfaction.`,
          actionItems: [
            {
              action: 'Review recent error patterns',
              details: `Analyze root causes of the ${error.error_count} on-hold orders`,
            },
            {
              action: 'Consult with lab engineer',
              details: 'Schedule consultation to optimize prescription parameters',
            },
          ],
          estimatedErrorReduction: 0.20,
          dataSource: {
            source: 'LIMS_ORDER_DATA',
            lensType: error.lensType,
            frameType: error.frameType,
            errorCount: error.error_count,
          },
        };

        recommendations.push(errorReduction);
      }
    }

    return recommendations;
  }

  /**
   * Generate breakage reduction recommendations
   */
  private async generateBreakageReductionRecommendations(
    ecpId: string,
    salesAnalysis: any,
    limsAnalysis: any
  ): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    // Identify high-risk frame types
    const frameOrders = limsAnalysis.orderStats?.filter((s: any) => s.frameType?.includes('wrap') || s.frameType?.includes('sport'));

    if (frameOrders && frameOrders.length > 0) {
      const breakageRec: RecommendationData = {
        type: 'breakage_reduction',
        priority: 'medium',
        title: `Reduce breakage for sport/wrap frames`,
        description: `We see you're using wrap and sport frames. These benefit significantly from high-index materials and protective coatings. Our data shows that Trivex material with anti-scratch coating reduces breakage by 40% in these frame types.`,
        impact: `Improved product durability, reduced returns, and better patient satisfaction.`,
        actionItems: [
          {
            action: 'Recommend Trivex for wrap/sport frames',
            details: 'Superior drill-mount integrity and impact resistance',
          },
          {
            action: 'Add anti-scratch coating as standard',
            details: 'Minimal upcharge provides significant durability benefits',
          },
          {
            action: 'Track return rates',
            details: 'Monitor improvement in 3-month period',
          },
        ],
        estimatedErrorReduction: 0.40,
        dataSource: {
          source: 'LIMS_FRAME_DATA',
          frameTypes: ['wrap', 'sport'],
          ordersAnalyzed: frameOrders?.length || 0,
        },
      };

      recommendations.push(breakageRec);
    }

    return recommendations;
  }
}
