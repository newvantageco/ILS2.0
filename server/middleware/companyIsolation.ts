/**
 * Company Isolation Middleware
 * Layer 3: Application-Level Guards (Defense-in-Depth)
 *
 * This middleware provides application-level access control that works alongside
 * PostgreSQL Row-Level Security (RLS). Together they form a Defense-in-Depth strategy:
 *
 * - Layer 1 (Database): PostgreSQL RLS policies enforce isolation at kernel level
 * - Layer 2 (Middleware): tenantContext.ts sets session variables for RLS
 * - Layer 3 (This layer): Application-level guards for explicit access control
 *
 * IMPORTANT: Even if this middleware has a bug, RLS at the database level
 * will still prevent data leakage. However, this layer provides:
 * - Clearer error messages for unauthorized access
 * - Request-level authorization logic
 * - Platform admin privilege validation
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { isPlatformAdmin, canAccessCompany, ROLES } from '../utils/rbac';
import logger from '../utils/logger';


export interface CompanyIsolatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
  userCompanyId?: string;
  isPlatformAdmin?: boolean;
}

/**
 * Middleware to enforce company isolation
 * Adds company context to request and validates access
 *
 * NOTE: This is Layer 3 (Application-Level). RLS at the database level (Layer 1)
 * provides the actual enforcement. This middleware provides:
 * - User context validation
 * - Clearer error messages
 * - Application-level access checks
 */
export const enforceCompanyIsolation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as any;
    const user = authReq.user;

    if (!user) {
      logger.warn('Company isolation: No authenticated user');
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'You must be logged in to access this resource'
      });
    }

    // Get user ID from different auth sources
    const userId = user.id || user.claims?.sub;

    if (!userId) {
      logger.warn('Company isolation: User ID not found in token');
      return res.status(401).json({
        error: 'User ID not found',
        message: 'Invalid authentication token'
      });
    }

    // Get user details from database
    // NOTE: This query is subject to RLS if the users table has it enabled
    const [userDetails] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
        isActive: users.isActive
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!userDetails) {
      logger.warn({ userId }, 'Company isolation: User not found in database');
      return res.status(404).json({
        error: 'User not found',
        message: 'Your user account does not exist or has been deleted'
      });
    }

    if (!userDetails.isActive) {
      logger.warn({ userId, email: userDetails.email }, 'Company isolation: Inactive user attempted access');
      return res.status(403).json({
        error: 'Account is not active',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Add company context to request
    authReq.userCompanyId = userDetails.companyId;
    authReq.isPlatformAdmin = isPlatformAdmin(userDetails.role as any);

    // Update user object with complete info
    authReq.user = {
      id: userDetails.id,
      email: userDetails.email,
      role: userDetails.role,
      companyId: userDetails.companyId || undefined
    };

    logger.debug({
      userId: userDetails.id,
      companyId: userDetails.companyId,
      role: userDetails.role,
      isPlatformAdmin: authReq.isPlatformAdmin
    }, 'Company isolation context set');

    next();
  } catch (error) {
    logger.error({ err: error }, 'Company isolation error');
    res.status(500).json({
      error: 'Authorization failed',
      message: 'An error occurred while validating your access'
    });
  }
};

/**
 * Middleware to validate company access for specific company ID in request
 * Use this after enforceCompanyIsolation
 */
export const validateCompanyAccess = (companyIdParam: string = 'companyId'): RequestHandler => {
  return ((req: Request, res: Response, next: NextFunction) => {
    const authReq = req as any;
    const userCompanyId = authReq.userCompanyId;
    const userRole = authReq.user?.role;
    
    // Get target company ID from params, query, or body
    const targetCompanyId = 
      req.params[companyIdParam] || 
      req.query[companyIdParam] || 
      (req.body as any)?.[companyIdParam];

    if (!targetCompanyId) {
      // If no target company specified, allow (will be filtered by query)
      return next();
    }

    // Platform admin can access any company
    if (authReq.isPlatformAdmin) {
      return next();
    }

    // Check if user can access this company
    if (!canAccessCompany(userRole, userCompanyId, targetCompanyId as string)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this company\'s data'
      });
    }

    next();
  }) as RequestHandler;
};

/**
 * Middleware to ensure user has a company
 */
export const requireCompany: RequestHandler = (req, res, next) => {
  const authReq = req as any;
  
  if (!authReq.userCompanyId && !authReq.isPlatformAdmin) {
    return res.status(403).json({
      error: 'Company required',
      message: 'You must be associated with a company to access this resource'
    });
  }

  next();
};

/**
 * Middleware to require platform admin role
 */
export const requirePlatformAdmin: RequestHandler = (req, res, next) => {
  const authReq = req as any;
  
  if (!authReq.isPlatformAdmin) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'This action requires platform administrator privileges'
    });
  }

  next();
};

/**
 * Middleware to require company admin or platform admin
 */
export const requireCompanyOrPlatformAdmin: RequestHandler = (req, res, next) => {
  const authReq = req as any;
  const userRole = authReq.user?.role;
  
  if (authReq.isPlatformAdmin) {
    return next();
  }

  if (userRole === ROLES.COMPANY_ADMIN || userRole === ROLES.ADMIN) {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied',
    message: 'This action requires administrator privileges'
  });
};

/**
 * Helper to filter query by company (for database queries)
 *
 * NOTE: With RLS enabled, this helper is OPTIONAL. The database will enforce
 * tenant isolation automatically. However, using this helper:
 * - Makes intent explicit in code (better readability)
 * - Provides application-level validation
 * - Works as Defense-in-Depth with RLS
 *
 * IMPORTANT: Even if you forget to use this helper, RLS will still protect data.
 * This is the key advantage of Defense-in-Depth architecture.
 */
export function getCompanyFilter(req: Request): { companyId: string } | Record<string, never> {
  const authReq = req as any;

  // Platform admin sees all companies (RLS bypass via session variable)
  if (authReq.isPlatformAdmin) {
    logger.debug('getCompanyFilter: Platform admin - returning no filter');
    return {};
  }

  // Others only see their company (RLS will enforce this at DB level too)
  if (authReq.userCompanyId) {
    logger.debug({ companyId: authReq.userCompanyId }, 'getCompanyFilter: Returning company filter');
    return { companyId: authReq.userCompanyId };
  }

  logger.debug('getCompanyFilter: No company context - returning empty filter');
  return {};
}

/**
 * Helper to validate and get company ID for operations
 *
 * NOTE: With RLS enabled, even if this function returns the wrong company ID,
 * the database will block unauthorized access. This provides Defense-in-Depth.
 */
export function getValidCompanyId(req: Request, targetCompanyId?: string): string | null {
  const authReq = req as any;

  // Platform admin can use any company ID (RLS will allow via role bypass)
  if (authReq.isPlatformAdmin) {
    logger.debug({ targetCompanyId }, 'getValidCompanyId: Platform admin - allowing target company');
    return targetCompanyId || null;
  }

  // Others must use their own company ID (RLS will enforce this too)
  if (authReq.userCompanyId) {
    if (targetCompanyId && targetCompanyId !== authReq.userCompanyId) {
      logger.warn({
        userCompanyId: authReq.userCompanyId,
        targetCompanyId
      }, 'getValidCompanyId: Attempted access to different company (would be blocked by RLS)');
    }
    return authReq.userCompanyId;
  }

  logger.debug('getValidCompanyId: No company context - returning null');
  return null;
}

/**
 * Audit helper to log when RLS is expected to block a query
 * Use this during development to verify RLS is working correctly
 */
export function auditRLSProtection(
  req: Request,
  tableName: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
) {
  const authReq = req as any;

  logger.info({
    userId: authReq.user?.id,
    companyId: authReq.userCompanyId,
    isPlatformAdmin: authReq.isPlatformAdmin,
    tableName,
    operation
  }, 'RLS Protection Active - Database will enforce tenant isolation');
}

/**
 * Development helper to temporarily bypass RLS (DANGEROUS - use only for debugging)
 * This should NEVER be used in production code
 *
 * @deprecated DO NOT USE IN PRODUCTION
 */
export function UNSAFE_bypassRLS() {
  logger.error('UNSAFE_bypassRLS called - This should NEVER happen in production!');
  throw new Error('RLS bypass is disabled. Modify database policies if platform admin access is needed.');
}
