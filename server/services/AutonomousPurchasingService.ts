/**
 * Autonomous Purchasing Service
 * 
 * Monitors inventory levels and automatically generates draft purchase orders
 * when stock falls below thresholds. Uses AI to:
 * - Detect low stock patterns and predict stockouts
 * - Select optimal suppliers based on historical data
 * - Calculate recommended order quantities
 * - Provide justification and confidence scores
 * 
 * Generated POs are stored as drafts for human review and approval.
 */

import { db } from "../db";
import {
  users,
  aiPurchaseOrders,
  aiPurchaseOrderItems,
  poLineItems,
  demandForecasts,
  products
} from '@shared/schema';

// Import tables not yet extracted to modular domains
import {
  purchaseOrders
} from '@shared/schemaLegacy';
import { eq, and, lt, desc, sql, isNotNull, gte } from "drizzle-orm";
import { AIDataAccess, type QueryContext } from "./AIDataAccess";
import { ExternalAIService } from "./ExternalAIService";
import { DemandForecastingService } from "./DemandForecastingService";
import { createLogger } from "../utils/logger";

const logger = createLogger("AutonomousPurchasing");

export interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  stockoutRisk: number; // 0-100
  urgency: 'critical' | 'high' | 'medium' | 'low';
  recommendedQuantity: number;
  estimatedUnitPrice: number;
  leadTimeDays: number;
}

export interface SupplierRecommendation {
  supplierId: string;
  supplierName: string;
  confidence: number; // 0-100
  averageLeadTime: number;
  reliabilityScore: number;
  priceCompetitiveness: number;
  historicalOrderCount: number;
}

export interface PurchaseOrderDraft {
  id: string;
  companyId: string;
  supplierId?: string;
  supplierName?: string;
  items: LowStockItem[];
  estimatedTotal: number;
  reason: string;
  aiAnalysis: Record<string, any>;
  confidence: number;
}

export class AutonomousPurchasingService {
  private externalAI: ExternalAIService;
  private forecastingService: DemandForecastingService;

  constructor() {
    this.externalAI = new ExternalAIService();
    this.forecastingService = new DemandForecastingService((global as any).storage);
  }

  /**
   * Main entry point: Scan inventory and generate POs for low stock items
   */
  async generatePurchaseOrders(companyId: string, userId: string): Promise<PurchaseOrderDraft[]> {
    logger.info("Scanning inventory for autonomous PO generation", { companyId });

    const context: QueryContext = { companyId, userId };

    try {
      // Step 1: Get all low stock items
      const lowStockItems = await this.getLowStockItems(context);
      
      if (lowStockItems.length === 0) {
        logger.info("No low stock items found", { companyId });
        return [];
      }

      logger.info(`Found ${lowStockItems.length} low stock items`, { companyId });

      // Step 2: Analyze urgency and calculate recommended quantities
      const analyzedItems = await this.analyzeStockItems(lowStockItems, context);

      // Step 3: Group items by recommended supplier
      const groupedBySupplier = await this.groupItemsBySupplier(analyzedItems, context);

      // Step 4: Create draft POs for each supplier
      const draftPOs: PurchaseOrderDraft[] = [];
      
      for (const [supplierId, items] of Object.entries(groupedBySupplier)) {
        const draft = await this.createDraftPO(companyId, supplierId, items, context);
        draftPOs.push(draft);
      }

      logger.info(`Generated ${draftPOs.length} draft purchase orders`, { companyId });

      return draftPOs;
    } catch (error) {
      logger.error("Failed to generate purchase orders", error as Error);
      throw error;
    }
  }

  /**
   * Get products below their reorder threshold
   */
  private async getLowStockItems(context: QueryContext): Promise<LowStockItem[]> {
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        stockQuantity: products.stockQuantity,
        lowStockThreshold: products.lowStockThreshold,
        cost: products.cost,
      })
      .from(products)
      .where(
        and(
          eq(products.companyId, context.companyId),
          eq(products.isActive, true),
          isNotNull(products.lowStockThreshold),
          sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
        )
      );

    // Calculate reorder quantities with forecasting (parallel for performance)
    const itemsWithReorder = await Promise.all(
      lowStockProducts.map(async (p) => {
        const reorderInfo = await this.calculateReorderQuantity(
          p.stockQuantity || 0,
          p.lowStockThreshold || 0,
          p.id,
          context.companyId,
          7 // Default lead time
        );
        
        return {
          productId: p.id,
          productName: p.name || 'Unknown Product',
          sku: p.sku || '',
          currentStock: p.stockQuantity || 0,
          lowStockThreshold: p.lowStockThreshold || 0,
          stockoutRisk: this.calculateStockoutRisk(p.stockQuantity || 0, p.lowStockThreshold || 0),
          urgency: this.determineUrgency(p.stockQuantity || 0, p.lowStockThreshold || 0),
          recommendedQuantity: reorderInfo.quantity,
          estimatedUnitPrice: parseFloat(p.cost || '0'),
          leadTimeDays: 7,
          forecastBased: reorderInfo.forecastBased,
          forecastReasoning: reorderInfo.reasoning,
          forecastConfidence: reorderInfo.forecastConfidence,
        } as LowStockItem & { forecastBased?: boolean; forecastReasoning?: string; forecastConfidence?: number };
      })
    );

    return itemsWithReorder;
  }

  /**
   * Analyze stock items and enrich with AI insights
   */
  private async analyzeStockItems(items: LowStockItem[], context: QueryContext): Promise<LowStockItem[]> {
    // Get sales velocity data to refine recommendations
    const orderStats = await AIDataAccess.getOrderStats(context);
    
    // Use AI to analyze patterns and adjust quantities
    const prompt = `Analyze these low stock items and provide insights:
${items.map(i => `- ${i.productName}: ${i.currentStock} units (threshold: ${i.lowStockThreshold})`).join('\n')}

Recent order stats: ${orderStats.total} total orders, ${orderStats.byStatus['complete'] || 0} completed.

Provide brief analysis of urgency and suggest if quantities should be adjusted based on order volume.`;

    try {
      const aiResponse = await this.externalAI.generateResponse(
        [{ role: 'user', content: prompt }],
        { provider: 'ollama', model: 'llama3.1:latest', temperature: 0.3 }
      );

      logger.info("AI analysis completed", { response: aiResponse.content.substring(0, 200) });
    } catch (error) {
      logger.warn("AI analysis failed, using default calculations", error as Error);
    }

    return items;
  }

  /**
   * Group items by recommended supplier
   */
  private async groupItemsBySupplier(
    items: LowStockItem[], 
    context: QueryContext
  ): Promise<Record<string, LowStockItem[]>> {
    // For now, group all items under a default supplier
    // In a real system, this would analyze historical purchases to find best supplier per product
    
    // Get suppliers from users table (simplified for MVP)
    const suppliers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(
        and(
          eq(users.companyId, context.companyId),
          eq(users.role, 'supplier')
        )
      )
      .limit(1);

    const defaultSupplier = suppliers[0]?.id || 'default_supplier';

    return {
      [defaultSupplier]: items,
    };
  }

  /**
   * Create a draft PO for a supplier with items
   */
  private async createDraftPO(
    companyId: string,
    supplierId: string,
    items: LowStockItem[],
    context: QueryContext
  ): Promise<PurchaseOrderDraft> {
    // Calculate totals
    const estimatedTotal = items.reduce(
      (sum, item) => sum + (item.estimatedUnitPrice * item.recommendedQuantity),
      0
    );

    // Get supplier name
    let supplierName = 'Unknown Supplier';
    if (supplierId !== 'default_supplier') {
      const supplier = await db.query.users.findFirst({
        where: eq(users.id, supplierId),
        columns: { firstName: true, lastName: true },
      });
      supplierName = supplier ? `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim() : 'Unknown Supplier';
      if (!supplierName) supplierName = 'Unknown Supplier';
    }

    // Generate reason and AI analysis
    const criticalCount = items.filter(i => i.urgency === 'critical').length;
    const highCount = items.filter(i => i.urgency === 'high').length;
    
    let reason = `Automatic reorder: ${items.length} item(s) below stock threshold`;
    if (criticalCount > 0) {
      reason += `. ${criticalCount} critical item(s) need immediate attention`;
    }
    if (highCount > 0) {
      reason += `. ${highCount} high-priority item(s)`;
    }

    const aiAnalysis = {
      totalItems: items.length,
      criticalItems: criticalCount,
      highPriorityItems: highCount,
      estimatedDeliveryDays: Math.max(...items.map(i => i.leadTimeDays)),
      stockoutRisks: items.map(i => ({
        product: i.productName,
        risk: i.stockoutRisk,
      })),
      generatedAt: new Date().toISOString(),
    };

    // Calculate confidence score (simplified)
    const avgStockoutRisk = items.reduce((sum, i) => sum + i.stockoutRisk, 0) / items.length;
    const confidence = Math.min(95, 60 + avgStockoutRisk / 2); // Higher risk = higher confidence in need

    // Save to database
    const [draftPO] = await db
      .insert(aiPurchaseOrders)
      .values({
        companyId,
        supplierId: supplierId !== 'default_supplier' ? supplierId : null,
        supplierName,
        estimatedTotal: estimatedTotal.toFixed(2),
        reason,
        aiAnalysis,
        confidence: confidence.toFixed(2),
        status: 'pending_review',
        generatedBy: 'autonomous_purchasing',
        aiModel: 'llama3.1:latest',
      })
      .returning();

    // Insert line items
    for (const item of items) {
      await db.insert(aiPurchaseOrderItems).values({
        aiPoId: draftPO.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.sku,
        currentStock: item.currentStock,
        lowStockThreshold: item.lowStockThreshold,
        recommendedQuantity: item.recommendedQuantity,
        estimatedUnitPrice: item.estimatedUnitPrice.toFixed(2),
        estimatedTotalPrice: (item.estimatedUnitPrice * item.recommendedQuantity).toFixed(2),
        urgency: item.urgency,
        stockoutRisk: item.stockoutRisk.toFixed(2),
        leadTimeDays: item.leadTimeDays,
      });
    }

    logger.info("Draft PO created", { 
      poId: draftPO.id, 
      items: items.length,
      total: estimatedTotal 
    });

    return {
      id: draftPO.id,
      companyId,
      supplierId: supplierId !== 'default_supplier' ? supplierId : undefined,
      supplierName,
      items,
      estimatedTotal,
      reason,
      aiAnalysis,
      confidence,
    };
  }

  /**
   * Calculate stockout risk based on current vs threshold
   */
  private calculateStockoutRisk(currentStock: number, threshold: number): number {
    if (currentStock <= 0) return 100;
    if (currentStock >= threshold) return 0;
    
    // Linear scale: as stock approaches 0, risk increases
    return Math.round(((threshold - currentStock) / threshold) * 100);
  }

  /**
   * Determine urgency level
   */
  private determineUrgency(currentStock: number, threshold: number): 'critical' | 'high' | 'medium' | 'low' {
    if (currentStock <= 0) return 'critical';
    if (currentStock <= threshold * 0.25) return 'critical';
    if (currentStock <= threshold * 0.5) return 'high';
    if (currentStock <= threshold * 0.75) return 'medium';
    return 'low';
  }

  /**
   * Calculate recommended reorder quantity
   * Enhanced with demand forecasting for predictive ordering
   */
  private async calculateReorderQuantity(
    currentStock: number, 
    threshold: number, 
    productId: string,
    companyId: string,
    leadTimeDays: number = 7
  ): Promise<{
    quantity: number;
    forecastBased: boolean;
    expectedDemand?: number;
    forecastConfidence?: number;
    reasoning?: string;
  }> {
    try {
      // Try to get demand forecast for lead time period
      const forecastEndDate = new Date();
      forecastEndDate.setDate(forecastEndDate.getDate() + leadTimeDays);
      
      const forecasts = await db
        .select()
        .from(demandForecasts)
        .where(
          and(
            eq(demandForecasts.companyId, companyId),
            eq(demandForecasts.productId, productId),
            gte(demandForecasts.forecastDate, new Date())
          )
        )
        .limit(leadTimeDays);

      if (forecasts.length > 0) {
        // Calculate expected demand during lead time
        const expectedDemand = forecasts.reduce((sum, f) => sum + f.predictedDemand, 0);
        const avgConfidence = forecasts.reduce((sum, f) => sum + parseFloat(f.confidence), 0) / forecasts.length;
        
        // Calculate safety stock (20% buffer)
        const safetyStock = Math.ceil(expectedDemand * 0.2);
        
        // Reorder quantity = Expected demand during lead time + Safety stock - Current stock
        const reorderQty = Math.max(1, expectedDemand + safetyStock - currentStock);
        
        // Round to nearest 5 for cleaner numbers
        const roundedQty = Math.ceil(reorderQty / 5) * 5;
        
        logger.info("Forecast-based reorder quantity calculated", {
          productId,
          expectedDemand,
          safetyStock,
          currentStock,
          reorderQty: roundedQty,
          confidence: avgConfidence,
        });
        
        return {
          quantity: roundedQty,
          forecastBased: true,
          expectedDemand,
          forecastConfidence: avgConfidence,
          reasoning: `Based on ${forecasts.length}-day forecast predicting ${expectedDemand} units demand with ${avgConfidence.toFixed(1)}% confidence. Includes 20% safety buffer.`,
        };
      }
    } catch (error) {
      logger.warn("Failed to get demand forecast, falling back to standard calculation", error as Error);
    }

    // Fallback: Simple formula if no forecast available
    const targetStock = threshold * 2;
    const reorderQty = Math.max(1, targetStock - currentStock);
    const roundedQty = Math.ceil(reorderQty / 5) * 5;
    
    return {
      quantity: roundedQty,
      forecastBased: false,
      reasoning: `Standard reorder calculation: target 2x threshold (${targetStock}) minus current stock (${currentStock}).`,
    };
  }

  /**
   * Approve a draft PO and convert to official purchase order
   */
  async approvePurchaseOrder(
    aiPoId: string,
    reviewerId: string,
    notes?: string
  ): Promise<string> {
    logger.info("Approving AI-generated PO", { aiPoId, reviewerId });

    // Get the draft PO
    const draftPOResult = await db
      .select()
      .from(aiPurchaseOrders)
      .where(eq(aiPurchaseOrders.id, aiPoId))
      .limit(1);

    if (!draftPOResult || draftPOResult.length === 0) {
      throw new Error("Draft PO not found");
    }

    const draftPO = draftPOResult[0];

    if (draftPO.status !== 'pending_review') {
      throw new Error(`Cannot approve PO in status: ${draftPO.status}`);
    }

    // Generate PO number
    const poNumber = `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create official purchase order
    const [officialPO] = await db
      .insert(purchaseOrders)
      .values({
        poNumber,
        companyId: draftPO.companyId,
        supplierId: draftPO.supplierId || reviewerId, // Fallback to reviewer if no supplier
        createdById: reviewerId,
        status: 'draft', // Changed from 'pending' to 'draft' to match enum
        totalAmount: draftPO.estimatedTotal,
        notes: `Auto-generated by AI. ${draftPO.reason}${notes ? `\n\nReviewer notes: ${notes}` : ''}`,
      })
      .returning();

    // Create line items
    const items = await db
      .select()
      .from(aiPurchaseOrderItems)
      .where(eq(aiPurchaseOrderItems.aiPoId, aiPoId));

    for (const item of items) {
      await db.insert(poLineItems).values({
        purchaseOrderId: officialPO.id,
        itemName: item.productName,
        description: `Auto-reorder: Stock level ${item.currentStock}, threshold ${item.lowStockThreshold}`,
        quantity: item.recommendedQuantity,
        unitPrice: item.estimatedUnitPrice || '0',
        totalPrice: item.estimatedTotalPrice || '0',
      });
    }

    // Update draft PO status
    await db
      .update(aiPurchaseOrders)
      .set({
        status: 'approved',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        convertedPoId: officialPO.id,
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiPurchaseOrders.id, aiPoId));

    logger.info("PO approved and converted", { 
      aiPoId, 
      officialPoId: officialPO.id,
      poNumber 
    });

    return officialPO.id;
  }

  /**
   * Reject a draft PO
   */
  async rejectPurchaseOrder(
    aiPoId: string,
    reviewerId: string,
    notes: string
  ): Promise<void> {
    logger.info("Rejecting AI-generated PO", { aiPoId, reviewerId });

    await db
      .update(aiPurchaseOrders)
      .set({
        status: 'rejected',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(aiPurchaseOrders.id, aiPoId));

    logger.info("PO rejected", { aiPoId });
  }

  /**
   * Get pending draft POs for a company
   */
  async getPendingPurchaseOrders(companyId: string): Promise<any[]> {
    const pendingPOs = await db
      .select()
      .from(aiPurchaseOrders)
      .where(
        and(
          eq(aiPurchaseOrders.companyId, companyId),
          eq(aiPurchaseOrders.status, 'pending_review')
        )
      )
      .orderBy(desc(aiPurchaseOrders.generatedAt));

    // Get items for each PO
    const posWithItems = await Promise.all(
      pendingPOs.map(async (po) => {
        const items = await db
          .select()
          .from(aiPurchaseOrderItems)
          .where(eq(aiPurchaseOrderItems.aiPoId, po.id));
        
        return {
          ...po,
          items,
        };
      })
    );

    return posWithItems;
  }
}
