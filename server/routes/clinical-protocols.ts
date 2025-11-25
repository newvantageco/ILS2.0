import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../../db';
import { clinicalProtocols } from '../../shared/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { createLogger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const logger = createLogger('clinical-protocols');

// Schema for protocol validation - maps frontend fields to database columns
const protocolSchema = z.object({
  title: z.string().min(1, 'Title is required'), // maps to protocolName
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'), // maps to protocolType
  content: z.string().min(1, 'Content is required'), // maps to protocolSteps as JSON
  version: z.string().default('1.0'), // stored in protocolSteps
  status: z.enum(['draft', 'active', 'under_review', 'archived']).default('draft'), // stored in protocolSteps
  effectiveDate: z.string().optional(), // stored in protocolSteps
  reviewDate: z.string().optional(), // stored in protocolSteps
  isMandatory: z.boolean().default(false),
});

/**
 * GET /api/clinical-protocols
 * Get all clinical protocols for the user's company
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(403).json({ error: 'Company not found for user' });
    }

    const dbProtocols = await db
      .select()
      .from(clinicalProtocols)
      .where(eq(clinicalProtocols.companyId, companyId))
      .orderBy(desc(clinicalProtocols.updatedAt));

    // Map database fields to frontend expected format
    const protocols = dbProtocols.map(p => {
      const steps = p.protocolSteps as any || {};
      return {
        id: p.id,
        companyId: p.companyId,
        title: p.protocolName,
        description: p.description,
        category: p.protocolType || 'other',
        content: steps.content || '',
        version: steps.version || '1.0',
        status: steps.status || 'active',
        effectiveDate: steps.effectiveDate,
        reviewDate: steps.reviewDate,
        isMandatory: p.isMandatory,
        createdBy: p.createdBy,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    res.json(protocols);
  } catch (error) {
    logger.error({ error }, 'Error fetching clinical protocols');
    res.status(500).json({ error: 'Failed to fetch clinical protocols' });
  }
});

/**
 * GET /api/clinical-protocols/:id
 * Get a specific clinical protocol
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(403).json({ error: 'Company not found for user' });
    }

    const [protocol] = await db
      .select()
      .from(clinicalProtocols)
      .where(
        and(
          eq(clinicalProtocols.id, id),
          eq(clinicalProtocols.companyId, companyId)
        )
      )
      .limit(1);

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    res.json(protocol);
  } catch (error) {
    logger.error({ error, protocolId: req.params.id }, 'Error fetching clinical protocol');
    res.status(500).json({ error: 'Failed to fetch clinical protocol' });
  }
});

/**
 * POST /api/clinical-protocols
 * Create a new clinical protocol
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(403).json({ error: 'Company not found for user' });
    }

    const validation = protocolSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const data = validation.data;

    // Store extra fields in protocolSteps JSON
    const protocolSteps = {
      content: data.content,
      version: data.version,
      status: data.status,
      effectiveDate: data.effectiveDate,
      reviewDate: data.reviewDate,
    };

    const [newProtocol] = await db
      .insert(clinicalProtocols)
      .values({
        companyId,
        protocolName: data.title,
        protocolType: data.category,
        description: data.description,
        protocolSteps,
        isMandatory: data.isMandatory || false,
        createdBy: userId,
      })
      .returning();
    
    // Map to frontend format
    const response = {
      id: newProtocol.id,
      companyId: newProtocol.companyId,
      title: newProtocol.protocolName,
      description: newProtocol.description,
      category: newProtocol.protocolType,
      content: data.content,
      version: data.version,
      status: data.status,
      effectiveDate: data.effectiveDate,
      reviewDate: data.reviewDate,
      isMandatory: newProtocol.isMandatory,
      createdBy: newProtocol.createdBy,
      createdAt: newProtocol.createdAt,
      updatedAt: newProtocol.updatedAt,
    };

    logger.info({ protocolId: newProtocol.id, companyId }, 'Clinical protocol created');
    res.status(201).json(response);
  } catch (error) {
    logger.error({ error }, 'Error creating clinical protocol');
    res.status(500).json({ error: 'Failed to create clinical protocol' });
  }
});

/**
 * PUT /api/clinical-protocols/:id
 * Update an existing clinical protocol
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(403).json({ error: 'Company not found for user' });
    }

    // Check if protocol exists and belongs to company
    const [existing] = await db
      .select()
      .from(clinicalProtocols)
      .where(
        and(
          eq(clinicalProtocols.id, id),
          eq(clinicalProtocols.companyId, companyId)
        )
      )
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const validation = protocolSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const data = validation.data;

    const [updated] = await db
      .update(clinicalProtocols)
      .set({
        ...data,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : existing.effectiveDate,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : existing.reviewDate,
        updatedAt: new Date(),
      })
      .where(eq(clinicalProtocols.id, id))
      .returning();

    logger.info({ protocolId: id, companyId }, 'Clinical protocol updated');
    res.json(updated);
  } catch (error) {
    logger.error({ error, protocolId: req.params.id }, 'Error updating clinical protocol');
    res.status(500).json({ error: 'Failed to update clinical protocol' });
  }
});

/**
 * DELETE /api/clinical-protocols/:id
 * Delete a clinical protocol
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(403).json({ error: 'Company not found for user' });
    }

    // Check if protocol exists and belongs to company
    const [existing] = await db
      .select()
      .from(clinicalProtocols)
      .where(
        and(
          eq(clinicalProtocols.id, id),
          eq(clinicalProtocols.companyId, companyId)
        )
      )
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    await db
      .delete(clinicalProtocols)
      .where(eq(clinicalProtocols.id, id));

    logger.info({ protocolId: id, companyId }, 'Clinical protocol deleted');
    res.json({ success: true, message: 'Protocol deleted successfully' });
  } catch (error) {
    logger.error({ error, protocolId: req.params.id }, 'Error deleting clinical protocol');
    res.status(500).json({ error: 'Failed to delete clinical protocol' });
  }
});

/**
 * POST /api/clinical-protocols/:id/duplicate
 * Duplicate an existing protocol
 */
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(403).json({ error: 'Company not found for user' });
    }

    // Get the original protocol
    const [original] = await db
      .select()
      .from(clinicalProtocols)
      .where(
        and(
          eq(clinicalProtocols.id, id),
          eq(clinicalProtocols.companyId, companyId)
        )
      )
      .limit(1);

    if (!original) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Create duplicate with modified title
    const [duplicate] = await db
      .insert(clinicalProtocols)
      .values({
        companyId,
        title: `${original.title} (Copy)`,
        description: original.description,
        category: original.category,
        content: original.content,
        version: '1.0',
        status: 'draft',
        createdBy: userId,
      })
      .returning();

    logger.info({ originalId: id, duplicateId: duplicate.id, companyId }, 'Clinical protocol duplicated');
    res.status(201).json(duplicate);
  } catch (error) {
    logger.error({ error, protocolId: req.params.id }, 'Error duplicating clinical protocol');
    res.status(500).json({ error: 'Failed to duplicate clinical protocol' });
  }
});

export default router;
