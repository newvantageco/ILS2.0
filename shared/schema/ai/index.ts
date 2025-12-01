/**
 * AI Domain Schema
 *
 * Tables for AI conversations, messages, knowledge base, learning data,
 * model management, and AI-powered features.
 *
 * @module shared/schema/ai
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// ============================================
// AI ENUMS
// ============================================

export const aiConversationStatusEnum = pgEnum("ai_conversation_status", [
  "active",
  "archived",
  "deleted"
]);

export const aiMessageRoleEnum = pgEnum("ai_message_role", [
  "user",
  "assistant",
  "system",
  "tool"
]);

export const aiNotificationPriorityEnum = pgEnum("ai_notification_priority", [
  "low",
  "medium",
  "high",
  "urgent"
]);

export const aiNotificationStatusEnum = pgEnum("ai_notification_status", [
  "pending",
  "delivered",
  "read",
  "dismissed",
  "actioned"
]);

// ============================================
// CONVERSATION TABLES
// ============================================

export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey(),
  companyId: varchar("company_id").notNull(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }),
  status: aiConversationStatusEnum("status").default("active"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_conversations_company").on(table.companyId),
  index("idx_ai_conversations_user").on(table.userId),
  index("idx_ai_conversations_company_user").on(table.companyId, table.userId),
]);

export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey(),
  conversationId: varchar("conversation_id").notNull(),
  role: aiMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  toolCalls: jsonb("tool_calls"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_messages_conversation").on(table.conversationId),
]);

// ============================================
// KNOWLEDGE BASE
// ============================================

export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: varchar("id").primaryKey(),
  companyId: varchar("company_id").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  embedding: jsonb("embedding"), // For vector search
  tags: jsonb("tags").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_knowledge_company").on(table.companyId),
  index("idx_ai_knowledge_category").on(table.companyId, table.category),
]);

// ============================================
// LEARNING DATA
// ============================================

export const aiLearningData = pgTable("ai_learning_data", {
  id: varchar("id").primaryKey(),
  companyId: varchar("company_id").notNull(),
  dataType: varchar("data_type", { length: 50 }).notNull(),
  source: varchar("source", { length: 100 }),
  inputData: jsonb("input_data").notNull(),
  outputData: jsonb("output_data"),
  correctOutput: jsonb("correct_output"),
  feedback: jsonb("feedback"),
  quality: integer("quality"), // 1-5 rating
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_learning_company").on(table.companyId),
  index("idx_ai_learning_type").on(table.dataType),
]);

// ============================================
// FEEDBACK
// ============================================

export const aiFeedback = pgTable("ai_feedback", {
  id: varchar("id").primaryKey(),
  companyId: varchar("company_id").notNull(),
  messageId: varchar("message_id"),
  conversationId: varchar("conversation_id"),
  userId: varchar("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  feedbackType: varchar("feedback_type", { length: 50 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_feedback_company").on(table.companyId),
  index("idx_ai_feedback_message").on(table.messageId),
]);

// ============================================
// MODEL MANAGEMENT
// ============================================

export const aiModelVersions = pgTable("ai_model_versions", {
  id: varchar("id").primaryKey(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  description: text("description"),
  config: jsonb("config"),
  metrics: jsonb("metrics"),
  status: varchar("status", { length: 50 }).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const aiModelDeployments = pgTable("ai_model_deployments", {
  id: varchar("id").primaryKey(),
  modelVersionId: varchar("model_version_id").notNull(),
  companyId: varchar("company_id"),
  environment: varchar("environment", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  config: jsonb("config"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_deployments_company").on(table.companyId),
]);

// ============================================
// AI NOTIFICATIONS
// ============================================

export const aiNotifications = pgTable("ai_notifications", {
  id: varchar("id").primaryKey(),
  companyId: varchar("company_id").notNull(),
  userId: varchar("user_id"),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  priority: aiNotificationPriorityEnum("priority").default("medium"),
  status: aiNotificationStatusEnum("status").default("pending"),
  actionUrl: varchar("action_url", { length: 500 }),
  actionLabel: varchar("action_label", { length: 100 }),
  metadata: jsonb("metadata"),
  expiresAt: timestamp("expires_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_notifications_company").on(table.companyId),
  index("idx_ai_notifications_user").on(table.userId),
  index("idx_ai_notifications_status").on(table.status),
]);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertAiConversationSchema = createInsertSchema(aiConversations);
export const insertAiMessageSchema = createInsertSchema(aiMessages);
export const insertAiKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase);
export const insertAiLearningDataSchema = createInsertSchema(aiLearningData);
export const insertAiFeedbackSchema = createInsertSchema(aiFeedback);

// ============================================
// TYPES
// ============================================

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;
export type AiKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type InsertAiKnowledgeBase = typeof aiKnowledgeBase.$inferInsert;
export type AiLearningData = typeof aiLearningData.$inferSelect;
export type InsertAiLearningData = typeof aiLearningData.$inferInsert;
export type AiFeedback = typeof aiFeedback.$inferSelect;
export type InsertAiFeedback = typeof aiFeedback.$inferInsert;
