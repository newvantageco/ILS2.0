/**
 * User Management Routes with Company Isolation
 * 
 * - Platform admins can manage all users across all companies
 * - Company admins can only manage users within their company
 * - Regular users can only view users in their company
 */

import { Router } from 'express';
import { db } from '../db';
import { users, companies } from '../../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import {
  enforceCompanyIsolation,
  requireCompanyOrPlatformAdmin,
  requirePlatformAdmin
} from '../middleware/companyIsolation';
import {
  canViewUsers,
  canManageUsers,
  getAllowedRolesForCreation,
  canChangeRole,
  isPlatformAdmin,
  ROLES
} from '../utils/rbac';
import { hashPassword } from '../localAuth';
import { z } from 'zod';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('userManagement');

// Apply company isolation to all routes
router.use(enforceCompanyIsolation);

/**
 * GET /api/users
 * List users (filtered by company unless platform admin)
 */
router.get('/', async (req, res) => {
  try {
    const authReq = req as any;
    const userRole = authReq.user.role;
    const userCompanyId = authReq.userCompanyId;

    // Check if user can view users
    if (!canViewUsers(userRole, userCompanyId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view users'
      });
    }

    // Build query based on role
    let query = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        companyId: users.companyId,
        subscriptionPlan: users.subscriptionPlan,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt
      })
      .from(users);

    // Platform admin sees all users
    if (!isPlatformAdmin(userRole)) {
      // Others only see users from their company
      if (!userCompanyId) {
        return res.status(403).json({
          error: 'Company required',
          message: 'You must be associated with a company'
        });
      }
      query = query.where(eq(users.companyId, userCompanyId)) as any;
    }

    const usersList = await query;

    // Get company names for users
    const companyIds = Array.from(new Set(usersList.map(u => u.companyId).filter(Boolean) as string[]));
    const companiesList = companyIds.length > 0
      ? await db.select({ id: companies.id, name: companies.name })
          .from(companies)
          .where(inArray(companies.id, companyIds))
      : [];

    const companyMap = new Map(companiesList.map(c => [c.id, c.name]));

    // Add company names to response
    const usersWithCompany = usersList.map(u => ({
      ...u,
      companyName: u.companyId ? companyMap.get(u.companyId) : null,
      // Don't send sensitive data
      password: undefined
    }));

    res.json({
      success: true,
      data: usersWithCompany,
      meta: {
        total: usersWithCompany.length,
        isPlatformAdmin: isPlatformAdmin(userRole)
      }
    });
  } catch (error) {
    logger.error({ error, userRole, userCompanyId }, 'Error fetching users');
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/:id
 * Get specific user details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authReq = req as any;
    const userRole = authReq.user.role;
    const userCompanyId = authReq.userCompanyId;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can view this user
    if (!canViewUsers(userRole, userCompanyId, user.companyId || undefined)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this user'
      });
    }

    // Don't send password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    logger.error({ error, userId: id }, 'Error fetching user');
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/users
 * Create new user (company admin or platform admin only)
 */
router.post('/', requireCompanyOrPlatformAdmin, async (req, res) => {
  try {
    const authReq = req as any;
    const userRole = authReq.user.role;
    const userCompanyId = authReq.userCompanyId;

    // Validate request
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      role: z.string(),
      companyId: z.string().optional()
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors
      });
    }

    const { email, password, firstName, lastName, role, companyId } = validation.data;

    // Check if user can create this role
    const allowedRoles = getAllowedRolesForCreation(userRole);
    if (!allowedRoles.includes(role as any)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `You do not have permission to create users with role: ${role}`
      });
    }

    // Determine target company ID
    let targetCompanyId: string | undefined;
    if (isPlatformAdmin(userRole)) {
      // Platform admin can specify any company
      targetCompanyId = companyId;
    } else {
      // Company admin must use their own company
      if (companyId && companyId !== userCompanyId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only create users in your own company'
        });
      }
      targetCompanyId = userCompanyId;
    }

    // Check if email already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: role as any,
        companyId: targetCompanyId,
        subscriptionPlan: 'full', // Default for company users
        isActive: true,
        isVerified: true // Auto-verify for admin-created users
      })
      .returning();

    // Don't send password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: 'User created successfully'
    });
  } catch (error) {
    logger.error({ error, email, role, companyId: targetCompanyId }, 'Error creating user');
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/users/:id
 * Update user (company admin or platform admin only)
 */
router.put('/:id', requireCompanyOrPlatformAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const authReq = req as any;
    const userRole = authReq.user.role;
    const userCompanyId = authReq.userCompanyId;

    // Get existing user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can manage this user
    if (!canManageUsers(userRole, userCompanyId, existingUser.companyId || undefined)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to edit this user'
      });
    }

    // Validate request
    const schema = z.object({
      email: z.string().email().optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      role: z.string().optional(),
      isActive: z.boolean().optional(),
      subscriptionPlan: z.enum(['full', 'free_ecp']).optional(),
      // Platform admin can update these additional fields
      isVerified: z.boolean().optional(),
      accountStatus: z.string().optional()
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors
      });
    }

    const updates = validation.data;

    // Check role change permission
    if (updates.role && updates.role !== existingUser.role) {
      if (!canChangeRole(userRole, existingUser.role as any, updates.role as any)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to change this user\'s role'
        });
      }
    }

    // Only platform admin can change subscription plan directly
    if (updates.subscriptionPlan && !isPlatformAdmin(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only platform administrators can modify subscription plans'
      });
    }

    // Build update object with proper typing
    const updateData: any = {
      updatedAt: new Date()
    };
    if (updates.email) updateData.email = updates.email;
    if (updates.firstName) updateData.firstName = updates.firstName;
    if (updates.lastName) updateData.lastName = updates.lastName;
    if (updates.role) updateData.role = updates.role;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.subscriptionPlan) updateData.subscriptionPlan = updates.subscriptionPlan;
    
    // Platform admin only fields
    if (isPlatformAdmin(userRole)) {
      if (updates.isVerified !== undefined) updateData.isVerified = updates.isVerified;
      if (updates.accountStatus) updateData.accountStatus = updates.accountStatus;
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    // Don't send password
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      data: userWithoutPassword,
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error({ error, userId: id, updates }, 'Error updating user');
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (company admin or platform admin only)
 */
router.delete('/:id', requireCompanyOrPlatformAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const authReq = req as any;
    const userRole = authReq.user.role;
    const userCompanyId = authReq.userCompanyId;
    const currentUserId = authReq.user.id;

    // Prevent self-deletion
    if (id === currentUserId) {
      return res.status(400).json({
        error: 'Cannot delete yourself',
        message: 'You cannot delete your own account'
      });
    }

    // Get existing user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can manage this user
    if (!canManageUsers(userRole, userCompanyId, existingUser.companyId || undefined)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to delete this user'
      });
    }

    // Soft delete (deactivate) instead of hard delete
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    logger.error({ error, userId: id }, 'Error deleting user');
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/users/roles/allowed
 * Get roles that current user can assign
 */
router.get('/roles/allowed', (req, res) => {
  const authReq = req as any;
  const userRole = authReq.user.role;

  const allowedRoles = getAllowedRolesForCreation(userRole);

  res.json({
    success: true,
    data: allowedRoles.map(role => ({
      value: role,
      label: role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }))
  });
});

export default router;
