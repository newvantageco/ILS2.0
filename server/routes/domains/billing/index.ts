/**
 * Billing Domain Routes
 *
 * Consolidates all billing and payment routes:
 * - General billing
 * - Payment processing
 * - Medical billing
 * - Revenue Cycle Management (RCM)
 * - Point of Sale (POS)
 * - Subscription management
 *
 * @module routes/domains/billing
 */

import { Router } from 'express';
import { secureRoute } from '../../../middleware/secureRoute';
import billingRoutes from '../../billing';
import { registerPaymentRoutes } from '../../payments';
import medicalBillingRoutes from '../../medical-billing';
import rcmRoutes from '../../rcm';
import posRoutes from '../../pos';
import subscriptionManagementRoutes from '../../subscriptionManagement';

const router = Router();

// Apply secure route middleware to all billing routes
router.use(...secureRoute());

// General billing
router.use('/', billingRoutes);

// Medical billing (healthcare-specific)
router.use('/medical', medicalBillingRoutes);

// Revenue Cycle Management
router.use('/rcm', rcmRoutes);

// Point of Sale
router.use('/pos', posRoutes);

// Subscription management
router.use('/subscriptions', subscriptionManagementRoutes);

export default router;

/**
 * Payment routes registration function (needs app instance)
 */
export { registerPaymentRoutes };

/**
 * Route metadata for auto-discovery
 */
export const routeConfig = {
  basePath: '/api/billing',
  description: 'Billing, payments, and revenue cycle routes',
  requiresAuth: true,
  pciCompliant: true,
};
