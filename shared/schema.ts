import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const userRoleEnum = pgEnum("user_role", ["ecp", "lab_tech", "engineer", "supplier"]);
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
  "in_transit",
  "delivered",
  "cancelled"
]);

export const documentTypeEnum = pgEnum("document_type", [
  "spec_sheet",
  "certificate",
  "sds",
  "compliance",
  "other"
]);

export const consultPriorityEnum = pgEnum("consult_priority", [
  "normal",
  "high",
  "urgent"
]);

// User storage table with Replit Auth fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role"),
  organizationName: text("organization_name"),
  accountNumber: text("account_number"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: jsonb("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  customerReferenceLabel: text("customer_reference_label"),
  customerReferenceNumber: text("customer_reference_number"),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  
  odSphere: text("od_sphere"),
  odCylinder: text("od_cylinder"),
  odAxis: text("od_axis"),
  odAdd: text("od_add"),
  osSphere: text("os_sphere"),
  osCylinder: text("os_cylinder"),
  osAxis: text("os_axis"),
  osAdd: text("os_add"),
  pd: text("pd"),
  
  lensType: text("lens_type").notNull(),
  lensMaterial: text("lens_material").notNull(),
  coating: text("coating").notNull(),
  frameType: text("frame_type"),
  
  notes: text("notes"),
  traceFileUrl: text("trace_file_url"),
  trackingNumber: text("tracking_number"),
  shippedAt: timestamp("shipped_at"),
  
  customerReferenceLabel: text("customer_reference_label"),
  customerReferenceNumber: text("customer_reference_number"),
  
  orderDate: timestamp("order_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
});

export const consultLogs = pgTable("consult_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  priority: consultPriorityEnum("priority").notNull().default("normal"),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  labResponse: text("lab_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poNumber: text("po_number").notNull().unique(),
  supplierId: varchar("supplier_id").notNull().references(() => users.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  status: poStatusEnum("status").notNull().default("draft"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const poLineItems = pgTable("po_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id").notNull().references(() => purchaseOrders.id),
  itemName: text("item_name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const technicalDocuments = pgTable("technical_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => users.id),
  documentType: documentTypeEnum("document_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  materialName: text("material_name"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const organizationSettings = pgTable("organization_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name"),
  logoUrl: text("logo_url"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: jsonb("address"),
  orderNumberPrefix: text("order_number_prefix").default("ORD"),
  defaultLeadTimeDays: integer("default_lead_time_days").default(7),
  enableEmailNotifications: jsonb("enable_email_notifications").default(sql`'{"orderReceived": true, "orderShipped": true, "poCreated": true}'::jsonb`),
  businessHours: jsonb("business_hours"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedById: varchar("updated_by_id").references(() => users.id),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  theme: text("theme").default("light"),
  language: text("language").default("en"),
  emailNotifications: jsonb("email_notifications").default(sql`'{"orderUpdates": true, "systemAlerts": true}'::jsonb`),
  dashboardLayout: jsonb("dashboard_layout"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const upsertUserSchema = createInsertSchema(users);
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  orderDate: true,
  completedAt: true,
  patientId: true,
  ecpId: true,
}).extend({
  patientName: z.string().min(1, "Patient name is required"),
  patientDOB: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "in_production", "quality_check", "shipped", "completed", "on_hold", "cancelled"]),
});

export const insertConsultLogSchema = createInsertSchema(consultLogs).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
  labResponse: true,
  status: true,
  ecpId: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  poNumber: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
});

export const insertPOLineItemSchema = createInsertSchema(poLineItems).omit({
  id: true,
  createdAt: true,
  purchaseOrderId: true,
});

export const insertTechnicalDocumentSchema = createInsertSchema(technicalDocuments).omit({
  id: true,
  uploadedAt: true,
  supplierId: true,
});

export const updatePOStatusSchema = z.object({
  status: z.enum(["draft", "sent", "acknowledged", "in_transit", "delivered", "cancelled"]),
  trackingNumber: z.string().optional(),
  actualDeliveryDate: z.string().optional(),
});

export const insertSupplierSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  email: z.string().email("Valid email is required").optional(),
  accountNumber: z.string().optional(),
  contactEmail: z.string().email("Valid contact email required").optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const updateSupplierSchema = insertSupplierSchema.partial();

export const updateOrganizationSettingsSchema = createInsertSchema(organizationSettings).omit({
  id: true,
  updatedAt: true,
  updatedById: true,
}).extend({
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const updateUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type OrderWithDetails = Order & {
  patient: Patient;
  ecp: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    organizationName: string | null;
  };
};

export type InsertConsultLog = z.infer<typeof insertConsultLogSchema>;
export type ConsultLog = typeof consultLogs.$inferSelect;

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

export type InsertPOLineItem = z.infer<typeof insertPOLineItemSchema>;
export type POLineItem = typeof poLineItems.$inferSelect;

export type PurchaseOrderWithDetails = PurchaseOrder & {
  supplier: {
    id: string;
    organizationName: string | null;
    email: string | null;
    accountNumber: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  };
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  lineItems: POLineItem[];
};

export type InsertTechnicalDocument = z.infer<typeof insertTechnicalDocumentSchema>;
export type TechnicalDocument = typeof technicalDocuments.$inferSelect;

export type TechnicalDocumentWithSupplier = TechnicalDocument & {
  supplier: {
    id: string;
    organizationName: string | null;
  };
};

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>;

export type UpdateOrganizationSettings = z.infer<typeof updateOrganizationSettingsSchema>;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;

export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
