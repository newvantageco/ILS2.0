/**
 * Tenant Isolation Middleware
 *
 * Enforces company context for multi-tenant routes.
 * Ensures every request has a valid companyId from the authenticated user.
 *
 * Usage:
 *   router.get('/resource/:id',
 *     authenticateJWT,
 *     requireCompanyContext,  // Add this middleware
 *     async (req, res) => { ... }
 *   );
 *
 * Security:
 * - Blocks requests without valid company context
 * - Prevents cross-tenant data access
 * - Attaches companyId to request object for easy access
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Extended Request interface with company context
 */
export interface RequestWithCompany extends Request {
  companyId?: string;
  user?: {
    id: string;
    companyId?: string;
    role?: string;
    email?: string;
    [key: string]: any;
  };
}

/**
 * Middleware to enforce company context on all requests
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 *
 * @returns 403 Forbidden if companyId is missing, otherwise continues
 */
export function requireCompanyContext(
  req: RequestWithCompany,
  res: Response,
  next: NextFunction
): void | Response {
  // Extract companyId from authenticated user
  const companyId = req.user?.companyId;

  // Validate company context exists
  if (!companyId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Company context required. User must belong to a company.',
      code: 'MISSING_COMPANY_CONTEXT'
    });
  }

  // Attach companyId to request for easy access in route handlers
  req.companyId = companyId;

  // Log for audit trail (optional, can be disabled in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Tenant Isolation] Request to ${req.path} with companyId: ${companyId}`);
  }

  // Continue to next middleware
  next();
}

/**
 * Middleware variant that allows platform admins to bypass company isolation
 *
 * Use this ONLY for platform admin routes that need to see all company data
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
export function requireCompanyContextOrAdmin(
  req: RequestWithCompany,
  res: Response,
  next: NextFunction
): void | Response {
  const companyId = req.user?.companyId;
  const userRole = req.user?.role;

  // Platform admins can bypass company isolation
  if (userRole === 'platform_admin' || userRole === 'system_admin') {
    // No companyId required for admins
    req.companyId = undefined; // Explicitly mark as admin context
    return next();
  }

  // For regular users, require company context
  if (!companyId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Company context required',
      code: 'MISSING_COMPANY_CONTEXT'
    });
  }

  req.companyId = companyId;
  next();
}

/**
 * Utility function to verify resource ownership
 *
 * Call this in route handlers to ensure a resource belongs to the user's company
 *
 * @param resourceCompanyId - The companyId from the database resource
 * @param userCompanyId - The companyId from the authenticated user
 * @param res - Express response object
 * @returns true if ownership is valid, sends 404 response and returns false otherwise
 */
export function verifyResourceOwnership(
  resourceCompanyId: string | null | undefined,
  userCompanyId: string,
  res: Response
): boolean {
  if (resourceCompanyId !== userCompanyId) {
    // Return 404 instead of 403 to not reveal resource existence
    res.status(404).json({
      error: 'Not Found',
      message: 'Resource not found',
      code: 'RESOURCE_NOT_FOUND'
    });
    return false;
  }
  return true;
}

/**
 * Type guard to check if request has company context
 */
export function hasCompanyContext(req: Request): req is RequestWithCompany & { companyId: string } {
  return !!(req as RequestWithCompany).companyId;
}

// Export types for use in route handlers
export type { RequestWithCompany };
