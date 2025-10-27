import { db } from '../db';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { 
  returns,
  orders,
  users,
  qualityIssues,
  nonAdapts,
  analyticsEvents,
} from '../../shared/schema';

export class ReturnsAndNonAdaptService {
  private static instance: ReturnsAndNonAdaptService;

  private constructor() {}

  public static getInstance(): ReturnsAndNonAdaptService {
    if (!ReturnsAndNonAdaptService.instance) {
      ReturnsAndNonAdaptService.instance = new ReturnsAndNonAdaptService();
    }
    return ReturnsAndNonAdaptService.instance;
  }

  async createReturn({
    orderId,
    returnReason,
    returnType,
    description,
    createdBy,
    processingNotes,
    metadata
  }: {
    orderId: string;
    returnReason: string;
    returnType: string;
    description: string;
    createdBy: string;
    processingNotes?: string;
    metadata?: Record<string, any>;
  }) {
    // Start a transaction since we need to update multiple tables
    return await db.transaction(async (tx) => {
      // Create return record
      const [returnRecord] = await tx.insert(returns).values({
        orderId,
        returnReason,
        returnType,
        description,
        createdBy,
        processingNotes,
        metadata,
        status: 'pending',
      }).returning();

      // Create analytics event
      await tx.insert(analyticsEvents).values({
        eventType: 'return_created',
        sourceId: returnRecord.id,
        sourceType: 'return',
        data: {
          orderId,
          returnReason,
          returnType,
        },
        organizationId: (await db.query.users.findFirst({
          where: eq(users.id, createdBy),
          columns: {
            organizationId: true
          }
        }))?.organizationId || ''
      });

      // Update order status
      await tx.update(orders)
        .set({ status: 'on_hold' })
        .where(eq(orders.id, orderId));

      return returnRecord;
    });
  }

  async createNonAdapt({
    orderId,
    reportedBy,
    patientFeedback,
    symptoms,
    resolution,
    resolutionType,
    metadata
  }: {
    orderId: string;
    reportedBy: string;
    patientFeedback: string;
    symptoms: string[];
    resolution?: string;
    resolutionType?: string;
    metadata?: Record<string, any>;
  }) {
    return await db.transaction(async (tx) => {
      // Create non-adapt record
      const [nonAdaptRecord] = await tx.insert(nonAdapts).values({
        orderId,
        reportedBy,
        patientFeedback,
        symptoms,
        resolution,
        resolutionType,
        metadata
      }).returning();

      // Create analytics event
      await tx.insert(analyticsEvents).values({
        eventType: 'non_adapt_reported',
        sourceId: nonAdaptRecord.id,
        sourceType: 'non_adapt',
        data: {
          orderId,
          symptoms,
          resolutionType
        },
        organizationId: (await db.query.users.findFirst({
          where: eq(users.id, reportedBy),
          columns: {
            organizationId: true
          }
        }))?.organizationId || ''
      });

      // Update order status
      await tx.update(orders)
        .set({ status: 'on_hold' })
        .where(eq(orders.id, orderId));

      return nonAdaptRecord;
    });
  }

  async getReturnsByDateRange(startDate: Date, endDate: Date) {
    return await db.query.returns.findMany({
      where: and(
        gte(returns.createdAt, startDate),
        lte(returns.createdAt, endDate)
      ),
      with: {
        order: true
      }
    });
  }

  async getNonAdaptsByDateRange(startDate: Date, endDate: Date) {
    return await db.query.nonAdapts.findMany({
      where: and(
        gte(nonAdapts.createdAt, startDate),
        lte(nonAdapts.createdAt, endDate)
      ),
      with: {
        order: true
      }
    });
  }

  async getReturnStatistics() {
    const returnStats = await db.select({
      returnReason: returns.returnReason,
      returnType: returns.returnType,
      count: sql<number>`count(*)`.as('count')
    })
    .from(returns)
    .groupBy(returns.returnReason, returns.returnType);

    return {
      totalReturns: returnStats.reduce((sum, stat) => sum + stat.count, 0),
      byReason: this.groupByCount(returnStats, 'returnReason'),
      byType: this.groupByCount(returnStats, 'returnType')
    };
  }

  async getNonAdaptStatistics() {
    // First get the counts
    const countStats = await db.select({
      resolutionType: nonAdapts.resolutionType,
      count: sql<number>`count(*)`.as('count')
    })
    .from(nonAdapts)
    .groupBy(nonAdapts.resolutionType);

    // Then get all unique symptoms and their counts
    const symptomsResult = await db.select({
      symptom: sql<string>`unnest(symptoms)`.as('symptom'),
      count: sql<number>`count(*)`.as('count')
    })
    .from(nonAdapts)
    .groupBy(sql`unnest(symptoms)`);

    const symptomsMap: Record<string, number> = {};
    for (const { symptom, count } of symptomsResult) {
      if (symptom) {
        symptomsMap[symptom] = count;
      }
    }

    return {
      totalNonAdapts: countStats.reduce((sum, stat) => sum + Number(stat.count), 0),
      byResolutionType: this.groupByCount(countStats.filter(stat => stat.resolutionType), 'resolutionType'),
      bySymptom: symptomsMap
    };
  }

  private groupByCount<T>(data: T[], key: keyof T): Record<string, number> {
    return data.reduce((acc, curr) => {
      const value = String(curr[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  async updateReturnStatus(returnId: string, status: string) {
    return await db.update(returns)
      .set({ status })
      .where(eq(returns.id, returnId))
      .returning();
  }

  async updateNonAdaptResolution(nonAdaptId: string, resolution: string, resolutionType?: string) {
    const now = new Date();
    return await db.update(nonAdapts)
      .set({ 
        resolution,
        resolutionType,
        resolvedAt: now
      })
      .where(eq(nonAdapts.id, nonAdaptId))
      .returning();
  }

  async linkQualityIssue(entityId: string, entityType: 'return' | 'non_adapt', qualityIssueId: string) {
    if (entityType === 'return') {
      return await db.update(returns)
        .set({ qualityIssueId })
        .where(eq(returns.id, entityId))
        .returning();
    } else {
      return await db.update(nonAdapts)
        .set({ qualityIssueId })
        .where(eq(nonAdapts.id, entityId))
        .returning();
    }
  }
}