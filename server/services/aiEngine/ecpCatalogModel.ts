/**
 * ECP Business Model (Leg 3 of the Three-Legged AI)
 * 
 * This model manages the ECP's privately uploaded CSV catalog.
 * It knows:
 * - Frame SKU 'RB2140' is in stock
 * - Retail price for 'Premium AR' is $120
 * - Retail price for 'Standard AR' is $70
 * 
 * It matches clinical recommendations to the ECP's actual inventory and pricing.
 */

import { db } from "../../db";
import type { EcpCatalogData, InsertEcpCatalogData } from "@shared/schema";
import { ecpCatalogData } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import logger from '../../utils/logger';


export interface CatalogProduct {
  sku: string;
  name: string;
  brand?: string;
  category: string;
  lensType?: string;
  lensMaterial?: string;
  coating?: string;
  designFeatures?: Record<string, boolean>;
  retailPrice: number;
  wholesalePrice?: number;
  stockQuantity: number;
  isInStock: boolean;
}

export interface PricePoint {
  tier: "GOOD" | "BETTER" | "BEST";
  product: CatalogProduct;
  retailPrice: number;
  matchScore: number;
}

export class EcpCatalogModel {
  /**
   * Upload and parse ECP's CSV catalog
   */
  static async uploadCatalog(
    ecpId: string,
    csvData: Partial<InsertEcpCatalogData>[]
  ): Promise<void> {
    try {
      // Clear existing catalog for this ECP
      // Note: In production, you might want to keep history
      await db.delete(ecpCatalogData).where(eq(ecpCatalogData.ecpId, ecpId));

      // Insert new catalog items
      for (const item of csvData) {
        await db.insert(ecpCatalogData).values({
          ecpId,
          productSku: item.productSku || "",
          productName: item.productName || "",
          brand: item.brand,
          category: item.category,
          lensType: item.lensType,
          lensMaterial: item.lensMaterial,
          coating: item.coating,
          designFeatures: item.designFeatures,
          retailPrice: item.retailPrice || "0",
          wholesalePrice: item.wholesalePrice,
          stockQuantity: item.stockQuantity || 0,
          isInStock: (item.stockQuantity || 0) > 0,
        } as InsertEcpCatalogData);
      }

      logger.info(
        `Uploaded ${csvData.length} catalog items for ECP ${ecpId}`
      );
    } catch (error) {
      logger.error("Error uploading catalog:", error);
      throw new Error("Failed to upload catalog");
    }
  }

  /**
   * Get all catalog items for an ECP
   */
  static async getCatalog(ecpId: string): Promise<CatalogProduct[]> {
    try {
      const items = await db.query.ecpCatalogData.findMany({
        where: (fields: any) => eq(fields.ecpId, ecpId),
      });

      return items.map((item) => ({
        sku: item.productSku,
        name: item.productName,
        brand: item.brand || undefined,
        category: item.category || "unknown",
        lensType: item.lensType || undefined,
        lensMaterial: item.lensMaterial || undefined,
        coating: item.coating || undefined,
        designFeatures: (item.designFeatures as Record<string, boolean>) || {},
        retailPrice: Number(item.retailPrice),
        wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : undefined,
        stockQuantity: item.stockQuantity,
        isInStock: item.isInStock,
      }));
    } catch (error) {
      logger.error("Error retrieving catalog:", error);
      return [];
    }
  }

  /**
   * Find products matching a clinical recommendation
   * Returns products organized by price tier
   */
  static async findMatchingProducts(
    ecpId: string,
    recommendedLensType: string,
    recommendedMaterial: string,
    recommendedCoating: string,
    recommendedFeatures?: Record<string, boolean>
  ): Promise<PricePoint[]> {
    try {
      const catalog = await EcpCatalogModel.getCatalog(ecpId);

      if (catalog.length === 0) {
        return [];
      }

      // Score products based on match to recommendation
      const scoredProducts = catalog
        .map((product) => ({
          product,
          matchScore: EcpCatalogModel.calculateProductMatch(
            product,
            {
              lensType: recommendedLensType,
              material: recommendedMaterial,
              coating: recommendedCoating,
              features: recommendedFeatures,
            }
          ),
        }))
        .filter((p) => p.matchScore > 0) // Only include partial matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 30); // Top 30 matches

      // Organize into price tiers: BEST (top), BETTER (middle), GOOD (budget)
      const pricePoints: PricePoint[] = [];

      // Find best match at each price level
      const thresholds = [
        { tier: "BEST" as const, maxPerTier: 5 },
        { tier: "BETTER" as const, maxPerTier: 5 },
        { tier: "GOOD" as const, maxPerTier: 5 },
      ];

      let productsAssigned = 0;
      for (const { tier, maxPerTier } of thresholds) {
        const tierProducts = scoredProducts.slice(
          productsAssigned,
          productsAssigned + maxPerTier
        );
        for (const { product, matchScore } of tierProducts) {
          pricePoints.push({
            tier,
            product,
            retailPrice: product.retailPrice,
            matchScore,
          });
        }
        productsAssigned += maxPerTier;
      }

      return pricePoints;
    } catch (error) {
      logger.error("Error finding matching products:", error);
      return [];
    }
  }

  /**
   * Update product inventory (e.g., after an order is placed)
   */
  static async updateInventory(
    ecpId: string,
    sku: string,
    quantityChange: number
  ): Promise<void> {
    try {
      const product = await db.query.ecpCatalogData.findFirst({
        where: (fields: any) =>
          and(eq(fields.ecpId, ecpId), eq(fields.productSku, sku)),
      });

      if (product) {
        const newQuantity = Math.max(0, product.stockQuantity + quantityChange);
        await db
          .update(ecpCatalogData)
          .set({
            stockQuantity: newQuantity,
            isInStock: newQuantity > 0,
            lastUpdated: new Date(),
          })
          .where(
            and(
              eq(ecpCatalogData.ecpId, ecpId),
              eq(ecpCatalogData.productSku, sku)
            )
          );
      }
    } catch (error) {
      logger.error("Error updating inventory:", error);
    }
  }

  /**
   * Get price statistics for the ECP's catalog
   */
  static async getPriceStatistics(ecpId: string): Promise<{
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    medianPrice: number;
    inStockCount: number;
    outOfStockCount: number;
  }> {
    try {
      const catalog = await EcpCatalogModel.getCatalog(ecpId);

      if (catalog.length === 0) {
        return {
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
          medianPrice: 0,
          inStockCount: 0,
          outOfStockCount: 0,
        };
      }

      const prices = catalog
        .map((p) => p.retailPrice)
        .sort((a, b) => a - b);

      const inStock = catalog.filter((p) => p.isInStock).length;
      const outOfStock = catalog.length - inStock;

      const medianPrice =
        prices.length % 2 === 0
          ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
          : prices[Math.floor(prices.length / 2)];

      return {
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        minPrice: prices[0],
        maxPrice: prices[prices.length - 1],
        medianPrice,
        inStockCount: inStock,
        outOfStockCount: outOfStock,
      };
    } catch (error) {
      logger.error("Error calculating price statistics:", error);
      return {
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        medianPrice: 0,
        inStockCount: 0,
        outOfStockCount: 0,
      };
    }
  }

  /**
   * Search products by name, brand, or SKU
   */
  static async searchProducts(
    ecpId: string,
    query: string
  ): Promise<CatalogProduct[]> {
    try {
      const catalog = await EcpCatalogModel.getCatalog(ecpId);
      const queryLower = query.toLowerCase();

      return catalog.filter(
        (p) =>
          p.name.toLowerCase().includes(queryLower) ||
          p.sku.toLowerCase().includes(queryLower) ||
          (p.brand && p.brand.toLowerCase().includes(queryLower))
      );
    } catch (error) {
      logger.error("Error searching products:", error);
      return [];
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculate how well a product matches a clinical recommendation
   * Score ranges from 0-1
   */
  private static calculateProductMatch(
    product: CatalogProduct,
    recommendation: {
      lensType: string;
      material: string;
      coating: string;
      features?: Record<string, boolean>;
    }
  ): number {
    let score = 0;

    // Exact lens type match (highest weight)
    if (
      product.lensType &&
      product.lensType.toLowerCase() === recommendation.lensType.toLowerCase()
    ) {
      score += 0.4;
    } else if (
      product.lensType &&
      product.lensType
        .toLowerCase()
        .includes(recommendation.lensType.toLowerCase())
    ) {
      score += 0.2; // Partial match
    }

    // Material match
    if (
      product.lensMaterial &&
      product.lensMaterial
        .toLowerCase()
        .includes(recommendation.material.toLowerCase())
    ) {
      score += 0.3;
    } else if (product.lensMaterial) {
      // Partial credit for having material info
      score += 0.1;
    }

    // Coating match
    if (
      product.coating &&
      product.coating
        .toLowerCase()
        .includes(recommendation.coating.toLowerCase())
    ) {
      score += 0.2;
    } else if (product.coating) {
      score += 0.05;
    }

    // Feature match
    if (recommendation.features && product.designFeatures) {
      const matchedFeatures = Object.entries(recommendation.features).filter(
        ([key, required]) =>
          required && product.designFeatures && product.designFeatures[key]
      ).length;

      const recommendedFeatureCount = Object.values(
        recommendation.features
      ).filter((v) => v).length;

      if (recommendedFeatureCount > 0) {
        score +=
          (matchedFeatures / recommendedFeatureCount) * 0.1; // Max 0.1 for features
      }
    }

    // In-stock bonus (encourage recommending available products)
    if (product.isInStock) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }
}
