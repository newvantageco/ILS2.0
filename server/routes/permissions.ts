import type { Express, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { requireOwner, requirePermission } from "../middleware/permissions";
import { PermissionService } from "../services/PermissionService";
import { storage } from "../storage";
import { z } from "zod";

const updateRolePermissionsSchema = z.object({
  role: z.string(),
  permissionKeys: z.array(z.string()),
});

const grantPermissionSchema = z.object({
  userId: z.string(),
  permissionKey: z.string(),
});

const revokePermissionSchema = z.object({
  userId: z.string(),
  permissionKey: z.string(),
});

export function registerPermissionRoutes(app: Express) {
  /**
   * GET /api/permissions
   * Get all permissions grouped by category
   */
  app.get("/api/permissions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const permissions = await PermissionService.getAllPermissionsByCategory();

      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      console.error("Error getting permissions:", error);
      res.status(500).json({
        error: "Failed to get permissions",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/permissions/user/:userId
   * Get all permissions for a specific user
   */
  app.get("/api/permissions/user/:userId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id || req.user?.claims?.sub;

      // Users can only view their own permissions unless they're owner
      if (userId !== currentUserId) {
        const isOwner = await PermissionService.hasPermission(currentUserId, 'company.manage_permissions');
        if (!isOwner) {
          return res.status(403).json({
            error: "Forbidden",
            message: "You can only view your own permissions",
          });
        }
      }

      const permissions = await PermissionService.getUserPermissions(userId);

      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      console.error("Error getting user permissions:", error);
      res.status(500).json({
        error: "Failed to get user permissions",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/permissions/role/:companyId/:role
   * Get permissions for a specific role in a company
   */
  app.get("/api/permissions/role/:companyId/:role", isAuthenticated, requireOwner(), async (req: any, res: Response) => {
    try {
      const { companyId, role } = req.params;
      const currentUserId = req.user?.id || req.user?.claims?.sub;
      const currentUser = await storage.getUser(currentUserId);

      // Verify user belongs to the company
      if (currentUser?.companyId !== companyId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only manage permissions for your own company",
        });
      }

      const permissions = await PermissionService.getRolePermissions(companyId, role);

      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      console.error("Error getting role permissions:", error);
      res.status(500).json({
        error: "Failed to get role permissions",
        message: error.message,
      });
    }
  });

  /**
   * PUT /api/permissions/role/:companyId
   * Update role permissions for a company (owner only)
   * 
   * Body: {
   *   role: string,
   *   permissionKeys: string[]
   * }
   */
  app.put("/api/permissions/role/:companyId", isAuthenticated, requireOwner(), async (req: any, res: Response) => {
    try {
      const { companyId } = req.params;
      const currentUserId = req.user?.id || req.user?.claims?.sub;
      const currentUser = await storage.getUser(currentUserId);

      // Verify user belongs to the company
      if (currentUser?.companyId !== companyId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only manage permissions for your own company",
        });
      }

      const validation = updateRolePermissionsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { role, permissionKeys } = validation.data;

      const success = await PermissionService.updateRolePermissions(
        companyId,
        role,
        permissionKeys
      );

      if (!success) {
        return res.status(500).json({
          error: "Failed to update role permissions",
        });
      }

      res.status(200).json({
        success: true,
        message: `Updated permissions for ${role}`,
      });
    } catch (error: any) {
      console.error("Error updating role permissions:", error);
      res.status(500).json({
        error: "Failed to update role permissions",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/permissions/grant
   * Grant a custom permission to a user (owner only)
   * 
   * Body: {
   *   userId: string,
   *   permissionKey: string
   * }
   */
  app.post("/api/permissions/grant", isAuthenticated, requireOwner(), async (req: any, res: Response) => {
    try {
      const currentUserId = req.user?.id || req.user?.claims?.sub;

      const validation = grantPermissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { userId, permissionKey } = validation.data;

      const success = await PermissionService.grantCustomPermission(
        userId,
        permissionKey,
        currentUserId
      );

      if (!success) {
        return res.status(500).json({
          error: "Failed to grant permission",
        });
      }

      res.status(200).json({
        success: true,
        message: `Granted ${permissionKey} to user`,
      });
    } catch (error: any) {
      console.error("Error granting permission:", error);
      res.status(500).json({
        error: "Failed to grant permission",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/permissions/revoke
   * Revoke a custom permission from a user (owner only)
   * 
   * Body: {
   *   userId: string,
   *   permissionKey: string
   * }
   */
  app.post("/api/permissions/revoke", isAuthenticated, requireOwner(), async (req: any, res: Response) => {
    try {
      const currentUserId = req.user?.id || req.user?.claims?.sub;

      const validation = revokePermissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { userId, permissionKey } = validation.data;

      const success = await PermissionService.revokeCustomPermission(
        userId,
        permissionKey,
        currentUserId
      );

      if (!success) {
        return res.status(500).json({
          error: "Failed to revoke permission",
        });
      }

      res.status(200).json({
        success: true,
        message: `Revoked ${permissionKey} from user`,
      });
    } catch (error: any) {
      console.error("Error revoking permission:", error);
      res.status(500).json({
        error: "Failed to revoke permission",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/permissions/me
   * Get current user's permissions
   */
  app.get("/api/permissions/me", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const permissions = await PermissionService.getUserPermissions(userId);

      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      console.error("Error getting current user permissions:", error);
      res.status(500).json({
        error: "Failed to get permissions",
        message: error.message,
      });
    }
  });
}
