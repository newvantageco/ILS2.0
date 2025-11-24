/**
 * Clinical Workflow Routes
 * 
 * AI-powered clinical decision support
 * - Product recommendations based on prescription
 * - Prescription analysis and insights
 */

import { Router } from 'express';
import { clinicalWorkflowService } from '../../services/ClinicalWorkflowService';

const router = Router();

/**
 * POST /api/clinical/workflow/recommendations
 * Get AI-powered product recommendations
 * 
 * Body: { prescriptionId, patientId, preferences? }
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { prescriptionId, patientId, preferences } = req.body;
    const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;

    if (!prescriptionId || !patientId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['prescriptionId', 'patientId']
      });
    }

    const recommendations = await clinicalWorkflowService.getDispensingRecommendations(
      prescriptionId
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Clinical workflow error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/clinical/workflow/analyze
 * Analyze prescription for clinical insights
 * 
 * Body: { prescriptionId }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { prescriptionId } = req.body;

    if (!prescriptionId) {
      return res.status(400).json({
        error: 'Missing prescriptionId'
      });
    }

    // Placeholder for future analysis features
    res.json({
      success: true,
      message: 'Prescription analysis endpoint (implementation pending)',
      prescriptionId
    });
  } catch (error) {
    console.error('Prescription analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze prescription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
