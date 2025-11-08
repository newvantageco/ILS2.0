/**
 * Patient Portal API Routes
 *
 * Public-facing routes for patient self-service portal
 */

import express from 'express';
import { loggers } from '../utils/logger';
import { PatientAuthService } from '../services/patient-portal/PatientAuthService';
import { AppointmentBookingService } from '../services/patient-portal/AppointmentBookingService';
import { PatientPortalService } from '../services/patient-portal/PatientPortalService';

const router = express.Router();
const logger = loggers.api;

// ========== Middleware ==========

/**
 * Middleware to authenticate patient session
 */
async function authenticatePatient(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const account = await PatientAuthService.validateSession(token);

    if (!account) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
      });
    }

    // Attach account to request
    (req as any).patientAccount = account;
    next();
  } catch (error) {
    logger.error({ error }, 'Patient authentication error');
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

// ========== Authentication Routes ==========

/**
 * POST /api/patient-portal/auth/register
 * Register a new patient account
 */
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, dateOfBirth, phone, mrn } = req.body;

    if (!email || !password || !firstName || !lastName || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const result = await PatientAuthService.register({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      phone,
      mrn,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      accountId: result.account?.id,
    });
  } catch (error) {
    logger.error({ error }, 'Registration error');
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

/**
 * POST /api/patient-portal/auth/login
 * Login with email and password
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required',
      });
    }

    const result = await PatientAuthService.login(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    if (result.requiresTwoFactor) {
      return res.json({
        success: true,
        requiresTwoFactor: true,
        message: 'Two-factor authentication required',
      });
    }

    res.json({
      success: true,
      token: result.token,
      patient: result.patient,
    });
  } catch (error) {
    logger.error({ error }, 'Login error');
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * POST /api/patient-portal/auth/logout
 * Logout and invalidate session
 */
router.post('/auth/logout', authenticatePatient, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await PatientAuthService.logout(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Logout error');
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * GET /api/patient-portal/auth/verify/:token
 * Verify email address
 */
router.get('/auth/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await PatientAuthService.verifyEmail(token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    logger.error({ error }, 'Email verification error');
    res.status(500).json({
      success: false,
      error: 'Verification failed',
    });
  }
});

/**
 * POST /api/patient-portal/auth/forgot-password
 * Request password reset
 */
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email required',
      });
    }

    await PatientAuthService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    logger.error({ error }, 'Password reset request error');
    res.status(500).json({
      success: false,
      error: 'Request failed',
    });
  }
});

/**
 * POST /api/patient-portal/auth/reset-password
 * Reset password with token
 */
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password required',
      });
    }

    const result = await PatientAuthService.resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    logger.error({ error }, 'Password reset error');
    res.status(500).json({
      success: false,
      error: 'Password reset failed',
    });
  }
});

/**
 * POST /api/patient-portal/auth/change-password
 * Change password when logged in
 */
router.post('/auth/change-password', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password required',
      });
    }

    const result = await PatientAuthService.changePassword(
      account.id,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Change password error');
    res.status(500).json({
      success: false,
      error: 'Password change failed',
    });
  }
});

/**
 * GET /api/patient-portal/auth/account
 * Get current account info
 */
router.get('/auth/account', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;

    // Remove sensitive data
    const { passwordHash, verificationToken, resetToken, ...safeAccount } = account;

    res.json({
      success: true,
      account: safeAccount,
    });
  } catch (error) {
    logger.error({ error }, 'Get account error');
    res.status(500).json({
      success: false,
      error: 'Failed to get account',
    });
  }
});

/**
 * PUT /api/patient-portal/auth/preferences
 * Update account preferences
 */
router.put('/auth/preferences', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const preferences = req.body;

    const updatedAccount = await PatientAuthService.updatePreferences(account.id, preferences);

    if (!updatedAccount) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    res.json({
      success: true,
      preferences: updatedAccount.preferences,
    });
  } catch (error) {
    logger.error({ error }, 'Update preferences error');
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
    });
  }
});

// ========== Appointment Routes ==========

/**
 * GET /api/patient-portal/appointments/types
 * Get available appointment types
 */
router.get('/appointments/types', authenticatePatient, async (req, res) => {
  try {
    const types = await AppointmentBookingService.getAppointmentTypes();

    res.json({
      success: true,
      appointmentTypes: types.filter((t) => t.allowOnlineBooking),
    });
  } catch (error) {
    logger.error({ error }, 'Get appointment types error');
    res.status(500).json({
      success: false,
      error: 'Failed to get appointment types',
    });
  }
});

/**
 * GET /api/patient-portal/appointments/providers
 * Get providers accepting appointments
 */
router.get('/appointments/providers', authenticatePatient, async (req, res) => {
  try {
    const { appointmentTypeId } = req.query;

    const providers = await AppointmentBookingService.getAvailableProviders(
      appointmentTypeId as string | undefined
    );

    res.json({
      success: true,
      providers,
    });
  } catch (error) {
    logger.error({ error }, 'Get providers error');
    res.status(500).json({
      success: false,
      error: 'Failed to get providers',
    });
  }
});

/**
 * GET /api/patient-portal/appointments/slots
 * Get available time slots
 */
router.get('/appointments/slots', authenticatePatient, async (req, res) => {
  try {
    const { providerId, appointmentTypeId, startDate, endDate } = req.query;

    if (!providerId || !appointmentTypeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID, appointment type ID, start date, and end date required',
      });
    }

    const slots = await AppointmentBookingService.getAvailableSlots(
      providerId as string,
      appointmentTypeId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      slots,
    });
  } catch (error) {
    logger.error({ error }, 'Get available slots error');
    res.status(500).json({
      success: false,
      error: 'Failed to get available slots',
    });
  }
});

/**
 * POST /api/patient-portal/appointments/book
 * Book an appointment
 */
router.post('/appointments/book', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { providerId, appointmentTypeId, date, startTime, notes } = req.body;

    if (!providerId || !appointmentTypeId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID, appointment type ID, date, and start time required',
      });
    }

    const result = await AppointmentBookingService.bookAppointment({
      patientId: account.patientId,
      providerId,
      appointmentTypeId,
      date: new Date(date),
      startTime,
      notes,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      booking: result.booking,
      message: `Appointment booked successfully. Confirmation code: ${result.booking?.confirmationCode}`,
    });
  } catch (error) {
    logger.error({ error }, 'Book appointment error');
    res.status(500).json({
      success: false,
      error: 'Failed to book appointment',
    });
  }
});

/**
 * GET /api/patient-portal/appointments
 * Get patient's appointments
 */
router.get('/appointments', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { status, upcoming } = req.query;

    const appointments = await AppointmentBookingService.getPatientAppointments(
      account.patientId,
      status as any,
      upcoming === 'true'
    );

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    logger.error({ error }, 'Get appointments error');
    res.status(500).json({
      success: false,
      error: 'Failed to get appointments',
    });
  }
});

/**
 * GET /api/patient-portal/appointments/:bookingId
 * Get single appointment
 */
router.get('/appointments/:bookingId', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { bookingId } = req.params;

    const booking = await AppointmentBookingService.getBooking(bookingId, account.patientId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    logger.error({ error }, 'Get appointment error');
    res.status(500).json({
      success: false,
      error: 'Failed to get appointment',
    });
  }
});

/**
 * POST /api/patient-portal/appointments/:bookingId/cancel
 * Cancel an appointment
 */
router.post('/appointments/:bookingId/cancel', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { bookingId } = req.params;
    const { reason } = req.body;

    const result = await AppointmentBookingService.cancelAppointment(
      bookingId,
      account.patientId,
      reason
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Cancel appointment error');
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment',
    });
  }
});

/**
 * POST /api/patient-portal/appointments/:bookingId/reschedule
 * Reschedule an appointment
 */
router.post('/appointments/:bookingId/reschedule', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { bookingId } = req.params;
    const { date, startTime } = req.body;

    if (!date || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Date and start time required',
      });
    }

    const result = await AppointmentBookingService.rescheduleAppointment(
      bookingId,
      account.patientId,
      new Date(date),
      startTime
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      booking: result.booking,
      message: 'Appointment rescheduled successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Reschedule appointment error');
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule appointment',
    });
  }
});

// ========== Medical Records Routes ==========

/**
 * GET /api/patient-portal/records
 * Get patient's medical records
 */
router.get('/records', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { type, startDate, endDate } = req.query;

    const filters: any = {};
    if (type) filters.type = type;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const records = await PatientPortalService.getMedicalRecords(account.patientId, filters);

    res.json({
      success: true,
      records,
    });
  } catch (error) {
    logger.error({ error }, 'Get medical records error');
    res.status(500).json({
      success: false,
      error: 'Failed to get medical records',
    });
  }
});

/**
 * GET /api/patient-portal/records/:recordId
 * Get single medical record
 */
router.get('/records/:recordId', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { recordId } = req.params;

    const record = await PatientPortalService.getMedicalRecord(recordId, account.patientId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found or access denied',
      });
    }

    res.json({
      success: true,
      record,
    });
  } catch (error) {
    logger.error({ error }, 'Get medical record error');
    res.status(500).json({
      success: false,
      error: 'Failed to get medical record',
    });
  }
});

/**
 * POST /api/patient-portal/records/download
 * Request records download
 */
router.post('/records/download', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { recordIds } = req.body;

    if (!recordIds || !Array.isArray(recordIds)) {
      return res.status(400).json({
        success: false,
        error: 'Record IDs array required',
      });
    }

    const result = await PatientPortalService.requestRecordsDownload(
      account.patientId,
      recordIds
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      downloadUrl: result.downloadUrl,
    });
  } catch (error) {
    logger.error({ error }, 'Request records download error');
    res.status(500).json({
      success: false,
      error: 'Failed to request records download',
    });
  }
});

// ========== Prescription Routes ==========

/**
 * GET /api/patient-portal/prescriptions
 * Get patient's prescriptions
 */
router.get('/prescriptions', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { activeOnly } = req.query;

    const prescriptions = await PatientPortalService.getPrescriptions(
      account.patientId,
      activeOnly === 'true'
    );

    res.json({
      success: true,
      prescriptions,
    });
  } catch (error) {
    logger.error({ error }, 'Get prescriptions error');
    res.status(500).json({
      success: false,
      error: 'Failed to get prescriptions',
    });
  }
});

/**
 * POST /api/patient-portal/prescriptions/:prescriptionId/refill
 * Request prescription refill
 */
router.post('/prescriptions/:prescriptionId/refill', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { prescriptionId } = req.params;
    const { pharmacy } = req.body;

    const result = await PatientPortalService.requestRefill(
      prescriptionId,
      account.patientId,
      pharmacy
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Refill request submitted successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Request refill error');
    res.status(500).json({
      success: false,
      error: 'Failed to request refill',
    });
  }
});

// ========== Messaging Routes ==========

/**
 * GET /api/patient-portal/messages/conversations
 * Get patient's conversations
 */
router.get('/messages/conversations', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;

    const conversations = await PatientPortalService.getConversations(account.patientId);

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    logger.error({ error }, 'Get conversations error');
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations',
    });
  }
});

/**
 * POST /api/patient-portal/messages/conversations
 * Start new conversation
 */
router.post('/messages/conversations', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { providerId, subject, message } = req.body;

    if (!providerId || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID, subject, and message required',
      });
    }

    const result = await PatientPortalService.startConversation(
      account.patientId,
      providerId,
      subject,
      message
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      conversation: result.conversation,
    });
  } catch (error) {
    logger.error({ error }, 'Start conversation error');
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation',
    });
  }
});

/**
 * GET /api/patient-portal/messages/conversations/:conversationId
 * Get messages in conversation
 */
router.get('/messages/conversations/:conversationId', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { conversationId } = req.params;

    const messages = await PatientPortalService.getMessages(conversationId, account.patientId);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    logger.error({ error }, 'Get messages error');
    res.status(500).json({
      success: false,
      error: 'Failed to get messages',
    });
  }
});

/**
 * POST /api/patient-portal/messages/conversations/:conversationId
 * Send message in conversation
 */
router.post('/messages/conversations/:conversationId', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { conversationId } = req.params;
    const { body, attachments } = req.body;

    if (!body) {
      return res.status(400).json({
        success: false,
        error: 'Message body required',
      });
    }

    const result = await PatientPortalService.sendMessage(
      account.patientId,
      conversationId,
      body,
      attachments
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error({ error }, 'Send message error');
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
});

// ========== Bills & Payments Routes ==========

/**
 * GET /api/patient-portal/bills
 * Get patient's bills
 */
router.get('/bills', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { unpaidOnly } = req.query;

    const bills = await PatientPortalService.getBills(account.patientId, unpaidOnly === 'true');

    res.json({
      success: true,
      bills,
    });
  } catch (error) {
    logger.error({ error }, 'Get bills error');
    res.status(500).json({
      success: false,
      error: 'Failed to get bills',
    });
  }
});

/**
 * GET /api/patient-portal/bills/:billId
 * Get single bill
 */
router.get('/bills/:billId', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { billId } = req.params;

    const bill = await PatientPortalService.getBill(billId, account.patientId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found',
      });
    }

    res.json({
      success: true,
      bill,
    });
  } catch (error) {
    logger.error({ error }, 'Get bill error');
    res.status(500).json({
      success: false,
      error: 'Failed to get bill',
    });
  }
});

/**
 * POST /api/patient-portal/bills/:billId/pay
 * Make payment on bill
 */
router.post('/bills/:billId/pay', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { billId } = req.params;
    const { amount, method, paymentDetails } = req.body;

    if (!amount || !method || !paymentDetails) {
      return res.status(400).json({
        success: false,
        error: 'Amount, method, and payment details required',
      });
    }

    const result = await PatientPortalService.makePayment(
      billId,
      account.patientId,
      amount,
      method,
      paymentDetails
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      payment: result.payment,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Make payment error');
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
    });
  }
});

/**
 * POST /api/patient-portal/bills/:billId/payment-plan
 * Request payment plan
 */
router.post('/bills/:billId/payment-plan', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;
    const { billId } = req.params;
    const { proposedMonthlyPayment } = req.body;

    if (!proposedMonthlyPayment) {
      return res.status(400).json({
        success: false,
        error: 'Proposed monthly payment required',
      });
    }

    const result = await PatientPortalService.requestPaymentPlan(
      billId,
      account.patientId,
      proposedMonthlyPayment
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Payment plan request submitted. You will be contacted shortly.',
    });
  } catch (error) {
    logger.error({ error }, 'Request payment plan error');
    res.status(500).json({
      success: false,
      error: 'Failed to request payment plan',
    });
  }
});

/**
 * GET /api/patient-portal/payments
 * Get payment history
 */
router.get('/payments', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;

    const payments = await PatientPortalService.getPaymentHistory(account.patientId);

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    logger.error({ error }, 'Get payment history error');
    res.status(500).json({
      success: false,
      error: 'Failed to get payment history',
    });
  }
});

// ========== Dashboard Route ==========

/**
 * GET /api/patient-portal/dashboard
 * Get patient dashboard summary
 */
router.get('/dashboard', authenticatePatient, async (req, res) => {
  try {
    const account = (req as any).patientAccount;

    const dashboard = await PatientPortalService.getDashboard(account.patientId);

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    logger.error({ error }, 'Get dashboard error');
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard',
    });
  }
});

export default router;
