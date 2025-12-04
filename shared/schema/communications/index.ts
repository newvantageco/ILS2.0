/**
 * Communications Domain Schema
 *
 * Tables for communication management including:
 * - Email templates
 * - Email logs with tracking
 * - Email tracking events
 * - Message templates and messages
 * - Unsubscribe management
 * - WhatsApp message events
 * - SMS message events
 *
 * @module shared/schema/communications
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { notificationTypeEnum, notificationSeverityEnum } from "../core/enums";
import { companies } from "../core/tables";

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

export const emailEventTypeEnum = pgEnum("email_event_type", [
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "spam",
  "unsubscribed"
]);

export const communicationChannelEnum = pgEnum("communication_channel", [
  "email",
  "sms",
  "push",
  "in_app",
  "whatsapp"
]);

export const messageStatusEnum = pgEnum("message_status", [
  "draft",
  "queued",
  "sending",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed",
  "unsubscribed"
]);

export const messagePriorityEnum = pgEnum("message_priority", [
  "low",
  "normal",
  "high",
  "urgent"
]);

export const messageCategoryEnum = pgEnum("message_category", [
  "transactional",
  "marketing",
  "appointment",
  "reminder",
  "alert"
]);

export const recipientTypeEnum = pgEnum("recipient_type", [
  "patient",
  "user",
  "provider"
]);

export const whatsappMessageStatusEnum = pgEnum("whatsapp_message_status", [
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
  "undelivered"
]);

export const smsMessageStatusEnum = pgEnum("sms_message_status", [
  "queued",
  "sent",
  "delivered",
  "failed",
  "undelivered"
]);

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: notificationSeverityEnum("severity").notNull(),
    target: jsonb("target").notNull(),
    read: boolean("read").default(false).notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_notifications_created_at").on(table.createdAt)],
);

// ============================================
// EMAIL TEMPLATES
// ============================================

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Template details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  emailType: emailTypeEnum("email_type").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),

  // Template variables (e.g., {{customerName}}, {{invoiceNumber}})
  variables: jsonb("variables"),

  // Settings
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false),

  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_templates_company").on(table.companyId),
  index("idx_email_templates_type").on(table.emailType),
  index("idx_email_templates_active").on(table.isActive),
]);

// ============================================
// EMAIL LOGS
// ============================================

export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Recipient info
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  patientId: varchar("patient_id"),

  // Email details
  emailType: emailTypeEnum("email_type").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),

  // Tracking
  status: emailStatusEnum("status").default("queued").notNull(),
  trackingId: varchar("tracking_id", { length: 100 }).unique(),

  // Related entities
  templateId: varchar("template_id"),
  relatedEntityType: varchar("related_entity_type", { length: 50 }),
  relatedEntityId: varchar("related_entity_id"),

  // Delivery info
  sentBy: varchar("sent_by").notNull(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),

  // Engagement tracking
  openCount: integer("open_count").default(0).notNull(),
  firstOpenedAt: timestamp("first_opened_at"),
  lastOpenedAt: timestamp("last_opened_at"),
  clickCount: integer("click_count").default(0).notNull(),
  firstClickedAt: timestamp("first_clicked_at"),
  lastClickedAt: timestamp("last_clicked_at"),

  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),

  // Metadata
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_logs_company").on(table.companyId),
  index("idx_email_logs_recipient").on(table.recipientEmail),
  index("idx_email_logs_patient").on(table.patientId),
  index("idx_email_logs_type").on(table.emailType),
  index("idx_email_logs_status").on(table.status),
  index("idx_email_logs_sent_at").on(table.sentAt),
  index("idx_email_logs_tracking_id").on(table.trackingId),
  index("idx_email_logs_related").on(table.relatedEntityType, table.relatedEntityId),
]);

// ============================================
// EMAIL TRACKING EVENTS
// ============================================

export const emailTrackingEvents = pgTable("email_tracking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailLogId: varchar("email_log_id").notNull(),

  // Event details
  eventType: emailEventTypeEnum("event_type").notNull(),
  eventData: jsonb("event_data"),

  // User agent and location tracking
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  location: jsonb("location"),
  device: varchar("device", { length: 50 }),

  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_email_tracking_events_log").on(table.emailLogId),
  index("idx_email_tracking_events_type").on(table.eventType),
  index("idx_email_tracking_events_timestamp").on(table.timestamp),
]);

// ============================================
// MESSAGE TEMPLATES
// ============================================

export const messageTemplates = pgTable(
  "message_templates",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    channel: communicationChannelEnum("channel").notNull(),
    subject: text("subject"), // For email
    body: text("body").notNull(), // Supports template variables like {{firstName}}
    variables: jsonb("variables").notNull().$type<string[]>(), // List of required variables
    category: messageCategoryEnum("category").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("message_templates_company_idx").on(table.companyId),
    channelIdx: index("message_templates_channel_idx").on(table.channel),
    categoryIdx: index("message_templates_category_idx").on(table.category),
    activeIdx: index("message_templates_active_idx").on(table.active),
  })
);

// ============================================
// MESSAGES
// ============================================

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    channel: communicationChannelEnum("channel").notNull(),
    templateId: text("template_id").references(() => messageTemplates.id, { onDelete: "set null" }),

    // Recipients
    recipientId: text("recipient_id").notNull(), // Patient/User ID
    recipientType: recipientTypeEnum("recipient_type").notNull(),
    to: text("to").notNull(), // Email address, phone number, or device token

    // Content
    subject: text("subject"),
    body: text("body").notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>(),

    // Status
    status: messageStatusEnum("status").notNull().default("draft"),
    priority: messagePriorityEnum("priority").notNull().default("normal"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),

    // Error handling
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),

    // Tracking
    trackingId: text("tracking_id"),
    campaignId: text("campaign_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("messages_company_idx").on(table.companyId),
    recipientIdx: index("messages_recipient_idx").on(table.recipientId),
    statusIdx: index("messages_status_idx").on(table.status),
    channelIdx: index("messages_channel_idx").on(table.channel),
    templateIdx: index("messages_template_idx").on(table.templateId),
    campaignIdx: index("messages_campaign_idx").on(table.campaignId),
    scheduledForIdx: index("messages_scheduled_for_idx").on(table.scheduledFor),
    sentAtIdx: index("messages_sent_at_idx").on(table.sentAt),
  })
);

// ============================================
// UNSUBSCRIBES
// ============================================

export const unsubscribes = pgTable(
  "unsubscribes",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id").notNull(),
    channel: communicationChannelEnum("channel").notNull(),
    category: messageCategoryEnum("category"),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }).notNull().defaultNow(),
    reason: text("reason"),
  },
  (table) => ({
    companyIdx: index("unsubscribes_company_idx").on(table.companyId),
    recipientIdx: index("unsubscribes_recipient_idx").on(table.recipientId),
    channelIdx: index("unsubscribes_channel_idx").on(table.channel),
    categoryIdx: index("unsubscribes_category_idx").on(table.category),
    // Unique constraint: one unsubscribe per recipient+channel+category
    uniqueUnsubscribe: index("unsubscribes_unique_idx").on(
      table.recipientId,
      table.channel,
      table.category
    ),
  })
);

// ============================================
// WHATSAPP MESSAGE EVENTS
// ============================================

export const whatsappMessageEvents = pgTable(
  "whatsapp_message_events",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),

    // Twilio WhatsApp Business API data
    twilioMessageSid: text("twilio_message_sid"), // Twilio unique message ID
    twilioAccountSid: text("twilio_account_sid"), // Twilio account identifier
    twilioStatus: whatsappMessageStatusEnum("twilio_status"), // Twilio delivery status

    // Phone numbers
    from: text("from").notNull(), // Sender WhatsApp number (format: whatsapp:+1234567890)
    to: text("to").notNull(), // Recipient WhatsApp number

    // Message data
    numSegments: integer("num_segments"), // Number of message segments
    numMedia: integer("num_media").default(0), // Number of media attachments
    mediaUrls: jsonb("media_urls").$type<string[]>(), // Media attachment URLs

    // Pricing
    price: decimal("price", { precision: 10, scale: 4 }), // Message cost
    priceUnit: text("price_unit").default("USD"), // Currency

    // Status tracking
    status: whatsappMessageStatusEnum("status").notNull().default("queued"),
    errorCode: text("error_code"), // Error code if failed
    errorMessage: text("error_message"), // Error description

    // Timestamps
    queuedAt: timestamp("queued_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),

    // Metadata
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("whatsapp_events_company_idx").on(table.companyId),
    messageIdx: index("whatsapp_events_message_idx").on(table.messageId),
    twilioSidIdx: index("whatsapp_events_twilio_sid_idx").on(table.twilioMessageSid),
    statusIdx: index("whatsapp_events_status_idx").on(table.status),
    sentAtIdx: index("whatsapp_events_sent_at_idx").on(table.sentAt),
  })
);

// ============================================
// SMS MESSAGE EVENTS
// ============================================

export const smsMessageEvents = pgTable(
  "sms_message_events",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),

    // Twilio SMS API data
    twilioMessageSid: text("twilio_message_sid"), // Twilio unique message ID
    twilioAccountSid: text("twilio_account_sid"), // Twilio account identifier
    twilioStatus: smsMessageStatusEnum("twilio_status"), // Twilio delivery status

    // Phone numbers
    from: text("from").notNull(), // Sender phone number
    to: text("to").notNull(), // Recipient phone number

    // Message data
    body: text("body").notNull(), // SMS body text
    numSegments: integer("num_segments"), // Number of SMS segments
    numMedia: integer("num_media").default(0), // Number of MMS attachments
    mediaUrls: jsonb("media_urls").$type<string[]>(), // MMS attachment URLs

    // Carrier information
    carrierName: text("carrier_name"), // Recipient's carrier
    carrierType: text("carrier_type"), // mobile, landline, voip

    // Pricing
    price: decimal("price", { precision: 10, scale: 4 }), // Message cost
    priceUnit: text("price_unit").default("USD"), // Currency

    // Status tracking
    status: smsMessageStatusEnum("status").notNull().default("queued"),
    errorCode: text("error_code"), // Error code if failed
    errorMessage: text("error_message"), // Error description

    // Timestamps
    queuedAt: timestamp("queued_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),

    // Metadata
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("sms_events_company_idx").on(table.companyId),
    messageIdx: index("sms_events_message_idx").on(table.messageId),
    twilioSidIdx: index("sms_events_twilio_sid_idx").on(table.twilioMessageSid),
    statusIdx: index("sms_events_status_idx").on(table.status),
    sentAtIdx: index("sms_events_sent_at_idx").on(table.sentAt),
    toIdx: index("sms_events_to_idx").on(table.to),
  })
);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: z.string().min(1, "Template name is required").max(200),
  subject: z.string().min(1, "Subject is required").max(500),
  htmlContent: z.string().min(1, "HTML content is required"),
  emailType: z.enum(["invoice", "receipt", "prescription_reminder", "recall_notification", "appointment_reminder", "order_confirmation", "order_update", "marketing", "general"]),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs, {
  recipientEmail: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(500),
  htmlContent: z.string().min(1, "HTML content is required"),
  emailType: z.enum(["invoice", "receipt", "prescription_reminder", "recall_notification", "appointment_reminder", "order_confirmation", "order_update", "marketing", "general"]),
});

export const insertEmailTrackingEventSchema = createInsertSchema(emailTrackingEvents, {
  eventType: z.enum(["sent", "delivered", "opened", "clicked", "bounced", "spam", "unsubscribed"]),
});

export const insertUnsubscribeSchema = createInsertSchema(unsubscribes);
export const insertWhatsappMessageEventSchema = createInsertSchema(whatsappMessageEvents);
export const insertSmsMessageEventSchema = createInsertSchema(smsMessageEvents);

// ============================================
// TYPES
// ============================================

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
export type EmailTrackingEvent = typeof emailTrackingEvents.$inferSelect;
export type InsertEmailTrackingEvent = typeof emailTrackingEvents.$inferInsert;
export type Unsubscribe = typeof unsubscribes.$inferSelect;
export type InsertUnsubscribe = typeof unsubscribes.$inferInsert;
export type WhatsappMessageEvent = typeof whatsappMessageEvents.$inferSelect;
export type InsertWhatsappMessageEvent = typeof whatsappMessageEvents.$inferInsert;
export type SmsMessageEvent = typeof smsMessageEvents.$inferSelect;
export type InsertSmsMessageEvent = typeof smsMessageEvents.$inferInsert;
