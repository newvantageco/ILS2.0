/**
 * Patients Domain Schema
 *
 * Patient management and activity tracking tables.
 * Patients are the core entities for clinical records and orders.
 *
 * @module shared/schema/patients
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { companies, users } from "../core/tables";
import { patientActivityTypeEnum } from "../core/enums";

// ============================================
// PATIENTS - Core Patient Records
// ============================================

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerNumber: varchar("customer_number", { length: 20 }).notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  email: varchar("email"),

  // Contact Information
  phone: varchar("phone", { length: 50 }),
  mobilePhone: varchar("mobile_phone", { length: 50 }),
  workPhone: varchar("work_phone", { length: 50 }),

  // NHS & Reference Numbers
  nhsNumber: varchar("nhs_number"),
  customerReferenceLabel: text("customer_reference_label"),
  customerReferenceNumber: text("customer_reference_number"),

  // Address Information
  fullAddress: jsonb("full_address"),
  addressLine1: varchar("address_line_1", { length: 255 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  postcode: varchar("postcode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("United Kingdom"),

  // Timezone & Location
  timezone: varchar("timezone", { length: 100 }), // Auto-detected timezone (e.g., "Europe/London")
  timezoneOffset: integer("timezone_offset"), // Offset in minutes from UTC
  locale: varchar("locale", { length: 20 }).default("en-GB"), // Language/region preference

  ecpId: varchar("ecp_id").notNull().references(() => users.id),

  // Enhanced Clinical Records
  previousOptician: varchar("previous_optician", { length: 255 }),
  gpName: varchar("gp_name", { length: 255 }),
  gpPractice: varchar("gp_practice", { length: 255 }),
  gpAddress: text("gp_address"),
  gpPhone: varchar("gp_phone", { length: 50 }),

  // Emergency Contact
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  emergencyContactRelationship: varchar("emergency_contact_relationship", { length: 100 }),
  emergencyContactEmail: varchar("emergency_contact_email", { length: 255 }),

  // Medical History & Current Health
  medicalHistory: jsonb("medical_history"), // Array of {condition, date, notes}
  currentMedications: text("current_medications"),
  allergies: text("allergies"), // Medications/substances patient is allergic to
  familyOcularHistory: text("family_ocular_history"),
  systemicConditions: jsonb("systemic_conditions"), // Diabetes, hypertension, etc.

  // Lifestyle & Visual Requirements
  occupation: varchar("occupation", { length: 255 }),
  hobbies: text("hobbies"),
  vduUser: boolean("vdu_user").default(false),
  vduHoursPerDay: decimal("vdu_hours_per_day", { precision: 4, scale: 1 }),
  drivingRequirement: boolean("driving_requirement").default(false),
  sportActivities: text("sport_activities"),
  readingHabits: text("reading_habits"),

  // Contact Lens Information
  contactLensWearer: boolean("contact_lens_wearer").default(false),
  contactLensType: varchar("contact_lens_type", { length: 100 }), // Daily, monthly, toric, etc.
  contactLensBrand: varchar("contact_lens_brand", { length: 100 }),
  contactLensCompliance: varchar("contact_lens_compliance", { length: 50 }), // Good, fair, poor

  // Communication Preferences
  preferredContactMethod: varchar("preferred_contact_method", { length: 50 }),
  preferredAppointmentTime: varchar("preferred_appointment_time", { length: 50 }), // Morning, afternoon, evening
  reminderPreference: varchar("reminder_preference", { length: 50 }), // Email, SMS, phone, none

  // Consent & Privacy
  marketingConsent: boolean("marketing_consent").default(false),
  dataSharingConsent: boolean("data_sharing_consent").default(true),
  thirdPartyConsent: boolean("third_party_consent").default(false),
  researchConsent: boolean("research_consent").default(false),

  // Examination Schedule
  lastExaminationDate: timestamp("last_examination_date"),
  nextExaminationDue: timestamp("next_examination_due"),
  recallSchedule: varchar("recall_schedule", { length: 50 }), // Annual, 6-months, 2-years, etc.

  // Financial & Insurance
  insuranceProvider: varchar("insurance_provider", { length: 255 }),
  insurancePolicyNumber: varchar("insurance_policy_number", { length: 100 }),
  nhsExemption: boolean("nhs_exemption").default(false),
  nhsExemptionType: varchar("nhs_exemption_type", { length: 100 }),

  // Patient Status & Notes
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, deceased
  vipPatient: boolean("vip_patient").default(false),
  patientNotes: text("patient_notes"), // General notes about the patient
  internalNotes: text("internal_notes"), // Staff-only notes

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Audit Trail
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  changeHistory: jsonb("change_history").default(sql`'[]'::jsonb`),

  // Import Tracking (for migrated records from Optix, Occuco, Acuity, etc.)
  externalId: varchar("external_id", { length: 255 }), // Original ID from legacy system
  importSource: varchar("import_source", { length: 100 }), // optix, occuco, acuity, manual_csv, etc.
  importJobId: varchar("import_job_id", { length: 255 }), // Reference to migration_jobs.id
  importedAt: timestamp("imported_at"), // When this record was imported

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
});
