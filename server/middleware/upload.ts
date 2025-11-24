/**
 * File Upload Middleware
 * Integrates Multer with StorageService for seamless uploads
 */

import multer from 'multer';
import { Request } from 'express';
import { storageService } from '../services/StorageService';
import logger from '../utils/logger';


// Configure multer to use memory storage
// Files are kept in memory temporarily, then uploaded to configured storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file size limits based on subscription tier
  const companyId = (req as any).user?.companyId;
  
  if (!companyId) {
    return cb(new Error('Company ID not found'));
  }

  // Allow specific file types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

// Base upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default limit
    files: 10, // Max 10 files per request
  },
});

// Upload configurations for different use cases
export const uploadSingle = (fieldName: string = 'file') => upload.single(fieldName);
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => 
  upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount: number }[]) => 
  upload.fields(fields);

// Image-specific upload with size limits
export const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
    files: 5,
  },
}).single('image');

// Document-specific upload
export const uploadDocument = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ];
    
    if (documentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only document files are allowed'));
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for documents
    files: 5,
  },
}).single('document');

// CSV import upload
export const uploadCSV = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for CSV imports
    files: 1,
  },
}).single('csv');

/**
 * Middleware to process uploaded file and store using StorageService
 * Use this after multer middleware to persist files to configured storage
 */
export async function processUpload(
  req: Request & { file?: Express.Multer.File; files?: Express.Multer.File[] },
  category: 'products' | 'profiles' | 'documents' | 'exports' | 'temp'
): Promise<{ key: string; url: string; cdnUrl?: string }[]> {
  const companyId = (req as any).user?.companyId;
  
  if (!companyId) {
    throw new Error('Company ID required for file upload');
  }

  const files = req.files 
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
    : req.file 
    ? [req.file] 
    : [];

  if (files.length === 0) {
    throw new Error('No files to upload');
  }

  const uploadResults = [];

  for (const file of files) {
    const uploadFile = file as Express.Multer.File;
    const result = await storageService.upload(uploadFile.buffer, {
      companyId,
      category,
      filename: uploadFile.originalname,
      contentType: uploadFile.mimetype,
      isPublic: category === 'products', // Product images are public
    });

    uploadResults.push({
      key: result.key,
      url: result.url,
      cdnUrl: result.cdnUrl,
    });
  }

  return uploadResults;
}

/**
 * Helper to delete old file when replacing
 */
export async function replaceFile(
  oldKey: string | null | undefined,
  newBuffer: Buffer,
  companyId: string,
  category: 'products' | 'profiles' | 'documents' | 'exports' | 'temp',
  options?: { filename?: string; contentType?: string }
): Promise<{ key: string; url: string; cdnUrl?: string }> {
  // Upload new file
  const result = await storageService.upload(newBuffer, {
    companyId,
    category,
    ...options,
  });

  // Delete old file if exists
  if (oldKey) {
    await storageService.delete(oldKey).catch((err) => {
      logger.error('Failed to delete old file:', err);
      // Non-fatal error, continue
    });
  }

  return {
    key: result.key,
    url: result.url,
    cdnUrl: result.cdnUrl,
  };
}

export default upload;
