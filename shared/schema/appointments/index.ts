/**
 * Appointments Domain Schema
 *
 * Comprehensive appointment scheduling and management system including:
 * - Appointment booking and scheduling
 * - Provider and resource availability management
 * - Appointment types and configurations
 * - Reminders and notifications
 * - Waitlist management
 * - Calendar settings and customization
 * - Appointment requests (patient-initiated)
 *
 * This domain handles all aspects of appointment scheduling for optometry practices,
 * including eye examinations, contact lens fittings, frame selections, and other
 * appointment types. It supports resource booking (test rooms, equipment, practitioners),
 * automated reminders, and flexible calendar configurations.
 *
 * @module shared/schema/appointments
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  pgEnum,
  integer,
  boolean,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Import external dependencies
import { companies, users } from "../core/tables";
import { patients } from "../patients";

// ============================================
// APPOINTMENTS ENUMS
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

export const cancelledByEnum = pgEnum("cancelled_by", ["patient", "provider", "system"]);

// ============================================
// APPOINTMENT TYPES - Configuration
// ============================================

/**
 * Appointment Types Table
 * Defines types of appointments that can be booked
 */
export const appointmentTypes = pgTable(
  "appointment_types",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    duration: integer("duration").notNull(), // minutes
    price: integer("price"), // in cents
    allowOnlineBooking: boolean("allow_online_booking").notNull().default(true),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("appointment_types_company_idx").on(table.companyId),
    nameIdx: index("appointment_types_name_idx").on(table.name),
  })
);

// ============================================
// PROVIDER AVAILABILITY & SCHEDULING
// ============================================

/**
 * Provider Availability Table
 * Stores provider schedules and available time slots
 */
export const providerAvailability = pgTable(
  "provider_availability",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    providerName: text("provider_name").notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
    startTime: text("start_time").notNull(), // HH:MM
    endTime: text("end_time").notNull(), // HH:MM
    slotDuration: integer("slot_duration").notNull(), // minutes
    breakTimes: jsonb("break_times").$type<Array<{
      start: string;
      end: string;
    }>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("provider_availability_company_idx").on(table.companyId),
    providerIdx: index("provider_availability_provider_idx").on(table.providerId),
    dayOfWeekIdx: index("provider_availability_day_of_week_idx").on(table.dayOfWeek),
  })
);

// ============================================
// APPOINTMENT BOOKINGS - Core Scheduling
// ============================================

/**
 * Appointment Bookings Table
 * Stores patient appointment bookings
 */
export const appointmentBookings = pgTable(
  "appointment_bookings",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    providerName: text("provider_name").notNull(),
    appointmentTypeId: text("appointment_type_id").notNull().references(() => appointmentTypes.id, { onDelete: "restrict" }),
    appointmentType: text("appointment_type").notNull(),

    date: timestamp("date", { withTimezone: true }).notNull(),
    startTime: text("start_time").notNull(), // HH:MM
    endTime: text("end_time").notNull(), // HH:MM
    duration: integer("duration").notNull(), // minutes

    status: appointmentStatusEnum("status").notNull().default("scheduled"),

    reason: text("reason"),
    notes: text("notes"),

    // Confirmation
    confirmationCode: text("confirmation_code").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),

    // Reminders
    reminderSent: boolean("reminder_sent").notNull().default(false),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),

    // Cancellation
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: cancelledByEnum("cancelled_by"),
    cancellationReason: text("cancellation_reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("appointment_bookings_company_idx").on(table.companyId),
    patientIdx: index("appointment_bookings_patient_idx").on(table.patientId),
    providerIdx: index("appointment_bookings_provider_idx").on(table.providerId),
    dateIdx: index("appointment_bookings_date_idx").on(table.date),
    statusIdx: index("appointment_bookings_status_idx").on(table.status),
    confirmationCodeIdx: index("appointment_bookings_confirmation_code_idx").on(table.confirmationCode),
    createdAtIdx: index("appointment_bookings_created_at_idx").on(table.createdAt),
  })
);

// ============================================
// APPOINTMENTS - Comprehensive Management
// ============================================

export const appointments = pgTable(
  "appointments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),

    // Appointment details
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: appointmentTypeEnum("appointment_type").notNull(),
    status: appointmentStatusEnum("appointment_status").notNull().default("scheduled"),

    // Timing
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    duration: integer("duration").notNull(), // in minutes

    // Location and resources
    location: varchar("location", { length: 255 }),
    notes: text("notes"),
    isVirtual: boolean("is_virtual").default(false),
    virtualMeetingLink: text("virtual_meeting_link"),

    // Reminders
    reminderSent: boolean("reminder_sent").default(false),
    reminderType: reminderTypeEnum("reminder_type"),
    reminderTime: timestamp("reminder_time", { withTimezone: true }),

    // Metadata
    createdBy: varchar("created_by").references(() => users.id),
    updatedBy: varchar("updated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

    // Cancellation details
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: varchar("cancelled_by").references(() => users.id),
    cancellationReason: text("cancellation_reason"),

    // Rescheduling details
    rescheduledFrom: varchar("rescheduled_from").references(() => appointments.id),
    rescheduledTo: varchar("rescheduled_to").references(() => appointments.id),

    // Import Tracking (for migrated records)
    externalId: varchar("external_id", { length: 255 }), // Original appointment ID from legacy system
    importSource: varchar("import_source", { length: 100 }),
    importJobId: varchar("import_job_id", { length: 255 }),
    importedAt: timestamp("imported_at", { withTimezone: true }),

    // Soft Delete
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by").references(() => users.id),
  },
  (table) => [
    index("idx_appointments_company").on(table.companyId),
    index("idx_appointments_patient").on(table.patientId),
    index("idx_appointments_practitioner").on(table.practitionerId),
    index("idx_appointments_start_time").on(table.startTime),
    index("idx_appointments_status").on(table.status),
    index("idx_appointments_type").on(table.type),
    index("idx_appointments_created_at").on(table.createdAt),
  ],
);

// ============================================
// APPOINTMENT RESOURCES - Resource Booking
// ============================================

/**
 * Appointment Resources table (for booking test rooms, equipment, etc.)
 */
export const appointmentResources = pgTable(
  "appointment_resources",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: 'cascade' }),
    resourceId: varchar("resource_id").notNull(),
    resourceType: resourceTypeEnum("resource_type").notNull(),
    resourceName: varchar("resource_name", { length: 255 }).notNull(),

    // Resource availability
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),

    // Resource details
    location: varchar("location", { length: 255 }),
    capacity: integer("capacity").default(1),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_appointment_resources_appointment").on(table.appointmentId),
    index("idx_appointment_resources_resource").on(table.resourceId),
    index("idx_appointment_resources_type").on(table.resourceType),
    index("idx_appointment_resources_time").on(table.startTime, table.endTime),
  ],
);

// ============================================
// APPOINTMENT AVAILABILITY - Schedules
// ============================================

/**
 * Appointment Availability (practitioner schedules, resource availability)
 */
export const appointmentAvailability = pgTable(
  "appointment_availability",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    resourceId: varchar("resource_id").notNull(),
    resourceType: resourceTypeEnum("resource_type").notNull(),

    // Availability pattern
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),

    // Recurrence
    isRecurring: boolean("is_recurring").default(true),
    validFrom: date("valid_from").notNull(),
    validUntil: date("valid_until"),

    // Exceptions (blocked times, holidays, etc.)
    isBlocked: boolean("is_blocked").default(false),
    blockReason: text("block_reason"),

    // Metadata
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_appointment_availability_company").on(table.companyId),
    index("idx_appointment_availability_resource").on(table.resourceId),
    index("idx_appointment_availability_type").on(table.resourceType),
    index("idx_appointment_availability_day").on(table.dayOfWeek),
    index("idx_appointment_availability_time").on(table.startTime, table.endTime),
  ],
);

// ============================================
// REMINDERS & NOTIFICATIONS
// ============================================

/**
 * Appointment Reminders
 */
export const appointmentReminders = pgTable(
  "appointment_reminders",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: 'cascade' }),

    // Reminder configuration
    type: reminderTypeEnum("type").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),

    // Recipient details
    recipientEmail: varchar("recipient_email", { length: 255 }),
    recipientPhone: varchar("recipient_phone", { length: 50 }),

    // Status
    status: varchar("status", { length: 50 }).default("pending"), // pending, sent, failed
    attempts: integer("attempts").default(0),
    errorMessage: text("error_message"),

    // Message content
    message: text("message"),
    subject: varchar("subject", { length: 255 }),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_appointment_reminders_appointment").on(table.appointmentId),
    index("idx_appointment_reminders_status").on(table.status),
    index("idx_appointment_reminders_scheduled").on(table.scheduledFor),
    index("idx_appointment_reminders_type").on(table.type),
  ],
);

// ============================================
// WAITLIST MANAGEMENT
// ============================================

/**
 * Appointment Waitlist
 */
export const appointmentWaitlist = pgTable(
  "appointment_waitlist",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),

    // Waitlist request details
    appointmentType: appointmentTypeEnum("appointment_type").notNull(),
    preferredDate: date("preferred_date"),
    preferredTimeRange: varchar("preferred_time_range", { length: 100 }), // morning, afternoon, evening
    flexibility: integer("flexibility").default(3), // days willing to wait

    // Contact preferences
    contactMethod: reminderTypeEnum("contact_method").notNull(),
    contactValue: varchar("contact_value", { length: 255 }).notNull(),

    // Status
    status: varchar("status", { length: 50 }).default("active"), // active, fulfilled, cancelled, expired
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    fulfilledAppointmentId: varchar("fulfilled_appointment_id").references(() => appointments.id),

    // Notes
    notes: text("notes"),
    priority: integer("priority").default(5), // 1 = highest, 10 = lowest

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_appointment_waitlist_company").on(table.companyId),
    index("idx_appointment_waitlist_patient").on(table.patientId),
    index("idx_appointment_waitlist_status").on(table.status),
    index("idx_appointment_waitlist_priority").on(table.priority),
    index("idx_appointment_waitlist_created").on(table.createdAt),
  ],
);

// ============================================
// CALENDAR SETTINGS & CUSTOMIZATION
// ============================================

/**
 * Calendar Settings - company-specific calendar and diary customization
 */
export const calendarSettings = pgTable(
  "calendar_settings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'cascade' }), // null for company-wide settings

    // Time slot configuration
    defaultSlotDuration: integer("default_slot_duration").default(25), // in minutes
    customSlotDurations: jsonb("custom_slot_durations"), // [15, 20, 25, 30, 45, 60] etc.

    // Working hours per day (stored as JSON for flexibility)
    // Format: { monday: { start: "09:00", end: "17:00", breaks: [{start: "12:00", end: "13:00"}] }, ... }
    workingHours: jsonb("working_hours").default(sql`'{
      "monday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "tuesday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "wednesday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "thursday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "friday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "saturday": {"start": "09:00", "end": "13:00", "breaks": []},
      "sunday": {"start": null, "end": null, "breaks": []}
    }'::jsonb`),

    // Display preferences
    diaryViewMode: varchar("diary_view_mode", { length: 50 }).default("day"), // day, week, month
    showWeekends: boolean("show_weekends").default(false),
    timeFormat: varchar("time_format", { length: 10 }).default("24h"), // 12h or 24h
    firstDayOfWeek: integer("first_day_of_week").default(1), // 0 = Sunday, 1 = Monday

    // Booking rules
    minAdvanceBooking: integer("min_advance_booking").default(60), // in minutes
    maxAdvanceBooking: integer("max_advance_booking").default(90), // in days
    allowDoubleBooking: boolean("allow_double_booking").default(false),
    requireDeposit: boolean("require_deposit").default(false),
    depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),

    // Buffer times
    bufferBefore: integer("buffer_before").default(0), // minutes before appointment
    bufferAfter: integer("buffer_after").default(5), // minutes after appointment

    // Cancellation policy
    cancellationWindow: integer("cancellation_window").default(24), // hours before appointment
    allowPatientCancellation: boolean("allow_patient_cancellation").default(true),
    allowPatientReschedule: boolean("allow_patient_reschedule").default(true),

    // Color coding for appointment types (JSON)
    colorScheme: jsonb("color_scheme").default(sql`'{
      "eye_examination": "#3b82f6",
      "contact_lens_fitting": "#10b981",
      "frame_selection": "#f59e0b",
      "follow_up": "#8b5cf6",
      "emergency": "#ef4444",
      "consultation": "#06b6d4"
    }'::jsonb`),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_calendar_settings_company").on(table.companyId),
    index("idx_calendar_settings_practitioner").on(table.practitionerId),
  ],
);

// ============================================
// APPOINTMENT REQUESTS - Patient-Initiated
// ============================================

/**
 * Appointment Requests
 * Patient-initiated appointment requests that require approval
 */
export const appointmentRequests = pgTable("appointment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  providerId: varchar("provider_id").references(() => users.id, { onDelete: 'set null' }),
  serviceType: varchar("service_type"),
  preferredDate: timestamp("preferred_date"),
  preferredTime: varchar("preferred_time"),
  reasonForVisit: text("reason_for_visit"),
  notes: text("notes"),
  status: varchar("status").default("pending"), // pending, approved, denied, scheduled
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by").references(() => users.id, { onDelete: 'set null' }),
  adminNotes: text("admin_notes"),
});

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertAppointmentTypeSchema = createInsertSchema(appointmentTypes);
export const insertProviderAvailabilitySchema = createInsertSchema(providerAvailability);
export const insertAppointmentBookingSchema = createInsertSchema(appointmentBookings);

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
  cancelledBy: true,
  rescheduledFrom: true,
  rescheduledTo: true,
});

export const updateAppointmentSchema = insertAppointmentSchema.partial();

export const insertAppointmentResourceSchema = createInsertSchema(appointmentResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentAvailabilitySchema = createInsertSchema(appointmentAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentReminderSchema = createInsertSchema(appointmentReminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
});

export const insertAppointmentWaitlistSchema = createInsertSchema(appointmentWaitlist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  fulfilledAt: true,
});

export const insertCalendarSettingsSchema = createInsertSchema(calendarSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCalendarSettingsSchema = insertCalendarSettingsSchema.partial();

export const insertAppointmentRequestSchema = createInsertSchema(appointmentRequests);

// ============================================
// TYPESCRIPT TYPES
// ============================================

// Appointment Types
export type AppointmentType = typeof appointmentTypes.$inferSelect;
export type InsertAppointmentType = typeof appointmentTypes.$inferInsert;

// Provider Availability
export type ProviderAvailability = typeof providerAvailability.$inferSelect;
export type InsertProviderAvailability = typeof providerAvailability.$inferInsert;

// Appointment Bookings
export type AppointmentBooking = typeof appointmentBookings.$inferSelect;
export type InsertAppointmentBooking = typeof appointmentBookings.$inferInsert;

// Appointments
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// Appointment Resources
export type AppointmentResource = typeof appointmentResources.$inferSelect;
export type InsertAppointmentResource = typeof appointmentResources.$inferInsert;

// Appointment Availability
export type AppointmentAvailability = typeof appointmentAvailability.$inferSelect;
export type InsertAppointmentAvailability = typeof appointmentAvailability.$inferInsert;

// Appointment Reminders
export type AppointmentReminder = typeof appointmentReminders.$inferSelect;
export type InsertAppointmentReminder = typeof appointmentReminders.$inferInsert;

// Appointment Waitlist
export type AppointmentWaitlist = typeof appointmentWaitlist.$inferSelect;
export type InsertAppointmentWaitlist = typeof appointmentWaitlist.$inferInsert;

// Calendar Settings
export type CalendarSettings = typeof calendarSettings.$inferSelect;
export type InsertCalendarSettings = typeof calendarSettings.$inferInsert;

// Appointment Requests
export type AppointmentRequest = typeof appointmentRequests.$inferSelect;
export type InsertAppointmentRequest = typeof appointmentRequests.$inferInsert;
