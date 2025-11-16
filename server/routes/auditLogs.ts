/**
 * Audit Log Admin Routes
 * 
 * Provides endpoints for administrators to view and query audit logs
 * Required for HIPAA compliance and security auditing
 * 
 * All endpoints require 'admin' or 'platform_admin' role
 */

import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { auditLogs, users } from '../../shared/schema';
import { eq, and, desc, gte, lte, like, sql, or } from 'drizzle-orm';
import { z } from 'zod';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('auditLogs');

// Validation schemas
const auditQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  eventType: z.enum(['access', 'create', 'read', 'update', 'delete', 'login', 'logout', 'auth_attempt', 'permission_change', 'export', 'print']).optional(),
  resourceType: z.string().optional(),
  phiOnly: z.boolean().optional(),
  successOnly: z.boolean().optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Middleware to check admin access
 */
function requireAdmin(req: Request, res: Response, next: Function) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (user.role !== 'admin' && user.role !== 'platform_admin' && user.role !== 'company_admin') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Admin privileges required to view audit logs'
    });
  }
  
  next();
}

/**
 * GET /api/admin/audit-logs
 * 
 * Query audit logs with filters
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - userId: UUID
 * - companyId: UUID
 * - eventType: access|create|read|update|delete|login|logout|auth_attempt
 * - resourceType: patient|order|prescription|user|etc
 * - phiOnly: boolean (show only PHI access logs)
 * - successOnly: boolean (show only successful operations)
 * - limit: number (default 100, max 1000)
 * - offset: number (default 0)
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const validation = auditQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
    }
    
    const {
      startDate,
      endDate,
      userId,
      companyId,
      eventType,
      resourceType,
      phiOnly,
      successOnly,
      limit = 100,
      offset = 0,
    } = validation.data;
    
    // Build filter conditions
    const conditions: any[] = [];
    
    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(endDate)));
    }
    
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }
    
    if (companyId) {
      conditions.push(eq(auditLogs.companyId, companyId));
    }
    
    if (eventType) {
      conditions.push(eq(auditLogs.eventType, eventType));
    }
    
    if (resourceType) {
      conditions.push(like(auditLogs.resourceType, `%${resourceType}%`));
    }
    
    if (phiOnly) {
      conditions.push(eq(auditLogs.phiAccessed, true));
    }
    
    if (successOnly) {
      conditions.push(eq(auditLogs.success, true));
    }
    
    // Query logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total: countResult.count,
        limit,
        offset,
        hasMore: offset + limit < countResult.count,
      },
    });
    
  } catch (error) {
    logger.error({ error }, 'Error fetching audit logs');
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/audit-logs/stats
 * 
 * Get audit log statistics
 */
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, companyId } = req.query;
    
    const conditions: any[] = [];
    
    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(startDate as string)));
    }
    
    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(endDate as string)));
    }
    
    if (companyId) {
      conditions.push(eq(auditLogs.companyId, companyId as string));
    }
    
    // Total logs
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    // PHI access logs
    const [phiResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(
        conditions.length > 0 
          ? and(...conditions, eq(auditLogs.phiAccessed, true))
          : eq(auditLogs.phiAccessed, true)
      );
    
    // Failed operations
    const [failedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(
        conditions.length > 0 
          ? and(...conditions, eq(auditLogs.success, false))
          : eq(auditLogs.success, false)
      );
    
    // By event type
    const byEventType = await db
      .select({
        eventType: auditLogs.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(auditLogs.eventType);
    
    // By resource type (top 10)
    const byResourceType = await db
      .select({
        resourceType: auditLogs.resourceType,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(auditLogs.resourceType)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
    
    // Most active users (top 10)
    const mostActiveUsers = await db
      .select({
        userId: auditLogs.userId,
        userEmail: auditLogs.userEmail,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(auditLogs.userId, auditLogs.userEmail)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
    
    res.json({
      success: true,
      stats: {
        total: totalResult.count,
        phiAccess: phiResult.count,
        failed: failedResult.count,
        byEventType,
        byResourceType,
        mostActiveUsers: mostActiveUsers.filter(u => u.userId), // Exclude null users
      },
    });
    
  } catch (error) {
    logger.error({ error }, 'Error fetching audit stats');
    res.status(500).json({
      error: 'Failed to fetch audit statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/audit-logs/:id
 * 
 * Get detailed audit log entry
 */
router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [log] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);
    
    if (!log) {
      return res.status(404).json({
        error: 'Audit log not found',
      });
    }
    
    res.json({
      success: true,
      data: log,
    });
    
  } catch (error) {
    logger.error({ error, auditLogId: id }, 'Error fetching audit log');
    res.status(500).json({
      error: 'Failed to fetch audit log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/audit-logs/user/:userId
 * 
 * Get all audit logs for a specific user
 */
router.get('/user/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);
    
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId));
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total: countResult.count,
        limit,
        offset,
        hasMore: offset + limit < countResult.count,
      },
    });
    
  } catch (error) {
    logger.error({ error, userId }, 'Error fetching user audit logs');
    res.status(500).json({
      error: 'Failed to fetch user audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/audit-logs/resource/:resourceType/:resourceId
 * 
 * Get all audit logs for a specific resource
 */
router.get('/resource/:resourceType/:resourceId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.resourceType, resourceType),
          eq(auditLogs.resourceId, resourceId)
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
    
    res.json({
      success: true,
      data: logs,
    });
    
  } catch (error) {
    logger.error({ error, resourceType, resourceId }, 'Error fetching resource audit logs');
    res.status(500).json({
      error: 'Failed to fetch resource audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/audit-logs/phi-access
 * 
 * Get all PHI access logs (special HIPAA compliance view)
 */
router.get('/phi-access/all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId, limit = 100, offset = 0 } = req.query;
    
    const conditions: any[] = [eq(auditLogs.phiAccessed, true)];
    
    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(startDate as string)));
    }
    
    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(endDate as string)));
    }
    
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId as string));
    }
    
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(and(...conditions));
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total: countResult.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
    
  } catch (error) {
    logger.error({ error }, 'Error fetching PHI access logs');
    res.status(500).json({
      error: 'Failed to fetch PHI access logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/audit-logs/export
 * 
 * Export audit logs to CSV (for compliance audits)
 */
router.post('/export', requireAdmin, async (req: Request, res: Response) => {
  try {
    const validation = auditQuerySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid export parameters',
        details: validation.error.errors,
      });
    }
    
    // Build filter conditions (same as GET /)
    const conditions: any[] = [];
    const { startDate, endDate, userId, companyId, eventType, resourceType, phiOnly } = validation.data;
    
    if (startDate) conditions.push(gte(auditLogs.timestamp, new Date(startDate)));
    if (endDate) conditions.push(lte(auditLogs.timestamp, new Date(endDate)));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (companyId) conditions.push(eq(auditLogs.companyId, companyId));
    if (eventType) conditions.push(eq(auditLogs.eventType, eventType));
    if (resourceType) conditions.push(like(auditLogs.resourceType, `%${resourceType}%`));
    if (phiOnly) conditions.push(eq(auditLogs.phiAccessed, true));
    
    const logs = await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.timestamp))
      .limit(10000); // Max export limit
    
    // Convert to CSV
    const csvHeaders = [
      'Timestamp',
      'User Email',
      'Event Type',
      'Resource Type',
      'Resource ID',
      'Action',
      'Success',
      'PHI Accessed',
      'IP Address',
      'Method',
      'Endpoint',
    ].join(',');
    
    const csvRows = logs.map(log => [
      log.timestamp?.toISOString() || '',
      log.userEmail || 'Anonymous',
      log.eventType,
      log.resourceType,
      log.resourceId || '',
      `"${log.action.replace(/"/g, '""')}"`, // Escape quotes
      log.success ? 'Yes' : 'No',
      log.phiAccessed ? 'Yes' : 'No',
      log.ipAddress || '',
      log.method || '',
      log.endpoint || '',
    ].join(','));
    
    const csv = [csvHeaders, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
    
  } catch (error) {
    logger.error({ error, format }, 'Error exporting audit logs');
    res.status(500).json({
      error: 'Failed to export audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
