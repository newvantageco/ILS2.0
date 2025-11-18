/**
 * Data Import API Routes
 *
 * Endpoints for importing data from CSV/Excel files
 */

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { loggers } from '../utils/logger.js';
import { parseImportFile } from '../utils/import-parsers.js';
import { ImportService } from '../services/import/ImportService.js';
import { DataTransformService } from '../services/import/DataTransformService.js';
import {
  batchImportRequestSchema,
  type BatchImportRequest,
  type FieldMapping,
} from '../validation/import.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();
const logger = loggers.api;

// Configure multer for file uploads
// SECURITY: Reduced from 10MB to 5MB to mitigate xlsx vulnerabilities
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB (reduced for security - see docs/SECURITY_AUDIT_FINDINGS.md)
    files: 1, // Only allow single file uploads
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    // Strict file validation
    const hasValidMimetype = allowedTypes.includes(file.mimetype);
    const hasValidExtension = /\.(csv|xlsx|xls)$/i.test(file.originalname);

    if (hasValidMimetype && hasValidExtension) {
      cb(null, true);
    } else {
      logger.warn(
        { mimetype: file.mimetype, filename: file.originalname },
        'Rejected file upload - invalid type'
      );
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
});

/**
 * Parse and preview import file
 *
 * POST /api/import/preview
 */
router.post(
  '/preview',
  authenticateUser,
  upload.single('file'),
  async (req: Request, res: Response) => {
    const filePath = req.file?.path;

    try {
      if (!filePath) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { type, sampleSize = 10 } = req.body;

      if (!type || !['patients', 'orders'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type. Must be "patients" or "orders"' });
      }

      // Parse file
      const parseResult = await parseImportFile(filePath, {
        maxRows: parseInt(sampleSize, 10) || 10,
      });

      // Auto-detect field mappings
      const suggestedMappings = DataTransformService.autoDetectMappings(
        type,
        parseResult.headers
      );

      res.json({
        success: true,
        preview: {
          headers: parseResult.headers,
          records: parseResult.records,
          totalRows: parseResult.totalRows,
          suggestedMappings,
        },
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      });
    } catch (error) {
      logger.error({ error }, 'Error previewing import file');
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to preview file',
      });
    } finally {
      // Clean up uploaded file
      if (filePath) {
        try {
          await unlink(filePath);
        } catch (err) {
          logger.warn({ filePath, err }, 'Failed to delete uploaded file');
        }
      }
    }
  }
);

/**
 * Start import job
 *
 * POST /api/import/start
 */
router.post(
  '/start',
  authenticateUser,
  upload.single('file'),
  async (req: Request, res: Response) => {
    const filePath = req.file?.path;

    try {
      if (!filePath) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse request body
      const requestData: BatchImportRequest = {
        type: req.body.type,
        source: req.body.source || 'manual_upload',
        options: req.body.options ? JSON.parse(req.body.options) : {},
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
      };

      // Validate request
      const validation = batchImportRequestSchema.safeParse(requestData);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: validation.error.errors,
        });
      }

      const validatedRequest = validation.data;

      // Parse field mappings if provided
      let fieldMappings: FieldMapping[] | undefined;
      if (req.body.fieldMappings) {
        fieldMappings = JSON.parse(req.body.fieldMappings);
      }

      // Parse file
      const parseResult = await parseImportFile(filePath);

      if (parseResult.errors.length > 0) {
        return res.status(400).json({
          error: 'File parsing failed',
          errors: parseResult.errors,
        });
      }

      // Transform records
      const transformedRecords = DataTransformService.transformBatch(
        parseResult.records,
        validatedRequest.type,
        fieldMappings
      );

      // Create import job
      const jobId = await ImportService.createImportJob(
        validatedRequest.type,
        transformedRecords,
        validatedRequest,
        (req as any).user?.username
      );

      // Start import asynchronously
      ImportService.executeImport(jobId).catch((error) => {
        logger.error({ jobId, error }, 'Import execution failed');
      });

      res.json({
        success: true,
        jobId,
        message: 'Import job started',
      });
    } catch (error) {
      logger.error({ error }, 'Error starting import');
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to start import',
      });
    } finally {
      // Clean up uploaded file
      if (filePath) {
        try {
          await unlink(filePath);
        } catch (err) {
          logger.warn({ filePath, err }, 'Failed to delete uploaded file');
        }
      }
    }
  }
);

/**
 * Get import job status
 *
 * GET /api/import/status/:jobId
 */
router.get('/status/:jobId', authenticateUser, (req: Request, res: Response) => {
  const { jobId } = req.params;

  const status = ImportService.getImportStatus(jobId);

  if (!status) {
    return res.status(404).json({ error: 'Import job not found' });
  }

  res.json({
    success: true,
    status,
  });
});

/**
 * Get all import jobs
 *
 * GET /api/import/jobs
 */
router.get('/jobs', authenticateUser, (req: Request, res: Response) => {
  const jobs = ImportService.getAllJobs();

  res.json({
    success: true,
    jobs,
  });
});

/**
 * Cancel import job
 *
 * POST /api/import/cancel/:jobId
 */
router.post('/cancel/:jobId', authenticateUser, (req: Request, res: Response) => {
  const { jobId } = req.params;

  const cancelled = ImportService.cancelImport(jobId);

  if (!cancelled) {
    return res.status(400).json({
      error: 'Cannot cancel job. Job not found or already completed.',
    });
  }

  res.json({
    success: true,
    message: 'Import job cancelled',
  });
});

/**
 * Rollback import job
 *
 * POST /api/import/rollback/:jobId
 */
router.post('/rollback/:jobId', authenticateUser, async (req: Request, res: Response) => {
  const { jobId } = req.params;

  try {
    const rolledBack = await ImportService.rollbackImport(jobId);

    if (!rolledBack) {
      return res.status(400).json({
        error: 'No records to rollback',
      });
    }

    res.json({
      success: true,
      message: 'Import rolled back successfully',
    });
  } catch (error) {
    logger.error({ jobId, error }, 'Rollback failed');
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Rollback failed',
    });
  }
});

/**
 * Auto-detect field mappings
 *
 * POST /api/import/detect-mappings
 */
router.post('/detect-mappings', authenticateUser, (req: Request, res: Response) => {
  const { type, headers } = req.body;

  if (!type || !['patients', 'orders'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  if (!headers || !Array.isArray(headers)) {
    return res.status(400).json({ error: 'Invalid headers' });
  }

  const mappings = DataTransformService.autoDetectMappings(type, headers);

  res.json({
    success: true,
    mappings,
  });
});

/**
 * Get available transformations
 *
 * GET /api/import/transformations
 */
router.get('/transformations', authenticateUser, (req: Request, res: Response) => {
  const transformations = DataTransformService.getAvailableTransformations();

  res.json({
    success: true,
    transformations,
  });
});

/**
 * Validate import data
 *
 * POST /api/import/validate
 */
router.post(
  '/validate',
  authenticateUser,
  upload.single('file'),
  async (req: Request, res: Response) => {
    const filePath = req.file?.path;

    try {
      if (!filePath) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { type } = req.body;

      if (!type || !['patients', 'orders'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type' });
      }

      // Parse field mappings if provided
      let fieldMappings: FieldMapping[] | undefined;
      if (req.body.fieldMappings) {
        fieldMappings = JSON.parse(req.body.fieldMappings);
      }

      // Parse file
      const parseResult = await parseImportFile(filePath);

      if (parseResult.errors.length > 0) {
        return res.status(400).json({
          error: 'File parsing failed',
          errors: parseResult.errors,
        });
      }

      // Transform records
      const transformedRecords = DataTransformService.transformBatch(
        parseResult.records,
        type,
        fieldMappings
      );

      // Validate records
      const { validateBatch } = await import('../validation/import.js');
      const validationResult = validateBatch(type, transformedRecords);

      res.json({
        success: true,
        validation: validationResult,
      });
    } catch (error) {
      logger.error({ error }, 'Error validating import file');
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    } finally {
      // Clean up uploaded file
      if (filePath) {
        try {
          await unlink(filePath);
        } catch (err) {
          logger.warn({ filePath, err }, 'Failed to delete uploaded file');
        }
      }
    }
  }
);

/**
 * Download import template
 *
 * GET /api/import/template/:type
 */
router.get('/template/:type', authenticateUser, (req: Request, res: Response) => {
  const { type } = req.params;

  if (!['patients', 'orders'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const templates = {
    patients: [
      'firstName',
      'lastName',
      'dateOfBirth',
      'mrn',
      'email',
      'phone',
      'gender',
      'address',
      'city',
      'state',
      'zipCode',
      'country',
    ],
    orders: [
      'patientIdentifier',
      'orderNumber',
      'orderDate',
      'testType',
      'status',
      'priority',
      'orderingProvider',
      'facility',
      'department',
      'resultDate',
      'resultValue',
      'resultUnit',
      'interpretation',
    ],
  };

  const headers = templates[type as keyof typeof templates];
  const csv = headers.join(',') + '\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-import-template.csv`);
  res.send(csv);
});

export default router;
