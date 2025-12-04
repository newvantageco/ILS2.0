/**
 * Core Domain Schema
 * 
 * Essential tables for the application including users, companies,
 * patients, orders, and basic business entities.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, numeric, real, boolean, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["ecp", "admin", "lab_tech", "engineer", "supplier", "platform_admin", "company_admin", "dispenser"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "pro", "premium", "enterprise", "full", "free_ecp"]);
export const accountStatusEnum = pgEnum("account_status", ["pending", "active", "suspended"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "in_production",
  "quality_check",
  "shipped",
  "completed",
  "on_hold",
  "cancelled"
]);

// Users table
export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    username: varchar("username", { length: 50 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: roleEnum("role").notNull(),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    profileImage: text("profile_image"),
    bio: text("bio"),
    specialization: text("specialization"), // For ECPs
    licenseNumber: varchar("license_number", { length: 100 }),
    licenseExpiry: date("license_expiry"),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    isPhoneVerified: boolean("is_phone_verified").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
    preferences: jsonb("preferences"), // User preferences
    accountStatus: accountStatusEnum("account_status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_user_email").on(table.email),
    index("idx_user_role").on(table.role),
    index("idx_user_company").on(table.companyId),
    index("idx_user_status").on(table.accountStatus),
  ],
);

// Companies table
export const companies = pgTable(
  "companies",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    type: varchar("type", { length: 50 }).notNull(), // "practice", "lab", "supplier"
    subscriptionPlan: subscriptionPlanEnum("subscription_plan").notNull().default("free"),
    subscriptionExpiresAt: timestamp("subscription_expires_at"),
    logo: text("logo"),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    website: text("website"),
    taxId: varchar("tax_id", { length: 50 }),
    isActive: boolean("is_active").default(true).notNull(),
    settings: jsonb("settings"), // Company-specific settings
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_company_slug").on(table.slug),
    index("idx_company_type").on(table.type),
    index("idx_company_plan").on(table.subscriptionPlan),
    index("idx_company_active").on(table.isActive),
  ],
);

// Patients table
export const patients = pgTable(
  "patients",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
    patientNumber: varchar("patient_number", { length: 50 }).notNull(),
    nhsNumber: varchar("nhs_number", { length: 20 }), // UK NHS number
    customerNumber: varchar("customer_number", { length: 50 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    gender: varchar("gender", { length: 20 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 100 }),
    emergencyContact: jsonb("emergency_contact"),
    medicalHistory: jsonb("medical_history"),
    allergies: text("allergies"),
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_patient_company").on(table.companyId),
    index("idx_patient_number").on(table.patientNumber),
    index("idx_patient_nhs").on(table.nhsNumber),
    index("idx_patient_name").on(table.lastName, table.firstName),
    index("idx_patient_dob").on(table.dateOfBirth),
    uniqueIndex("idx_patient_unique").on(table.companyId, table.patientNumber),
  ],
);

// Orders table (with corrected numeric types)
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  
  // Prescription data with proper numeric types
  odSphere: decimal("od_sphere", { precision: 5, scale: 2 }),
  odCylinder: decimal("od_cylinder", { precision: 5, scale: 2 }),
  odAxis: integer("od_axis"),
  odAdd: decimal("od_add", { precision: 4, scale: 2 }),
  osSphere: decimal("os_sphere", { precision: 5, scale: 2 }),
  osCylinder: decimal("os_cylinder", { precision: 5, scale: 2 }),
  osAxis: integer("os_axis"),
  osAdd: decimal("os_add", { precision: 4, scale: 2 }),
  pd: decimal("pd", { precision: 4, scale: 1 }),
  
  // Product details
  lensType: text("lens_type").notNull(),
  lensMaterial: text("lens_material").notNull(),
  coating: text("coating").notNull(),
  frameType: text("frame_type"),
  frameBrand: text("frame_brand"),
  frameModel: text("frame_model"),
  frameColor: text("frame_color"),
  
  // Measurements
  frameWidth: integer("frame_width"),
  frameHeight: integer("frame_height"),
  bridgeWidth: integer("bridge_width"),
  templeLength: integer("temple_length"),
  
  // Pricing
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }),
  wholesalePrice: decimal("wholesale_price", { precision: 10, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  
  // Dates and workflow
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  actualDeliveryDate: date("actual_delivery_date"),
  productionStartDate: timestamp("production_start_date"),
  qualityCheckDate: timestamp("quality_check_date"),
  shipDate: timestamp("ship_date"),
  
  // Additional data
  notes: text("notes"),
  specialInstructions: text("special_instructions"),
  urgent: boolean("urgent").default(false).notNull(),
  priority: integer("priority").default(0).notNull(),
  
  // Tracking
  trackingNumber: varchar("tracking_number", { length: 100 }),
  carrier: varchar("carrier", { length: 100 }),
  
  // Lab assignment
  labId: varchar("lab_id").references(() => users.id),
  technicianId: varchar("technician_id").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_order_company").on(table.companyId),
  index("idx_order_patient").on(table.patientId),
  index("idx_order_ecp").on(table.ecpId),
  index("idx_order_status").on(table.status),
  index("idx_order_date").on(table.orderDate),
  index("idx_order_number").on(table.orderNumber),
  index("idx_order_lab").on(table.labId),
  index("idx_order_priority").on(table.priority),
  index("idx_order_urgent").on(table.urgent),
]);

// Sessions table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [
    index("IDX_session_expire").on(table.expire),
    index("IDX_session_user").on(table.userId),
  ],
);

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = z.infer<typeof insertUserSchema>;
export type Company = z.infer<typeof insertCompanySchema>;
export type Patient = z.infer<typeof insertPatientSchema>;
export type Order = z.infer<typeof insertOrderSchema>;
