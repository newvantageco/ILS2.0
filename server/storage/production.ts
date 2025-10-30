import { db } from "../db";
import { orders, orderTimeline } from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import type { Order } from "@shared/schema";

export interface ProductionStats {
  pending: number;
  inProduction: number;
  qualityCheck: number;
  completed: number;
  totalToday: number;
  averageCompletionTime: number; // in hours
}

export interface ProductionStage {
  stageName: string;
  ordersCount: number;
  averageTimeInStage: number; // in hours
}

export interface TimelineEvent {
  id: string;
  orderId: string;
  status: string;
  details: string | null;
  timestamp: Date;
  userId: string;
  metadata: any;
}

export async function getProductionStats(companyId: string): Promise<ProductionStats> {
  // Get counts by status
  const statusCounts = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(eq(orders.companyId, companyId))
    .groupBy(orders.status);

  const stats = {
    pending: 0,
    inProduction: 0,
    qualityCheck: 0,
    completed: 0,
    totalToday: 0,
    averageCompletionTime: 0,
  };

  statusCounts.forEach((row) => {
    const count = Number(row.count);
    switch (row.status) {
      case "pending":
        stats.pending = count;
        break;
      case "in_production":
        stats.inProduction = count;
        break;
      case "quality_check":
        stats.qualityCheck = count;
        break;
      case "completed":
        stats.completed = count;
        break;
    }
  });

  // Get orders completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completedToday = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        eq(orders.status, "completed"),
        gte(orders.completedAt, today),
        sql`${orders.completedAt} IS NOT NULL`
      )
    );

  stats.totalToday = Number(completedToday[0]?.count || 0);

  // Calculate average completion time (difference between orderDate and completedAt for completed orders)
  const completedOrders = await db
    .select({
      orderDate: orders.orderDate,
      completedAt: orders.completedAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        eq(orders.status, "completed"),
        sql`${orders.completedAt} IS NOT NULL`
      )
    )
    .limit(100);

  if (completedOrders.length > 0) {
    const totalHours = completedOrders.reduce((sum, order) => {
      if (order.completedAt && order.orderDate) {
        const hours = (new Date(order.completedAt).getTime() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);
    stats.averageCompletionTime = totalHours / completedOrders.length;
  }

  return stats;
}

export async function getOrdersInProduction(companyId: string, status?: string): Promise<Order[]> {
  const conditions = [eq(orders.companyId, companyId)];
  
  if (status) {
    conditions.push(eq(orders.status, status as any));
  } else {
    // Get orders in active production statuses
    conditions.push(
      sql`${orders.status} IN ('pending', 'in_production', 'quality_check')`
    );
  }

  const ordersInProduction = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(orders.orderDate);

  return ordersInProduction;
}

export async function getOrderTimeline(orderId: string, companyId: string): Promise<TimelineEvent[]> {
  // First verify the order belongs to the company
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.companyId, companyId)))
    .limit(1);

  if (!order) {
    return [];
  }

  const timeline = await db
    .select()
    .from(orderTimeline)
    .where(eq(orderTimeline.orderId, orderId))
    .orderBy(desc(orderTimeline.timestamp));

  return timeline;
}

export async function addTimelineEvent(
  orderId: string,
  companyId: string,
  userId: string,
  status: string,
  details?: string,
  metadata?: any
): Promise<TimelineEvent | null> {
  // Verify order belongs to company
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.companyId, companyId)))
    .limit(1);

  if (!order) {
    return null;
  }

  const [event] = await db
    .insert(orderTimeline)
    .values({
      orderId,
      status,
      details: details || null,
      userId,
      metadata: metadata || null,
      timestamp: new Date(),
    })
    .returning();

  return event;
}

export async function updateOrderStatus(
  orderId: string,
  companyId: string,
  userId: string,
  newStatus: string,
  notes?: string
): Promise<Order | null> {
  // First verify the order belongs to the company
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.companyId, companyId)))
    .limit(1);

  if (!order) {
    return null;
  }

  // Update order status
  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: newStatus as any,
      ...(newStatus === "completed" && { completedAt: new Date() }),
    })
    .where(and(eq(orders.id, orderId), eq(orders.companyId, companyId)))
    .returning();

  // Add timeline event
  await addTimelineEvent(
    orderId,
    companyId,
    userId,
    newStatus,
    notes || `Status changed to ${newStatus}`
  );

  return updatedOrder;
}

export async function getProductionStages(companyId: string): Promise<ProductionStage[]> {
  // Get all timeline events for orders in this company
  const timelineData = await db
    .select({
      status: orderTimeline.status,
      timestamp: orderTimeline.timestamp,
      orderId: orderTimeline.orderId,
    })
    .from(orderTimeline)
    .innerJoin(orders, eq(orders.id, orderTimeline.orderId))
    .where(eq(orders.companyId, companyId))
    .orderBy(orderTimeline.timestamp);

  // Group by status and calculate average time
  const stageMap = new Map<string, { count: Set<string>; totalTime: number; transitions: number }>();

  for (let i = 0; i < timelineData.length - 1; i++) {
    const current = timelineData[i];
    const next = timelineData[i + 1];

    if (current.orderId === next.orderId) {
      const timeInStage = (new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()) / (1000 * 60 * 60);
      
      if (!stageMap.has(current.status)) {
        stageMap.set(current.status, { count: new Set(), totalTime: 0, transitions: 0 });
      }
      
      const stage = stageMap.get(current.status)!;
      stage.count.add(current.orderId);
      stage.totalTime += timeInStage;
      stage.transitions += 1;
    }
  }

  const stages: ProductionStage[] = [];
  stageMap.forEach((data, stageName) => {
    stages.push({
      stageName,
      ordersCount: data.count.size,
      averageTimeInStage: data.transitions > 0 ? data.totalTime / data.transitions : 0,
    });
  });

  return stages;
}

export async function getBottlenecks(companyId: string): Promise<{
  stage: string;
  ordersCount: number;
  averageWaitTime: number;
}[]> {
  const stages = await getProductionStages(companyId);
  
  // Sort by average time in stage (descending) to identify bottlenecks
  const bottlenecks = stages
    .filter(s => s.ordersCount > 0)
    .sort((a, b) => b.averageTimeInStage - a.averageTimeInStage)
    .slice(0, 3)
    .map(s => ({
      stage: s.stageName,
      ordersCount: s.ordersCount,
      averageWaitTime: s.averageTimeInStage,
    }));

  return bottlenecks;
}

export async function getProductionVelocity(companyId: string, days: number = 7): Promise<{
  date: string;
  completed: number;
}[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const completedOrders = await db
    .select({
      date: sql<string>`DATE(${orders.completedAt})`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        eq(orders.status, "completed"),
        gte(orders.completedAt, startDate),
        sql`${orders.completedAt} IS NOT NULL`
      )
    )
    .groupBy(sql`DATE(${orders.completedAt})`)
    .orderBy(sql`DATE(${orders.completedAt})`);

  return completedOrders.map(row => ({
    date: row.date,
    completed: Number(row.count),
  }));
}
