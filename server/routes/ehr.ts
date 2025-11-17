/**
 * EHR System Routes - Electronic Health Records API
 * 
 * Comprehensive REST API for managing patient medical records, medications,
 * allergies, clinical notes, vital signs, immunizations, and lab results.
 * 
 * Features:
 * - Medical record CRUD operations
 * - Medication management with allergy checking
 * - Allergy documentation and alerts
 * - Clinical note creation with SOAP structure
 * - Vital signs tracking and interpretation
 * - Immunization records and schedules
 * - Lab result management
 * - Patient health summary
 * - HIPAA-compliant data handling
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { ehrService } from "../services/EHRService";
import logger from "../utils/logger";

const router = Router();

// Authentication middleware (assumed to be applied at router level)
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

const requireCompanyAccess = (req: Request, res: Response, next: any) => {
  if (!req.user?.companyId) {
    return res.status(403).json({ error: "Company context required" });
  }
  next();
};

// Validation schemas
const createMedicalRecordSchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().optional(),
  primaryDiagnosis: z.string().optional(),
  secondaryDiagnoses: z.array(z.any()).optional(),
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  pastMedicalHistory: z.any().optional(),
  surgicalHistory: z.any().optional(),
  familyHistory: z.any().optional(),
  socialHistory: z.any().optional(),
  externalId: z.string().optional(),
  sourceSystem: z.string().optional()
});

const updateMedicalRecordSchema = createMedicalRecordSchema.partial();

const medicationSchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().optional(),
  medicationName: z.string().min(1),
  genericName: z.string().optional(),
  ndcCode: z.string().optional(),
  dosage: z.string().min(1),
  route: z.string().min(1),
  frequency: z.string().min(1),
  instructions: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reason: z.string().optional(),
  quantity: z.number().optional(),
  refills: z.number().optional(),
  pharmacy: z.string().optional(),
  externalPrescriptionId: z.string().optional()
});

const allergySchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().optional(),
  allergen: z.string().min(1),
  allergenType: z.string().min(1),
  severity: z.enum(["mild", "moderate", "severe", "life_threatening"]),
  reaction: z.string().min(1),
  onsetDate: z.coerce.date().optional(),
  notes: z.string().optional()
});

const clinicalNoteSchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().optional(),
  noteType: z.enum(["consultation", "examination", "follow_up", "discharge_summary", "referral", "progress_note", "initial_evaluation", "treatment_plan"]),
  title: z.string().min(1),
  content: z.string().min(1),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  serviceDate: z.coerce.date().optional(),
  appointmentId: z.string().optional(),
  attachments: z.array(z.any()).optional()
});

const vitalSignSchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().optional(),
  vitalType: z.enum(["blood_pressure", "heart_rate", "respiratory_rate", "temperature", "oxygen_saturation", "height", "weight", "bmi", "visual_acuity", "intraocular_pressure"]),
  value: z.string().min(1),
  unit: z.string().min(1),
  measurementDate: z.coerce.date(),
  method: z.string().optional(),
  position: z.string().optional(),
  interpretation: z.string().optional(),
  notes: z.string().optional(),
  deviceId: z.string().optional(),
  deviceType: z.string().optional()
});

const immunizationSchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().optional(),
  vaccineName: z.string().min(1),
  vaccineType: z.string().min(1),
  manufacturer: z.string().optional(),
  lotNumber: z.string().optional(),
  administrationDate: z.coerce.date(),
  dose: z.string().optional(),
  route: z.string().optional(),
  site: z.string().optional(),
  nextDueDate: z.coerce.date().optional(),
  indications: z.string().optional(),
  adverseEvents: z.string().optional(),
  notes: z.string().optional(),
  cvxCode: z.string().optional()
});

const labResultSchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().optional(),
  testName: z.string().min(1),
  testCategory: z.string().optional(),
  loincCode: z.string().optional(),
  resultValue: z.string().optional(),
  resultUnit: z.string().optional(),
  referenceRange: z.string().optional(),
  abnormalFlag: z.string().optional(),
  interpretation: z.string().optional(),
  specimenDate: z.coerce.date().optional(),
  resultDate: z.coerce.date(),
  performingLab: z.string().optional(),
  orderingProvider: z.string().optional(),
  clinicalNotes: z.string().optional(),
  accessionNumber: z.string().optional()
});

// ========== MEDICAL RECORDS ROUTES ==========

/**
 * Create a new medical record
 */
router.post('/medical-records', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = createMedicalRecordSchema.parse(req.body);
    
    const medicalRecord = await ehrService.createMedicalRecord({
      ...validated,
      companyId: req.user!.companyId,
      updatedBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      medicalRecord
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to create medical record');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create medical record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get medical records with filtering
 */
router.get('/medical-records', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      practitionerId,
      status,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const result = await ehrService.getMedicalRecords({
      companyId: req.user!.companyId,
      patientId: patientId as string,
      practitionerId: practitionerId as string,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get medical records');
    res.status(500).json({ 
      error: 'Failed to get medical records',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get medical record by ID
 */
router.get('/medical-records/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const medicalRecord = await ehrService.getMedicalRecordById(id, req.user!.companyId);
    
    if (!medicalRecord) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    res.json({
      success: true,
      medicalRecord
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to get medical record');
    res.status(500).json({ 
      error: 'Failed to get medical record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update medical record
 */
router.put('/medical-records/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = updateMedicalRecordSchema.parse(req.body);
    
    const medicalRecord = await ehrService.updateMedicalRecord(
      id,
      validated,
      req.user!.id,
      req.user!.companyId
    );

    res.json({
      success: true,
      medicalRecord
    });
  } catch (error) {
    logger.error({ error, id: req.params.id, body: req.body }, 'Failed to update medical record');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    if (error instanceof Error && error.message === 'Medical record not found') {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update medical record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== MEDICATIONS ROUTES ==========

/**
 * Add medication to patient record
 */
router.post('/medications', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = medicationSchema.parse(req.body);
    
    // Check for allergies first
    const allergies = await ehrService.checkMedicationAllergies(
      validated.patientId,
      validated.medicationName,
      req.user!.companyId
    );

    const medication = await ehrService.addMedication({
      ...validated,
      companyId: req.user!.companyId,
      prescribedBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      medication,
      allergyAlerts: allergies.length > 0 ? allergies : undefined
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add medication');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add medication',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get patient medications
 */
router.get('/medications', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      practitionerId,
      status,
      dateFrom,
      dateTo
    } = req.query;

    const medications = await ehrService.getMedications({
      companyId: req.user!.companyId,
      patientId: patientId as string,
      practitionerId: practitionerId as string,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined
    });

    res.json({
      success: true,
      medications
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get medications');
    res.status(500).json({ 
      error: 'Failed to get medications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update medication status
 */
router.put('/medications/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, endDate } = req.body;
    
    if (!['active', 'discontinued', 'completed', 'on_hold'].includes(status)) {
      return res.status(400).json({ error: 'Invalid medication status' });
    }

    const medication = await ehrService.updateMedicationStatus(
      id,
      status,
      endDate ? new Date(endDate) : undefined,
      req.user!.companyId
    );

    res.json({
      success: true,
      medication
    });
  } catch (error) {
    logger.error({ error, id: req.params.id, body: req.body }, 'Failed to update medication status');
    
    if (error instanceof Error && error.message === 'Medication not found') {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update medication status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== ALLERGIES ROUTES ==========

/**
 * Add patient allergy
 */
router.post('/allergies', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = allergySchema.parse(req.body);
    
    const allergy = await ehrService.addAllergy({
      ...validated,
      companyId: req.user!.companyId,
      reportedBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      allergy
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add allergy');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add allergy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get patient allergies
 */
router.get('/allergies/:patientId', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const allergies = await ehrService.getAllergies(patientId, req.user!.companyId);

    res.json({
      success: true,
      allergies
    });
  } catch (error) {
    logger.error({ error, patientId: req.params.patientId }, 'Failed to get allergies');
    res.status(500).json({ 
      error: 'Failed to get allergies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Check medication allergies
 */
router.post('/allergies/check-medication', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { patientId, medicationName } = req.body;
    
    if (!patientId || !medicationName) {
      return res.status(400).json({ error: 'Patient ID and medication name are required' });
    }

    const allergies = await ehrService.checkMedicationAllergies(
      patientId,
      medicationName,
      req.user!.companyId
    );

    res.json({
      success: true,
      allergies,
      hasAllergies: allergies.length > 0
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to check medication allergies');
    res.status(500).json({ 
      error: 'Failed to check medication allergies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== CLINICAL NOTES ROUTES ==========

/**
 * Create clinical note
 */
router.post('/clinical-notes', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = clinicalNoteSchema.parse(req.body);
    
    const clinicalNote = await ehrService.createClinicalNote({
      ...validated,
      companyId: req.user!.companyId,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      clinicalNote
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to create clinical note');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create clinical note',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get clinical notes
 */
router.get('/clinical-notes', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      practitionerId,
      noteType,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    const clinicalNotes = await ehrService.getClinicalNotes({
      companyId: req.user!.companyId,
      patientId: patientId as string,
      practitionerId: practitionerId as string,
      noteType: noteType as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      clinicalNotes
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get clinical notes');
    res.status(500).json({ 
      error: 'Failed to get clinical notes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Sign clinical note
 */
router.post('/clinical-notes/:id/sign', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const clinicalNote = await ehrService.signClinicalNote(id, req.user!.id, req.user!.companyId);

    res.json({
      success: true,
      clinicalNote
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to sign clinical note');
    
    if (error instanceof Error && error.message === 'Clinical note not found') {
      return res.status(404).json({ error: 'Clinical note not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to sign clinical note',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== VITAL SIGNS ROUTES ==========

/**
 * Add vital sign measurement
 */
router.post('/vital-signs', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = vitalSignSchema.parse(req.body);
    
    const vitalSign = await ehrService.addVitalSign({
      ...validated,
      companyId: req.user!.companyId,
      measuredBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      vitalSign
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add vital sign');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add vital sign',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get vital signs
 */
router.get('/vital-signs', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      practitionerId,
      vitalType,
      dateFrom,
      dateTo
    } = req.query;

    const vitalSigns = await ehrService.getVitalSigns({
      companyId: req.user!.companyId,
      patientId: patientId as string,
      practitionerId: practitionerId as string,
      vitalType: vitalType as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined
    });

    res.json({
      success: true,
      vitalSigns
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get vital signs');
    res.status(500).json({ 
      error: 'Failed to get vital signs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== IMMUNIZATIONS ROUTES ==========

/**
 * Add immunization record
 */
router.post('/immunizations', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = immunizationSchema.parse(req.body);
    
    const immunization = await ehrService.addImmunization({
      ...validated,
      companyId: req.user!.companyId,
      administeredBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      immunization
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add immunization');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add immunization',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get immunizations
 */
router.get('/immunizations', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      practitionerId,
      status,
      dateFrom,
      dateTo
    } = req.query;

    const immunizations = await ehrService.getImmunizations({
      companyId: req.user!.companyId,
      patientId: patientId as string,
      practitionerId: practitionerId as string,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined
    });

    res.json({
      success: true,
      immunizations
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get immunizations');
    res.status(500).json({ 
      error: 'Failed to get immunizations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== LAB RESULTS ROUTES ==========

/**
 * Add lab result
 */
router.post('/lab-results', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = labResultSchema.parse(req.body);
    
    const labResult = await ehrService.addLabResult({
      ...validated,
      companyId: req.user!.companyId
    });

    res.status(201).json({
      success: true,
      labResult
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add lab result');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add lab result',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get lab results
 */
router.get('/lab-results', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      practitionerId,
      testCategory,
      abnormalOnly,
      dateFrom,
      dateTo
    } = req.query;

    const labResults = await ehrService.getLabResults({
      companyId: req.user!.companyId,
      patientId: patientId as string,
      practitionerId: practitionerId as string,
      testCategory: testCategory as string,
      abnormalOnly: abnormalOnly === 'true',
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined
    });

    res.json({
      success: true,
      labResults
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get lab results');
    res.status(500).json({ 
      error: 'Failed to get lab results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== PATIENT HEALTH SUMMARY ==========

/**
 * Get comprehensive patient health summary
 */
router.get('/patients/:patientId/health-summary', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const healthSummary = await ehrService.getPatientHealthSummary(patientId, req.user!.companyId);

    res.json({
      success: true,
      healthSummary
    });
  } catch (error) {
    logger.error({ error, patientId: req.params.patientId }, 'Failed to get patient health summary');
    res.status(500).json({ 
      error: 'Failed to get patient health summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
