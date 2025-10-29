import type { Request, Response, NextFunction } from "express";

/**
 * Middleware to ensure user belongs to a company
 * Attaches companyId to the request object for multi-tenant data isolation
 */
export function requireCompany(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }

  const companyId = req.user.companyId || req.user.company_id;
  
  if (!companyId) {
    return res.status(403).json({ 
      error: "Company required",
      message: "User must belong to a company to access this resource"
    });
  }

  // Attach companyId to request for easy access
  req.companyId = companyId;
  next();
}

/**
 * Middleware to check if user is admin (bypass company restrictions)
 */
export function isAdmin(req: any): boolean {
  return req.user && req.user.role === 'admin';
}

/**
 * Get companyId from request, or null for admin users
 */
export function getCompanyIdFromRequest(req: any): string | null {
  if (isAdmin(req)) {
    return null; // Admin can see all data
  }
  return req.companyId || req.user?.companyId || req.user?.company_id || null;
}

/**
 * Validate that resource belongs to user's company
 */
export function validateCompanyAccess(
  userCompanyId: string | null,
  resourceCompanyId: string
): boolean {
  // Admin can access everything
  if (!userCompanyId) return true;
  
  // Check company match
  return userCompanyId === resourceCompanyId;
}
