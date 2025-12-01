/**
 * Healthcare Platform Domain Routes
 *
 * Consolidates healthcare-specific routes:
 * - Population health
 * - Quality measures
 * - mHealth (mobile health)
 * - Research
 * - Telehealth
 * - EHR integration
 * - Laboratory
 *
 * @module routes/domains/healthcare
 */

import { Router } from 'express';
import { secureRoute } from '../../../middleware/secureRoute';
import populationHealthRoutes from '../../population-health';
import qualityRoutes from '../../quality';
import mhealthRoutes from '../../mhealth';
import researchRoutes from '../../research';
import telehealthRoutes from '../../telehealth';
import ehrRoutes from '../../ehr';
import laboratoryRoutes from '../../laboratory';

const router = Router();

// Apply secure route middleware to all healthcare routes
router.use(...secureRoute());

// Population health management
router.use('/population', populationHealthRoutes);

// Quality measures and reporting
router.use('/quality', qualityRoutes);

// mHealth / mobile health
router.use('/mhealth', mhealthRoutes);

// Research and clinical trials
router.use('/research', researchRoutes);

// Telehealth / virtual care
router.use('/telehealth', telehealthRoutes);

// EHR integration
router.use('/ehr', ehrRoutes);

// Laboratory management
router.use('/laboratory', laboratoryRoutes);

export default router;

/**
 * Route metadata for auto-discovery
 */
export const routeConfig = {
  basePath: '/api/healthcare',
  description: 'Healthcare platform routes (population health, quality, etc.)',
  requiresAuth: true,
  hipaaCompliant: true,
};
