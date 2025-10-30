/**
 * Example: Integrating Zod Validation Middleware into Existing Routes
 * 
 * This file demonstrates how to update your existing API routes
 * to use the Zod validation middleware for bulletproof input validation.
 */

import { Router, Request, Response } from 'express';
import { validateBody, validateQuery, validateParams } from '../middleware/zodValidation';
import { z } from 'zod';
import {
  insertOrderSchema,
  updateOrderStatusSchema,
  insertPatientSchema,
  insertPrescriptionSchema,
} from '@shared/schema';

const router = Router();

// ==========================================
// EXAMPLE 1: Order Creation with Validation
// ==========================================

// Before: No validation (❌ Dangerous!)
router.post('/orders-old', async (req: Request, res: Response) => {
  try {
    // req.body could be ANYTHING - no type safety!
    const order = await db.insert(orders).values(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// After: With Zod validation (✅ Safe!)
router.post('/orders',
  validateBody(insertOrderSchema), // Validates & returns 400 if invalid
  async (req: Request, res: Response) => {
    try {
      // req.body is now guaranteed to match insertOrderSchema!
      const order = await db.insert(orders).values(req.body);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
);

// ==========================================
// EXAMPLE 2: Status Update with Validation
// ==========================================

// Define param schema for order ID
const orderIdParamSchema = z.object({
  id: z.string().uuid('Invalid order ID format'),
});

router.patch('/orders/:id/status',
  validateParams(orderIdParamSchema),    // Validates URL params
  validateBody(updateOrderStatusSchema),  // Validates request body
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updatedOrder = await db.update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      
      if (!updatedOrder.length) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json(updatedOrder[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  }
);

// ==========================================
// EXAMPLE 3: Patient Search with Query Validation
// ==========================================

// Define query schema
const patientSearchQuerySchema = z.object({
  search: z.string().min(1, 'Search term required'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

router.get('/patients/search',
  validateQuery(patientSearchQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { search, limit = 10, offset = 0 } = req.query;
      
      const patients = await db.query.patients.findMany({
        where: or(
          like(patients.name, `%${search}%`),
          like(patients.email, `%${search}%`)
        ),
        limit,
        offset,
      });
      
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  }
);

// ==========================================
// EXAMPLE 4: Prescription Creation with Nested Validation
// ==========================================

router.post('/prescriptions',
  validateBody(insertPrescriptionSchema),
  async (req: Request, res: Response) => {
    try {
      // The schema ensures all required fields are present and valid
      const prescription = await db.insert(prescriptions)
        .values({
          ...req.body,
          ecpId: req.user!.id, // From authentication middleware
          issueDate: new Date(),
        })
        .returning();
      
      res.status(201).json(prescription[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create prescription' });
    }
  }
);

// ==========================================
// EXAMPLE 5: File Upload with Custom Validation
// ==========================================

const omaUploadSchema = z.object({
  orderId: z.string().uuid(),
  eyeSide: z.enum(['OD', 'OS']),
});

router.post('/orders/:id/oma-file',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(omaUploadSchema),
  upload.single('omaFile'), // Multer middleware
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'OMA file required' });
      }
      
      const { id } = req.params;
      const fileContent = req.file.buffer.toString('utf-8');
      
      // Parse and validate OMA file
      const parsedData = parseOMAFile(fileContent);
      
      // Update order with OMA data
      await db.update(orders)
        .set({
          omaFileContent: fileContent,
          omaFilename: req.file.originalname,
          omaParsedData: parsedData,
        })
        .where(eq(orders.id, id));
      
      res.json({ success: true, data: parsedData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process OMA file' });
    }
  }
);

// ==========================================
// EXAMPLE 6: Complex Business Logic with Multiple Validations
// ==========================================

const bulkOrderSchema = z.object({
  orders: z.array(insertOrderSchema).min(1, 'At least one order required').max(50, 'Maximum 50 orders per batch'),
  applyDiscount: z.boolean().optional(),
  discountPercent: z.number().min(0).max(50).optional(),
});

router.post('/orders/bulk',
  validateBody(bulkOrderSchema),
  async (req: Request, res: Response) => {
    try {
      const { orders: ordersList, applyDiscount, discountPercent } = req.body;
      
      // Process all orders in a transaction
      const createdOrders = await db.transaction(async (tx) => {
        const results = [];
        
        for (const orderData of ordersList) {
          const order = await tx.insert(orders)
            .values({
              ...orderData,
              ecpId: req.user!.id,
              status: 'pending',
            })
            .returning();
          
          results.push(order[0]);
        }
        
        return results;
      });
      
      res.status(201).json({
        success: true,
        created: createdOrders.length,
        orders: createdOrders,
      });
    } catch (error) {
      res.status(500).json({ error: 'Bulk order creation failed' });
    }
  }
);

// ==========================================
// EXAMPLE 7: Database Output Validation
// ==========================================

import { validateDatabaseOutput, validateDatabaseArray } from '../middleware/zodValidation';

router.get('/orders/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Fetch from database
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          patient: true,
          ecp: true,
        },
      });
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Validate database output matches schema
      // This catches any schema drift or data corruption
      const validatedOrder = validateDatabaseOutput(orderSchema, order);
      
      res.json(validatedOrder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  }
);

// ==========================================
// EXAMPLE 8: Conditional Validation
// ==========================================

const userUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ecp', 'admin', 'lab_tech']).optional(),
  // Password must be strong if provided
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
    .optional(),
}).refine(
  // At least one field must be provided
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

router.patch('/users/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(userUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const updatedUser = await db.update(users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser.length) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser[0];
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

export default router;
