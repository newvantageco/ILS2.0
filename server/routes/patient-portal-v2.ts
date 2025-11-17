/**
 * Patient Portal API Routes v2
 * 
 * Comprehensive REST API for patient portal functionality including:
 * - Patient profile management and preferences
 * - Appointment scheduling and management
 * - Medical records access (read-only)
 * - Secure messaging with providers
 * - Document management and sharing
 * - Health metrics and wellness tracking
 * - Billing information and payments
 * - Notifications and reminders
 * - HIPAA-compliant data handling
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { patientPortalService } from "../services/PatientPortalService";
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
const patientProfileSchema = z.object({
  preferredLanguage: z.string().optional(),
  timezone: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    appointmentReminders: z.boolean().optional(),
    billingNotifications: z.boolean().optional(),
    healthUpdates: z.boolean().optional()
  }).optional(),
  privacySettings: z.object({
    shareWithFamily: z.boolean().optional(),
    allowResearchData: z.boolean().optional(),
    marketingConsent: z.boolean().optional()
  }).optional()
});

const appointmentRequestSchema = z.object({
  providerId: z.string().optional(),
  serviceType: z.string().optional(),
  preferredDate: z.coerce.date().optional(),
  preferredTime: z.string().optional(),
  reasonForVisit: z.string().optional(),
  notes: z.string().optional()
});

const messageSchema = z.object({
  recipientId: z.string().min(1),
  recipientType: z.enum(['provider', 'staff', 'billing']),
  subject: z.string().min(1),
  message: z.string().min(1),
  priority: z.enum(['normal', 'urgent', 'routine']).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number()
  })).optional()
});

const healthMetricSchema = z.object({
  metricType: z.enum(['blood_pressure', 'weight', 'blood_sugar', 'temperature', 'heart_rate', 'oxygen_saturation', 'custom']),
  value: z.number(),
  unit: z.string().min(1),
  measuredAt: z.coerce.date(),
  notes: z.string().optional(),
  deviceInfo: z.string().optional(),
  customMetricName: z.string().optional()
});

const documentUploadSchema = z.object({
  documentType: z.enum(['lab_result', 'imaging', 'prescription', 'insurance_card', 'id_document', 'other']),
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().min(0),
  mimeType: z.string().min(1),
  expiresAt: z.coerce.date().optional(),
  isShared: z.boolean().optional()
});

const paymentSchema = z.object({
  amount: z.number().min(0),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe']),
  paymentToken: z.string().optional(),
  description: z.string().optional(),
  billingAddress: z.any().optional(),
  savePaymentMethod: z.boolean().optional()
});

// ========== PATIENT PROFILE ROUTES ==========

/**
 * Get patient profile
 */
router.get('/profile', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const profile = await patientPortalService.getPatientProfile(
      getUserId(req),
      getCompanyId(req)
    );

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    logger.error({ error, userId: getUserId(req) }, 'Failed to get patient profile');
    res.status(500).json({ 
      error: 'Failed to get patient profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update patient profile
 */
router.put('/profile', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = patientProfileSchema.parse(req.body);
    
    const profile = await patientPortalService.updatePatientProfile(
      getUserId(req),
      validated,
      getCompanyId(req)
    );

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to update patient profile');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update patient profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== APPOINTMENT MANAGEMENT ROUTES ==========

/**
 * Get patient appointments
 */
router.get('/appointments', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      status = 'all',
      limit = 50,
      offset = 0
    } = req.query;

    const appointments = await patientPortalService.getPatientAppointments(
      getUserId(req),
      getCompanyId(req),
      {
        status: status as any,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    );

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get patient appointments');
    res.status(500).json({ 
      error: 'Failed to get patient appointments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Request new appointment
 */
router.post('/appointments/request', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = appointmentRequestSchema.parse(req.body);
    
    const appointmentRequest = await patientPortalService.requestAppointment(
      getUserId(req),
      validated,
      getCompanyId(req)
    );

    res.status(201).json({
      success: true,
      appointmentRequest
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to request appointment');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to request appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cancel appointment
 */
router.post('/appointments/:id/cancel', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await patientPortalService.cancelAppointment(
      getUserId(req),
      id,
      reason,
      getCompanyId(req)
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to cancel appointment');
    res.status(500).json({ 
      error: 'Failed to cancel appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== MEDICAL RECORDS ROUTES ==========

/**
 * Get patient medical records
 */
router.get('/medical-records', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      recordType = 'all',
      limit = 100,
      offset = 0
    } = req.query;

    const records = await patientPortalService.getPatientMedicalRecords(
      getUserId(req),
      getCompanyId(req),
      {
        recordType: recordType as any,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    );

    res.json({
      success: true,
      records
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get patient medical records');
    res.status(500).json({ 
      error: 'Failed to get patient medical records',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== BILLING ROUTES ==========

/**
 * Get patient billing information
 */
router.get('/billing', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const billingInfo = await patientPortalService.getPatientBillingInfo(
      getUserId(req),
      getCompanyId(req)
    );

    res.json({
      success: true,
      billingInfo
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get patient billing information');
    res.status(500).json({ 
      error: 'Failed to get patient billing information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process patient payment
 */
router.post('/billing/payments', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = paymentSchema.parse(req.body);
    
    const payment = await patientPortalService.processPayment(
      getUserId(req),
      validated,
      getCompanyId(req)
    );

    res.status(201).json({
      success: true,
      payment
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to process patient payment');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process patient payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== MESSAGING ROUTES ==========

/**
 * Send message to provider/staff
 */
router.post('/messages', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = messageSchema.parse(req.body);
    
    const message = await patientPortalService.sendMessage(
      getUserId(req),
      validated,
      getCompanyId(req)
    );

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to send message');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to send message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get patient messages
 */
router.get('/messages', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      folder = 'inbox',
      limit = 50,
      offset = 0
    } = req.query;

    const messages = await patientPortalService.getPatientMessages(
      getUserId(req),
      getCompanyId(req),
      {
        folder: folder as any,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    );

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get patient messages');
    res.status(500).json({ 
      error: 'Failed to get patient messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== DOCUMENT MANAGEMENT ROUTES ==========

/**
 * Upload patient document
 */
router.post('/documents', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = documentUploadSchema.parse(req.body);
    
    const document = await patientPortalService.uploadDocument(
      getUserId(req),
      validated,
      getCompanyId(req)
    );

    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to upload patient document');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload patient document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get patient documents
 */
router.get('/documents', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      documentType,
      limit = 50,
      offset = 0
    } = req.query;

    const documents = await patientPortalService.getPatientDocuments(
      getUserId(req),
      getCompanyId(req),
      {
        documentType: documentType as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    );

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get patient documents');
    res.status(500).json({ 
      error: 'Failed to get patient documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== HEALTH METRICS ROUTES ==========

/**
 * Record health metric
 */
router.post('/health-metrics', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = healthMetricSchema.parse(req.body);
    
    const metric = await patientPortalService.recordHealthMetric(
      getUserId(req),
      validated,
      getCompanyId(req)
    );

    res.status(201).json({
      success: true,
      metric
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to record health metric');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to record health metric',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get patient health metrics
 */
router.get('/health-metrics', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      metricType,
      dateFrom,
      dateTo,
      limit = 100
    } = req.query;

    const metrics = await patientPortalService.getPatientHealthMetrics(
      getUserId(req),
      getCompanyId(req),
      {
        metricType: metricType as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        limit: parseInt(limit as string)
      }
    );

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get patient health metrics');
    res.status(500).json({ 
      error: 'Failed to get patient health metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== NOTIFICATIONS ROUTES ==========

/**
 * Get patient notifications
 */
router.get('/notifications', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      unreadOnly = false,
      limit = 50,
      offset = 0
    } = req.query;

    const notifications = await patientPortalService.getPatientNotifications(
      getUserId(req),
      getCompanyId(req),
      {
        unreadOnly: unreadOnly === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    );

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get patient notifications');
    res.status(500).json({ 
      error: 'Failed to get patient notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Mark notification as read
 */
router.put('/notifications/:id/read', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const notification = await patientPortalService.markNotificationRead(
      id,
      getUserId(req),
      getCompanyId(req)
    );

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to mark notification as read');
    res.status(500).json({ 
      error: 'Failed to mark notification as read',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== DASHBOARD ROUTES ==========

/**
 * Get patient dashboard summary
 */
router.get('/dashboard', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const dashboard = await patientPortalService.getDashboardSummary(
      getUserId(req),
      getCompanyId(req)
    );

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get patient dashboard summary');
    res.status(500).json({ 
      error: 'Failed to get patient dashboard summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
