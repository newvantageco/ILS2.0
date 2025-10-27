import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EngineeringService } from '../services/EngineeringService';
import { insertRcaSchema, insertQaFailureSchema, insertKpiSchema, insertControlPointSchema, insertMeasurementSchema } from '../../shared/engineeringSchema';

export async function engineeringRoutes(fastify: FastifyInstance) {
  const engineeringService = new EngineeringService();

  // RCA Routes
  fastify.post<{ Body: z.infer<typeof insertRcaSchema> }>(
    '/api/engineering/rca',
    async (request, reply) => {
      try {
        const data = insertRcaSchema.parse(request.body);
        const result = await engineeringService.createRca(data);
        reply.code(201).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: 'Invalid request data', details: error.errors });
        } else {
          console.error('Error creating RCA:', error);
          reply.code(500).send({ error: 'Failed to create RCA record' });
        }
      }
    }
  );

  fastify.get('/api/engineering/rca/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const rca = await engineeringService.getRcaById(id);
      if (!rca) {
        reply.code(404).send({ error: 'RCA record not found' });
        return;
      }
      reply.send(rca);
    } catch (error) {
      console.error('Error fetching RCA:', error);
      reply.code(500).send({ error: 'Failed to fetch RCA record' });
    }
  });

  fastify.get('/api/engineering/rca', async (request, reply) => {
    try {
      const filters = z.object({
        startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
        endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
        category: z.string().optional(),
        status: z.string().optional(),
        assignedTo: z.string().optional()
      }).parse(request.query);

      const records = await engineeringService.getRcaList(filters);
      reply.send(records);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid query parameters', details: error.errors });
      } else {
        console.error('Error fetching RCA list:', error);
        reply.code(500).send({ error: 'Failed to fetch RCA records' });
      }
    }
  });

  // QA Failure Routes
  fastify.post<{ Body: z.infer<typeof insertQaFailureSchema> }>(
    '/api/engineering/qa-failures',
    async (request, reply) => {
      try {
        const data = insertQaFailureSchema.parse(request.body);
        const result = await engineeringService.recordQaFailure(data);
        reply.code(201).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: 'Invalid request data', details: error.errors });
        } else {
          console.error('Error recording QA failure:', error);
          reply.code(500).send({ error: 'Failed to record QA failure' });
        }
      }
    }
  );

  fastify.get('/api/engineering/qa-failures', async (request, reply) => {
    try {
      const filters = z.object({
        startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
        endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
        productType: z.string().optional(),
        failureType: z.string().optional(),
        severity: z.number().optional(),
        stage: z.string().optional()
      }).parse(request.query);

      const failures = await engineeringService.getQaFailures(filters);
      reply.send(failures);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid query parameters', details: error.errors });
      } else {
        console.error('Error fetching QA failures:', error);
        reply.code(500).send({ error: 'Failed to fetch QA failures' });
      }
    }
  });

  // KPI Routes
  fastify.post<{ Body: z.infer<typeof insertKpiSchema> }>(
    '/api/engineering/kpis',
    async (request, reply) => {
      try {
        const data = insertKpiSchema.parse(request.body);
        const result = await engineeringService.recordKpi(data);
        reply.code(201).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: 'Invalid request data', details: error.errors });
        } else {
          console.error('Error recording KPI:', error);
          reply.code(500).send({ error: 'Failed to record KPI' });
        }
      }
    }
  );

  fastify.get('/api/engineering/kpis', async (request, reply) => {
    try {
      const filters = z.object({
        startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
        endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
        category: z.string().optional(),
        metric: z.string().optional(),
        period: z.string().optional()
      }).parse(request.query);

      const kpis = await engineeringService.getKpis(filters);
      reply.send(kpis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid query parameters', details: error.errors });
      } else {
        console.error('Error fetching KPIs:', error);
        reply.code(500).send({ error: 'Failed to fetch KPIs' });
      }
    }
  });

  // Process Control Routes
  fastify.post<{ Body: z.infer<typeof insertControlPointSchema> }>(
    '/api/engineering/control-points',
    async (request, reply) => {
      try {
        const data = insertControlPointSchema.parse(request.body);
        const result = await engineeringService.createControlPoint(data);
        reply.code(201).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: 'Invalid request data', details: error.errors });
        } else {
          console.error('Error creating control point:', error);
          reply.code(500).send({ error: 'Failed to create control point' });
        }
      }
    }
  );

  fastify.get('/api/engineering/control-points', async (request, reply) => {
    try {
      const filters = z.object({
        process: z.string().optional(),
        isActive: z.boolean().optional()
      }).parse(request.query);

      const points = await engineeringService.getControlPoints(filters);
      reply.send(points);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid query parameters', details: error.errors });
      } else {
        console.error('Error fetching control points:', error);
        reply.code(500).send({ error: 'Failed to fetch control points' });
      }
    }
  });

  fastify.post<{ Body: z.infer<typeof insertMeasurementSchema> }>(
    '/api/engineering/measurements',
    async (request, reply) => {
      try {
        const data = insertMeasurementSchema.parse(request.body);
        const result = await engineeringService.recordMeasurement(data);
        reply.code(201).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: 'Invalid request data', details: error.errors });
        } else {
          console.error('Error recording measurement:', error);
          reply.code(500).send({ error: 'Failed to record measurement' });
        }
      }
    }
  );

  fastify.get<{
    Params: { controlPointId: string };
    Querystring: { startDate?: string; endDate?: string };
  }>('/api/engineering/measurements/:controlPointId', async (request, reply) => {
    try {
      const params = z.object({
        controlPointId: z.string(),
        startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
        endDate: z.string().optional().transform(str => str ? new Date(str) : undefined)
      }).parse({
        controlPointId: request.params.controlPointId,
        startDate: request.query.startDate,
        endDate: request.query.endDate
      });

      const measurements = await engineeringService.getMeasurements(
        params.controlPointId,
        params.startDate,
        params.endDate
      );
      reply.send(measurements);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      } else {
        console.error('Error fetching measurements:', error);
        reply.code(500).send({ error: 'Failed to fetch measurements' });
      }
    }
  });

  // Analytics Routes
  fastify.get('/api/engineering/analytics/quality', async (request, reply) => {
    try {
      const params = z.object({
        startDate: z.string().transform(str => new Date(str)),
        endDate: z.string().transform(str => new Date(str))
      }).parse(request.query);

      const metrics = await engineeringService.getQualityMetrics(params.startDate, params.endDate);
      reply.send(metrics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      } else {
        console.error('Error fetching quality metrics:', error);
        reply.code(500).send({ error: 'Failed to fetch quality metrics' });
      }
    }
  });

  fastify.get('/api/engineering/analytics/process-control', async (request, reply) => {
    try {
      const status = await engineeringService.getProcessControlStatus();
      reply.send(status);
    } catch (error) {
      console.error('Error fetching process control status:', error);
      reply.code(500).send({ error: 'Failed to fetch process control status' });
    }
  });
}