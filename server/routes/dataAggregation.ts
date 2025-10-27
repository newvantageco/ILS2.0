import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DataAggregationService } from '../services/DataAggregationService';
import { analyticsEventTypeEnum } from '../../shared/schema';

interface AnalyticsEventBody {
  eventType: typeof analyticsEventTypeEnum.enumValues[number];
  sourceId: string;
  sourceType: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  organizationId: string;
}

interface AnalyticsQueryParams {
  startTime?: string;
  endTime?: string;
  eventType?: Array<typeof analyticsEventTypeEnum.enumValues[number]>;
  sourceType?: string;
  sourceId?: string;
  organizationId?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly';
}

interface MetricParams {
  metric: typeof analyticsEventTypeEnum.enumValues[number];
}

interface OrganizationParams {
  organizationId: string;
}

export async function registerDataAggregationRoutes(
  fastify: FastifyInstance,
  dataAggregationService: DataAggregationService
) {
  // Record an analytics event
  fastify.post('/api/analytics/events', {
    schema: {
      body: {
        type: 'object',
        required: ['eventType', 'sourceId', 'sourceType', 'data', 'organizationId'],
        properties: {
          eventType: { type: 'string', enum: analyticsEventTypeEnum.enumValues },
          sourceId: { type: 'string' },
          sourceType: { type: 'string' },
          data: { type: 'object' },
          metadata: { type: 'object' },
          organizationId: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      const event = await dataAggregationService.recordEvent(request.body as any);
      reply.code(201).send(event);
    }
  });

  // Get analytics events with filters
  fastify.get('/api/analytics/events', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          eventType: { 
            type: 'array',
            items: { type: 'string', enum: analyticsEventTypeEnum.enumValues }
          },
          sourceType: { type: 'string' },
          sourceId: { type: 'string' },
          organizationId: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      const { startTime, endTime, eventType, sourceType, sourceId, organizationId } = request.query as any;
      
      const filters = {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        eventType,
        sourceType,
        sourceId,
        organizationId
      };

      const events = await dataAggregationService.getEvents(filters);
      reply.send(events);
    }
  });

  // Get aggregated metrics
  fastify.get('/api/analytics/metrics/:metric', {
    schema: {
      params: {
        type: 'object',
        required: ['metric'],
        properties: {
          metric: { type: 'string', enum: analyticsEventTypeEnum.enumValues }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          timeframe: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          organizationId: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      const { metric } = request.params as { metric: string };
      const { timeframe, startTime, endTime, organizationId } = request.query as any;

      const filters = {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        organizationId
      };

      const metrics = await dataAggregationService.getAggregatedMetrics(
        metric,
        timeframe || 'daily',
        filters
      );
      reply.send(metrics);
    }
  });

  // Get quality metrics for an organization
  fastify.get('/api/analytics/quality/:organizationId', {
    schema: {
      params: {
        type: 'object',
        required: ['organizationId'],
        properties: {
          organizationId: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      const { organizationId } = request.params as { organizationId: string };
      const metrics = await dataAggregationService.getQualityMetrics(organizationId);
      reply.send(metrics);
    }
  });
}