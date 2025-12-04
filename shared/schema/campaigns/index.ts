/**
 * Campaign Management Domain Schema
 *
 * Tables for campaign management including:
 * - Audience segmentation for targeted campaigns
 * - Campaign configuration, scheduling, and tracking
 * - Campaign recipient tracking and delivery logs
 *
 * This domain manages marketing and communication campaigns with support for:
 * - One-time, recurring, triggered, and drip campaigns
 * - Audience segmentation with complex filtering criteria
 * - Multi-channel delivery (email, SMS, push, in-app, WhatsApp)
 * - Campaign metrics tracking (sent, delivered, opened, clicked, unsubscribed)
 * - A/B testing capabilities
 * - Message throttling and scheduling
 *
 * @module shared/schema/campaigns
 */

import { pgTable, text, timestamp, jsonb, index, pgEnum, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies } from "../core";
import { communicationChannelEnum, messageTemplates, messages } from "../communications";

// ============================================
// CAMPAIGN ENUMS
// ============================================

/**
 * Campaign status lifecycle
 */
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "cancelled"
]);

/**
 * Campaign type
 */
export const campaignTypeEnum = pgEnum("campaign_type", [
  "one_time",
  "recurring",
  "triggered",
  "drip"
]);

/**
 * Campaign frequency for recurring campaigns
 */
export const campaignFrequencyEnum = pgEnum("campaign_frequency", [
  "daily",
  "weekly",
  "monthly"
]);

/**
 * A/B test variant
 */
export const abTestVariantEnum = pgEnum("ab_test_variant", ["A", "B"]);

/**
 * Audience segment criteria operators
 */
export const segmentOperatorEnum = pgEnum("segment_operator", [
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "contains"
]);

// ============================================
// AUDIENCE SEGMENTS
// ============================================

/**
 * Audience Segments Table
 * Stores audience segmentation criteria for targeted campaigns
 */
export const audienceSegments = pgTable(
  "audience_segments",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    criteria: jsonb("criteria").notNull().$type<Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
      value: any;
    }>>(), // Array of filtering criteria
    size: integer("size"), // Estimated segment size
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("audience_segments_company_idx").on(table.companyId),
    nameIdx: index("audience_segments_name_idx").on(table.name),
  })
);

// ============================================
// CAMPAIGNS
// ============================================

/**
 * Campaigns Table
 * Stores marketing campaign configuration and tracking metrics
 */
export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    type: campaignTypeEnum("type").notNull(),
    status: campaignStatusEnum("status").notNull().default("draft"),

    // Audience
    segmentIds: jsonb("segment_ids").notNull().$type<string[]>(), // Array of audience segment IDs
    estimatedReach: integer("estimated_reach").notNull().default(0),

    // Content
    channel: communicationChannelEnum("channel").notNull(),
    templateId: text("template_id").references(() => messageTemplates.id, { onDelete: "set null" }),
    variables: jsonb("variables").$type<Record<string, string>>(), // Default variable values

    // Scheduling
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    frequency: campaignFrequencyEnum("frequency"), // For recurring campaigns
    sendTime: text("send_time"), // HH:MM format

    // Tracking metrics
    sentCount: integer("sent_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    openedCount: integer("opened_count").notNull().default(0),
    clickedCount: integer("clicked_count").notNull().default(0),
    unsubscribedCount: integer("unsubscribed_count").notNull().default(0),

    // Settings
    throttle: integer("throttle"), // Messages per hour
    abTestEnabled: boolean("ab_test_enabled").notNull().default(false),
    abTestVariant: abTestVariantEnum("ab_test_variant"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    launchedAt: timestamp("launched_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    companyIdx: index("campaigns_company_idx").on(table.companyId),
    statusIdx: index("campaigns_status_idx").on(table.status),
    typeIdx: index("campaigns_type_idx").on(table.type),
    channelIdx: index("campaigns_channel_idx").on(table.channel),
    startDateIdx: index("campaigns_start_date_idx").on(table.startDate),
  })
);

// ============================================
// CAMPAIGN RECIPIENTS
// ============================================

/**
 * Campaign Recipients Table
 * Junction table tracking which recipients received each campaign
 */
export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id").notNull(), // Patient/User ID
    messageId: text("message_id").references(() => messages.id, { onDelete: "set null" }), // Link to sent message
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    campaignIdx: index("campaign_recipients_campaign_idx").on(table.campaignId),
    recipientIdx: index("campaign_recipients_recipient_idx").on(table.recipientId),
    // Unique constraint to prevent duplicate sends
    uniqueCampaignRecipient: uniqueIndex("campaign_recipient_unique").on(table.campaignId, table.recipientId),
  })
);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertAudienceSegmentSchema = createInsertSchema(audienceSegments);
export const insertCampaignSchema = createInsertSchema(campaigns);
export const insertCampaignRecipientSchema = createInsertSchema(campaignRecipients);

// ============================================
// TYPES
// ============================================

export type AudienceSegment = typeof audienceSegments.$inferSelect;
export type InsertAudienceSegment = typeof audienceSegments.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = typeof campaignRecipients.$inferInsert;
