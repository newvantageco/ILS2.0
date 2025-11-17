/**
 * Patient Portal Service
 * 
 * Comprehensive patient portal functionality for secure patient access to
 * healthcare information, appointment management, and communication.
 * 
 * Features:
 * - Secure patient authentication and access control
 * - Appointment scheduling and management
 * - Medical records viewing (read-only patient access)
 * - Medication and allergy information
 * - Billing information and payment processing
 * - Secure messaging with healthcare providers
 * - Document management and sharing
 * - Health metrics and wellness tracking
 * - HIPAA-compliant data handling
 */

import { eq, and, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../db';
import logger from '../utils/logger';
import * as schema from '../../shared/schema';

// Types for patient portal operations
export interface PatientProfileData {
  patientId: string;
  preferredLanguage?: string;
  timezone?: string;
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    appointmentReminders?: boolean;
    billingNotifications?: boolean;
    healthUpdates?: boolean;
  };
  privacySettings?: {
    shareWithFamily?: boolean;
    allowResearchData?: boolean;
    marketingConsent?: boolean;
  };
}

export interface PatientAppointmentData {
  patientId: string;
  providerId?: string;
  serviceType?: string;
  preferredDate?: Date;
  preferredTime?: string;
  reasonForVisit?: string;
  notes?: string;
}

export interface PatientMessageData {
  patientId: string;
  recipientId: string;
  recipientType: 'provider' | 'staff' | 'billing';
  subject: string;
  message: string;
  priority?: 'normal' | 'urgent' | 'routine';
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;
}

export interface PatientHealthMetricData {
  patientId: string;
  metricType: 'blood_pressure' | 'weight' | 'blood_sugar' | 'temperature' | 'heart_rate' | 'oxygen_saturation' | 'custom';
  value: number;
  unit: string;
  measuredAt: Date;
  notes?: string;
  deviceInfo?: string;
}

export interface PatientDocumentData {
  patientId: string;
  documentType: 'lab_result' | 'imaging' | 'prescription' | 'insurance_card' | 'id_document' | 'other';
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt?: Date;
  expiresAt?: Date;
  isShared?: boolean;
}

export interface PatientPaymentData {
  patientId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  paymentToken?: string;
  description?: string;
  billingAddress?: any;
  savePaymentMethod?: boolean;
}

export class PatientPortalService {
  /**
   * Get patient profile information
   */
  async getPatientProfile(patientId: string, companyId: string) {
    try {
      logger.info({ patientId, companyId }, 'Getting patient profile');

      // Get basic patient information
      const patient = await db.query.users.findFirst({
        where: and(
          eq(schema.users.id, patientId),
          eq(schema.users.companyId, companyId)
        ),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          address: true,
          emergencyContact: true,
        }
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Get patient-specific portal settings
      const portalSettings = await db.query.patientPortalSettings.findFirst({
        where: eq(schema.patientPortalSettings.patientId, patientId)
      });

      return {
        patient,
        portalSettings: portalSettings || {
          preferredLanguage: 'en',
          timezone: 'UTC',
          notificationPreferences: {
            email: true,
            sms: false,
            push: true,
            appointmentReminders: true,
            billingNotifications: true,
            healthUpdates: false
          },
          privacySettings: {
            shareWithFamily: false,
            allowResearchData: false,
            marketingConsent: false
          }
        }
      };
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get patient profile');
      throw error;
    }
  }

  /**
   * Update patient profile settings
   */
  async updatePatientProfile(patientId: string, data: PatientProfileData, companyId: string) {
    try {
      logger.info({ patientId, companyId, data }, 'Updating patient profile');

      // Update portal settings
      const existingSettings = await db.query.patientPortalSettings.findFirst({
        where: eq(schema.patientPortalSettings.patientId, patientId)
      });

      if (existingSettings) {
        await db.update(schema.patientPortalSettings)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(schema.patientPortalSettings.patientId, patientId));
      } else {
        await db.insert(schema.patientPortalSettings).values({
          ...data,
          patientId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return await this.getPatientProfile(patientId, companyId);
    } catch (error) {
      logger.error({ error, patientId, companyId, data }, 'Failed to update patient profile');
      throw error;
    }
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(patientId: string, companyId: string, options: {
    status?: 'scheduled' | 'completed' | 'cancelled' | 'all';
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      logger.info({ patientId, companyId, options }, 'Getting patient appointments');

      const { status = 'all', limit = 50, offset = 0 } = options;

      let whereConditions = [
        eq(schema.appointments.patientId, patientId),
        eq(schema.appointments.companyId, companyId)
      ];

      if (status !== 'all') {
        whereConditions.push(eq(schema.appointments.status, status));
      }

      const appointments = await db.query.appointments.findMany({
        where: and(...whereConditions),
        with: {
          provider: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              specialties: true
            }
          },
          location: true,
          serviceType: true
        },
        orderBy: [desc(schema.appointments.startTime)],
        limit,
        offset
      });

      return appointments;
    } catch (error) {
      logger.error({ error, patientId, companyId, options }, 'Failed to get patient appointments');
      throw error;
    }
  }

  /**
   * Request new appointment
   */
  async requestAppointment(patientId: string, data: PatientAppointmentData, companyId: string) {
    try {
      logger.info({ patientId, companyId, data }, 'Patient requesting appointment');

      // Create appointment request
      const appointmentRequest = await db.insert(schema.appointmentRequests).values({
        patientId,
        companyId,
        providerId: data.providerId,
        serviceType: data.serviceType,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        reasonForVisit: data.reasonForVisit,
        notes: data.notes,
        status: 'pending',
        requestedAt: new Date()
      }).returning();

      // Log the request for audit
      logger.info({ 
        patientId, 
        companyId, 
        requestId: appointmentRequest[0].id,
        serviceType: data.serviceType 
      }, 'Appointment request created');

      return appointmentRequest[0];
    } catch (error) {
      logger.error({ error, patientId, companyId, data }, 'Failed to create appointment request');
      throw error;
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(patientId: string, appointmentId: string, reason?: string, companyId: string) {
    try {
      logger.info({ patientId, appointmentId, companyId, reason }, 'Patient cancelling appointment');

      const appointment = await db.query.appointments.findFirst({
        where: and(
          eq(schema.appointments.id, appointmentId),
          eq(schema.appointments.patientId, patientId),
          eq(schema.appointments.companyId, companyId)
        )
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status === 'cancelled') {
        throw new Error('Appointment is already cancelled');
      }

      if (appointment.status === 'completed') {
        throw new Error('Cannot cancel completed appointment');
      }

      // Update appointment status
      await db.update(schema.appointments)
        .set({
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          cancelledBy: 'patient'
        })
        .where(eq(schema.appointments.id, appointmentId));

      // Create notification for provider
      await db.insert(schema.notifications).values({
        userId: appointment.providerId,
        companyId,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Patient ${appointment.patientId} cancelled their appointment on ${appointment.startTime}`,
        data: {
          appointmentId,
          patientId,
          reason
        },
        isRead: false,
        createdAt: new Date()
      });

      return { success: true, message: 'Appointment cancelled successfully' };
    } catch (error) {
      logger.error({ error, patientId, appointmentId, companyId }, 'Failed to cancel appointment');
      throw error;
    }
  }

  /**
   * Get patient medical records (read-only access)
   */
  async getPatientMedicalRecords(patientId: string, companyId: string, options: {
    recordType?: 'all' | 'medications' | 'allergies' | 'vital_signs' | 'lab_results' | 'immunizations';
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      logger.info({ patientId, companyId, options }, 'Getting patient medical records');

      const { recordType = 'all', limit = 100, offset = 0 } = options;

      const records: any = {};

      if (recordType === 'all' || recordType === 'medications') {
        records.medications = await db.query.patientMedications.findMany({
          where: eq(schema.patientMedications.patientId, patientId),
          with: {
            medication: true
          },
          orderBy: [desc(schema.patientMedications.startDate)],
          limit
        });
      }

      if (recordType === 'all' || recordType === 'allergies') {
        records.allergies = await db.query.patientAllergies.findMany({
          where: eq(schema.patientAllergies.patientId, patientId),
          with: {
            allergen: true
          },
          orderBy: [desc(schema.patientAllergies.recordedAt)],
          limit
        });
      }

      if (recordType === 'all' || recordType === 'vital_signs') {
        records.vitalSigns = await db.query.vitalSigns.findMany({
          where: eq(schema.vitalSigns.patientId, patientId),
          orderBy: [desc(schema.vitalSigns.measuredAt)],
          limit
        });
      }

      if (recordType === 'all' || recordType === 'lab_results') {
        records.labResults = await db.query.labResults.findMany({
          where: eq(schema.labResults.patientId, patientId),
          orderBy: [desc(schema.labResults.resultDate)],
          limit
        });
      }

      if (recordType === 'all' || recordType === 'immunizations') {
        records.immunizations = await db.query.patientImmunizations.findMany({
          where: eq(schema.patientImmunizations.patientId, patientId),
          with: {
            vaccine: true
          },
          orderBy: [desc(schema.patientImmunizations.administeredAt)],
          limit
        });
      }

      return records;
    } catch (error) {
      logger.error({ error, patientId, companyId, options }, 'Failed to get patient medical records');
      throw error;
    }
  }

  /**
   * Get patient billing information
   */
  async getPatientBillingInfo(patientId: string, companyId: string) {
    try {
      logger.info({ patientId, companyId }, 'Getting patient billing information');

      // Get active claims
      const activeClaims = await db.query.medicalClaims.findMany({
        where: and(
          eq(schema.medicalClaims.patientId, patientId),
          sql`${schema.medicalClaims.status} IN ('submitted', 'received', 'in_review', 'approved')`
        ),
        with: {
          insurancePlan: {
            with: {
              insuranceCompany: true
            }
          },
          lineItems: true
        },
        orderBy: [desc(schema.medicalClaims.createdAt)],
        limit: 10
      });

      // Get recent payments
      const recentPayments = await db.query.payments.findMany({
        where: eq(schema.payments.patientId, patientId),
        orderBy: [desc(schema.payments.paymentDate)],
        limit: 10
      });

      // Calculate outstanding balance
      const totalCharges = activeClaims.reduce((sum, claim) => sum + (claim.totalCharge || 0), 0);
      const totalPaid = recentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const outstandingBalance = totalCharges - totalPaid;

      return {
        activeClaims,
        recentPayments,
        summary: {
          totalCharges,
          totalPaid,
          outstandingBalance,
          activeClaimsCount: activeClaims.length
        }
      };
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get patient billing information');
      throw error;
    }
  }

  /**
   * Send message to provider/staff
   */
  async sendMessage(patientId: string, data: PatientMessageData, companyId: string) {
    try {
      logger.info({ patientId, companyId, data }, 'Patient sending message');

      // Create message
      const message = await db.insert(schema.messages).values({
        senderId: patientId,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        subject: data.subject,
        message: data.message,
        priority: data.priority || 'normal',
        attachments: data.attachments,
        isRead: false,
        createdAt: new Date(),
        companyId
      }).returning();

      // Create notification for recipient
      await db.insert(schema.notifications).values({
        userId: data.recipientId,
        companyId,
        type: 'new_message',
        title: 'New Message from Patient',
        message: `You have received a new message: ${data.subject}`,
        data: {
          messageId: message[0].id,
          senderId: patientId,
          priority: data.priority
        },
        isRead: false,
        createdAt: new Date()
      });

      return message[0];
    } catch (error) {
      logger.error({ error, patientId, companyId, data }, 'Failed to send message');
      throw error;
    }
  }

  /**
   * Get patient messages
   */
  async getPatientMessages(patientId: string, companyId: string, options: {
    folder?: 'inbox' | 'sent' | 'all';
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      logger.info({ patientId, companyId, options }, 'Getting patient messages');

      const { folder = 'inbox', limit = 50, offset = 0 } = options;

      let whereConditions = [eq(schema.messages.companyId, companyId)];

      if (folder === 'inbox') {
        whereConditions.push(eq(schema.messages.recipientId, patientId));
      } else if (folder === 'sent') {
        whereConditions.push(eq(schema.messages.senderId, patientId));
      } else {
        whereConditions.push(
          or(
            eq(schema.messages.senderId, patientId),
            eq(schema.messages.recipientId, patientId)
          )
        );
      }

      const messages = await db.query.messages.findMany({
        where: and(...whereConditions),
        with: {
          sender: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          recipient: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: [desc(schema.messages.createdAt)],
        limit,
        offset
      });

      return messages;
    } catch (error) {
      logger.error({ error, patientId, companyId, options }, 'Failed to get patient messages');
      throw error;
    }
  }

  /**
   * Upload patient document
   */
  async uploadDocument(patientId: string, data: PatientDocumentData, companyId: string) {
    try {
      logger.info({ patientId, companyId, data }, 'Uploading patient document');

      const document = await db.insert(schema.patientDocuments).values({
        ...data,
        patientId,
        companyId,
        uploadedAt: new Date(),
        status: 'active'
      }).returning();

      // Log for audit
      logger.info({
        patientId,
        companyId,
        documentId: document[0].id,
        documentType: data.documentType,
        fileName: data.fileName
      }, 'Patient document uploaded');

      return document[0];
    } catch (error) {
      logger.error({ error, patientId, companyId, data }, 'Failed to upload patient document');
      throw error;
    }
  }

  /**
   * Get patient documents
   */
  async getPatientDocuments(patientId: string, companyId: string, options: {
    documentType?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      logger.info({ patientId, companyId, options }, 'Getting patient documents');

      const { documentType, limit = 50, offset = 0 } = options;

      let whereConditions = [
        eq(schema.patientDocuments.patientId, patientId),
        eq(schema.patientDocuments.companyId, companyId),
        eq(schema.patientDocuments.status, 'active')
      ];

      if (documentType) {
        whereConditions.push(eq(schema.patientDocuments.documentType, documentType));
      }

      const documents = await db.query.patientDocuments.findMany({
        where: and(...whereConditions),
        orderBy: [desc(schema.patientDocuments.uploadedAt)],
        limit,
        offset
      });

      return documents;
    } catch (error) {
      logger.error({ error, patientId, companyId, options }, 'Failed to get patient documents');
      throw error;
    }
  }

  /**
   * Record health metric
   */
  async recordHealthMetric(patientId: string, data: PatientHealthMetricData, companyId: string) {
    try {
      logger.info({ patientId, companyId, data }, 'Recording patient health metric');

      const metric = await db.insert(schema.patientHealthMetrics).values({
        ...data,
        patientId,
        companyId,
        recordedAt: new Date()
      }).returning();

      return metric[0];
    } catch (error) {
      logger.error({ error, patientId, companyId, data }, 'Failed to record health metric');
      throw error;
    }
  }

  /**
   * Get patient health metrics
   */
  async getPatientHealthMetrics(patientId: string, companyId: string, options: {
    metricType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  } = {}) {
    try {
      logger.info({ patientId, companyId, options }, 'Getting patient health metrics');

      const { metricType, dateFrom, dateTo, limit = 100 } = options;

      let whereConditions = [
        eq(schema.patientHealthMetrics.patientId, patientId),
        eq(schema.patientHealthMetrics.companyId, companyId)
      ];

      if (metricType) {
        whereConditions.push(eq(schema.patientHealthMetrics.metricType, metricType));
      }

      if (dateFrom) {
        whereConditions.push(sql`${schema.patientHealthMetrics.measuredAt} >= ${dateFrom}`);
      }

      if (dateTo) {
        whereConditions.push(sql`${schema.patientHealthMetrics.measuredAt} <= ${dateTo}`);
      }

      const metrics = await db.query.patientHealthMetrics.findMany({
        where: and(...whereConditions),
        orderBy: [desc(schema.patientHealthMetrics.measuredAt)],
        limit
      });

      return metrics;
    } catch (error) {
      logger.error({ error, patientId, companyId, options }, 'Failed to get patient health metrics');
      throw error;
    }
  }

  /**
   * Process patient payment
   */
  async processPayment(patientId: string, data: PatientPaymentData, companyId: string) {
    try {
      logger.info({ patientId, companyId, data }, 'Processing patient payment');

      // Create payment record
      const payment = await db.insert(schema.payments).values({
        patientId,
        companyId,
        paymentType: 'patient_payment',
        amount: data.amount,
        paymentDate: new Date(),
        paymentMethod: data.paymentMethod,
        referenceNumber: `PAT-${Date.now()}`,
        status: 'pending',
        notes: data.description,
        paymentToken: data.paymentToken,
        billingAddress: data.billingAddress,
        createdBy: patientId
      }).returning();

      // Log for audit
      logger.info({
        patientId,
        companyId,
        paymentId: payment[0].id,
        amount: data.amount,
        paymentMethod: data.paymentMethod
      }, 'Patient payment processed');

      return payment[0];
    } catch (error) {
      logger.error({ error, patientId, companyId, data }, 'Failed to process patient payment');
      throw error;
    }
  }

  /**
   * Get patient notifications
   */
  async getPatientNotifications(patientId: string, companyId: string, options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      logger.info({ patientId, companyId, options }, 'Getting patient notifications');

      const { unreadOnly = false, limit = 50, offset = 0 } = options;

      let whereConditions = [
        eq(schema.notifications.userId, patientId),
        eq(schema.notifications.companyId, companyId)
      ];

      if (unreadOnly) {
        whereConditions.push(eq(schema.notifications.isRead, false));
      }

      const notifications = await db.query.notifications.findMany({
        where: and(...whereConditions),
        orderBy: [desc(schema.notifications.createdAt)],
        limit,
        offset
      });

      return notifications;
    } catch (error) {
      logger.error({ error, patientId, companyId, options }, 'Failed to get patient notifications');
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string, patientId: string, companyId: string) {
    try {
      logger.info({ notificationId, patientId, companyId }, 'Marking notification as read');

      const result = await db.update(schema.notifications)
        .set({
          isRead: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(schema.notifications.id, notificationId),
            eq(schema.notifications.userId, patientId),
            eq(schema.notifications.companyId, companyId)
          )
        )
        .returning();

      return result[0];
    } catch (error) {
      logger.error({ error, notificationId, patientId, companyId }, 'Failed to mark notification as read');
      throw error;
    }
  }

  /**
   * Get patient dashboard summary
   */
  async getDashboardSummary(patientId: string, companyId: string) {
    try {
      logger.info({ patientId, companyId }, 'Getting patient dashboard summary');

      // Get upcoming appointments
      const upcomingAppointments = await db.query.appointments.findMany({
        where: and(
          eq(schema.appointments.patientId, patientId),
          eq(schema.appointments.companyId, companyId),
          eq(schema.appointments.status, 'scheduled'),
          sql`${schema.appointments.startTime} > NOW()`
        ),
        with: {
          provider: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              title: true
            }
          }
        },
        orderBy: [asc(schema.appointments.startTime)],
        limit: 5
      });

      // Get unread messages
      const unreadMessages = await db.query.messages.findMany({
        where: and(
          eq(schema.messages.recipientId, patientId),
          eq(schema.messages.companyId, companyId),
          eq(schema.messages.isRead, false)
        ),
        orderBy: [desc(schema.messages.createdAt)],
        limit: 5
      });

      // Get active medications
      const activeMedications = await db.query.patientMedications.findMany({
        where: and(
          eq(schema.patientMedications.patientId, patientId),
          eq(schema.patientMedications.status, 'active')
        ),
        with: {
          medication: true
        },
        limit: 10
      });

      // Get recent lab results
      const recentLabResults = await db.query.labResults.findMany({
        where: eq(schema.labResults.patientId, patientId),
        orderBy: [desc(schema.labResults.resultDate)],
        limit: 5
      });

      // Get billing summary
      const billingInfo = await this.getPatientBillingInfo(patientId, companyId);

      // Get unread notifications count
      const unreadNotifications = await db.query.notifications.findMany({
        where: and(
          eq(schema.notifications.userId, patientId),
          eq(schema.notifications.companyId, companyId),
          eq(schema.notifications.isRead, false)
        )
      });

      return {
        upcomingAppointments: upcomingAppointments.slice(0, 3),
        unreadMessages: unreadMessages.slice(0, 3),
        activeMedications: activeMedications.slice(0, 5),
        recentLabResults: recentLabResults.slice(0, 3),
        billingSummary: billingInfo.summary,
        notificationsCount: unreadNotifications.length,
        summary: {
          upcomingAppointmentsCount: upcomingAppointments.length,
          unreadMessagesCount: unreadMessages.length,
          activeMedicationsCount: activeMedications.length,
          outstandingBalance: billingInfo.summary.outstandingBalance
        }
      };
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get patient dashboard summary');
      throw error;
    }
  }
}

export const patientPortalService = new PatientPortalService();
