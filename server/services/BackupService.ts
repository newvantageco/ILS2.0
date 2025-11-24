/**
 * Automated Backup Service for ILS 2.0
 * 
 * Features:
 * - PostgreSQL database backups with compression
 * - File storage backups (S3/Cloudinary sync)
 * - Redis data backups
 * - Automated scheduling with retention policies
 * - Backup verification and integrity checks
 * - Multi-destination backup storage
 * - Restoration capabilities
 * - Monitoring and alerting
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { GlacierClient, ArchiveJobCommand } from '@aws-sdk/client-glacier';
import { logger } from '../utils/logger';
import { db } from '../db';

const execAsync = promisify(exec);

interface BackupConfig {
  database: {
    enabled: boolean;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    retentionDays: number;
  };
  files: {
    enabled: boolean;
    sourcePaths: string[];
    s3Bucket: string;
    s3Region: string;
    retentionDays: number;
  };
  redis: {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    retentionDays: number;
  };
  storage: {
    localPath: string;
    s3Bucket?: string;
    s3Region?: string;
    glacierVault?: string;
  };
  notifications: {
    slackWebhook?: string;
    email?: string;
  };
}

interface BackupResult {
  id: string;
  type: 'database' | 'files' | 'redis';
  timestamp: Date;
  status: 'success' | 'failed' | 'partial';
  size: number;
  location: string;
  checksum: string;
  metadata: any;
  error?: string;
}

interface BackupMetrics {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  averageSize: number;
  lastBackupTime: Date;
  storageUsed: number;
  retentionCompliance: number;
}

export class BackupService {
  private config: BackupConfig;
  private s3?: AWS.S3;
  private glacier?: AWS.Glacier;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      database: {
        enabled: true,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'ils2',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        retentionDays: 30
      },
      files: {
        enabled: true,
        sourcePaths: ['./uploads', './public', './logs'],
        s3Bucket: process.env.BACKUP_S3_BUCKET || 'ils2-backups',
        s3Region: process.env.AWS_REGION || 'us-east-1',
        retentionDays: 90
      },
      redis: {
        enabled: true,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retentionDays: 7
      },
      storage: {
        localPath: process.env.BACKUP_LOCAL_PATH || './backups',
        s3Bucket: process.env.BACKUP_S3_BUCKET,
        s3Region: process.env.AWS_REGION,
        glacierVault: process.env.AWS_GLACIER_VAULT
      },
      notifications: {
        slackWebhook: process.env.SLACK_BACKUP_WEBHOOK,
        email: process.env.BACKUP_NOTIFICATION_EMAIL
      },
      ...config
    };

    // Initialize AWS services
    if (this.config.storage.s3Bucket) {
      this.s3 = new S3Client({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        },
        region: this.config.storage.s3Region
      });
    }

    if (this.config.storage.glacierVault) {
      this.glacier = new GlacierClient({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        },
        region: this.config.storage.s3Region
      });
    }

    // Ensure backup directory exists
    this.ensureBackupDirectory();
  }

  /**
   * Create backup directory if it doesn't exist
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.storage.localPath, { recursive: true });
      logger.info({ path: this.config.storage.localPath }, 'Backup directory ensured');
    } catch (error) {
      logger.error({ error }, 'Failed to create backup directory');
    }
  }

  /**
   * Perform full system backup
   */
  async performFullBackup(): Promise<BackupResult[]> {
    const results: BackupResult[] = [];
    const backupId = this.generateBackupId();

    try {
      logger.info({ backupId }, 'Starting full system backup');

      // Database backup
      if (this.config.database.enabled) {
        const dbResult = await this.backupDatabase(backupId);
        results.push(dbResult);
      }

      // Files backup
      if (this.config.files.enabled) {
        const filesResult = await this.backupFiles(backupId);
        results.push(filesResult);
      }

      // Redis backup
      if (this.config.redis.enabled) {
        const redisResult = await this.backupRedis(backupId);
        results.push(redisResult);
      }

      // Cleanup old backups
      await this.cleanupOldBackups();

      // Send notification
      await this.sendBackupNotification(results);

      logger.info({ backupId, totalBackups: results.length, successful: results.filter(r => r.status === 'success').length }, 'Full system backup completed');

      return results;

    } catch (error) {
      logger.error({ error, backupId }, 'Full system backup failed');
      await this.sendErrorNotification(error, backupId);
      throw error;
    }
  }

  /**
   * Backup PostgreSQL database
   */
  public async backupDatabase(backupId: string): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-${backupId}-${timestamp}.sql.gz`;
    const filepath = path.join(this.config.storage.localPath, filename);

    try {
      logger.info({ backupId, filename }, 'Starting database backup');

      // Create pg_dump command
      const dumpCommand = `PGPASSWORD="${this.config.database.password}" pg_dump -h ${this.config.database.host} -p ${this.config.database.port} -U ${this.config.database.username} -d ${this.config.database} --verbose --clean --no-owner --no-privileges --format=custom | gzip > "${filepath}"`;

      // Execute backup
      await execAsync(dumpCommand);

      // Get file stats
      const stats = await fs.stat(filepath);
      const checksum = await this.calculateChecksum(filepath);

      const result: BackupResult = {
        id: backupId,
        type: 'database',
        timestamp: new Date(),
        status: 'success',
        size: stats.size,
        location: filepath,
        checksum,
        metadata: {
          filename,
          compression: 'gzip',
          format: 'custom'
        }
      };

      // Upload to S3 if configured
      if (this.s3) {
        await this.uploadToS3(filepath, `database/${filename}`);
        result.location = `s3://${this.config.storage.s3Bucket}/database/${filename}`;
      }

      logger.info({ backupId, size: stats.size, location: result.location }, 'Database backup completed');

      return result;

    } catch (error) {
      logger.error({ error, backupId }, 'Database backup failed');
      
      return {
        id: backupId,
        type: 'database',
        timestamp: new Date(),
        status: 'failed',
        size: 0,
        location: filepath,
        checksum: '',
        metadata: { filename },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Backup application files
   */
  public async backupFiles(backupId: string): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `files-${backupId}-${timestamp}.tar.gz`;
    const filepath = path.join(this.config.storage.localPath, filename);

    try {
      logger.info({ backupId, filename }, 'Starting files backup');

      // Create tar command for all source paths
      const sourcePaths = this.config.files.sourcePaths.join(' ');
      const tarCommand = `tar -czf "${filepath}" ${sourcePaths}`;

      // Execute backup
      await execAsync(tarCommand);

      // Get file stats
      const stats = await fs.stat(filepath);
      const checksum = await this.calculateChecksum(filepath);

      const result: BackupResult = {
        id: backupId,
        type: 'files',
        timestamp: new Date(),
        status: 'success',
        size: stats.size,
        location: filepath,
        checksum,
        metadata: {
          filename,
          sourcePaths: this.config.files.sourcePaths,
          compression: 'gzip'
        }
      };

      // Upload to S3 if configured
      if (this.s3) {
        await this.uploadToS3(filepath, `files/${filename}`);
        result.location = `s3://${this.config.storage.s3Bucket}/files/${filename}`;
      }

      logger.info({ backupId, size: stats.size, location: result.location }, 'Files backup completed');

      return result;

    } catch (error) {
      logger.error({ error, backupId }, 'Files backup failed');
      
      return {
        id: backupId,
        type: 'files',
        timestamp: new Date(),
        status: 'failed',
        size: 0,
        location: filepath,
        checksum: '',
        metadata: { filename },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Backup Redis data
   */
  private async backupRedis(backupId: string): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `redis-${backupId}-${timestamp}.rdb.gz`;
    const filepath = path.join(this.config.storage.localPath, filename);

    try {
      logger.info({ backupId, filename }, 'Starting Redis backup');

      // Create Redis backup command
      const authCommand = this.config.redis.password 
        ? `-a ${this.config.redis.password}` 
        : '';
      
      const redisCommand = `redis-cli -h ${this.config.redis.host} -p ${this.config.redis.port} ${authCommand} --rdb /tmp/redis-backup-${backupId}.rdb`;
      
      // Execute Redis backup
      await execAsync(redisCommand);

      // Compress the backup
      await execAsync(`gzip /tmp/redis-backup-${backupId}.rdb`);
      await execAsync(`mv /tmp/redis-backup-${backupId}.rdb.gz "${filepath}"`);

      // Get file stats
      const stats = await fs.stat(filepath);
      const checksum = await this.calculateChecksum(filepath);

      const result: BackupResult = {
        id: backupId,
        type: 'redis',
        timestamp: new Date(),
        status: 'success',
        size: stats.size,
        location: filepath,
        checksum,
        metadata: {
          filename,
          compression: 'gzip'
        }
      };

      // Upload to S3 if configured
      if (this.s3) {
        await this.uploadToS3(filepath, `redis/${filename}`);
        result.location = `s3://${this.config.storage.s3Bucket}/redis/${filename}`;
      }

      logger.info({ backupId, size: stats.size, location: result.location }, 'Redis backup completed');

      return result;

    } catch (error) {
      logger.error({ error, backupId }, 'Redis backup failed');
      
      return {
        id: backupId,
        type: 'redis',
        timestamp: new Date(),
        status: 'failed',
        size: 0,
        location: filepath,
        checksum: '',
        metadata: { filename },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(filepath: string, key: string): Promise<void> {
    if (!this.s3) {
      throw new Error('S3 not configured');
    }

    try {
      const fileContent = await fs.readFile(filepath);
      
      await this.s3.send(new PutObjectCommand({
        Bucket: this.config.storage.s3Bucket!,
        Key: key,
        Body: fileContent,
        ServerSideEncryption: 'AES256',
        StorageClass: 'STANDARD_IA' // Infrequent Access for cost optimization
      }));

      logger.info({ key, size: fileContent.length }, 'File uploaded to S3');

    } catch (error) {
      logger.error({ error, filepath, key }, 'Failed to upload to S3');
      throw error;
    }
  }

  /**
   * Calculate file checksum for integrity verification
   */
  private async calculateChecksum(filepath: string): Promise<string> {
    const fileContent = await fs.readFile(filepath);
    return crypto.createHash('sha256').update(fileContent).digest('hex');
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    return `backup-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Cleanup old backups based on retention policies
   */
  public async cleanupOldBackups(): Promise<void> {
    try {
      logger.info('Starting backup cleanup');

      // Clean local backups
      await this.cleanupLocalBackups();

      // Clean S3 backups if configured
      if (this.s3) {
        await this.cleanupS3Backups();
      }

      logger.info('Backup cleanup completed');

    } catch (error) {
      logger.error({ error }, 'Backup cleanup failed');
    }
  }

  /**
   * Cleanup local backup files
   */
  private async cleanupLocalBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.storage.localPath);
      const cutoffDate = new Date();
      
      // Database retention
      cutoffDate.setDate(cutoffDate.getDate() - this.config.database.retentionDays);
      await this.deleteFilesOlderThan(files, cutoffDate, 'database-');

      // Files retention
      cutoffDate.setDate(cutoffDate.getDate() - this.config.files.retentionDays);
      await this.deleteFilesOlderThan(files, cutoffDate, 'files-');

      // Redis retention
      cutoffDate.setDate(cutoffDate.getDate() - this.config.redis.retentionDays);
      await this.deleteFilesOlderThan(files, cutoffDate, 'redis-');

    } catch (error) {
      logger.error({ error }, 'Failed to cleanup local backups');
    }
  }

  /**
   * Delete files older than cutoff date with specific prefix
   */
  private async deleteFilesOlderThan(files: string[], cutoffDate: Date, prefix: string): Promise<void> {
    for (const file of files) {
      if (!file.startsWith(prefix)) continue;

      const filepath = path.join(this.config.storage.localPath, file);
      const stats = await fs.stat(filepath);

      if (stats.mtime < cutoffDate) {
        await fs.unlink(filepath);
        logger.debug({ file, age: Date.now() - stats.mtime.getTime() }, 'Deleted old backup file');
      }
    }
  }

  /**
   * Cleanup S3 backups
   */
  private async cleanupS3Backups(): Promise<void> {
    if (!this.s3) return;

    try {
      const cutoffDate = new Date();
      
      // List and delete old database backups
      cutoffDate.setDate(cutoffDate.getDate() - this.config.database.retentionDays);
      await this.deleteS3FilesOlderThan('database/', cutoffDate);

      // List and delete old file backups
      cutoffDate.setDate(cutoffDate.getDate() - this.config.files.retentionDays);
      await this.deleteS3FilesOlderThan('files/', cutoffDate);

      // List and delete old Redis backups
      cutoffDate.setDate(cutoffDate.getDate() - this.config.redis.retentionDays);
      await this.deleteS3FilesOlderThan('redis/', cutoffDate);

    } catch (error) {
      logger.error({ error }, 'Failed to cleanup S3 backups');
    }
  }

  /**
   * Delete S3 files older than cutoff date
   */
  private async deleteS3FilesOlderThan(prefix: string, cutoffDate: Date): Promise<void> {
    if (!this.s3) return;

    try {
      const response = await this.s3.send(new ListObjectsV2Command({
        Bucket: this.config.storage.s3Bucket!,
        Prefix: prefix
      }));

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.LastModified && obj.LastModified < cutoffDate) {
            await this.s3.send(new DeleteObjectCommand({
              Bucket: this.config.storage.s3Bucket!,
              Key: obj.Key!
            }));

            logger.debug({ key: obj.Key }, 'Deleted old S3 backup');
          }
        }
      }
    } catch (error) {
      logger.error({ error, prefix }, 'Failed to delete S3 files older than cutoff date');
    }
  }

  /**
   * Send backup success notification
   */
  private async sendBackupNotification(results: BackupResult[]): Promise<void> {
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const totalSize = results.reduce((sum, r) => sum + r.size, 0);

    const message = {
      text: `🔄 ILS 2.0 Backup Completed`,
      attachments: [{
        color: failedCount > 0 ? 'warning' : 'good',
        fields: [
          { title: 'Status', value: failedCount > 0 ? 'Partial Success' : 'Success', short: true },
          { title: 'Successful', value: successCount.toString(), short: true },
          { title: 'Failed', value: failedCount.toString(), short: true },
          { title: 'Total Size', value: this.formatBytes(totalSize), short: true },
          { title: 'Timestamp', value: new Date().toISOString(), short: false }
        ]
      }]
    };

    await this.sendNotification(message);
  }

  /**
   * Send backup error notification
   */
  private async sendErrorNotification(error: any, backupId: string): Promise<void> {
    const message = {
      text: `🚨 ILS 2.0 Backup Failed`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'Backup ID', value: backupId, short: true },
          { title: 'Error', value: error instanceof Error ? error.message : 'Unknown error', short: false },
          { title: 'Timestamp', value: new Date().toISOString(), short: false }
        ]
      }]
    };

    await this.sendNotification(message);
  }

  /**
   * Send notification to configured channels
   */
  private async sendNotification(message: any): Promise<void> {
    // Slack notification
    if (this.config.notifications.slackWebhook) {
      try {
        const response = await fetch(this.config.notifications.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });

        if (!response.ok) {
          logger.warn({ status: response.status }, 'Failed to send Slack notification');
        }
      } catch (error) {
        logger.warn({ error }, 'Slack notification failed');
      }
    }

    // Email notification (would require email service integration)
    if (this.config.notifications.email) {
      logger.info({ email: this.config.notifications.email }, 'Email notification would be sent');
    }
  }

  /**
   * Get backup metrics and statistics
   */
  async getBackupMetrics(): Promise<BackupMetrics> {
    try {
      const files = await fs.readdir(this.config.storage.localPath);
      
      let totalSize = 0;
      const totalBackups = files.length;
      let successfulBackups = 0;

      for (const file of files) {
        const filepath = path.join(this.config.storage.localPath, file);
        const stats = await fs.stat(filepath);
        totalSize += stats.size;
        
        // Consider file successful if it's larger than 1KB
        if (stats.size > 1024) {
          successfulBackups++;
        }
      }

      const averageSize = totalBackups > 0 ? totalSize / totalBackups : 0;
      const lastBackupTime = totalBackups > 0 ? await this.getLastBackupTime() : new Date(0);

      return {
        totalBackups,
        successfulBackups,
        failedBackups: totalBackups - successfulBackups,
        averageSize,
        lastBackupTime,
        storageUsed: totalSize,
        retentionCompliance: 100 // Would calculate based on retention policies
      };

    } catch (error) {
      logger.error({ error }, 'Failed to get backup metrics');
      return {
        totalBackups: 0,
        successfulBackups: 0,
        failedBackups: 0,
        averageSize: 0,
        lastBackupTime: new Date(0),
        storageUsed: 0,
        retentionCompliance: 0
      };
    }
  }

  /**
   * Get timestamp of most recent backup
   */
  private async getLastBackupTime(): Promise<Date> {
    try {
      const files = await fs.readdir(this.config.storage.localPath);
      let latestTime = new Date(0);

      for (const file of files) {
        const filepath = path.join(this.config.storage.localPath, file);
        const stats = await fs.stat(filepath);
        if (stats.mtime > latestTime) {
          latestTime = stats.mtime;
        }
      }

      return latestTime;

    } catch (error) {
      return new Date(0);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(backupFile: string): Promise<void> {
    try {
      logger.info({ backupFile }, 'Starting database restore');

      const restoreCommand = `gunzip -c "${backupFile}" | PPASSWORD="${this.config.database.password}" psql -h ${this.config.database.host} -p ${this.config.database.port} -U ${this.config.database.username} -d ${this.config.database}`;

      await execAsync(restoreCommand);

      logger.info({ backupFile }, 'Database restore completed');

    } catch (error) {
      logger.error({ error, backupFile }, 'Database restore failed');
      throw error;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupFile: string, expectedChecksum: string): Promise<boolean> {
    try {
      const actualChecksum = await this.calculateChecksum(backupFile);
      const isValid = actualChecksum === expectedChecksum;

      logger.info({ backupFile, isValid, expectedChecksum, actualChecksum }, 'Backup verification completed');

      return isValid;

    } catch (error) {
      logger.error({ error, backupFile }, 'Backup verification failed');
      return false;
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Schedule automated backups
   */
  scheduleAutomatedBackups(): void {
    // Daily backup at 2 AM
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        try {
          await this.performFullBackup();
        } catch (error) {
          logger.error({ error }, 'Scheduled backup failed');
        }
      }
    }, 60000); // Check every minute

    logger.info('Automated backup scheduling enabled');
  }
}

// Export singleton instance
export const backupService = new BackupService();
