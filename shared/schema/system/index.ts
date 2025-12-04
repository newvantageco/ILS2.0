/**
 * System Domain Schema
 *
 * Permissions, roles, RBAC, and audit logging for compliance (HIPAA, GOC).
 * These tables form the security and compliance foundation of the application.
 *
 * @module shared/schema/system
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { companies, users } from "../core/tables";
import { roleEnum, auditEventTypeEnum } from "../core/enums";

// ============================================
// PERMISSIONS - Fine-Grained Access Control
// ============================================

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  permissionKey: varchar("permission_key").notNull().unique(),
  permissionName: varchar("permission_name").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_permissions_category").on(table.category),
]);

// ============================================
// ROLE PERMISSIONS - Static Role Assignments
// ============================================

export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  role: roleEnum("role").notNull(),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_role_permissions_company").on(table.companyId),
  index("idx_role_permissions_role").on(table.role),
]);

// ============================================
// USER CUSTOM PERMISSIONS - Per-User Overrides
// ============================================

export const userCustomPermissions = pgTable("user_custom_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean("granted").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
}, (table) => [
  index("idx_user_custom_permissions_user").on(table.userId),
]);

// ============================================
// DYNAMIC RBAC SYSTEM
// ============================================

// Dynamic Roles - Company-specific roles (both defaults and custom)
export const dynamicRoles = pgTable("dynamic_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),

  // System Management
  isSystemDefault: boolean("is_system_default").notNull().default(false),
  isDeletable: boolean("is_deletable").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
}, (table) => [
  index("idx_dynamic_roles_company").on(table.companyId),
  index("idx_dynamic_roles_name").on(table.name),
  index("idx_dynamic_roles_system_default").on(table.isSystemDefault),
  uniqueIndex("unique_role_per_company").on(table.companyId, table.name),
]);

// Dynamic Role Permissions - Many-to-many: which permissions does each role have?
export const dynamicRolePermissions = pgTable("dynamic_role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => dynamicRoles.id, { onDelete: 'cascade' }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  grantedBy: varchar("granted_by").references(() => users.id),
}, (table) => [
  index("idx_dynamic_role_permissions_role").on(table.roleId),
  index("idx_dynamic_role_permissions_permission").on(table.permissionId),
  uniqueIndex("unique_role_permission").on(table.roleId, table.permissionId),
]);

// User Dynamic Roles - Many-to-many: which roles are assigned to each user?
export const userDynamicRoles = pgTable("user_dynamic_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: varchar("role_id").notNull().references(() => dynamicRoles.id, { onDelete: 'cascade' }),

  isPrimary: boolean("is_primary").notNull().default(false),

  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: varchar("assigned_by").references(() => users.id),
}, (table) => [
  index("idx_user_dynamic_roles_user").on(table.userId),
  index("idx_user_dynamic_roles_role").on(table.roleId),
  index("idx_user_dynamic_roles_primary").on(table.isPrimary),
  uniqueIndex("unique_user_role").on(table.userId, table.roleId),
]);

// Role Change Audit - Track all permission/role changes for compliance
export const roleChangeAudit = pgTable("role_change_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),

  changedBy: varchar("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),

  actionType: varchar("action_type", { length: 50 }).notNull(), // 'role_created', 'role_deleted', 'permission_assigned', etc.

  roleId: varchar("role_id").references(() => dynamicRoles.id, { onDelete: 'set null' }),
  permissionId: varchar("permission_id").references(() => permissions.id, { onDelete: 'set null' }),

  details: jsonb("details"), // { old_value, new_value, reason }
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
}, (table) => [
  index("idx_role_change_audit_company").on(table.companyId),
  index("idx_role_change_audit_changed_by").on(table.changedBy),
  index("idx_role_change_audit_role").on(table.roleId),
  index("idx_role_change_audit_timestamp").on(table.changedAt),
  index("idx_role_change_audit_action").on(table.actionType),
]);

// ============================================
// AUDIT LOGS (HIPAA & GOC Compliance)
// ============================================

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),

  // Who performed the action
  userId: varchar("user_id").references(() => users.id),
  userEmail: varchar("user_email"),
  userRole: roleEnum("user_role"),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),

  // What action was performed
  eventType: auditEventTypeEnum("event_type").notNull(),
  resourceType: varchar("resource_type").notNull(), // 'patient', 'order', 'prescription', 'user', etc.
  resourceId: varchar("resource_id"),
  action: text("action").notNull(), // Human-readable description

  // Where the action occurred
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  endpoint: varchar("endpoint"), // e.g., '/api/patients/123'
  method: varchar("method", { length: 10 }), // GET, POST, PUT, DELETE

  // Result of the action
  statusCode: integer("status_code"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),

  // Data changes (for updates)
  changesBefore: jsonb("changes_before"), // State before update
  changesAfter: jsonb("changes_after"), // State after update
  metadata: jsonb("metadata"), // Additional context

  // HIPAA-specific fields
  phiAccessed: boolean("phi_accessed").default(false), // Protected Health Information flag
  phiFields: jsonb("phi_fields"), // List of PHI fields accessed (e.g., ['nhsNumber', 'dateOfBirth'])
  justification: text("justification"), // Business justification for PHI access

  // Retention
  retentionDate: timestamp("retention_date"), // When this log can be deleted (7+ years per GOC)
}, (table) => [
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_company").on(table.companyId),
  index("idx_audit_logs_timestamp").on(table.timestamp),
  index("idx_audit_logs_event_type").on(table.eventType),
  index("idx_audit_logs_resource").on(table.resourceType, table.resourceId),
  index("idx_audit_logs_phi").on(table.phiAccessed),
]);
