/**
 * AI Clinical Documentation Routes
 * API endpoints for AI-powered clinical note generation
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { smartClinicalDocumentation } from '../services/ai-ml/SmartClinicalDocumentation';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError } from '../utils/ApiError';
import logger from '../utils/logger';
import { db } from '../db';
import { aiDocumentationLogs } from '@shared/schema';

const router = Router();

// Validation schemas
const generateNoteSchema = z.object({
  patientId: z.string(),
  examType: z.enum(['routine', 'follow-up', 'emergency', 'contact-lens', 'low-vision']),
  chiefComplaint: z.string().optional(),
  symptoms: z.array(z.string()),
  visualAcuity: z.object({
    odDistance: z.string(),
    osDistance: z.string(),
    odNear: z.string().optional(),
    osNear: z.string().optional(),
  }),
  refraction: z.object({
    odSphere: z.string(),
    odCylinder: z.string(),
    odAxis: z.string(),
    osSphere: z.string(),
    osCylinder: z.string(),
    osAxis: z.string(),
  }).optional(),
  eyeHealth: z.object({
    anteriorSegment: z.string().optional(),
    posteriorSegment: z.string().optional(),
    iop: z.object({
      od: z.number(),
      os: z.number(),
    }).optional(),
  }).optional(),
  management: z.string().optional(),
});

const diagnosisSchema = z.object({
  patientId: z.string(),
  symptoms: z.array(z.string()).min(1),
  examData: z.object({
    visualAcuity: z.object({
      odDistance: z.string(),
      osDistance: z.string(),
    }),
    eyeHealth: z.record(z.any()).optional(),
  }),
  chiefComplaint: z.string().optional(),
});

const autoCodingSchema = z.object({
  clinicalText: z.string().min(10),
});

/**
 * POST /api/ai-documentation/generate-note
 * Generate structured clinical note from exam data
 */
router.post(
  '/generate-note',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = generateNoteSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid exam data', validationResult.error.errors);
    }

    const examData = validationResult.data;
    const userId = req.user!.id;
    const companyId = req.user!.companyId;

    // Log AI usage for billing/analytics
    const startTime = Date.now();

    try {
      // Generate clinical note
      const clinicalNote = await smartClinicalDocumentation.generateClinicalNote(
        examData
      );

      const duration = Date.now() - startTime;

      // Log the AI generation
      await db.insert(aiDocumentationLogs).values({
        userId,
        companyId,
        patientId: examData.patientId,
        documentationType: 'clinical_note',
        tokenCount: Math.ceil(duration / 100), // Approximate
        generationTimeMs: duration,
        confidence: clinicalNote.confidence,
        wasAccepted: null, // Will be updated when user accepts/rejects
        createdAt: new Date(),
      });

      logger.info('AI clinical note generated', {
        userId,
        companyId,
        patientId: examData.patientId,
        confidence: clinicalNote.confidence,
        duration,
      });

      res.json({
        success: true,
        note: clinicalNote,
        metadata: {
          generationTime: duration,
          confidence: clinicalNote.confidence,
        },
      });
    } catch (error: any) {
      logger.error('Failed to generate clinical note', {
        error: error.message,
        userId,
        companyId,
      });

      throw new Error('Failed to generate clinical note. Please try again.');
    }
  })
);

/**
 * POST /api/ai-documentation/suggest-diagnosis
 * Get differential diagnosis suggestions
 */
router.post(
  '/suggest-diagnosis',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = diagnosisSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid diagnosis data', validationResult.error.errors);
    }

    const { patientId, symptoms, examData, chiefComplaint } = validationResult.data;
    const userId = req.user!.id;
    const companyId = req.user!.companyId;

    const startTime = Date.now();

    try {
      const suggestions = await smartClinicalDocumentation.suggestDifferentialDiagnosis({
        patientId,
        symptoms,
        chiefComplaint,
        visualAcuity: examData.visualAcuity,
        eyeHealth: examData.eyeHealth,
      });

      const duration = Date.now() - startTime;

      // Log AI usage
      await db.insert(aiDocumentationLogs).values({
        userId,
        companyId,
        patientId,
        documentationType: 'differential_diagnosis',
        tokenCount: Math.ceil(duration / 100),
        generationTimeMs: duration,
        confidence: suggestions[0]?.confidence || 0,
        createdAt: new Date(),
      });

      logger.info('AI diagnosis suggestions generated', {
        userId,
        patientId,
        suggestionsCount: suggestions.length,
        duration,
      });

      res.json({
        success: true,
        suggestions,
        metadata: {
          generationTime: duration,
          count: suggestions.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to generate diagnosis suggestions', {
        error: error.message,
        userId,
      });

      throw new Error('Failed to generate diagnosis suggestions. Please try again.');
    }
  })
);

/**
 * POST /api/ai-documentation/auto-code
 * Auto-code clinical text with ICD-10 and CPT codes
 */
router.post(
  '/auto-code',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = autoCodingSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid clinical text', validationResult.error.errors);
    }

    const { clinicalText } = validationResult.data;
    const userId = req.user!.id;
    const companyId = req.user!.companyId;

    const startTime = Date.now();

    try {
      const codes = await smartClinicalDocumentation.autoCodeClinicalNote(
        clinicalText
      );

      const duration = Date.now() - startTime;

      // Log AI usage
      await db.insert(aiDocumentationLogs).values({
        userId,
        companyId,
        patientId: null,
        documentationType: 'auto_coding',
        tokenCount: Math.ceil(duration / 100),
        generationTimeMs: duration,
        confidence: 0.8, // Average confidence for coding
        createdAt: new Date(),
      });

      logger.info('AI auto-coding completed', {
        userId,
        icd10Count: codes.icd10Codes.length,
        cptCount: codes.cptCodes.length,
        duration,
      });

      res.json({
        success: true,
        codes,
        metadata: {
          generationTime: duration,
          icd10Count: codes.icd10Codes.length,
          cptCount: codes.cptCodes.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to auto-code clinical text', {
        error: error.message,
        userId,
      });

      throw new Error('Failed to auto-code clinical text. Please try again.');
    }
  })
);

/**
 * POST /api/ai-documentation/accept-note
 * Log when user accepts/rejects an AI-generated note
 */
router.post(
  '/accept-note',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { logId, accepted, edits } = req.body;

    if (!logId || typeof accepted !== 'boolean') {
      throw new ValidationError('Invalid acceptance data', []);
    }

    // Update the log entry
    await db
      .update(aiDocumentationLogs)
      .set({
        wasAccepted: accepted,
        userEdits: edits || null,
        updatedAt: new Date(),
      })
      .where(eq(aiDocumentationLogs.id, logId));

    logger.info('AI note acceptance logged', {
      logId,
      accepted,
      hasEdits: !!edits,
    });

    res.json({ success: true });
  })
);

/**
 * GET /api/ai-documentation/usage
 * Get AI documentation usage stats for current company
 */
router.get(
  '/usage',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.user!.companyId;
    
    // Get usage stats for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const logs = await db
      .select()
      .from(aiDocumentationLogs)
      .where(
        and(
          eq(aiDocumentationLogs.companyId, companyId),
          gte(aiDocumentationLogs.createdAt, startOfMonth)
        )
      );

    const stats = {
      totalGenerations: logs.length,
      byType: {
        clinical_note: logs.filter(l => l.documentationType === 'clinical_note').length,
        differential_diagnosis: logs.filter(l => l.documentationType === 'differential_diagnosis').length,
        auto_coding: logs.filter(l => l.documentationType === 'auto_coding').length,
      },
      acceptanceRate: logs.filter(l => l.wasAccepted !== null).length > 0
        ? (logs.filter(l => l.wasAccepted === true).length / logs.filter(l => l.wasAccepted !== null).length * 100).toFixed(1)
        : 0,
      averageConfidence: logs.length > 0
        ? (logs.reduce((sum, l) => sum + (l.confidence || 0), 0) / logs.length).toFixed(2)
        : 0,
      totalTokens: logs.reduce((sum, l) => sum + (l.tokenCount || 0), 0),
      averageGenerationTime: logs.length > 0
        ? Math.round(logs.reduce((sum, l) => sum + (l.generationTimeMs || 0), 0) / logs.length)
        : 0,
    };

    res.json({ success: true, stats });
  })
);

export default router;
