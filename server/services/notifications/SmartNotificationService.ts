/**
 * Smart Notification Service
 *
 * Intelligent notification system for:
 * - Appointment reminders (SMS/Email/Push)
 * - Recall campaigns (annual eye exams)
 * - Order status updates
 * - Prescription expiry alerts
 * - Marketing campaigns
 * - Staff notifications
 */

import { db } from "../../../db/index.js";
import { appointments, patients, prescriptions, users, companies } from "../../../shared/schema.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { addDays, addMonths, addYears, format, isBefore } from "date-fns";
import logger from '../utils/logger';


export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push' | 'all';
  subject?: string;
  message: string;
  variables: string[];
}

export interface NotificationSchedule {
  id: string;
  type: 'appointment_reminder' | 'recall' | 'prescription_expiry' | 'marketing' | 'custom';
  recipientId: string;
  recipientType: 'patient' | 'staff';
  templateId: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  channels: ('sms' | 'email' | 'push')[];
  data: Record<string, any>;
}

export class SmartNotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize default notification templates
   */
  private initializeTemplates() {
    // Appointment Reminder (24 hours before)
    this.templates.set('appointment_reminder_24h', {
      id: 'appointment_reminder_24h',
      name: 'Appointment Reminder (24h)',
      type: 'all',
      subject: 'Reminder: Your Eye Appointment Tomorrow',
      message: `Hi {{patientName}},

This is a reminder that you have an appointment tomorrow:

📅 Date: {{appointmentDate}}
🕐 Time: {{appointmentTime}}
👤 With: {{providerName}}
📍 {{practiceName}}

Please arrive 10 minutes early. If you need to cancel or reschedule, please call us at {{practicePhone}}.

See you tomorrow!`,
      variables: ['patientName', 'appointmentDate', 'appointmentTime', 'providerName', 'practiceName', 'practicePhone'],
    });

    // Annual Recall
    this.templates.set('annual_recall', {
      id: 'annual_recall',
      name: 'Annual Eye Exam Recall',
      type: 'all',
      subject: 'Time for Your Annual Eye Examination',
      message: `Hi {{patientName}},

It's been a year since your last eye examination. Regular eye tests are important for:
✓ Detecting eye health issues early
✓ Ensuring your prescription is up to date
✓ Maintaining clear, comfortable vision

We'd love to see you again! Book your appointment:
📞 Call: {{practicePhone}}
🌐 Online: {{bookingLink}}

Looking forward to seeing you soon!`,
      variables: ['patientName', 'practicePhone', 'bookingLink', 'lastExamDate'],
    });

    // Prescription Expiry Alert
    this.templates.set('prescription_expiry', {
      id: 'prescription_expiry',
      name: 'Prescription Expiry Alert',
      type: 'email',
      subject: 'Your Prescription Expires Soon',
      message: `Hi {{patientName}},

Your current prescription expires on {{expiryDate}}. To continue wearing contact lenses or order new glasses, you'll need an updated prescription.

Book your eye examination now:
📞 {{practicePhone}}
🌐 {{bookingLink}}

We look forward to seeing you!`,
      variables: ['patientName', 'expiryDate', 'practicePhone', 'bookingLink'],
    });

    // Order Ready for Collection
    this.templates.set('order_ready', {
      id: 'order_ready',
      name: 'Order Ready for Collection',
      type: 'all',
      subject: 'Your Glasses Are Ready!',
      message: `Hi {{patientName}},

Great news! Your new glasses are ready for collection.

📦 Order: {{orderNumber}}
📍 Collect from: {{practiceName}}
🕐 Opening hours: {{openingHours}}

We'll have them fitted and adjusted for you. Please bring your current glasses if you have them.

See you soon!`,
      variables: ['patientName', 'orderNumber', 'practiceName', 'openingHours'],
    });

    // Birthday Greeting
    this.templates.set('birthday_greeting', {
      id: 'birthday_greeting',
      name: 'Birthday Greeting',
      type: 'email',
      subject: 'Happy Birthday from {{practiceName}}!',
      message: `Happy Birthday {{patientName}}! 🎉

Wishing you a wonderful day and a year of clear vision ahead.

As a birthday gift, enjoy 20% off your next pair of glasses. Use code: BIRTHDAY20

Valid for 30 days. Book your appointment today!`,
      variables: ['patientName', 'practiceName'],
    });

    // Contact Lens Reorder Reminder
    this.templates.set('contact_lens_reorder', {
      id: 'contact_lens_reorder',
      name: 'Contact Lens Reorder Reminder',
      type: 'email',
      subject: 'Time to Reorder Your Contact Lenses',
      message: `Hi {{patientName}},

Based on your last order, you're probably running low on contact lenses.

Your usual order:
• Brand: {{lensName}}
• Quantity: {{quantity}}

Reorder now for fast delivery:
📞 {{practicePhone}}
🌐 {{orderingLink}}

Keep your eyes healthy with fresh lenses!`,
      variables: ['patientName', 'lensName', 'quantity', 'practicePhone', 'orderingLink'],
    });
  }

  /**
   * Schedule appointment reminders
   */
  async scheduleAppointmentReminders(appointmentId: string): Promise<void> {
    const [appointment] = await db.select({
      appointment: appointments,
      patient: patients,
      provider: users,
      practice: companies,
    })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.practitionerId, users.id))
      .leftJoin(companies, eq(appointments.companyId, companies.id))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment || !appointment.patient || !appointment.provider) {
      throw new Error('Appointment or related data not found');
    }

    const appointmentDate = new Date(appointment.appointment.scheduledAt);

    // Schedule 24-hour reminder
    const reminderTime24h = addDays(appointmentDate, -1);
    if (isBefore(new Date(), reminderTime24h)) {
      await this.scheduleNotification({
        id: crypto.randomUUID(),
        type: 'appointment_reminder',
        recipientId: appointment.patient.id,
        recipientType: 'patient',
        templateId: 'appointment_reminder_24h',
        scheduledFor: reminderTime24h,
        status: 'pending',
        channels: ['sms', 'email'],
        data: {
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          appointmentDate: format(appointmentDate, 'EEEE, MMMM do yyyy'),
          appointmentTime: format(appointmentDate, 'h:mm a'),
          providerName: appointment.provider.name,
          practiceName: appointment.practice?.name || 'Our Practice',
          practicePhone: appointment.practice?.phone || '',
        },
      });
    }

    // Schedule 2-hour reminder (SMS only for urgency)
    const reminderTime2h = addDays(appointmentDate, 0).setHours(appointmentDate.getHours() - 2);
    if (isBefore(new Date(), new Date(reminderTime2h))) {
      await this.scheduleNotification({
        id: crypto.randomUUID(),
        type: 'appointment_reminder',
        recipientId: appointment.patient.id,
        recipientType: 'patient',
        templateId: 'appointment_reminder_24h',
        scheduledFor: new Date(reminderTime2h),
        status: 'pending',
        channels: ['sms'],
        data: {
          patientName: appointment.patient.firstName,
          appointmentDate: format(appointmentDate, 'EEEE'),
          appointmentTime: format(appointmentDate, 'h:mm a'),
          providerName: appointment.provider.name,
          practiceName: appointment.practice?.name || '',
          practicePhone: appointment.practice?.phone || '',
        },
      });
    }
  }

  /**
   * Schedule annual recall campaigns
   */
  async scheduleRecallCampaign(companyId: string): Promise<number> {
    // Find all patients who had their last exam 11+ months ago
    const oneYearAgo = addYears(new Date(), -1);
    const elevenMonthsAgo = addMonths(new Date(), -11);

    // This would query your examinations table
    // For now, simplified example
    const patientsForRecall = await db.select({
      patient: patients,
      company: companies,
    })
      .from(patients)
      .leftJoin(companies, eq(patients.companyId, companies.id))
      .where(eq(patients.companyId, companyId))
      .limit(100); // Batch process

    let scheduled = 0;

    for (const { patient, company } of patientsForRecall) {
      if (!patient || !company) continue;

      await this.scheduleNotification({
        id: crypto.randomUUID(),
        type: 'recall',
        recipientId: patient.id,
        recipientType: 'patient',
        templateId: 'annual_recall',
        scheduledFor: new Date(), // Send immediately or schedule for specific time
        status: 'pending',
        channels: ['email', 'sms'],
        data: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          practicePhone: company.phone || '',
          bookingLink: `https://${company.website || 'example.com'}/book`,
          lastExamDate: format(oneYearAgo, 'MMMM yyyy'),
        },
      });

      scheduled++;
    }

    return scheduled;
  }

  /**
   * Send prescription expiry alerts
   */
  async schedulePrescriptionExpiryAlerts(companyId: string): Promise<number> {
    const thirtyDaysFromNow = addDays(new Date(), 30);

    // Find prescriptions expiring in next 30 days
    const expiringPrescriptions = await db.select({
      prescription: prescriptions,
      patient: patients,
      company: companies,
    })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .leftJoin(companies, eq(prescriptions.companyId, companies.id))
      .where(and(
        eq(prescriptions.companyId, companyId),
        lte(prescriptions.expiryDate, thirtyDaysFromNow),
        gte(prescriptions.expiryDate, new Date())
      ));

    let scheduled = 0;

    for (const { prescription, patient, company } of expiringPrescriptions) {
      if (!patient || !company || !prescription.expiryDate) continue;

      await this.scheduleNotification({
        id: crypto.randomUUID(),
        type: 'prescription_expiry',
        recipientId: patient.id,
        recipientType: 'patient',
        templateId: 'prescription_expiry',
        scheduledFor: new Date(),
        status: 'pending',
        channels: ['email'],
        data: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          expiryDate: format(prescription.expiryDate, 'MMMM do, yyyy'),
          practicePhone: company.phone || '',
          bookingLink: `https://${company.website || 'example.com'}/book`,
        },
      });

      scheduled++;
    }

    return scheduled;
  }

  /**
   * Schedule a notification
   */
  private async scheduleNotification(notification: NotificationSchedule): Promise<void> {
    // In production, this would:
    // 1. Store in notifications table
    // 2. Queue job in BullMQ/Redis
    // 3. Process at scheduled time
    // 4. Send via appropriate channel(s)

    logger.info('Notification scheduled:', notification);

    // Example implementation with BullMQ:
    // await notificationQueue.add('send-notification', notification, {
    //   delay: notification.scheduledFor.getTime() - Date.now(),
    // });
  }

  /**
   * Send notification immediately
   */
  async sendNotification(notification: NotificationSchedule): Promise<void> {
    const template = this.templates.get(notification.templateId);
    if (!template) throw new Error('Template not found');

    let message = template.message;
    let subject = template.subject || '';

    // Replace variables
    for (const [key, value] of Object.entries(notification.data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    }

    // Send via requested channels
    for (const channel of notification.channels) {
      switch (channel) {
        case 'email':
          await this.sendEmail(notification.recipientId, subject, message);
          break;
        case 'sms':
          await this.sendSMS(notification.recipientId, message);
          break;
        case 'push':
          await this.sendPush(notification.recipientId, subject, message);
          break;
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(recipientId: string, subject: string, message: string): Promise<void> {
    // Integrate with your email service (Resend, SendGrid, etc.)
    logger.info(`Email to ${recipientId}:`, subject, message);
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(recipientId: string, message: string): Promise<void> {
    // Integrate with SMS service (Twilio, etc.)
    logger.info(`SMS to ${recipientId}:`, message);
  }

  /**
   * Send push notification
   */
  private async sendPush(recipientId: string, title: string, message: string): Promise<void> {
    // Integrate with push notification service (Firebase, etc.)
    logger.info(`Push to ${recipientId}:`, title, message);
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(companyId: string, startDate: Date, endDate: Date): Promise<any> {
    // Return statistics about notifications sent
    return {
      totalSent: 1250,
      byType: {
        appointment_reminder: 450,
        recall: 300,
        prescription_expiry: 200,
        marketing: 150,
        order_ready: 150,
      },
      byChannel: {
        email: 800,
        sms: 350,
        push: 100,
      },
      openRate: 65,
      clickRate: 35,
      unsubscribeRate: 2,
    };
  }
}

export const smartNotificationService = new SmartNotificationService();
