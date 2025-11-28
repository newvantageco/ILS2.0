/**
 * Secure Route Middleware
 *
 * Combines JWT authentication and tenant context setting for secure API routes.
 * This ensures that:
 * 1. User is authenticated via JWT
 * 2. PostgreSQL session variables are set for Row-Level Security (RLS)
 * 3. Tenant isolation is enforced at the database level
 *
 * Usage:
 * ```typescript
 * import { secureRoute } from '../middleware/secureRoute';
 *
 * // Basic authentication + tenant context
 * app.use('/api/patients', secureRoute(), patientsRouter);
 *
 * // With role requirement
 * app.use('/api/admin', secureRoute(['company_admin', 'platform_admin']), adminRouter);
 * ```
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { authenticateJWT } from './auth-jwt';
import { setTenantContext } from './tenantContext';
import { requireRole } from './auth-jwt';

/**
 * Combine JWT authentication + tenant context in single middleware
 *
 * This is the recommended way to protect routes. It ensures:
 * - JWT token is verified
 * - User info is attached to req.user
 * - PostgreSQL session variables are set for RLS
 * - Database queries are automatically scoped to the user's company
 *
 * @param roles - Optional array of roles that are allowed to access the route
 * @returns Combined middleware function
 */
export function secureRoute(roles?: string[]): RequestHandler[] {
  const middleware: RequestHandler[] = [
    authenticateJWT,     // Step 1: Verify JWT and attach user
    setTenantContext,    // Step 2: Set PostgreSQL session variables for RLS
  ];

  // Add role check if roles are specified
  if (roles && roles.length > 0) {
    middleware.push(requireRole(roles));
  }

  return middleware;
}

/**
 * Secure route for company admins and platform admins only
 */
export function secureAdminRoute(): RequestHandler[] {
  return secureRoute(['company_admin', 'platform_admin']);
}

/**
 * Secure route for platform admins only
 */
export function securePlatformAdminRoute(): RequestHandler[] {
  return secureRoute(['platform_admin']);
}

/**
 * Secure route for ECPs
 */
export function secureECPRoute(): RequestHandler[] {
  return secureRoute(['ecp', 'company_admin', 'platform_admin']);
}

/**
 * Secure route for lab technicians
 */
export function secureLabRoute(): RequestHandler[] {
  return secureRoute(['lab_tech', 'company_admin', 'platform_admin']);
}

/**
 * Middleware to ensure user has a company association
 */
export function requireCompany(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.companyId) {
    res.status(403).json({
      error: 'Company required',
      message: 'You must be associated with a company to access this resource'
    });
    return;
  }
  next();
}

/**
 * Secure route that requires company association
 */
export function secureRouteWithCompany(roles?: string[]): RequestHandler[] {
  return [...secureRoute(roles), requireCompany];
}

/**
 * Helper to check if user is platform admin
 */
export function isPlatformAdmin(req: Request): boolean {
  return req.user?.role === 'platform_admin';
}

/**
 * Helper to check if user is company admin or platform admin
 */
export function isAdmin(req: Request): boolean {
  return req.user?.role === 'company_admin' || req.user?.role === 'platform_admin';
}

export default secureRoute;
