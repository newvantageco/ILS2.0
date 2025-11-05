/**
 * OMA Validation Routes
 * 
 * Intelligent OMA file validation with confidence scoring
 * - Validate prescriptions against OMA standards
 * - Auto-approve based on confidence scores
 */

import { Router } from 'express';
import { OMAValidationService } from '../../services/OMAValidationService';

const router = Router();
const omaValidationService = new OMAValidationService();

/**
 * POST /api/clinical/oma/validate
 * Validate an OMA prescription
 * 
 * Body: { prescriptionId, orderId?, autoApprove? }
 */
router.post('/validate', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        error: 'Missing orderId'
      });
    }

    const result = await omaValidationService.validateOrder(orderId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('OMA validation error:', error);
    res.status(500).json({
      error: 'Failed to validate OMA prescription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/clinical/oma/stats
 * Get validation statistics for company
 */
router.get('/stats', async (req, res) => {
  try {
    const companyId = (req.user as any)?.companyId;

    if (!companyId) {
      return res.status(400).json({
        error: 'Company ID not found'
      });
    }

    // Placeholder for future stats endpoint
    res.json({
      success: true,
      message: 'OMA validation stats endpoint (implementation pending)',
      companyId
    });
  } catch (error) {
    console.error('OMA stats error:', error);
    res.status(500).json({
      error: 'Failed to get OMA stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
