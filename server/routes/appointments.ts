/**
 * Appointment Routes for ILS 2.0
 * 
 * REST API endpoints for appointment scheduling and management including:
 * - Appointment CRUD operations
 * - Availability checking
 * - Time slot discovery
 * - Rescheduling and cancellation
 * - Waitlist management
 * - Reminder scheduling
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { appointmentService } from '../services/AppointmentService';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['eye_examination', 'contact_lens_fitting', 'frame_selection', 'follow_up', 'emergency', 'consultation', 'test_room_booking', 'dispensing', 'collection']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  location: z.string().optional(),
  notes: z.string().optional(),
  isVirtual: z.boolean().default(false),
  virtualMeetingLink: z.string().optional(),
  reminderType: z.enum(['email', 'sms', 'phone', 'push_notification', 'automated_call']).optional(),
  options: z.object({
    allowOverlapping: z.boolean().default(false),
    requireConfirmation: z.boolean().default(false),
    sendReminders: z.boolean().default(true),
    bufferTime: z.number().default(15)
  }).optional()
});

const updateAppointmentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  isVirtual: z.boolean().optional(),
  virtualMeetingLink: z.string().optional()
});

const rescheduleAppointmentSchema = z.object({
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime()
});

const cancelAppointmentSchema = z.object({
  reason: z.string().min(1),
  reasonType: z.enum(['patient_cancelled', 'practitioner_cancelled', 'emergency', 'no_show', 'other']).optional()
});

const availabilityCheckSchema = z.object({
  practitionerId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime()
});

const timeSlotsSchema = z.object({
  practitionerId: z.string().min(1),
  date: z.string().date(),
  duration: z.number().min(15).max(480).default(30)
});

const waitlistSchema = z.object({
  patientId: z.string().min(1),
  appointmentType: z.enum(['eye_examination', 'contact_lens_fitting', 'frame_selection', 'follow_up', 'emergency', 'consultation', 'test_room_booking', 'dispensing', 'collection']),
  preferredDate: z.string().date().optional(),
  preferredTimeRange: z.enum(['morning', 'afternoon', 'evening']).optional(),
  flexibility: z.number().min(1).max(30).default(3),
  contactMethod: z.enum(['email', 'sms', 'phone', 'push_notification', 'automated_call']),
  contactValue: z.string().min(1),
  notes: z.string().optional(),
  priority: z.number().min(1).max(10).default(5)
});

// Authentication middleware (assuming user is authenticated via existing middleware)
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Company access middleware
const requireCompanyAccess = (req: Request, res: Response, next: Function) => {
  if (!req.user?.companyId) {
    return res.status(403).json({ error: 'Company access required' });
  }
  next();
};

/**
 * POST /api/appointments
 * Create a new appointment
 */
router.post('/', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = createAppointmentSchema.parse(req.body);
    
    const appointmentData = {
      ...validated,
      companyId: req.user!.companyId,
      createdBy: req.user!.id,
      startTime: new Date(validated.startTime),
      endTime: new Date(validated.endTime)
    };

    const appointment = await appointmentService.createAppointment(
      appointmentData,
      validated.options
    );

    res.status(201).json({
      success: true,
      appointment,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to create appointment');
    
    if (error instanceof Error) {
      if (error.message.includes('not available')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('must be after start time')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * GET /api/appointments
 * Get appointments with filtering and pagination
 */
router.get('/', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      practitionerId,
      status,
      type,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    const params = {
      companyId: req.user!.companyId,
      patientId: patientId as string,
      practitionerId: practitionerId as string,
      status: status as string,
      type: type as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await appointmentService.getAppointments(params);

    res.json({
      success: true,
      ...result,
      message: 'Appointments retrieved successfully'
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get appointments');
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

/**
 * GET /api/appointments/:id
 * Get appointment by ID
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const appointment = await appointmentService.getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    if (req.user?.companyId && appointment.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      appointment,
      message: 'Appointment retrieved successfully'
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to get appointment');
    res.status(500).json({ error: 'Failed to get appointment' });
  }
});

/**
 * PUT /api/appointments/:id
 * Update appointment
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = updateAppointmentSchema.parse(req.body);
    
    // Check if appointment exists and user has access
    const existingAppointment = await appointmentService.getAppointmentById(id);
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.user?.companyId && existingAppointment.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {
      ...validated,
      updatedBy: req.user!.id
    };

    const appointment = await appointmentService.updateAppointment(id, updateData);

    res.json({
      success: true,
      appointment,
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    logger.error({ error, params: req.params, body: req.body }, 'Failed to update appointment');
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

/**
 * POST /api/appointments/:id/reschedule
 * Reschedule appointment
 */
router.post('/:id/reschedule', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = rescheduleAppointmentSchema.parse(req.body);
    
    // Check if appointment exists and user has access
    const existingAppointment = await appointmentService.getAppointmentById(id);
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.user?.companyId && existingAppointment.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const appointment = await appointmentService.rescheduleAppointment(
      id,
      new Date(validated.newStartTime),
      new Date(validated.newEndTime),
      req.user!.id
    );

    res.json({
      success: true,
      appointment,
      message: 'Appointment rescheduled successfully'
    });
  } catch (error) {
    logger.error({ error, params: req.params, body: req.body }, 'Failed to reschedule appointment');
    
    if (error instanceof Error && error.message.includes('not available')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

/**
 * POST /api/appointments/:id/cancel
 * Cancel appointment
 */
router.post('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = cancelAppointmentSchema.parse(req.body);
    
    // Check if appointment exists and user has access
    const existingAppointment = await appointmentService.getAppointmentById(id);
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.user?.companyId && existingAppointment.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const appointment = await appointmentService.cancelAppointment(
      id,
      validated.reason,
      req.user!.id
    );

    res.json({
      success: true,
      appointment,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    logger.error({ error, params: req.params, body: req.body }, 'Failed to cancel appointment');
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

/**
 * POST /api/appointments/check-availability
 * Check practitioner availability
 */
router.post('/check-availability', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = availabilityCheckSchema.parse(req.body);
    
    const isAvailable = !await appointmentService.checkPractitionerAvailability(
      validated.practitionerId,
      new Date(validated.startTime),
      new Date(validated.endTime),
      req.user!.companyId
    );

    res.json({
      success: true,
      isAvailable,
      message: isAvailable ? 'Practitioner is available' : 'Practitioner is not available'
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to check availability');
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

/**
 * GET /api/appointments/available-slots
 * Get available time slots for a practitioner
 */
router.get('/available-slots', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = timeSlotsSchema.parse(req.query);
    
    const availableSlots = await appointmentService.getAvailableTimeSlots(
      validated.practitionerId,
      new Date(validated.date),
      req.user!.companyId,
      validated.duration
    );

    res.json({
      success: true,
      availableSlots,
      date: validated.date,
      practitionerId: validated.practitionerId,
      duration: validated.duration,
      message: 'Available slots retrieved successfully'
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get available slots');
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

/**
 * GET /api/appointments/my-appointments
 * Get current user's appointments
 */
router.get('/my-appointments', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    const params = {
      companyId: req.user!.companyId,
      patientId: req.user!.id, // Get appointments for current user
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await appointmentService.getAppointments(params);

    res.json({
      success: true,
      ...result,
      message: 'My appointments retrieved successfully'
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get my appointments');
    res.status(500).json({ error: 'Failed to get my appointments' });
  }
});

/**
 * POST /api/appointments/waitlist
 * Add patient to waitlist
 */
router.post('/waitlist', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = waitlistSchema.parse(req.body);
    
    const waitlistData = {
      ...validated,
      companyId: req.user!.companyId
    };

    const waitlistEntry = await appointmentService.addToWaitlist(waitlistData);

    res.status(201).json({
      success: true,
      waitlistEntry,
      message: 'Added to waitlist successfully'
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add to waitlist');
    res.status(500).json({ error: 'Failed to add to waitlist' });
  }
});

/**
 * GET /api/appointments/waitlist
 * Get waitlist entries
 */
router.get('/waitlist', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const waitlistEntries = await appointmentService.getWaitlistEntries(req.user!.companyId);

    res.json({
      success: true,
      waitlistEntries,
      message: 'Waitlist entries retrieved successfully'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get waitlist entries');
    res.status(500).json({ error: 'Failed to get waitlist entries' });
  }
});

/**
 * POST /api/appointments/waitlist/:id/fulfill
 * Fulfill waitlist entry
 */
router.post('/waitlist/:id/fulfill', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    await appointmentService.fulfillWaitlistEntry(id, appointmentId);

    res.json({
      success: true,
      message: 'Waitlist entry fulfilled successfully'
    });
  } catch (error) {
    logger.error({ error, params: req.params, body: req.body }, 'Failed to fulfill waitlist entry');
    res.status(500).json({ error: 'Failed to fulfill waitlist entry' });
  }
});

// ============== INTEGRATED APPOINTMENT ENDPOINTS ==============

import { integratedAppointmentService } from '../services/IntegratedAppointmentService';
import { appointmentHandoffService } from '../services/AppointmentHandoffService';

/**
 * GET /api/appointments/integrated
 * Get appointments with enriched data (patient, practitioner, clinical, dispensing)
 */
router.get('/integrated', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      practitionerId,
      patientId,
      status,
      stage,
    } = req.query;

    const filters = {
      companyId: req.user!.companyId!,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      practitionerId: practitionerId as string | undefined,
      patientId: patientId as string | undefined,
      status: status as string | undefined,
      stage: stage as string | undefined,
    };

    const appointments = await integratedAppointmentService.getIntegratedAppointments(filters);

    res.json({
      success: true,
      appointments,
      count: appointments.length,
      message: 'Integrated appointments retrieved successfully',
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get integrated appointments');
    res.status(500).json({ error: 'Failed to get integrated appointments' });
  }
});

/**
 * GET /api/appointments/integrated/:id
 * Get single appointment with enriched data
 */
router.get('/integrated/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await integratedAppointmentService.getIntegratedAppointment(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      success: true,
      appointment,
      message: 'Integrated appointment retrieved successfully',
    });
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to get integrated appointment');
    res.status(500).json({ error: 'Failed to get integrated appointment' });
  }
});

/**
 * GET /api/appointments/queue/:stage
 * Get appointments by workflow stage (checked_in, in_exam, ready_for_dispense)
 */
router.get('/queue/:stage', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { stage } = req.params;

    if (!['checked_in', 'in_exam', 'ready_for_dispense'].includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage. Must be: checked_in, in_exam, or ready_for_dispense' });
    }

    const appointments = await integratedAppointmentService.getAppointmentsByStage(
      req.user!.companyId!,
      stage as any
    );

    res.json({
      success: true,
      stage,
      appointments,
      count: appointments.length,
      message: `${stage} queue retrieved successfully`,
    });
  } catch (error) {
    logger.error({ error, stage: req.params.stage }, 'Failed to get queue');
    res.status(500).json({ error: 'Failed to get queue' });
  }
});

/**
 * POST /api/appointments/:id/check-in
 * Check in a patient for their appointment
 */
router.post('/:id/check-in', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkedInBy = req.user!.id;

    await appointmentHandoffService.handleCheckIn(id, checkedInBy);

    // Get updated integrated appointment
    const appointment = await integratedAppointmentService.getIntegratedAppointment(id);

    res.json({
      success: true,
      appointment,
      message: 'Patient checked in successfully',
    });
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to check in patient');
    res.status(500).json({ error: 'Failed to check in patient' });
  }
});

/**
 * POST /api/appointments/:id/start-exam
 * Start examination for appointment (creates exam record)
 */
router.post('/:id/start-exam', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const practitionerId = req.user!.id;

    const result = await appointmentHandoffService.handleExamStart(id, practitionerId);

    res.json({
      success: true,
      examId: result.examId,
      examUrl: result.examUrl,
      message: 'Exam started successfully',
    });
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to start exam');
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

/**
 * POST /api/appointments/:id/complete-exam
 * Mark examination as complete (triggers handoff to dispenser)
 */
router.post('/:id/complete-exam', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { examId, prescriptionId } = req.body;

    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    await appointmentHandoffService.handleExamComplete(id, examId, prescriptionId);

    // Get updated integrated appointment
    const appointment = await integratedAppointmentService.getIntegratedAppointment(id);

    res.json({
      success: true,
      appointment,
      message: 'Exam completed successfully',
    });
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to complete exam');
    res.status(500).json({ error: 'Failed to complete exam' });
  }
});

/**
 * POST /api/appointments/:id/create-order
 * Create order for appointment (final handoff)
 */
router.post('/:id/create-order', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    await appointmentHandoffService.handleOrderCreated(id, orderId);

    // Get updated integrated appointment
    const appointment = await integratedAppointmentService.getIntegratedAppointment(id);

    res.json({
      success: true,
      appointment,
      message: 'Order created successfully',
    });
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to create order');
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status (triggers WebSocket broadcast)
 */
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    await appointmentService.updateAppointment(id, {
      status,
      notes,
      updatedBy: req.user!.id,
    });

    // Get updated integrated appointment
    const appointment = await integratedAppointmentService.getIntegratedAppointment(id);

    // Broadcast status change via WebSocket
    if (appointment?.companyId) {
      const webSocketService = require('../services/WebSocketService').getWebSocketService();
      webSocketService.broadcastToCompany(appointment.companyId, {
        event: 'appointment:status_changed',
        data: {
          appointmentId: id,
          status,
          stage: appointment.realtimeStatus.currentStage,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      appointment,
      message: 'Appointment status updated successfully',
    });
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to update status');
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
