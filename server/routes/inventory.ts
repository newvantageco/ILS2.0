/**
 * Inventory Management API Routes
 * Handles CRUD operations for products and stock adjustments
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { products, insertProductSchema } from '@shared/schema';
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

      // Log the adjustment (you can create a separate table for this)
      // For now, we'll just return the result
      console.log(`Stock adjusted for product ${id}: ${quantity} (Reason: ${reason}) by user ${userId}`);

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

export default router;
