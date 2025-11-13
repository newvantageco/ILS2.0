import express, { Request, Response } from 'express';
import { QualityMeasuresService } from '../services/quality/QualityMeasuresService';
import { RegulatoryComplianceService } from '../services/quality/RegulatoryComplianceService';
import { QualityImprovementService } from '../services/quality/QualityImprovementService';

const router = express.Router();

// Quality Measures Routes
router.post('/measures', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const measure = await QualityMeasuresService.createQualityMeasure(companyId, req.body);
    res.status(201).json({ success: true, data: measure });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/measures', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { type, activeOnly } = req.query;
    const measures = await QualityMeasuresService.getQualityMeasures(companyId, type as any, activeOnly !== 'false');
    res.json({ success: true, data: measures, count: measures.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/measures/:id/calculate', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const calculation = await QualityMeasuresService.calculateMeasure(companyId, { measureId: req.params.id, ...req.body });
    res.status(201).json({ success: true, data: calculation });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/measures/:id/calculations', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const calculations = await QualityMeasuresService.getMeasureCalculations(companyId, req.params.id);
    res.json({ success: true, data: calculations, count: calculations.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/measures/:id/gap-analysis', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const analysis = await QualityMeasuresService.performGapAnalysis(companyId, { measureId: req.params.id, ...req.body });
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/star-ratings', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const rating = await QualityMeasuresService.calculateStarRating(companyId, req.body);
    res.status(201).json({ success: true, data: rating });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/star-ratings/:id/publish', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const rating = await QualityMeasuresService.publishStarRating(companyId, req.params.id);
    res.json({ success: true, data: rating });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/measures/statistics', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { startDate, endDate, measureType } = req.query;
    const stats = await QualityMeasuresService.getStatistics(
      companyId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      measureType as any
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

// Regulatory Compliance Routes
router.post('/compliance/requirements', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const requirement = RegulatoryComplianceService.createComplianceRequirement(req.body);
    res.status(201).json({ success: true, data: requirement });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/compliance/requirements', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { program, status } = req.query;
    const requirements = RegulatoryComplianceService.getComplianceRequirements(program as any, status as any);
    res.json({ success: true, data: requirements, count: requirements.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/compliance/requirements/overdue', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const requirements = RegulatoryComplianceService.getOverdueRequirements();
    res.json({ success: true, data: requirements, count: requirements.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/compliance/attestations', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const attestation = RegulatoryComplianceService.createAttestation(req.body);
    res.status(201).json({ success: true, data: attestation });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/compliance/attestations/:id/revoke', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { revokedBy, reason } = req.body;
    const attestation = RegulatoryComplianceService.revokeAttestation(req.params.id, revokedBy, reason);
    res.json({ success: true, data: attestation });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/compliance/audits', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const audit = RegulatoryComplianceService.createRegulatoryAudit(req.body);
    res.status(201).json({ success: true, data: audit });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/compliance/audits/:id/findings', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const audit = RegulatoryComplianceService.addAuditFinding(req.params.id, req.body);
    res.json({ success: true, data: audit });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/compliance/audits/:id/corrective-actions', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const audit = RegulatoryComplianceService.addCorrectiveAction(req.params.id, req.body);
    res.json({ success: true, data: audit });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/compliance/mips-submissions', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const submission = RegulatoryComplianceService.createMIPSSubmission(req.body);
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/compliance/mips-submissions/:id/submit', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { submittedBy } = req.body;
    const submission = RegulatoryComplianceService.submitMIPS(req.params.id, submittedBy);
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/compliance/reports', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const report = RegulatoryComplianceService.generateComplianceReport(req.body);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/compliance/policies', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const policy = RegulatoryComplianceService.createPolicyDocument(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/compliance/risk-assessments', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const assessment = RegulatoryComplianceService.createRiskAssessment(req.body);
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/compliance/statistics', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const stats = RegulatoryComplianceService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

// Quality Improvement Routes
router.post('/improvement/projects', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const project = await QualityImprovementService.createQIProject(companyId, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/improvement/projects', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { status } = req.query;
    const projects = await QualityImprovementService.getQIProjects(companyId, status as any);
    res.json({ success: true, data: projects, count: projects.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/improvement/projects/:id/status', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { status } = req.body;
    const project = await QualityImprovementService.updateQIProjectStatus(companyId, req.params.id, status);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/improvement/projects/:id/interventions', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const project = await QualityImprovementService.addQIIntervention(companyId, req.params.id, req.body);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/improvement/pdsa-cycles', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const cycle = QualityImprovementService.createPDSACycle(req.body);
    res.status(201).json({ success: true, data: cycle });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/improvement/pdsa-cycles/:id/:phase', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { phase } = req.params;
    const cycle = QualityImprovementService.updatePDSAPhase(req.params.id, phase as any, req.body);
    res.json({ success: true, data: cycle });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/improvement/bundles', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const bundle = QualityImprovementService.createCareBundle(req.body);
    res.status(201).json({ success: true, data: bundle });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/improvement/bundles', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { activeOnly } = req.query;
    const bundles = QualityImprovementService.getCareBundles(activeOnly !== 'false');
    res.json({ success: true, data: bundles, count: bundles.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/improvement/bundles/compliance', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const compliance = QualityImprovementService.assessBundleCompliance(req.body);
    res.status(201).json({ success: true, data: compliance });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/improvement/bundles/:bundleId/statistics', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { startDate, endDate } = req.query;
    const stats = QualityImprovementService.getBundleComplianceStats(
      req.params.bundleId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/improvement/performance', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const improvement = QualityImprovementService.createPerformanceImprovement(req.body);
    res.status(201).json({ success: true, data: improvement });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/improvement/performance/:id/data-points', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const improvement = QualityImprovementService.addDataPoint(req.params.id, req.body);
    res.json({ success: true, data: improvement });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/improvement/best-practices', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const practice = QualityImprovementService.createBestPractice(req.body);
    res.status(201).json({ success: true, data: practice });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/improvement/best-practices/:id/status', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { status } = req.body;
    const practice = QualityImprovementService.updateBestPracticeStatus(req.params.id, status);
    res.json({ success: true, data: practice });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/improvement/statistics', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const stats = QualityImprovementService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;
