/**
 * Analytics Domain Routes
 *
 * Consolidates all analytics and reporting routes:
 * - General analytics
 * - Business Intelligence (BI)
 * - SaaS metrics
 * - Healthcare analytics
 * - Python analytics
 *
 * @module routes/domains/analytics
 */

import { Router } from 'express';
import { secureRoute } from '../../../middleware/secureRoute';
import analyticsRoutes from '../../analytics';
import { registerBiRoutes } from '../../bi';
import biAnalyticsRoutes from '../../bi-analytics';
import { registerSaaSRoutes } from '../../saas-analytics';
import { saasMetricsRouter } from '../../saas-metrics';
import healthcareAnalyticsRoutes from '../../healthcare-analytics';
import pythonAnalyticsRoutes from '../../pythonAnalytics';

const router = Router();

// Apply secure route middleware to all analytics routes
router.use(...secureRoute());

// General analytics
router.use('/', analyticsRoutes);

// BI analytics
router.use('/bi', biAnalyticsRoutes);

// SaaS metrics
router.use('/saas', saasMetricsRouter);

// Healthcare analytics
router.use('/healthcare', healthcareAnalyticsRoutes);

export default router;

/**
 * Registration functions for routes that need app instance
 */
export { registerBiRoutes, registerSaaSRoutes };

/**
 * Python analytics routes (mounted at different path)
 */
export { pythonAnalyticsRoutes };

/**
 * Route metadata for auto-discovery
 */
export const routeConfig = {
  basePath: '/api/analytics',
  description: 'Analytics, reporting, and business intelligence routes',
  requiresAuth: true,
};
