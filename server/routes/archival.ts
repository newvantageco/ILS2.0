/**
 * Archival and Data Retrieval Routes
 *
 * Provides endpoints for:
 * - Accessing archived/deleted records
 * - Retrieving historical data and reports
 * - Exporting old data
 * - Viewing audit trails
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { archivalService } from "../services/ArchivalService";
import { isAuthenticated } from "../replitAuth";
import { createLogger } from "../utils/logger";

const router = Router();
const logger = createLogger('archival');

// Apply authentication to all routes
router.use(isAuthenticated);

/**
 * ==================================================
 * ARCHIVED RECORDS
 * ==================================================
 */

/**
 * GET /api/archival/records
 * Get archived records with filtering
 */
router.get("/records", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user?.claims?.companyId || user?.companyId;

    const {
      tableName,
      archivedAfter,
      archivedBefore,
      includeRestored,
      limit = "50",
      offset = "0",
    } = req.query;

    const result = await archivalService.getArchivedRecords({
      tableName: tableName as string,
      companyId,
      archivedAfter: archivedAfter ? new Date(archivedAfter as string) : undefined,
      archivedBefore: archivedBefore ? new Date(archivedBefore as string) : undefined,
      includeRestored: includeRestored === "true",
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error, tableName: req.query.tableName }, 'Error fetching archived records');
    res.status(500).json({ message: "Failed to fetch archived records", error: error.message });
  }
});

/**
 * POST /api/archival/records/:id/restore
 * Restore an archived record
 */
router.post("/records/:id/restore", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.claims?.sub || user?.id;
    const { id } = req.params;

    const restored = await archivalService.restoreRecord(id, userId);

    if (!restored) {
      return res.status(404).json({ message: "Archived record not found" });
    }

    res.json({
      message: "Record restored successfully",
      record: restored,
    });
  } catch (error: any) {
    logger.error({ error, recordId: req.params.id }, 'Error restoring record');
    res.status(500).json({ message: "Failed to restore record", error: error.message });
  }
});

/**
 * ==================================================
 * REPORT ARCHIVES
 * ==================================================
 */

/**
 * GET /api/archival/reports
 * Get archived reports
 */
router.get("/reports", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user?.claims?.companyId || user?.companyId;

    const {
      reportType,
      category,
      periodStart,
      periodEnd,
      includeExpired,
      limit = "50",
      offset = "0",
    } = req.query;

    const result = await archivalService.getArchivedReports({
      companyId,
      reportType: reportType as string,
      category: category as string,
      periodStart: periodStart ? new Date(periodStart as string) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd as string) : undefined,
      includeExpired: includeExpired === "true",
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching archived reports');
    res.status(500).json({ message: "Failed to fetch archived reports", error: error.message });
  }
});

/**
 * GET /api/archival/reports/:id
 * Get a specific archived report
 */
router.get("/reports/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await archivalService.getArchivedReport(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error: any) {
    logger.error({ error, reportId: req.params.id }, 'Error fetching report');
    res.status(500).json({ message: "Failed to fetch report", error: error.message });
  }
});

/**
 * POST /api/archival/reports
 * Create a new report archive
 */
router.post("/reports", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user?.claims?.companyId || user?.companyId;
    const userId = user?.claims?.sub || user?.id;

    const schema = z.object({
      reportType: z.string(),
      reportName: z.string(),
      reportData: z.any(),
      parameters: z.any().optional(),
      periodStart: z.string().optional(),
      periodEnd: z.string().optional(),
      fileUrl: z.string().optional(),
      fileFormat: z.string().optional(),
      fileSize: z.number().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      expiresAt: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const report = await archivalService.archiveReport({
      ...data,
      companyId,
      generatedBy: userId,
      periodStart: data.periodStart ? new Date(data.periodStart) : undefined,
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    res.status(201).json(report);
  } catch (error: any) {
    logger.error({ error }, 'Error archiving report');
    res.status(500).json({ message: "Failed to archive report", error: error.message });
  }
});

/**
 * ==================================================
 * HISTORICAL SNAPSHOTS
 * ==================================================
 */

/**
 * GET /api/archival/history/:entityType/:entityId
 * Get historical snapshots for an entity
 */
router.get("/history/:entityType/:entityId", async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = "50" } = req.query;

    const snapshots = await archivalService.getSnapshotsForEntity(
      entityType,
      entityId,
      parseInt(limit as string)
    );

    res.json({ snapshots, total: snapshots.length });
  } catch (error: any) {
    logger.error({ error, entityType: req.params.entityType, entityId: req.params.entityId }, 'Error fetching historical snapshots');
    res.status(500).json({ message: "Failed to fetch historical data", error: error.message });
  }
});

/**
 * GET /api/archival/history/:entityType/:entityId/at/:timestamp
 * Get entity state at a specific time
 */
router.get("/history/:entityType/:entityId/at/:timestamp", async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, timestamp } = req.params;
    const atTime = new Date(timestamp);

    const snapshot = await archivalService.getEntityAtTime(entityType, entityId, atTime);

    if (!snapshot) {
      return res.status(404).json({ message: "No historical data found for that time" });
    }

    res.json(snapshot);
  } catch (error: any) {
    logger.error({ error, entityType: req.params.entityType, entityId: req.params.entityId, timestamp: req.params.timestamp }, 'Error fetching historical snapshot');
    res.status(500).json({ message: "Failed to fetch historical data", error: error.message });
  }
});

/**
 * POST /api/archival/history
 * Create a new historical snapshot
 */
router.post("/history", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user?.claims?.companyId || user?.companyId;
    const userId = user?.claims?.sub || user?.id;

    const schema = z.object({
      snapshotType: z.string(),
      entityType: z.string(),
      entityId: z.string(),
      data: z.any(),
      triggerEvent: z.string().optional(),
      changeType: z.enum(["created", "updated", "deleted"]).optional(),
    });

    const data = schema.parse(req.body);

    const snapshot = await archivalService.createSnapshot({
      ...data,
      companyId,
      capturedBy: userId,
    });

    res.status(201).json(snapshot);
  } catch (error: any) {
    logger.error({ error }, 'Error creating snapshot');
    res.status(500).json({ message: "Failed to create snapshot", error: error.message });
  }
});

/**
 * ==================================================
 * DATA EXPORT
 * ==================================================
 */

/**
 * GET /api/archival/exports
 * Get export history
 */
router.get("/exports", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user?.claims?.companyId || user?.companyId;
    const { limit = "50", offset = "0" } = req.query;

    const result = await archivalService.getExportHistory(
      companyId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching export history');
    res.status(500).json({ message: "Failed to fetch export history", error: error.message });
  }
});

/**
 * POST /api/archival/exports
 * Log a new data export
 */
router.post("/exports", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user?.claims?.companyId || user?.companyId;
    const userId = user?.claims?.sub || user?.id;

    const schema = z.object({
      exportType: z.string(),
      entityType: z.string(),
      recordCount: z.number(),
      filters: z.any().optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }).optional(),
      fileUrl: z.string().optional(),
      fileFormat: z.string(),
      fileSize: z.number().optional(),
      status: z.string().optional(),
      errorMessage: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const exportLog = await archivalService.logDataExport({
      ...data,
      companyId,
      exportedBy: userId,
    });

    res.status(201).json(exportLog);
  } catch (error: any) {
    logger.error({ error }, 'Error logging export');
    res.status(500).json({ message: "Failed to log export", error: error.message });
  }
});

/**
 * POST /api/archival/exports/:id/download
 * Track export download
 */
router.post("/exports/:id/download", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await archivalService.trackExportDownload(id);

    res.json({ message: "Download tracked successfully" });
  } catch (error: any) {
    logger.error({ error, exportId: req.params.id }, 'Error tracking download');
    res.status(500).json({ message: "Failed to track download", error: error.message });
  }
});

/**
 * ==================================================
 * AUDIT TRAIL
 * ==================================================
 */

/**
 * GET /api/archival/audit/:entityType/:entityId
 * Get audit trail for a specific entity
 */
router.get("/audit/:entityType/:entityId", async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = "100" } = req.query;

    const trail = await archivalService.getAuditTrail(
      entityType,
      entityId,
      parseInt(limit as string)
    );

    res.json({ trail, total: trail.length });
  } catch (error: any) {
    logger.error({ error, entityType: req.params.entityType, entityId: req.params.entityId }, 'Error fetching audit trail');
    res.status(500).json({ message: "Failed to fetch audit trail", error: error.message });
  }
});

/**
 * GET /api/archival/audit
 * Get company audit trail with filtering
 */
router.get("/audit", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user?.claims?.companyId || user?.companyId;

    const {
      action,
      entityType,
      userId,
      startDate,
      endDate,
      limit = "100",
      offset = "0",
    } = req.query;

    const result = await archivalService.getCompanyAuditTrail(
      companyId,
      {
        action: action as string,
        entityType: entityType as string,
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching audit trail');
    res.status(500).json({ message: "Failed to fetch audit trail", error: error.message });
  }
});

export default router;
