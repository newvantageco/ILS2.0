/**
 * Dynamic Roles & Permissions API Routes
 * 
 * The "world-class" UI backend for managing roles and permissions
 */

import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { requirePermission, requireOwner, AuthRequest } from '../middleware/dynamicPermissions';
import { DynamicPermissionService } from '../services/DynamicPermissionService';
import { cloneRole } from '../services/DefaultRolesService';

const router = Router();

// =====================================================
// ROLES MANAGEMENT
// =====================================================

/**
 * GET /api/roles
 * Get all roles for the company
 */
router.get('/', requirePermission('users:view'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const companyId = authReq.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found' });
    }

    const rolesResult = await db.execute(sql`
      SELECT 
        dr.id,
        dr.name,
        dr.description,
        dr.is_system_default,
        dr.is_deletable,
        dr.created_at,
        dr.updated_at,
        COUNT(udr.user_id) as user_count,
        COUNT(drp.permission_id) as permission_count
      FROM dynamic_roles dr
      LEFT JOIN user_dynamic_roles udr ON udr.role_id = dr.id
      LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
      WHERE dr.company_id = ${companyId}
      GROUP BY dr.id, dr.name, dr.description, dr.is_system_default, dr.is_deletable, dr.created_at, dr.updated_at
      ORDER BY dr.is_system_default DESC, dr.name ASC
    `);

    return res.json({ roles: rolesResult.rows });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

/**
 * GET /api/roles/:roleId
 * Get detailed information about a specific role
 */
router.get('/:roleId', requirePermission('users:view'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { roleId } = req.params;
    const companyId = authReq.user?.companyId;

    // Get role details
    const roleResult = await db.execute(sql`
      SELECT 
        dr.id,
        dr.name,
        dr.description,
        dr.is_system_default,
        dr.is_deletable,
        dr.created_at,
        dr.updated_at
      FROM dynamic_roles dr
      WHERE dr.id = ${roleId} AND dr.company_id = ${companyId}
    `);

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const role = roleResult.rows[0];

    // Get permissions for this role
    const permsResult = await db.execute(sql`
      SELECT 
        p.id,
        p.permission_key,
        p.permission_name,
        p.description,
        p.plan_level,
        p.category,
        pc.name as category_name,
        pc.display_order
      FROM dynamic_role_permissions drp
      JOIN permissions p ON p.id = drp.permission_id
      LEFT JOIN permission_categories pc ON pc.id = p.category_id
      WHERE drp.role_id = ${roleId}
      ORDER BY pc.display_order ASC, p.permission_name ASC
    `);

    // Get users with this role
    const usersResult = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        udr.is_primary
      FROM user_dynamic_roles udr
      JOIN users u ON u.id = udr.user_id
      WHERE udr.role_id = ${roleId}
      ORDER BY u.full_name ASC
    `);

    return res.json({
      role,
      permissions: permsResult.rows,
      users: usersResult.rows
    });
  } catch (error) {
    console.error('Error fetching role details:', error);
    return res.status(500).json({ error: 'Failed to fetch role details' });
  }
});

/**
 * POST /api/roles
 * Create a new custom role
 */
router.post('/', requirePermission('users:manage_roles'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { name, description, permissionIds } = req.body;
    const companyId = authReq.user?.companyId;
    const userId = authReq.user?.id;

    if (!name || !companyId) {
      return res.status(400).json({ error: 'Name and company ID are required' });
    }

    // Create the role
    const roleResult = await db.execute(sql`
      INSERT INTO dynamic_roles (company_id, name, description, is_system_default, is_deletable)
      VALUES (${companyId}, ${name}, ${description || ''}, false, true)
      RETURNING id
    `);

    const roleId = roleResult.rows[0].id as string;

    // Assign permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      for (const permId of permissionIds) {
        await db.execute(sql`
          INSERT INTO dynamic_role_permissions (role_id, permission_id)
          VALUES (${roleId}, ${permId})
          ON CONFLICT DO NOTHING
        `);
      }
    }

    // Audit log
    await db.execute(sql`
      INSERT INTO role_change_audit (
        company_id,
        changed_by,
        action_type,
        role_id,
        details
      )
      VALUES (
        ${companyId},
        ${userId},
        'role_created',
        ${roleId},
        ${JSON.stringify({ name, permissionCount: permissionIds?.length || 0 })}
      )
    `);

    return res.status(201).json({
      success: true,
      roleId,
      message: 'Role created successfully'
    });
  } catch (error: any) {
    console.error('Error creating role:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'A role with this name already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to create role' });
  }
});

/**
 * PUT /api/roles/:roleId
 * Update role details and permissions
 */
router.put('/:roleId', requirePermission('users:manage_roles'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { roleId } = req.params;
    const { name, description, permissionIds } = req.body;
    const companyId = authReq.user?.companyId;
    const userId = authReq.user?.id;

    // Check if role exists and is editable
    const roleCheck = await db.execute(sql`
      SELECT is_system_default, is_deletable, name as old_name
      FROM dynamic_roles
      WHERE id = ${roleId} AND company_id = ${companyId}
    `);

    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const roleData = roleCheck.rows[0];

    // Update role details
    if (name || description !== undefined) {
      await db.execute(sql`
        UPDATE dynamic_roles
        SET 
          name = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          updated_at = NOW()
        WHERE id = ${roleId}
      `);
    }

    // Update permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      // Remove all existing permissions
      await db.execute(sql`
        DELETE FROM dynamic_role_permissions
        WHERE role_id = ${roleId}
      `);

      // Add new permissions
      for (const permId of permissionIds) {
        await db.execute(sql`
          INSERT INTO dynamic_role_permissions (role_id, permission_id)
          VALUES (${roleId}, ${permId})
          ON CONFLICT DO NOTHING
        `);
      }

      // Invalidate cache for all users with this role
      const usersWithRole = await db.execute(sql`
        SELECT user_id FROM user_dynamic_roles WHERE role_id = ${roleId}
      `);

      for (const row of usersWithRole.rows) {
        await DynamicPermissionService.invalidatePermissionCache(row.user_id as string);
      }
    }

    // Audit log
    await db.execute(sql`
      INSERT INTO role_change_audit (
        company_id,
        changed_by,
        action_type,
        role_id,
        details,
        old_value,
        new_value
      )
      VALUES (
        ${companyId},
        ${userId},
        'role_updated',
        ${roleId},
        ${JSON.stringify({ changedFields: Object.keys(req.body) })},
        ${JSON.stringify({ name: roleData.old_name })},
        ${JSON.stringify({ name, description, permissionCount: permissionIds?.length })}
      )
    `);

    return res.json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating role:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A role with this name already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to update role' });
  }
});

/**
 * POST /api/roles/:roleId/clone
 * Clone an existing role
 */
router.post('/:roleId/clone', requirePermission('users:manage_roles'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { roleId } = req.params;
    const { newName } = req.body;
    const companyId = authReq.user?.companyId;
    const userId = authReq.user?.id;

    if (!newName) {
      return res.status(400).json({ error: 'New role name is required' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found' });
    }

    const newRoleId = await cloneRole(roleId, newName, companyId, userId);

    return res.status(201).json({
      success: true,
      roleId: newRoleId,
      message: `Role cloned as "${newName}"`
    });
  } catch (error) {
    console.error('Error cloning role:', error);
    return res.status(500).json({ error: 'Failed to clone role' });
  }
});

/**
 * DELETE /api/roles/:roleId
 * Delete a role (if deletable)
 */
router.delete('/:roleId', requirePermission('users:manage_roles'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { roleId } = req.params;
    const companyId = authReq.user?.companyId;
    const userId = authReq.user?.id;

    // Check if role is deletable
    const roleCheck = await db.execute(sql`
      SELECT is_deletable, name
      FROM dynamic_roles
      WHERE id = ${roleId} AND company_id = ${companyId}
    `);

    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (!roleCheck.rows[0].is_deletable) {
      return res.status(403).json({ 
        error: 'This is a system default role and cannot be deleted' 
      });
    }

    // Check if any users have this role
    const usersWithRole = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM user_dynamic_roles
      WHERE role_id = ${roleId}
    `);

    const userCount = Number(usersWithRole.rows[0].count);

    if (userCount > 0) {
      return res.status(400).json({
        error: `Cannot delete role: ${userCount} user(s) currently have this role`,
        userCount
      });
    }

    // Delete the role (cascades will handle role_permissions)
    await db.execute(sql`
      DELETE FROM dynamic_roles
      WHERE id = ${roleId}
    `);

    // Audit log
    await db.execute(sql`
      INSERT INTO role_change_audit (
        company_id,
        changed_by,
        action_type,
        role_id,
        details
      )
      VALUES (
        ${companyId},
        ${userId},
        'role_deleted',
        ${roleId},
        ${JSON.stringify({ name: roleCheck.rows[0].name })}
      )
    `);

    return res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({ error: 'Failed to delete role' });
  }
});

// =====================================================
// PERMISSIONS CATALOG
// =====================================================

/**
 * GET /api/roles/permissions/all
 * Get all available permissions (grouped by category)
 * Used by the role editor UI
 */
router.get('/permissions/all', requirePermission('users:view'), async (req, res) => {
  try {
    const permsResult = await db.execute(sql`
      SELECT 
        p.id,
        p.permission_key,
        p.permission_name,
        p.description,
        p.plan_level,
        p.category,
        pc.id as category_id,
        pc.name as category_name,
        pc.description as category_description,
        pc.display_order
      FROM permissions p
      LEFT JOIN permission_categories pc ON pc.id = p.category_id
      ORDER BY pc.display_order ASC, p.permission_name ASC
    `);

    // Group by category
    const grouped: Record<string, any> = {};

    for (const perm of permsResult.rows) {
      const categoryName = perm.category_name as string || 'Other';
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          id: perm.category_id,
          name: categoryName,
          description: perm.category_description,
          displayOrder: perm.display_order,
          permissions: []
        };
      }

      grouped[categoryName].permissions.push({
        id: perm.id,
        key: perm.permission_key,
        name: perm.permission_name,
        description: perm.description,
        planLevel: perm.plan_level
      });
    }

    return res.json({
      categories: Object.values(grouped).sort((a, b) => a.displayOrder - b.displayOrder)
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// =====================================================
// USER ROLE ASSIGNMENTS
// =====================================================

/**
 * POST /api/roles/users/:userId/assign
 * Assign role(s) to a user
 */
router.post('/users/:userId/assign', requirePermission('users:manage_roles'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { userId } = req.params;
    const { roleIds, setPrimaryRoleId } = req.body;
    const companyId = authReq.user?.companyId;
    const assignedBy = authReq.user?.id;

    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({ error: 'At least one role ID is required' });
    }

    // Verify user is in same company
    const userCheck = await db.execute(sql`
      SELECT company_id FROM users WHERE id = ${userId}
    `);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.rows[0].company_id !== companyId) {
      return res.status(403).json({ error: 'User is not in your company' });
    }

    // Assign roles
    for (const roleId of roleIds) {
      const isPrimary = roleId === setPrimaryRoleId;
      await DynamicPermissionService.assignRoleToUser(userId, roleId, isPrimary, assignedBy);
    }

    return res.json({
      success: true,
      message: 'Roles assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning roles:', error);
    return res.status(500).json({ error: 'Failed to assign roles' });
  }
});

/**
 * DELETE /api/roles/users/:userId/remove/:roleId
 * Remove a role from a user
 */
router.delete('/users/:userId/remove/:roleId', requirePermission('users:manage_roles'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { userId, roleId } = req.params;
    const companyId = authReq.user?.companyId;
    const removedBy = authReq.user?.id;

    // Verify user is in same company
    const userCheck = await db.execute(sql`
      SELECT company_id FROM users WHERE id = ${userId}
    `);

    if (userCheck.rows.length === 0 || userCheck.rows[0].company_id !== companyId) {
      return res.status(404).json({ error: 'User not found' });
    }

    await DynamicPermissionService.removeRoleFromUser(userId, roleId, removedBy);

    return res.json({
      success: true,
      message: 'Role removed successfully'
    });
  } catch (error) {
    console.error('Error removing role:', error);
    return res.status(500).json({ error: 'Failed to remove role' });
  }
});

/**
 * GET /api/roles/users/:userId
 * Get all roles for a specific user
 */
router.get('/users/:userId', requirePermission('users:view'), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { userId } = req.params;
    const companyId = authReq.user?.companyId;

    const rolesResult = await db.execute(sql`
      SELECT 
        dr.id,
        dr.name,
        dr.description,
        udr.is_primary,
        udr.assigned_at
      FROM user_dynamic_roles udr
      JOIN dynamic_roles dr ON dr.id = udr.role_id
      WHERE udr.user_id = ${userId} AND dr.company_id = ${companyId}
      ORDER BY udr.is_primary DESC, dr.name ASC
    `);

    return res.json({ roles: rolesResult.rows });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

export default router;
