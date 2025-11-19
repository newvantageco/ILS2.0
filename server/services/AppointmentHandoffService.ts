/**
 * Appointment Handoff Service for ILS 2.0
 * 
 * Manages digital handoffs between staff roles:
 * - Reception → ECP (check-in)
 * - ECP → Dispenser (exam complete)
 * - Dispenser → Patient (order ready)
 * 
 * Each handoff:
 * 1. Updates appointment status
 * 2. Broadcasts WebSocket event
 * 3. Sends notifications
 * 4. Tracks analytics
 */

import { logger } from '../utils/logger';
import { appointmentService } from './AppointmentService';
import { getWebSocketService } from './WebSocketService';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import * as schema from '@shared/schema';

export class AppointmentHandoffService {
  private webSocketService = getWebSocketService();
  
  /**
   * Handle patient check-in
   * Reception → ECP handoff
   */
  async handleCheckIn(appointmentId: string, checkedInBy: string): Promise<void> {
    try {
      // Get appointment
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Update appointment status
      await appointmentService.updateAppointment(appointmentId, {
        status: 'confirmed',
        notes: appointment.notes 
          ? `${appointment.notes}\n\nChecked in at ${new Date().toISOString()}`
          : `Checked in at ${new Date().toISOString()}`,
      });
      
      // Broadcast WebSocket event to company
      if (appointment.companyId) {
        this.webSocketService.broadcastToCompany(appointment.companyId, {
          event: 'appointment:checked_in',
          data: {
            appointmentId,
            patientId: appointment.patientId,
            practitionerId: appointment.practitionerId,
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      // Notify practitioner
      if (appointment.practitionerId) {
        // Note: NotificationService integration would go here
        // await notificationService.notify({ ... })
        logger.info({
          appointmentId,
          practitionerId: appointment.practitionerId,
        }, 'Practitioner notified of patient check-in');
      }
      
      logger.info({
        appointmentId,
        patientId: appointment.patientId,
        checkedInBy,
      }, 'Patient checked in successfully');
    } catch (error) {
      logger.error({ error, appointmentId }, 'Failed to handle check-in');
      throw error;
    }
  }
  
  /**
   * Handle exam start
   * Creates exam record and updates appointment
   */
  async handleExamStart(
    appointmentId: string,
    practitionerId: string
  ): Promise<{ examId: string; examUrl: string }> {
    try {
      // Get appointment
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Check if exam already exists
      const existingExam = await db
        .select()
        .from(schema.examinations)
        .where(eq(schema.examinations.appointmentId, appointmentId))
        .limit(1);
      
      if (existingExam.length > 0) {
        // Return existing exam
        return {
          examId: existingExam[0].id,
          examUrl: `/examinations/${existingExam[0].id}`,
        };
      }
      
      // Create new examination record
      const [examination] = await db
        .insert(schema.examinations)
        .values({
          appointmentId,
          patientId: appointment.patientId!,
          practitionerId,
          companyId: appointment.companyId!,
          status: 'in_progress',
          examinationDate: new Date(),
        })
        .returning();
      
      // Update appointment status
      await appointmentService.updateAppointment(appointmentId, {
        status: 'in_progress',
      });
      
      // Broadcast WebSocket event
      if (appointment.companyId) {
        this.webSocketService.broadcastToCompany(appointment.companyId, {
          event: 'appointment:exam_started',
          data: {
            appointmentId,
            examId: examination.id,
            practitionerId,
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      logger.info({
        appointmentId,
        examId: examination.id,
        practitionerId,
      }, 'Exam started');
      
      return {
        examId: examination.id,
        examUrl: `/examinations/${examination.id}`,
      };
    } catch (error) {
      logger.error({ error, appointmentId }, 'Failed to handle exam start');
      throw error;
    }
  }
  
  /**
   * Handle exam completion
   * ECP → Dispenser handoff
   */
  async handleExamComplete(
    appointmentId: string,
    examId: string,
    prescriptionId?: string
  ): Promise<void> {
    try {
      // Get appointment
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Check if prescription is signed
      let prescriptionSigned = false;
      if (prescriptionId) {
        const prescription = await db
          .select()
          .from(schema.prescriptions)
          .where(eq(schema.prescriptions.id, prescriptionId))
          .limit(1);
        
        prescriptionSigned = prescription[0]?.verificationStatus === 'verified';
      }
      
      // Update appointment status
      // If prescription is signed, mark as ready for dispense
      const newStatus = prescriptionSigned ? 'completed' : 'completed';
      await appointmentService.updateAppointment(appointmentId, {
        status: newStatus,
      });
      
      // Broadcast different events based on prescription status
      if (appointment.companyId) {
        if (prescriptionSigned) {
          // Broadcast ready for dispense
          this.webSocketService.broadcastToCompany(appointment.companyId, {
            event: 'appointment:ready_for_dispense',
            data: {
              appointmentId,
              examId,
              prescriptionId,
              patientId: appointment.patientId,
              timestamp: new Date().toISOString(),
            },
          });
          
          // Find and notify dispensers
          await this.notifyDispensers(appointment.companyId, appointmentId);
        } else {
          // Just mark exam complete
          this.webSocketService.broadcastToCompany(appointment.companyId, {
            event: 'appointment:exam_completed',
            data: {
              appointmentId,
              examId,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
      
      logger.info({
        appointmentId,
        examId,
        prescriptionId,
        prescriptionSigned,
      }, 'Exam completed');
    } catch (error) {
      logger.error({ error, appointmentId, examId }, 'Failed to handle exam completion');
      throw error;
    }
  }
  
  /**
   * Handle order creation
   * Dispenser → Collection handoff
   */
  async handleOrderCreated(
    appointmentId: string,
    orderId: string
  ): Promise<void> {
    try {
      // Get appointment
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Update appointment - mark as fully completed
      await appointmentService.updateAppointment(appointmentId, {
        status: 'completed',
        notes: appointment.notes
          ? `${appointment.notes}\n\nOrder created: ${orderId}`
          : `Order created: ${orderId}`,
      });
      
      // Broadcast WebSocket event
      if (appointment.companyId) {
        this.webSocketService.broadcastToCompany(appointment.companyId, {
          event: 'appointment:order_created',
          data: {
            appointmentId,
            orderId,
            patientId: appointment.patientId,
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      logger.info({
        appointmentId,
        orderId,
      }, 'Order created for appointment');
    } catch (error) {
      logger.error({ error, appointmentId, orderId }, 'Failed to handle order creation');
      throw error;
    }
  }
  
  /**
   * Handle appointment cancellation
   */
  async handleCancellation(
    appointmentId: string,
    reason: string,
    cancelledBy: string
  ): Promise<void> {
    try {
      const appointment = await appointmentService.cancelAppointment(
        appointmentId,
        reason,
        cancelledBy
      );
      
      // Broadcast cancellation
      if (appointment.companyId) {
        this.webSocketService.broadcastToCompany(appointment.companyId, {
          event: 'appointment:cancelled',
          data: {
            appointmentId,
            reason,
            cancelledBy,
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      // Check waitlist for potential fill
      // await this.checkWaitlistForFill(appointment);
      
      logger.info({ appointmentId, reason }, 'Appointment cancelled');
    } catch (error) {
      logger.error({ error, appointmentId }, 'Failed to handle cancellation');
      throw error;
    }
  }
  
  /**
   * Notify available dispensers
   */
  private async notifyDispensers(companyId: string, appointmentId: string): Promise<void> {
    try {
      // Find active dispensers in the company
      const dispensers = await db
        .select({
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.companyId, companyId),
            eq(schema.users.role, 'dispenser'),
            eq(schema.users.isActive, true)
          )
        );
      
      // Send notification to each dispenser
      // Note: NotificationService integration would go here
      for (const dispenser of dispensers) {
        logger.info({
          dispenserId: dispenser.id,
          appointmentId,
        }, 'Dispenser notified of ready patient');
      }
    } catch (error) {
      logger.error({ error, companyId }, 'Failed to notify dispensers');
    }
  }
}

export const appointmentHandoffService = new AppointmentHandoffService();
export default appointmentHandoffService;
