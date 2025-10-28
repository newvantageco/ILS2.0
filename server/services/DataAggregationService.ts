import { sql, desc, eq, and } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { analyticsEventTypeEnum } from '../../shared/schema';
import { InferModel } from 'drizzle-orm';

type AnalyticsEventType = typeof analyticsEventTypeEnum.enumValues[number];
type AnalyticsEvent = InferModel<typeof schema.analyticsEvents>;

interface TimeSeriesMetricsRow {
  time_period: string;
  event_count: string;
  metrics: Record<string, number>;
  aggregated_data: Record<string, any>[];
}

export interface TimeSeriesMetrics {
  timePeriod: string;
  count: number;
  metrics: Record<string, number>;
  data: Record<string, any>[];
}

interface QualityMetricsRow {
  total_issues: string;
  open_issues: string;
  avg_resolution_time: string;
  top_issue_types: Array<{ type: string; count: number }>;
}

export interface QualityMetrics {
  totalIssues: number;
  openIssues: number;
  avgResolutionTime: number;
  topIssueTypes: Array<{
    type: string;
    count: number;
  }>;
}

export interface DataAggregationService {
  recordEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<AnalyticsEvent>;
  getEvents(filters: {
    startTime?: Date;
    endTime?: Date;
    eventType?: AnalyticsEventType[];
    sourceType?: string;
    sourceId?: string;
    organizationId?: string;
  }): Promise<AnalyticsEvent[]>;
  getAggregatedMetrics(
    metric: AnalyticsEventType,
    timeframe: 'daily' | 'weekly' | 'monthly',
    filters?: {
      startTime?: Date;
      endTime?: Date;
      organizationId?: string;
    }
  ): Promise<TimeSeriesMetrics[]>;
  getQualityMetrics(organizationId: string): Promise<QualityMetrics>;
}

export class DataAggregationServiceImpl implements DataAggregationService {
  async recordEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<AnalyticsEvent> {
    try {
      const [created] = await db.insert(schema.analyticsEvents).values({
        ...event,
        timestamp: new Date()
      }).returning();

      if (!created) {
        throw new Error('Failed to persist analytics event');
      }

      return created as AnalyticsEvent;
    } catch (error) {
      console.error('Error recording analytics event:', error);
      throw error;
    }
  }

  async getEvents(filters: {
    startTime?: Date;
    endTime?: Date;
    eventType?: AnalyticsEventType[];
    sourceType?: string;
    sourceId?: string;
    organizationId?: string;
  }): Promise<AnalyticsEvent[]> {
    try {
      const conditions = [];
      
      if (filters.startTime) {
        conditions.push(sql`${schema.analyticsEvents.timestamp} >= ${filters.startTime}`);
      }
      if (filters.endTime) {
        conditions.push(sql`${schema.analyticsEvents.timestamp} <= ${filters.endTime}`);
      }
      if (filters.eventType?.length) {
        conditions.push(sql`${schema.analyticsEvents.eventType} = ANY(${filters.eventType})`);
      }
      if (filters.sourceType) {
        conditions.push(eq(schema.analyticsEvents.sourceType, filters.sourceType));
      }
      if (filters.sourceId) {
        conditions.push(eq(schema.analyticsEvents.sourceId, filters.sourceId));
      }
      if (filters.organizationId) {
        conditions.push(eq(schema.analyticsEvents.organizationId, filters.organizationId));
      }

      const baseQuery = db
        .select()
        .from(schema.analyticsEvents)
        .orderBy(desc(schema.analyticsEvents.timestamp));

      if (conditions.length === 0) {
        return await baseQuery;
      }

      if (conditions.length === 1) {
        return await baseQuery.where(conditions[0]);
      }

      return await baseQuery.where(and(...conditions));
    } catch (error) {
      console.error('Error fetching analytics events:', error);
      throw error;
    }
  }

  async getAggregatedMetrics(
    metric: AnalyticsEventType,
    timeframe: 'daily' | 'weekly' | 'monthly',
    filters?: {
      startTime?: Date;
      endTime?: Date;
      organizationId?: string;
    }
  ): Promise<TimeSeriesMetrics[]> {
    try {
      const timeFormat = {
        daily: 'YYYY-MM-DD',
        weekly: 'IYYY-IW',
        monthly: 'YYYY-MM'
      }[timeframe];

      const query = sql`
        WITH time_series AS (
          SELECT
            to_char(timestamp, ${timeFormat}) as time_period,
            COUNT(*) as event_count,
            jsonb_agg(data) as aggregated_data,
            jsonb_object_agg(
              COALESCE(data->>'metric_name', 'count'),
              COALESCE((data->>'value')::numeric, 1)
            ) as metrics
          FROM ${schema.analyticsEvents}
          WHERE event_type = ${metric}
          ${filters?.startTime ? sql`AND timestamp >= ${filters.startTime}` : sql``}
          ${filters?.endTime ? sql`AND timestamp <= ${filters.endTime}` : sql``}
          ${filters?.organizationId ? sql`AND organization_id = ${filters.organizationId}` : sql``}
          GROUP BY time_period
          ORDER BY time_period DESC
        )
        SELECT
          time_period,
          event_count,
          metrics,
          aggregated_data
        FROM time_series`;

      const result = await db.execute(query);

      return result.rows.map((rawRow) => {
        const row = rawRow as unknown as TimeSeriesMetricsRow;
        return {
          timePeriod: row.time_period,
          count: Number(row.event_count),
          metrics: row.metrics,
          data: row.aggregated_data
        };
      });
    } catch (error) {
      console.error('Error getting aggregated metrics:', error);
      throw error;
    }
  }

  async getQualityMetrics(organizationId: string): Promise<QualityMetrics> {
    try {
      const query = sql`
        WITH metrics AS (
          SELECT
            COUNT(*) as total_issues,
            COUNT(*) FILTER (WHERE status = 'open') as open_issues,
            AVG(CASE 
              WHEN resolved_at IS NOT NULL 
              THEN EXTRACT(epoch FROM (resolved_at - detected_at))/3600 
              ELSE NULL 
            END) as avg_resolution_time,
            jsonb_agg(
              json_build_object(
                'type', issue_type,
                'count', COUNT(*) OVER (PARTITION BY issue_type)
              )
            ) as top_issue_types
          FROM ${schema.qualityIssues}
          WHERE organization_id = ${organizationId}
        )
        SELECT
          total_issues,
          open_issues,
          avg_resolution_time,
          (
            SELECT jsonb_agg(distinct elem ORDER BY (elem->>'count')::int DESC)
            FROM jsonb_array_elements(top_issue_types) elem
            LIMIT 5
          ) as top_issue_types
        FROM metrics`;

  const result = await db.execute(query);
  const row = result.rows[0] as unknown as QualityMetricsRow | undefined;

      if (!row) {
        return {
          totalIssues: 0,
          openIssues: 0,
          avgResolutionTime: 0,
          topIssueTypes: []
        };
      }

      return {
        totalIssues: Number(row.total_issues),
        openIssues: Number(row.open_issues),
        avgResolutionTime: Number(row.avg_resolution_time),
        topIssueTypes: row.top_issue_types || []
      };
    } catch (error) {
      console.error('Error getting quality metrics:', error);
      throw error;
    }
  }
}