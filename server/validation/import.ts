/**
 * Data Import Validation Schemas
 *
 * Validates data being imported from CSV/Excel files or legacy systems
 * Ensures data quality and integrity before database insertion
 */

import { z } from 'zod';

/**
 * Patient Import Schema
 *
 * Validates patient data from legacy systems or CSV imports
 * More lenient than regular patient creation to handle legacy data quirks
 */
export const patientImportSchema = z.object({
  // Required fields
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name too long')
    .trim(),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long')
    .trim(),

  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const minDate = new Date('1900-01-01');
      return parsed >= minDate && parsed <= now;
    }, 'Invalid date of birth'),

  // Optional but recommended fields
  mrn: z.string()
    .max(50, 'MRN too long')
    .optional()
    .transform(val => val?.trim()),

  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  phone: z.string()
    .max(20, 'Phone number too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  gender: z.enum(['male', 'female', 'other', 'unknown'])
    .optional()
    .default('unknown'),

  // Address fields
  address: z.string()
    .max(255, 'Address too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  city: z.string()
    .max(100, 'City too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  state: z.string()
    .max(50, 'State too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  zipCode: z.string()
    .max(20, 'ZIP code too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  country: z.string()
    .max(100, 'Country too long')
    .optional()
    .default('USA')
    .transform(val => val?.trim() || 'USA'),

  // Metadata for import tracking
  externalId: z.string()
    .max(100, 'External ID too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  importSource: z.string()
    .max(100, 'Import source too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  notes: z.string()
    .max(5000, 'Notes too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
});

/**
 * Order Import Schema
 *
 * Validates order data from legacy systems or CSV imports
 */
export const orderImportSchema = z.object({
  // Required fields
  patientIdentifier: z.string()
    .min(1, 'Patient identifier is required')
    .max(100, 'Patient identifier too long')
    .trim()
    .describe('Can be MRN, email, or externalId'),

  orderNumber: z.string()
    .min(1, 'Order number is required')
    .max(100, 'Order number too long')
    .trim(),

  orderDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const minDate = new Date('2000-01-01');
      return parsed >= minDate && parsed <= now;
    }, 'Invalid order date'),

  testType: z.string()
    .min(1, 'Test type is required')
    .max(200, 'Test type too long')
    .trim(),

  // Optional fields
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'failed'])
    .optional()
    .default('pending'),

  priority: z.enum(['routine', 'urgent', 'stat'])
    .optional()
    .default('routine'),

  orderingProvider: z.string()
    .max(200, 'Provider name too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  facility: z.string()
    .max(200, 'Facility name too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  department: z.string()
    .max(100, 'Department too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  // Result fields
  resultDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),

  resultValue: z.string()
    .max(500, 'Result value too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  resultUnit: z.string()
    .max(50, 'Result unit too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  interpretation: z.string()
    .max(5000, 'Interpretation too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  // Metadata
  externalId: z.string()
    .max(100, 'External ID too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  importSource: z.string()
    .max(100, 'Import source too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  notes: z.string()
    .max(5000, 'Notes too long')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
});

/**
 * Batch Import Request Schema
 *
 * Validates the overall import request with configuration options
 */
export const batchImportRequestSchema = z.object({
  type: z.enum(['patients', 'orders']),

  source: z.string()
    .min(1, 'Import source is required')
    .max(100, 'Source name too long')
    .trim()
    .describe('Name of the legacy system or import source'),

  options: z.object({
    skipDuplicates: z.boolean()
      .optional()
      .default(true)
      .describe('Skip records that already exist'),

    updateExisting: z.boolean()
      .optional()
      .default(false)
      .describe('Update existing records instead of skipping'),

    validateOnly: z.boolean()
      .optional()
      .default(false)
      .describe('Validate data without importing'),

    batchSize: z.number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100)
      .describe('Number of records to process in each batch'),

    continueOnError: z.boolean()
      .optional()
      .default(false)
      .describe('Continue processing even if some records fail'),

    dryRun: z.boolean()
      .optional()
      .default(false)
      .describe('Simulate import without making changes'),
  }).optional().default({}),

  metadata: z.object({
    description: z.string().max(500).optional(),
    importedBy: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).optional().default([]),
  }).optional().default({}),
});

/**
 * Import Status Schema
 *
 * Tracks the status of an ongoing or completed import
 */
export const importStatusSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['patients', 'orders']),
  status: z.enum(['pending', 'validating', 'processing', 'completed', 'failed', 'cancelled']),

  progress: z.object({
    total: z.number().int().min(0),
    processed: z.number().int().min(0),
    successful: z.number().int().min(0),
    failed: z.number().int().min(0),
    skipped: z.number().int().min(0),
  }),

  options: batchImportRequestSchema.shape.options,
  metadata: batchImportRequestSchema.shape.metadata,

  errors: z.array(z.object({
    row: z.number().int().min(0),
    field: z.string().optional(),
    message: z.string(),
    data: z.record(z.any()).optional(),
  })).optional().default([]),

  startedAt: z.date(),
  completedAt: z.date().optional().nullable(),

  createdBy: z.string().optional().nullable(),
});

/**
 * Field Mapping Schema
 *
 * Maps legacy system field names to our schema fields
 */
export const fieldMappingSchema = z.object({
  sourceField: z.string()
    .min(1, 'Source field is required')
    .describe('Field name in the legacy system'),

  targetField: z.string()
    .min(1, 'Target field is required')
    .describe('Field name in our system'),

  transform: z.enum(['none', 'uppercase', 'lowercase', 'trim', 'date_format', 'phone_format', 'custom'])
    .optional()
    .default('none')
    .describe('Transformation to apply to the value'),

  customTransform: z.string()
    .optional()
    .nullable()
    .describe('JavaScript function for custom transformation'),

  defaultValue: z.any()
    .optional()
    .nullable()
    .describe('Default value if source field is empty'),

  required: z.boolean()
    .optional()
    .default(false)
    .describe('Whether this field is required'),
});

/**
 * Import Configuration Schema
 *
 * Defines reusable import configurations for different legacy systems
 */
export const importConfigurationSchema = z.object({
  name: z.string()
    .min(1, 'Configuration name is required')
    .max(100, 'Name too long'),

  description: z.string()
    .max(500, 'Description too long')
    .optional(),

  type: z.enum(['patients', 'orders']),

  source: z.string()
    .min(1, 'Source system is required')
    .max(100, 'Source name too long'),

  fieldMappings: z.array(fieldMappingSchema)
    .min(1, 'At least one field mapping is required'),

  defaultOptions: batchImportRequestSchema.shape.options,

  active: z.boolean()
    .optional()
    .default(true),
});

/**
 * Validation Result Schema
 */
export const validationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    row: z.number().int().min(0).optional(),
    field: z.string(),
    message: z.string(),
    value: z.any().optional(),
  })),
  warnings: z.array(z.object({
    row: z.number().int().min(0).optional(),
    field: z.string(),
    message: z.string(),
    value: z.any().optional(),
  })).optional().default([]),
  summary: z.object({
    totalRows: z.number().int().min(0),
    validRows: z.number().int().min(0),
    invalidRows: z.number().int().min(0),
    warningRows: z.number().int().min(0),
  }),
});

// Type exports
export type PatientImport = z.infer<typeof patientImportSchema>;
export type OrderImport = z.infer<typeof orderImportSchema>;
export type BatchImportRequest = z.infer<typeof batchImportRequestSchema>;
export type ImportStatus = z.infer<typeof importStatusSchema>;
export type FieldMapping = z.infer<typeof fieldMappingSchema>;
export type ImportConfiguration = z.infer<typeof importConfigurationSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;

/**
 * Validate patient import data
 */
export function validatePatientImport(data: unknown): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    patientImportSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          value: err.code === 'invalid_type' ? undefined : data,
        });
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRows: 1,
      validRows: errors.length === 0 ? 1 : 0,
      invalidRows: errors.length > 0 ? 1 : 0,
      warningRows: warnings.length > 0 ? 1 : 0,
    },
  };
}

/**
 * Validate order import data
 */
export function validateOrderImport(data: unknown): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    orderImportSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          value: err.code === 'invalid_type' ? undefined : data,
        });
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRows: 1,
      validRows: errors.length === 0 ? 1 : 0,
      invalidRows: errors.length > 0 ? 1 : 0,
      warningRows: warnings.length > 0 ? 1 : 0,
    },
  };
}

/**
 * Validate batch of records
 */
export function validateBatch(
  type: 'patients' | 'orders',
  records: unknown[]
): ValidationResult {
  const allErrors: ValidationResult['errors'] = [];
  const allWarnings: ValidationResult['warnings'] = [];

  const validator = type === 'patients' ? validatePatientImport : validateOrderImport;

  records.forEach((record, index) => {
    const result = validator(record);

    result.errors.forEach((error) => {
      allErrors.push({
        ...error,
        row: index,
      });
    });

    result.warnings?.forEach((warning) => {
      allWarnings.push({
        ...warning,
        row: index,
      });
    });
  });

  const validRows = records.length - new Set(allErrors.map(e => e.row)).size;

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    summary: {
      totalRows: records.length,
      validRows,
      invalidRows: records.length - validRows,
      warningRows: new Set(allWarnings.map(w => w.row)).size,
    },
  };
}
