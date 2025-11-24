/**
 * Patient Activity Logger
 * Comprehensive logging system for all patient-related activities
 */

import type { InferInsertModel } from "drizzle-orm";
import type { patientActivityLog } from "@shared/schema";
import { storage } from "../storage.js";
import logger from '../utils/logger';


type ActivityType = 
  | "profile_created"
  | "profile_updated"
  | "examination_scheduled"
  | "examination_completed"
  | "prescription_issued"
  | "order_placed"
  | "order_updated"
  | "order_completed"
  | "contact_lens_fitted"
  | "recall_sent"
  | "appointment_booked"
  | "appointment_cancelled"
  | "payment_received"
  | "refund_issued"
  | "complaint_logged"
  | "complaint_resolved"
  | "consent_updated"
  | "document_uploaded"
  | "note_added"
  | "referral_made"
  | "communication_sent";

interface LogActivityParams {
  companyId: string;
  patientId: string;
  activityType: ActivityType;
  activityTitle: string;
  activityDescription?: string;
  activityData?: Record<string, any>;
  
  // Related records
  orderId?: string;
  examinationId?: string;
  prescriptionId?: string;
  
  // Change tracking
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
  changedFields?: string[];
  
  // Actor information
  performedBy: string; // User ID or "system"
  performedByName?: string;
  performedByRole?: string;
  
  // Request metadata
  ipAddress?: string;
  userAgent?: string;
  source?: "web" | "mobile" | "api" | "system";
}

export class PatientActivityLogger {
  /**
   * Log a patient activity
   */
  static async logActivity(params: LogActivityParams): Promise<void> {
    try {
      const activity: InferInsertModel<typeof patientActivityLog> = {
        companyId: params.companyId,
        patientId: params.patientId,
        activityType: params.activityType,
        activityTitle: params.activityTitle,
        activityDescription: params.activityDescription,
        activityData: params.activityData,
        
        orderId: params.orderId,
        examinationId: params.examinationId,
        prescriptionId: params.prescriptionId,
        
        changesBefore: params.changesBefore,
        changesAfter: params.changesAfter,
        changedFields: params.changedFields,
        
        performedBy: params.performedBy,
        performedByName: params.performedByName,
        performedByRole: params.performedByRole,
        
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        source: params.source || "web",
      };
      
      await storage.createPatientActivity(activity);
    } catch (error) {
      // Log error but don't throw - activity logging should not break main operations
      logger.error("Error logging patient activity:", error);
    }
  }
  
  /**
   * Log patient profile creation
   */
  static async logProfileCreated(
    companyId: string,
    patientId: string,
    patientData: Record<string, any>,
    performedBy: string,
    performedByName?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.logActivity({
      companyId,
      patientId,
      activityType: "profile_created",
      activityTitle: "Patient profile created",
      activityDescription: `New patient: ${patientData.name}`,
      activityData: patientData,
      changesAfter: patientData,
      performedBy,
      performedByName,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }
  
  /**
   * Log patient profile update
   */
  static async logProfileUpdated(
    companyId: string,
    patientId: string,
    changesBefore: Record<string, any>,
    changesAfter: Record<string, any>,
    performedBy: string,
    performedByName?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    // Identify changed fields
    const changedFields = Object.keys(changesAfter).filter(
      key => JSON.stringify(changesBefore[key]) !== JSON.stringify(changesAfter[key])
    );
    
    if (changedFields.length === 0) {
      return; // No actual changes
    }
    
    await this.logActivity({
      companyId,
      patientId,
      activityType: "profile_updated",
      activityTitle: "Patient profile updated",
      activityDescription: `Updated fields: ${changedFields.join(", ")}`,
      changesBefore,
      changesAfter,
      changedFields,
      performedBy,
      performedByName,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }
  
  /**
   * Log order placement
   */
  static async logOrderPlaced(
    companyId: string,
    patientId: string,
    orderId: string,
    orderNumber: string,
    orderData: Record<string, any>,
    performedBy: string,
    performedByName?: string
  ): Promise<void> {
    await this.logActivity({
      companyId,
      patientId,
      orderId,
      activityType: "order_placed",
      activityTitle: `Order ${orderNumber} placed`,
      activityDescription: `Lens type: ${orderData.lensType}, Material: ${orderData.lensMaterial}`,
      activityData: orderData,
      performedBy,
      performedByName,
    });
  }
  
  /**
   * Log order update
   */
  static async logOrderUpdated(
    companyId: string,
    patientId: string,
    orderId: string,
    orderNumber: string,
    oldStatus: string,
    newStatus: string,
    performedBy: string,
    performedByName?: string
  ): Promise<void> {
    await this.logActivity({
      companyId,
      patientId,
      orderId,
      activityType: "order_updated",
      activityTitle: `Order ${orderNumber} status updated`,
      activityDescription: `Status changed from ${oldStatus} to ${newStatus}`,
      changesBefore: { status: oldStatus },
      changesAfter: { status: newStatus },
      changedFields: ["status"],
      performedBy,
      performedByName,
    });
  }
  
  /**
   * Log examination completion
   */
  static async logExaminationCompleted(
    companyId: string,
    patientId: string,
    examinationId: string,
    examinationData: Record<string, any>,
    performedBy: string,
    performedByName?: string
  ): Promise<void> {
    await this.logActivity({
      companyId,
      patientId,
      examinationId,
      activityType: "examination_completed",
      activityTitle: "Eye examination completed",
      activityDescription: `Examination date: ${examinationData.examinationDate || new Date().toISOString()}`,
      activityData: examinationData,
      performedBy,
      performedByName,
    });
  }
  
  /**
   * Log prescription issued
   */
  static async logPrescriptionIssued(
    companyId: string,
    patientId: string,
    prescriptionId: string,
    examinationId: string | undefined,
    prescriptionData: Record<string, any>,
    performedBy: string,
    performedByName?: string
  ): Promise<void> {
    await this.logActivity({
      companyId,
      patientId,
      prescriptionId,
      examinationId,
      activityType: "prescription_issued",
      activityTitle: "Prescription issued",
      activityDescription: `Type: ${prescriptionData.prescriptionType || "Standard"}`,
      activityData: prescriptionData,
      performedBy,
      performedByName,
    });
  }
  
  /**
   * Log communication sent to patient
   */
  static async logCommunicationSent(
    companyId: string,
    patientId: string,
    communicationType: string,
    subject: string,
    performedBy: string = "system"
  ): Promise<void> {
    await this.logActivity({
      companyId,
      patientId,
      activityType: "communication_sent",
      activityTitle: `${communicationType} sent`,
      activityDescription: subject,
      activityData: { type: communicationType, subject },
      performedBy,
      source: "system",
    });
  }
  
  /**
   * Get patient activity history
   */
  static async getPatientHistory(
    patientId: string,
    companyId: string,
    options?: {
      limit?: number;
      activityTypes?: ActivityType[];
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    return await storage.getPatientActivityLog(patientId, companyId, options);
  }
}
