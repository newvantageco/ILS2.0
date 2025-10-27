import { sql } from 'drizzle-orm';
import { db } from '../db';
import { desc, eq, and } from 'drizzle-orm/expressions';
import * as schema from '../../shared/schema';
import { InferModel } from 'drizzle-orm';

type Return = InferModel<typeof schema.returns>;
type NonAdaptation = InferModel<typeof schema.nonAdapts>;

export interface ReturnReason {
  id: string;
  reason: string;
  description: string;
  category: 'quality' | 'prescription' | 'fit' | 'other';
  requiresInvestigation: boolean;
}

export interface NonAdaptReason {
  id: string;
  reason: string;
  description: string;
  category: 'vision' | 'comfort' | 'aesthetics' | 'other';
  recommendedActions: string[];
}

export interface ReturnFilters {
  startDate?: Date;
  endDate?: Date;
  orderId?: string;
  labId?: string;
  ecpId?: string;
}

export interface NonAdaptationFilters {
  startDate?: Date;
  endDate?: Date;
  patientId?: string;
  ecpId?: string;
}

export interface ReturnsService {
  recordReturn(returnData: Omit<Return, 'id' | 'createdAt'>): Promise<Return>;
  getReturns(filters: {
    startDate?: Date;
    endDate?: Date;
    orderId?: string;
    labId?: string;
    ecpId?: string;
  }): Promise<Return[]>;
  updateReturnStatus(returnId: string, status: string, resolution?: string): Promise<void>;
  
  recordNonAdaptation(data: Omit<NonAdaptation, 'id' | 'createdAt'>): Promise<NonAdaptation>;
  getNonAdaptations(filters: {
    startDate?: Date;
    endDate?: Date;
    patientId?: string;
    ecpId?: string;
  }): Promise<NonAdaptation[]>;
  updateNonAdaptationResolution(id: string, resolution: string): Promise<void>;
  
  getReturnRate(period: {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'week' | 'month';
  }): Promise<Array<{ period: string; rate: number; count: number }>>;
  getNonAdaptationAnalytics(period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalCount: number;
    byReason: Array<{ reason: string; count: number }>;
    resolutionRate: number;
  }>;
}

export class ReturnsServiceImpl implements ReturnsService {
  async recordReturn(returnData: Omit<Return, 'id' | 'createdAt'>): Promise<Return> {
    try {
      const [created] = await db.insert(schema.returns)
        .values({
          ...returnData,
          createdAt: new Date()
        })
        .returning();

      return created;
    } catch (error) {
      console.error('Error recording return:', error);
      throw error;
    }
  }

  async getReturns(filters: {
    startDate?: Date;
    endDate?: Date;
    orderId?: string;
    labId?: string;
    ecpId?: string;
  }): Promise<Return[]> {
    try {
      const conditions = [];
      
      if (filters.startDate) {
        conditions.push(sql`${schema.returns.createdAt} >= ${filters.startDate}`);
      }
      if (filters.endDate) {
        conditions.push(sql`${schema.returns.createdAt} <= ${filters.endDate}`);
      }
      if (filters.orderId) {
        conditions.push(eq(schema.returns.orderId, filters.orderId));
      }
      if (filters.labId) {
        conditions.push(eq(schema.returns.qualityIssueId, filters.labId));
      }
      if (filters.ecpId) {
        conditions.push(eq(schema.returns.createdBy, filters.ecpId));
      }

      const query = conditions.length > 0
        ? db
            .select()
            .from(schema.returns)
            .where(and(...conditions))
            .orderBy(desc(schema.returns.createdAt))
        : db
            .select()
            .from(schema.returns)
            .orderBy(desc(schema.returns.createdAt));

      return await query;
    } catch (error) {
      console.error('Error fetching returns:', error);
      throw error;
    }
  }

  async updateReturnStatus(returnId: string, status: string, resolution?: string): Promise<void> {
    try {
      await db.update(schema.returns)
        .set({ 
          status,
          processingNotes: resolution || undefined,
        })
        .where(eq(schema.returns.id, returnId));
    } catch (error) {
      console.error('Error updating return status:', error);
      throw error;
    }
  }

  async recordNonAdaptation(data: Omit<NonAdaptation, 'id' | 'createdAt'>): Promise<NonAdaptation> {
    try {
      const [created] = await db.insert(schema.nonAdapts)
        .values({
          ...data,
          createdAt: new Date()
        })
        .returning();

      return created;
    } catch (error) {
      console.error('Error recording non-adaptation:', error);
      throw error;
    }
  }

  async getNonAdaptations(filters: NonAdaptationFilters): Promise<NonAdaptation[]> {
    try {
      const conditions = [];
      
      if (filters.startDate) {
        conditions.push(sql`${schema.nonAdapts.createdAt} >= ${filters.startDate}`);
      }
      if (filters.endDate) {
        conditions.push(sql`${schema.nonAdapts.createdAt} <= ${filters.endDate}`);
      }
      if (filters.patientId) {
        conditions.push(sql`${schema.nonAdapts.orderId} IN (
          SELECT order_id 
          FROM orders 
          WHERE patient_id = ${filters.patientId}
        )`);
      }
      if (filters.ecpId) {
        conditions.push(eq(schema.nonAdapts.reportedBy, filters.ecpId));
      }

      const query = conditions.length > 0
        ? db
            .select()
            .from(schema.nonAdapts)
            .where(and(...conditions))
            .orderBy(desc(schema.nonAdapts.createdAt))
        : db
            .select()
            .from(schema.nonAdapts)
            .orderBy(desc(schema.nonAdapts.createdAt));

      return await query;
    } catch (error) {
      console.error('Error fetching non-adaptations:', error);
      throw error;
    }
  }

  async updateNonAdaptationResolution(id: string, resolution: string): Promise<void> {
    try {
      await db.update(schema.nonAdapts)
        .set({ 
          resolution,
          resolvedAt: new Date()
        })
        .where(eq(schema.nonAdapts.id, id));
    } catch (error) {
      console.error('Error updating non-adaptation resolution:', error);
      throw error;
    }
  }

  async getReturnRate(period: {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'week' | 'month';
  }): Promise<Array<{ period: string; rate: number; count: number }>> {
    try {
      const timeFormat = {
        day: 'YYYY-MM-DD',
        week: 'IYYY-IW',
        month: 'YYYY-MM'
      }[period.groupBy];

      const result = await db.execute<{ period: string; count: number; rate: number }>(sql`
        WITH return_counts AS (
          SELECT
            to_char(created_at, ${timeFormat}) as time_period,
            COUNT(*) as return_count
          FROM ${schema.returns}
          WHERE created_at BETWEEN ${period.startDate} AND ${period.endDate}
          GROUP BY time_period
        ),
        order_counts AS (
          SELECT
            to_char(created_at, ${timeFormat}) as time_period,
            COUNT(*) as order_count
          FROM ${schema.orders}
          WHERE created_at BETWEEN ${period.startDate} AND ${period.endDate}
          GROUP BY time_period
        )
        SELECT
          rc.time_period as period,
          rc.return_count as count,
          ROUND(CAST(rc.return_count AS DECIMAL) / NULLIF(oc.order_count, 0) * 100, 2) as rate
        FROM return_counts rc
        LEFT JOIN order_counts oc ON rc.time_period = oc.time_period
        ORDER BY rc.time_period DESC`);

      return result.rows.map(row => ({
        period: row.period,
        rate: Number(row.rate) || 0,
        count: Number(row.count)
      }));
    } catch (error) {
      console.error('Error calculating return rate:', error);
      throw error;
    }
  }

  async getNonAdaptationAnalytics(period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalCount: number;
    byReason: Array<{ reason: string; count: number }>;
    resolutionRate: number;
  }> {
    try {
      type AnalyticsRow = {
        [key: string]: unknown;
        total_count: number;
        resolution_rate: number;
        by_reason: Array<{ reason: string; count: number }>;
      };

      const result = await db.execute<AnalyticsRow>(sql`
        WITH stats AS (
          SELECT
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_count,
            jsonb_agg(
              json_build_object(
                'reason', COALESCE(resolution_type, 'unknown'),
                'count', COUNT(*) OVER (PARTITION BY resolution_type)
              )
            ) as reasons
          FROM ${schema.nonAdapts}
          WHERE created_at BETWEEN ${period.startDate} AND ${period.endDate}
        )
        SELECT
          total_count,
          ROUND(CAST(resolved_count AS DECIMAL) / NULLIF(total_count, 0) * 100, 2) as resolution_rate,
          COALESCE(
            (
              SELECT jsonb_agg(distinct elem ORDER BY (elem->>'count')::int DESC)
              FROM jsonb_array_elements(reasons) elem
            ),
            '[]'::jsonb
          ) as by_reason
        FROM stats`);

      const row = result.rows[0];

      return {
        totalCount: Number(row.total_count),
        resolutionRate: Number(row.resolution_rate) || 0,
        byReason: row.by_reason || []
      };
    } catch (error) {
      console.error('Error getting non-adaptation analytics:', error);
      throw error;
    }
  }
}