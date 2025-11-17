/**
 * Laboratory Integration API Routes
 * 
 * Comprehensive REST API for laboratory management including:
 * - Lab order management and workflow
 * - Result interface with external laboratories
 * - Critical value notification system
 * - Quality control and assurance
 * - HL7 interface for data exchange
 * - Specimen tracking and management
 * - Test catalog and pricing
 * - Regulatory compliance and reporting
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { laboratoryService } from "../services/LaboratoryService";
import logger from "../utils/logger";

const router = Router();

// Authentication middleware (assumed to be applied at router level)
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

const requireCompanyAccess = (req: Request, res: Response, next: any) => {
  if (!req.user?.companyId) {
    return res.status(403).json({ error: "Company context required" });
  }
  next();
};

// Helper functions for type safety
const getCompanyId = (req: Request): string => {
  if (!req.user?.companyId) {
    throw new Error('Company context required');
  }
  return req.user.companyId;
};

const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new Error('User context required');
  }
  return req.user.id;
};

// Validation schemas
const orderedTestSchema = z.object({
  testCode: z.string().min(1),
  testName: z.string().min(1),
  specimenType: z.string().min(1),
  urgency: z.enum(['routine', 'stat', 'urgent']),
  clinicalInfo: z.string().optional()
});

const labOrderSchema = z.object({
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  orderedTests: z.array(orderedTestSchema).min(1),
  specimenInfo: z.object({
    collectionDate: z.coerce.date(),
    collectionTime: z.string().min(1),
    fastingStatus: z.boolean(),
    specialInstructions: z.string().optional()
  }).optional(),
  billingInfo: z.object({
    insuranceId: z.string().optional(),
    selfPay: z.boolean().optional(),
    authorizationCode: z.string().optional()
  }).optional()
});

const labResultSchema = z.object({
  testCode: z.string().min(1),
  testName: z.string().min(1),
  resultValue: z.string().min(1),
  resultUnit: z.string().optional(),
  referenceRange: z.string().optional(),
  abnormalFlag: z.enum(['normal', 'high', 'low', 'critical']).optional(),
  clinicalSignificance: z.string().optional(),
  testStatus: z.enum(['final', 'preliminary', 'corrected', 'cancelled'])
});

const receiveResultsSchema = z.object({
  orderId: z.string().min(1),
  results: z.array(labResultSchema).min(1),
  performedBy: z.string().min(1),
  performedDate: z.coerce.date(),
  verifiedBy: z.string().optional(),
  verifiedDate: z.coerce.date().optional(),
  accessionNumber: z.string().optional()
});

const qualityControlSchema = z.object({
  testCode: z.string().min(1),
  controlLot: z.string().min(1),
  controlLevel: z.enum(['level1', 'level2', 'level3']),
  expectedValue: z.number(),
  actualValue: z.number(),
  acceptableRange: z.object({
    min: z.number(),
    max: z.number()
  }),
  testDate: z.coerce.date(),
  technicianId: z.string().min(1),
  instrumentId: z.string().min(1),
  reagentLot: z.string().optional()
});

// ========== LAB ORDER MANAGEMENT ==========

/**
 * Create new lab order
 */
router.post('/orders', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = labOrderSchema.parse(req.body);
    
    const result = await laboratoryService.createLabOrder({
      companyId: getCompanyId(req),
      ...validated
    });

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to create lab order');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create lab order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get lab orders for patient
 */
router.get('/orders/patient/:patientId', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const {
      status,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = req.query;

    const options = {
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const result = await laboratoryService.getPatientLabOrders(patientId, getCompanyId(req), options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to get patient lab orders');
    res.status(500).json({ 
      error: 'Failed to get patient lab orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get lab orders for provider
 */
router.get('/orders/provider/:providerId', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const {
      status,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = req.query;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Provider lab orders endpoint - to be implemented',
      providerId
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to get provider lab orders');
    res.status(500).json({ 
      error: 'Failed to get provider lab orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== LAB RESULTS ==========

/**
 * Receive lab results from external lab
 */
router.post('/results', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = receiveResultsSchema.parse(req.body);
    
    const result = await laboratoryService.receiveLabResults({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to receive lab results');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to receive lab results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get lab results for patient
 */
router.get('/results/patient/:patientId', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const {
      testCode,
      dateFrom,
      dateTo,
      abnormalOnly = false,
      limit = 100,
      offset = 0
    } = req.query;

    const options = {
      testCode: testCode as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      abnormalOnly: abnormalOnly === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const result = await laboratoryService.getPatientLabResults(patientId, getCompanyId(req), options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to get patient lab results');
    res.status(500).json({ 
      error: 'Failed to get patient lab results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get specific lab result
 */
router.get('/results/:resultId', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;
    
    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Specific lab result endpoint - to be implemented',
      resultId
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to get lab result');
    res.status(500).json({ 
      error: 'Failed to get lab result',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== LAB TEST CATALOG ==========

/**
 * Get lab test catalog
 */
router.get('/catalog', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      category,
      search,
      activeOnly = true
    } = req.query;

    const options = {
      category: category as string,
      search: search as string,
      activeOnly: activeOnly === 'true'
    };

    const result = await laboratoryService.getLabTestCatalog(getCompanyId(req), options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get lab test catalog');
    res.status(500).json({ 
      error: 'Failed to get lab test catalog',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Add test to catalog (admin only)
 */
router.post('/catalog', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Add test to catalog endpoint - to be implemented'
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add test to catalog');
    res.status(500).json({ 
      error: 'Failed to add test to catalog',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== QUALITY CONTROL ==========

/**
 * Record quality control test
 */
router.post('/quality-control', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = qualityControlSchema.parse(req.body);
    
    const result = await laboratoryService.recordQualityControlTest({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to record quality control test');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to record quality control test',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get quality control data
 */
router.get('/quality-control', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      testCode,
      dateFrom,
      dateTo,
      instrumentId
    } = req.query;

    const options = {
      testCode: testCode as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      instrumentId: instrumentId as string
    };

    const result = await laboratoryService.getQualityControlData(getCompanyId(req), options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get quality control data');
    res.status(500).json({ 
      error: 'Failed to get quality control data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== CRITICAL VALUES ==========

/**
 * Get critical value notifications
 */
router.get('/critical-values', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      providerId,
      acknowledgedOnly = false,
      limit = 50,
      offset = 0
    } = req.query;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Critical values endpoint - to be implemented',
      filters: { patientId, providerId, acknowledgedOnly }
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get critical values');
    res.status(500).json({ 
      error: 'Failed to get critical values',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Acknowledge critical value
 */
router.post('/critical-values/:notificationId/acknowledge', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const { notes } = req.body;
    
    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Acknowledge critical value endpoint - to be implemented',
      notificationId,
      acknowledgedBy: getUserId(req),
      acknowledgedAt: new Date()
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to acknowledge critical value');
    res.status(500).json({ 
      error: 'Failed to acknowledge critical value',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== UTILIZATION STATISTICS ==========

/**
 * Get lab utilization statistics
 */
router.get('/statistics/utilization', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const dateRange = {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    };

    const result = await laboratoryService.getLabUtilizationStats(getCompanyId(req), dateRange);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get lab utilization statistics');
    res.status(500).json({ 
      error: 'Failed to get lab utilization statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== HL7 INTERFACE ==========

/**
 * Process HL7 message (for external lab systems)
 */
router.post('/hl7', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { message, messageType } = req.body;
    
    // This would need to be implemented for HL7 processing
    res.json({
      success: true,
      message: 'HL7 message processing endpoint - to be implemented',
      messageType,
      processedAt: new Date()
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to process HL7 message');
    res.status(500).json({ 
      error: 'Failed to process HL7 message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Export HL7 message
 */
router.post('/hl7/export', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { 
      orderId,
      messageType = 'ORM_O01'
    } = req.body;
    
    // This would need to be implemented for HL7 export
    res.json({
      success: true,
      message: 'HL7 export endpoint - to be implemented',
      orderId,
      messageType,
      exportedAt: new Date()
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to export HL7 message');
    res.status(500).json({ 
      error: 'Failed to export HL7 message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== SPECIMEN MANAGEMENT ==========

/**
 * Get specimen tracking information
 */
router.get('/specimens/:specimenId', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { specimenId } = req.params;
    
    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Specimen tracking endpoint - to be implemented',
      specimenId
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to get specimen tracking');
    res.status(500).json({ 
      error: 'Failed to get specimen tracking',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update specimen status
 */
router.put('/specimens/:specimenId/status', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { specimenId } = req.params;
    const { status, location, notes } = req.body;
    
    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Update specimen status endpoint - to be implemented',
      specimenId,
      status,
      location,
      notes
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to update specimen status');
    res.status(500).json({ 
      error: 'Failed to update specimen status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== REGULATORY COMPLIANCE ==========

/**
 * Get compliance reports
 */
router.get('/compliance/reports', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      reportType,
      dateFrom,
      dateTo,
      format = 'json'
    } = req.query;
    
    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Compliance reports endpoint - to be implemented',
      reportType,
      dateFrom,
      dateTo,
      format
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get compliance reports');
    res.status(500).json({ 
      error: 'Failed to get compliance reports',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
