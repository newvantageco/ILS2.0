/**
 * Archival Service
 *
 * Comprehensive service for:
 * - Soft deletes with full recovery
 * - Historical data snapshots
 * - Report archival and retrieval
 * - Data export capabilities
 * - Audit trail
 */

import { db } from "../../db";
import { eq, and, desc, gte, lte, inArray, sql } from "drizzle-orm";
import {
  archivedRecords,
  reportArchives,
  dataExportLogs,
  historicalSnapshots,
  auditTrail,
  dataRetentionPolicies,
  type ArchivedRecord,
  type InsertArchivedRecord,
  type ReportArchive,
  type InsertReportArchive,
  type DataExportLog,
  type InsertDataExportLog,
  type HistoricalSnapshot,
  type InsertHistoricalSnapshot,
  type AuditTrailEntry,
  type InsertAuditTrailEntry,
  type DataRetentionPolicy,
  type InsertDataRetentionPolicy,
} from "../../shared/archived-schema";

export class ArchivalService {
  /**
   * ============================================================================
   * SOFT DELETE / ARCHIVE
   * ============================================================================
   */

  /**
   * Soft delete a record by archiving it
   */
  async archiveRecord(params: {
    tableName: string;
    recordId: string;
    recordData: any;
    companyId?: string;
    archivedBy: string;
    reason?: string;
    tags?: string[];
  }): Promise<ArchivedRecord> {
    const archiveId = `archive_${params.tableName}_${params.recordId}_${Date.now()}`;

    const [archived] = await db.insert(archivedRecords).values({
      id: archiveId,
      originalTable: params.tableName,
      originalId: params.recordId,
      recordData: params.recordData,
      companyId: params.companyId,
      archivedBy: params.archivedBy,
      archiveReason: params.reason,
      tags: params.tags,
    }).returning();

    // Log audit trail
    await this.logAudit({
      action: "archive",
      entityType: params.tableName,
      entityId: params.recordId,
      beforeData: params.recordData,
      afterData: null,
      companyId: params.companyId,
      userId: params.archivedBy,
      success: true,
    });

    return archived;
  }

  /**
   * Restore an archived record
   */
  async restoreRecord(archiveId: string, restoredBy: string): Promise<ArchivedRecord | undefined> {
    const [archived] = await db.select()
      .from(archivedRecords)
      .where(eq(archivedRecords.id, archiveId));

    if (!archived) {
      return undefined;
    }

    const [restored] = await db.update(archivedRecords)
      .set({
        restoredAt: new Date(),
        restoredBy,
      })
      .where(eq(archivedRecords.id, archiveId))
      .returning();

    // Log audit trail
    await this.logAudit({
      action: "restore",
      entityType: archived.originalTable,
      entityId: archived.originalId,
      beforeData: null,
      afterData: archived.recordData,
      companyId: archived.companyId || undefined,
      userId: restoredBy,
      success: true,
    });

    return restored;
  }

  /**
   * Get archived records with filters
   */
  async getArchivedRecords(filters: {
    tableName?: string;
    companyId?: string;
    archivedAfter?: Date;
    archivedBefore?: Date;
    includeRestored?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ records: ArchivedRecord[]; total: number }> {
    const conditions: any[] = [];

    if (filters.tableName) {
      conditions.push(eq(archivedRecords.originalTable, filters.tableName));
    }

    if (filters.companyId) {
      conditions.push(eq(archivedRecords.companyId, filters.companyId));
    }

    if (filters.archivedAfter) {
      conditions.push(gte(archivedRecords.archivedAt, filters.archivedAfter));
    }

    if (filters.archivedBefore) {
      conditions.push(lte(archivedRecords.archivedAt, filters.archivedBefore));
    }

    if (!filters.includeRestored) {
      conditions.push(sql`${archivedRecords.restoredAt} IS NULL`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(archivedRecords)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated records
    const records = await db.select()
      .from(archivedRecords)
      .where(whereClause)
      .orderBy(desc(archivedRecords.archivedAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    return { records, total };
  }

  /**
   * Permanently delete an archived record
   */
  async permanentlyDeleteRecord(
    archiveId: string,
    deletedBy: string
  ): Promise<boolean> {
    const [archived] = await db.select()
      .from(archivedRecords)
      .where(eq(archivedRecords.id, archiveId));

    if (!archived) {
      return false;
    }

    // Mark as permanently deleted
    await db.update(archivedRecords)
      .set({
        permanentlyDeletedAt: new Date(),
        permanentlyDeletedBy: deletedBy,
      })
      .where(eq(archivedRecords.id, archiveId));

    // Log audit trail
    await this.logAudit({
      action: "delete",
      entityType: archived.originalTable,
      entityId: archived.originalId,
      beforeData: archived.recordData,
      afterData: null,
      companyId: archived.companyId || undefined,
      userId: deletedBy,
      success: true,
    });

    return true;
  }

  /**
   * ============================================================================
   * REPORT ARCHIVAL
   * ============================================================================
   */

  /**
   * Archive a generated report
   */
  async archiveReport(params: {
    reportType: string;
    reportName: string;
    reportData: any;
    parameters?: any;
    companyId: string;
    generatedBy: string;
    periodStart?: Date;
    periodEnd?: Date;
    fileUrl?: string;
    fileFormat?: string;
    fileSize?: number;
    tags?: string[];
    category?: string;
    expiresAt?: Date;
  }): Promise<ReportArchive> {
    const reportId = `report_${params.reportType}_${Date.now()}`;

    const [report] = await db.insert(reportArchives).values({
      id: reportId,
      reportType: params.reportType,
      reportName: params.reportName,
      reportData: params.reportData,
      parameters: params.parameters,
      companyId: params.companyId,
      generatedBy: params.generatedBy,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      fileUrl: params.fileUrl,
      fileFormat: params.fileFormat,
      fileSize: params.fileSize,
      tags: params.tags,
      category: params.category,
      expiresAt: params.expiresAt,
    }).returning();

    return report;
  }

  /**
   * Get archived reports
   */
  async getArchivedReports(filters: {
    reportType?: string;
    companyId: string;
    category?: string;
    periodStart?: Date;
    periodEnd?: Date;
    tags?: string[];
    includeExpired?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ reports: ReportArchive[]; total: number }> {
    const conditions: any[] = [eq(reportArchives.companyId, filters.companyId)];

    if (filters.reportType) {
      conditions.push(eq(reportArchives.reportType, filters.reportType));
    }

    if (filters.category) {
      conditions.push(eq(reportArchives.category, filters.category));
    }

    if (filters.periodStart) {
      conditions.push(gte(reportArchives.periodStart, filters.periodStart));
    }

    if (filters.periodEnd) {
      conditions.push(lte(reportArchives.periodEnd, filters.periodEnd));
    }

    if (!filters.includeExpired) {
      conditions.push(sql`(${reportArchives.expiresAt} IS NULL OR ${reportArchives.expiresAt} > NOW())`);
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(reportArchives)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated reports
    const reports = await db.select()
      .from(reportArchives)
      .where(whereClause)
      .orderBy(desc(reportArchives.generatedAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    return { reports, total };
  }

  /**
   * Get a specific archived report and track access
   */
  async getArchivedReport(reportId: string): Promise<ReportArchive | undefined> {
    const [report] = await db.select()
      .from(reportArchives)
      .where(eq(reportArchives.id, reportId));

    if (!report) {
      return undefined;
    }

    // Update access tracking
    await db.update(reportArchives)
      .set({
        lastAccessedAt: new Date(),
        accessCount: sql`${reportArchives.accessCount} + 1`,
      })
      .where(eq(reportArchives.id, reportId));

    return report;
  }

  /**
   * ============================================================================
   * HISTORICAL SNAPSHOTS
   * ============================================================================
   */

  /**
   * Create a snapshot of an entity
   */
  async createSnapshot(params: {
    snapshotType: string;
    entityType: string;
    entityId: string;
    data: any;
    companyId?: string;
    capturedBy?: string;
    triggerEvent?: string;
    changeType?: "created" | "updated" | "deleted";
  }): Promise<HistoricalSnapshot> {
    // Get previous snapshot for version tracking
    const previousSnapshots = await db.select()
      .from(historicalSnapshots)
      .where(and(
        eq(historicalSnapshots.entityType, params.entityType),
        eq(historicalSnapshots.entityId, params.entityId)
      ))
      .orderBy(desc(historicalSnapshots.version))
      .limit(1);

    const previousSnapshot = previousSnapshots[0];
    const version = (previousSnapshot?.version || 0) + 1;

    // Calculate changes if there's a previous snapshot
    const changes = previousSnapshot
      ? this.calculateChanges(previousSnapshot.snapshotData, params.data)
      : params.data;

    const snapshotId = `snapshot_${params.entityType}_${params.entityId}_${version}`;

    const [snapshot] = await db.insert(historicalSnapshots).values({
      id: snapshotId,
      snapshotType: params.snapshotType,
      entityType: params.entityType,
      entityId: params.entityId,
      snapshotData: params.data,
      previousSnapshotId: previousSnapshot?.id,
      changes,
      changeType: params.changeType,
      companyId: params.companyId,
      capturedBy: params.capturedBy,
      triggerEvent: params.triggerEvent,
      version,
    }).returning();

    return snapshot;
  }

  /**
   * Get historical snapshots for an entity
   */
  async getSnapshotsForEntity(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<HistoricalSnapshot[]> {
    return await db.select()
      .from(historicalSnapshots)
      .where(and(
        eq(historicalSnapshots.entityType, entityType),
        eq(historicalSnapshots.entityId, entityId)
      ))
      .orderBy(desc(historicalSnapshots.version))
      .limit(limit);
  }

  /**
   * Get entity state at a specific point in time
   */
  async getEntityAtTime(
    entityType: string,
    entityId: string,
    atTime: Date
  ): Promise<HistoricalSnapshot | undefined> {
    const [snapshot] = await db.select()
      .from(historicalSnapshots)
      .where(and(
        eq(historicalSnapshots.entityType, entityType),
        eq(historicalSnapshots.entityId, entityId),
        lte(historicalSnapshots.capturedAt, atTime)
      ))
      .orderBy(desc(historicalSnapshots.capturedAt))
      .limit(1);

    return snapshot;
  }

  /**
   * ============================================================================
   * DATA EXPORT
   * ============================================================================
   */

  /**
   * Log a data export
   */
  async logDataExport(params: {
    exportType: string;
    entityType: string;
    recordCount: number;
    filters?: any;
    dateRange?: { start: string; end: string };
    fileUrl?: string;
    fileFormat: string;
    fileSize?: number;
    companyId: string;
    exportedBy: string;
    status?: string;
    errorMessage?: string;
  }): Promise<DataExportLog> {
    const exportId = `export_${params.exportType}_${Date.now()}`;

    const [exportLog] = await db.insert(dataExportLogs).values({
      id: exportId,
      exportType: params.exportType,
      entityType: params.entityType,
      recordCount: params.recordCount,
      filters: params.filters,
      dateRange: params.dateRange,
      fileUrl: params.fileUrl,
      fileFormat: params.fileFormat,
      fileSize: params.fileSize,
      companyId: params.companyId,
      exportedBy: params.exportedBy,
      status: params.status || "completed",
      errorMessage: params.errorMessage,
    }).returning();

    return exportLog;
  }

  /**
   * Get export history
   */
  async getExportHistory(
    companyId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ exports: DataExportLog[]; total: number }> {
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(dataExportLogs)
      .where(eq(dataExportLogs.companyId, companyId));

    const total = Number(countResult[0]?.count || 0);

    const exports = await db.select()
      .from(dataExportLogs)
      .where(eq(dataExportLogs.companyId, companyId))
      .orderBy(desc(dataExportLogs.exportedAt))
      .limit(limit)
      .offset(offset);

    return { exports, total };
  }

  /**
   * Track export download
   */
  async trackExportDownload(exportId: string): Promise<void> {
    await db.update(dataExportLogs)
      .set({
        downloadCount: sql`${dataExportLogs.downloadCount} + 1`,
        lastDownloadedAt: new Date(),
      })
      .where(eq(dataExportLogs.id, exportId));
  }

  /**
   * ============================================================================
   * AUDIT TRAIL
   * ============================================================================
   */

  /**
   * Log an audit trail entry
   */
  async logAudit(params: {
    action: "create" | "read" | "update" | "delete" | "archive" | "restore";
    entityType: string;
    entityId: string;
    beforeData?: any;
    afterData?: any;
    changes?: any;
    companyId?: string;
    userId: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    requestPath?: string;
    requestMethod?: string;
    duration?: number;
    success: boolean;
    errorMessage?: string;
    tags?: string[];
  }): Promise<void> {
    const auditId = `audit_${params.action}_${params.entityType}_${Date.now()}`;

    await db.insert(auditTrail).values({
      id: auditId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeData: params.beforeData,
      afterData: params.afterData,
      changes: params.changes || this.calculateChanges(params.beforeData, params.afterData),
      companyId: params.companyId,
      userId: params.userId,
      userRole: params.userRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestPath: params.requestPath,
      requestMethod: params.requestMethod,
      duration: params.duration,
      success: params.success,
      errorMessage: params.errorMessage,
      tags: params.tags,
    });
  }

  /**
   * Get audit trail for an entity
   */
  async getAuditTrail(
    entityType: string,
    entityId: string,
    limit: number = 100
  ): Promise<AuditTrailEntry[]> {
    return await db.select()
      .from(auditTrail)
      .where(and(
        eq(auditTrail.entityType, entityType),
        eq(auditTrail.entityId, entityId)
      ))
      .orderBy(desc(auditTrail.performedAt))
      .limit(limit);
  }

  /**
   * Get company audit trail
   */
  async getCompanyAuditTrail(
    companyId: string,
    filters?: {
      action?: string;
      entityType?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<{ entries: AuditTrailEntry[]; total: number }> {
    const conditions: any[] = [eq(auditTrail.companyId, companyId)];

    if (filters?.action) {
      conditions.push(eq(auditTrail.action, filters.action));
    }

    if (filters?.entityType) {
      conditions.push(eq(auditTrail.entityType, filters.entityType));
    }

    if (filters?.userId) {
      conditions.push(eq(auditTrail.userId, filters.userId));
    }

    if (filters?.startDate) {
      conditions.push(gte(auditTrail.performedAt, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(auditTrail.performedAt, filters.endDate));
    }

    const whereClause = and(...conditions);

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(auditTrail)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const entries = await db.select()
      .from(auditTrail)
      .where(whereClause)
      .orderBy(desc(auditTrail.performedAt))
      .limit(limit)
      .offset(offset);

    return { entries, total };
  }

  /**
   * ============================================================================
   * UTILITIES
   * ============================================================================
   */

  /**
   * Calculate changes between two objects
   */
  private calculateChanges(before: any, after: any): any {
    if (!before && !after) return {};
    if (!before) return after;
    if (!after) return before;

    const changes: any = {};

    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (before[key] !== after[key]) {
        changes[key] = {
          from: before[key],
          to: after[key],
        };
      }
    }

    return changes;
  }
}

export const archivalService = new ArchivalService();
