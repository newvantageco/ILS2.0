/**
 * Cloud Storage Service
 * Abstraction layer supporting S3, local storage, and CDN
 * Enables seamless migration from local to cloud storage
 */

import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { cacheService } from './CacheService';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);

// Optional S3 SDK - gracefully handles if not installed
let S3Client: any;
let PutObjectCommand: any;
let DeleteObjectCommand: any;
let GetObjectCommand: any;

try {
  const AWS = require('@aws-sdk/client-s3');
  S3Client = AWS.S3Client;
  PutObjectCommand = AWS.PutObjectCommand;
  DeleteObjectCommand = AWS.DeleteObjectCommand;
  GetObjectCommand = AWS.GetObjectCommand;
} catch (e) {
  console.warn('@aws-sdk/client-s3 not installed. S3 storage unavailable.');
}

interface UploadOptions {
  companyId: string;
  category: 'products' | 'profiles' | 'documents' | 'exports' | 'temp';
  filename?: string;
  contentType?: string;
  isPublic?: boolean;
  expiresIn?: number; // For signed URLs (seconds)
}

interface StorageFile {
  key: string;
  url: string;
  cdnUrl?: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

type StorageProvider = 'local' | 's3' | 'cloudflare-r2' | 'azure-blob';

class StorageService {
  private provider: StorageProvider;
  private s3Client: any = null;
  private localBasePath: string;
  private cdnBaseUrl?: string;
  private s3Bucket?: string;
  private s3Region?: string;

  constructor() {
    // Determine storage provider from environment
    this.provider = (process.env.STORAGE_PROVIDER as StorageProvider) || 'local';
    this.localBasePath = process.env.UPLOAD_DIR || './uploads';
    this.cdnBaseUrl = process.env.CDN_BASE_URL;

    // Initialize based on provider
    this.initializeProvider();
  }

  private initializeProvider(): void {
    switch (this.provider) {
      case 's3':
        this.initializeS3();
        break;
      case 'cloudflare-r2':
        this.initializeR2();
        break;
      case 'local':
      default:
        this.initializeLocal();
        break;
    }
  }

  private initializeS3(): void {
    if (!S3Client) {
      console.error('S3 provider selected but @aws-sdk/client-s3 not installed');
      console.log('Falling back to local storage');
      this.provider = 'local';
      this.initializeLocal();
      return;
    }

    this.s3Bucket = process.env.AWS_S3_BUCKET;
    this.s3Region = process.env.AWS_REGION || 'us-east-1';

    if (!this.s3Bucket) {
      console.error('AWS_S3_BUCKET not configured');
      console.log('Falling back to local storage');
      this.provider = 'local';
      this.initializeLocal();
      return;
    }

    this.s3Client = new S3Client({
      region: this.s3Region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    console.log(`✓ S3 storage initialized (bucket: ${this.s3Bucket}, region: ${this.s3Region})`);
  }

  private initializeR2(): void {
    if (!S3Client) {
      console.error('Cloudflare R2 requires @aws-sdk/client-s3');
      console.log('Falling back to local storage');
      this.provider = 'local';
      this.initializeLocal();
      return;
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.s3Bucket = process.env.CLOUDFLARE_R2_BUCKET;

    if (!accountId || !accessKeyId || !secretAccessKey || !this.s3Bucket) {
      console.error('Cloudflare R2 not fully configured');
      console.log('Falling back to local storage');
      this.provider = 'local';
      this.initializeLocal();
      return;
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log(`✓ Cloudflare R2 storage initialized (bucket: ${this.s3Bucket})`);
  }

  private initializeLocal(): void {
    // Ensure upload directory exists
    if (!fs.existsSync(this.localBasePath)) {
      fs.mkdirSync(this.localBasePath, { recursive: true });
    }
    console.log(`✓ Local storage initialized (path: ${this.localBasePath})`);
  }

  /**
   * Generate storage key (path) for a file
   */
  private generateKey(options: UploadOptions): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = options.filename || `file-${timestamp}-${randomSuffix}`;
    
    return `${options.companyId}/${options.category}/${filename}`;
  }

  /**
   * Upload file to storage
   */
  async upload(
    buffer: Buffer,
    options: UploadOptions
  ): Promise<StorageFile> {
    const key = this.generateKey(options);
    const contentType = options.contentType || 'application/octet-stream';

    if (this.provider === 'local') {
      return this.uploadLocal(buffer, key, contentType);
    } else {
      return this.uploadCloud(buffer, key, contentType, options.isPublic);
    }
  }

  /**
   * Upload to local filesystem
   */
  private async uploadLocal(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<StorageFile> {
    const filePath = path.join(this.localBasePath, key);
    const directory = path.dirname(filePath);

    // Ensure directory exists
    await mkdir(directory, { recursive: true });

    // Write file
    await writeFile(filePath, buffer);

    const url = `/uploads/${key}`;
    const cdnUrl = this.cdnBaseUrl ? `${this.cdnBaseUrl}/uploads/${key}` : undefined;

    return {
      key,
      url,
      cdnUrl,
      size: buffer.length,
      contentType,
      uploadedAt: new Date(),
    };
  }

  /**
   * Upload to cloud storage (S3/R2)
   */
  private async uploadCloud(
    buffer: Buffer,
    key: string,
    contentType: string,
    isPublic: boolean = false
  ): Promise<StorageFile> {
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : 'private',
      CacheControl: 'public, max-age=31536000', // 1 year
    });

    await this.s3Client.send(command);

    // Generate URL
    let url: string;
    let cdnUrl: string | undefined;

    if (this.cdnBaseUrl) {
      // Use CDN URL
      cdnUrl = `${this.cdnBaseUrl}/${key}`;
      url = cdnUrl;
    } else {
      // Use direct S3 URL
      url = `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
    }

    return {
      key,
      url,
      cdnUrl,
      size: buffer.length,
      contentType,
      uploadedAt: new Date(),
    };
  }

  /**
   * Delete file from storage
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.provider === 'local') {
        return this.deleteLocal(key);
      } else {
        return this.deleteCloud(key);
      }
    } catch (error) {
      console.error(`Failed to delete file ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete from local filesystem
   */
  private async deleteLocal(key: string): Promise<boolean> {
    const filePath = path.join(this.localBasePath, key);
    
    if (fs.existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
    
    return false;
  }

  /**
   * Delete from cloud storage
   */
  private async deleteCloud(key: string): Promise<boolean> {
    const command = new DeleteObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    return true;
  }

  /**
   * Generate signed URL for private files
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.provider === 'local') {
      // For local storage, return regular URL (no signing needed in dev)
      return `/uploads/${key}`;
    }

    // For S3, generate pre-signed URL
    try {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      // Fallback to regular URL
      return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(key: string): Promise<{ size: number; contentType: string; lastModified: Date } | null> {
    if (this.provider === 'local') {
      const filePath = path.join(this.localBasePath, key);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        contentType: 'application/octet-stream',
        lastModified: stats.mtime,
      };
    } else {
      // S3 HeadObject
      try {
        const { HeadObjectCommand } = require('@aws-sdk/client-s3');
        const command = new HeadObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
        });

        const response = await this.s3Client.send(command);
        
        return {
          size: response.ContentLength,
          contentType: response.ContentType,
          lastModified: response.LastModified,
        };
      } catch (error) {
        console.error('Failed to get metadata:', error);
        return null;
      }
    }
  }

  /**
   * Copy file to new location
   */
  async copy(sourceKey: string, destKey: string): Promise<boolean> {
    try {
      if (this.provider === 'local') {
        const sourcePath = path.join(this.localBasePath, sourceKey);
        const destPath = path.join(this.localBasePath, destKey);
        const destDir = path.dirname(destPath);

        await mkdir(destDir, { recursive: true });
        
        const buffer = await readFile(sourcePath);
        await writeFile(destPath, buffer);
        
        return true;
      } else {
        // S3 CopyObject
        const { CopyObjectCommand } = require('@aws-sdk/client-s3');
        const command = new CopyObjectCommand({
          Bucket: this.s3Bucket,
          CopySource: `${this.s3Bucket}/${sourceKey}`,
          Key: destKey,
        });

        await this.s3Client.send(command);
        return true;
      }
    } catch (error) {
      console.error('Failed to copy file:', error);
      return false;
    }
  }

  /**
   * List files for a company
   */
  async listFiles(companyId: string, category?: string): Promise<string[]> {
    const prefix = category ? `${companyId}/${category}/` : `${companyId}/`;

    if (this.provider === 'local') {
      return this.listFilesLocal(prefix);
    } else {
      return this.listFilesCloud(prefix);
    }
  }

  private async listFilesLocal(prefix: string): Promise<string[]> {
    const directory = path.join(this.localBasePath, prefix);
    
    if (!fs.existsSync(directory)) {
      return [];
    }

    const files: string[] = [];
    const readDirectory = (dir: string, basePrefix: string) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          readDirectory(fullPath, path.join(basePrefix, item));
        } else {
          files.push(path.join(basePrefix, item));
        }
      }
    };

    readDirectory(directory, prefix);
    return files;
  }

  private async listFilesCloud(prefix: string): Promise<string[]> {
    try {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({
        Bucket: this.s3Bucket,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);
      return (response.Contents || []).map((obj: any) => obj.Key);
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  /**
   * Get storage statistics for a company
   */
  async getCompanyStorageStats(companyId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    categories: Record<string, { files: number; size: number }>;
  }> {
    // Try cache first
    const cacheKey = 'storage-stats';
    const cached = await cacheService.get<any>(companyId, cacheKey, {
      namespace: 'system',
    });

    if (cached) {
      return cached;
    }

    // Calculate stats
    const files = await this.listFiles(companyId);
    let totalSize = 0;
    const categories: Record<string, { files: number; size: number }> = {};

    for (const fileKey of files) {
      const metadata = await this.getMetadata(fileKey);
      
      if (metadata) {
        totalSize += metadata.size;

        // Extract category from key (companyId/category/filename)
        const parts = fileKey.split('/');
        const category = parts[1] || 'other';

        if (!categories[category]) {
          categories[category] = { files: 0, size: 0 };
        }

        categories[category].files++;
        categories[category].size += metadata.size;
      }
    }

    const stats = {
      totalFiles: files.length,
      totalSize,
      categories,
    };

    // Cache for 1 hour
    await cacheService.set(companyId, cacheKey, stats, {
      namespace: 'system',
      ttl: 3600,
    });

    return stats;
  }

  /**
   * Get storage health and configuration
   */
  getHealth(): {
    provider: StorageProvider;
    healthy: boolean;
    cdnEnabled: boolean;
    bucket?: string;
    region?: string;
  } {
    return {
      provider: this.provider,
      healthy: this.provider === 'local' || this.s3Client !== null,
      cdnEnabled: !!this.cdnBaseUrl,
      bucket: this.s3Bucket,
      region: this.s3Region,
    };
  }
}

// Singleton instance
export const storageService = new StorageService();

// Helper functions for common operations
export async function uploadFile(
  buffer: Buffer,
  companyId: string,
  category: 'products' | 'profiles' | 'documents' | 'exports' | 'temp',
  options?: Partial<UploadOptions>
): Promise<StorageFile> {
  return storageService.upload(buffer, {
    companyId,
    category,
    ...options,
  });
}

export async function deleteFile(key: string): Promise<boolean> {
  return storageService.delete(key);
}

export async function getSignedUrl(key: string, expiresIn?: number): Promise<string> {
  return storageService.getSignedUrl(key, expiresIn);
}
