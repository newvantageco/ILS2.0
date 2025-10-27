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
  type UserPreferences
} from "@shared/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserWithRoles(id: string): Promise<UserWithRoles | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
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
  getPatient(id: string): Promise<Patient | undefined>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  getOrders(filters?: {
    ecpId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<OrderWithDetails[]>;
  updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined>;
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
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
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

  async getUserWithRoles(id: string): Promise<UserWithRoles | undefined> {
    const user = await this.getUser(id);
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
    const user = await this.getUser(userId);
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
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
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

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
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
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderWithDetails[]> {
    const { ecpId, status, search, limit = 50, offset = 0 } = filters;

    let conditions = [];
    
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
    
    if (!order) return undefined;

    return await this.getOrder(id);
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

    const supplier = await this.getUser(po.supplierId);
    const createdBy = await this.getUser(createdById);

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

    const supplier = await this.getUser(po.supplierId);
    const createdBy = await this.getUser(po.createdById);

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

      const supplier = await this.getUser(po.supplierId);
      const createdBy = await this.getUser(po.createdById);

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
}

export const storage = new DbStorage();
