/**
 * Product Repository
 *
 * Handles tenant-scoped product and inventory operations including:
 * - Product CRUD with variants
 * - Inventory tracking and movements
 * - Stock level management
 * - Low stock alerts
 *
 * SECURITY:
 * - All queries scoped by companyId
 * - Audit logging for inventory changes
 * - Movement history for audit trail
 *
 * @module server/repositories/ProductRepository
 */

import { BaseRepository, QueryOptions } from './BaseRepository';
import { db } from '../db';
import {
  products,
  productVariants,
  inventoryMovements,
  type Product,
  type InsertProduct,
  type ProductVariant,
  type InsertProductVariant,
  type InventoryMovement,
  type InsertInventoryMovement,
} from '@shared/schema/inventory';
import { eq, and, desc, sql, gte, lte, like, or, ilike } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProductRepository');

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface ProductSearchOptions extends QueryOptions {
  category?: string;
  productType?: 'frame' | 'contact_lens' | 'solution' | 'service';
  brand?: string;
  isActive?: boolean;
  lowStock?: boolean;
  query?: string; // Full-text search
  minPrice?: number;
  maxPrice?: number;
}

export interface InventoryAdjustment {
  productId: string;
  quantity: number; // Positive = add, negative = remove
  reason: string;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalStockValue: number;
  productsByCategory: Record<string, number>;
}

// ============================================
// PRODUCT REPOSITORY
// ============================================

export class ProductRepository extends BaseRepository<typeof products, InsertProduct, Product> {
  constructor(tenantId: string) {
    super(products, tenantId, 'companyId');
  }

  // ============================================
  // PRODUCT QUERIES
  // ============================================

  /**
   * Find product by ID with variants
   */
  async findByIdWithVariants(id: string): Promise<ProductWithVariants | undefined> {
    const product = await this.findById(id);
    if (!product) return undefined;

    const variants = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, id),
          eq(productVariants.companyId, this.tenantId)
        )
      )
      .orderBy(productVariants.displayOrder);

    return {
      ...product,
      variants,
    };
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string): Promise<Product | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .where(this.withTenantFilter(eq(products.sku, sku)))
      .limit(1);

    return result;
  }

  /**
   * Find product by barcode
   */
  async findByBarcode(barcode: string): Promise<Product | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .where(this.withTenantFilter(eq(products.barcode, barcode)))
      .limit(1);

    return result;
  }

  /**
   * Search products with filters
   */
  async search(options: ProductSearchOptions = {}): Promise<Product[]> {
    const conditions: any[] = [];

    if (options.category) {
      conditions.push(eq(products.category, options.category));
    }
    if (options.productType) {
      conditions.push(eq(products.productType, options.productType));
    }
    if (options.brand) {
      conditions.push(eq(products.brand, options.brand));
    }
    if (options.isActive !== undefined) {
      conditions.push(eq(products.isActive, options.isActive));
    }
    if (options.lowStock) {
      conditions.push(
        sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
      );
    }
    if (options.query) {
      conditions.push(
        or(
          ilike(products.name, `%${options.query}%`),
          ilike(products.brand, `%${options.query}%`),
          ilike(products.model, `%${options.query}%`),
          ilike(products.sku, `%${options.query}%`),
          ilike(products.barcode, `%${options.query}%`)
        )
      );
    }
    if (options.minPrice !== undefined) {
      conditions.push(gte(products.unitPrice, options.minPrice.toString()));
    }
    if (options.maxPrice !== undefined) {
      conditions.push(lte(products.unitPrice, options.maxPrice.toString()));
    }

    return this.findMany(
      conditions.length > 0 ? and(...conditions) : undefined,
      {
        limit: options.limit,
        offset: options.offset,
        orderBy: options.orderBy,
        orderByField: options.orderByField || 'name',
      }
    );
  }

  /**
   * Get products with low stock
   */
  async findLowStock(options: QueryOptions = {}): Promise<Product[]> {
    return this.findMany(
      and(
        eq(products.isActive, true),
        sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
      ),
      options
    );
  }

  /**
   * Get products by category
   */
  async findByCategory(category: string, options: QueryOptions = {}): Promise<Product[]> {
    return this.findMany(
      and(eq(products.category, category), eq(products.isActive, true)),
      options
    );
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const results = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .where(this.withTenantFilter(eq(products.isActive, true)));

    return results
      .map(r => r.category)
      .filter((c): c is string => c !== null);
  }

  /**
   * Get all unique brands
   */
  async getBrands(): Promise<string[]> {
    const results = await db
      .selectDistinct({ brand: products.brand })
      .from(products)
      .where(this.withTenantFilter(eq(products.isActive, true)));

    return results
      .map(r => r.brand)
      .filter((b): b is string => b !== null);
  }

  // ============================================
  // INVENTORY MANAGEMENT
  // ============================================

  /**
   * Adjust inventory with movement tracking
   */
  async adjustInventory(
    adjustment: InventoryAdjustment,
    userId: string
  ): Promise<{ product: Product; movement: InventoryMovement } | undefined> {
    const product = await this.findById(adjustment.productId);
    if (!product) return undefined;

    const previousStock = product.stockQuantity;
    const newStock = Math.max(0, previousStock + adjustment.quantity);

    // Determine movement type
    let movementType: 'sale' | 'refund' | 'adjustment' | 'received' | 'damaged';
    if (adjustment.referenceType === 'pos_transaction') {
      movementType = adjustment.quantity < 0 ? 'sale' : 'refund';
    } else if (adjustment.referenceType === 'purchase_order') {
      movementType = 'received';
    } else if (adjustment.reason?.toLowerCase().includes('damage')) {
      movementType = 'damaged';
    } else {
      movementType = 'adjustment';
    }

    // Create movement record
    const [movement] = await db
      .insert(inventoryMovements)
      .values({
        companyId: this.tenantId,
        productId: adjustment.productId,
        movementType,
        quantity: adjustment.quantity,
        previousStock,
        newStock,
        referenceType: adjustment.referenceType,
        referenceId: adjustment.referenceId,
        reason: adjustment.reason,
        notes: adjustment.notes,
        performedBy: userId,
        createdAt: new Date(),
      })
      .returning();

    // Update product stock
    const updatedProduct = await this.update(
      adjustment.productId,
      { stockQuantity: newStock },
      { userId }
    );

    logger.info({
      audit: true,
      action: 'adjustInventory',
      productId: adjustment.productId,
      movementType,
      quantity: adjustment.quantity,
      previousStock,
      newStock,
      tenantId: this.tenantId,
      userId,
    }, `Inventory adjusted: ${previousStock} → ${newStock}`);

    return {
      product: updatedProduct!,
      movement,
    };
  }

  /**
   * Record a sale (decrease stock)
   */
  async recordSale(
    productId: string,
    quantity: number,
    transactionId: string,
    userId: string
  ): Promise<{ product: Product; movement: InventoryMovement } | undefined> {
    return this.adjustInventory(
      {
        productId,
        quantity: -Math.abs(quantity),
        reason: 'POS Sale',
        referenceType: 'pos_transaction',
        referenceId: transactionId,
      },
      userId
    );
  }

  /**
   * Record stock receipt
   */
  async recordReceipt(
    productId: string,
    quantity: number,
    purchaseOrderId: string,
    userId: string,
    notes?: string
  ): Promise<{ product: Product; movement: InventoryMovement } | undefined> {
    return this.adjustInventory(
      {
        productId,
        quantity: Math.abs(quantity),
        reason: 'Stock Received',
        referenceType: 'purchase_order',
        referenceId: purchaseOrderId,
        notes,
      },
      userId
    );
  }

  /**
   * Get inventory movement history for a product
   */
  async getMovementHistory(
    productId: string,
    options: QueryOptions = {}
  ): Promise<InventoryMovement[]> {
    const { limit = 50, offset = 0 } = options;

    const movements = await db
      .select()
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.companyId, this.tenantId),
          eq(inventoryMovements.productId, productId)
        )
      )
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(limit)
      .offset(offset);

    return movements;
  }

  // ============================================
  // VARIANT MANAGEMENT
  // ============================================

  /**
   * Add variant to product
   */
  async addVariant(
    productId: string,
    variantData: Partial<InsertProductVariant>
  ): Promise<ProductVariant | undefined> {
    // Verify product exists and belongs to tenant
    const product = await this.findById(productId);
    if (!product) return undefined;

    const [created] = await db
      .insert(productVariants)
      .values({
        ...variantData,
        productId,
        companyId: this.tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created;
  }

  /**
   * Update variant
   */
  async updateVariant(
    variantId: string,
    data: Partial<InsertProductVariant>
  ): Promise<ProductVariant | undefined> {
    const [updated] = await db
      .update(productVariants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.companyId, this.tenantId)
        )
      )
      .returning();

    return updated;
  }

  /**
   * Delete variant
   */
  async deleteVariant(variantId: string): Promise<boolean> {
    const result = await db
      .delete(productVariants)
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.companyId, this.tenantId)
        )
      )
      .returning({ id: productVariants.id });

    return result.length > 0;
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get product statistics for the tenant
   */
  async getStats(): Promise<ProductStats> {
    const [stats] = await db
      .select({
        totalProducts: sql<number>`count(*)`,
        activeProducts: sql<number>`sum(case when ${products.isActive} then 1 else 0 end)`,
        lowStockProducts: sql<number>`sum(case when ${products.stockQuantity} <= ${products.lowStockThreshold} and ${products.isActive} then 1 else 0 end)`,
        totalStockValue: sql<number>`coalesce(sum(${products.stockQuantity}::numeric * ${products.unitPrice}::numeric), 0)`,
      })
      .from(products)
      .where(this.getTenantFilter());

    // Get counts by category
    const categoryCounts = await db
      .select({
        category: products.category,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .where(this.getTenantFilter())
      .groupBy(products.category);

    const productsByCategory: Record<string, number> = {};
    for (const row of categoryCounts) {
      if (row.category) {
        productsByCategory[row.category] = Number(row.count);
      }
    }

    return {
      totalProducts: Number(stats.totalProducts),
      activeProducts: Number(stats.activeProducts || 0),
      lowStockProducts: Number(stats.lowStockProducts || 0),
      totalStockValue: Number(stats.totalStockValue),
      productsByCategory,
    };
  }

  /**
   * Get top selling products (based on movement history)
   */
  async getTopSelling(limit: number = 10): Promise<{ productId: string; totalSold: number }[]> {
    const results = await db
      .select({
        productId: inventoryMovements.productId,
        totalSold: sql<number>`sum(abs(${inventoryMovements.quantity}))`,
      })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.companyId, this.tenantId),
          eq(inventoryMovements.movementType, 'sale')
        )
      )
      .groupBy(inventoryMovements.productId)
      .orderBy(desc(sql`sum(abs(${inventoryMovements.quantity}))`))
      .limit(limit);

    return results.map(r => ({
      productId: r.productId,
      totalSold: Number(r.totalSold),
    }));
  }
}

export default ProductRepository;
