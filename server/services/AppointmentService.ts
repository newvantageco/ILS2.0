/**
 * Appointment Scheduling Service for ILS 2.0
 * 
 * Comprehensive appointment management system including:
 * - Appointment scheduling and management
 * - Resource booking (test rooms, equipment)
 * - Availability management
 * - Automated reminders
 * - Waitlist management
 * - Calendar integration
 */

import { logger } from '../utils/logger';
import { db } from '../db';
import { eq, and, gte, lte, between, desc, asc, sql, count, isNull, or } from 'drizzle-orm';
import * as schema from '@shared/schema';
import type { 
  Appointment, 
  InsertAppointment, 
  AppointmentResource, 
  InsertAppointmentResource,
  AppointmentAvailability,
  InsertAppointmentAvailability,
  AppointmentReminder,
  InsertAppointmentReminder,
  AppointmentWaitlist,
  InsertAppointmentWaitlist
} from '@shared/schema';

export interface AppointmentSearchParams {
  companyId?: string;
  patientId?: string;
  practitionerId?: string;
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AvailabilityCheckParams {
  resourceId: string;
  resourceType: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string;
}

export interface ScheduleOptions {
  allowOverlapping?: boolean;
  requireConfirmation?: boolean;
  sendReminders?: boolean;
  bufferTime?: number; // minutes between appointments
}

export class AppointmentService {
  /**
   * Create a new appointment
   */
  async createAppointment(data: InsertAppointment, options: ScheduleOptions = {}): Promise<Appointment> {
    try {
      const {
        allowOverlapping = false,
        requireConfirmation = false,
        sendReminders = true,
        bufferTime = 15
      } = options;

      // Validate appointment time
      if (data.endTime <= data.startTime) {
        throw new Error('End time must be after start time');
      }

      // Check for conflicts if overlapping is not allowed
      if (!allowOverlapping && data.practitionerId) {
        const hasConflict = await this.checkPractitionerAvailability(
          data.practitionerId,
          data.startTime,
          data.endTime,
          data.companyId!
        );

        if (hasConflict) {
          throw new Error('Practitioner is not available at the requested time');
        }
      }

      // Check resource availability
      if (data.companyId) {
        const resourceConflicts = await this.checkResourceAvailability({
          resourceId: data.practitionerId || 'default',
          resourceType: 'practitioner',
          startTime: data.startTime,
          endTime: data.endTime
        });

        if (resourceConflicts.length > 0 && !allowOverlapping) {
          throw new Error('Resource is not available at the requested time');
        }
      }

      // Set default status
      const appointmentData = {
        ...data,
        status: requireConfirmation ? 'scheduled' : 'confirmed',
        updatedAt: new Date()
      };

      // Create appointment
      const [appointment] = await db
        .insert(schema.appointments)
        .values(appointmentData)
        .returning();

      logger.info({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        practitionerId: appointment.practitionerId,
        startTime: appointment.startTime 
      }, 'Appointment created');

      // Schedule reminders if requested
      if (sendReminders && data.companyId) {
        await this.scheduleReminders(appointment.id, data.startTime);
      }

      return appointment;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create appointment');
      throw error;
    }
  }

  /**
   * Get appointments with filtering and pagination
   */
  async getAppointments(params: AppointmentSearchParams = {}): Promise<{
    appointments: Appointment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        companyId,
        patientId,
        practitionerId,
        status,
        type,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = params;

      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [];
      
      if (companyId) conditions.push(eq(schema.appointments.companyId, companyId));
      if (patientId) conditions.push(eq(schema.appointments.patientId, patientId));
      if (practitionerId) conditions.push(eq(schema.appointments.practitionerId, practitionerId));
      if (status) conditions.push(eq(schema.appointments.status, status));
      if (type) conditions.push(eq(schema.appointments.type, type));
      if (startDate) conditions.push(gte(schema.appointments.startTime, startDate));
      if (endDate) conditions.push(lte(schema.appointments.startTime, endDate));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(schema.appointments)
        .where(whereClause);

      // Get appointments
      const appointments = await db
        .select()
        .from(schema.appointments)
        .where(whereClause)
        .orderBy(desc(schema.appointments.startTime))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(Number(totalCount) / limit);

      return {
        appointments,
        total: Number(totalCount),
        page,
        totalPages
      };
    } catch (error) {
      logger.error({ error, params }, 'Failed to get appointments');
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const [appointment] = await db
        .select()
        .from(schema.appointments)
        .where(eq(schema.appointments.id, id))
        .limit(1);

      return appointment || null;
    } catch (error) {
      logger.error({ error, id }, 'Failed to get appointment by ID');
      throw error;
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(id: string, data: Partial<InsertAppointment>): Promise<Appointment> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const [appointment] = await db
        .update(schema.appointments)
        .set(updateData)
        .where(eq(schema.appointments.id, id))
        .returning();

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      logger.info({
        appointmentId: id,
        changes: Object.keys(data)
      }, 'Appointment updated');

      return appointment;
    } catch (error) {
      logger.error({ error, id, data }, 'Failed to update appointment');
      throw error;
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string, reason: string, cancelledBy: string): Promise<Appointment> {
    try {
      const [appointment] = await db
        .update(schema.appointments)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy,
          cancellationReason: reason,
          updatedAt: new Date()
        })
        .where(eq(schema.appointments.id, id))
        .returning();

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Cancel scheduled reminders
      await this.cancelReminders(id);

      logger.info({
        appointmentId: id, 
        reason, 
        cancelledBy 
      }, 'Appointment cancelled');

      return appointment;
    } catch (error) {
      logger.error({ error, id, reason }, 'Failed to cancel appointment');
      throw error;
    }
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    id: string, 
    newStartTime: Date, 
    newEndTime: Date,
    rescheduledBy: string
  ): Promise<Appointment> {
    try {
      // Get original appointment
      const originalAppointment = await this.getAppointmentById(id);
      if (!originalAppointment) {
        throw new Error('Appointment not found');
      }

      // Check availability for new time
      if (originalAppointment.practitionerId && originalAppointment.companyId) {
        const hasConflict = await this.checkPractitionerAvailability(
          originalAppointment.practitionerId,
          newStartTime,
          newEndTime,
          originalAppointment.companyId,
          id // Exclude current appointment from conflict check
        );

        if (hasConflict) {
          throw new Error('Practitioner is not available at the requested time');
        }
      }

      // Create new appointment
      const newAppointment = await this.createAppointment({
        ...originalAppointment,
        startTime: newStartTime,
        endTime: newEndTime,
        rescheduledFrom: id,
        status: 'scheduled'
      });

      // Update original appointment
      await this.updateAppointment(id, {
        status: 'rescheduled',
        rescheduledTo: newAppointment.id
      });

      // Reschedule reminders
      await this.cancelReminders(id);
      await this.scheduleReminders(newAppointment.id, newStartTime);

      logger.info({
        originalAppointmentId: id,
        newAppointmentId: newAppointment.id,
        newStartTime,
        rescheduledBy 
      }, 'Appointment rescheduled');

      return newAppointment;
    } catch (error) {
      logger.error({ error, id, newStartTime }, 'Failed to reschedule appointment');
      throw error;
    }
  }

  /**
   * Check practitioner availability
   */
  async checkPractitionerAvailability(
    practitionerId: string,
    startTime: Date,
    endTime: Date,
    companyId: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      const conditions = [
        eq(schema.appointments.practitionerId, practitionerId),
        eq(schema.appointments.companyId, companyId),
        sql`${schema.appointments.startTime} < ${endTime}`,
        sql`${schema.appointments.endTime} > ${startTime}`,
        or(
          eq(schema.appointments.status, 'scheduled'),
          eq(schema.appointments.status, 'confirmed'),
          eq(schema.appointments.status, 'in_progress')
        )
      ];

      if (excludeAppointmentId) {
        conditions.push(sql`${schema.appointments.id} != ${excludeAppointmentId}`);
      }

      const [conflict] = await db
        .select()
        .from(schema.appointments)
        .where(and(...conditions))
        .limit(1);

      return !!conflict;
    } catch (error) {
      logger.error({ error, practitionerId, startTime, endTime }, 'Failed to check practitioner availability');
      throw error;
    }
  }

  /**
   * Check resource availability
   */
  async checkResourceAvailability(params: AvailabilityCheckParams): Promise<Array<{
    appointmentId: string;
    startTime: Date;
    endTime: Date;
  }>> {
    try {
      const { resourceId, resourceType, startTime, endTime, excludeAppointmentId } = params;

      const conditions = [
        eq(schema.appointmentResources.resourceId, resourceId),
        eq(schema.appointmentResources.resourceType, resourceType),
        sql`${schema.appointmentResources.startTime} < ${endTime}`,
        sql`${schema.appointmentResources.endTime} > ${startTime}`
      ];

      if (excludeAppointmentId) {
        conditions.push(sql`${schema.appointmentResources.appointmentId} != ${excludeAppointmentId}`);
      }

      const conflicts = await db
        .select({
          appointmentId: schema.appointmentResources.appointmentId,
          startTime: schema.appointmentResources.startTime,
          endTime: schema.appointmentResources.endTime
        })
        .from(schema.appointmentResources)
        .where(and(...conditions));

      return conflicts;
    } catch (error) {
      logger.error({ error, params }, 'Failed to check resource availability');
      throw error;
    }
  }

  /**
   * Get available time slots
   */
  async getAvailableTimeSlots(
    practitionerId: string,
    date: Date,
    companyId: string,
    duration: number = 30
  ): Promise<Array<{
    startTime: Date;
    endTime: Date;
  }>> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get practitioner's availability for this day
      const dayOfWeek = date.getDay();
      const availability = await db
        .select()
        .from(schema.appointmentAvailability)
        .where(and(
          eq(schema.appointmentAvailability.resourceId, practitionerId),
          eq(schema.appointmentAvailability.resourceType, 'practitioner'),
          eq(schema.appointmentAvailability.dayOfWeek, dayOfWeek),
          eq(schema.appointmentAvailability.companyId, companyId),
          lte(schema.appointmentAvailability.validFrom, date),
          or(
            isNull(schema.appointmentAvailability.validUntil),
            gte(schema.appointmentAvailability.validUntil, date)
          ),
          eq(schema.appointmentAvailability.isBlocked, false)
        ));

      // Get existing appointments for this day
      const existingAppointments = await db
        .select({
          startTime: schema.appointments.startTime,
          endTime: schema.appointments.endTime
        })
        .from(schema.appointments)
        .where(and(
          eq(schema.appointments.practitionerId, practitionerId),
          eq(schema.appointments.companyId, companyId),
          gte(schema.appointments.startTime, startOfDay),
          lte(schema.appointments.startTime, endOfDay),
          or(
            eq(schema.appointments.status, 'scheduled'),
            eq(schema.appointments.status, 'confirmed'),
            eq(schema.appointments.status, 'in_progress')
          )
        ))
        .orderBy(asc(schema.appointments.startTime));

      // Calculate available slots
      const availableSlots: Array<{ startTime: Date; endTime: Date }> = [];

      for (const avail of availability) {
        let currentTime = new Date(avail.startTime);
        const endTime = new Date(avail.endTime);

        while (currentTime.getTime() + duration * 60000 <= endTime.getTime()) {
          const slotEndTime = new Date(currentTime.getTime() + duration * 60000);

          // Check if this slot conflicts with existing appointments
          const hasConflict = existingAppointments.some(apt => 
            (currentTime < apt.endTime && slotEndTime > apt.startTime)
          );

          if (!hasConflict) {
            availableSlots.push({
              startTime: new Date(currentTime),
              endTime: slotEndTime
            });
          }

          currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute intervals
        }
      }

      return availableSlots;
    } catch (error) {
      logger.error({ error, practitionerId, date }, 'Failed to get available time slots');
      throw error;
    }
  }

  /**
   * Schedule reminders for an appointment
   */
  async scheduleReminders(appointmentId: string, appointmentTime: Date): Promise<void> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment || !appointment.patientId) {
        return;
      }

      // Get patient details for contact information
      const [patient] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, appointment.patientId))
        .limit(1);

      if (!patient) {
        return;
      }

      // Schedule reminders (24 hours before and 2 hours before)
      const reminderTimes = [
        { offset: 24 * 60 * 60 * 1000, type: 'email' as const },
        { offset: 2 * 60 * 60 * 1000, type: 'sms' as const }
      ];

      for (const reminder of reminderTimes) {
        const scheduledTime = new Date(appointmentTime.getTime() - reminder.offset);
        
        if (scheduledTime > new Date()) {
          await db.insert(schema.appointmentReminders).values({
            appointmentId,
            type: reminder.type,
            scheduledFor: scheduledTime,
            recipientEmail: patient.email || undefined,
            recipientPhone: patient.phone || undefined,
            message: this.generateReminderMessage(appointment, reminder.offset),
            subject: `Appointment Reminder: ${appointment.title}`
          });
        }
      }

      logger.info({
        appointmentId, 
        appointmentTime,
        reminderCount: reminderTimes.length 
      }, 'Reminders scheduled');
    } catch (error) {
      logger.error({ error, appointmentId }, 'Failed to schedule reminders');
      throw error;
    }
  }

  /**
   * Cancel all reminders for an appointment
   */
  async cancelReminders(appointmentId: string): Promise<void> {
    try {
      await db
        .delete(schema.appointmentReminders)
        .where(eq(schema.appointmentReminders.appointmentId, appointmentId));

      logger.info({ appointmentId }, 'Reminders cancelled');
    } catch (error) {
      logger.error({ error, appointmentId }, 'Failed to cancel reminders');
      throw error;
    }
  }

  /**
   * Generate reminder message
   */
  private generateReminderMessage(appointment: Appointment, offsetMs: number): string {
    const timeUntilAppointment = offsetMs / (60 * 60 * 1000); // hours
    const appointmentTime = appointment.startTime.toLocaleString();
    
    return `Reminder: You have an appointment "${appointment.title}" scheduled for ${appointmentTime}. This is your ${timeUntilAppointment}-hour reminder.`;
  }

  /**
   * Add patient to waitlist
   */
  async addToWaitlist(data: InsertAppointmentWaitlist): Promise<AppointmentWaitlist> {
    try {
      const waitlistData = {
        ...data,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [waitlistEntry] = await db
        .insert(schema.appointmentWaitlist)
        .values(waitlistData)
        .returning();

      logger.info({
        waitlistId: waitlistEntry.id,
        patientId: data.patientId,
        appointmentType: data.appointmentType 
      }, 'Added to waitlist');

      return waitlistEntry;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add to waitlist');
      throw error;
    }
  }

  /**
   * Get waitlist entries
   */
  async getWaitlistEntries(companyId: string): Promise<AppointmentWaitlist[]> {
    try {
      const entries = await db
        .select()
        .from(schema.appointmentWaitlist)
        .where(and(
          eq(schema.appointmentWaitlist.companyId, companyId),
          eq(schema.appointmentWaitlist.status, 'active'),
          gte(schema.appointmentWaitlist.expiresAt, new Date())
        ))
        .orderBy(asc(schema.appointmentWaitlist.priority), asc(schema.appointmentWaitlist.createdAt));

      return entries;
    } catch (error) {
      logger.error({ error, companyId }, 'Failed to get waitlist entries');
      throw error;
    }
  }

  /**
   * Fulfill waitlist entry
   */
  async fulfillWaitlistEntry(
    waitlistId: string,
    appointmentId: string
  ): Promise<void> {
    try {
      await db
        .update(schema.appointmentWaitlist)
        .set({
          status: 'fulfilled',
          fulfilledAt: new Date(),
          fulfilledAppointmentId: appointmentId,
          updatedAt: new Date()
        })
        .where(eq(schema.appointmentWaitlist.id, waitlistId));

      logger.info({
        waitlistId, 
        appointmentId 
      }, 'Waitlist entry fulfilled');
    } catch (error) {
      logger.error({ error, waitlistId, appointmentId }, 'Failed to fulfill waitlist entry');
      throw error;
    }
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
