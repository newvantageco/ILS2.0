import { db } from "../../db";
import { 
  permissions, 
  rolePermissions, 
  userCustomPermissions, 
  users,
  type Permission,
  type UserCustomPermission 
} from "../../shared/schema";
import { eq, and, or } from "drizzle-orm";
import logger from '../utils/logger';


export class PermissionService {
  /**
   * Check if a user has a specific permission
   * Priority: User custom permissions > Role permissions
   */
  static async hasPermission(
    userId: string, 
    permissionKey: string
  ): Promise<boolean> {
    try {
      // Get user details
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.enhancedRole) {
        return false;
      }

      // Owner always has all permissions
      if (user.enhancedRole === 'owner') {
        return true;
      }

      // Get the permission
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.permissionKey, permissionKey),
      });

      if (!permission) {
        logger.warn(`Permission not found: ${permissionKey}`);
        return false;
      }

      // Check user custom permissions first (overrides)
      const customPermission = await db.query.userCustomPermissions.findFirst({
        where: and(
          eq(userCustomPermissions.userId, userId),
          eq(userCustomPermissions.permissionId, permission.id)
        ),
      });

      if (customPermission) {
        return customPermission.granted;
      }

      // Check role permissions
      if (user.companyId) {
        const rolePermission = await db.query.rolePermissions.findFirst({
          where: and(
            eq(rolePermissions.companyId, user.companyId),
            eq(rolePermissions.role, user.enhancedRole),
            eq(rolePermissions.permissionId, permission.id)
          ),
        });

        return !!rolePermission;
      }

      return false;
    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check multiple permissions at once (returns all results)
   */
  static async hasPermissions(
    userId: string,
    permissionKeys: string[]
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      permissionKeys.map(async (key) => {
        results[key] = await this.hasPermission(userId, key);
      })
    );

    return results;
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  static async hasAnyPermission(
    userId: string,
    permissionKeys: string[]
  ): Promise<boolean> {
    const results = await this.hasPermissions(userId, permissionKeys);
    return Object.values(results).some(hasPermission => hasPermission);
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissionKeys: string[]
  ): Promise<boolean> {
    const results = await this.hasPermissions(userId, permissionKeys);
    return Object.values(results).every(hasPermission => hasPermission);
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.enhancedRole) {
        return [];
      }

      // Owner has all permissions
      if (user.enhancedRole === 'owner') {
        const allPermissions = await db.query.permissions.findMany();
        return allPermissions.map(p => p.permissionKey);
      }

      // Get role permissions
      let permissionIds: string[] = [];
      if (user.companyId) {
        const rolePerms = await db.query.rolePermissions.findMany({
          where: and(
            eq(rolePermissions.companyId, user.companyId),
            eq(rolePermissions.role, user.enhancedRole)
          ),
        });
        permissionIds = rolePerms.map(rp => rp.permissionId);
      }

      // Get custom permissions (overrides)
      const customPerms = await db.query.userCustomPermissions.findMany({
        where: eq(userCustomPermissions.userId, userId),
      });

      // Apply custom permission overrides
      const customGranted = customPerms
        .filter(cp => cp.granted)
        .map(cp => cp.permissionId);
      
      const customRevoked = new Set(
        customPerms
          .filter(cp => !cp.granted)
          .map(cp => cp.permissionId)
      );

      // Combine: role permissions + custom granted - custom revoked
      const finalPermissionIds = [
        ...permissionIds.filter(id => !customRevoked.has(id)),
        ...customGranted
      ];

      // Get permission keys
      const perms = await db.query.permissions.findMany({
        where: or(...finalPermissionIds.map(id => eq(permissions.id, id))),
      });

      return perms.map(p => p.permissionKey);
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Grant a custom permission to a user (override role permissions)
   */
  static async grantCustomPermission(
    userId: string,
    permissionKey: string,
    grantedBy: string
  ): Promise<boolean> {
    try {
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.permissionKey, permissionKey),
      });

      if (!permission) {
        throw new Error(`Permission not found: ${permissionKey}`);
      }

      // Check if custom permission already exists
      const existing = await db.query.userCustomPermissions.findFirst({
        where: and(
          eq(userCustomPermissions.userId, userId),
          eq(userCustomPermissions.permissionId, permission.id)
        ),
      });

      if (existing) {
        // Update existing
        await db
          .update(userCustomPermissions)
          .set({ granted: true, createdAt: new Date(), createdBy: grantedBy })
          .where(eq(userCustomPermissions.id, existing.id));
      } else {
        // Insert new
        await db.insert(userCustomPermissions).values({
          userId,
          permissionId: permission.id,
          granted: true,
          createdBy: grantedBy,
        });
      }

      return true;
    } catch (error) {
      logger.error('Error granting custom permission:', error);
      return false;
    }
  }

  /**
   * Revoke a custom permission from a user
   */
  static async revokeCustomPermission(
    userId: string,
    permissionKey: string,
    revokedBy: string
  ): Promise<boolean> {
    try {
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.permissionKey, permissionKey),
      });

      if (!permission) {
        throw new Error(`Permission not found: ${permissionKey}`);
      }

      // Check if custom permission exists
      const existing = await db.query.userCustomPermissions.findFirst({
        where: and(
          eq(userCustomPermissions.userId, userId),
          eq(userCustomPermissions.permissionId, permission.id)
        ),
      });

      if (existing) {
        // Update to revoked
        await db
          .update(userCustomPermissions)
          .set({ granted: false, createdAt: new Date(), createdBy: revokedBy })
          .where(eq(userCustomPermissions.id, existing.id));
      } else {
        // Insert as revoked (explicitly deny)
        await db.insert(userCustomPermissions).values({
          userId,
          permissionId: permission.id,
          granted: false,
          createdBy: revokedBy,
        });
      }

      return true;
    } catch (error) {
      logger.error('Error revoking custom permission:', error);
      return false;
    }
  }

  /**
   * Update role permissions for a company
   */
  static async updateRolePermissions(
    companyId: string,
    role: string,
    permissionKeys: string[]
  ): Promise<boolean> {
    try {
      // Delete existing role permissions
      await db
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.companyId, companyId),
            eq(rolePermissions.role, role as any)
          )
        );

      // Get permission IDs
      const perms = await db.query.permissions.findMany({
        where: or(...permissionKeys.map(key => eq(permissions.permissionKey, key))),
      });

      // Insert new role permissions
      const values = perms.map(p => ({
        companyId,
        role: role as any,
        permissionId: p.id,
      }));

      if (values.length > 0) {
        await db.insert(rolePermissions).values(values);
      }

      return true;
    } catch (error) {
      logger.error('Error updating role permissions:', error);
      return false;
    }
  }

  /**
   * Get all permissions grouped by category
   */
  static async getAllPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    try {
      const allPermissions = await db.query.permissions.findMany();
      
      const grouped: Record<string, Permission[]> = {};
      for (const permission of allPermissions) {
        if (!grouped[permission.category]) {
          grouped[permission.category] = [];
        }
        grouped[permission.category].push(permission);
      }

      return grouped;
    } catch (error) {
      logger.error('Error getting permissions by category:', error);
      return {};
    }
  }

  /**
   * Get role permissions for a company
   */
  static async getRolePermissions(
    companyId: string,
    role: string
  ): Promise<string[]> {
    try {
      const rolePerms = await db.query.rolePermissions.findMany({
        where: and(
          eq(rolePermissions.companyId, companyId),
          eq(rolePermissions.role, role as any)
        ),
      });

      const permissionIds = rolePerms.map(rp => rp.permissionId);
      const perms = await db.query.permissions.findMany({
        where: or(...permissionIds.map(id => eq(permissions.id, id))),
      });

      return perms.map(p => p.permissionKey);
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      return [];
    }
  }
}
