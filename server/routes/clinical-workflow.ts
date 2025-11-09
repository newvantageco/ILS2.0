/**
 * Clinical Workflow API Routes
 * 
 * Endpoints for retrieving clinical-to-dispensing recommendations
 */

import { Router, type Request, type Response } from 'express';
import { clinicalWorkflowService } from '../services/ClinicalWorkflowService';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('ClinicalWorkflowRoutes');

/**
 * GET /api/clinical/recommendations/:examinationId
 * 
 * Get dispensing recommendations for a completed examination
 */
router.get(
  '/recommendations/:examinationId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { examinationId } = req.params;

      logger.info('Fetching dispensing recommendations', {
        examinationId,
        userId: req.user?.id,
      });

      const recommendations = await clinicalWorkflowService.getDispensingRecommendations(
        examinationId
      );

      res.json(recommendations);
    } catch (error) {
      logger.error('Failed to fetch recommendations', error as Error);
      res.status(500).json({
        error: 'Failed to fetch recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/clinical/patient/:patientId/latest-recommendations
 * 
 * Get recommendations from the patient's most recent examination
 */
router.get(
  '/patient/:patientId/latest-recommendations',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      const { companyId } = req.user!;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      logger.info('Fetching latest recommendations for patient', {
        patientId,
        companyId,
      });

      // Get patient's examinations
      const examinations = await storage.getEyeExaminations(companyId);
      const patientExams = examinations
        .filter((e: any) => e.patientId === patientId)
        .sort((a: any, b: any) => 
          new Date(b.examinationDate).getTime() - new Date(a.examinationDate).getTime()
        );

      if (patientExams.length === 0) {
        return res.status(404).json({
          error: 'No examinations found for patient',
        });
      }

      const latestExam = patientExams[0];
      const recommendations = await clinicalWorkflowService.getDispensingRecommendations(
        latestExam.id
      );

      res.json(recommendations);
    } catch (error) {
      logger.error('Failed to fetch latest recommendations', error as Error);
      res.status(500).json({
        error: 'Failed to fetch latest recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
