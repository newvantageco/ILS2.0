/**
 * Integrations Domain Routes
 *
 * Consolidates all external integration routes:
 * - NHS integration
 * - Shopify
 * - Webhooks
 * - General integrations
 * - API management
 *
 * @module routes/domains/integrations
 */

import { Router } from 'express';
import { secureRoute } from '../../../middleware/secureRoute';
import nhsRoutes from '../../nhs';
import shopifyRoutes from '../../shopify';
import shopifyWebhookRoutes from '../../webhooks/shopify';
import integrationsRoutes from '../../integrations';
import apiManagementRoutes from '../../api-management';

const router = Router();

// NHS integration (UK healthcare)
router.use('/nhs', ...secureRoute(), nhsRoutes);

// Shopify e-commerce integration
router.use('/shopify', shopifyRoutes);

// General integrations
router.use('/connections', ...secureRoute(), integrationsRoutes);

// API management
router.use('/api-management', ...secureRoute(), apiManagementRoutes);

export default router;

/**
 * Webhook routes (need different middleware)
 */
export { shopifyWebhookRoutes };

/**
 * Route metadata for auto-discovery
 */
export const routeConfig = {
  basePath: '/api/integrations',
  description: 'External integration routes (NHS, Shopify, etc.)',
  mixed: true, // Some routes are public (webhooks), some require auth
};
