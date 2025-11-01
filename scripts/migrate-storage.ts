/**
 * Storage Migration Script
 * Migrate files from local storage to S3/R2
 * Run with: npm run migrate-storage
 */

import * as fs from 'fs';
import * as path from 'path';
import { storageService } from '../server/services/StorageService';

interface MigrationStats {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  totalSize: number;
  startTime: Date;
  endTime?: Date;
  errors: Array<{ file: string; error: string }>;
}

class StorageMigration {
  private stats: MigrationStats = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    startTime: new Date(),
    errors: [],
  };

  private localBasePath = process.env.UPLOAD_DIR || './uploads';

  /**
   * Main migration function
   */
  async migrate(dryRun: boolean = false): Promise<MigrationStats> {
    console.log('🚀 Starting storage migration...');
    console.log(`Source: Local (${this.localBasePath})`);
    console.log(`Destination: ${(storageService as any).provider}`);
    
    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No files will be uploaded\n');
    } else {
      console.log('⚠️  LIVE MIGRATION - Files will be uploaded\n');
    }

    // Check if source directory exists
    if (!fs.existsSync(this.localBasePath)) {
      console.error(`❌ Source directory not found: ${this.localBasePath}`);
      return this.stats;
    }

    // Scan all files
    const files = this.scanDirectory(this.localBasePath);
    this.stats.totalFiles = files.length;

    console.log(`📊 Found ${files.length} files to migrate\n`);

    // Migrate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[${i + 1}/${files.length}] Migrating: ${file}`);

      if (!dryRun) {
        await this.migrateFile(file);
      } else {
        // In dry run, just count size
        const filePath = path.join(this.localBasePath, file);
        const stats = fs.statSync(filePath);
        this.stats.totalSize += stats.size;
        this.stats.migratedFiles++;
      }
    }

    this.stats.endTime = new Date();
    this.printSummary();

    return this.stats;
  }

  /**
   * Scan directory recursively
   */
  private scanDirectory(directory: string, basePrefix: string = ''): string[] {
    const files: string[] = [];

    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const relativePath = basePrefix ? path.join(basePrefix, item) : item;
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = this.scanDirectory(fullPath, relativePath);
        files.push(...subFiles);
      } else {
        // Add file to list
        files.push(relativePath);
      }
    }

    return files;
  }

  /**
   * Migrate a single file
   */
  private async migrateFile(relativeFile: string): Promise<void> {
    try {
      const filePath = path.join(this.localBasePath, relativeFile);
      const buffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);

      // Parse key to extract companyId and category
      const parts = relativeFile.split(path.sep);
      const companyId = parts[0];
      const category = parts[1] as any;
      const filename = parts.slice(2).join('/');

      // Upload to cloud storage
      await storageService.upload(buffer, {
        companyId,
        category,
        filename,
        contentType: this.guessContentType(filename),
      });

      this.stats.migratedFiles++;
      this.stats.totalSize += stats.size;

      console.log(`  ✓ Uploaded (${this.formatBytes(stats.size)})`);
    } catch (error: any) {
      this.stats.failedFiles++;
      this.stats.errors.push({
        file: relativeFile,
        error: error.message,
      });

      console.log(`  ✗ Failed: ${error.message}`);
    }
  }

  /**
   * Guess content type from filename
   */
  private guessContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    const duration = this.stats.endTime 
      ? (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000
      : 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Files:     ${this.stats.totalFiles}`);
    console.log(`Migrated:        ${this.stats.migratedFiles} ✓`);
    console.log(`Failed:          ${this.stats.failedFiles} ✗`);
    console.log(`Total Size:      ${this.formatBytes(this.stats.totalSize)}`);
    console.log(`Duration:        ${Math.round(duration)}s`);
    console.log(`Speed:           ${this.formatBytes(this.stats.totalSize / duration)}/s`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ FAILED FILES:');
      this.stats.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.file}`);
        console.log(`   Error: ${error.error}`);
      });
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Verify migration - check files exist in cloud
   */
  async verify(): Promise<{ verified: number; missing: number }> {
    console.log('🔍 Verifying migration...\n');

    const files = this.scanDirectory(this.localBasePath);
    let verified = 0;
    let missing = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parts = file.split(path.sep);
      const companyId = parts[0];
      const category = parts[1];
      const filename = parts.slice(2).join('/');
      const key = `${companyId}/${category}/${filename}`;

      const metadata = await storageService.getMetadata(key);

      if (metadata) {
        verified++;
        console.log(`[${i + 1}/${files.length}] ✓ ${key}`);
      } else {
        missing++;
        console.log(`[${i + 1}/${files.length}] ✗ ${key} (MISSING)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Files:     ${files.length}`);
    console.log(`Verified:        ${verified} ✓`);
    console.log(`Missing:         ${missing} ✗`);
    console.log('='.repeat(60) + '\n');

    return { verified, missing };
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';
  const isDryRun = args.includes('--dry-run');

  const migration = new StorageMigration();

  (async () => {
    try {
      switch (command) {
        case 'migrate':
          await migration.migrate(isDryRun);
          break;
        case 'verify':
          await migration.verify();
          break;
        default:
          console.log('Usage:');
          console.log('  npm run migrate-storage              - Run migration');
          console.log('  npm run migrate-storage -- --dry-run - Test migration without uploading');
          console.log('  npm run migrate-storage verify       - Verify migration completed');
      }
    } catch (error: any) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  })();
}

export default StorageMigration;
