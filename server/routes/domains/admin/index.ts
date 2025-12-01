/**
 * Administration Domain Routes
 *
 * Consolidates all admin-related routes:
 * - Platform admin operations
 * - System admin operations
 * - User management
 * - Audit logs
 * - Permissions and roles
 *
 * @module routes/domains/admin
 */

import { Router } from 'express';
import { secureRoute, secureAdminRoute, securePlatformAdminRoute } from '../../../middleware/secureRoute';
import { requireMFA } from '../../../middleware/mfa-enforcement';
import platformAdminRoutes from '../../platform-admin';
import systemAdminRoutes from '../../system-admin';
import userManagementRoutes from '../../userManagement';
import auditLogRoutes from '../../auditLogs';
import { registerPermissionRoutes } from '../../permissions';
import { registerAdminRoutes } from '../../admin';
import dynamicRolesRouter from '../../dynamicRoles';

const router = Router();

// Platform admin (super admin operations)
router.use('/platform', ...securePlatformAdminRoute(), requireMFA, platformAdminRoutes);

// System admin
router.use('/system', ...securePlatformAdminRoute(), requireMFA, systemAdminRoutes);

// User management
router.use('/users', ...secureRoute(), userManagementRoutes);

// Audit logs (admin only)
router.use('/audit-logs', ...secureAdminRoute(), requireMFA, auditLogRoutes);

// Dynamic roles
router.use('/roles', ...secureRoute(), dynamicRolesRouter);

export default router;

/**
 * Additional registration functions for routes that need app instance
 */
export { registerPermissionRoutes, registerAdminRoutes };

/**
 * Route metadata for auto-discovery
 */
export const routeConfig = {
  basePath: '/api/admin',
  description: 'Administration and user management routes',
  requiresAuth: true,
  requiresAdmin: true,
};
