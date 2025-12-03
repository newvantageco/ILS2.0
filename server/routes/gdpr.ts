/**
 * GDPR Compliance Routes
 * Endpoints for data export, deletion, and privacy rights
 */

import { Router, Response, RequestHandler } from 'express';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { gdprService } from '../services/GDPRService';
import GDPRDeletionService from '../services/GDPRDeletionService';
import { requireCompanyContext } from '../middleware/requireCompanyContext';
import { z } from 'zod';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('gdpr');

// Validation schemas
const consentSchema = z.object({
  marketing: z.boolean().optional(),
  analytics: z.boolean().optional(),
  thirdParty: z.boolean().optional(),
});

const deletionSchema = z.object({
  retainClinicalData: z.boolean().default(true),
  confirmation: z.literal('DELETE_MY_DATA'),
});

/**
 * GET /api/gdpr/export
 * Export all user data (GDPR Article 20 - Right to Data Portability)
 */
router.get('/export', isAuthenticated, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const exportData = await gdprService.exportUserData(userId);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="gdpr-data-export-${userId}-${Date.now()}.json"`);

    res.json(exportData);
  } catch (error) {
    logger.error({ error, userId }, 'GDPR export error');
    res.status(500).json({ error: 'Failed to export user data' });
  }
}) as RequestHandler);

/**
 * POST /api/gdpr/delete
 * Request data deletion (GDPR Article 17 - Right to Erasure)
 */
router.post('/delete', isAuthenticated, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request
    const result = deletionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues,
        message: 'You must confirm deletion by including confirmation: "DELETE_MY_DATA"',
      });
    }

    const { retainClinicalData } = result.data;

    // Perform deletion
    const deletionResult = await gdprService.requestDataDeletion(userId, retainClinicalData);

    res.json({
      success: deletionResult.success,
      message: deletionResult.message,
      itemsDeleted: deletionResult.itemsDeleted,
      note: 'Your account has been anonymized. You will be logged out shortly.',
    });

    // TODO: Invalidate user session after deletion
  } catch (error) {
    logger.error({ error, userId, retainClinicalData }, 'GDPR deletion error');
    res.status(500).json({ error: 'Failed to delete user data' });
  }
}) as RequestHandler);

/**
 * GET /api/gdpr/consent
 * Get current consent settings
 */
router.get('/consent', isAuthenticated, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const consent = await gdprService.getConsentStatus(userId);

    res.json(consent);
  } catch (error) {
    logger.error({ error, userId }, 'Get consent error');
    res.status(500).json({ error: 'Failed to get consent status' });
  }
}) as RequestHandler);

/**
 * POST /api/gdpr/consent
 * Update consent settings (GDPR Article 7 - Conditions for consent)
 */
router.post('/consent', isAuthenticated, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request
    const result = consentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues,
      });
    }

    await gdprService.updateConsent(userId, result.data);

    res.json({
      success: true,
      message: 'Consent preferences updated successfully',
    });
  } catch (error) {
    logger.error({ error, userId, consent: result.data }, 'Update consent error');
    res.status(500).json({ error: 'Failed to update consent' });
  }
}) as RequestHandler);

/**
 * GET /api/gdpr/compliance-report
 * Generate privacy compliance report (GDPR Article 15 - Right of access)
 */
router.get('/compliance-report', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const report = await gdprService.generateComplianceReport(userId);

    res.json({
      report,
      generatedAt: new Date(),
      message: 'This report shows all data we hold about you and our legal basis for processing it.',
    });
  } catch (error) {
    logger.error({ error, userId }, 'Compliance report error');
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

/**
 * GET /api/gdpr/privacy-policy
 * Get privacy policy and data processing information
 */
router.get('/privacy-policy', async (req, res: Response) => {
  res.json({
    policy: {
      dataController: 'ILS 2.0 Platform',
      purposes: [
        'Providing optical healthcare services',
        'Processing orders and prescriptions',
        'Communication with patients and healthcare providers',
        'Compliance with GOC regulations',
      ],
      legalBases: [
        'Legitimate interest (Art. 6(1)(f))',
        'Explicit consent (Art. 6(1)(a))',
        'Legal obligation (Art. 6(1)(c) - GOC compliance)',
      ],
      dataCategories: [
        'Personal identification data',
        'Contact information',
        'Health data (eye examination records)',
        'Financial data (invoices, payments)',
        'Technical data (IP address, cookies)',
      ],
      retentionPeriod: '7 years from last treatment (GOC regulations)',
      dataProcessors: [
        'AWS (cloud hosting)',
        'Stripe (payment processing)',
        'OpenAI/Anthropic (AI-powered features)',
      ],
      yourRights: [
        'Right to access your data (Article 15)',
        'Right to rectification (Article 16)',
        'Right to erasure (Article 17)',
        'Right to restrict processing (Article 18)',
        'Right to data portability (Article 20)',
        'Right to object (Article 21)',
      ],
      contact: {
        email: 'privacy@ils.com',
        dpo: 'Data Protection Officer',
      },
    },
    lastUpdated: '2024-11-08',
  });
});

// ========== GDPR Deletion Request Management ==========

/**
 * POST /api/gdpr/deletion-requests
 * Create a formal GDPR deletion request (Article 17)
 * Requires approval workflow for compliance tracking
 */
router.post('/deletion-requests', isAuthenticated, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const companyId = req.user!.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company context required' });
    }

    const { dataSubjectId, dataSubjectType, dataSubjectEmail, dataSubjectName, deletionType, reason } = req.body;

    const request = await GDPRDeletionService.createDeletionRequest({
      companyId,
      dataSubjectId: dataSubjectId || userId, // Default to current user
      dataSubjectType: dataSubjectType || 'user',
      dataSubjectEmail,
      dataSubjectName,
      requestedBy: userId,
      deletionType: deletionType || 'anonymization',
      reason,
      legalBasis: 'GDPR Article 17 - Right to Erasure'
    });

    res.status(201).json({
      success: true,
      request,
      message: 'Deletion request created and pending approval'
    });
  } catch (error) {
    logger.error({ error, userId: req.user!.id }, 'Failed to create deletion request');
    res.status(500).json({ error: 'Failed to create deletion request' });
  }
}) as RequestHandler);

/**
 * GET /api/gdpr/deletion-requests
 * List deletion requests for the company
 */
router.get('/deletion-requests', isAuthenticated, requireCompanyContext, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId!;
    const requests = await GDPRDeletionService.listDeletionRequests(companyId);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    logger.error({ error }, 'Failed to list deletion requests');
    res.status(500).json({ error: 'Failed to list deletion requests' });
  }
}) as RequestHandler);

/**
 * GET /api/gdpr/deletion-requests/:requestId
 * Get specific deletion request details
 */
router.get('/deletion-requests/:requestId', isAuthenticated, requireCompanyContext, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId!;
    const { requestId } = req.params;

    const request = await GDPRDeletionService.getDeletionRequest(requestId, companyId);

    if (!request) {
      return res.status(404).json({ error: 'Deletion request not found' });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    logger.error({ error, requestId: req.params.requestId }, 'Failed to get deletion request');
    res.status(500).json({ error: 'Failed to get deletion request' });
  }
}) as RequestHandler);

/**
 * POST /api/gdpr/deletion-requests/:requestId/approve
 * Approve deletion request (Admin only)
 */
router.post('/deletion-requests/:requestId/approve', isAuthenticated, requireCompanyContext, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    if (userRole !== 'admin' && userRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { requestId } = req.params;
    await GDPRDeletionService.approveDeletionRequest(requestId, req.user!.id);

    res.json({
      success: true,
      message: 'Deletion request approved'
    });
  } catch (error) {
    logger.error({ error, requestId: req.params.requestId }, 'Failed to approve deletion request');
    res.status(500).json({ error: 'Failed to approve deletion request' });
  }
}) as RequestHandler);

/**
 * POST /api/gdpr/deletion-requests/:requestId/reject
 * Reject deletion request (Admin only)
 */
router.post('/deletion-requests/:requestId/reject', isAuthenticated, requireCompanyContext, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    if (userRole !== 'admin' && userRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason required' });
    }

    await GDPRDeletionService.rejectDeletionRequest(requestId, req.user!.id, rejectionReason);

    res.json({
      success: true,
      message: 'Deletion request rejected'
    });
  } catch (error) {
    logger.error({ error, requestId: req.params.requestId }, 'Failed to reject deletion request');
    res.status(500).json({ error: 'Failed to reject deletion request' });
  }
}) as RequestHandler);

/**
 * POST /api/gdpr/deletion-requests/:requestId/process
 * Process approved deletion request (Admin only)
 */
router.post('/deletion-requests/:requestId/process', isAuthenticated, requireCompanyContext, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    if (userRole !== 'admin' && userRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { requestId } = req.params;
    const progress = await GDPRDeletionService.processDeletionRequest(requestId);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    logger.error({ error, requestId: req.params.requestId }, 'Failed to process deletion request');
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
}) as RequestHandler);

export default router;
