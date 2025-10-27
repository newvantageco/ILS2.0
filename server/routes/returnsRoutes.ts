import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ReturnsService, ReturnsServiceImpl } from '../services/ReturnsService';

// Request schemas
const returnSchema = z.object({
  orderId: z.string(),
  returnReason: z.string(),
  returnType: z.string(),
  description: z.string(),
  createdBy: z.string(),
  processingNotes: z.string().nullable(),
  replacementOrderId: z.string().nullable(),
  qualityIssueId: z.string().nullable(),
  metadata: z.unknown(),
  status: z.string()
});

const returnFiltersSchema = z.object({
  startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  orderId: z.string().optional(),
  labId: z.string().optional(),
  ecpId: z.string().optional()
});

const updateReturnStatusSchema = z.object({
  status: z.string(),
  resolution: z.string().optional()
});

const nonAdaptSchema = z.object({
  orderId: z.string(),
  metadata: z.unknown(),
  reportedBy: z.string(),
  patientFeedback: z.string(),
  symptoms: z.unknown(),
  resolutionType: z.string().nullable(),
  replacementOrderId: z.string().nullable(),
  qualityIssueId: z.string().nullable(),
  resolution: z.string().nullable(),
  resolvedAt: z.date().nullable()
});

const nonAdaptFiltersSchema = z.object({
  startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  patientId: z.string().optional(),
  ecpId: z.string().optional()
});

const periodSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day')
});

export async function returnsRoutes(fastify: FastifyInstance) {
  const returnsService = new ReturnsServiceImpl();

  // Record a new return
  fastify.post<{ Body: z.infer<typeof returnSchema> }>('/api/returns', async (request, reply) => {
    try {
      const data = returnSchema.parse(request.body);
      // Ensure all required fields are present
      const returnData = {
        ...data,
        metadata: data.metadata || {},
        processingNotes: data.processingNotes || null,
        replacementOrderId: data.replacementOrderId || null,
        qualityIssueId: data.qualityIssueId || null
      };
      const result = await returnsService.recordReturn(returnData);
      reply.code(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error recording return:', error);
        reply.code(500).send({ error: 'Failed to record return' });
      }
    }
  });

  // Get returns with filters
  fastify.get<{ Querystring: z.infer<typeof returnFiltersSchema> }>('/api/returns', async (request, reply) => {
    try {
      const filters = returnFiltersSchema.parse(request.query);
      const returns = await returnsService.getReturns(filters);
      reply.send(returns);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid query parameters', details: error.errors });
      } else {
        console.error('Error fetching returns:', error);
        reply.code(500).send({ error: 'Failed to fetch returns' });
      }
    }
  });

  // Update return status
  fastify.patch<{ 
    Params: { id: string }, 
    Body: z.infer<typeof updateReturnStatusSchema>
  }>('/api/returns/:id/status', async (request, reply) => {
    try {
      const { id } = request.params;
      const { status, resolution } = updateReturnStatusSchema.parse(request.body);
      await returnsService.updateReturnStatus(id, status, resolution);
      reply.code(200).send({ message: 'Return status updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error updating return status:', error);
        reply.code(500).send({ error: 'Failed to update return status' });
      }
    }
  });

  // Record a non-adaptation
  fastify.post<{ Body: z.infer<typeof nonAdaptSchema> }>('/api/non-adaptations', async (request, reply) => {
    try {
      const data = nonAdaptSchema.parse(request.body);
      // Ensure all required fields are present
      const nonAdaptData = {
        ...data,
        metadata: data.metadata || {},
        symptoms: data.symptoms || {},
        replacementOrderId: data.replacementOrderId || null,
        qualityIssueId: data.qualityIssueId || null,
        resolution: data.resolution || null,
        resolutionType: data.resolutionType || null,
        resolvedAt: data.resolvedAt || null
      };
      const result = await returnsService.recordNonAdaptation(nonAdaptData);
      reply.code(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error recording non-adaptation:', error);
        reply.code(500).send({ error: 'Failed to record non-adaptation' });
      }
    }
  });

  // Get non-adaptations with filters
  fastify.get<{ Querystring: z.infer<typeof nonAdaptFiltersSchema> }>(
    '/api/non-adaptations',
    async (request, reply) => {
      try {
        const filters = nonAdaptFiltersSchema.parse(request.query);
        const nonAdapts = await returnsService.getNonAdaptations(filters);
        reply.send(nonAdapts);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: 'Invalid query parameters', details: error.errors });
        } else {
          console.error('Error fetching non-adaptations:', error);
          reply.code(500).send({ error: 'Failed to fetch non-adaptations' });
        }
      }
    }
  );

  // Resolve non-adaptation
  fastify.patch<{ 
    Params: { id: string }, 
    Body: { resolution: string } 
  }>('/api/non-adaptations/:id/resolve', async (request, reply) => {
    try {
      const { id } = request.params;
      const { resolution } = request.body;
      await returnsService.updateNonAdaptationResolution(id, resolution);
      reply.code(200).send({ message: 'Non-adaptation resolved successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error resolving non-adaptation:', error);
        reply.code(500).send({ error: 'Failed to resolve non-adaptation' });
      }
    }
  });

  // Get return rate analytics
  fastify.get<{ Querystring: z.infer<typeof periodSchema> }>(
    '/api/analytics/return-rate',
    async (request, reply) => {
      try {
        const period = periodSchema.parse(request.query);
        const rates = await returnsService.getReturnRate(period);
        reply.send(rates);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: 'Invalid query parameters', details: error.errors });
        } else {
          console.error('Error fetching return rates:', error);
          reply.code(500).send({ error: 'Failed to fetch return rates' });
        }
      }
    }
  );

  // Get non-adaptation analytics
  fastify.get<{ Querystring: z.infer<typeof periodSchema> }>(
    '/api/analytics/non-adaptations',
    async (request, reply) => {
      try {
        const period = periodSchema.parse(request.query);
        const analytics = await returnsService.getNonAdaptationAnalytics(period);
        reply.send(analytics);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: 'Invalid query parameters', details: error.errors });
        } else {
          console.error('Error fetching non-adaptation analytics:', error);
          reply.code(500).send({ error: 'Failed to fetch non-adaptation analytics' });
        }
      }
    }
  );
}