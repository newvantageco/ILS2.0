import { db } from "../db";
import {
  
  orders, users, posTransactions, posTransactionItems,
  products
} from '@shared/schema';

// Import tables not yet extracted to modular domains
import { and, eq, gte, lte, sql, desc, between } from "drizzle-orm";

export interface ConversionFunnelData {
  stage: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface CustomerLifetimeValue {
  customerId: string;
  customerName: string;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  firstPurchase: Date;
  lastPurchase: Date;
  daysSinceLastPurchase: number;
}

export interface ProductAffinityData {
  product1: string;
  product2: string;
  coOccurrences: number;
  affinity: number;
}

export interface RevenueByHour {
  hour: number;
  revenue: number;
  transactionCount: number;
  averageValue: number;
}

export interface CohortAnalysis {
  cohort: string;
  month0: number;
  month1: number;
  month2: number;
  month3: number;
  retention: number;
}

export async function getCustomerLifetimeValue(
  companyId: string,
  limit: number = 20
): Promise<CustomerLifetimeValue[]> {
  const customers = await db
    .select({
      customerId: posTransactions.patientId,
      customerName: sql<string>`'Patient ' || ${posTransactions.patientId}`,
      totalSpent: sql<number>`SUM(CAST(${posTransactions.totalAmount} AS DECIMAL))`,
      orderCount: sql<number>`COUNT(*)`,
      averageOrderValue: sql<number>`AVG(CAST(${posTransactions.totalAmount} AS DECIMAL))`,
      firstPurchase: sql<Date>`MIN(${posTransactions.transactionDate})`,
      lastPurchase: sql<Date>`MAX(${posTransactions.transactionDate})`,
    })
    .from(posTransactions)
    .where(
      and(
        eq(posTransactions.companyId, companyId),
        eq(posTransactions.paymentStatus, "completed"),
        sql`${posTransactions.patientId} IS NOT NULL`
      )
    )
    .groupBy(posTransactions.patientId)
    .orderBy(desc(sql`SUM(CAST(${posTransactions.totalAmount} AS DECIMAL))`))
    .limit(limit);

  return customers.map((c) => ({
    customerId: c.customerId || "unknown",
    customerName: c.customerName || "Unknown",
    totalSpent: Number(c.totalSpent),
    orderCount: Number(c.orderCount),
    averageOrderValue: Number(c.averageOrderValue),
    firstPurchase: c.firstPurchase,
    lastPurchase: c.lastPurchase,
    daysSinceLastPurchase: Math.floor(
      (Date.now() - new Date(c.lastPurchase).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

export async function getProductAffinity(
  companyId: string,
  minOccurrences: number = 3
): Promise<ProductAffinityData[]> {
  // Get products frequently bought together
  const affinityData = await db.execute(sql`
    SELECT 
      p1.name as product1,
      p2.name as product2,
      COUNT(*) as co_occurrences,
      (COUNT(*)::float / (
        SELECT COUNT(DISTINCT transaction_id) 
        FROM pos_transaction_items 
        WHERE product_id IN (pti1.product_id, pti2.product_id)
      )) as affinity
    FROM pos_transaction_items pti1
    JOIN pos_transaction_items pti2 ON pti1.transaction_id = pti2.transaction_id
    JOIN pos_transactions pt ON pti1.transaction_id = pt.id
    JOIN products p1 ON pti1.product_id = p1.id
    JOIN products p2 ON pti2.product_id = p2.id
    WHERE pti1.product_id < pti2.product_id
      AND pt.company_id = ${companyId}
      AND pt.payment_status = 'completed'
    GROUP BY p1.name, p2.name
    HAVING COUNT(*) >= ${minOccurrences}
    ORDER BY co_occurrences DESC
    LIMIT 20
  `);

  return (affinityData.rows as any[]).map((row) => ({
    product1: row.product1,
    product2: row.product2,
    coOccurrences: Number(row.co_occurrences),
    affinity: Number(row.affinity),
  }));
}

export async function getRevenueByHourOfDay(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueByHour[]> {
  const hourlyData = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${posTransactions.transactionDate})`,
      revenue: sql<number>`SUM(CAST(${posTransactions.totalAmount} AS DECIMAL))`,
      transactionCount: sql<number>`COUNT(*)`,
      averageValue: sql<number>`AVG(CAST(${posTransactions.totalAmount} AS DECIMAL))`,
    })
    .from(posTransactions)
    .where(
      and(
        eq(posTransactions.companyId, companyId),
        eq(posTransactions.paymentStatus, "completed"),
        between(posTransactions.transactionDate, startDate, endDate)
      )
    )
    .groupBy(sql`EXTRACT(HOUR FROM ${posTransactions.transactionDate})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${posTransactions.transactionDate})`);

  return hourlyData.map((h) => ({
    hour: Number(h.hour),
    revenue: Number(h.revenue),
    transactionCount: Number(h.transactionCount),
    averageValue: Number(h.averageValue),
  }));
}

export async function getAbandonmentAnalysis(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<ConversionFunnelData[]> {
  // This is simplified - in a real system, you'd track cart events
  // For now, we'll simulate a funnel based on transaction stages

  const [totalVisits] = await db
    .select({ count: sql<number>`COUNT(DISTINCT user_id)` })
    .from(posTransactions)
    .where(
      and(
        eq(posTransactions.companyId, companyId),
        between(posTransactions.transactionDate, startDate, endDate)
      )
    );

  const [initiated] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(posTransactions)
    .where(
      and(
        eq(posTransactions.companyId, companyId),
        between(posTransactions.transactionDate, startDate, endDate)
      )
    );

  const [completed] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(posTransactions)
    .where(
      and(
        eq(posTransactions.companyId, companyId),
        eq(posTransactions.paymentStatus, "completed"),
        between(posTransactions.transactionDate, startDate, endDate)
      )
    );

  const visitCount = Number(totalVisits.count) || 1;
  const initiatedCount = Number(initiated.count);
  const completedCount = Number(completed.count);

  return [
    {
      stage: "Browse",
      count: visitCount,
      conversionRate: 100,
      dropOffRate: 0,
    },
    {
      stage: "Add to Cart",
      count: initiatedCount,
      conversionRate: (initiatedCount / visitCount) * 100,
      dropOffRate: ((visitCount - initiatedCount) / visitCount) * 100,
    },
    {
      stage: "Checkout",
      count: completedCount,
      conversionRate: (completedCount / initiatedCount) * 100,
      dropOffRate: ((initiatedCount - completedCount) / initiatedCount) * 100,
    },
  ];
}

export async function getInventoryTurnover(
  companyId: string,
  days: number = 30
): Promise<{
  productId: string;
  productName: string;
  currentStock: number;
  unitsSold: number;
  turnoverRate: number;
  daysToStockout: number;
}[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const endDate = new Date();

  const turnoverData = await db
    .select({
      productId: products.id,
      productName: products.name,
      currentStock: products.stockQuantity,
      unitsSold: sql<number>`COALESCE(SUM(${posTransactionItems.quantity}), 0)`,
    })
    .from(products)
    .leftJoin(posTransactionItems, eq(products.id, posTransactionItems.productId))
    .leftJoin(posTransactions, eq(posTransactionItems.transactionId, posTransactions.id))
    .where(
      and(
        eq(products.companyId, companyId),
        eq(products.isActive, true),
        sql`${posTransactions.transactionDate} >= ${startDate} OR ${posTransactions.transactionDate} IS NULL`
      )
    )
    .groupBy(products.id, products.name, products.stockQuantity)
    .having(sql`${products.stockQuantity} > 0`);

  return turnoverData.map((item) => {
    const unitsSold = Number(item.unitsSold);
    const currentStock = Number(item.currentStock);
    const dailySales = unitsSold / days;
    const turnoverRate = currentStock > 0 ? (unitsSold / currentStock) * 100 : 0;
    const daysToStockout = dailySales > 0 ? currentStock / dailySales : 999;

    return {
      productId: item.productId,
      productName: item.productName || "Unknown",
      currentStock,
      unitsSold,
      turnoverRate,
      daysToStockout: Math.round(daysToStockout),
    };
  });
}

export async function getPeakSalesHours(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<{ hour: number; dayOfWeek: number; revenue: number; transactions: number }[]> {
  const peakData = await db.execute(sql`
    SELECT 
      EXTRACT(HOUR FROM transaction_date) as hour,
      EXTRACT(DOW FROM transaction_date) as day_of_week,
      SUM(CAST(total_amount AS DECIMAL)) as revenue,
      COUNT(*) as transactions
    FROM pos_transactions
    WHERE company_id = ${companyId}
      AND payment_status = 'completed'
      AND transaction_date BETWEEN ${startDate} AND ${endDate}
    GROUP BY EXTRACT(HOUR FROM transaction_date), EXTRACT(DOW FROM transaction_date)
    ORDER BY revenue DESC
    LIMIT 10
  `);

  return (peakData.rows as any[]).map((row) => ({
    hour: Number(row.hour),
    dayOfWeek: Number(row.day_of_week),
    revenue: Number(row.revenue),
    transactions: Number(row.transactions),
  }));
}

export async function getRevenueByDayOfWeek(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<{ dayOfWeek: string; revenue: number; transactions: number; avgValue: number }[]> {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const weekdayData = await db
    .select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${posTransactions.transactionDate})`,
      revenue: sql<number>`SUM(CAST(${posTransactions.totalAmount} AS DECIMAL))`,
      transactions: sql<number>`COUNT(*)`,
      avgValue: sql<number>`AVG(CAST(${posTransactions.totalAmount} AS DECIMAL))`,
    })
    .from(posTransactions)
    .where(
      and(
        eq(posTransactions.companyId, companyId),
        eq(posTransactions.paymentStatus, "completed"),
        between(posTransactions.transactionDate, startDate, endDate)
      )
    )
    .groupBy(sql`EXTRACT(DOW FROM ${posTransactions.transactionDate})`)
    .orderBy(sql`EXTRACT(DOW FROM ${posTransactions.transactionDate})`);

  return weekdayData.map((day) => ({
    dayOfWeek: dayNames[Number(day.dayOfWeek)],
    revenue: Number(day.revenue),
    transactions: Number(day.transactions),
    avgValue: Number(day.avgValue),
  }));
}
