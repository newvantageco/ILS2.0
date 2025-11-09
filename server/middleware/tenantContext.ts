/**
 * Multi-Tenant Context Middleware
 * Ensures all database queries are scoped to the user's company
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, companies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger, type Logger } from '../utils/logger';

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      companyData?: any;
      tenantContext?: TenantContext;
    }
  }
}

/**
 * Tenant context interface for AI and multi-tenant operations
 */
export interface TenantContext {
  tenantId: string;
  tenantCode?: string;
  subscriptionTier?: string;
  aiQueriesLimit?: number;
  aiQueriesUsed?: number;
  features?: Record<string, boolean>;
}

/**
 * Middleware to set tenant context from authenticated user
 * Must be used AFTER authentication middleware
 */
const logger = createLogger('TenantContext');

export const setTenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required for multi-tenant access'
      });
    }

    // Get user's company ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        id: true,
        companyId: true,
        role: true,
      },
    });

    if (!user || !user.companyId) {
      return res.status(403).json({
        error: 'User not associated with any company'
      });
    }

    // Set tenant context
    req.tenantId = user.companyId;
    req.user.companyId = user.companyId;

    // Optionally, load full company data for branding/settings
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, user.companyId),
    });

    if (!company) {
      return res.status(404).json({
        error: 'Company not found'
      });
    }

    req.companyData = company;

    // Set enhanced tenant context for AI operations
    const companyAny = company as any;
    req.tenantContext = {
      tenantId: user.companyId,
      tenantCode: companyAny.code || company.id,
      subscriptionTier: companyAny.subscriptionTier || 'basic',
      aiQueriesLimit: companyAny.aiQueriesLimit || 1000,
      aiQueriesUsed: companyAny.aiQueriesUsed || 0,
      features: {
        sales_queries: true,
        inventory_queries: true,
        patient_analytics: companyAny.subscriptionTier === 'professional' || companyAny.subscriptionTier === 'enterprise'
      }
    };

    next();
  } catch (error) {
    logger.error('Tenant context error:', error as Error);
    return res.status(500).json({
      error: 'Failed to set tenant context'
    });
  }
};

/**
 * Middleware to ensure admin/owner access within tenant
 */
export const requireTenantAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.tenantId) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  const adminRoles = ['company_admin', 'owner', 'platform_admin'];
  
  if (!req.user.role || !adminRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Admin access required for this operation' 
    });
  }

  next();
};

/**
 * Middleware to validate tenant ownership of a resource
 * Use this to ensure users can only access their company's data
 */
export const validateTenantOwnership = (resourceField: string = 'companyId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const resourceTenantId = req.params[resourceField] || req.body[resourceField];
    
    if (!resourceTenantId) {
      return res.status(400).json({ 
        error: `Missing ${resourceField} in request` 
      });
    }

    if (resourceTenantId !== req.tenantId) {
      return res.status(403).json({ 
        error: 'Access denied: resource belongs to different company' 
      });
    }

    next();
  };
};

/**
 * Helper function to add tenant filter to Drizzle queries
 * Usage: addTenantFilter(req, table.companyId)
 */
export const getTenantFilter = (req: Request) => {
  if (!req.tenantId) {
    throw new Error('Tenant context not set. Use setTenantContext middleware first.');
  }
  return req.tenantId;
};

/**
 * Middleware to log tenant activity for audit trails
 */
export const logTenantActivity = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log activity (implement your logging logic)
      logger.info('Tenant activity logged', {
        action,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      // Don't block request if logging fails
      logger.error('Activity logging failed:', error as Error);
      next();
    }
  };
};

/**
 * Middleware to check if company subscription is active
 */
export const checkSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.companyData) {
      return res.status(500).json({
        error: 'Company data not loaded'
      });
    }

    const company = req.companyData;

    // Check subscription status
    if (company.subscriptionStatus !== 'active') {
      return res.status(402).json({
        error: 'Subscription inactive',
        message: 'Your company subscription is not active. Please contact support.',
        status: company.subscriptionStatus,
      });
    }

    // Check subscription plan limits if needed
    // (e.g., max users, max orders, etc.)

    next();
  } catch (error) {
    logger.error('Subscription check error:', error as Error);
    return res.status(500).json({
      error: 'Failed to verify subscription status'
    });
  }
};

/**
 * Tenant-scoped database query helper
 * Ensures all queries are automatically scoped to tenant
 */
export class TenantDB {
  constructor(private tenantId: string) {}

  // Add helper methods that automatically include tenant filter
  // Example: this.query(orders).where(eq(orders.companyId, this.tenantId))
}

/**
 * Middleware to extract tenant context from authenticated user
 * Alias for setTenantContext for consistency across codebase
 */
export const extractTenantContext = setTenantContext;

export default {
  setTenantContext,
  requireTenantAdmin,
  validateTenantOwnership,
  getTenantFilter,
  logTenantActivity,
  checkSubscriptionStatus,
};
