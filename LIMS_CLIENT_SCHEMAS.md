# LIMS Client Package - Type Definitions
# Core interface for all service-to-LIMS interactions

import { z } from 'zod';

# Prescription Data Schema
PrescriptionDataSchema = z.object({
  odSphere: z.number(),
  odCylinder: z.number().optional(),
  odAxis: z.number().optional(),
  odAdd: z.number().optional(),
  osSphere: z.number(),
  osCylinder: z.number().optional(),
  osAxis: z.number().optional(),
  osAdd: z.number().optional(),
  pd: z.number(),
});

# Frame Specification Schema
FrameSpecificationSchema = z.object({
  frameType: z.string(),
  frameSize: z.string(),
  material: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  bridgeSize: z.number().optional(),
  templeLength: z.number().optional(),
});

# LIMS Create Job Request
CreateJobRequestSchema = z.object({
  ecpId: z.string().uuid(),
  patientId: z.string().uuid(),
  prescription: PrescriptionDataSchema,
  frameSpecs: FrameSpecificationSchema,
  lensType: z.enum(['single_vision', 'bifocal', 'progressive']),
  coating: z.string(),
  urgency: z.enum(['standard', 'expedited', 'rush']).default('standard'),
  metadata: z.record(z.string(), z.any()).optional(),
});

# LIMS Job Status
JobStatusSchema = z.enum([
  'queued',
  'in_production',
  'quality_check',
  'ready_for_shipping',
  'shipped',
  'completed',
  'failed',
  'on_hold',
]);

# LIMS Create Job Response
CreateJobResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: JobStatusSchema,
  estimatedCompletionDate: z.string().datetime(),
  queuePosition: z.number(),
  rulesVersion: z.string(),
});

# LIMS Status Update Webhook Payload
LimsStatusUpdatePayloadSchema = z.object({
  jobId: z.string().uuid(),
  previousStatus: JobStatusSchema,
  newStatus: JobStatusSchema,
  timestamp: z.string().datetime(),
  details: z.record(z.string(), z.any()).optional(),
  errorMessage: z.string().optional(),
});

# LIMS Validation Request
ValidationRequestSchema = z.object({
  prescription: PrescriptionDataSchema,
  lensType: z.string(),
  coating: z.string(),
  frameType: z.string(),
  rulesVersion: z.string().optional(),
});

# LIMS Validation Response
ValidationResponseSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
  })),
  warnings: z.array(z.string()).optional(),
  estimatedLeadTime: z.number().optional(), # in hours
);

# LIMS Catalog Entry
CatalogEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['lens_type', 'material', 'coating', 'frame_type']),
  description: z.string(),
  available: z.boolean(),
  leadTime: z.number(), # in hours
  restrictions: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

# LIMS Catalog Response
CatalogResponseSchema = z.object({
  version: z.string(),
  timestamp: z.string().datetime(),
  entries: z.array(CatalogEntrySchema),
  rulesVersion: z.string(),
});
