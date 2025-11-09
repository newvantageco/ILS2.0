import { Router } from 'express';
import { db } from '../db';
import { eyeExaminations, patients, users } from '../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Helper function to check if user is optometrist or admin
const isOptometrist = (user: any): boolean => {
  return user.enhancedRole === 'optometrist' || user.role === 'ecp' || user.role === 'platform_admin' || user.role === 'admin' || user.role === 'company_admin';
};

/**
 * GET /api/examinations/recent
 * Get recently completed examinations for patient handoff to Dispensers
 * 
 * This is the "magic" endpoint that powers the Dispenser workflow.
 * Returns exams from the last N hours that are ready for dispensing.
 */
router.get('/recent', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    const hours = parseInt(req.query.hours as string) || 2;
    const status = ((req.query.status as string) || 'finalized') as 'in_progress' | 'finalized';

    // Calculate cutoff time
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const results = await db
      .select({
        id: eyeExaminations.id,
        patientId: eyeExaminations.patientId,
        patientName: patients.name,
        examinationDate: eyeExaminations.examinationDate,
        status: eyeExaminations.status,
        ecpId: eyeExaminations.ecpId,
        performedBy: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        // Extract diagnosis and management plan from JSONB summary
        diagnosis: sql<string>`COALESCE(${eyeExaminations.summary}->>'diagnosis', 'No diagnosis recorded')`,
        managementPlan: sql<string>`COALESCE(${eyeExaminations.summary}->>'managementPlan', '')`,
      })
      .from(eyeExaminations)
      .leftJoin(patients, eq(eyeExaminations.patientId, patients.id))
      .leftJoin(users, eq(eyeExaminations.ecpId, users.id))
      .where(
        and(
          eq(eyeExaminations.companyId, companyId),
          eq(eyeExaminations.status, status),
          sql`${eyeExaminations.examinationDate} >= ${cutoffTime.toISOString()}`
        )
      )
      .orderBy(desc(eyeExaminations.examinationDate))
      .limit(10);

    return res.json({ 
      examinations: results,
      count: results.length,
      hours,
    });
  } catch (error) {
    console.error('Error fetching recent examinations:', error);
    return res.status(500).json({ error: 'Failed to fetch recent examinations' });
  }
});

// Validation schema for comprehensive examination data
const comprehensiveExaminationSchema = z.object({
  patientId: z.string(),
  examinationDate: z.string().or(z.date()),
  status: z.enum(['in_progress', 'finalized']).optional(),
  generalHistory: z.object({
    schedule: z.any().optional(),
    reasonForVisit: z.string().optional(),
    symptoms: z.any().optional(),
    lifestyle: z.any().optional(),
    medicalHistory: z.any().optional(),
  }).optional(),
  currentRx: z.any().optional(),
  newRx: z.any().optional(),
  ophthalmoscopy: z.any().optional(),
  slitLamp: z.any().optional(),
  additionalTests: z.any().optional(),
  tonometry: z.any().optional(),
  eyeSketch: z.any().optional(),
  images: z.any().optional(),
  summary: z.any().optional(),
  notes: z.string().optional(),
});

// Get all examinations with filters
router.get('/', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    const user = req.user;
    const { status, date, patientId } = req.query;

    // Admin can see all companies' data, others see only their company
    const whereClause = (user?.role === 'platform_admin' || user?.role === 'admin')
      ? undefined
      : (companyId ? eq(eyeExaminations.companyId, companyId) : undefined);

    let query = db
      .select({
        id: eyeExaminations.id,
        patientId: eyeExaminations.patientId,
        patientName: patients.name,
        examinationDate: eyeExaminations.examinationDate,
        status: eyeExaminations.status,
        ecpId: eyeExaminations.ecpId,
        ecpName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        reasonForVisit: eyeExaminations.reasonForVisit,
        createdAt: eyeExaminations.createdAt,
      })
      .from(eyeExaminations)
      .leftJoin(patients, eq(eyeExaminations.patientId, patients.id))
      .leftJoin(users, eq(eyeExaminations.ecpId, users.id))
      .orderBy(desc(eyeExaminations.examinationDate));

    // Apply company filter for non-admin users
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    const results = await query;

    // Apply filters
    let filtered = results;
    
    if (patientId) {
      filtered = filtered.filter(exam => exam.patientId === patientId);
    }
    
    if (status && status !== 'all') {
      filtered = filtered.filter(exam => exam.status === status);
    }

    if (date && date !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (date === 'today') {
        filtered = filtered.filter(exam => {
          const examDate = new Date(exam.examinationDate);
          return examDate >= today && examDate < new Date(today.getTime() + 86400000);
        });
      } else if (date === 'week') {
        const weekStart = new Date(today.getTime() - (today.getDay() * 86400000));
        filtered = filtered.filter(exam => {
          const examDate = new Date(exam.examinationDate);
          return examDate >= weekStart;
        });
      } else if (date === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(exam => {
          const examDate = new Date(exam.examinationDate);
          return examDate >= monthStart;
        });
      }
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching examinations:', error);
    res.status(500).json({ error: 'Failed to fetch examinations' });
  }
});

// Get single examination
router.get('/:id', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    const user = req.user;
    const { id } = req.params;

    // Admin can access any examination, others need company match
    const whereConditions = (user?.role === 'platform_admin' || user?.role === 'admin')
      ? [eq(eyeExaminations.id, id)]
      : (companyId
          ? [eq(eyeExaminations.id, id), eq(eyeExaminations.companyId, companyId)]
          : [eq(eyeExaminations.id, id)]);

    const [examination] = await db
      .select()
      .from(eyeExaminations)
      .where(and(...whereConditions));

    if (!examination) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    // Transform database structure back to comprehensive format for frontend
    const transformedExamination = {
      id: examination.id,
      patientId: examination.patientId,
      examinationDate: examination.examinationDate,
      status: examination.status,
      generalHistory: (examination.medicalHistory as any)?.generalHistory,
      currentRx: (examination.refraction as any)?.currentRx,
      newRx: (examination.refraction as any)?.newRx,
      ophthalmoscopy: (examination.binocularVision as any)?.ophthalmoscopy || (examination.eyeHealth as any)?.ophthalmoscopy,
      slitLamp: (examination.eyeHealth as any)?.slitLamp,
      additionalTests: (examination.eyeHealth as any)?.additionalTests || (examination.equipmentReadings as any),
      tonometry: (examination.equipmentReadings as any)?.tonometry,
      eyeSketch: {},
      images: {},
      summary: {},
      notes: examination.notes,
    };

    res.json(transformedExamination);
  } catch (error) {
    console.error('Error fetching examination:', error);
    res.status(500).json({ error: 'Failed to fetch examination' });
  }
});

// Create new examination
router.post('/', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    const ecpId = req.user!.id;

    const {
      patientId,
      examinationDate,
      status = 'in_progress',
      generalHistory,
      currentRx,
      newRx,
      ophthalmoscopy,
      slitLamp,
      additionalTests,
      tonometry,
      eyeSketch,
      images,
      summary,
      notes,
      // Legacy field support (fallback)
      reasonForVisit,
    } = req.body;

    // Validate request body
    const validationResult = comprehensiveExaminationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid examination data',
        details: validationResult.error.errors
      });
    }

    if (!patientId || !examinationDate) {
      return res.status(400).json({ 
        error: 'Patient ID and examination date are required' 
      });
    }

    // Verify patient belongs to company
    const [patient] = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.companyId, companyId)
        )
      );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const [newExamination] = await db
      .insert(eyeExaminations)
      .values({
        companyId,
        patientId,
        ecpId,
        examinationDate: new Date(examinationDate),
        status: status || 'in_progress',
        reasonForVisit: generalHistory?.reasonForVisit || reasonForVisit || null,
        notes: notes || null,
        // Map comprehensive structure to JSONB fields
        medicalHistory: {
          generalHistory,
          lifestyle: generalHistory?.lifestyle,
          symptoms: generalHistory?.symptoms,
          medicalHistory: generalHistory?.medicalHistory,
        },
        visualAcuity: currentRx?.unaidedVision,
        refraction: {
          currentRx,
          newRx,
          objective: newRx?.objective,
          subjective: newRx?.subjective,
          finalRx: {
            distance: newRx?.subjective?.primaryPair,
            near: newRx?.subjective?.nearRx,
            intermediate: newRx?.subjective?.intermediateRx,
          },
          notes: newRx?.notes,
        },
        binocularVision: {
          ophthalmoscopy,
          motility: ophthalmoscopy?.motility,
          coverTest: ophthalmoscopy?.coverTest,
          stereopsis: ophthalmoscopy?.stereopsis,
        },
        eyeHealth: {
          ophthalmoscopy,
          slitLamp,
          additionalTests,
        },
        equipmentReadings: {
          tonometry,
          visualFields: additionalTests?.visualFields,
          oct: additionalTests?.oct,
          wideFieldImaging: additionalTests?.wideFieldImaging,
          amsler: additionalTests?.amsler,
          colourVision: additionalTests?.colourVision,
        },
      } as any)
      .returning();

    res.status(201).json(newExamination);
  } catch (error) {
    console.error('Error creating examination:', error);
    res.status(500).json({ error: 'Failed to create examination' });
  }
});

// Update examination
router.put('/:id', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    const user = req.user;
    const { id } = req.params;

    // Verify examination exists and belongs to company (admin bypasses company check)
    const whereClause = (user?.role === 'platform_admin' || user?.role === 'admin')
      ? [eq(eyeExaminations.id, id)]
      : (companyId
          ? [eq(eyeExaminations.id, id), eq(eyeExaminations.companyId, companyId)]
          : [eq(eyeExaminations.id, id)]);

    const [existing] = await db
      .select()
      .from(eyeExaminations)
      .where(and(...whereClause));

    if (!existing) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    // Only optometrists can edit clinical examination data
    if (!isOptometrist(user)) {
      return res.status(403).json({ 
        error: 'Only optometrists can edit examination records' 
      });
    }

    // Cannot edit finalized examinations
    if (existing.status === 'finalized') {
      return res.status(403).json({ 
        error: 'Cannot edit finalized examinations' 
      });
    }

    const {
      examinationDate,
      status,
      generalHistory,
      currentRx,
      newRx,
      ophthalmoscopy,
      slitLamp,
      additionalTests,
      tonometry,
      eyeSketch,
      images,
      summary,
      notes,
      // Legacy field support
      reasonForVisit,
    } = req.body;

    const [updated] = await db
      .update(eyeExaminations)
      .set({
        examinationDate: examinationDate ? new Date(examinationDate) : existing.examinationDate,
        status: status || existing.status,
        reasonForVisit: generalHistory?.reasonForVisit || reasonForVisit || existing.reasonForVisit,
        notes: notes !== undefined ? notes : existing.notes,
        // Map comprehensive structure to JSONB fields
        medicalHistory: generalHistory ? {
          generalHistory,
          lifestyle: generalHistory?.lifestyle,
          symptoms: generalHistory?.symptoms,
          medicalHistory: generalHistory?.medicalHistory,
        } : existing.medicalHistory,
        visualAcuity: currentRx?.unaidedVision || existing.visualAcuity,
        refraction: newRx ? {
          currentRx,
          newRx,
          objective: newRx?.objective,
          subjective: newRx?.subjective,
          finalRx: {
            distance: newRx?.subjective?.primaryPair,
            near: newRx?.subjective?.nearRx,
            intermediate: newRx?.subjective?.intermediateRx,
          },
          notes: newRx?.notes,
        } : existing.refraction,
        binocularVision: ophthalmoscopy ? {
          ophthalmoscopy,
          motility: ophthalmoscopy?.motility,
          coverTest: ophthalmoscopy?.coverTest,
          stereopsis: ophthalmoscopy?.stereopsis,
        } : existing.binocularVision,
        eyeHealth: (ophthalmoscopy || slitLamp || additionalTests) ? {
          ophthalmoscopy,
          slitLamp,
          additionalTests,
        } : existing.eyeHealth,
        equipmentReadings: tonometry ? {
          tonometry,
          visualFields: additionalTests?.visualFields,
          oct: additionalTests?.oct,
          wideFieldImaging: additionalTests?.wideFieldImaging,
          amsler: additionalTests?.amsler,
          colourVision: additionalTests?.colourVision,
        } : existing.equipmentReadings,
        updatedAt: new Date(),
      })
      .where(eq(eyeExaminations.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating examination:', error);
    res.status(500).json({ error: 'Failed to update examination' });
  }
});

// Delete examination (soft delete for finalized, hard delete for in_progress)
router.delete('/:id', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    const { id } = req.params;

    const [examination] = await db
      .select()
      .from(eyeExaminations)
      .where(
        and(
          eq(eyeExaminations.id, id),
          eq(eyeExaminations.companyId, companyId)
        )
      );

    if (!examination) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    // Only allow deletion of in_progress examinations
    if (examination.status === 'finalized') {
      return res.status(403).json({ 
        error: 'Cannot delete finalized examinations' 
      });
    }

    await db
      .delete(eyeExaminations)
      .where(eq(eyeExaminations.id, id));

    res.json({ message: 'Examination deleted successfully' });
  } catch (error) {
    console.error('Error deleting examination:', error);
    res.status(500).json({ error: 'Failed to delete examination' });
  }
});

// Get examination statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    const user = req.user;

    // Admin can see stats across all companies
    const whereClause = (user?.role === 'platform_admin' || user?.role === 'admin')
      ? undefined
      : (companyId ? eq(eyeExaminations.companyId, companyId) : undefined);

    const allExams = await db
      .select()
      .from(eyeExaminations)
      .where(whereClause);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: allExams.length,
      today: allExams.filter(e => {
        const examDate = new Date(e.examinationDate);
        examDate.setHours(0, 0, 0, 0);
        return examDate.getTime() === today.getTime();
      }).length,
      inProgress: allExams.filter(e => e.status === 'in_progress').length,
      finalized: allExams.filter(e => e.status === 'finalized').length,
      thisWeek: allExams.filter(e => {
        const examDate = new Date(e.examinationDate);
        const weekAgo = new Date(today.getTime() - (7 * 86400000));
        return examDate >= weekAgo;
      }).length,
      thisMonth: allExams.filter(e => {
        const examDate = new Date(e.examinationDate);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return examDate >= monthStart;
      }).length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Add outside Rx (available to all authenticated users)
router.post('/outside-rx', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    const userId = req.user!.id;

    const {
      patientId,
      examinationDate,
      prescriptionSource,
      prescriptionDate,
      odSphere,
      odCylinder,
      odAxis,
      odAdd,
      osSphere,
      osCylinder,
      osAxis,
      osAdd,
      pd,
      notes,
    } = req.body;

    if (!patientId || !prescriptionSource) {
      return res.status(400).json({ 
        error: 'Patient ID and prescription source are required' 
      });
    }

    // Verify patient belongs to company
    const [patient] = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.companyId, companyId)
        )
      );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const [newExamination] = await db
      .insert(eyeExaminations)
      .values({
        companyId,
        patientId,
        ecpId: userId,
        examinationDate: examinationDate ? new Date(examinationDate) : new Date(),
        status: 'finalized', // Outside Rx is automatically finalized
        reasonForVisit: `Outside Prescription from ${prescriptionSource}`,
        notes: notes || null,
        refraction: {
          outsideRx: {
            source: prescriptionSource,
            date: prescriptionDate,
            odSphere,
            odCylinder,
            odAxis,
            odAdd,
            osSphere,
            osCylinder,
            osAxis,
            osAdd,
            pd,
          }
        },
      } as any)
      .returning();

    res.status(201).json(newExamination);
  } catch (error) {
    console.error('Error adding outside Rx:', error);
    res.status(500).json({ error: 'Failed to add outside Rx' });
  }
});

export default router;
