/**
 * Patient Recall API Routes
 *
 * Endpoints for managing automated patient recall campaigns
 * for annual eye examinations and follow-up appointments.
 *
 * SECURITY: Requires admin, company_admin, manager, or receptionist roles
 */

import express from 'express';
import { db } from '../db';
import { patients, eyeExaminations } from '@shared/schema';
import { eq, and, sql, desc, lt } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import { loggers } from '../utils/logger';

const router = express.Router();
const logger = loggers.api;

// Roles allowed to manage recalls
const RECALL_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist'];

/**
 * GET /api/recalls/due
 *
 * Get list of patients due for recall (last exam > specified months ago)
 *
 * Query params:
 * - monthsAgo: Number of months since last exam (default: 12)
 * - limit: Max results to return (default: 100)
 * - offset: Pagination offset (default: 0)
 */
router.get('/due', requireRole(RECALL_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - no company association'
      });
    }

    const monthsAgo = parseInt(req.query.monthsAgo as string) || 12;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    // Calculate cutoff date (e.g., 12 months ago)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);

    // Query to find patients with their last examination date
    // Uses a subquery to get the most recent exam for each patient
    const patientsWithLastExam = await db
      .select({
        patientId: patients.id,
        patientName: patients.name,
        email: patients.email,
        phone: patients.phone,
        lastExamDate: sql<Date>`(
          SELECT MAX(${eyeExaminations.examinationDate})
          FROM ${eyeExaminations}
          WHERE ${eyeExaminations.patientId} = ${patients.id}
          AND ${eyeExaminations.companyId} = ${patients.companyId}
        )`,
      })
      .from(patients)
      .where(
        and(
          eq(patients.companyId, companyId),
          sql`(
            SELECT MAX(${eyeExaminations.examinationDate})
            FROM ${eyeExaminations}
            WHERE ${eyeExaminations.patientId} = ${patients.id}
            AND ${eyeExaminations.companyId} = ${patients.companyId}
          ) < ${cutoffDate}
          OR (
            SELECT COUNT(*)
            FROM ${eyeExaminations}
            WHERE ${eyeExaminations.patientId} = ${patients.id}
            AND ${eyeExaminations.companyId} = ${patients.companyId}
          ) = 0`
        )
      )
      .limit(limit)
      .offset(offset);

    // Transform results to calculate days since exam and add metadata
    const patientsData = patientsWithLastExam.map(p => {
      const lastExamDate = p.lastExamDate;
      const daysSinceExam = lastExamDate
        ? Math.floor((Date.now() - new Date(lastExamDate).getTime()) / (1000 * 60 * 60 * 24))
        : 99999; // Very high number for patients with no exams

      return {
        patientId: p.patientId,
        patientName: p.patientName,
        email: p.email || null,
        phone: p.phone || null,
        lastExamDate: lastExamDate ? new Date(lastExamDate).toISOString() : null,
        daysSinceExam,
        preferredContact: p.email ? 'email' : (p.phone ? 'sms' : null),
      };
    });

    // Calculate statistics
    const stats = {
      totalDue: patientsData.length,
      emailAvailable: patientsData.filter(p => p.email).length,
      phoneAvailable: patientsData.filter(p => p.phone).length,
      highPriority: patientsData.filter(p => p.daysSinceExam > 540).length, // > 18 months
    };

    res.json({
      success: true,
      patients: patientsData,
      stats,
      metadata: {
        monthsAgo,
        cutoffDate: cutoffDate.toISOString(),
        limit,
        offset,
      },
    });

  } catch (error) {
    logger.error({ error, companyId: (req as any).user?.companyId }, 'Get recalls due error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recalls due'
    });
  }
});

/**
 * GET /api/recalls/stats
 *
 * Get recall statistics for the company
 */
router.get('/stats', requireRole(RECALL_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get total patients
    const totalPatientsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients)
      .where(eq(patients.companyId, companyId));

    const totalPatients = Number(totalPatientsResult[0]?.count || 0);

    // Get patients with exams in last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const recentExamsResult = await db
      .select({ count: sql<number>`count(DISTINCT ${eyeExaminations.patientId})` })
      .from(eyeExaminations)
      .where(
        and(
          eq(eyeExaminations.companyId, companyId),
          sql`${eyeExaminations.examinationDate} >= ${twelveMonthsAgo}`
        )
      );

    const patientsWithRecentExams = Number(recentExamsResult[0]?.count || 0);
    const patientsDueForRecall = totalPatients - patientsWithRecentExams;

    // Get patients never examined
    const neverExaminedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients)
      .where(
        and(
          eq(patients.companyId, companyId),
          sql`NOT EXISTS (
            SELECT 1 FROM ${eyeExaminations}
            WHERE ${eyeExaminations.patientId} = ${patients.id}
            AND ${eyeExaminations.companyId} = ${patients.companyId}
          )`
        )
      );

    const neverExamined = Number(neverExaminedResult[0]?.count || 0);

    res.json({
      success: true,
      stats: {
        totalPatients,
        patientsWithRecentExams,
        patientsDueForRecall,
        neverExamined,
        recallRate: totalPatients > 0
          ? ((patientsDueForRecall / totalPatients) * 100).toFixed(1)
          : '0.0',
      },
    });

  } catch (error) {
    logger.error({ error }, 'Get recall stats error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recall stats'
    });
  }
});

/**
 * GET /api/recalls/patient/:patientId/history
 *
 * Get recall history for a specific patient
 */
router.get('/patient/:patientId/history', requireRole(RECALL_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    const { patientId } = req.params;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Verify patient belongs to company
    const patient = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.companyId, companyId)
        )
      )
      .limit(1);

    if (!patient.length) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Get examination history
    const examHistory = await db
      .select({
        id: eyeExaminations.id,
        examinationDate: eyeExaminations.examinationDate,
        ecpId: eyeExaminations.ecpId,
      })
      .from(eyeExaminations)
      .where(
        and(
          eq(eyeExaminations.patientId, patientId),
          eq(eyeExaminations.companyId, companyId)
        )
      )
      .orderBy(desc(eyeExaminations.examinationDate))
      .limit(10);

    res.json({
      success: true,
      patient: patient[0],
      examinations: examHistory,
      lastExamDate: examHistory[0]?.examinationDate || null,
      daysSinceLastExam: examHistory[0]?.examinationDate
        ? Math.floor((Date.now() - new Date(examHistory[0].examinationDate).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    });

  } catch (error) {
    logger.error({ error }, 'Get patient recall history error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient recall history'
    });
  }
});

export default router;
