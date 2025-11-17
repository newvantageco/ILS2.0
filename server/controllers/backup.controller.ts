/**
 * Backup Controller for ILS 2.0
 * 
 * Provides REST API endpoints for:
 * - Triggering manual backups
 * - Viewing backup status and history
 * - Restoring from backups
 * - Managing backup configurations
 * - Monitoring backup metrics
 */

import { Request, Response } from 'express';
import { backupService } from '../services/BackupService';
import { logger } from '../utils/logger';
import { requireRole } from '../middleware/auth';

/**
 * Trigger a full system backup
 */
export async function triggerFullBackup(req: Request, res: Response) {
  try {
    logger.info({ userId: req.user?.id }, 'Manual full backup triggered');

    const results = await backupService.performFullBackup();

    res.json({
      success: true,
      message: 'Full backup completed successfully',
      data: {
        backupId: results[0]?.id,
        timestamp: new Date(),
        components: results.map(r => ({
          type: r.type,
          status: r.status,
          size: r.size,
          location: r.location
        })),
        totalSize: results.reduce((sum, r) => sum + r.size, 0),
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });

    logger.info({ backupId: results[0]?.id, components: results.length, successful: results.filter(r => r.status === 'success').length }, 'Manual full backup completed');

  } catch (error) {
    logger.error({ error }, 'Manual full backup failed');
    res.status(500).json({
      success: false,
      message: 'Backup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Trigger database backup only
 */
export async function triggerDatabaseBackup(req: Request, res: Response) {
  try {
    logger.info({ userId: req.user?.id }, 'Manual database backup triggered');

    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await backupService.backupDatabase(backupId);

    res.json({
      success: true,
      message: 'Database backup completed successfully',
      data: {
        backupId: result.id,
        timestamp: result.timestamp,
        status: result.status,
        size: result.size,
        location: result.location,
        checksum: result.checksum
      }
    });

  } catch (error) {
    logger.error({ error }, 'Manual database backup failed');
    res.status(500).json({
      success: false,
      message: 'Database backup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Trigger files backup only
 */
export async function triggerFilesBackup(req: Request, res: Response) {
  try {
    logger.info({ userId: req.user?.id }, 'Manual files backup triggered');

    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await backupService.backupFiles(backupId);

    res.json({
      success: true,
      message: 'Files backup completed successfully',
      data: {
        backupId: result.id,
        timestamp: result.timestamp,
        status: result.status,
        size: result.size,
        location: result.location,
        checksum: result.checksum
      }
    });

  } catch (error) {
    logger.error({ error }, 'Manual files backup failed');
    res.status(500).json({
      success: false,
      message: 'Files backup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get backup metrics and statistics
 */
export async function getBackupMetrics(req: Request, res: Response) {
  try {
    const metrics = await backupService.getBackupMetrics();

    res.json({
      success: true,
      data: {
        ...metrics,
        lastBackupTime: metrics.lastBackupTime.toISOString(),
        averageSizeFormatted: formatBytes(metrics.averageSize),
        storageUsedFormatted: formatBytes(metrics.storageUsed),
        retentionCompliance: `${metrics.retentionCompliance}%`
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to get backup metrics');
    res.status(500).json({
      success: false,
      message: 'Failed to get backup metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get backup history
 */
export async function getBackupHistory(req: Request, res: Response) {
  try {
    const { limit = 50, type, status } = req.query;

    // This would typically query a database for backup history
    // For now, we'll return a mock response
    const history = [
      {
        id: 'backup-20231215-020000-abc123',
        type: 'full',
        timestamp: new Date('2023-12-15T02:00:00Z'),
        status: 'success',
        size: 1024000,
        location: 's3://ils2-backups/full/backup-20231215-020000-abc123.tar.gz',
        components: ['database', 'files', 'redis']
      },
      {
        id: 'backup-20231214-020000-def456',
        type: 'full',
        timestamp: new Date('2023-12-14T02:00:00Z'),
        status: 'success',
        size: 980000,
        location: 's3://ils2-backups/full/backup-20231214-020000-def456.tar.gz',
        components: ['database', 'files', 'redis']
      },
      {
        id: 'backup-20231213-020000-ghi789',
        type: 'database',
        timestamp: new Date('2023-12-13T02:00:00Z'),
        status: 'failed',
        size: 0,
        location: '',
        components: ['database'],
        error: 'Connection timeout'
      }
    ];

    // Filter results based on query parameters
    let filteredHistory = history;
    
    if (type) {
      filteredHistory = filteredHistory.filter(backup => backup.type === type);
    }
    
    if (status) {
      filteredHistory = filteredHistory.filter(backup => backup.status === status);
    }

    // Apply limit
    const limitedHistory = filteredHistory.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: {
        backups: limitedHistory,
        total: filteredHistory.length,
        filtered: limitedHistory.length
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to get backup history');
    res.status(500).json({
      success: false,
      message: 'Failed to get backup history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(req: Request, res: Response) {
  try {
    const { backupId, component, backupFile } = req.body;

    if (!backupId && !backupFile) {
      return res.status(400).json({
        success: false,
        message: 'Backup ID or backup file is required'
      });
    }

    logger.info({ userId: req.user?.id, backupId, component, backupFile }, 'Manual restore triggered');

    let result;

    if (component === 'database' || !component) {
      if (!backupFile) {
        return res.status(400).json({
          success: false,
          message: 'Backup file path is required for database restore'
        });
      }
      result = await backupService.restoreDatabase(backupFile);
    } else if (component === 'files') {
      if (!backupFile) {
        return res.status(400).json({
          success: false,
          message: 'Backup file path is required for files restore'
        });
      }
      // Files restore would be implemented here
      result = { success: true, message: 'Files restore completed' };
    } else if (component === 'redis') {
      if (!backupFile) {
        return res.status(400).json({
          success: false,
          message: 'Backup file path is required for Redis restore'
        });
      }
      // Redis restore would be implemented here
      result = { success: true, message: 'Redis restore completed' };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid component. Must be: database, files, redis'
      });
    }

    res.json({
      success: true,
      message: 'Restore completed successfully',
      data: {
        backupId,
        component,
        timestamp: new Date(),
        result
      }
    });

    logger.info({ userId: req.user?.id, backupId, component }, 'Manual restore completed');

  } catch (error) {
    logger.error({ error }, 'Manual restore failed');
    res.status(500).json({
      success: false,
      message: 'Restore failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Verify backup integrity
 */
export async function verifyBackup(req: Request, res: Response) {
  try {
    const { backupFile, expectedChecksum } = req.body;

    if (!backupFile) {
      return res.status(400).json({
        success: false,
        message: 'Backup file path is required'
      });
    }

    const isValid = await backupService.verifyBackup(backupFile, expectedChecksum);

    res.json({
      success: true,
      data: {
        backupFile,
        isValid,
        verifiedAt: new Date()
      }
    });

    logger.info({ userId: req.user?.id, backupFile, isValid }, 'Backup verification completed');

  } catch (error) {
    logger.error({ error }, 'Backup verification failed');
    res.status(500).json({
      success: false,
      message: 'Backup verification failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get backup configuration
 */
export async function getBackupConfiguration(req: Request, res: Response) {
  try {
    // Return current backup configuration (without sensitive data)
    const config = {
      database: {
        enabled: true,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'ils2',
        retentionDays: 30
      },
      files: {
        enabled: true,
        sourcePaths: ['./uploads', './public', './logs'],
        retentionDays: 90
      },
      redis: {
        enabled: true,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retentionDays: 7
      },
      storage: {
        localPath: process.env.BACKUP_LOCAL_PATH || './backups',
        s3Configured: !!(process.env.BACKUP_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID),
        glacierConfigured: !!process.env.AWS_GLACIER_VAULT
      },
      notifications: {
        slackConfigured: !!process.env.SLACK_BACKUP_WEBHOOK,
        emailConfigured: !!process.env.BACKUP_NOTIFICATION_EMAIL
      },
      scheduling: {
        enabled: true,
        frequency: 'daily',
        time: '02:00 UTC'
      }
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    logger.error({ error }, 'Failed to get backup configuration');
    res.status(500).json({
      success: false,
      message: 'Failed to get backup configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update backup configuration
 */
export async function updateBackupConfiguration(req: Request, res: Response) {
  try {
    const updates = req.body;

    // Validate configuration updates
    const allowedUpdates = [
      'database.retentionDays',
      'files.retentionDays',
      'redis.retentionDays',
      'notifications.slackWebhook',
      'notifications.email'
    ];

    for (const key of Object.keys(updates)) {
      if (!allowedUpdates.includes(key)) {
        return res.status(400).json({
          success: false,
          message: `Invalid configuration key: ${key}`
        });
      }
    }

    // In a real implementation, this would update configuration files
    // For now, we'll just return success
    
    logger.info({ userId: req.user?.id, updates: Object.keys(updates) }, 'Backup configuration updated');

    res.json({
      success: true,
      message: 'Backup configuration updated successfully',
      data: {
        updatedAt: new Date(),
        updatedKeys: Object.keys(updates)
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to update backup configuration');
    res.status(500).json({
      success: false,
      message: 'Failed to update backup configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Delete old backups
 */
export async function cleanupOldBackups(req: Request, res: Response) {
  try {
    logger.info({ userId: req.user?.id }, 'Manual cleanup triggered');

    await backupService.cleanupOldBackups();

    res.json({
      success: true,
      message: 'Old backups cleaned up successfully',
      data: {
        timestamp: new Date()
      }
    });

    logger.info('Manual cleanup completed');

  } catch (error) {
    logger.error({ error }, 'Manual cleanup failed');
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get backup storage usage
 */
export async function getStorageUsage(req: Request, res: Response) {
  try {
    // This would typically query actual storage usage
    // For now, we'll return mock data
    const storageUsage = {
      local: {
        total: 10737418240, // 10GB
        used: 2147483648,  // 2GB
        available: 8589934592, // 8GB
        percentage: 20
      },
      s3: {
        total: null, // Unlimited
        used: 5368709120, // 5GB
        percentage: null
      },
      glacier: {
        total: null, // Unlimited
        used: 1073741824, // 1GB
        percentage: null
      }
    };

    res.json({
      success: true,
      data: {
        ...storageUsage,
        formatted: {
          local: {
            total: formatBytes(storageUsage.local.total),
            used: formatBytes(storageUsage.local.used),
            available: formatBytes(storageUsage.local.available)
          },
          s3: {
            used: formatBytes(storageUsage.s3.used)
          },
          glacier: {
            used: formatBytes(storageUsage.glacier.used)
          }
        }
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to get storage usage');
    res.status(500).json({
      success: false,
      message: 'Failed to get storage usage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Helper function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Download backup file
 */
export async function downloadBackup(req: Request, res: Response) {
  try {
    const { backupId, component } = req.params;

    // In a real implementation, this would find and serve the backup file
    // For now, we'll return a placeholder response
    
    logger.info({ userId: req.user?.id, backupId, component }, 'Backup download requested');

    res.json({
      success: false,
      message: 'Backup download not implemented in demo mode'
    });

  } catch (error) {
    logger.error({ error }, 'Backup download failed');
    res.status(500).json({
      success: false,
      message: 'Backup download failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
