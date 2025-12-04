/**
 * Core Schema - Enums and Base Types
 *
 * Central definitions for enums used across multiple domains.
 * This file should be imported by other schema modules.
 *
 * @module shared/schema/core/enums
 */

import { pgEnum } from "drizzle-orm/pg-core";

// ============================================
// AUTHENTICATION & AUTHORIZATION ENUMS
// ============================================

export const roleEnum = pgEnum("role", [
  "ecp",
  "admin",
  "lab_tech",
  "engineer",
  "supplier",
  "platform_admin",
  "company_admin",
  "dispenser",
  "store_manager"
]);

export const accountStatusEnum = pgEnum("account_status", [
  "pending",
  "active",
  "suspended"
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "pro",
  "premium",
  "enterprise",
  "full",      // Legacy
  "free_ecp"   // Legacy
]);

// ============================================
// ORDER MANAGEMENT ENUMS
// ============================================

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "in_production",
  "quality_check",
  "shipped",
  "completed",
  "on_hold",
  "cancelled"
]);

export const poStatusEnum = pgEnum("po_status", [
  "draft",
  "sent",
  "acknowledged",
  "in_progress",
  "shipped",
  "received",
  "completed",
  "cancelled"
]);

// ============================================
// CLINICAL ENUMS
// ============================================

export const examinationStatusEnum = pgEnum("examination_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled"
]);

export const consultPriorityEnum = pgEnum("consult_priority", [
  "normal",
  "high",
  "urgent"
]);

// ============================================
// APPOINTMENT ENUMS
// ============================================

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled"
]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
  "eye_examination",
  "contact_lens_fitting",
  "frame_selection",
  "follow_up",
  "emergency",
  "consultation",
  "test_room_booking",
  "dispensing",
  "collection"
]);

export const reminderTypeEnum = pgEnum("reminder_type", [
  "email",
  "sms",
  "phone",
  "push_notification",
  "automated_call"
]);

export const resourceTypeEnum = pgEnum("resource_type", [
  "test_room",
  "equipment",
  "practitioner",
  "room",
  "specialist"
]);

// ============================================
// BILLING ENUMS
// ============================================

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "insurance",
  "credit",
  "bank_transfer"
]);

// ============================================
// PRODUCT ENUMS
// ============================================

export const productTypeEnum = pgEnum("product_type", [
  "lens",
  "frame",
  "contact_lens",
  "accessory",
  "solution",
  "service"
]);

// ============================================
// COMMUNICATION ENUMS
// ============================================

export const emailTypeEnum = pgEnum("email_type", [
  "invoice",
  "receipt",
  "prescription_reminder",
  "recall_notification",
  "appointment_reminder",
  "order_confirmation",
  "order_update",
  "marketing",
  "general"
]);

export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed",
  "spam"
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "info",
  "warning",
  "error",
  "success",
  "action_required"
]);

export const notificationSeverityEnum = pgEnum("notification_severity", [
  "low",
  "medium",
  "high",
  "critical"
]);

// ============================================
// ANALYTICS ENUMS
// ============================================

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "order_created",
  "order_updated",
  "quality_issue",
  "equipment_status",
  "material_usage",
  "return_created",
  "non_adapt_reported"
]);

export const qualityIssueTypeEnum = pgEnum("quality_issue_type", [
  "surface_defect",
  "coating_defect",
  "measurement_error",
  "material_defect",
  "processing_error",
  "other"
]);

// ============================================
// EQUIPMENT ENUMS
// ============================================

export const equipmentStatusEnum = pgEnum("equipment_status", [
  "operational",
  "maintenance",
  "calibration",
  "faulty",
  "retired"
]);

export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  "preventive",
  "corrective",
  "calibration",
  "cleaning",
  "inspection"
]);

// ============================================
// DOCUMENT ENUMS
// ============================================

export const documentTypeEnum = pgEnum("document_type", [
  "product_sheet",
  "msds",
  "technical_spec",
  "certification",
  "other"
]);

// ============================================
// COMPANY ENUMS
// ============================================

export const companyTypeEnum = pgEnum("company_type", [
  "ecp", // Eye Care Professional practice
  "lab", // Lens manufacturing lab
  "supplier", // Material/equipment supplier
  "hybrid" // Multiple capabilities
]);

export const companyStatusEnum = pgEnum("company_status", [
  "active",
  "suspended",
  "pending_approval",
  "deactivated"
]);

// ============================================
// PATIENT ENUMS
// ============================================

export const patientActivityTypeEnum = pgEnum("patient_activity_type", [
  "profile_created",
  "profile_updated",
  "examination_scheduled",
  "examination_completed",
  "prescription_issued",
  "order_placed",
  "order_updated",
  "order_completed",
  "contact_lens_fitted",
  "recall_sent",
  "appointment_booked",
  "appointment_cancelled",
  "payment_received",
  "refund_issued",
  "complaint_logged",
  "complaint_resolved",
  "consent_updated",
  "document_uploaded",
  "note_added",
  "referral_made",
  "communication_sent"
]);
