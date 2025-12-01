/**
 * Clinical Domain Routes
 *
 * Consolidates all clinical practice routes:
 * - Eye examinations
 * - Clinical workflows
 * - OMA file validation
 * - Clinical protocols
 * - Clinical reporting
 * - Lens recommendations
 * - Contact lens management
 *
 * @module routes/domains/clinical
 */

import { Router } from 'express';
import { secureRoute } from '../../../middleware/secureRoute';
import examinationsRoutes from '../../examinations';
import clinicalWorkflowRoutes from '../../../routes/clinical/workflow';
import omaValidationRoutes from '../../../routes/clinical/oma-validation';
import clinicalProtocolsRoutes from '../../clinical-protocols';
import clinicalReportingRoutes from '../../clinical-reporting';
import lensRecommendationsRoutes from '../../lens-recommendations';
import contactLensRoutes from '../../contactLens';

const router = Router();

// Apply secure route middleware to all clinical routes
router.use(...secureRoute());

// Eye examinations
router.use('/examinations', examinationsRoutes);

// Clinical workflows
router.use('/workflows', clinicalWorkflowRoutes);

// OMA file validation
router.use('/oma', omaValidationRoutes);

// Clinical protocols
router.use('/protocols', clinicalProtocolsRoutes);

// Clinical reporting
router.use('/reporting', clinicalReportingRoutes);

// Lens recommendations
router.use('/lens-recommendations', lensRecommendationsRoutes);

// Contact lens management
router.use('/contact-lens', contactLensRoutes);

export default router;

/**
 * Route metadata for auto-discovery
 */
export const routeConfig = {
  basePath: '/api/clinical',
  description: 'Clinical practice management routes',
  requiresAuth: true,
  hipaaCompliant: true,
};
