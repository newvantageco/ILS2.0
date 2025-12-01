/**
 * System Domain Routes
 *
 * Consolidates system administration routes:
 * - Feature flags
 * - Monitoring
 * - Observability
 * - Backup and recovery
 * - Archival
 * - GDPR compliance
 * - Events
 *
 * @module routes/domains/system
 */

import { Router } from 'express';
import { secureRoute, secureAdminRoute } from '../../../middleware/secureRoute';
import featureFlagsRoutes from '../../feature-flags';
import monitoringRoutes from '../../monitoring';
import observabilityRoutes from '../../observability';
import backupRoutes from '../../backup';
import archivalRoutes from '../../archival';
import gdprRoutes from '../../gdpr';
import eventRoutes from '../../events';
import queryOptimizerRoutes from '../../query-optimizer';

const router = Router();

// Feature flags (public for client feature checks)
router.use('/feature-flags', featureFlagsRoutes);

// Monitoring and health checks
router.use('/monitoring', ...secureRoute(), monitoringRoutes);

// Observability (traces, metrics)
router.use('/observability', ...secureRoute(), observabilityRoutes);

// Backup management (admin only)
router.use('/backup', backupRoutes);

// Data archival
router.use('/archival', ...secureRoute(), archivalRoutes);

// GDPR compliance
router.use('/gdpr', ...secureRoute(), gdprRoutes);

// System events
router.use('/events', eventRoutes);

// Query optimizer
router.use('/query-optimizer', ...secureRoute(), queryOptimizerRoutes);

export default router;

/**
 * Route metadata for auto-discovery
 */
export const routeConfig = {
  basePath: '/api/system',
  description: 'System administration and operations routes',
  mixed: true, // Some routes public (health checks), some admin-only
};
