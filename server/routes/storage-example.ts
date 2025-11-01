/**
 * Storage Routes Example
 * Demonstrates how to use StorageService in API routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storageService, uploadFile } from '../services/StorageService';
import { uploadSingle, uploadMultiple, uploadImage, processUpload } from '../middleware/upload';
import { uploadRateLimiter } from '../middleware/rateLimiting';

const router = Router();

/**
 * Example 1: Upload product image
 * POST /api/products/:id/image
 */
router.post(
  '/products/:id/image',
  uploadRateLimiter,
  uploadImage,
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const companyId = (req as any).user.companyId;
      const productId = req.params.id;

      // Upload image to storage
      const result = await storageService.upload(req.file.buffer, {
        companyId,
        category: 'products',
        filename: `product-${productId}-${Date.now()}.${req.file.originalname.split('.').pop()}`,
        contentType: req.file.mimetype,
        isPublic: true, // Product images are publicly accessible
      });

      // Return URLs to client
      res.json({
        success: true,
        image: {
          key: result.key,
          url: result.url,
          cdnUrl: result.cdnUrl,
        },
      });
    } catch (error: any) {
      console.error('Image upload failed:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

/**
 * Example 2: Upload multiple documents
 * POST /api/documents/upload
 */
router.post(
  '/documents/upload',
  uploadRateLimiter,
  uploadMultiple('documents', 5),
  async (req: Request, res: Response) => {
    try {
      const files = await processUpload(req as any, 'documents');

      res.json({
        success: true,
        files,
      });
    } catch (error: any) {
      console.error('Document upload failed:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Example 3: Get signed URL for private file
 * GET /api/files/:key/download
 */
router.get(
  '/files/:key(*)/download',
  async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const companyId = (req as any).user.companyId;

      // Verify user has access to this file (belongs to their company)
      if (!key.startsWith(companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate signed URL (valid for 1 hour)
      const signedUrl = await storageService.getSignedUrl(key, 3600);

      res.json({
        success: true,
        url: signedUrl,
        expiresIn: 3600,
      });
    } catch (error: any) {
      console.error('Failed to generate download URL:', error);
      res.status(500).json({ error: 'Failed to generate download URL' });
    }
  }
);

/**
 * Example 4: Delete file
 * DELETE /api/files/:key
 */
router.delete(
  '/files/:key(*)',
  async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const companyId = (req as any).user.companyId;

      // Verify user has access to this file
      if (!key.startsWith(companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const deleted = await storageService.delete(key);

      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } catch (error: any) {
      console.error('File deletion failed:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
);

/**
 * Example 5: Get storage statistics
 * GET /api/storage/stats
 */
router.get(
  '/storage/stats',
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).user.companyId;

      const stats = await storageService.getCompanyStorageStats(companyId);

      res.json({
        success: true,
        stats: {
          totalFiles: stats.totalFiles,
          totalSize: stats.totalSize,
          totalSizeMB: Math.round(stats.totalSize / 1024 / 1024 * 100) / 100,
          categories: stats.categories,
        },
      });
    } catch (error: any) {
      console.error('Failed to get storage stats:', error);
      res.status(500).json({ error: 'Failed to get storage stats' });
    }
  }
);

/**
 * Example 6: List files in a category
 * GET /api/files?category=products
 */
router.get(
  '/files',
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).user.companyId;
      const category = req.query.category as string | undefined;

      const files = await storageService.listFiles(companyId, category);

      // Get metadata for each file
      const filesWithMetadata = await Promise.all(
        files.slice(0, 100).map(async (key) => {
          const metadata = await storageService.getMetadata(key);
          return {
            key,
            ...metadata,
          };
        })
      );

      res.json({
        success: true,
        files: filesWithMetadata,
        total: files.length,
      });
    } catch (error: any) {
      console.error('Failed to list files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  }
);

/**
 * Example 7: Health check
 * GET /api/storage/health
 */
router.get(
  '/storage/health',
  async (req: Request, res: Response) => {
    try {
      const health = storageService.getHealth();

      res.json({
        success: true,
        storage: health,
      });
    } catch (error: any) {
      console.error('Health check failed:', error);
      res.status(500).json({ error: 'Health check failed' });
    }
  }
);

export default router;
