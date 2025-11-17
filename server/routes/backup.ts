/**
 * Backup Routes for ILS 2.0
 * 
 * REST API endpoints for backup management:
 * - Manual backup triggers
 * - Backup status and metrics
 * - Restore operations
 * - Configuration management
 */

import { Router } from 'express';
import {
  triggerFullBackup,
  triggerDatabaseBackup,
  triggerFilesBackup,
  getBackupMetrics,
  getBackupHistory,
  restoreFromBackup,
  verifyBackup,
  getBackupConfiguration,
  updateBackupConfiguration,
  cleanupOldBackups,
  getStorageUsage,
  downloadBackup
} from '../controllers/backup.controller';
import { requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Apply authentication middleware to all backup routes
router.use(requireRole(['admin', 'platform_admin']));

// Validation schemas
const restoreSchema = z.object({
  backupId: z.string().optional(),
  backupFile: z.string().optional(),
  component: z.enum(['database', 'files', 'redis']).optional()
});

const verifySchema = z.object({
  backupFile: z.string().min(1),
  expectedChecksum: z.string().optional()
});

const updateConfigSchema = z.object({
  'database.retentionDays': z.number().min(1).max(365).optional(),
  'files.retentionDays': z.number().min(1).max(365).optional(),
  'redis.retentionDays': z.number().min(1).max(365).optional(),
  'notifications.slackWebhook': z.string().url().optional(),
  'notifications.email': z.string().email().optional()
});

const historyQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  type: z.enum(['full', 'database', 'files', 'redis']).optional(),
  status: z.enum(['success', 'failed', 'partial']).optional()
});

const downloadParamsSchema = z.object({
  backupId: z.string().min(1),
  component: z.enum(['database', 'files', 'redis'])
});

// Middleware for Zod validation
const validateRequest = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req[source]);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      next(error);
    }
  };
};

/**
 * @route POST /api/backup/full
 * @desc Trigger a full system backup
 * @access Private (Admin, Platform Admin)
 */
router.post('/full', triggerFullBackup);

/**
 * @route POST /api/backup/database
 * @desc Trigger a database backup only
 * @access Private (Admin, Platform Admin)
 */
router.post('/database', triggerDatabaseBackup);

/**
 * @route POST /api/backup/files
 * @desc Trigger a files backup only
 * @access Private (Admin, Platform Admin)
 */
router.post('/files', triggerFilesBackup);

/**
 * @route GET /api/backup/metrics
 * @desc Get backup metrics and statistics
 * @access Private (Admin, Platform Admin)
 */
router.get('/metrics', getBackupMetrics);

/**
 * @route GET /api/backup/history
 * @desc Get backup history
 * @access Private (Admin, Platform Admin)
 */
router.get('/history', validateRequest(historyQuerySchema, 'query'), getBackupHistory);

/**
 * @route POST /api/backup/restore
 * @desc Restore from backup
 * @access Private (Admin, Platform Admin)
 */
router.post('/restore', validateRequest(restoreSchema, 'body'), restoreFromBackup);

/**
 * @route POST /api/backup/verify
 * @desc Verify backup integrity
 * @access Private (Admin, Platform Admin)
 */
router.post('/verify', validateRequest(verifySchema, 'body'), verifyBackup);

/**
 * @route GET /api/backup/configuration
 * @desc Get backup configuration
 * @access Private (Admin, Platform Admin)
 */
router.get('/configuration', getBackupConfiguration);

/**
 * @route PUT /api/backup/configuration
 * @desc Update backup configuration
 * @access Private (Admin, Platform Admin)
 */
router.put('/configuration', validateRequest(updateConfigSchema, 'body'), updateBackupConfiguration);

/**
 * @route POST /api/backup/cleanup
 * @desc Delete old backups based on retention policies
 * @access Private (Admin, Platform Admin)
 */
router.post('/cleanup', cleanupOldBackups);

/**
 * @route GET /api/backup/storage
 * @desc Get backup storage usage information
 * @access Private (Admin, Platform Admin)
 */
router.get('/storage', getStorageUsage);

/**
 * @route GET /api/backup/download/:backupId/:component
 * @desc Download a backup file
 * @access Private (Admin, Platform Admin)
 */
router.get('/download/:backupId/:component', validateRequest(downloadParamsSchema, 'params'), downloadBackup);

export default router;
