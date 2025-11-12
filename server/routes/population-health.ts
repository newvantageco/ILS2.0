import express, { Request, Response } from 'express';
import { RiskStratificationService } from '../services/population-health/RiskStratificationService';
import { CareCoordinationService } from '../services/population-health/CareCoordinationService';
import { ChronicDiseaseManagementService } from '../services/population-health/ChronicDiseaseManagementService';

const router = express.Router();

// Helper to extract companyId from authenticated request
function getCompanyId(req: Request): string {
  const companyId = (req as any).user?.companyId;
  if (!companyId) {
    throw new Error('Authentication required - no companyId found');
  }
  return companyId;
}

// ============================================================================
// Risk Stratification Routes
// ============================================================================

/**
 * @route   POST /api/population-health/risk-scores
 * @desc    Calculate risk score
 * @access  Private
 */
router.post('/risk-scores', async (req: Request, res: Response) => {
  try {
    const riskScore = RiskStratificationService.calculateRiskScore(req.body);
    res.status(201).json({
      success: true,
      data: riskScore,
      message: 'Risk score calculated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate risk score'
    });
  }
});

/**
 * @route   GET /api/population-health/risk-scores/:id
 * @desc    Get risk score by ID
 * @access  Private
 */
router.get('/risk-scores/:id', async (req: Request, res: Response) => {
  try {
    const riskScore = RiskStratificationService.getRiskScoreById(req.params.id);
    if (!riskScore) {
      return res.status(404).json({
        success: false,
        error: 'Risk score not found'
      });
    }
    res.json({
      success: true,
      data: riskScore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get risk score'
    });
  }
});

/**
 * @route   GET /api/population-health/risk-scores/patient/:patientId
 * @desc    Get risk scores by patient
 * @access  Private
 */
router.get('/risk-scores/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const riskScores = RiskStratificationService.getRiskScoresByPatient(req.params.patientId);
    res.json({
      success: true,
      data: riskScores,
      count: riskScores.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get risk scores'
    });
  }
});

/**
 * @route   GET /api/population-health/risk-scores/patient/:patientId/latest
 * @desc    Get latest risk score for patient
 * @access  Private
 */
router.get('/risk-scores/patient/:patientId/latest', async (req: Request, res: Response) => {
  try {
    const { scoreType } = req.query;
    const riskScore = RiskStratificationService.getLatestRiskScore(
      req.params.patientId,
      scoreType as string | undefined
    );
    if (!riskScore) {
      return res.status(404).json({
        success: false,
        error: 'No risk score found'
      });
    }
    res.json({
      success: true,
      data: riskScore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get risk score'
    });
  }
});

/**
 * @route   GET /api/population-health/patients/by-risk/:riskLevel
 * @desc    Get patients by risk level
 * @access  Private
 */
router.get('/patients/by-risk/:riskLevel', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const patientIds = RiskStratificationService.getPatientsByRiskLevel(
      req.params.riskLevel as any,
      category as any
    );
    res.json({
      success: true,
      data: patientIds,
      count: patientIds.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get patients'
    });
  }
});

/**
 * @route   POST /api/population-health/health-risk-assessments
 * @desc    Create health risk assessment
 * @access  Private
 */
router.post('/health-risk-assessments', async (req: Request, res: Response) => {
  try {
    const assessment = RiskStratificationService.createHealthRiskAssessment(req.body);
    res.status(201).json({
      success: true,
      data: assessment,
      message: 'Health risk assessment created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create assessment'
    });
  }
});

/**
 * @route   POST /api/population-health/health-risk-assessments/:id/responses
 * @desc    Record assessment response
 * @access  Private
 */
router.post('/health-risk-assessments/:id/responses', async (req: Request, res: Response) => {
  try {
    const assessment = RiskStratificationService.recordAssessmentResponse(
      req.params.id,
      req.body
    );
    res.json({
      success: true,
      data: assessment,
      message: 'Response recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record response'
    });
  }
});

/**
 * @route   PUT /api/population-health/health-risk-assessments/:id/complete
 * @desc    Complete health risk assessment
 * @access  Private
 */
router.put('/health-risk-assessments/:id/complete', async (req: Request, res: Response) => {
  try {
    const { administeredBy } = req.body;
    const assessment = RiskStratificationService.completeHealthRiskAssessment(
      req.params.id,
      administeredBy
    );
    res.json({
      success: true,
      data: assessment,
      message: 'Assessment completed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete assessment'
    });
  }
});

/**
 * @route   GET /api/population-health/health-risk-assessments/patient/:patientId
 * @desc    Get assessments by patient
 * @access  Private
 */
router.get('/health-risk-assessments/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const assessments = RiskStratificationService.getHealthRiskAssessmentsByPatient(req.params.patientId);
    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get assessments'
    });
  }
});

/**
 * @route   POST /api/population-health/predictive-models
 * @desc    Create predictive model
 * @access  Private
 */
router.post('/predictive-models', async (req: Request, res: Response) => {
  try {
    const model = RiskStratificationService.createPredictiveModel(req.body);
    res.status(201).json({
      success: true,
      data: model,
      message: 'Predictive model created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create model'
    });
  }
});

/**
 * @route   GET /api/population-health/predictive-models
 * @desc    Get all predictive models
 * @access  Private
 */
router.get('/predictive-models', async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;
    const models = RiskStratificationService.getPredictiveModels(activeOnly !== 'false');
    res.json({
      success: true,
      data: models,
      count: models.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get models'
    });
  }
});

/**
 * @route   POST /api/population-health/predictive-analyses
 * @desc    Run predictive analysis
 * @access  Private
 */
router.post('/predictive-analyses', async (req: Request, res: Response) => {
  try {
    const analysis = RiskStratificationService.runPredictiveAnalysis(req.body);
    res.status(201).json({
      success: true,
      data: analysis,
      message: 'Predictive analysis completed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run analysis'
    });
  }
});

/**
 * @route   GET /api/population-health/predictive-analyses/patient/:patientId
 * @desc    Get analyses by patient
 * @access  Private
 */
router.get('/predictive-analyses/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const analyses = RiskStratificationService.getPredictiveAnalysesByPatient(req.params.patientId);
    res.json({
      success: true,
      data: analyses,
      count: analyses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analyses'
    });
  }
});

/**
 * @route   POST /api/population-health/social-determinants
 * @desc    Record social determinant
 * @access  Private
 */
router.post('/social-determinants', async (req: Request, res: Response) => {
  try {
    const determinant = RiskStratificationService.recordSocialDeterminant(req.body);
    res.status(201).json({
      success: true,
      data: determinant,
      message: 'Social determinant recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record social determinant'
    });
  }
});

/**
 * @route   PUT /api/population-health/social-determinants/:id
 * @desc    Update social determinant
 * @access  Private
 */
router.put('/social-determinants/:id', async (req: Request, res: Response) => {
  try {
    const determinant = RiskStratificationService.updateSocialDeterminant(req.params.id, req.body);
    res.json({
      success: true,
      data: determinant,
      message: 'Social determinant updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update social determinant'
    });
  }
});

/**
 * @route   GET /api/population-health/social-determinants/patient/:patientId
 * @desc    Get social determinants by patient
 * @access  Private
 */
router.get('/social-determinants/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const determinants = RiskStratificationService.getSocialDeterminantsByPatient(req.params.patientId);
    res.json({
      success: true,
      data: determinants,
      count: determinants.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get social determinants'
    });
  }
});

/**
 * @route   POST /api/population-health/cohorts
 * @desc    Create risk stratification cohort
 * @access  Private
 */
router.post('/cohorts', async (req: Request, res: Response) => {
  try {
    const cohort = RiskStratificationService.createRiskStratificationCohort(req.body);
    res.status(201).json({
      success: true,
      data: cohort,
      message: 'Cohort created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create cohort'
    });
  }
});

/**
 * @route   GET /api/population-health/cohorts
 * @desc    Get all cohorts
 * @access  Private
 */
router.get('/cohorts', async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;
    const cohorts = RiskStratificationService.getCohorts(activeOnly !== 'false');
    res.json({
      success: true,
      data: cohorts,
      count: cohorts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cohorts'
    });
  }
});

/**
 * @route   GET /api/population-health/risk-stratification/statistics
 * @desc    Get risk stratification statistics
 * @access  Private
 */
router.get('/risk-stratification/statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const statistics = RiskStratificationService.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    });
  }
});

// ============================================================================
// Care Coordination Routes
// ============================================================================

/**
 * @route   POST /api/population-health/care-plans
 * @desc    Create care plan
 * @access  Private
 */
router.post('/care-plans', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const carePlan = await CareCoordinationService.createCarePlan(companyId, req.body);
    res.status(201).json({
      success: true,
      data: carePlan,
      message: 'Care plan created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create care plan'
    });
  }
});

/**
 * @route   GET /api/population-health/care-plans/:id
 * @desc    Get care plan by ID
 * @access  Private
 */
router.get('/care-plans/:id', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const carePlan = await CareCoordinationService.getCarePlanById(companyId, req.params.id);
    if (!carePlan) {
      return res.status(404).json({
        success: false,
        error: 'Care plan not found'
      });
    }
    res.json({
      success: true,
      data: carePlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get care plan'
    });
  }
});

/**
 * @route   GET /api/population-health/care-plans/patient/:patientId
 * @desc    Get care plans by patient
 * @access  Private
 */
router.get('/care-plans/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const carePlans = await CareCoordinationService.getCarePlansByPatient(companyId, req.params.patientId);
    res.json({
      success: true,
      data: carePlans,
      count: carePlans.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get care plans'
    });
  }
});

/**
 * @route   POST /api/population-health/care-plans/:id/goals
 * @desc    Add care goal
 * @access  Private
 */
router.post('/care-plans/:id/goals', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const carePlan = await CareCoordinationService.addCareGoal(companyId, req.params.id, req.body);
    res.status(201).json({
      success: true,
      data: carePlan,
      message: 'Care goal added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add care goal'
    });
  }
});

/**
 * @route   PUT /api/population-health/care-plans/:planId/goals/:goalId
 * @desc    Update care goal
 * @access  Private
 */
router.put('/care-plans/:planId/goals/:goalId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const carePlan = await CareCoordinationService.updateCareGoal(companyId,
      req.params.planId,
      req.params.goalId,
      req.body
    );
    res.json({
      success: true,
      data: carePlan,
      message: 'Care goal updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update care goal'
    });
  }
});

/**
 * @route   POST /api/population-health/care-plans/:id/interventions
 * @desc    Add care intervention
 * @access  Private
 */
router.post('/care-plans/:id/interventions', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const carePlan = await CareCoordinationService.addCareIntervention(companyId, req.params.id, req.body);
    res.status(201).json({
      success: true,
      data: carePlan,
      message: 'Care intervention added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add care intervention'
    });
  }
});

/**
 * @route   PUT /api/population-health/care-plans/:id/activate
 * @desc    Activate care plan
 * @access  Private
 */
router.put('/care-plans/:id/activate', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const carePlan = await CareCoordinationService.activateCarePlan(companyId, req.params.id);
    res.json({
      success: true,
      data: carePlan,
      message: 'Care plan activated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate care plan'
    });
  }
});

/**
 * @route   PUT /api/population-health/care-plans/:id/status
 * @desc    Update care plan status
 * @access  Private
 */
router.put('/care-plans/:id/status', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { status } = req.body;
    const carePlan = await CareCoordinationService.updateCarePlanStatus(companyId, req.params.id, status);
    res.json({
      success: true,
      data: carePlan,
      message: 'Care plan status updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update care plan status'
    });
  }
});

/**
 * @route   GET /api/population-health/care-plans/due-for-review
 * @desc    Get care plans due for review
 * @access  Private
 */
router.get('/care-plans/due-for-review', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { daysAhead } = req.query;
    const carePlans = await CareCoordinationService.getCarePlansDueForReview(
      companyId,
      daysAhead ? parseInt(daysAhead as string) : 7
    );
    res.json({
      success: true,
      data: carePlans,
      count: carePlans.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get care plans'
    });
  }
});

/**
 * @route   POST /api/population-health/care-teams
 * @desc    Create care team
 * @access  Private
 */
router.post('/care-teams', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const careTeam = await CareCoordinationService.createCareTeam(companyId, req.body);
    res.status(201).json({
      success: true,
      data: careTeam,
      message: 'Care team created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create care team'
    });
  }
});

/**
 * @route   POST /api/population-health/care-teams/:id/members
 * @desc    Add care team member
 * @access  Private
 */
router.post('/care-teams/:id/members', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const careTeam = await CareCoordinationService.addCareTeamMember(companyId, req.params.id, req.body);
    res.status(201).json({
      success: true,
      data: careTeam,
      message: 'Care team member added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add care team member'
    });
  }
});

/**
 * @route   DELETE /api/population-health/care-teams/:teamId/members/:memberId
 * @desc    Remove care team member
 * @access  Private
 */
router.delete('/care-teams/:teamId/members/:memberId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const careTeam = await CareCoordinationService.removeCareTeamMember(
      companyId,
      req.params.teamId,
      req.params.memberId
    );
    res.json({
      success: true,
      data: careTeam,
      message: 'Care team member removed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove care team member'
    });
  }
});

/**
 * @route   GET /api/population-health/care-teams/patient/:patientId
 * @desc    Get care teams by patient
 * @access  Private
 */
router.get('/care-teams/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const careTeams = await CareCoordinationService.getCareTeamsByPatient(companyId, req.params.patientId);
    res.json({
      success: true,
      data: careTeams,
      count: careTeams.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get care teams'
    });
  }
});

/**
 * @route   POST /api/population-health/care-gaps
 * @desc    Identify care gap
 * @access  Private
 */
router.post('/care-gaps', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const careGap = await CareCoordinationService.identifyCareGap(companyId, req.body);
    res.status(201).json({
      success: true,
      data: careGap,
      message: 'Care gap identified successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to identify care gap'
    });
  }
});

/**
 * @route   PUT /api/population-health/care-gaps/:id
 * @desc    Update care gap
 * @access  Private
 */
router.put('/care-gaps/:id', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const careGap = await CareCoordinationService.updateCareGap(companyId, req.params.id, req.body);
    res.json({
      success: true,
      data: careGap,
      message: 'Care gap updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update care gap'
    });
  }
});

/**
 * @route   GET /api/population-health/care-gaps/patient/:patientId
 * @desc    Get care gaps by patient
 * @access  Private
 */
router.get('/care-gaps/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const careGaps = await CareCoordinationService.getCareGapsByPatient(companyId, req.params.patientId);
    res.json({
      success: true,
      data: careGaps,
      count: careGaps.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get care gaps'
    });
  }
});

/**
 * @route   GET /api/population-health/care-gaps/open
 * @desc    Get open care gaps
 * @access  Private
 */
router.get('/care-gaps/open', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { category } = req.query;
    const careGaps = await CareCoordinationService.getOpenCareGaps(companyId, category as any);
    res.json({
      success: true,
      data: careGaps,
      count: careGaps.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get care gaps'
    });
  }
});

/**
 * @route   GET /api/population-health/care-gaps/overdue
 * @desc    Get overdue care gaps
 * @access  Private
 */
router.get('/care-gaps/overdue', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const careGaps = await CareCoordinationService.getOverdueCareGaps(companyId);
    res.json({
      success: true,
      data: careGaps,
      count: careGaps.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get care gaps'
    });
  }
});

/**
 * @route   POST /api/population-health/transitions
 * @desc    Create transition of care
 * @access  Private
 */
router.post('/transitions', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const transition = await CareCoordinationService.createTransitionOfCare(companyId, req.body);
    res.status(201).json({
      success: true,
      data: transition,
      message: 'Transition of care created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transition'
    });
  }
});

/**
 * @route   POST /api/population-health/transitions/:id/medications
 * @desc    Add medication reconciliation
 * @access  Private
 */
router.post('/transitions/:id/medications', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const transition = await CareCoordinationService.addMedicationReconciliation(
      companyId,
      req.params.id,
      req.body
    );
    res.json({
      success: true,
      data: transition,
      message: 'Medication reconciliation added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add medication reconciliation'
    });
  }
});

/**
 * @route   PUT /api/population-health/transitions/:id/status
 * @desc    Update transition status
 * @access  Private
 */
router.put('/transitions/:id/status', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { status } = req.body;
    const transition = await CareCoordinationService.updateTransitionStatus(companyId, req.params.id, status);
    res.json({
      success: true,
      data: transition,
      message: 'Transition status updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update transition status'
    });
  }
});

/**
 * @route   PUT /api/population-health/transitions/:id/complete-followup
 * @desc    Complete transition follow-up
 * @access  Private
 */
router.put('/transitions/:id/complete-followup', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const transition = await CareCoordinationService.completeFollowUp(companyId, req.params.id);
    res.json({
      success: true,
      data: transition,
      message: 'Follow-up completed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete follow-up'
    });
  }
});

/**
 * @route   GET /api/population-health/transitions/patient/:patientId
 * @desc    Get transitions by patient
 * @access  Private
 */
router.get('/transitions/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const transitions = await CareCoordinationService.getTransitionsByPatient(companyId, req.params.patientId);
    res.json({
      success: true,
      data: transitions,
      count: transitions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transitions'
    });
  }
});

/**
 * @route   GET /api/population-health/transitions/pending-followups
 * @desc    Get pending follow-ups
 * @access  Private
 */
router.get('/transitions/pending-followups', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const transitions = await CareCoordinationService.getPendingFollowUps(companyId);
    res.json({
      success: true,
      data: transitions,
      count: transitions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pending follow-ups'
    });
  }
});

/**
 * @route   POST /api/population-health/tasks
 * @desc    Create care coordination task
 * @access  Private
 */
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const task = await CareCoordinationService.createCareCoordinationTask(companyId, req.body);
    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    });
  }
});

/**
 * @route   PUT /api/population-health/tasks/:id/status
 * @desc    Update task status
 * @access  Private
 */
router.put('/tasks/:id/status', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { status, completedBy, notes } = req.body;
    const task = await CareCoordinationService.updateTaskStatus(companyId, req.params.id, status, completedBy, notes);
    res.json({
      success: true,
      data: task,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task status'
    });
  }
});

/**
 * @route   PUT /api/population-health/tasks/:id/assign
 * @desc    Assign task
 * @access  Private
 */
router.put('/tasks/:id/assign', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { assignedTo } = req.body;
    const task = await CareCoordinationService.assignTask(companyId, req.params.id, assignedTo);
    res.json({
      success: true,
      data: task,
      message: 'Task assigned successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign task'
    });
  }
});

/**
 * @route   GET /api/population-health/tasks/patient/:patientId
 * @desc    Get tasks by patient
 * @access  Private
 */
router.get('/tasks/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const tasks = await CareCoordinationService.getTasksByPatient(companyId, req.params.patientId);
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tasks'
    });
  }
});

/**
 * @route   GET /api/population-health/tasks/assignee/:userId
 * @desc    Get tasks by assignee
 * @access  Private
 */
router.get('/tasks/assignee/:userId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const tasks = await CareCoordinationService.getTasksByAssignee(companyId, req.params.userId);
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tasks'
    });
  }
});

/**
 * @route   GET /api/population-health/tasks/overdue
 * @desc    Get overdue tasks
 * @access  Private
 */
router.get('/tasks/overdue', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const tasks = await CareCoordinationService.getOverdueTasks(companyId);
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tasks'
    });
  }
});

/**
 * @route   POST /api/population-health/outreach
 * @desc    Create patient outreach
 * @access  Private
 */
router.post('/outreach', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const outreach = await CareCoordinationService.createPatientOutreach(companyId, req.body);
    res.status(201).json({
      success: true,
      data: outreach,
      message: 'Outreach created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create outreach'
    });
  }
});

/**
 * @route   POST /api/population-health/outreach/:id/attempt
 * @desc    Record outreach attempt
 * @access  Private
 */
router.post('/outreach/:id/attempt', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const outreach = await CareCoordinationService.recordOutreachAttempt(companyId, req.params.id, req.body);
    res.json({
      success: true,
      data: outreach,
      message: 'Outreach attempt recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record outreach attempt'
    });
  }
});

/**
 * @route   GET /api/population-health/outreach/patient/:patientId
 * @desc    Get outreach by patient
 * @access  Private
 */
router.get('/outreach/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const outreach = await CareCoordinationService.getOutreachByPatient(companyId, req.params.patientId);
    res.json({
      success: true,
      data: outreach,
      count: outreach.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get outreach'
    });
  }
});

/**
 * @route   GET /api/population-health/care-coordination/statistics
 * @desc    Get care coordination statistics
 * @access  Private
 */
router.get('/care-coordination/statistics', async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { startDate, endDate } = req.query;
    const statistics = await CareCoordinationService.getStatistics(
      companyId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    });
  }
});

// ============================================================================
// Chronic Disease Management Routes
// ============================================================================

/**
 * @route   POST /api/population-health/disease-registries
 * @desc    Create disease registry
 * @access  Private
 */
router.post('/disease-registries', async (req: Request, res: Response) => {
  try {
    const registry = ChronicDiseaseManagementService.createDiseaseRegistry(req.body);
    res.status(201).json({
      success: true,
      data: registry,
      message: 'Disease registry created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create registry'
    });
  }
});

/**
 * @route   GET /api/population-health/disease-registries
 * @desc    Get all disease registries
 * @access  Private
 */
router.get('/disease-registries', async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;
    const registries = ChronicDiseaseManagementService.getDiseaseRegistries(activeOnly !== 'false');
    res.json({
      success: true,
      data: registries,
      count: registries.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get registries'
    });
  }
});

/**
 * @route   POST /api/population-health/disease-registries/:id/enroll
 * @desc    Enroll patient in registry
 * @access  Private
 */
router.post('/disease-registries/:id/enroll', async (req: Request, res: Response) => {
  try {
    const enrollment = ChronicDiseaseManagementService.enrollInRegistry({
      registryId: req.params.id,
      ...req.body
    });
    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Patient enrolled successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enroll patient'
    });
  }
});

/**
 * @route   GET /api/population-health/disease-registries/:id/patients
 * @desc    Get patients in registry
 * @access  Private
 */
router.get('/disease-registries/:id/patients', async (req: Request, res: Response) => {
  try {
    const enrollments = ChronicDiseaseManagementService.getRegistryPatients(req.params.id);
    res.json({
      success: true,
      data: enrollments,
      count: enrollments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get patients'
    });
  }
});

/**
 * @route   POST /api/population-health/disease-programs
 * @desc    Create disease management program
 * @access  Private
 */
router.post('/disease-programs', async (req: Request, res: Response) => {
  try {
    const program = ChronicDiseaseManagementService.createDiseaseManagementProgram(req.body);
    res.status(201).json({
      success: true,
      data: program,
      message: 'Disease management program created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create program'
    });
  }
});

/**
 * @route   GET /api/population-health/disease-programs
 * @desc    Get all disease management programs
 * @access  Private
 */
router.get('/disease-programs', async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;
    const programs = ChronicDiseaseManagementService.getDiseaseManagementPrograms(activeOnly !== 'false');
    res.json({
      success: true,
      data: programs,
      count: programs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get programs'
    });
  }
});

/**
 * @route   POST /api/population-health/disease-programs/:id/enroll
 * @desc    Enroll patient in program
 * @access  Private
 */
router.post('/disease-programs/:id/enroll', async (req: Request, res: Response) => {
  try {
    const enrollment = ChronicDiseaseManagementService.enrollInProgram({
      programId: req.params.id,
      ...req.body
    });
    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Patient enrolled successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enroll patient'
    });
  }
});

/**
 * @route   POST /api/population-health/program-enrollments/:id/interventions
 * @desc    Record intervention completion
 * @access  Private
 */
router.post('/program-enrollments/:id/interventions', async (req: Request, res: Response) => {
  try {
    const { interventionId, outcome } = req.body;
    const enrollment = ChronicDiseaseManagementService.recordInterventionCompletion(
      req.params.id,
      interventionId,
      outcome
    );
    res.json({
      success: true,
      data: enrollment,
      message: 'Intervention completion recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record intervention completion'
    });
  }
});

/**
 * @route   PUT /api/population-health/program-enrollments/:id
 * @desc    Update program enrollment
 * @access  Private
 */
router.put('/program-enrollments/:id', async (req: Request, res: Response) => {
  try {
    const enrollment = ChronicDiseaseManagementService.updateProgramEnrollment(
      req.params.id,
      req.body
    );
    res.json({
      success: true,
      data: enrollment,
      message: 'Program enrollment updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update enrollment'
    });
  }
});

/**
 * @route   POST /api/population-health/clinical-metrics
 * @desc    Record clinical metric
 * @access  Private
 */
router.post('/clinical-metrics', async (req: Request, res: Response) => {
  try {
    const metric = ChronicDiseaseManagementService.recordClinicalMetric(req.body);
    res.status(201).json({
      success: true,
      data: metric,
      message: 'Clinical metric recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record metric'
    });
  }
});

/**
 * @route   GET /api/population-health/clinical-metrics/patient/:patientId
 * @desc    Get clinical metrics by patient
 * @access  Private
 */
router.get('/clinical-metrics/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { metricType } = req.query;
    const metrics = ChronicDiseaseManagementService.getClinicalMetricsByPatient(
      req.params.patientId,
      metricType as string | undefined
    );
    res.json({
      success: true,
      data: metrics,
      count: metrics.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics'
    });
  }
});

/**
 * @route   POST /api/population-health/patient-engagement
 * @desc    Record patient engagement
 * @access  Private
 */
router.post('/patient-engagement', async (req: Request, res: Response) => {
  try {
    const engagement = ChronicDiseaseManagementService.recordPatientEngagement(req.body);
    res.status(201).json({
      success: true,
      data: engagement,
      message: 'Patient engagement recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record engagement'
    });
  }
});

/**
 * @route   GET /api/population-health/patient-engagement/patient/:patientId
 * @desc    Get patient engagement
 * @access  Private
 */
router.get('/patient-engagement/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const engagement = ChronicDiseaseManagementService.getPatientEngagement(
      req.params.patientId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({
      success: true,
      data: engagement,
      count: engagement.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get engagement'
    });
  }
});

/**
 * @route   GET /api/population-health/patient-engagement/patient/:patientId/score
 * @desc    Calculate engagement score
 * @access  Private
 */
router.get('/patient-engagement/patient/:patientId/score', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const score = ChronicDiseaseManagementService.calculateEngagementScore(
      req.params.patientId,
      days ? parseInt(days as string) : 30
    );
    res.json({
      success: true,
      data: { score }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate engagement score'
    });
  }
});

/**
 * @route   POST /api/population-health/outcome-tracking
 * @desc    Initialize outcome tracking
 * @access  Private
 */
router.post('/outcome-tracking', async (req: Request, res: Response) => {
  try {
    const outcome = ChronicDiseaseManagementService.initializeOutcomeTracking(req.body);
    res.status(201).json({
      success: true,
      data: outcome,
      message: 'Outcome tracking initialized successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize outcome tracking'
    });
  }
});

/**
 * @route   GET /api/population-health/outcome-tracking/patient/:patientId
 * @desc    Get outcomes by patient
 * @access  Private
 */
router.get('/outcome-tracking/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const outcomes = ChronicDiseaseManagementService.getOutcomesByPatient(req.params.patientId);
    res.json({
      success: true,
      data: outcomes,
      count: outcomes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get outcomes'
    });
  }
});

/**
 * @route   POST /api/population-health/preventive-care
 * @desc    Create preventive care recommendation
 * @access  Private
 */
router.post('/preventive-care', async (req: Request, res: Response) => {
  try {
    const recommendation = ChronicDiseaseManagementService.createPreventiveCareRecommendation(req.body);
    res.status(201).json({
      success: true,
      data: recommendation,
      message: 'Preventive care recommendation created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create recommendation'
    });
  }
});

/**
 * @route   PUT /api/population-health/preventive-care/:id/complete
 * @desc    Complete preventive care
 * @access  Private
 */
router.put('/preventive-care/:id/complete', async (req: Request, res: Response) => {
  try {
    const { completedDate, nextDueDate } = req.body;
    const recommendation = ChronicDiseaseManagementService.completePreventiveCare(
      req.params.id,
      new Date(completedDate),
      nextDueDate ? new Date(nextDueDate) : undefined
    );
    res.json({
      success: true,
      data: recommendation,
      message: 'Preventive care completed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete preventive care'
    });
  }
});

/**
 * @route   GET /api/population-health/preventive-care/patient/:patientId
 * @desc    Get preventive care by patient
 * @access  Private
 */
router.get('/preventive-care/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const recommendations = ChronicDiseaseManagementService.getPreventiveCareByPatient(
      req.params.patientId,
      status as any
    );
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get preventive care'
    });
  }
});

/**
 * @route   GET /api/population-health/preventive-care/due
 * @desc    Get due preventive care
 * @access  Private
 */
router.get('/preventive-care/due', async (req: Request, res: Response) => {
  try {
    const { daysAhead } = req.query;
    const recommendations = ChronicDiseaseManagementService.getDuePreventiveCare(
      daysAhead ? parseInt(daysAhead as string) : 30
    );
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get preventive care'
    });
  }
});

/**
 * @route   GET /api/population-health/disease-management/statistics
 * @desc    Get disease management statistics
 * @access  Private
 */
router.get('/disease-management/statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const statistics = ChronicDiseaseManagementService.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    });
  }
});

export default router;
