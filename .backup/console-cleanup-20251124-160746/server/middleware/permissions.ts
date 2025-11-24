import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/PermissionService';

/**
 * Middleware to require specific permission(s)
 * Usage: requirePermission('patients.view')
 * or requirePermission(['patients.view', 'patients.edit'])
 */
export function requirePermission(
  permissionKeys: string | string[]
) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource'
        });
      }

      const keys = Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys];
      const hasPermission = await PermissionService.hasAllPermissions(userId, keys);

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
          requiredPermissions: keys
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to check permissions'
      });
    }
  };
}

/**
 * Middleware to require ANY of the specified permissions
 * Usage: requireAnyPermission(['patients.view', 'patients.edit'])
 */
export function requireAnyPermission(permissionKeys: string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource'
        });
      }

      const hasPermission = await PermissionService.hasAnyPermission(userId, permissionKeys);

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
          requiredPermissions: permissionKeys
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to check permissions'
      });
    }
  };
}

/**
 * Middleware to require owner role
 */
export function requireOwner() {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource'
        });
      }

      // Owner always has permission (checked in PermissionService)
      // We can verify by checking if they have a permission that only owners should have
      const hasPermission = await PermissionService.hasPermission(userId, 'company.manage_permissions');

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only company owners can access this resource'
        });
      }

      next();
    } catch (error) {
      console.error('Owner check error:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to verify owner status'
      });
    }
  };
}

/**
 * Add user permissions to request object (doesn't block, just adds info)
 */
export async function attachPermissions(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (userId) {
      const permissions = await PermissionService.getUserPermissions(userId);
      req.userPermissions = permissions;
    }

    next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    next(); // Don't block the request
  }
}
