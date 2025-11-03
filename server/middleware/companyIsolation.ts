/**
 * Company Isolation Middleware
 * 
 * Ensures users can only access data from their own company
 * (except platform admins who can access all companies)
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { isPlatformAdmin, canAccessCompany, ROLES } from '../utils/rbac';

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
 */
export const enforceCompanyIsolation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as any;
    const user = authReq.user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user ID from different auth sources
    const userId = user.id || user.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Get user details from database
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
      return res.status(404).json({ error: 'User not found' });
    }

    if (!userDetails.isActive) {
      return res.status(403).json({ error: 'Account is not active' });
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

    next();
  } catch (error) {
    console.error('Company isolation error:', error);
    res.status(500).json({ error: 'Authorization failed' });
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
 */
export function getCompanyFilter(req: Request): { companyId: string } | Record<string, never> {
  const authReq = req as any;
  
  // Platform admin sees all companies
  if (authReq.isPlatformAdmin) {
    return {};
  }

  // Others only see their company
  if (authReq.userCompanyId) {
    return { companyId: authReq.userCompanyId };
  }

  return {};
}

/**
 * Helper to validate and get company ID for operations
 */
export function getValidCompanyId(req: Request, targetCompanyId?: string): string | null {
  const authReq = req as any;
  
  // Platform admin can use any company ID
  if (authReq.isPlatformAdmin) {
    return targetCompanyId || null;
  }

  // Others must use their own company ID
  return authReq.userCompanyId || null;
}
