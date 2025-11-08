import express, { Request, Response } from 'express';
import { TrialManagementService } from '../services/research/TrialManagementService';
import { ParticipantEnrollmentService } from '../services/research/ParticipantEnrollmentService';
import { DataCollectionService } from '../services/research/DataCollectionService';

const router = express.Router();

// ============================================================================
// Trial Management Routes
// ============================================================================

router.post('/trials', async (req: Request, res: Response) => {
  try {
    const trial = TrialManagementService.createTrial(req.body);
    res.status(201).json({ success: true, data: trial });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const trials = TrialManagementService.getTrials(status as any);
    res.json({ success: true, data: trials, count: trials.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId', async (req: Request, res: Response) => {
  try {
    const trial = TrialManagementService.getTrial(req.params.trialId);
    if (!trial) {
      return res.status(404).json({ success: false, error: 'Trial not found' });
    }
    res.json({ success: true, data: trial });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/trials/:trialId/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const trial = TrialManagementService.updateTrialStatus(req.params.trialId, status);
    res.json({ success: true, data: trial });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/trials/:trialId/protocol', async (req: Request, res: Response) => {
  try {
    const protocol = TrialManagementService.createProtocol({
      ...req.body,
      trialId: req.params.trialId
    });
    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/protocol', async (req: Request, res: Response) => {
  try {
    const protocol = TrialManagementService.getProtocol(req.params.trialId);
    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }
    res.json({ success: true, data: protocol });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/trials/:trialId/arms', async (req: Request, res: Response) => {
  try {
    const arm = TrialManagementService.createArm({
      ...req.body,
      trialId: req.params.trialId
    });
    res.status(201).json({ success: true, data: arm });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/arms', async (req: Request, res: Response) => {
  try {
    const arms = TrialManagementService.getArms(req.params.trialId);
    res.json({ success: true, data: arms, count: arms.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/trials/:trialId/sites', async (req: Request, res: Response) => {
  try {
    const site = TrialManagementService.createSite({
      ...req.body,
      trialId: req.params.trialId
    });
    res.status(201).json({ success: true, data: site });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/sites', async (req: Request, res: Response) => {
  try {
    const sites = TrialManagementService.getSites(req.params.trialId);
    res.json({ success: true, data: sites, count: sites.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/sites/:siteId/activate', async (req: Request, res: Response) => {
  try {
    const site = TrialManagementService.activateSite(req.params.siteId);
    res.json({ success: true, data: site });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/trials/:trialId/documents', async (req: Request, res: Response) => {
  try {
    const document = TrialManagementService.createDocument({
      ...req.body,
      trialId: req.params.trialId
    });
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/documents', async (req: Request, res: Response) => {
  try {
    const { documentType } = req.query;
    const documents = TrialManagementService.getDocuments(req.params.trialId, documentType as any);
    res.json({ success: true, data: documents, count: documents.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/documents/:documentId/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;
    const document = TrialManagementService.approveDocument(req.params.documentId, approvedBy);
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/trials/:trialId/deviations', async (req: Request, res: Response) => {
  try {
    const deviation = TrialManagementService.recordDeviation({
      ...req.body,
      trialId: req.params.trialId
    });
    res.status(201).json({ success: true, data: deviation });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/deviations', async (req: Request, res: Response) => {
  try {
    const { resolved } = req.query;
    const deviations = TrialManagementService.getDeviations(
      req.params.trialId,
      resolved !== undefined ? resolved === 'true' : undefined
    );
    res.json({ success: true, data: deviations, count: deviations.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/deviations/:deviationId/resolve', async (req: Request, res: Response) => {
  try {
    const { correctiveAction } = req.body;
    const deviation = TrialManagementService.resolveDeviation(req.params.deviationId, correctiveAction);
    res.json({ success: true, data: deviation });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

// ============================================================================
// Participant Enrollment Routes
// ============================================================================

router.post('/participants', async (req: Request, res: Response) => {
  try {
    const participant = ParticipantEnrollmentService.createParticipant(req.body);
    res.status(201).json({ success: true, data: participant });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/participants', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const participants = ParticipantEnrollmentService.getParticipants(req.params.trialId, status as any);
    res.json({ success: true, data: participants, count: participants.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/participants/:participantId', async (req: Request, res: Response) => {
  try {
    const participant = ParticipantEnrollmentService.getParticipant(req.params.participantId);
    if (!participant) {
      return res.status(404).json({ success: false, error: 'Participant not found' });
    }
    res.json({ success: true, data: participant });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/participants/:participantId/screening', async (req: Request, res: Response) => {
  try {
    const screening = ParticipantEnrollmentService.recordScreening({
      ...req.body,
      participantId: req.params.participantId
    });
    res.status(201).json({ success: true, data: screening });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/participants/:participantId/screening', async (req: Request, res: Response) => {
  try {
    const screening = ParticipantEnrollmentService.getScreening(req.params.participantId);
    if (!screening) {
      return res.status(404).json({ success: false, error: 'Screening not found' });
    }
    res.json({ success: true, data: screening });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/participants/:participantId/consent', async (req: Request, res: Response) => {
  try {
    const consent = ParticipantEnrollmentService.obtainConsent({
      ...req.body,
      participantId: req.params.participantId
    });
    res.status(201).json({ success: true, data: consent });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/participants/:participantId/consent', async (req: Request, res: Response) => {
  try {
    const consent = ParticipantEnrollmentService.getConsent(req.params.participantId);
    if (!consent) {
      return res.status(404).json({ success: false, error: 'Consent not found' });
    }
    res.json({ success: true, data: consent });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/participants/:participantId/enroll', async (req: Request, res: Response) => {
  try {
    const participant = ParticipantEnrollmentService.enrollParticipant(req.params.participantId);
    res.json({ success: true, data: participant });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/participants/:participantId/randomize', async (req: Request, res: Response) => {
  try {
    const randomization = ParticipantEnrollmentService.randomizeParticipant({
      ...req.body,
      participantId: req.params.participantId
    });
    res.status(201).json({ success: true, data: randomization });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/participants/:participantId/randomization', async (req: Request, res: Response) => {
  try {
    const randomization = ParticipantEnrollmentService.getRandomization(req.params.participantId);
    if (!randomization) {
      return res.status(404).json({ success: false, error: 'Randomization not found' });
    }
    res.json({ success: true, data: randomization });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/participants/:participantId/withdraw', async (req: Request, res: Response) => {
  try {
    const withdrawal = ParticipantEnrollmentService.withdrawParticipant({
      ...req.body,
      participantId: req.params.participantId
    });
    res.status(201).json({ success: true, data: withdrawal });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/withdrawals', async (req: Request, res: Response) => {
  try {
    const withdrawals = ParticipantEnrollmentService.getWithdrawals(req.params.trialId);
    res.json({ success: true, data: withdrawals, count: withdrawals.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/participants/:participantId/complete', async (req: Request, res: Response) => {
  try {
    const participant = ParticipantEnrollmentService.completeParticipant(req.params.participantId);
    res.json({ success: true, data: participant });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/enrollment-stats', async (req: Request, res: Response) => {
  try {
    const stats = ParticipantEnrollmentService.getEnrollmentStatistics(req.params.trialId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

// ============================================================================
// Data Collection Routes
// ============================================================================

router.post('/visits', async (req: Request, res: Response) => {
  try {
    const visit = DataCollectionService.scheduleVisit(req.body);
    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/participants/:participantId/visits', async (req: Request, res: Response) => {
  try {
    const visits = DataCollectionService.getVisits(req.params.participantId);
    res.json({ success: true, data: visits, count: visits.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/upcoming-visits', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const visits = DataCollectionService.getUpcomingVisits(
      req.params.trialId,
      days ? parseInt(days as string) : 7
    );
    res.json({ success: true, data: visits, count: visits.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/visits/:visitId/complete', async (req: Request, res: Response) => {
  try {
    const { completedBy, actualDate } = req.body;
    const visit = DataCollectionService.completeVisit(
      req.params.visitId,
      completedBy,
      actualDate ? new Date(actualDate) : undefined
    );
    res.json({ success: true, data: visit });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/visits/:visitId/missed', async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    const visit = DataCollectionService.markVisitMissed(req.params.visitId, notes);
    res.json({ success: true, data: visit });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/crfs', async (req: Request, res: Response) => {
  try {
    const crf = DataCollectionService.createCRF(req.body);
    res.status(201).json({ success: true, data: crf });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/participants/:participantId/crfs', async (req: Request, res: Response) => {
  try {
    const { visitId } = req.query;
    const crfs = DataCollectionService.getCRFs(req.params.participantId, visitId as string);
    res.json({ success: true, data: crfs, count: crfs.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/crfs/:crfId', async (req: Request, res: Response) => {
  try {
    const { data, enteredBy } = req.body;
    const crf = DataCollectionService.updateCRF(req.params.crfId, data, enteredBy);
    res.json({ success: true, data: crf });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/crfs/:crfId/complete', async (req: Request, res: Response) => {
  try {
    const crf = DataCollectionService.completeCRF(req.params.crfId);
    res.json({ success: true, data: crf });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/crfs/:crfId/verify', async (req: Request, res: Response) => {
  try {
    const { verifiedBy } = req.body;
    const crf = DataCollectionService.verifyCRF(req.params.crfId, verifiedBy);
    res.json({ success: true, data: crf });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/crfs/:crfId/lock', async (req: Request, res: Response) => {
  try {
    const { lockedBy } = req.body;
    const crf = DataCollectionService.lockCRF(req.params.crfId, lockedBy);
    res.json({ success: true, data: crf });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/adverse-events', async (req: Request, res: Response) => {
  try {
    const ae = DataCollectionService.reportAdverseEvent(req.body);
    res.status(201).json({ success: true, data: ae });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/adverse-events', async (req: Request, res: Response) => {
  try {
    const { participantId, trialId, serious } = req.query;
    const aes = DataCollectionService.getAdverseEvents(
      participantId as string,
      trialId as string,
      serious !== undefined ? serious === 'true' : undefined
    );
    res.json({ success: true, data: aes, count: aes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/adverse-events/:aeId/resolve', async (req: Request, res: Response) => {
  try {
    const { resolutionDate, outcome } = req.body;
    const ae = DataCollectionService.updateAEResolution(
      req.params.aeId,
      new Date(resolutionDate),
      outcome
    );
    res.json({ success: true, data: ae });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/queries', async (req: Request, res: Response) => {
  try {
    const query = DataCollectionService.raiseQuery(req.body);
    res.status(201).json({ success: true, data: query });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/queries', async (req: Request, res: Response) => {
  try {
    const { status, priority } = req.query;
    const queries = DataCollectionService.getQueries(
      req.params.trialId,
      status as any,
      priority as string
    );
    res.json({ success: true, data: queries, count: queries.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/queries/:queryId/answer', async (req: Request, res: Response) => {
  try {
    const { response, respondedBy } = req.body;
    const query = DataCollectionService.answerQuery(req.params.queryId, response, respondedBy);
    res.json({ success: true, data: query });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/queries/:queryId/close', async (req: Request, res: Response) => {
  try {
    const query = DataCollectionService.closeQuery(req.params.queryId);
    res.json({ success: true, data: query });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/sdv', async (req: Request, res: Response) => {
  try {
    const sdv = DataCollectionService.performSDV(req.body);
    res.status(201).json({ success: true, data: sdv });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/participants/:participantId/sdv', async (req: Request, res: Response) => {
  try {
    const sdvs = DataCollectionService.getSDVs(req.params.participantId);
    res.json({ success: true, data: sdvs, count: sdvs.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/trials/:trialId/data-completion', async (req: Request, res: Response) => {
  try {
    const rate = DataCollectionService.getDataCompletionRate(req.params.trialId);
    res.json({ success: true, data: { completionRate: rate } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

// ============================================================================
// Statistics
// ============================================================================

router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = {
      trials: TrialManagementService.getStatistics(),
      enrollment: ParticipantEnrollmentService.getStatistics(),
      dataCollection: DataCollectionService.getStatistics()
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;
