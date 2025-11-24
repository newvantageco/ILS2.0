/**
 * Dynamic Permission Service
 * 
 * Handles the "sum of permissions" logic for users with multiple roles
 * This replaces the old "active role" switching system
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface UserPermissions {
  userId: string;
  companyId: string;
  isOwner: boolean;
  
  // The final, effective permissions (filtered by plan)
  sessionPermissions: string[];
  
  // All permissions from roles (before plan filtering)
  rolePermissions: string[];
  
  // User's assigned roles
  roles: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
  
  // Company's subscription plan
  subscriptionPlan: 'free' | 'full' | 'add_on_analytics' | 'enterprise';
}

/**
 * Get all effective permissions for a user
 * This is the CORE function called during login
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  try {
    // Step 1: Get user and company info
    const userResult = await db.execute(sql`
      SELECT 
        u.id,
        u.company_id,
        u.is_owner,
        c.subscription_plan
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.id = ${userId}
    `);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const isOwner = user.is_owner as boolean;
    const subscriptionPlan = (user.subscription_plan as string) || 'free';

    // Step 2: If user is owner, they get ALL permissions
    if (isOwner) {
      const allPermsResult = await db.execute(sql`
        SELECT ARRAY_AGG(DISTINCT permission_key) as permissions
        FROM permissions
      `);

      const allPermissions = (allPermsResult.rows[0]?.permissions as string[]) || [];

      return {
        userId: user.id as string,
        companyId: user.company_id as string,
        isOwner: true,
        sessionPermissions: allPermissions,
        rolePermissions: allPermissions,
        roles: [{ id: 'owner', name: 'Owner', isPrimary: true }],
        subscriptionPlan: subscriptionPlan as any
      };
    }

    // Step 3: Get user's assigned roles
    const rolesResult = await db.execute(sql`
      SELECT 
        dr.id,
        dr.name,
        udr.is_primary
      FROM user_dynamic_roles udr
      JOIN dynamic_roles dr ON dr.id = udr.role_id
      WHERE udr.user_id = ${userId}
      ORDER BY udr.is_primary DESC, dr.name ASC
    `);

    const roles = rolesResult.rows.map(r => ({
      id: r.id as string,
      name: r.name as string,
      isPrimary: r.is_primary as boolean
    }));

    // Step 4: Get ALL permissions from ALL roles (union of all role permissions)
    const rolePermsResult = await db.execute(sql`
      SELECT ARRAY_AGG(DISTINCT p.permission_key) as permissions
      FROM user_dynamic_roles udr
      JOIN dynamic_role_permissions drp ON drp.role_id = udr.role_id
      JOIN permissions p ON p.id = drp.permission_id
      WHERE udr.user_id = ${userId}
    `);

    const rolePermissions = (rolePermsResult.rows[0]?.permissions as string[]) || [];

    // Step 5: Filter permissions by subscription plan
    const sessionPermissions = await filterPermissionsByPlan(
      rolePermissions,
      subscriptionPlan as any
    );

    return {
      userId: user.id as string,
      companyId: user.company_id as string,
      isOwner: false,
      sessionPermissions,
      rolePermissions,
      roles,
      subscriptionPlan: subscriptionPlan as any
    };

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    throw error;
  }
}

/**
 * Filter permissions based on subscription plan
 * This is where the "feature gating" happens!
 */
async function filterPermissionsByPlan(
  permissionSlugs: string[],
  plan: 'free' | 'full' | 'add_on_analytics' | 'enterprise'
): Promise<string[]> {
  if (permissionSlugs.length === 0) {
    return [];
  }

  // Map plan to allowed plan levels
  const allowedPlanLevels: string[] = [];
  
  if (plan === 'free') {
    allowedPlanLevels.push('free');
  } else if (plan === 'full') {
    allowedPlanLevels.push('free', 'full');
  } else if (plan === 'add_on_analytics') {
    allowedPlanLevels.push('free', 'full', 'add_on_analytics');
  } else if (plan === 'enterprise') {
    allowedPlanLevels.push('free', 'full', 'add_on_analytics', 'enterprise');
  }

  // Query to get only permissions that match the user's plan
  const filterResult = await db.execute(sql`
    SELECT permission_key
    FROM permissions
    WHERE permission_key = ANY(${permissionSlugs})
    AND plan_level = ANY(${allowedPlanLevels})
  `);

  return filterResult.rows.map(r => r.permission_key as string);
}

/**
 * Check if user has a specific permission
 * This is the new, simple permission check
 */
export async function hasPermission(
  userId: string,
  permissionSlug: string
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.sessionPermissions.includes(permissionSlug);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissionSlugs: string[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissionSlugs.every(slug => 
      permissions.sessionPermissions.includes(slug)
    );
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissionSlugs: string[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissionSlugs.some(slug => 
      permissions.sessionPermissions.includes(slug)
    );
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Cache permissions in session
 * Called during login to avoid database queries on every request
 */
export async function cachePermissionsInSession(
  sessionId: string,
  userId: string
): Promise<void> {
  try {
    const permissions = await getUserPermissions(userId);
    
    await db.execute(sql`
      UPDATE sessions
      SET cached_permissions = ${JSON.stringify({
        permissions: permissions.sessionPermissions,
        rolePermissions: permissions.rolePermissions,
        roles: permissions.roles,
        isOwner: permissions.isOwner,
        subscriptionPlan: permissions.subscriptionPlan,
        cachedAt: new Date().toISOString()
      })}
      WHERE sid = ${sessionId}
    `);
  } catch (error) {
    console.error('Error caching permissions:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Invalidate permission cache (call when roles or permissions change)
 */
export async function invalidatePermissionCache(userId: string): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE sessions
      SET cached_permissions = NULL
      WHERE user_id = ${userId}
    `);
  } catch (error) {
    console.error('Error invalidating permission cache:', error);
  }
}

/**
 * Get "locked" permissions - permissions user would have but are blocked by plan
 * This powers the smart upsell UI!
 */
export async function getLockedPermissions(userId: string): Promise<string[]> {
  try {
    const permissions = await getUserPermissions(userId);
    
    // Return permissions that are in rolePermissions but NOT in sessionPermissions
    return permissions.rolePermissions.filter(
      perm => !permissions.sessionPermissions.includes(perm)
    );
  } catch (error) {
    console.error('Error getting locked permissions:', error);
    return [];
  }
}

/**
 * Get permission details (for showing upgrade messages)
 */
export async function getPermissionDetails(permissionSlug: string): Promise<{
  name: string;
  description: string;
  planLevel: string;
  category: string;
} | null> {
  try {
    const result = await db.execute(sql`
      SELECT 
        p.permission_name as name,
        p.description,
        p.plan_level,
        pc.name as category
      FROM permissions p
      LEFT JOIN permission_categories pc ON pc.id = p.category_id
      WHERE p.permission_key = ${permissionSlug}
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      name: row.name as string,
      description: row.description as string,
      planLevel: row.plan_level as string,
      category: row.category as string
    };
  } catch (error) {
    console.error('Error getting permission details:', error);
    return null;
  }
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  isPrimary: boolean = false,
  assignedBy?: string
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO user_dynamic_roles (user_id, role_id, is_primary, assigned_by)
      VALUES (${userId}, ${roleId}, ${isPrimary}, ${assignedBy})
      ON CONFLICT (user_id, role_id) DO UPDATE
      SET is_primary = EXCLUDED.is_primary
    `);

    // Invalidate cache
    await invalidatePermissionCache(userId);

    // Audit log
    await db.execute(sql`
      INSERT INTO role_change_audit (
        company_id,
        changed_by,
        action_type,
        role_id,
        affected_user_id,
        details
      )
      SELECT 
        u.company_id,
        ${assignedBy},
        'user_role_assigned',
        ${roleId},
        ${userId},
        ${JSON.stringify({ isPrimary })}
      FROM users u
      WHERE u.id = ${userId}
    `);
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string,
  removedBy?: string
): Promise<void> {
  try {
    await db.execute(sql`
      DELETE FROM user_dynamic_roles
      WHERE user_id = ${userId} AND role_id = ${roleId}
    `);

    // Invalidate cache
    await invalidatePermissionCache(userId);

    // Audit log
    await db.execute(sql`
      INSERT INTO role_change_audit (
        company_id,
        changed_by,
        action_type,
        role_id,
        affected_user_id
      )
      SELECT 
        u.company_id,
        ${removedBy},
        'user_role_removed',
        ${roleId},
        ${userId}
      FROM users u
      WHERE u.id = ${userId}
    `);
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
}

/**
 * Export all functions
 */
export const DynamicPermissionService = {
  getUserPermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  cachePermissionsInSession,
  invalidatePermissionCache,
  getLockedPermissions,
  getPermissionDetails,
  assignRoleToUser,
  removeRoleFromUser
};
