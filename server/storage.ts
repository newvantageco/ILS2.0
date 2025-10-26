import { db } from "../db";
import { 
  users, 
  patients, 
  orders,
  consultLogs,
  purchaseOrders,
  poLineItems,
  technicalDocuments,
  type UpsertUser, 
  type User, 
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
  type TechnicalDocumentWithSupplier
} from "@shared/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getSuppliers(): Promise<User[]>;
  
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

  createConsultLog(log: InsertConsultLog): Promise<ConsultLog>;
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
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async getSuppliers(): Promise<User[]> {
    const suppliers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'supplier'))
      .orderBy(users.organizationName, users.lastName);
    return suppliers;
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
    }).returning();

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

  async createConsultLog(insertLog: InsertConsultLog): Promise<ConsultLog> {
    const [log] = await db.insert(consultLogs).values(insertLog).returning();
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
}

export const storage = new DbStorage();
