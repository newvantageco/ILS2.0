import { Router } from 'express';
import { db } from '../db';
import { eyeExaminations, patients, users } from '../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Helper function to check if user is optometrist
const isOptometrist = (user: any): boolean => {
  return user.enhancedRole === 'optometrist' || user.role === 'ecp' || user.role === 'platform_admin' || user.role === 'admin';
};

// Get all examinations with filters
router.get('/', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    const user = req.user;
    const { status, date } = req.query;

    // Admin can see all companies' data, others see only their company
    const whereClause = (user?.role === 'platform_admin' || user?.role === 'admin') 
      ? undefined 
      : eq(eyeExaminations.companyId, companyId);

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
      : [eq(eyeExaminations.id, id), eq(eyeExaminations.companyId, companyId)];

    const [examination] = await db
      .select()
      .from(eyeExaminations)
      .where(and(...whereConditions));

    if (!examination) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    res.json(examination);
  } catch (error) {
    console.error('Error fetching examination:', error);
    res.status(500).json({ error: 'Failed to fetch examination' });
  }
});

// Create new examination
router.post('/', async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    const ecpId = req.user!.id;

    const {
      patientId,
      examinationDate,
      status = 'in_progress',
      reasonForVisit,
      symptoms,
      history,
      medication,
      previousRx,
      autoRefraction,
      subjective,
      visualAcuity,
      binocularity,
      ophthalmoscopy,
      tonometry,
      additionalTests,
      clinicalNotes,
      recommendations,
      recall,
      notes,
    } = req.body;

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
        status,
        reasonForVisit,
        notes,
        medicalHistory: {
          symptoms,
          history,
          medication,
          previousRx,
        },
        visualAcuity,
        refraction: {
          autoRefraction,
          subjective,
        },
        binocularVision: binocularity,
        eyeHealth: {
          ophthalmoscopy,
          tonometry,
        },
        equipmentReadings: additionalTests,
      })
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
      : [eq(eyeExaminations.id, id), eq(eyeExaminations.companyId, companyId)];

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
      reasonForVisit,
      symptoms,
      history,
      medication,
      previousRx,
      autoRefraction,
      subjective,
      visualAcuity,
      binocularity,
      ophthalmoscopy,
      tonometry,
      additionalTests,
      clinicalNotes,
      recommendations,
      recall,
      notes,
    } = req.body;

    const [updated] = await db
      .update(eyeExaminations)
      .set({
        examinationDate: examinationDate ? new Date(examinationDate) : existing.examinationDate,
        status: status || existing.status,
        reasonForVisit: reasonForVisit !== undefined ? reasonForVisit : existing.reasonForVisit,
        notes: notes !== undefined ? notes : existing.notes,
        medicalHistory: {
          symptoms,
          history,
          medication,
          previousRx,
        },
        visualAcuity: visualAcuity || existing.visualAcuity,
        refraction: {
          autoRefraction,
          subjective,
        },
        binocularVision: binocularity || existing.binocularVision,
        eyeHealth: {
          ophthalmoscopy,
          tonometry,
        },
        equipmentReadings: additionalTests || existing.equipmentReadings,
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
      : eq(eyeExaminations.companyId, companyId);

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
        notes: notes || '',
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
      })
      .returning();

    res.status(201).json(newExamination);
  } catch (error) {
    console.error('Error adding outside Rx:', error);
    res.status(500).json({ error: 'Failed to add outside Rx' });
  }
});

export default router;
