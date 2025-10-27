import { db } from '../db';
import { and, between, desc, eq, sql } from 'drizzle-orm';
import * as schema from '../../shared/engineeringSchema';

export interface RcaFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  status?: string;
  assignedTo?: string;
}

export interface QaFailureFilters {
  startDate?: Date;
  endDate?: Date;
  productType?: string;
  failureType?: string;
  severity?: number;
  stage?: string;
}

export interface KpiFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  metric?: string;
  period?: string;
}

export interface ProcessFilters {
  startDate?: Date;
  endDate?: Date;
  process?: string;
  isActive?: boolean;
}

export class EngineeringService {
  // RCA Management
  async createRca(data: Omit<typeof schema.rcaRecords.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return await db.insert(schema.rcaRecords)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
  }

  async getRcaById(id: string) {
    return await db.select()
      .from(schema.rcaRecords)
      .where(eq(schema.rcaRecords.id, id))
      .limit(1);
  }

  async getRcaList(filters: RcaFilters) {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(sql`${schema.rcaRecords.createdAt} >= ${filters.startDate}`);
    }
    if (filters.endDate) {
      conditions.push(sql`${schema.rcaRecords.createdAt} <= ${filters.endDate}`);
    }
    if (filters.category) {
      conditions.push(eq(schema.rcaRecords.category, filters.category));
    }
    if (filters.status) {
      conditions.push(eq(schema.rcaRecords.status, filters.status));
    }
    if (filters.assignedTo) {
      conditions.push(eq(schema.rcaRecords.assignedTo, filters.assignedTo));
    }

    return await db.select()
      .from(schema.rcaRecords)
      .where(and(...conditions))
      .orderBy(desc(schema.rcaRecords.createdAt));
  }

  async updateRca(id: string, data: Partial<typeof schema.rcaRecords.$inferInsert>) {
    return await db.update(schema.rcaRecords)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(schema.rcaRecords.id, id))
      .returning();
  }

  // QA Failure Management
  async recordQaFailure(data: Omit<typeof schema.qaFailures.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return await db.insert(schema.qaFailures)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
  }

  async getQaFailureById(id: string) {
    return await db.select()
      .from(schema.qaFailures)
      .where(eq(schema.qaFailures.id, id))
      .limit(1);
  }

  async getQaFailures(filters: QaFailureFilters) {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(sql`${schema.qaFailures.detectedAt} >= ${filters.startDate}`);
    }
    if (filters.endDate) {
      conditions.push(sql`${schema.qaFailures.detectedAt} <= ${filters.endDate}`);
    }
    if (filters.productType) {
      conditions.push(eq(schema.qaFailures.productType, filters.productType));
    }
    if (filters.failureType) {
      conditions.push(eq(schema.qaFailures.failureType, filters.failureType));
    }
    if (filters.severity) {
      conditions.push(eq(schema.qaFailures.severity, filters.severity));
    }
    if (filters.stage) {
      conditions.push(eq(schema.qaFailures.stage, filters.stage));
    }

    return await db.select()
      .from(schema.qaFailures)
      .where(and(...conditions))
      .orderBy(desc(schema.qaFailures.detectedAt));
  }

  async updateQaFailure(id: string, data: Partial<typeof schema.qaFailures.$inferInsert>) {
    return await db.update(schema.qaFailures)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(schema.qaFailures.id, id))
      .returning();
  }

  // KPI Management
  async recordKpi(data: Omit<typeof schema.engineeringKpis.$inferInsert, 'id' | 'createdAt'>) {
    return await db.insert(schema.engineeringKpis)
      .values({
        ...data,
        createdAt: new Date()
      })
      .returning();
  }

  async getKpis(filters: KpiFilters) {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(sql`${schema.engineeringKpis.startDate} >= ${filters.startDate}`);
    }
    if (filters.endDate) {
      conditions.push(sql`${schema.engineeringKpis.endDate} <= ${filters.endDate}`);
    }
    if (filters.category) {
      conditions.push(eq(schema.engineeringKpis.category, filters.category));
    }
    if (filters.metric) {
      conditions.push(eq(schema.engineeringKpis.metric, filters.metric));
    }
    if (filters.period) {
      conditions.push(eq(schema.engineeringKpis.period, filters.period));
    }

    return await db.select()
      .from(schema.engineeringKpis)
      .where(and(...conditions))
      .orderBy(desc(schema.engineeringKpis.startDate));
  }

  // Process Control Management
  async createControlPoint(data: Omit<typeof schema.controlPoints.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return await db.insert(schema.controlPoints)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
  }

  async getControlPoints(filters: ProcessFilters) {
    const conditions = [];

    if (filters.process) {
      conditions.push(eq(schema.controlPoints.process, filters.process));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(schema.controlPoints.isActive, filters.isActive));
    }

    return await db.select()
      .from(schema.controlPoints)
      .where(and(...conditions))
      .orderBy(desc(schema.controlPoints.createdAt));
  }

  async recordMeasurement(data: Omit<typeof schema.measurements.$inferInsert, 'id' | 'createdAt'>) {
    return await db.insert(schema.measurements)
      .values({
        ...data,
        createdAt: new Date()
      })
      .returning();
  }

  async getMeasurements(controlPointId: string, startDate?: Date, endDate?: Date) {
    const conditions = [eq(schema.measurements.controlPointId, controlPointId)];

    if (startDate) {
      conditions.push(sql`${schema.measurements.timestamp} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${schema.measurements.timestamp} <= ${endDate}`);
    }

    return await db.select()
      .from(schema.measurements)
      .where(and(...conditions))
      .orderBy(desc(schema.measurements.timestamp));
  }

  // Analytics
  async getQualityMetrics(startDate: Date, endDate: Date) {
    const result = await db.execute(sql`
      WITH qa_stats AS (
        SELECT
          COUNT(*) as total_failures,
          COUNT(*) FILTER (WHERE severity >= 4) as critical_failures,
          AVG(CASE WHEN is_reworkable THEN 1 ELSE 0 END) as rework_rate,
          jsonb_agg(
            json_build_object(
              'type', failure_type,
              'count', COUNT(*) OVER (PARTITION BY failure_type)
            )
          ) as failure_types
        FROM ${schema.qaFailures}
        WHERE detected_at BETWEEN ${startDate} AND ${endDate}
      )
      SELECT
        total_failures,
        critical_failures,
        ROUND(rework_rate * 100, 2) as rework_rate_percent,
        (
          SELECT jsonb_agg(distinct elem ORDER BY (elem->>'count')::int DESC)
          FROM jsonb_array_elements(failure_types) elem
        ) as failure_distribution
      FROM qa_stats`);

    return result.rows[0];
  }

  async getProcessControlStatus() {
    const result = await db.execute(sql`
      WITH point_stats AS (
        SELECT
          cp.id,
          cp.name,
          cp.process,
          m.is_within_limits,
          COUNT(*) FILTER (WHERE NOT m.is_within_limits) as violations,
          COUNT(*) as total_measurements
        FROM ${schema.controlPoints} cp
        LEFT JOIN ${schema.measurements} m ON m.control_point_id = cp.id
        WHERE cp.is_active = true
        GROUP BY cp.id, cp.name, cp.process, m.is_within_limits
      )
      SELECT
        id,
        name,
        process,
        ROUND(CAST(violations AS DECIMAL) / NULLIF(total_measurements, 0) * 100, 2) as violation_rate,
        total_measurements
      FROM point_stats
      ORDER BY violation_rate DESC`);

    return result.rows;
  }
}