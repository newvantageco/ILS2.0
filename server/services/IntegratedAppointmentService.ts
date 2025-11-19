/**
 * Integrated Appointment Service for ILS 2.0
 * 
 * Enriches appointment data with:
 * - Patient details
 * - Practitioner information
 * - Clinical status (exam, prescription)
 * - Dispensing status (order)
 * - Real-time workflow stage
 */

import { logger } from '../utils/logger';
import { db } from '../db';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

export interface IntegratedAppointment {
  // Core appointment data
  id: string;
  companyId: string;
  patientId: string;
  practitionerId: string | null;
  
  // Appointment details
  title: string;
  description: string | null;
  type: string;
  status: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  location: string | null;
  notes: string | null;
  
  // Enriched patient data
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
    lastVisit?: Date;
  };
  
  // Practitioner data
  practitioner: {
    id: string;
    name: string;
    role: string;
    gocNumber?: string;
  } | null;
  
  // Clinical context
  clinical?: {
    hasActiveExam: boolean;
    examId?: string;
    examStatus?: string;
    hasPrescription: boolean;
    prescriptionId?: string;
    prescriptionSigned: boolean;
    signedAt?: Date;
  };
  
  // Dispensing context
  dispensing?: {
    hasOrder: boolean;
    orderId?: string;
    orderStatus?: string;
    orderTotal?: number;
    readyForCollection: boolean;
  };
  
  // Real-time workflow status
  realtimeStatus: {
    currentStage: 'scheduled' | 'checked_in' | 'in_pretest' | 'in_exam' | 'ready_for_dispense' | 'dispensing' | 'completed';
    lastUpdate: Date;
    nextAction?: string;
    isRunningLate: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface IntegratedAppointmentFilters {
  companyId: string;
  startDate?: Date;
  endDate?: Date;
  practitionerId?: string;
  patientId?: string;
  status?: string;
  stage?: string;
}

export class IntegratedAppointmentService {
  /**
   * Get single appointment with all enriched data
   */
  async getIntegratedAppointment(id: string): Promise<IntegratedAppointment | null> {
    try {
      // Fetch appointment with patient and practitioner using JOINs
      const result = await db
        .select({
          // Appointment fields
          id: schema.appointments.id,
          companyId: schema.appointments.companyId,
          patientId: schema.appointments.patientId,
          practitionerId: schema.appointments.practitionerId,
          title: schema.appointments.title,
          description: schema.appointments.description,
          type: schema.appointments.type,
          status: schema.appointments.status,
          startTime: schema.appointments.startTime,
          endTime: schema.appointments.endTime,
          duration: schema.appointments.duration,
          location: schema.appointments.location,
          notes: schema.appointments.notes,
          createdAt: schema.appointments.createdAt,
          updatedAt: schema.appointments.updatedAt,
          createdBy: schema.appointments.createdBy,
          
          // Patient fields
          patientFirstName: schema.users.firstName,
          patientLastName: schema.users.lastName,
          patientEmail: schema.users.email,
          patientPhone: schema.users.contactPhone,
        })
        .from(schema.appointments)
        .leftJoin(schema.users, eq(schema.appointments.patientId, schema.users.id))
        .where(eq(schema.appointments.id, id))
        .limit(1);
      
      if (!result || result.length === 0) {
        return null;
      }
      
      const apt = result[0];
      
      // Get practitioner details if exists
      let practitioner = null;
      if (apt.practitionerId) {
        const practitionerResult = await db
          .select({
            id: schema.users.id,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            role: schema.users.role,
            gocNumber: schema.users.gocNumber,
          })
          .from(schema.users)
          .where(eq(schema.users.id, apt.practitionerId))
          .limit(1);
        
        if (practitionerResult.length > 0) {
          const pract = practitionerResult[0];
          practitioner = {
            id: pract.id,
            name: `${pract.firstName} ${pract.lastName}`,
            role: pract.role || 'ecp',
            gocNumber: pract.gocNumber || undefined,
          };
        }
      }
      
      // Check clinical status (exam and prescription)
      const clinical = await this.getClinicalStatus(id);
      
      // Check dispensing status (orders)
      const dispensing = await this.getDispensingStatus(id);
      
      // Calculate real-time workflow status
      const realtimeStatus = this.calculateRealtimeStatus(apt, clinical, dispensing);
      
      // Build integrated appointment object
      const integrated: IntegratedAppointment = {
        id: apt.id,
        companyId: apt.companyId!,
        patientId: apt.patientId!,
        practitionerId: apt.practitionerId,
        title: apt.title,
        description: apt.description,
        type: apt.type,
        status: apt.status,
        startTime: apt.startTime,
        endTime: apt.endTime,
        duration: apt.duration,
        location: apt.location,
        notes: apt.notes,
        
        patient: {
          id: apt.patientId!,
          name: `${apt.patientFirstName || ''} ${apt.patientLastName || ''}`.trim(),
          email: apt.patientEmail || '',
          phone: apt.patientPhone || '',
        },
        
        practitioner,
        clinical,
        dispensing,
        realtimeStatus,
        
        createdAt: apt.createdAt!,
        updatedAt: apt.updatedAt!,
        createdBy: apt.createdBy || undefined,
      };
      
      return integrated;
    } catch (error) {
      logger.error({ error, appointmentId: id }, 'Failed to get integrated appointment');
      throw error;
    }
  }
  
  /**
   * Get multiple appointments with enriched data
   */
  async getIntegratedAppointments(
    filters: IntegratedAppointmentFilters
  ): Promise<IntegratedAppointment[]> {
    try {
      const {
        companyId,
        startDate,
        endDate,
        practitionerId,
        patientId,
        status,
      } = filters;
      
      // Build where conditions
      const conditions = [eq(schema.appointments.companyId, companyId)];
      
      if (startDate) {
        conditions.push(gte(schema.appointments.startTime, startDate));
      }
      if (endDate) {
        conditions.push(lte(schema.appointments.startTime, endDate));
      }
      if (practitionerId) {
        conditions.push(eq(schema.appointments.practitionerId, practitionerId));
      }
      if (patientId) {
        conditions.push(eq(schema.appointments.patientId, patientId));
      }
      if (status) {
        conditions.push(eq(schema.appointments.status, status));
      }
      
      // Fetch appointments
      const appointments = await db
        .select({
          id: schema.appointments.id,
        })
        .from(schema.appointments)
        .where(and(...conditions))
        .orderBy(desc(schema.appointments.startTime))
        .limit(100); // Limit for performance
      
      // Fetch full integrated data for each appointment in parallel
      const integrated = await Promise.all(
        appointments.map(apt => this.getIntegratedAppointment(apt.id))
      );
      
      // Filter out nulls and apply stage filter if specified
      const filtered = integrated.filter((apt): apt is IntegratedAppointment => {
        if (!apt) return false;
        if (filters.stage && apt.realtimeStatus.currentStage !== filters.stage) {
          return false;
        }
        return true;
      });
      
      return filtered;
    } catch (error) {
      logger.error({ error, filters }, 'Failed to get integrated appointments');
      throw error;
    }
  }
  
  /**
   * Get clinical status for appointment
   */
  private async getClinicalStatus(appointmentId: string) {
    try {
      // Check for examination
      const examResult = await db
        .select({
          id: schema.examinations.id,
          status: schema.examinations.status,
        })
        .from(schema.examinations)
        .where(eq(schema.examinations.appointmentId, appointmentId))
        .limit(1);
      
      const exam = examResult[0];
      
      // Check for prescription
      const prescriptionResult = await db
        .select({
          id: schema.prescriptions.id,
          verificationStatus: schema.prescriptions.verificationStatus,
          verifiedAt: schema.prescriptions.verifiedAt,
        })
        .from(schema.prescriptions)
        .where(eq(schema.prescriptions.appointmentId, appointmentId))
        .limit(1);
      
      const prescription = prescriptionResult[0];
      
      if (!exam && !prescription) {
        return undefined;
      }
      
      return {
        hasActiveExam: !!exam,
        examId: exam?.id,
        examStatus: exam?.status,
        hasPrescription: !!prescription,
        prescriptionId: prescription?.id,
        prescriptionSigned: prescription?.verificationStatus === 'verified',
        signedAt: prescription?.verifiedAt || undefined,
      };
    } catch (error) {
      logger.error({ error, appointmentId }, 'Failed to get clinical status');
      return undefined;
    }
  }
  
  /**
   * Get dispensing status for appointment
   */
  private async getDispensingStatus(appointmentId: string) {
    try {
      // Check for orders
      const orderResult = await db
        .select({
          id: schema.orders.id,
          status: schema.orders.status,
          total: schema.orders.totalPrice,
        })
        .from(schema.orders)
        .where(eq(schema.orders.appointmentId, appointmentId))
        .limit(1);
      
      const order = orderResult[0];
      
      if (!order) {
        return undefined;
      }
      
      return {
        hasOrder: true,
        orderId: order.id,
        orderStatus: order.status,
        orderTotal: order.total ? Number(order.total) : undefined,
        readyForCollection: order.status === 'ready_for_collection',
      };
    } catch (error) {
      logger.error({ error, appointmentId }, 'Failed to get dispensing status');
      return undefined;
    }
  }
  
  /**
   * Calculate real-time workflow stage based on appointment state
   */
  private calculateRealtimeStatus(apt: any, clinical: any, dispensing: any) {
    const now = new Date();
    const startTime = new Date(apt.startTime);
    const isLate = now > new Date(startTime.getTime() + 15 * 60000); // 15 min past start
    
    // Completed: Order exists
    if (dispensing?.hasOrder) {
      return {
        currentStage: 'completed' as const,
        lastUpdate: apt.updatedAt || now,
        nextAction: dispensing.readyForCollection ? 'Collection' : undefined,
        isRunningLate: false,
      };
    }
    
    // Ready for dispense: Prescription signed but no order
    if (clinical?.prescriptionSigned && !dispensing?.hasOrder) {
      return {
        currentStage: 'ready_for_dispense' as const,
        lastUpdate: clinical.signedAt || apt.updatedAt || now,
        nextAction: 'Create Order',
        isRunningLate: false,
      };
    }
    
    // In exam: Active exam
    if (clinical?.hasActiveExam && clinical.examStatus === 'in_progress') {
      return {
        currentStage: 'in_exam' as const,
        lastUpdate: apt.updatedAt || now,
        nextAction: 'Complete Exam',
        isRunningLate: false,
      };
    }
    
    // Checked in: Appointment confirmed and time has arrived
    if (apt.status === 'confirmed' && now >= startTime) {
      return {
        currentStage: 'checked_in' as const,
        lastUpdate: apt.updatedAt || now,
        nextAction: 'Start Exam',
        isRunningLate: isLate,
      };
    }
    
    // Scheduled: Default state
    return {
      currentStage: 'scheduled' as const,
      lastUpdate: apt.updatedAt || now,
      nextAction: 'Check In',
      isRunningLate: false,
    };
  }
  
  /**
   * Get appointments by stage (for queue views)
   */
  async getAppointmentsByStage(
    companyId: string,
    stage: 'checked_in' | 'in_exam' | 'ready_for_dispense'
  ): Promise<IntegratedAppointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointments = await this.getIntegratedAppointments({
      companyId,
      startDate: today,
      endDate: tomorrow,
      stage,
    });
    
    return appointments;
  }
}

export const integratedAppointmentService = new IntegratedAppointmentService();
export default integratedAppointmentService;
