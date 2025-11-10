/**
 * Point of Sale (POS) API Routes
 * Handles over-the-counter sales transactions for staff members
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import {
  posTransactions,
  posTransactionItems,
  products,
  inventoryMovements,
  insertPosTransactionSchema,
  insertPosTransactionItemSchema,
} from '@shared/schema';
import { eq, and, desc, gte, lte, sql, between } from 'drizzle-orm';
import { validateBody, validateQuery, validateParams } from '../middleware/zodValidation';

const router = Router();

// ============================================
// Product Management for POS
// ============================================

// Get all active products for POS (with stock info)
router.get('/products',
  validateQuery(z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    inStock: z.enum(['true', 'false']).optional(),
  })),
  async (req: Request, res: Response) => {
    try {
      const { category, search, inStock } = req.query;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'User company not found. Please ensure you are associated with a company.' });
      }

      let query = db.select({
        id: products.id,
        companyId: products.companyId,
        ecpId: products.ecpId,
        productType: products.productType,
        sku: products.sku,
        brand: products.brand,
        model: products.model,
        name: products.name,
        description: products.description,
        category: products.category,
        barcode: products.barcode,
        imageUrl: products.imageUrl,
        colorOptions: products.colorOptions,
        cost: products.cost,
        stockQuantity: products.stockQuantity,
        lowStockThreshold: products.lowStockThreshold,
        unitPrice: products.unitPrice,
        taxRate: products.taxRate,
        isActive: products.isActive,
        isPrescriptionRequired: products.isPrescriptionRequired,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      }).from(products)
        .where(
          and(
            eq(products.companyId, companyId),
            eq(products.isActive, true),
            inStock === 'true' ? sql`${products.stockQuantity} > 0` : undefined,
            category ? eq(products.category, category as string) : undefined,
            search ? sql`${products.name} ILIKE ${`%${search}%`} OR ${products.brand} ILIKE ${`%${search}%`}` : undefined
          )
        )
        .orderBy(products.name);

      const productList = await query;

      res.json({
        products: productList,
        count: productList.length,
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }
);

// Search product by barcode
router.get('/products/barcode/:barcode',
  async (req: Request, res: Response) => {
    try {
      const { barcode } = req.params;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }

      const product = await db.query.products.findFirst({
        where: and(
          eq(products.companyId, companyId),
          eq(products.barcode, barcode),
          eq(products.isActive, true)
        ),
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (product.stockQuantity <= 0) {
        return res.status(400).json({ 
          error: 'Product out of stock', 
          product 
        });
      }

      res.json(product);
    } catch (error) {
      console.error('Failed to find product:', error);
      res.status(500).json({ error: 'Failed to find product' });
    }
  }
);

// ============================================
// POS Transaction Management
// ============================================

// Create new POS transaction (complete sale)
const createTransactionSchema = z.object({
  patientId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitPrice: z.string(),
    discountAmount: z.string().optional(),
  })).min(1, 'At least one item required'),
  paymentMethod: z.enum(['cash', 'card', 'insurance', 'split', 'debit', 'mobile_pay']),
  cashReceived: z.string().optional(),
  discountAmount: z.string().optional(),
  notes: z.string().optional(),
});

router.post('/transactions',
  validateBody(createTransactionSchema),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }
      const staffId = req.user!.id;
      const { items, paymentMethod, cashReceived, discountAmount, notes, patientId } = req.body;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Validate stock availability
        for (const item of items) {
          const product = await tx.query.products.findFirst({
            where: and(
              eq(products.id, item.productId),
              eq(products.companyId, companyId)
            ),
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
          }
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        const itemsWithTotals = items.map((item: any) => {
          const unitPrice = parseFloat(item.unitPrice);
          const quantity = item.quantity;
          const itemDiscount = item.discountAmount ? parseFloat(item.discountAmount) : 0;
          const lineTotal = (unitPrice * quantity) - itemDiscount;
          
          subtotal += lineTotal;
          
          // Get tax rate from product (we'll handle this in the actual implementation)
          // For now, assume no tax on line items, will be added at transaction level
          
          return {
            ...item,
            lineTotal: lineTotal.toFixed(2),
          };
        });

        const transactionDiscount = discountAmount ? parseFloat(discountAmount) : 0;
        const total = subtotal - transactionDiscount;

        // Generate transaction number
        const transactionNumber = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create transaction
        const [transaction] = await tx.insert(posTransactions).values({
          companyId: companyId as string,
          transactionNumber,
          staffId,
          patientId: patientId || undefined,
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          discountAmount: transactionDiscount.toFixed(2),
          totalAmount: total.toFixed(2),
          paymentMethod,
          paymentStatus: 'completed' as const,
          cashReceived: cashReceived || undefined,
          changeGiven: cashReceived ? (parseFloat(cashReceived) - total).toFixed(2) : undefined,
          notes: notes || undefined,
          transactionDate: new Date(),
        } as any).returning();

        // Create transaction items and update stock
        const createdItems = [];
        for (const item of itemsWithTotals) {
          // Create item
          const [transactionItem] = await tx.insert(posTransactionItems).values({
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount || '0',
            lineTotal: item.lineTotal,
          }).returning();

          createdItems.push(transactionItem);

          // Update stock
          const previousStock = await db.query.products.findFirst({
            where: eq(products.id, item.productId),
            columns: { stockQuantity: true },
          });

          await tx.update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));

          // Log inventory movement
          await tx.insert(inventoryMovements).values({
            productId: item.productId,
            movementType: 'sale',
            quantity: -item.quantity, // Negative for stock reduction
            previousStock: previousStock?.stockQuantity || 0,
            newStock: (previousStock?.stockQuantity || 0) - item.quantity,
            referenceType: 'pos_transaction',
            referenceId: transaction.id,
            reason: 'POS Sale',
            notes: `Transaction: ${transaction.transactionNumber}`,
            performedBy: staffId,
          } as any);
        }

        return {
          transaction,
          items: createdItems,
        };
      });

      res.status(201).json({
        success: true,
        transaction: result.transaction,
        items: result.items,
      });
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      res.status(500).json({ 
        error: 'Failed to create transaction',
        message: error.message,
      });
    }
  }
);

// Get transaction by ID
router.get('/transactions/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }

      const transaction = await db.query.posTransactions.findFirst({
        where: and(
          eq(posTransactions.id, id),
          eq(posTransactions.companyId, companyId)
        ),
        with: {
          staff: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          patient: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Get items
      const items = await db.select({
        id: posTransactionItems.id,
        productId: posTransactionItems.productId,
        productName: products.name,
        productBrand: products.brand,
        quantity: posTransactionItems.quantity,
        unitPrice: posTransactionItems.unitPrice,
        discountAmount: posTransactionItems.discountAmount,
        lineTotal: posTransactionItems.lineTotal,
      })
        .from(posTransactionItems)
        .leftJoin(products, eq(posTransactionItems.productId, products.id))
        .where(eq(posTransactionItems.transactionId, id));

      res.json({
        ...transaction,
        items,
      });
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  }
);

// Get all transactions with filters
router.get('/transactions',
  validateQuery(z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    staffId: z.string().uuid().optional(),
    paymentMethod: z.string().optional(),
    status: z.string().optional(),
    limit: z.coerce.number().optional().default(50),
    offset: z.coerce.number().optional().default(0),
  })),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, staffId, paymentMethod, status, limit, offset } = req.query;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }

      const conditions = [eq(posTransactions.companyId, companyId)];

      if (startDate) {
        conditions.push(gte(posTransactions.transactionDate, new Date(startDate as string)));
      }
      if (endDate) {
        conditions.push(lte(posTransactions.transactionDate, new Date(endDate as string)));
      }
      if (staffId) {
        conditions.push(eq(posTransactions.staffId, staffId as string));
      }
      if (paymentMethod) {
        conditions.push(eq(posTransactions.paymentMethod, paymentMethod as string));
      }
      if (status) {
        conditions.push(eq(posTransactions.paymentStatus, status as string));
      }

      const transactions = await db.query.posTransactions.findMany({
        where: and(...conditions),
        orderBy: [desc(posTransactions.transactionDate)],
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
        with: {
          staff: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Get total count
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(posTransactions)
        .where(and(...conditions));

      res.json({
        transactions,
        total: count,
        limit,
        offset,
      });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
);

// Refund transaction
router.post('/transactions/:id/refund',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(z.object({
    reason: z.string().min(10, 'Refund reason must be at least 10 characters'),
    restoreStock: z.boolean().default(true),
  })),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, restoreStock } = req.body;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }

      const result = await db.transaction(async (tx) => {
        // Get transaction
        const transaction = await tx.query.posTransactions.findFirst({
          where: and(
            eq(posTransactions.id, id),
            eq(posTransactions.companyId, companyId)
          ),
        });

        if (!transaction) {
          throw new Error('Transaction not found');
        }

        if (transaction.paymentStatus === 'refunded') {
          throw new Error('Transaction already refunded');
        }

        // Update transaction
        const [updatedTransaction] = await tx.update(posTransactions)
          .set({
            paymentStatus: 'refunded',
            refundReason: reason,
            refundedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(posTransactions.id, id))
          .returning();

        // Restore stock if requested
        if (restoreStock) {
          const items = await tx.select()
            .from(posTransactionItems)
            .where(eq(posTransactionItems.transactionId, id));

          for (const item of items) {
            const previousStock = await tx.query.products.findFirst({
              where: eq(products.id, item.productId),
              columns: { stockQuantity: true },
            });

            await tx.update(products)
              .set({
                stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));

            // Log inventory movement for refund
            await tx.insert(inventoryMovements).values({
              productId: item.productId,
              movementType: 'refund',
              quantity: item.quantity, // Positive for stock addition
              previousStock: previousStock?.stockQuantity || 0,
              newStock: (previousStock?.stockQuantity || 0) + item.quantity,
              referenceType: 'pos_transaction',
              referenceId: id,
              reason: reason,
              notes: `Refund for transaction: ${transaction.transactionNumber}`,
              performedBy: req.user!.id,
            } as any);
          }
        }

        return updatedTransaction;
      });

      res.json({
        success: true,
        transaction: result,
      });
    } catch (error: any) {
      console.error('Failed to refund transaction:', error);
      res.status(500).json({ 
        error: 'Failed to refund transaction',
        message: error.message,
      });
    }
  }
);

// ============================================
// POS Analytics & Reports
// ============================================

// Get daily sales summary
router.get('/reports/daily-summary',
  validateQuery(z.object({
    date: z.string().optional(),
  })),
  async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }
      const targetDate = date ? new Date(date as string) : new Date();
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [summary] = await db.select({
        transactionCount: sql<number>`count(*)`,
        totalRevenue: sql<string>`sum(${posTransactions.totalAmount})`,
        totalDiscount: sql<string>`sum(${posTransactions.discountAmount})`,
        cashTransactions: sql<number>`count(*) filter (where ${posTransactions.paymentMethod} = 'cash')`,
        cardTransactions: sql<number>`count(*) filter (where ${posTransactions.paymentMethod} = 'card')`,
        refundCount: sql<number>`count(*) filter (where ${posTransactions.paymentStatus} = 'refunded')`,
      })
        .from(posTransactions)
        .where(
          and(
            eq(posTransactions.companyId, companyId),
            between(posTransactions.transactionDate, startOfDay, endOfDay)
          )
        );

      res.json({
        date: targetDate.toISOString().split('T')[0],
        ...summary,
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
);

// Get staff performance
router.get('/reports/staff-performance',
  validateQuery(z.object({
    startDate: z.string(),
    endDate: z.string(),
  })),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.status(403).json({ error: 'Company context missing' });
      }

      const performance = await db.select({
        staffId: posTransactions.staffId,
        transactionCount: sql<number>`count(*)`,
        totalRevenue: sql<string>`sum(${posTransactions.totalAmount})`,
        averageTransaction: sql<string>`avg(${posTransactions.totalAmount})`,
      })
        .from(posTransactions)
        .where(
          and(
            eq(posTransactions.companyId, companyId),
            eq(posTransactions.paymentStatus, 'completed'),
            gte(posTransactions.transactionDate, new Date(startDate as string)),
            lte(posTransactions.transactionDate, new Date(endDate as string))
          )
        )
        .groupBy(posTransactions.staffId);

      res.json(performance);
    } catch (error) {
      console.error('Failed to generate staff performance:', error);
      res.status(500).json({ error: 'Failed to generate staff performance' });
    }
  }
);

export default router;
