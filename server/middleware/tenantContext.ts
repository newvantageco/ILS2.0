/**
 * Multi-Tenant Context Middleware
 * Layer 2: The Gatekeeper - Sets PostgreSQL session variables for RLS
 *
 * This middleware implements the second layer of the Defense-in-Depth architecture:
 * - Sets app.current_tenant session variable for Row-Level Security (RLS)
 * - Sets app.current_user_role for platform admin bypass
 * - Ensures all database queries are scoped to the user's company at the database level
 *
 * Type declarations are centralized in server/types/express.d.ts
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, companies } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

// Re-export TenantContext from centralized types for convenience
export type { TenantContext, Repositories } from '../types/express.d';

/**
 * Middleware to set tenant context from authenticated user
 * Must be used AFTER authentication middleware
 *
 * SECURITY: This middleware sets PostgreSQL session variables that enforce
 * Row-Level Security (RLS) at the database kernel level. Even if a developer
 * writes SELECT * FROM patients, the database will only return rows belonging
 * to the active tenant.
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

    // Get user's company ID and role
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        id: true,
        companyId: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(403).json({
        error: 'User not found'
      });
    }

    // Platform admins can operate without a tenant (they see all data via RLS bypass)
    const isPlatformAdmin = user.role === 'platform_admin';

    if (!user.companyId && !isPlatformAdmin) {
      return res.status(403).json({
        error: 'User not associated with any company'
      });
    }

    // Set tenant context on request
    // tenantId is required - use 'platform_admin' for platform admins without company
    req.tenantId = user.companyId || (isPlatformAdmin ? 'platform_admin' : '');
    req.user.companyId = user.companyId || undefined;
    req.user.role = user.role;

    // Initialize repos placeholder (will be populated by repository middleware)
    req.repos = req.repos || {};

    // ============================================
    // LAYER 2: SET POSTGRESQL SESSION VARIABLES
    // ============================================
    // This is the critical security layer. We set session variables that
    // PostgreSQL RLS policies will read to enforce tenant isolation.
    //
    // Defense-in-Depth: Even if application code forgets to filter by company_id,
    // the database will enforce isolation automatically.

    try {
      // Set session variables for this connection/transaction
      // These are scoped to the current request and will be cleared after
      if (user.companyId) {
        await db.execute(sql`SET LOCAL app.current_tenant = ${user.companyId}`);
      }

      await db.execute(sql`SET LOCAL app.current_user_role = ${user.role}`);

      logger.debug({
        userId: user.id,
        tenantId: user.companyId,
        role: user.role
      }, 'PostgreSQL session variables set for RLS');

    } catch (sessionError) {
      logger.error({ err: sessionError }, 'Failed to set PostgreSQL session variables');
      // This is a critical security failure - do not proceed
      return res.status(500).json({
        error: 'Failed to initialize database security context'
      });
    }

    // Optionally, load full company data for branding/settings
    // Only load if user has a company (platform admins might not)
    if (user.companyId) {
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
    } else if (isPlatformAdmin) {
      // Platform admin without company - create minimal context
      req.tenantContext = {
        tenantId: 'platform_admin',
        subscriptionTier: 'enterprise',
        aiQueriesLimit: 999999,
        aiQueriesUsed: 0,
        features: {
          sales_queries: true,
          inventory_queries: true,
          patient_analytics: true
        }
      };
    }

    next();
  } catch (error) {
    logger.error({ err: error }, 'Tenant context error');
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
      logger.info({
        action,
        path: req.path,
        method: req.method,
      }, 'Tenant activity logged');

      next();
    } catch (error) {
      // Don't block request if logging fails
      logger.error({ err: error }, 'Activity logging failed');
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
    logger.error({ err: error }, 'Subscription check error');
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
