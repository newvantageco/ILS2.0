/**
 * Dynamic Permission Middleware
 * 
 * Simplified permission checking using cached session permissions
 * NO MORE ACTIVE ROLE SWITCHING!
 */

import { Request, Response, NextFunction } from 'express';
import { DynamicPermissionService } from '../services/DynamicPermissionService';
import logger from '../utils/logger';


/**
 * Extended request with user and permissions
 * This is now just a type alias for the standard Express Request
 */
export type AuthRequest = Request;

/**
 * Middleware: Check if user has a specific permission
 * Usage: requirePermission('orders:create')
 * 
 * This is now BLAZING fast because permissions are cached in session!
 */
export function requirePermission(permissionSlug: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'You must be logged in'
        });
      }

      // Check cached permissions first (from session)
      if (req.user?.permissions?.includes(permissionSlug)) {
        return next();
      }

      // Fallback: query database if not cached
      const hasAccess = await DynamicPermissionService.hasPermission(
        userId,
        permissionSlug
      );

      if (!hasAccess) {
        // Get permission details for helpful error message
        const permDetails = await DynamicPermissionService.getPermissionDetails(
          permissionSlug
        );

        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have permission to ${permDetails?.name || 'perform this action'}`,
          requiredPermission: permissionSlug,
          upgradePlan: permDetails?.planLevel !== 'free' ? permDetails?.planLevel : undefined
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify permissions'
      });
    }
  };
}

/**
 * Middleware: Check if user has ALL of the specified permissions
 * Usage: requireAllPermissions(['orders:create', 'patients:view'])
 */
export function requireAllPermissions(permissionSlugs: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'You must be logged in'
        });
      }

      // Check cached permissions
      const cachedPermissions = req.user?.permissions || [];
      const hasAll = permissionSlugs.every(slug => cachedPermissions.includes(slug));

      if (hasAll) {
        return next();
      }

      // Fallback: database check
      const hasAccess = await DynamicPermissionService.hasAllPermissions(
        userId,
        permissionSlugs
      );

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You don\'t have all required permissions',
          requiredPermissions: permissionSlugs
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({ error: 'Failed to verify permissions' });
    }
  };
}

/**
 * Middleware: Check if user has ANY of the specified permissions
 * Usage: requireAnyPermission(['orders:create', 'orders:edit'])
 */
export function requireAnyPermission(permissionSlugs: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'You must be logged in'
        });
      }

      // Check cached permissions
      const cachedPermissions = req.user?.permissions || [];
      const hasAny = permissionSlugs.some(slug => cachedPermissions.includes(slug));

      if (hasAny) {
        return next();
      }

      // Fallback: database check
      const hasAccess = await DynamicPermissionService.hasAnyPermission(
        userId,
        permissionSlugs
      );

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You don\'t have any of the required permissions',
          requiredPermissions: permissionSlugs
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({ error: 'Failed to verify permissions' });
    }
  };
}

/**
 * Middleware: Require user to be company owner
 */
export function requireOwner() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in'
      });
    }

    if (!req.user.isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only company owners can perform this action'
      });
    }

    next();
  };
}

/**
 * Middleware: Attach permissions to request (non-blocking)
 * This loads permissions from cache or database and adds them to req.user
 * Use this early in your middleware chain after authentication
 */
export async function attachPermissions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(); // Not authenticated, skip
    }

    // Try to get from session cache first
    const session = (req as any).session;
    const cachedData = session?.cached_permissions;

    if (cachedData && cachedData.permissions && req.user) {
      // Use cached permissions
      req.user.permissions = cachedData.permissions;
      req.user.rolePermissions = cachedData.rolePermissions;
      req.user.roles = cachedData.roles;
      req.user.isOwner = cachedData.isOwner;
      req.user.subscriptionPlan = cachedData.subscriptionPlan;
    } else if (req.user) {
      // Fetch from database and cache
      const userPerms = await DynamicPermissionService.getUserPermissions(userId);
      
      req.user.permissions = userPerms.sessionPermissions;
      req.user.rolePermissions = userPerms.rolePermissions;
      req.user.roles = userPerms.roles;
      req.user.isOwner = userPerms.isOwner;
      req.user.subscriptionPlan = userPerms.subscriptionPlan;

      // Cache in session
      if (session) {
        await DynamicPermissionService.cachePermissionsInSession(
          session.id,
          userId
        );
      }
    }

    next();
  } catch (error) {
    logger.error('Error attaching permissions:', error);
    // Don't block the request
    next();
  }
}

/**
 * Helper: Check permission from request object (synchronous)
 * Use this inside route handlers for conditional logic
 */
export function hasPermissionSync(req: Request, permissionSlug: string): boolean {
  return req.user?.permissions?.includes(permissionSlug) || false;
}

/**
 * Helper: Check if feature is locked (in role but not in session)
 * This powers the smart upsell UI
 */
export function isFeatureLocked(req: Request, permissionSlug: string): boolean {
  const rolePermissions = req.user?.rolePermissions || [];
  const sessionPermissions = req.user?.permissions || [];
  
  return rolePermissions.includes(permissionSlug) && 
         !sessionPermissions.includes(permissionSlug);
}

/**
 * MIGRATION HELPER: Map old role-based checks to new permission checks
 * This helps you gradually migrate from requireRole() to requirePermission()
 */
export function requireRole(roles: string[]) {
  logger.warn('⚠️  requireRole() is deprecated. Migrate to requirePermission()');
  
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles?.map(r => r.name.toLowerCase()) || [];
    
    // Check if user has any of the specified roles
    const hasRole = roles.some(role => 
      userRoles.includes(role.toLowerCase())
    );

    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

export default {
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwner,
  attachPermissions,
  hasPermissionSync,
  isFeatureLocked,
  requireRole // Deprecated
};
