/**
 * File Upload API Routes
 * Handles image and file uploads for products, profiles, etc.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');

// Helper function to get company-specific directory
const getCompanyDirectory = (companyId: string, uploadType: string): string => {
  const baseDir = path.join(uploadsDir, companyId);
  const typeDir = path.join(baseDir, uploadType === 'profile' ? 'profiles' : 'products');
  
  // Ensure directory exists
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
  
  return typeDir;
};

// Configure multer for file uploads with multi-tenant isolation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return cb(new Error('Company ID not found. User must be authenticated.'), '');
    }
    
    const uploadType = req.body.uploadType || 'product';
    const dir = getCompanyDirectory(companyId, uploadType);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitized = basename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

/**
 * Upload single image
 */
router.post('/image',
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(401).json({ error: 'Company ID not found' });
      }
      
      const uploadType = req.body.uploadType || 'product';
      
      // Construct the public URL for the uploaded file with company isolation
      const fileUrl = `/uploads/${companyId}/${uploadType === 'profile' ? 'profiles' : 'products'}/${req.file.filename}`;

      res.status(201).json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload file',
        message: error.message,
      });
    }
  }
);

/**
 * Upload multiple images
 */
router.post('/images',
  upload.array('images', 10), // Max 10 images
  async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadType = req.body.uploadType || 'product';
      
      const uploadedFiles = req.files.map(file => ({
        url: `/uploads/${uploadType === 'profile' ? 'profiles' : 'products'}/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      }));

      res.status(201).json({
        success: true,
        files: uploadedFiles,
        count: uploadedFiles.length,
      });
    } catch (error: any) {
      console.error('Multiple file upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload files',
        message: error.message,
      });
    }
  }
);

/**
 * Delete uploaded image
 */
router.delete('/image',
  async (req: Request, res: Response) => {
    try {
      const { filename, uploadType } = req.body;
      const companyId = req.user?.companyId;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }
      
      if (!companyId) {
        return res.status(401).json({ error: 'Company ID not found' });
      }

      const dir = getCompanyDirectory(companyId, uploadType || 'product');
      const filePath = path.join(dir, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error: any) {
      console.error('File deletion error:', error);
      res.status(500).json({ 
        error: 'Failed to delete file',
        message: error.message,
      });
    }
  }
);

/**
 * Get image info
 */
router.get('/image/:filename',
  async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const uploadType = req.query.type || 'product';
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(401).json({ error: 'Company ID not found' });
      }
      
      const dir = getCompanyDirectory(companyId, uploadType as string);
      const filePath = path.join(dir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const stats = fs.statSync(filePath);

      res.json({
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/${companyId}/${uploadType === 'profile' ? 'profiles' : 'products'}/${filename}`,
      });
    } catch (error: any) {
      console.error('File info error:', error);
      res.status(500).json({ 
        error: 'Failed to get file info',
        message: error.message,
      });
    }
  }
);

export default router;
