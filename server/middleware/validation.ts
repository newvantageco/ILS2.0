/**
 * Input Validation Middleware
 * Uses Zod for runtime type checking and validation
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/ApiError';

/**
 * Generic validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export function validateRequest(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validated = await schema.parseAsync(data);
      req[source] = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}

// Common validation schemas

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number'),
});

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  companyName: z.string().min(1, 'Company name is required').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to terms and conditions',
  }),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const passwordUpdateSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// Patient schemas
export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: z.string().datetime('Invalid date format'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional(),
  insuranceProvider: z.string().max(100).optional(),
  insurancePolicyNumber: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

// Prescription schemas
export const prescriptionSchema = z.object({
  rightEye: z.object({
    sphere: z.number().min(-20).max(20),
    cylinder: z.number().min(-10).max(10).optional(),
    axis: z.number().min(0).max(180).optional(),
    add: z.number().min(0).max(4).optional(),
  }),
  leftEye: z.object({
    sphere: z.number().min(-20).max(20),
    cylinder: z.number().min(-10).max(10).optional(),
    axis: z.number().min(0).max(180).optional(),
    add: z.number().min(0).max(4).optional(),
  }),
  pd: z.number().min(40).max(80).optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.number().int().positive(),
  patientName: z.string().min(1).max(100),
  prescription: prescriptionSchema,
  doctorName: z.string().min(1).max(100),
  licenseNumber: z.string().min(1).max(50),
  expirationDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().max(500).optional(),
});

// Order schemas
export const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().min(1),
  price: z.number().positive(),
  lensType: z.string().max(50).optional(),
  frameType: z.string().max(50).optional(),
  prescription: prescriptionSchema.optional(),
});

export const createOrderSchema = z.object({
  patientId: z.number().int().positive(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(50),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().length(2).default('US'),
  }),
  billingAddress: z
    .object({
      street: z.string().min(1).max(200),
      city: z.string().min(1).max(50),
      state: z.string().length(2),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      country: z.string().length(2).default('US'),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

// Equipment schemas
export const createEquipmentSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['lensmeter', 'edger', 'polisher', 'tracer', 'other']),
  manufacturer: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  serialNumber: z.string().min(1).max(50),
  purchaseDate: z.string().datetime('Invalid date format'),
  warrantyExpiration: z.string().datetime('Invalid date format').optional(),
  status: z.enum(['active', 'maintenance', 'retired']).default('active'),
  location: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

// Inventory schemas
export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(100),
  sku: z.string().min(1).max(50),
  category: z.enum(['frames', 'lenses', 'accessories', 'supplies', 'other']),
  quantity: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).default(10),
  unitPrice: z.number().positive(),
  supplier: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

// AI Query schemas
export const aiQuerySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(5000),
  context: z.string().max(10000).optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().max(4000).default(1000),
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet']).optional(),
});

// Payment schemas
export const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('usd'),
  orderId: z.number().int().positive().optional(),
  metadata: z.record(z.string()).optional(),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
  paymentMethodId: z.string().min(1),
});

// Subscription schemas
export const createSubscriptionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  couponId: z.string().optional(),
});

export const updateSubscriptionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime('Invalid date format'),
  metrics: z.array(z.string()).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).default('day'),
  filters: z.record(z.any()).optional(),
});

// User management schemas
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  role: z.enum(['owner', 'admin', 'manager', 'staff']).optional(),
  accountStatus: z.enum(['active', 'suspended', 'pending']).optional(),
});

// Legacy validation for backward compatibility
export const validatePrescriptionInput = (req: Request, res: Response, next: NextFunction) => {
  const { patientName, patientId, prescription, doctorName, licenseNumber } = req.body;
  if (!patientName || !patientId || !prescription || !doctorName || !licenseNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  next();
};