import { db } from "../db";
import { 
  users, 
  userRoles,
  patients, 
  orders,
  consultLogs,
  purchaseOrders,
  poLineItems,
  technicalDocuments,
  organizationSettings,
  userPreferences,
  eyeExaminations,
  prescriptions,
  products,
  invoices,
  invoiceLineItems,
  companies,
  companySupplierRelationships,
  aiConversations,
  aiMessages,
  aiKnowledgeBase,
  aiLearningData,
  aiFeedback,
  aiModelVersions,
  aiModelDeployments,
  masterTrainingDatasets,
  trainingDataAnalytics,
  companyAiSettings,
  aiTrainingJobs,
  aiDeploymentQueue,
  subscriptionPlans,
  stripePaymentIntents,
  subscriptionHistory,
  dispenseRecords,
  testRooms,
  gocComplianceChecks,
  prescriptionTemplates,
  clinicalProtocols,
  insurancePayers,
  insuranceClaims,
  claimLineItems,
  riskScores,
  healthRiskAssessments,
  predictiveModels,
  predictiveAnalyses,
  socialDeterminants,
  riskStratificationCohorts,
  type UpsertUser, 
  type User, 
  type UserWithRoles,
  type InsertPatient, 
  type Patient, 
  type InsertOrder, 
  type Order, 
  type OrderWithDetails,
  type InsertConsultLog,
  type ConsultLog,
  type InsertPurchaseOrder,
  type PurchaseOrder,
  type InsertPOLineItem,
  type POLineItem,
  type PurchaseOrderWithDetails,
  type InsertTechnicalDocument,
  type TechnicalDocument,
  type TechnicalDocumentWithSupplier,
  type UpdateOrganizationSettings,
  type OrganizationSettings,
  type UpdateUserPreferences,
  type UserPreferences,
  type InsertEyeExamination,
  type EyeExamination,
  type EyeExaminationWithDetails,
  type InsertPrescription,
  type Prescription,
  type PrescriptionWithDetails,
  type InsertProduct,
  type Product,
  type InsertInvoice,
  type Invoice,
  type InvoiceWithDetails,
  type InsertInvoiceLineItem,
  type InvoiceLineItem,
  type Company,
  type InsertCompany,
  type CompanySupplierRelationship,
  type InsertCompanySupplierRelationship,
  type AiConversation,
  type InsertAiConversation,
  type AiMessage,
  type InsertAiMessage,
  type AiKnowledgeBase,
  type InsertAiKnowledgeBase,
  type AiLearningData,
  type InsertAiLearningData,
  type AiFeedback,
  type InsertAiFeedback,
  type InsurancePayer,
  type InsertInsurancePayer,
  type InsuranceClaim,
  type InsertInsuranceClaim,
  type ClaimLineItem,
  type InsertClaimLineItem,
  type RiskScore,
  type InsertRiskScore,
  type HealthRiskAssessment,
  type InsertHealthRiskAssessment,
  type PredictiveModel,
  type InsertPredictiveModel,
  type PredictiveAnalysis,
  type InsertPredictiveAnalysis,
  type SocialDeterminant,
  type InsertSocialDeterminant,
  type RiskStratificationCohort,
  type InsertRiskStratificationCohort
} from "@shared/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { normalizeEmail } from "./utils/normalizeEmail";

export interface IStorage {
  getUser(id: string, companyId: string): Promise<User | undefined>;
  getUserWithRoles(id: string, companyId: string): Promise<UserWithRoles | undefined>;
  // Internal methods for authentication - bypass tenant isolation
  getUserById_Internal(id: string): Promise<User | undefined>;
  getUserWithRoles_Internal(id: string): Promise<UserWithRoles | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<{ total: number; pending: number; active: number; suspended: number }>;
  getSuppliers(): Promise<User[]>;
  createSupplier(supplier: any): Promise<User>;
  updateSupplier(id: string, updates: any): Promise<User | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  getUserAvailableRoles(userId: string): Promise<string[]>;
  addUserRole(userId: string, role: string): Promise<void>;
  removeUserRole(userId: string, role: string): Promise<void>;
  switchUserRole(userId: string, newRole: string): Promise<User | undefined>;

  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string, companyId: string): Promise<Patient | undefined>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string, companyId: string): Promise<OrderWithDetails | undefined>;
  // Internal method for workers - bypasses tenant isolation
  getOrderById_Internal(id: string): Promise<OrderWithDetails | undefined>;
  getOrders(filters?: {
    ecpId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<OrderWithDetails[]>;
  updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined>;
  updateOrderWithLimsJob(id: string, limsData: {
    jobId: string;
    jobStatus: string;
    sentToLabAt: Date;
    jobErrorMessage?: string | null;
  }): Promise<Order | undefined>;
  // Generic order update helper (used by workers to set PDF URL, error messages, etc.)
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  markOrderAsShipped(id: string, trackingNumber: string): Promise<OrderWithDetails | undefined>;
  getOrderStats(ecpId?: string): Promise<{
    total: number;
    pending: number;
    inProduction: number;
    completed: number;
  }>;

  createConsultLog(log: Omit<InsertConsultLog, 'ecpId'> & { ecpId: string }): Promise<ConsultLog>;
  getConsultLogs(orderId: string): Promise<ConsultLog[]>;
  getAllConsultLogs(ecpId?: string): Promise<ConsultLog[]>;
  respondToConsultLog(id: string, response: string): Promise<ConsultLog | undefined>;

  createPurchaseOrder(po: InsertPurchaseOrder & { lineItems: InsertPOLineItem[] }, createdById: string): Promise<PurchaseOrderWithDetails>;
  getPurchaseOrder(id: string): Promise<PurchaseOrderWithDetails | undefined>;
  getPurchaseOrderById(id: string): Promise<PurchaseOrderWithDetails | undefined>;
  getPurchaseOrders(filters?: {
    supplierId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrderWithDetails[]>;
  updatePOStatus(id: string, status: PurchaseOrder["status"], trackingNumber?: string, actualDeliveryDate?: Date): Promise<PurchaseOrder | undefined>;

  createTechnicalDocument(doc: InsertTechnicalDocument, supplierId: string): Promise<TechnicalDocument>;
  getTechnicalDocuments(supplierId?: string): Promise<TechnicalDocumentWithSupplier[]>;
  deleteTechnicalDocument(id: string, supplierId: string): Promise<boolean>;

  getOrganizationSettings(): Promise<OrganizationSettings | undefined>;
  updateOrganizationSettings(settings: UpdateOrganizationSettings, updatedById: string): Promise<OrganizationSettings>;
  
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: string, preferences: UpdateUserPreferences): Promise<UserPreferences>;

  getPatients(ecpId: string): Promise<Patient[]>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined>;

  createEyeExamination(examination: InsertEyeExamination, ecpId: string): Promise<EyeExamination>;
  getEyeExamination(id: string, companyId?: string): Promise<EyeExaminationWithDetails | undefined>;
  getEyeExaminations(ecpId: string, companyId?: string): Promise<EyeExaminationWithDetails[]>;
  getPatientExaminations(patientId: string, companyId?: string): Promise<EyeExaminationWithDetails[]>;
  updateEyeExamination(id: string, updates: Partial<EyeExamination>): Promise<EyeExamination | undefined>;
  finalizeExamination(id: string, ecpId: string): Promise<EyeExamination | undefined>;

  createPrescription(prescription: InsertPrescription, ecpId: string): Promise<Prescription>;
  getPrescription(id: string): Promise<PrescriptionWithDetails | undefined>;
  getPrescriptions(ecpId: string): Promise<PrescriptionWithDetails[]>;
  signPrescription(id: string, ecpId: string, signature: string): Promise<Prescription | undefined>;

  createProduct(product: InsertProduct, ecpId: string): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(ecpId: string): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  createInvoice(invoice: InsertInvoice & { lineItems: InsertInvoiceLineItem[] }, ecpId: string): Promise<InvoiceWithDetails>;
  getInvoice(id: string, companyId: string): Promise<InvoiceWithDetails | undefined>;
  getInvoices(ecpId: string): Promise<InvoiceWithDetails[]>;
  updateInvoiceStatus(id: string, status: Invoice["status"]): Promise<Invoice | undefined>;
  recordPayment(id: string, amount: string, companyId: string): Promise<Invoice | undefined>;

  // ============== COMPANY & MULTI-TENANT METHODS ==============
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanies(filters?: { type?: string; status?: string }): Promise<Company[]>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined>;
  updateCompanyAiProgress(id: string, progress: number): Promise<void>;
  
  createCompanySupplierRelationship(relationship: InsertCompanySupplierRelationship): Promise<CompanySupplierRelationship>;
  getCompanySupplierRelationships(companyId: string): Promise<CompanySupplierRelationship[]>;
  updateSupplierRelationshipStatus(id: string, status: string, approvedBy?: string): Promise<CompanySupplierRelationship | undefined>;

  // ============== AI ASSISTANT METHODS ==============
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getAiConversation(id: string): Promise<AiConversation | undefined>;
  getAiConversations(companyId: string, userId?: string): Promise<AiConversation[]>;
  updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation | undefined>;

  createAiMessage(message: InsertAiMessage): Promise<AiMessage>;
  getAiMessages(conversationId: string): Promise<AiMessage[]>;

  createAiKnowledgeBase(knowledge: InsertAiKnowledgeBase): Promise<AiKnowledgeBase>;
  getAiKnowledgeBase(id: string): Promise<AiKnowledgeBase | undefined>;
  getAiKnowledgeBaseByCompany(companyId: string): Promise<AiKnowledgeBase[]>;
  updateAiKnowledgeBase(id: string, updates: Partial<AiKnowledgeBase>): Promise<AiKnowledgeBase | undefined>;
  deleteAiKnowledgeBase(id: string): Promise<boolean>;

  createAiLearningData(learning: InsertAiLearningData): Promise<AiLearningData>;
  getAiLearningDataByCompany(companyId: string): Promise<AiLearningData[]>;
  updateAiLearningData(id: string, updates: Partial<AiLearningData>): Promise<AiLearningData | undefined>;
  incrementAiLearningUseCount(id: string): Promise<void>;

  createAiFeedback(feedback: InsertAiFeedback): Promise<AiFeedback>;
  getAiFeedbackByMessage(messageId: string): Promise<AiFeedback[]>;
  getAiFeedbackByCompany(companyId: string): Promise<AiFeedback[]>;

  // ============== RCM (REVENUE CYCLE MANAGEMENT) METHODS ==============
  // Insurance Payers
  createInsurancePayer(payer: InsertInsurancePayer): Promise<InsurancePayer>;
  getInsurancePayer(id: string, companyId: string): Promise<InsurancePayer | undefined>;
  getInsurancePayers(companyId: string, filters?: { active?: boolean; type?: string }): Promise<InsurancePayer[]>;
  updateInsurancePayer(id: string, companyId: string, updates: Partial<InsurancePayer>): Promise<InsurancePayer | undefined>;
  deleteInsurancePayer(id: string, companyId: string): Promise<boolean>;

  // Insurance Claims
  createInsuranceClaim(claim: InsertInsuranceClaim): Promise<InsuranceClaim>;
  getInsuranceClaim(id: string, companyId: string): Promise<InsuranceClaim | undefined>;
  getInsuranceClaims(companyId: string, filters?: { status?: string; patientId?: string; payerId?: string }): Promise<InsuranceClaim[]>;
  updateInsuranceClaim(id: string, companyId: string, updates: Partial<InsuranceClaim>): Promise<InsuranceClaim | undefined>;
  deleteInsuranceClaim(id: string, companyId: string): Promise<boolean>;

  // Claim Line Items
  createClaimLineItem(lineItem: InsertClaimLineItem): Promise<ClaimLineItem>;
  getClaimLineItem(id: string): Promise<ClaimLineItem | undefined>;
  getClaimLineItems(claimId: string): Promise<ClaimLineItem[]>;
  updateClaimLineItem(id: string, updates: Partial<ClaimLineItem>): Promise<ClaimLineItem | undefined>;
  deleteClaimLineItem(id: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  async getUser(id: string, companyId: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(and(
        eq(users.id, id),
        eq(users.companyId, companyId)
      ));
    return user;
  }

  // Internal method for authentication - bypasses tenant isolation
  // ONLY use this for authentication flows where we need to get the user's companyId
  async getUserById_Internal(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const payload: UpsertUser = {
      ...userData,
      email: userData.email ? normalizeEmail(userData.email) : userData.email,
    };

    const [user] = await db
      .insert(users)
      .values(payload)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...payload,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return allUsers;
  }

  async getUserStats(): Promise<{ total: number; pending: number; active: number; suspended: number }> {
    const allUsers = await this.getAllUsers();
    
    const stats = {
      total: allUsers.length,
      pending: allUsers.filter(u => u.accountStatus === 'pending').length,
      active: allUsers.filter(u => u.accountStatus === 'active').length,
      suspended: allUsers.filter(u => u.accountStatus === 'suspended').length,
    };
    
    return stats;
  }

  async getSuppliers(): Promise<User[]> {
    const suppliers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'supplier'))
      .orderBy(users.organizationName, users.lastName);
    return suppliers;
  }

  async createSupplier(supplier: any): Promise<User> {
    const [newSupplier] = await db
      .insert(users)
      .values({
        ...supplier,
        role: 'supplier',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: string, updates: any): Promise<User | undefined> {
    const [updatedSupplier] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.role, 'supplier')))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.role, 'supplier')))
      .returning();
    return result.length > 0;
  }

  async deleteUser(id: string): Promise<boolean> {
    // First delete user roles
    await db
      .delete(userRoles)
      .where(eq(userRoles.userId, id));
    
    // Then delete the user
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0;
  }

  async getUserWithRoles(id: string, companyId: string): Promise<UserWithRoles | undefined> {
    const user = await this.getUser(id, companyId);
    if (!user) return undefined;

    const roles = await this.getUserAvailableRoles(id);
    return {
      ...user,
      availableRoles: roles
    };
  }

  // Internal method for authentication - bypasses tenant isolation
  async getUserWithRoles_Internal(id: string): Promise<UserWithRoles | undefined> {
    const user = await this.getUserById_Internal(id);
    if (!user) return undefined;

    const roles = await this.getUserAvailableRoles(id);
    return {
      ...user,
      availableRoles: roles
    };
  }

  async getUserAvailableRoles(userId: string): Promise<string[]> {
    const roles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    // Return unique roles, including the current active role if not already in the list
    // Note: We query user directly here without companyId filter since this is an internal helper
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const roleSet = new Set(roles.map(r => r.role));
    if (user?.role) {
      roleSet.add(user.role);
    }

    return Array.from(roleSet);
  }

  async addUserRole(userId: string, role: string): Promise<void> {
    // Check if role already exists
    const existing = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
    
    if (existing.length === 0) {
      await db.insert(userRoles).values({
        userId,
        role: role as any,
      });
    }
  }

  async removeUserRole(userId: string, role: string): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
  }

  async switchUserRole(userId: string, newRole: string): Promise<User | undefined> {
    // Verify the user has access to this role
    const availableRoles = await this.getUserAvailableRoles(userId);
    
    if (!availableRoles.includes(newRole)) {
      throw new Error(`User does not have access to role: ${newRole}`);
    }

    // Update the user's active role
    return await this.updateUser(userId, { role: newRole as any });
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    // Generate customer number using database function
    const result = await db.execute(sql`SELECT generate_customer_number() as customer_number`);
    const customerNumber = (result.rows[0] as any).customer_number;

    const [patient] = await db.insert(patients).values({
      ...insertPatient,
      customerNumber,
    }).returning();
    return patient;
  }

  async getPatient(id: string, companyId: string): Promise<Patient | undefined> {
    const [patient] = await db.select()
      .from(patients)
      .where(and(
        eq(patients.id, id),
        eq(patients.companyId, companyId)
      ));
    return patient;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const [order] = await db.insert(orders).values({
      ...insertOrder,
      orderNumber,
    } as any).returning();

    return order;
  }

  async getOrder(id: string, companyId: string): Promise<OrderWithDetails | undefined> {
    const result = await db
      .select({
        order: orders,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          organizationName: users.organizationName,
        },
      })
      .from(orders)
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .innerJoin(users, eq(orders.ecpId, users.id))
      .where(and(
        eq(orders.id, id),
        eq(orders.companyId, companyId)
      ))
      .limit(1);

    if (!result.length) return undefined;

    return {
      ...result[0].order,
      patient: result[0].patient,
      ecp: result[0].ecp,
    };
  }

  // Internal method for workers - bypasses tenant isolation
  async getOrderById_Internal(id: string): Promise<OrderWithDetails | undefined> {
    const result = await db
      .select({
        order: orders,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          organizationName: users.organizationName,
        },
      })
      .from(orders)
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .innerJoin(users, eq(orders.ecpId, users.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!result.length) return undefined;

    return {
      ...result[0].order,
      patient: result[0].patient,
      ecp: result[0].ecp,
    };
  }

  async getOrders(filters: {
    ecpId?: string;
    companyId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderWithDetails[]> {
    const { ecpId, companyId, status, search, limit = 50, offset = 0 } = filters;

    let conditions = [];
    
    if (companyId) {
      conditions.push(eq(orders.companyId, companyId));
    }
    
    if (ecpId) {
      conditions.push(eq(orders.ecpId, ecpId));
    }
    
    if (status && status !== "all") {
      conditions.push(eq(orders.status, status as Order["status"]));
    }
    
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(patients.name, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        order: orders,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          organizationName: users.organizationName,
        },
      })
      .from(orders)
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .innerJoin(users, eq(orders.ecpId, users.id))
      .where(whereClause)
      .orderBy(desc(orders.orderDate))
      .limit(limit)
      .offset(offset);

    return results.map(r => ({
      ...r.order,
      patient: r.patient,
      ecp: r.ecp,
    }));
  }

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ 
        status,
        completedAt: status === "completed" ? new Date() : undefined,
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async updateOrderWithLimsJob(id: string, limsData: {
    jobId: string;
    jobStatus: string;
    sentToLabAt: Date;
    jobErrorMessage?: string | null;
  }): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        jobId: limsData.jobId,
        jobStatus: limsData.jobStatus,
        sentToLabAt: limsData.sentToLabAt,
        jobErrorMessage: limsData.jobErrorMessage || null,
        status: "in_production",
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async markOrderAsShipped(id: string, trackingNumber: string): Promise<OrderWithDetails | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        status: "shipped",
        trackingNumber,
        shippedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!order || !order.companyId) return undefined;

    return await this.getOrder(id, order.companyId);
  }

  async getOrderStats(ecpId?: string): Promise<{
    total: number;
    pending: number;
    inProduction: number;
    completed: number;
  }> {
    const whereClause = ecpId ? eq(orders.ecpId, ecpId) : undefined;

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        inProduction: sql<number>`count(*) filter (where status = 'in_production')::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
      })
      .from(orders)
      .where(whereClause);

    return stats || { total: 0, pending: 0, inProduction: 0, completed: 0 };
  }

  async createConsultLog(insertLog: Omit<InsertConsultLog, 'ecpId'> & { ecpId: string }): Promise<ConsultLog> {
    const [log] = await db.insert(consultLogs).values(insertLog as any).returning();
    return log;
  }

  async getConsultLogs(orderId: string): Promise<ConsultLog[]> {
    return await db
      .select()
      .from(consultLogs)
      .where(eq(consultLogs.orderId, orderId))
      .orderBy(desc(consultLogs.createdAt));
  }

  async getAllConsultLogs(ecpId?: string): Promise<ConsultLog[]> {
    const query = db.select().from(consultLogs);
    
    if (ecpId) {
      return await query
        .where(eq(consultLogs.ecpId, ecpId))
        .orderBy(desc(consultLogs.createdAt));
    }
    
    return await query.orderBy(desc(consultLogs.createdAt));
  }

  async respondToConsultLog(id: string, response: string): Promise<ConsultLog | undefined> {
    const [log] = await db
      .update(consultLogs)
      .set({ 
        labResponse: response,
        status: "resolved",
        respondedAt: new Date(),
      })
      .where(eq(consultLogs.id, id))
      .returning();
    
    return log;
  }

  async createPurchaseOrder(poData: InsertPurchaseOrder & { lineItems: InsertPOLineItem[] }, createdById: string): Promise<PurchaseOrderWithDetails> {
    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const { lineItems, ...poFields } = poData;

    const [po] = await db.insert(purchaseOrders).values({
      ...poFields,
      poNumber,
      createdById,
    }).returning();

    const insertedLineItems = await db.insert(poLineItems).values(
      lineItems.map(item => ({
        ...item,
        purchaseOrderId: po.id,
      }))
    ).returning();

    // Get supplier and createdBy info (they should be in same company as the PO)
    const supplier = po.companyId ? await this.getUser(po.supplierId, po.companyId) : undefined;
    const createdBy = po.companyId ? await this.getUser(createdById, po.companyId) : undefined;

    return {
      ...po,
      supplier: {
        id: supplier?.id || po.supplierId,
        organizationName: supplier?.organizationName || null,
        email: supplier?.email || null,
        accountNumber: supplier?.accountNumber || null,
        contactEmail: supplier?.contactEmail || null,
        contactPhone: supplier?.contactPhone || null,
      },
      createdBy: {
        id: createdBy?.id || createdById,
        firstName: createdBy?.firstName || null,
        lastName: createdBy?.lastName || null,
      },
      lineItems: insertedLineItems,
    };
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrderWithDetails | undefined> {
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));

    if (!po) return undefined;

    const items = await db
      .select()
      .from(poLineItems)
      .where(eq(poLineItems.purchaseOrderId, id));

    const supplier = po.companyId ? await this.getUser(po.supplierId, po.companyId) : undefined;
    const createdBy = po.companyId ? await this.getUser(po.createdById, po.companyId) : undefined;

    return {
      ...po,
      supplier: {
        id: supplier?.id || po.supplierId,
        organizationName: supplier?.organizationName || null,
        email: supplier?.email || null,
        accountNumber: supplier?.accountNumber || null,
        contactEmail: supplier?.contactEmail || null,
        contactPhone: supplier?.contactPhone || null,
      },
      createdBy: {
        id: createdBy?.id || po.createdById,
        firstName: createdBy?.firstName || null,
        lastName: createdBy?.lastName || null,
      },
      lineItems: items,
    };
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderWithDetails | undefined> {
    return await this.getPurchaseOrder(id);
  }

  async getPurchaseOrders(filters: {
    supplierId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<PurchaseOrderWithDetails[]> {
    const { supplierId, status, limit = 50, offset = 0 } = filters;

    let conditions = [];
    
    if (supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, supplierId));
    }
    
    if (status && status !== "all") {
      conditions.push(eq(purchaseOrders.status, status as PurchaseOrder["status"]));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const pos = await db
      .select()
      .from(purchaseOrders)
      .where(whereClause)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit)
      .offset(offset);

    const results: PurchaseOrderWithDetails[] = [];

    for (const po of pos) {
      const items = await db
        .select()
        .from(poLineItems)
        .where(eq(poLineItems.purchaseOrderId, po.id));

      const supplier = po.companyId ? await this.getUser(po.supplierId, po.companyId) : undefined;
      const createdBy = po.companyId ? await this.getUser(po.createdById, po.companyId) : undefined;

      results.push({
        ...po,
        supplier: {
          id: supplier?.id || po.supplierId,
          organizationName: supplier?.organizationName || null,
          email: supplier?.email || null,
          accountNumber: supplier?.accountNumber || null,
          contactEmail: supplier?.contactEmail || null,
          contactPhone: supplier?.contactPhone || null,
        },
        createdBy: {
          id: createdBy?.id || po.createdById,
          firstName: createdBy?.firstName || null,
          lastName: createdBy?.lastName || null,
        },
        lineItems: items,
      });
    }

    return results;
  }

  async updatePOStatus(id: string, status: PurchaseOrder["status"], trackingNumber?: string, actualDeliveryDate?: Date): Promise<PurchaseOrder | undefined> {
    const updateData: any = { 
      status,
      updatedAt: new Date(),
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (actualDeliveryDate) {
      updateData.actualDeliveryDate = actualDeliveryDate;
    }

    const [po] = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id))
      .returning();
    
    return po;
  }

  async createTechnicalDocument(insertDoc: InsertTechnicalDocument, supplierId: string): Promise<TechnicalDocument> {
    const [doc] = await db.insert(technicalDocuments).values({
      ...insertDoc,
      supplierId,
    }).returning();
    return doc;
  }

  async getTechnicalDocuments(supplierId?: string): Promise<TechnicalDocumentWithSupplier[]> {
    const whereClause = supplierId ? eq(technicalDocuments.supplierId, supplierId) : undefined;

    const results = await db
      .select({
        doc: technicalDocuments,
        supplier: {
          id: users.id,
          organizationName: users.organizationName,
        },
      })
      .from(technicalDocuments)
      .innerJoin(users, eq(technicalDocuments.supplierId, users.id))
      .where(whereClause)
      .orderBy(desc(technicalDocuments.uploadedAt));

    return results.map(r => ({
      ...r.doc,
      supplier: r.supplier,
    }));
  }

  async deleteTechnicalDocument(id: string, supplierId: string): Promise<boolean> {
    const result = await db
      .delete(technicalDocuments)
      .where(and(
        eq(technicalDocuments.id, id),
        eq(technicalDocuments.supplierId, supplierId)
      ))
      .returning();
    
    return result.length > 0;
  }

  async getOrganizationSettings(): Promise<OrganizationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(organizationSettings)
      .limit(1);
    
    return settings;
  }

  async updateOrganizationSettings(settingsData: UpdateOrganizationSettings, updatedById: string): Promise<OrganizationSettings> {
    const existing = await this.getOrganizationSettings();

    if (existing) {
      const [updated] = await db
        .update(organizationSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
          updatedById,
        })
        .where(eq(organizationSettings.id, existing.id))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(organizationSettings)
        .values({
          ...settingsData,
          updatedById,
        })
        .returning();
      
      return created;
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    
    return prefs;
  }

  async updateUserPreferences(userId: string, preferencesData: UpdateUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);

    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({
          ...preferencesData,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(userPreferences)
        .values({
          ...preferencesData,
          userId,
        })
        .returning();
      
      return created;
    }
  }

  async getPatients(ecpId: string, companyId?: string): Promise<Patient[]> {
    const conditions = [eq(patients.ecpId, ecpId)];
    
    if (companyId) {
      conditions.push(eq(patients.companyId, companyId));
    }
    
    return await db
      .select()
      .from(patients)
      .where(and(...conditions))
      .orderBy(desc(patients.createdAt));
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set(updates)
      .where(eq(patients.id, id))
      .returning();
    
    return patient;
  }

  // Patient Activity Log methods
  async createPatientActivity(activity: any): Promise<any> {
    const { patientActivityLog } = await import("@shared/schema");
    const [log] = await db.insert(patientActivityLog).values(activity).returning();
    return log;
  }

  async getPatientActivityLog(
    patientId: string,
    companyId: string,
    options?: {
      limit?: number;
      activityTypes?: string[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<any[]> {
    const { patientActivityLog } = await import("@shared/schema");
    const { and, eq, inArray, gte, lte, desc } = await import("drizzle-orm");
    
    const conditions = [
      eq(patientActivityLog.patientId, patientId),
      eq(patientActivityLog.companyId, companyId),
    ];
    
    if (options?.activityTypes && options.activityTypes.length > 0) {
      conditions.push(inArray(patientActivityLog.activityType, options.activityTypes as any));
    }
    
    if (options?.startDate) {
      conditions.push(gte(patientActivityLog.createdAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(patientActivityLog.createdAt, options.endDate));
    }
    
    let query = db
      .select()
      .from(patientActivityLog)
      .where(and(...conditions))
      .orderBy(desc(patientActivityLog.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    
    return await query;
  }

  async createEyeExamination(insertExamination: InsertEyeExamination, ecpId: string): Promise<EyeExamination> {
    const [examination] = await db.insert(eyeExaminations).values({
      ...insertExamination,
      ecpId,
    } as any).returning();
    return examination;
  }

  async getEyeExamination(id: string, companyId?: string): Promise<EyeExaminationWithDetails | undefined> {
    const conditions = [eq(eyeExaminations.id, id)];
    if (companyId) {
      conditions.push(eq(eyeExaminations.companyId, companyId));
    }
    const result = await db
      .select({
        examination: eyeExaminations,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(eyeExaminations)
      .innerJoin(patients, eq(eyeExaminations.patientId, patients.id))
      .innerJoin(users, eq(eyeExaminations.ecpId, users.id))
      .where(and(...conditions))
      .limit(1);

    if (!result.length) return undefined;

    return {
      ...result[0].examination,
      patient: result[0].patient,
      ecp: result[0].ecp,
    };
  }

  async getEyeExaminations(ecpId: string, companyId?: string): Promise<EyeExaminationWithDetails[]> {
    const whereConditions = [eq(eyeExaminations.ecpId, ecpId)];
    
    // Multi-tenancy: filter by companyId if provided
    if (companyId) {
      whereConditions.push(eq(eyeExaminations.companyId, companyId));
    }
    
    const results = await db
      .select({
        examination: eyeExaminations,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(eyeExaminations)
      .innerJoin(patients, eq(eyeExaminations.patientId, patients.id))
      .innerJoin(users, eq(eyeExaminations.ecpId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(eyeExaminations.examinationDate));

    return results.map(r => ({
      ...r.examination,
      patient: r.patient,
      ecp: r.ecp,
    }));
  }

  async getPatientExaminations(patientId: string, companyId?: string): Promise<EyeExaminationWithDetails[]> {
    const whereConditions = [eq(eyeExaminations.patientId, patientId)];
    
    // Multi-tenancy: filter by companyId if provided
    if (companyId) {
      whereConditions.push(eq(eyeExaminations.companyId, companyId));
    }
    
    const results = await db
      .select({
        examination: eyeExaminations,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(eyeExaminations)
      .innerJoin(patients, eq(eyeExaminations.patientId, patients.id))
      .innerJoin(users, eq(eyeExaminations.ecpId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(eyeExaminations.examinationDate));

    return results.map(r => ({
      ...r.examination,
      patient: r.patient,
      ecp: r.ecp,
    }));
  }

  async updateEyeExamination(id: string, updates: Partial<EyeExamination>): Promise<EyeExamination | undefined> {
    const [examination] = await db
      .update(eyeExaminations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(eyeExaminations.id, id))
      .returning();
    
    return examination;
  }

  async finalizeExamination(id: string, ecpId: string): Promise<EyeExamination | undefined> {
    const [examination] = await db
      .update(eyeExaminations)
      .set({
        status: 'finalized',
        updatedAt: new Date(),
      })
      .where(and(eq(eyeExaminations.id, id), eq(eyeExaminations.ecpId, ecpId)))
      .returning();
    
    return examination;
  }

  async createPrescription(insertPrescription: InsertPrescription, ecpId: string): Promise<Prescription> {
    const [prescription] = await db.insert(prescriptions).values({
      ...insertPrescription,
      ecpId,
    } as any).returning();
    return prescription;
  }

  async getPrescription(id: string, companyId?: string): Promise<PrescriptionWithDetails | undefined> {
    const conditions = [eq(prescriptions.id, id)];
    if (companyId) {
      conditions.push(eq(prescriptions.companyId, companyId));
    }
    const result = await db
      .select({
        prescription: prescriptions,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        examination: eyeExaminations,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(users, eq(prescriptions.ecpId, users.id))
      .leftJoin(eyeExaminations, eq(prescriptions.examinationId, eyeExaminations.id))
      .where(and(...conditions))
      .limit(1);

    if (!result.length) return undefined;

    return {
      ...result[0].prescription,
      patient: result[0].patient,
      ecp: result[0].ecp,
      examination: result[0].examination || undefined,
    };
  }

  async getPrescriptions(ecpId: string, companyId?: string): Promise<PrescriptionWithDetails[]> {
    const conditions = [eq(prescriptions.ecpId, ecpId)];
    
    if (companyId) {
      conditions.push(eq(prescriptions.companyId, companyId));
    }
    
    const results = await db
      .select({
        prescription: prescriptions,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        examination: eyeExaminations,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(users, eq(prescriptions.ecpId, users.id))
      .leftJoin(eyeExaminations, eq(prescriptions.examinationId, eyeExaminations.id))
      .where(and(...conditions))
      .orderBy(desc(prescriptions.issueDate));

    return results.map(r => ({
      ...r.prescription,
      patient: r.patient,
      ecp: r.ecp,
      examination: r.examination || undefined,
    }));
  }

  async signPrescription(id: string, ecpId: string, signature: string): Promise<Prescription | undefined> {
    const [prescription] = await db
      .update(prescriptions)
      .set({
        isSigned: true,
        signedByEcpId: ecpId,
        digitalSignature: signature,
        signedAt: new Date(),
      })
      .where(eq(prescriptions.id, id))
      .returning();
    
    return prescription;
  }

  async createProduct(insertProduct: InsertProduct, ecpId: string): Promise<Product> {
    const [product] = await db.insert(products).values({
      ...insertProduct,
      ecpId,
    }).returning();
    return product;
  }

  async getProduct(id: string, companyId?: string): Promise<Product | undefined> {
    const conditions = [eq(products.id, id)];
    if (companyId) {
      conditions.push(eq(products.companyId, companyId));
    }
    const [product] = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .limit(1);
    
    return product;
  }

  async getProducts(ecpId: string, companyId?: string): Promise<Product[]> {
    const conditions = [eq(products.ecpId, ecpId)];
    
    if (companyId) {
      conditions.push(eq(products.companyId, companyId));
    }
    
    return await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(products.productType, products.brand, products.model);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    
    return result.length > 0;
  }

  async createInvoice(invoiceData: InsertInvoice & { lineItems: InsertInvoiceLineItem[] }, ecpId: string): Promise<InvoiceWithDetails> {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const { lineItems, ...invoiceFields } = invoiceData;

    const [invoice] = await db.insert(invoices).values({
      ...invoiceFields,
      invoiceNumber,
      ecpId,
    }).returning();

    const insertedLineItems = await db.insert(invoiceLineItems).values(
      lineItems.map(item => ({
        ...item,
        invoiceId: invoice.id,
      }))
    ).returning();

    let patient: Patient | undefined = undefined;
    if (invoice.patientId && invoice.companyId) {
      patient = await this.getPatient(invoice.patientId, invoice.companyId);
    }

    const ecp = invoice.companyId ? await this.getUser(ecpId, invoice.companyId) : undefined;

    return {
      ...invoice,
      patient: patient,
      ecp: {
        id: ecp?.id || ecpId,
        firstName: ecp?.firstName || null,
        lastName: ecp?.lastName || null,
      },
      lineItems: insertedLineItems,
    };
  }

  async getInvoice(id: string, companyId: string): Promise<InvoiceWithDetails | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.companyId, companyId)
      ));

    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, id));

    let patient: Patient | undefined = undefined;
    if (invoice.patientId) {
      patient = await this.getPatient(invoice.patientId, companyId);
    }

    const ecp = await this.getUser(invoice.ecpId, companyId);

    return {
      ...invoice,
      patient: patient,
      ecp: {
        id: ecp?.id || invoice.ecpId,
        firstName: ecp?.firstName || null,
        lastName: ecp?.lastName || null,
      },
      lineItems: items,
    };
  }

  async getInvoices(ecpId: string, companyId?: string): Promise<InvoiceWithDetails[]> {
    const conditions = [eq(invoices.ecpId, ecpId)];
    
    if (companyId) {
      conditions.push(eq(invoices.companyId, companyId));
    }
    
    const invoicesList = await db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.invoiceDate));

    const invoicesWithDetails = await Promise.all(
      invoicesList.map(async (invoice) => {
        const items = await db
          .select()
          .from(invoiceLineItems)
          .where(eq(invoiceLineItems.invoiceId, invoice.id));

        let patient: Patient | undefined = undefined;
        if (invoice.patientId && invoice.companyId) {
          patient = await this.getPatient(invoice.patientId, invoice.companyId);
        }

        const ecp = invoice.companyId ? await this.getUser(ecpId, invoice.companyId) : undefined;

        return {
          ...invoice,
          patient: patient,
          ecp: {
            id: ecp?.id || ecpId,
            firstName: ecp?.firstName || null,
            lastName: ecp?.lastName || null,
          },
          lineItems: items,
        };
      })
    );

    return invoicesWithDetails;
  }

  async updateInvoiceStatus(id: string, status: Invoice["status"]): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    
    return invoice;
  }

  async recordPayment(id: string, amount: string, companyId: string): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id, companyId);
    if (!invoice) return undefined;

    const currentPaid = parseFloat(invoice.amountPaid);
    const paymentAmount = parseFloat(amount);
    const newAmountPaid = (currentPaid + paymentAmount).toFixed(2);
    const total = parseFloat(invoice.totalAmount);

    const newStatus = parseFloat(newAmountPaid) >= total ? 'paid' : 'draft';

    const [updated] = await db
      .update(invoices)
      .set({
        amountPaid: newAmountPaid,
        status: newStatus as Invoice["status"],
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    
    return updated;
  }

  // ============== COMPANY & MULTI-TENANT METHODS ==============

  async createCompany(company: InsertCompany): Promise<Company> {
    const [created] = await db
      .insert(companies)
      .values(company)
      .returning();
    return created;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);
    return company;
  }

  async getCompanies(filters?: { type?: string; status?: string }): Promise<Company[]> {
    let query = db.select().from(companies);
    
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(companies.type, filters.type as any));
    }
    if (filters?.status) {
      conditions.push(eq(companies.status, filters.status as any));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async updateCompanyAiProgress(id: string, progress: number): Promise<void> {
    await db
      .update(companies)
      .set({ 
        aiLearningProgress: progress,
        updatedAt: new Date() 
      })
      .where(eq(companies.id, id));
  }

  async createCompanySupplierRelationship(relationship: InsertCompanySupplierRelationship): Promise<CompanySupplierRelationship> {
    const [created] = await db
      .insert(companySupplierRelationships)
      .values(relationship)
      .returning();
    return created;
  }

  async getCompanySupplierRelationships(companyId: string): Promise<CompanySupplierRelationship[]> {
    return await db
      .select()
      .from(companySupplierRelationships)
      .where(eq(companySupplierRelationships.companyId, companyId));
  }

  async updateSupplierRelationshipStatus(
    id: string, 
    status: string, 
    approvedBy?: string
  ): Promise<CompanySupplierRelationship | undefined> {
    const [updated] = await db
      .update(companySupplierRelationships)
      .set({ 
        status,
        approvedBy,
        approvedAt: status === 'approved' ? new Date() : undefined
      })
      .where(eq(companySupplierRelationships.id, id))
      .returning();
    return updated;
  }

  // ============== AI ASSISTANT METHODS ==============

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [created] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return created;
  }

  async getAiConversation(id: string): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id))
      .limit(1);
    return conversation;
  }

  async getAiConversations(companyId: string, userId?: string): Promise<AiConversation[]> {
    const conditions = [eq(aiConversations.companyId, companyId)];
    if (userId) {
      conditions.push(eq(aiConversations.userId, userId));
    }
    
    return await db
      .select()
      .from(aiConversations)
      .where(and(...conditions))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation | undefined> {
    const [updated] = await db
      .update(aiConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiConversations.id, id))
      .returning();
    return updated;
  }

  async createAiMessage(message: InsertAiMessage): Promise<AiMessage> {
    const [created] = await db
      .insert(aiMessages)
      .values(message)
      .returning();
    return created;
  }

  async getAiMessages(conversationId: string): Promise<AiMessage[]> {
    return await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
  }

  async createAiKnowledgeBase(knowledge: InsertAiKnowledgeBase): Promise<AiKnowledgeBase> {
    const [created] = await db
      .insert(aiKnowledgeBase)
      .values(knowledge)
      .returning();
    return created;
  }

  async getAiKnowledgeBase(id: string): Promise<AiKnowledgeBase | undefined> {
    const [knowledge] = await db
      .select()
      .from(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.id, id))
      .limit(1);
    return knowledge;
  }

  async getAiKnowledgeBaseByCompany(companyId: string): Promise<AiKnowledgeBase[]> {
    return await db
      .select()
      .from(aiKnowledgeBase)
      .where(and(
        eq(aiKnowledgeBase.companyId, companyId),
        eq(aiKnowledgeBase.isActive, true)
      ))
      .orderBy(desc(aiKnowledgeBase.createdAt));
  }

  async updateAiKnowledgeBase(id: string, updates: Partial<AiKnowledgeBase>): Promise<AiKnowledgeBase | undefined> {
    const [updated] = await db
      .update(aiKnowledgeBase)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiKnowledgeBase.id, id))
      .returning();
    return updated;
  }

  async deleteAiKnowledgeBase(id: string): Promise<boolean> {
    const result = await db
      .delete(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.id, id));
    return true;
  }

  async createAiLearningData(learning: InsertAiLearningData): Promise<AiLearningData> {
    const [created] = await db
      .insert(aiLearningData)
      .values(learning)
      .returning();
    return created;
  }

  async getAiLearningDataByCompany(companyId: string): Promise<AiLearningData[]> {
    return await db
      .select()
      .from(aiLearningData)
      .where(eq(aiLearningData.companyId, companyId))
      .orderBy(desc(aiLearningData.confidence), desc(aiLearningData.useCount));
  }

  async updateAiLearningData(id: string, updates: Partial<AiLearningData>): Promise<AiLearningData | undefined> {
    const [updated] = await db
      .update(aiLearningData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiLearningData.id, id))
      .returning();
    return updated;
  }

  async incrementAiLearningUseCount(id: string): Promise<void> {
    await db
      .update(aiLearningData)
      .set({ 
        useCount: sql`${aiLearningData.useCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiLearningData.id, id));
  }

  async createAiFeedback(feedback: InsertAiFeedback): Promise<AiFeedback> {
    const [created] = await db
      .insert(aiFeedback)
      .values(feedback)
      .returning();
    return created;
  }

  async getAiFeedbackByMessage(messageId: string): Promise<AiFeedback[]> {
    return await db
      .select()
      .from(aiFeedback)
      .where(eq(aiFeedback.messageId, messageId));
  }

  async getAiFeedbackByCompany(companyId: string): Promise<AiFeedback[]> {
    return await db
      .select()
      .from(aiFeedback)
      .where(eq(aiFeedback.companyId, companyId))
      .orderBy(desc(aiFeedback.createdAt));
  }

  // Subscription and payment methods
  async getSubscriptionPlans() {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
  }

  async createSubscriptionHistory(history: any) {
    const [created] = await db
      .insert(subscriptionHistory)
      .values(history)
      .returning();
    return created;
  }

  async getSubscriptionHistory(companyId: string) {
    return await db
      .select()
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.companyId, companyId))
      .orderBy(desc(subscriptionHistory.createdAt));
  }

  async createPaymentIntent(payment: any) {
    const [created] = await db
      .insert(stripePaymentIntents)
      .values(payment)
      .returning();
    return created;
  }

  async getCompanyByStripeCustomerId(customerId: string) {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.stripeCustomerId, customerId))
      .limit(1);
    return company;
  }

  async createDispenseRecord(record: any) {
    const [created] = await db
      .insert(dispenseRecords)
      .values(record)
      .returning();
    return created;
  }

  async getDispenseRecords(orderId: string) {
    return await db
      .select()
      .from(dispenseRecords)
      .where(eq(dispenseRecords.orderId, orderId));
  }

  // Master AI Training methods
  async createAiModelVersion(version: any) {
    const [created] = await db
      .insert(aiModelVersions)
      .values(version)
      .returning();
    return created;
  }

  async getAiModelVersions(status?: string) {
    if (status) {
      return await db
        .select()
        .from(aiModelVersions)
        .where(eq(aiModelVersions.status, status))
        .orderBy(desc(aiModelVersions.createdAt));
    }
    return await db
      .select()
      .from(aiModelVersions)
      .orderBy(desc(aiModelVersions.createdAt));
  }

  async getAiModelVersion(id: string) {
    const [version] = await db
      .select()
      .from(aiModelVersions)
      .where(eq(aiModelVersions.id, id))
      .limit(1);
    return version;
  }

  async updateAiModelVersion(id: string, updates: any) {
    const [updated] = await db
      .update(aiModelVersions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiModelVersions.id, id))
      .returning();
    return updated;
  }

  async createModelDeployment(deployment: any) {
    const [created] = await db
      .insert(aiModelDeployments)
      .values(deployment)
      .returning();
    return created;
  }

  async getModelDeployments(filters: { companyId?: string; modelVersionId?: string; status?: string }) {
    let query = db.select().from(aiModelDeployments);

    if (filters.companyId) {
      query = query.where(eq(aiModelDeployments.companyId, filters.companyId)) as any;
    }
    if (filters.modelVersionId) {
      query = query.where(eq(aiModelDeployments.modelVersionId, filters.modelVersionId)) as any;
    }
    if (filters.status) {
      query = query.where(eq(aiModelDeployments.deploymentStatus, filters.status)) as any;
    }

    return await query.orderBy(desc(aiModelDeployments.deployedAt));
  }

  async getModelDeploymentsByVersion(versionId: string) {
    return await db
      .select()
      .from(aiModelDeployments)
      .where(eq(aiModelDeployments.modelVersionId, versionId))
      .orderBy(desc(aiModelDeployments.deployedAt));
  }

  async createMasterTrainingDataset(dataset: any) {
    const [created] = await db
      .insert(masterTrainingDatasets)
      .values(dataset)
      .returning();
    return created;
  }

  async getMasterTrainingDatasets(filters: any) {
    let query = db.select().from(masterTrainingDatasets);

    if (filters.category) {
      query = query.where(eq(masterTrainingDatasets.category, filters.category)) as any;
    }
    if (filters.status) {
      query = query.where(eq(masterTrainingDatasets.status, filters.status)) as any;
    }
    if (filters.modelVersionId) {
      query = query.where(eq(masterTrainingDatasets.modelVersionId, filters.modelVersionId)) as any;
    }

    return await query.orderBy(desc(masterTrainingDatasets.createdAt));
  }

  async getMasterTrainingDataByVersion(versionId: string) {
    return await db
      .select()
      .from(masterTrainingDatasets)
      .where(eq(masterTrainingDatasets.modelVersionId, versionId))
      .orderBy(desc(masterTrainingDatasets.createdAt));
  }

  async updateMasterTrainingDataset(id: string, updates: any) {
    const [updated] = await db
      .update(masterTrainingDatasets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(masterTrainingDatasets.id, id))
      .returning();
    return updated;
  }

  async deleteMasterTrainingDataset(id: string) {
    await db
      .delete(masterTrainingDatasets)
      .where(eq(masterTrainingDatasets.id, id));
  }

  async createAiTrainingJob(job: any) {
    const [created] = await db
      .insert(aiTrainingJobs)
      .values(job)
      .returning();
    return created;
  }

  async getAiTrainingJobs(filters: { status?: string; modelVersionId?: string }) {
    let query = db.select().from(aiTrainingJobs);

    if (filters.status) {
      query = query.where(eq(aiTrainingJobs.status, filters.status)) as any;
    }
    if (filters.modelVersionId) {
      query = query.where(eq(aiTrainingJobs.modelVersionId, filters.modelVersionId)) as any;
    }

    return await query.orderBy(desc(aiTrainingJobs.createdAt));
  }

  async createDeploymentQueue(deployment: any) {
    const [created] = await db
      .insert(aiDeploymentQueue)
      .values(deployment)
      .returning();
    return created;
  }

  async updateDeploymentQueue(id: string, updates: any) {
    const [updated] = await db
      .update(aiDeploymentQueue)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiDeploymentQueue.id, id))
      .returning();
    return updated;
  }

  async getAllCompanyAiSettings() {
    return await db
      .select()
      .from(companyAiSettings);
  }

  async updateCompanyAiSettings(companyId: string, updates: any) {
    const [updated] = await db
      .update(companyAiSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyAiSettings.companyId, companyId))
      .returning();
    return updated;
  }

  async getTrainingDataAnalytics() {
    return await db
      .select()
      .from(trainingDataAnalytics)
      .orderBy(desc(trainingDataAnalytics.recordedAt));
  }

  // ============================================================================
  // RCM (REVENUE CYCLE MANAGEMENT) METHODS
  // ============================================================================

  // ========== Insurance Payers ==========

  async createInsurancePayer(payer: InsertInsurancePayer): Promise<InsurancePayer> {
    const [created] = await db
      .insert(insurancePayers)
      .values(payer)
      .returning();
    return created;
  }

  async getInsurancePayer(id: string, companyId: string): Promise<InsurancePayer | undefined> {
    const [payer] = await db
      .select()
      .from(insurancePayers)
      .where(and(
        eq(insurancePayers.id, id),
        eq(insurancePayers.companyId, companyId)
      ));
    return payer;
  }

  async getInsurancePayers(
    companyId: string,
    filters?: { active?: boolean; type?: string }
  ): Promise<InsurancePayer[]> {
    let query = db
      .select()
      .from(insurancePayers)
      .where(eq(insurancePayers.companyId, companyId));

    if (filters?.active !== undefined) {
      query = query.where(
        and(
          eq(insurancePayers.companyId, companyId),
          eq(insurancePayers.active, filters.active)
        )
      ) as any;
    }

    if (filters?.type) {
      query = query.where(
        and(
          eq(insurancePayers.companyId, companyId),
          eq(insurancePayers.type, filters.type as any)
        )
      ) as any;
    }

    return await query.orderBy(insurancePayers.name);
  }

  async updateInsurancePayer(
    id: string,
    companyId: string,
    updates: Partial<InsurancePayer>
  ): Promise<InsurancePayer | undefined> {
    const [updated] = await db
      .update(insurancePayers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(insurancePayers.id, id),
        eq(insurancePayers.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteInsurancePayer(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(insurancePayers)
      .where(and(
        eq(insurancePayers.id, id),
        eq(insurancePayers.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Insurance Claims ==========

  async createInsuranceClaim(claim: InsertInsuranceClaim): Promise<InsuranceClaim> {
    const [created] = await db
      .insert(insuranceClaims)
      .values(claim)
      .returning();
    return created;
  }

  async getInsuranceClaim(id: string, companyId: string): Promise<InsuranceClaim | undefined> {
    const [claim] = await db
      .select()
      .from(insuranceClaims)
      .where(and(
        eq(insuranceClaims.id, id),
        eq(insuranceClaims.companyId, companyId)
      ));
    return claim;
  }

  async getInsuranceClaims(
    companyId: string,
    filters?: { status?: string; patientId?: string; payerId?: string }
  ): Promise<InsuranceClaim[]> {
    const conditions = [eq(insuranceClaims.companyId, companyId)];

    if (filters?.status) {
      conditions.push(eq(insuranceClaims.status, filters.status as any));
    }
    if (filters?.patientId) {
      conditions.push(eq(insuranceClaims.patientId, filters.patientId));
    }
    if (filters?.payerId) {
      conditions.push(eq(insuranceClaims.payerId, filters.payerId));
    }

    return await db
      .select()
      .from(insuranceClaims)
      .where(and(...conditions))
      .orderBy(desc(insuranceClaims.serviceDate));
  }

  async updateInsuranceClaim(
    id: string,
    companyId: string,
    updates: Partial<InsuranceClaim>
  ): Promise<InsuranceClaim | undefined> {
    const [updated] = await db
      .update(insuranceClaims)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(insuranceClaims.id, id),
        eq(insuranceClaims.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteInsuranceClaim(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(insuranceClaims)
      .where(and(
        eq(insuranceClaims.id, id),
        eq(insuranceClaims.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Claim Line Items ==========

  async createClaimLineItem(lineItem: InsertClaimLineItem): Promise<ClaimLineItem> {
    const [created] = await db
      .insert(claimLineItems)
      .values(lineItem)
      .returning();
    return created;
  }

  async getClaimLineItem(id: string): Promise<ClaimLineItem | undefined> {
    const [lineItem] = await db
      .select()
      .from(claimLineItems)
      .where(eq(claimLineItems.id, id));
    return lineItem;
  }

  async getClaimLineItems(claimId: string): Promise<ClaimLineItem[]> {
    return await db
      .select()
      .from(claimLineItems)
      .where(eq(claimLineItems.claimId, claimId))
      .orderBy(claimLineItems.lineNumber);
  }

  async updateClaimLineItem(
    id: string,
    updates: Partial<ClaimLineItem>
  ): Promise<ClaimLineItem | undefined> {
    const [updated] = await db
      .update(claimLineItems)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(claimLineItems.id, id))
      .returning();
    return updated;
  }

  async deleteClaimLineItem(id: string): Promise<boolean> {
    const result = await db
      .delete(claimLineItems)
      .where(eq(claimLineItems.id, id))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Risk Scores ==========

  async createRiskScore(riskScore: InsertRiskScore): Promise<RiskScore> {
    const [created] = await db
      .insert(riskScores)
      .values(riskScore)
      .returning();
    return created;
  }

  async getRiskScore(id: string, companyId: string): Promise<RiskScore | undefined> {
    const [score] = await db
      .select()
      .from(riskScores)
      .where(and(
        eq(riskScores.id, id),
        eq(riskScores.companyId, companyId)
      ));
    return score;
  }

  async getRiskScores(
    companyId: string,
    filters?: {
      patientId?: string;
      riskLevel?: string;
      category?: string;
    }
  ): Promise<RiskScore[]> {
    const conditions = [eq(riskScores.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(riskScores.patientId, filters.patientId));
    }
    if (filters?.riskLevel) {
      conditions.push(eq(riskScores.riskLevel, filters.riskLevel as any));
    }
    if (filters?.category) {
      conditions.push(eq(riskScores.category, filters.category as any));
    }

    return await db
      .select()
      .from(riskScores)
      .where(and(...conditions))
      .orderBy(desc(riskScores.calculatedDate));
  }

  async updateRiskScore(
    id: string,
    companyId: string,
    updates: Partial<RiskScore>
  ): Promise<RiskScore | undefined> {
    const [updated] = await db
      .update(riskScores)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(riskScores.id, id),
        eq(riskScores.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteRiskScore(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(riskScores)
      .where(and(
        eq(riskScores.id, id),
        eq(riskScores.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Health Risk Assessments ==========

  async createHealthRiskAssessment(assessment: InsertHealthRiskAssessment): Promise<HealthRiskAssessment> {
    const [created] = await db
      .insert(healthRiskAssessments)
      .values(assessment)
      .returning();
    return created;
  }

  async getHealthRiskAssessment(id: string, companyId: string): Promise<HealthRiskAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(healthRiskAssessments)
      .where(and(
        eq(healthRiskAssessments.id, id),
        eq(healthRiskAssessments.companyId, companyId)
      ));
    return assessment;
  }

  async getHealthRiskAssessments(
    companyId: string,
    filters?: {
      patientId?: string;
      status?: string;
      assessmentType?: string;
    }
  ): Promise<HealthRiskAssessment[]> {
    const conditions = [eq(healthRiskAssessments.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(healthRiskAssessments.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(healthRiskAssessments.status, filters.status as any));
    }
    if (filters?.assessmentType) {
      conditions.push(eq(healthRiskAssessments.assessmentType, filters.assessmentType));
    }

    return await db
      .select()
      .from(healthRiskAssessments)
      .where(and(...conditions))
      .orderBy(desc(healthRiskAssessments.createdAt));
  }

  async updateHealthRiskAssessment(
    id: string,
    companyId: string,
    updates: Partial<HealthRiskAssessment>
  ): Promise<HealthRiskAssessment | undefined> {
    const [updated] = await db
      .update(healthRiskAssessments)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(healthRiskAssessments.id, id),
        eq(healthRiskAssessments.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteHealthRiskAssessment(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(healthRiskAssessments)
      .where(and(
        eq(healthRiskAssessments.id, id),
        eq(healthRiskAssessments.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Predictive Models ==========

  async createPredictiveModel(model: InsertPredictiveModel): Promise<PredictiveModel> {
    const [created] = await db
      .insert(predictiveModels)
      .values(model)
      .returning();
    return created;
  }

  async getPredictiveModel(id: string, companyId: string): Promise<PredictiveModel | undefined> {
    const [model] = await db
      .select()
      .from(predictiveModels)
      .where(and(
        eq(predictiveModels.id, id),
        eq(predictiveModels.companyId, companyId)
      ));
    return model;
  }

  async getPredictiveModels(
    companyId: string,
    filters?: {
      isActive?: boolean;
      modelType?: string;
    }
  ): Promise<PredictiveModel[]> {
    const conditions = [eq(predictiveModels.companyId, companyId)];

    if (filters?.isActive !== undefined) {
      conditions.push(eq(predictiveModels.isActive, filters.isActive));
    }
    if (filters?.modelType) {
      conditions.push(eq(predictiveModels.modelType, filters.modelType));
    }

    return await db
      .select()
      .from(predictiveModels)
      .where(and(...conditions))
      .orderBy(desc(predictiveModels.createdAt));
  }

  async updatePredictiveModel(
    id: string,
    companyId: string,
    updates: Partial<PredictiveModel>
  ): Promise<PredictiveModel | undefined> {
    const [updated] = await db
      .update(predictiveModels)
      .set(updates)
      .where(and(
        eq(predictiveModels.id, id),
        eq(predictiveModels.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deletePredictiveModel(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(predictiveModels)
      .where(and(
        eq(predictiveModels.id, id),
        eq(predictiveModels.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Predictive Analyses ==========

  async createPredictiveAnalysis(analysis: InsertPredictiveAnalysis): Promise<PredictiveAnalysis> {
    const [created] = await db
      .insert(predictiveAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getPredictiveAnalysis(id: string, companyId: string): Promise<PredictiveAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(predictiveAnalyses)
      .where(and(
        eq(predictiveAnalyses.id, id),
        eq(predictiveAnalyses.companyId, companyId)
      ));
    return analysis;
  }

  async getPredictiveAnalyses(
    companyId: string,
    filters?: {
      patientId?: string;
      modelId?: string;
      riskLevel?: string;
    }
  ): Promise<PredictiveAnalysis[]> {
    const conditions = [eq(predictiveAnalyses.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(predictiveAnalyses.patientId, filters.patientId));
    }
    if (filters?.modelId) {
      conditions.push(eq(predictiveAnalyses.modelId, filters.modelId));
    }
    if (filters?.riskLevel) {
      conditions.push(eq(predictiveAnalyses.riskLevel, filters.riskLevel as any));
    }

    return await db
      .select()
      .from(predictiveAnalyses)
      .where(and(...conditions))
      .orderBy(desc(predictiveAnalyses.analyzedDate));
  }

  async updatePredictiveAnalysis(
    id: string,
    companyId: string,
    updates: Partial<PredictiveAnalysis>
  ): Promise<PredictiveAnalysis | undefined> {
    const [updated] = await db
      .update(predictiveAnalyses)
      .set(updates)
      .where(and(
        eq(predictiveAnalyses.id, id),
        eq(predictiveAnalyses.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deletePredictiveAnalysis(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(predictiveAnalyses)
      .where(and(
        eq(predictiveAnalyses.id, id),
        eq(predictiveAnalyses.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Social Determinants ==========

  async createSocialDeterminant(determinant: InsertSocialDeterminant): Promise<SocialDeterminant> {
    const [created] = await db
      .insert(socialDeterminants)
      .values(determinant)
      .returning();
    return created;
  }

  async getSocialDeterminant(id: string, companyId: string): Promise<SocialDeterminant | undefined> {
    const [determinant] = await db
      .select()
      .from(socialDeterminants)
      .where(and(
        eq(socialDeterminants.id, id),
        eq(socialDeterminants.companyId, companyId)
      ));
    return determinant;
  }

  async getSocialDeterminants(
    companyId: string,
    filters?: {
      patientId?: string;
      category?: string;
      status?: string;
      severity?: string;
    }
  ): Promise<SocialDeterminant[]> {
    const conditions = [eq(socialDeterminants.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(socialDeterminants.patientId, filters.patientId));
    }
    if (filters?.category) {
      conditions.push(eq(socialDeterminants.category, filters.category as any));
    }
    if (filters?.status) {
      conditions.push(eq(socialDeterminants.status, filters.status as any));
    }
    if (filters?.severity) {
      conditions.push(eq(socialDeterminants.severity, filters.severity as any));
    }

    return await db
      .select()
      .from(socialDeterminants)
      .where(and(...conditions))
      .orderBy(desc(socialDeterminants.identifiedDate));
  }

  async updateSocialDeterminant(
    id: string,
    companyId: string,
    updates: Partial<SocialDeterminant>
  ): Promise<SocialDeterminant | undefined> {
    const [updated] = await db
      .update(socialDeterminants)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(socialDeterminants.id, id),
        eq(socialDeterminants.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteSocialDeterminant(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(socialDeterminants)
      .where(and(
        eq(socialDeterminants.id, id),
        eq(socialDeterminants.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Risk Stratification Cohorts ==========

  async createRiskStratificationCohort(cohort: InsertRiskStratificationCohort): Promise<RiskStratificationCohort> {
    const [created] = await db
      .insert(riskStratificationCohorts)
      .values(cohort)
      .returning();
    return created;
  }

  async getRiskStratificationCohort(id: string, companyId: string): Promise<RiskStratificationCohort | undefined> {
    const [cohort] = await db
      .select()
      .from(riskStratificationCohorts)
      .where(and(
        eq(riskStratificationCohorts.id, id),
        eq(riskStratificationCohorts.companyId, companyId)
      ));
    return cohort;
  }

  async getRiskStratificationCohorts(
    companyId: string,
    filters?: {
      active?: boolean;
    }
  ): Promise<RiskStratificationCohort[]> {
    const conditions = [eq(riskStratificationCohorts.companyId, companyId)];

    if (filters?.active !== undefined) {
      conditions.push(eq(riskStratificationCohorts.active, filters.active));
    }

    return await db
      .select()
      .from(riskStratificationCohorts)
      .where(and(...conditions))
      .orderBy(desc(riskStratificationCohorts.createdAt));
  }

  async updateRiskStratificationCohort(
    id: string,
    companyId: string,
    updates: Partial<RiskStratificationCohort>
  ): Promise<RiskStratificationCohort | undefined> {
    const [updated] = await db
      .update(riskStratificationCohorts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(riskStratificationCohorts.id, id),
        eq(riskStratificationCohorts.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteRiskStratificationCohort(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(riskStratificationCohorts)
      .where(and(
        eq(riskStratificationCohorts.id, id),
        eq(riskStratificationCohorts.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // WORLD-CLASS TRANSFORMATION PLACEHOLDER METHODS
  // ============================================================================
  // These methods are placeholders for the new world-class features.
  // They log warnings and return empty/mock data until full implementation.

  async createClinicalAnomaly(data: any) {
    console.warn('[PLACEHOLDER] createClinicalAnomaly not yet implemented. Run migration first.');
    return { id: 'placeholder', ...data };
  }

  async createNotification(data: any) {
    console.warn('[PLACEHOLDER] createNotification not yet implemented. Run migration first.');
    return { id: 'placeholder', ...data };
  }
}

export const storage = new DbStorage();
