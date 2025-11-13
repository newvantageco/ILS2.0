/**
 * Archival Utilities
 *
 * Helper functions to make archival operations easier throughout the application.
 * Provides convenient wrappers for common archival tasks.
 */

import { archivalService } from '../services/ArchivalService';

/**
 * Soft delete helper - archives a record instead of permanently deleting
 */
export async function softDelete<T extends { id: string }>(params: {
  tableName: string;
  record: T;
  companyId?: string;
  userId: string;
  reason?: string;
  tags?: string[];
}) {
  return await archivalService.archiveRecord({
    tableName: params.tableName,
    recordId: params.record.id,
    recordData: params.record,
    companyId: params.companyId,
    archivedBy: params.userId,
    reason: params.reason,
    tags: params.tags,
  });
}

/**
 * Create automatic snapshots before important updates
 */
export async function createUpdateSnapshot<T>(params: {
  entityType: string;
  entityId: string;
  data: T;
  companyId?: string;
  userId?: string;
  triggerEvent?: string;
}) {
  return await archivalService.createSnapshot({
    snapshotType: 'auto_snapshot',
    entityType: params.entityType,
    entityId: params.entityId,
    data: params.data,
    companyId: params.companyId,
    capturedBy: params.userId,
    triggerEvent: params.triggerEvent || 'before_update',
    changeType: 'updated',
  });
}

/**
 * Archive a generated report with sensible defaults
 */
export async function archiveGeneratedReport(params: {
  reportType: string;
  reportName: string;
  reportData: any;
  companyId: string;
  userId: string;
  periodStart?: Date;
  periodEnd?: Date;
  category?: string;
  retentionDays?: number;
}) {
  const expiresAt = params.retentionDays
    ? new Date(Date.now() + params.retentionDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default: 1 year

  return await archivalService.archiveReport({
    reportType: params.reportType,
    reportName: params.reportName,
    reportData: params.reportData,
    companyId: params.companyId,
    generatedBy: params.userId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    category: params.category,
    expiresAt,
  });
}

/**
 * Search archived records with common filters
 */
export async function searchArchivedRecords(params: {
  tableName?: string;
  companyId: string;
  days?: number; // Last N days
  includeRestored?: boolean;
  limit?: number;
  offset?: number;
}) {
  const archivedAfter = params.days
    ? new Date(Date.now() - params.days * 24 * 60 * 60 * 1000)
    : undefined;

  return await archivalService.getArchivedRecords({
    tableName: params.tableName,
    companyId: params.companyId,
    archivedAfter,
    includeRestored: params.includeRestored,
    limit: params.limit || 50,
    offset: params.offset || 0,
  });
}

/**
 * Get recent reports for a company
 */
export async function getRecentReports(params: {
  companyId: string;
  reportType?: string;
  category?: string;
  days?: number;
  limit?: number;
}) {
  const periodStart = params.days
    ? new Date(Date.now() - params.days * 24 * 60 * 60 * 1000)
    : undefined;

  return await archivalService.getArchivedReports({
    companyId: params.companyId,
    reportType: params.reportType,
    category: params.category,
    periodStart,
    limit: params.limit || 50,
    offset: 0,
  });
}

/**
 * Get complete history for an entity with all changes
 */
export async function getEntityHistory(
  entityType: string,
  entityId: string,
  limit: number = 100
) {
  const snapshots = await archivalService.getSnapshotsForEntity(
    entityType,
    entityId,
    limit
  );

  // Format for easy consumption
  return snapshots.map(snapshot => ({
    version: snapshot.version,
    capturedAt: snapshot.capturedAt,
    capturedBy: snapshot.capturedBy,
    changeType: snapshot.changeType,
    changes: snapshot.changes,
    data: snapshot.snapshotData,
  }));
}

/**
 * Get audit trail with formatted output
 */
export async function getFormattedAuditTrail(
  entityType: string,
  entityId: string,
  limit: number = 100
) {
  const trail = await archivalService.getAuditTrail(entityType, entityId, limit);

  return trail.map(entry => ({
    timestamp: entry.performedAt,
    action: entry.action,
    user: entry.userId,
    userRole: entry.userRole,
    changes: entry.changes,
    success: entry.success,
    ipAddress: entry.ipAddress,
  }));
}

/**
 * Restore a deleted record and return the data
 */
export async function restoreDeletedRecord(
  archiveId: string,
  userId: string
): Promise<any> {
  const restored = await archivalService.restoreRecord(archiveId, userId);
  return restored?.recordData;
}

/**
 * Find and restore a record by original ID
 */
export async function findAndRestoreRecord(params: {
  tableName: string;
  originalId: string;
  companyId: string;
  userId: string;
}): Promise<any> {
  // Search for the archived record
  const { records } = await archivalService.getArchivedRecords({
    tableName: params.tableName,
    companyId: params.companyId,
    includeRestored: false,
  });

  // Find the specific record
  const archived = records.find(r => r.originalId === params.originalId);

  if (!archived) {
    throw new Error(`Archived record not found: ${params.originalId}`);
  }

  // Restore it
  const restored = await archivalService.restoreRecord(archived.id, params.userId);
  return restored?.recordData;
}

/**
 * Export entity data with automatic logging
 */
export async function exportEntityData(params: {
  entityType: string;
  data: any[];
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  companyId: string;
  userId: string;
  filters?: any;
  dateRange?: { start: string; end: string };
}): Promise<{ data: any[]; exportLog: any }> {
  // In a real implementation, this would generate the file
  const exportData = params.data;

  // Log the export
  const exportLog = await archivalService.logDataExport({
    exportType: `${params.entityType}_export`,
    entityType: params.entityType,
    recordCount: params.data.length,
    filters: params.filters,
    dateRange: params.dateRange,
    fileFormat: params.format,
    companyId: params.companyId,
    exportedBy: params.userId,
  });

  return { data: exportData, exportLog };
}

/**
 * Middleware helper to automatically create snapshots on updates
 */
export function withSnapshot<T>(
  entityType: string,
  operation: () => Promise<T>,
  params: {
    entityId: string;
    beforeData: any;
    companyId?: string;
    userId?: string;
  }
): Promise<T> {
  return operation().then(async (result) => {
    // Create snapshot after successful operation
    await archivalService.createSnapshot({
      snapshotType: 'auto',
      entityType,
      entityId: params.entityId,
      data: params.beforeData,
      companyId: params.companyId,
      capturedBy: params.userId,
      triggerEvent: 'update_operation',
      changeType: 'updated',
    });

    return result;
  });
}

/**
 * Check if a record can be restored (not permanently deleted)
 */
export async function canRestoreRecord(archiveId: string): Promise<boolean> {
  const { records } = await archivalService.getArchivedRecords({
    includeRestored: true,
  });

  const record = records.find(r => r.id === archiveId);
  return record ? !record.permanentlyDeletedAt : false;
}

/**
 * Get retention policy for an entity type
 */
export async function getRetentionInfo(entityType: string): Promise<{
  hasPolicy: boolean;
  activeRetentionDays?: number;
  archiveRetentionDays?: number;
  totalRetentionDays?: number;
  autoArchive?: boolean;
  autoDelete?: boolean;
}> {
  // This would query data_retention_policies table
  // For now, return common defaults
  const defaults: Record<string, any> = {
    orders: {
      hasPolicy: true,
      activeRetentionDays: 730,
      archiveRetentionDays: 1825,
      totalRetentionDays: 2555,
      autoArchive: true,
      autoDelete: false,
    },
    invoices: {
      hasPolicy: true,
      activeRetentionDays: 730,
      archiveRetentionDays: 1825,
      totalRetentionDays: 2555,
      autoArchive: true,
      autoDelete: false,
    },
    patients: {
      hasPolicy: true,
      activeRetentionDays: 3650,
      archiveRetentionDays: 999999,
      totalRetentionDays: 999999,
      autoArchive: true,
      autoDelete: false,
    },
  };

  return defaults[entityType] || { hasPolicy: false };
}

/**
 * Bulk archive multiple records
 */
export async function bulkArchive(params: {
  tableName: string;
  records: Array<{ id: string; data: any }>;
  companyId?: string;
  userId: string;
  reason?: string;
  tags?: string[];
}) {
  const results = await Promise.allSettled(
    params.records.map(record =>
      archivalService.archiveRecord({
        tableName: params.tableName,
        recordId: record.id,
        recordData: record.data,
        companyId: params.companyId,
        archivedBy: params.userId,
        reason: params.reason,
        tags: params.tags,
      })
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return { succeeded, failed, total: params.records.length, results };
}

/**
 * Compare two versions of an entity
 */
export async function compareVersions(
  entityType: string,
  entityId: string,
  version1: number,
  version2: number
) {
  const snapshots = await archivalService.getSnapshotsForEntity(
    entityType,
    entityId,
    Math.max(version1, version2) + 1
  );

  const v1 = snapshots.find(s => s.version === version1);
  const v2 = snapshots.find(s => s.version === version2);

  if (!v1 || !v2) {
    throw new Error('Version not found');
  }

  return {
    version1: { version: v1.version, data: v1.snapshotData, capturedAt: v1.capturedAt },
    version2: { version: v2.version, data: v2.snapshotData, capturedAt: v2.capturedAt },
    changes: v2.changes,
  };
}

export default {
  softDelete,
  createUpdateSnapshot,
  archiveGeneratedReport,
  searchArchivedRecords,
  getRecentReports,
  getEntityHistory,
  getFormattedAuditTrail,
  restoreDeletedRecord,
  findAndRestoreRecord,
  exportEntityData,
  withSnapshot,
  canRestoreRecord,
  getRetentionInfo,
  bulkArchive,
  compareVersions,
};
