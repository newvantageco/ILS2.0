/**
 * AI Data Access Layer
 * 
 * Provides secure, multi-tenant database access for the AI assistant.
 * All queries are automatically filtered by companyId to ensure data isolation.
 */

import { db } from "../../db";
import { 
  orders, 
  invoices,
  invoiceLineItems,
  products, 
  patients, 
  eyeExaminations,
  companies,
  users
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, count, sum, avg, or, like } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger("AIDataAccess");

export interface QueryContext {
  companyId: string;
  userId: string;
  timeframe?: {
    start: Date;
    end: Date;
  };
}

export class AIDataAccess {
  /**
   * Get revenue data for a time period
   */
  static async getRevenueData(context: QueryContext) {
    try {
      logger.info("Fetching revenue data", { companyId: context.companyId });

      const conditions = [eq(invoices.companyId, context.companyId)];
      
      if (context.timeframe) {
        conditions.push(
          gte(invoices.invoiceDate, context.timeframe.start),
          lte(invoices.invoiceDate, context.timeframe.end)
        );
      }

      const result = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
          invoiceCount: sql<number>`COUNT(*)`,
          averageInvoice: sql<number>`COALESCE(AVG(${invoices.totalAmount}), 0)`,
        })
        .from(invoices)
        .where(and(...conditions));

      return {
        totalRevenue: parseFloat(result[0]?.totalRevenue?.toString() || "0"),
        invoiceCount: parseInt(result[0]?.invoiceCount?.toString() || "0"),
        averageInvoice: parseFloat(result[0]?.averageInvoice?.toString() || "0"),
      };
    } catch (error) {
      logger.error("Error fetching revenue data", error as Error);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(context: QueryContext) {
    try {
      const conditions = [eq(orders.companyId, context.companyId)];
      
      if (context.timeframe) {
        conditions.push(
          gte(orders.orderDate, context.timeframe.start),
          lte(orders.orderDate, context.timeframe.end)
        );
      }

      const statusCounts = await db
        .select({
          status: orders.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(and(...conditions))
        .groupBy(orders.status);

      return {
        total: statusCounts.reduce((sum, s) => sum + parseInt(s.count.toString()), 0),
        byStatus: statusCounts.reduce((acc, s) => {
          acc[s.status] = parseInt(s.count.toString());
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error("Error fetching order stats", error as Error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(context: QueryContext, threshold: number = 10) {
    try {
      const items = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          stockQuantity: products.stockQuantity,
          lowStockThreshold: products.lowStockThreshold,
          category: products.category,
        })
        .from(products)
        .where(
          and(
            eq(products.companyId, context.companyId),
            sql`${products.stockQuantity} <= ${threshold}`
          )
        )
        .orderBy(products.stockQuantity)
        .limit(20);

      return items;
    } catch (error) {
      logger.error("Error fetching low stock items", error as Error);
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  static async getTopSellingProducts(context: QueryContext, limit: number = 10) {
    try {
      // Get products with their sales count from invoice line items
      const topProducts = await db
        .select({
          productId: invoiceLineItems.productId,
          productName: products.name,
          sku: products.sku,
          category: products.category,
          totalQuantitySold: sql<number>`COALESCE(SUM(${invoiceLineItems.quantity}), 0)`,
          totalRevenue: sql<number>`COALESCE(SUM(${invoiceLineItems.totalPrice}), 0)`,
        })
        .from(invoiceLineItems)
        .innerJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
        .innerJoin(products, eq(invoiceLineItems.productId, products.id))
        .where(eq(invoices.companyId, context.companyId))
        .groupBy(invoiceLineItems.productId, products.name, products.sku, products.category)
        .orderBy(sql`SUM(${invoiceLineItems.quantity}) DESC`)
        .limit(limit);

      return topProducts.map(p => ({
        productId: p.productId,
        name: p.productName,
        sku: p.sku,
        category: p.category,
        quantitySold: parseInt(p.totalQuantitySold.toString()),
        revenue: parseFloat(p.totalRevenue.toString()),
      }));
    } catch (error) {
      logger.error("Error fetching top products", error as Error);
      // Return empty array if no sales data
      return [];
    }
  }

  /**
   * Get patient statistics
   */
  static async getPatientStats(context: QueryContext) {
    try {
      const totalPatients = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(patients)
        .where(eq(patients.companyId, context.companyId));

      // Patients due for recall (last exam > 2 years ago)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const patientsNeedingRecall = await db
        .select({ 
          patientId: patients.id,
          patientName: patients.name,
          lastExamDate: sql<Date>`MAX(${eyeExaminations.examinationDate})`,
        })
        .from(patients)
        .leftJoin(eyeExaminations, eq(patients.id, eyeExaminations.patientId))
        .where(eq(patients.companyId, context.companyId))
        .groupBy(patients.id, patients.name)
        .having(sql`MAX(${eyeExaminations.examinationDate}) < ${twoYearsAgo} OR MAX(${eyeExaminations.examinationDate}) IS NULL`);

      return {
        totalPatients: parseInt(totalPatients[0]?.count.toString() || "0"),
        needingRecall: patientsNeedingRecall.length,
        recallList: patientsNeedingRecall.slice(0, 10), // Top 10
      };
    } catch (error) {
      logger.error("Error fetching patient stats", error as Error);
      throw error;
    }
  }

  /**
   * Search patients by name
   */
  static async searchPatients(context: QueryContext, searchTerm: string) {
    try {
      const results = await db
        .select({
          id: patients.id,
          name: patients.name,
          dateOfBirth: patients.dateOfBirth,
          email: patients.email,
          emergencyContactPhone: patients.emergencyContactPhone,
        })
        .from(patients)
        .where(
          and(
            eq(patients.companyId, context.companyId),
            sql`${patients.name} ILIKE ${'%' + searchTerm + '%'}`
          )
        )
        .limit(10);

      return results;
    } catch (error) {
      logger.error("Error searching patients", error as Error);
      throw error;
    }
  }

  /**
   * Get pending orders
   */
  static async getPendingOrders(context: QueryContext) {
    try {
      const pendingOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          orderDate: orders.orderDate,
          status: orders.status,
          lensType: orders.lensType,
          patientId: orders.patientId,
        })
        .from(orders)
        .where(
          and(
            eq(orders.companyId, context.companyId),
            eq(orders.status, "pending")
          )
        )
        .orderBy(desc(orders.orderDate))
        .limit(20);

      // Fetch patient names
      const ordersWithPatients = await Promise.all(
        pendingOrders.map(async (order) => {
          if (order.patientId) {
            const patient = await db
              .select({ name: patients.name })
              .from(patients)
              .where(eq(patients.id, order.patientId))
              .limit(1);
            
            return {
              ...order,
              patientName: patient[0]?.name || 'Unknown',
            };
          }
          return {
            ...order,
            patientName: 'Unknown',
          };
        })
      );

      return ordersWithPatients;
    } catch (error) {
      logger.error("Error fetching pending orders", error as Error);
      throw error;
    }
  }

  /**
   * Get company information
   */
  static async getCompanyInfo(context: QueryContext) {
    try {
      const company = await db
        .select({
          name: companies.name,
          type: companies.type,
          subscriptionPlan: companies.subscriptionPlan,
          status: companies.status,
        })
        .from(companies)
        .where(eq(companies.id, context.companyId))
        .limit(1);

      return company[0] || null;
    } catch (error) {
      logger.error("Error fetching company info", error as Error);
      throw error;
    }
  }
}
