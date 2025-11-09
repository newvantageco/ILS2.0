/**
 * Inventory Management API Routes
 * Handles CRUD operations for products and stock adjustments
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { products, insertProductSchema, inventoryMovements } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { validateBody, validateQuery, validateParams } from '../middleware/zodValidation';

const router = Router();

// ============================================
// Product CRUD Operations
// ============================================

/**
 * Create new product
 */
const createProductSchema = z.object({
  sku: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  barcode: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  colorOptions: z.array(z.string()).optional(),
  cost: z.string().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  unitPrice: z.string().min(1, 'Unit price is required'),
  taxRate: z.string().default('0'),
  isActive: z.boolean().default(true),
  isPrescriptionRequired: z.boolean().default(false),
});

router.post('/products',
  validateBody(createProductSchema),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      const ecpId = req.user!.id;
      const productData = req.body;

      // Check if barcode already exists (if provided)
      if (productData.barcode) {
        const existingProduct = await db.query.products.findFirst({
          where: and(
            eq(products.companyId, companyId),
            eq(products.barcode, productData.barcode)
          ),
        });

        if (existingProduct) {
          return res.status(400).json({ 
            error: 'A product with this barcode already exists' 
          });
        }
      }

      const [newProduct] = await db.insert(products).values({
        companyId,
        ecpId,
        productType: 'frame', // Default type
        ...productData,
        colorOptions: productData.colorOptions || null,
        imageUrl: productData.imageUrl || null,
      } as any).returning();

      // Log initial stock if any
      if (productData.stockQuantity > 0) {
        await db.insert(inventoryMovements).values({
          productId: newProduct.id,
          movementType: 'initial',
          quantity: productData.stockQuantity,
          previousStock: 0,
          newStock: productData.stockQuantity,
          referenceType: 'manual_adjustment',
          reason: 'Initial product creation',
          performedBy: ecpId,
        } as any);
      }

      res.status(201).json({
        success: true,
        product: newProduct,
      });
    } catch (error: any) {
      console.error('Failed to create product:', error);
      res.status(500).json({ 
        error: 'Failed to create product',
        message: error.message,
      });
    }
  }
);

/**
 * Update existing product
 */
router.put('/products/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(createProductSchema.partial()),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      const updates = req.body;

      // Check if product exists and belongs to company
      const existingProduct = await db.query.products.findFirst({
        where: and(
          eq(products.id, id),
          eq(products.companyId, companyId)
        ),
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if barcode is being changed and if it's already in use
      if (updates.barcode && updates.barcode !== existingProduct.barcode) {
        const barcodeExists = await db.query.products.findFirst({
          where: and(
            eq(products.companyId, companyId),
            eq(products.barcode, updates.barcode)
          ),
        });

        if (barcodeExists) {
          return res.status(400).json({ 
            error: 'A product with this barcode already exists' 
          });
        }
      }

      const [updatedProduct] = await db.update(products)
        .set({
          ...updates,
          colorOptions: updates.colorOptions || existingProduct.colorOptions,
          imageUrl: updates.imageUrl || existingProduct.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      res.json({
        success: true,
        product: updatedProduct,
      });
    } catch (error: any) {
      console.error('Failed to update product:', error);
      res.status(500).json({ 
        error: 'Failed to update product',
        message: error.message,
      });
    }
  }
);

/**
 * Delete product (soft delete by setting isActive to false)
 */
router.delete('/products/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      // Check if product exists and belongs to company
      const existingProduct = await db.query.products.findFirst({
        where: and(
          eq(products.id, id),
          eq(products.companyId, companyId)
        ),
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Soft delete - set isActive to false
      await db.update(products)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id));

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      res.status(500).json({ 
        error: 'Failed to delete product',
        message: error.message,
      });
    }
  }
);

// ============================================
// Stock Adjustments
// ============================================

/**
 * Adjust product stock
 */
const adjustStockSchema = z.object({
  quantity: z.number().int().refine(val => val !== 0, {
    message: 'Quantity adjustment cannot be zero',
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

router.post('/products/:id/adjust',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(adjustStockSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { quantity, reason } = req.body;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      const userId = req.user!.id;

      // Get current product
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, id),
          eq(products.companyId, companyId)
        ),
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const newQuantity = product.stockQuantity + quantity;

      if (newQuantity < 0) {
        return res.status(400).json({ 
          error: 'Cannot reduce stock below zero',
          currentStock: product.stockQuantity,
          attemptedAdjustment: quantity,
        });
      }

      // Update stock
      const [updatedProduct] = await db.update(products)
        .set({
          stockQuantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      // Log the movement
      await db.insert(inventoryMovements).values({
        productId: id,
        movementType: 'adjustment',
        quantity,
        previousStock: product.stockQuantity,
        newStock: newQuantity,
        referenceType: 'manual_adjustment',
        reason,
        notes: `Manual stock adjustment by user`,
        performedBy: userId,
      } as any);

      res.json({
        success: true,
        product: updatedProduct,
        adjustment: {
          previousStock: product.stockQuantity,
          change: quantity,
          newStock: newQuantity,
          reason,
          adjustedBy: userId,
          adjustedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      res.status(500).json({ 
        error: 'Failed to adjust stock',
        message: error.message,
      });
    }
  }
);

/**
 * Get low stock products
 */
router.get('/low-stock',
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const lowStockProducts = await db.select()
        .from(products)
        .where(
          and(
            eq(products.companyId, companyId),
            eq(products.isActive, true),
            sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
          )
        )
        .orderBy(products.stockQuantity);

      res.json({
        products: lowStockProducts,
        count: lowStockProducts.length,
      });
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
      res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  }
);

/**
 * Get out of stock products
 */
router.get('/out-of-stock',
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const outOfStockProducts = await db.select()
        .from(products)
        .where(
          and(
            eq(products.companyId, companyId),
            eq(products.isActive, true),
            eq(products.stockQuantity, 0)
          )
        )
        .orderBy(products.name);

      res.json({
        products: outOfStockProducts,
        count: outOfStockProducts.length,
      });
    } catch (error) {
      console.error('Failed to fetch out of stock products:', error);
      res.status(500).json({ error: 'Failed to fetch out of stock products' });
    }
  }
);

/**
 * Bulk stock update (for imports/bulk operations)
 */
const bulkStockUpdateSchema = z.object({
  updates: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(0),
    reason: z.string().optional(),
  })),
});

router.post('/bulk-stock-update',
  validateBody(bulkStockUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const { updates } = req.body;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const product = await db.query.products.findFirst({
            where: and(
              eq(products.id, update.productId),
              eq(products.companyId, companyId)
            ),
          });

          if (!product) {
            errors.push({
              productId: update.productId,
              error: 'Product not found',
            });
            continue;
          }

          const [updatedProduct] = await db.update(products)
            .set({
              stockQuantity: update.quantity,
              updatedAt: new Date(),
            })
            .where(eq(products.id, update.productId))
            .returning();

          results.push({
            productId: update.productId,
            previousStock: product.stockQuantity,
            newStock: update.quantity,
            success: true,
          });
        } catch (error: any) {
          errors.push({
            productId: update.productId,
            error: error.message,
          });
        }
      }

      res.json({
        success: errors.length === 0,
        results,
        errors,
        totalProcessed: updates.length,
        successCount: results.length,
        errorCount: errors.length,
      });
    } catch (error: any) {
      console.error('Failed to process bulk stock update:', error);
      res.status(500).json({ 
        error: 'Failed to process bulk stock update',
        message: error.message,
      });
    }
  }
);

// ============================================
// Inventory Movement History
// ============================================

/**
 * Get inventory movement history for a product
 */
router.get('/products/:id/movements',
  validateParams(z.object({ id: z.string().uuid() })),
  validateQuery(z.object({
    limit: z.coerce.number().optional().default(50),
    offset: z.coerce.number().optional().default(0),
  })),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      // Verify product belongs to company
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, id),
          eq(products.companyId, companyId)
        ),
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const movements = await db.query.inventoryMovements.findMany({
        where: eq(inventoryMovements.productId, id),
        orderBy: (movements, { desc }) => [desc(movements.createdAt)],
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
        with: {
          performedBy: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Get total count
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(inventoryMovements)
        .where(eq(inventoryMovements.productId, id));

      res.json({
        movements,
        total: count,
        limit,
        offset,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stockQuantity,
        },
      });
    } catch (error: any) {
      console.error('Failed to fetch inventory movements:', error);
      res.status(500).json({ 
        error: 'Failed to fetch inventory movements',
        message: error.message,
      });
    }
  }
);

/**
 * Get all inventory movements with filters
 */
router.get('/movements',
  validateQuery(z.object({
    productId: z.string().uuid().optional(),
    movementType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.coerce.number().optional().default(100),
    offset: z.coerce.number().optional().default(0),
  })),
  async (req: Request, res: Response) => {
    try {
      const { productId, movementType, startDate, endDate, limit, offset } = req.query;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const conditions = [];

      // Join with products to filter by company
      if (productId) {
        conditions.push(eq(inventoryMovements.productId, productId as string));
      }

      if (movementType) {
        conditions.push(eq(inventoryMovements.movementType, movementType as any));
      }

      if (startDate) {
        conditions.push(sql`${inventoryMovements.createdAt} >= ${new Date(startDate as string)}`);
      }

      if (endDate) {
        conditions.push(sql`${inventoryMovements.createdAt} <= ${new Date(endDate as string)}`);
      }

      const movements = await db.select({
        id: inventoryMovements.id,
        productId: inventoryMovements.productId,
        productName: products.name,
        productSku: products.sku,
        movementType: inventoryMovements.movementType,
        quantity: inventoryMovements.quantity,
        previousStock: inventoryMovements.previousStock,
        newStock: inventoryMovements.newStock,
        referenceType: inventoryMovements.referenceType,
        referenceId: inventoryMovements.referenceId,
        reason: inventoryMovements.reason,
        notes: inventoryMovements.notes,
        performedBy: inventoryMovements.performedBy,
        createdAt: inventoryMovements.createdAt,
      })
        .from(inventoryMovements)
        .leftJoin(products, eq(inventoryMovements.productId, products.id))
        .where(and(
          eq(products.companyId, companyId),
          ...conditions
        ))
        .orderBy(sql`${inventoryMovements.createdAt} DESC`)
        .limit(Number(limit) || 100)
        .offset(Number(offset) || 0);

      // Get total count
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(inventoryMovements)
        .leftJoin(products, eq(inventoryMovements.productId, products.id))
        .where(and(
          eq(products.companyId, companyId),
          ...conditions
        ));

      res.json({
        movements,
        total: count,
        limit,
        offset,
      });
    } catch (error: any) {
      console.error('Failed to fetch inventory movements:', error);
      res.status(500).json({ 
        error: 'Failed to fetch inventory movements',
        message: error.message,
      });
    }
  }
);

export default router;
