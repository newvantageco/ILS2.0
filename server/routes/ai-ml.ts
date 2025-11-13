/**
 * AI & Machine Learning API Routes
 *
 * Routes for clinical decision support, predictive analytics, and intelligent automation
 */

import express from 'express';
import { loggers } from '../utils/logger';
import { ClinicalDecisionSupportService } from '../services/ai-ml/ClinicalDecisionSupportService';
import { PredictiveAnalyticsService } from '../services/ai-ml/PredictiveAnalyticsService';
import { NLPImageAnalysisService } from '../services/ai-ml/NLPImageAnalysisService';

const router = express.Router();
const logger = loggers.api;

// ========== Clinical Decision Support ==========

router.get('/drugs', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }
    const drugs = await ClinicalDecisionSupportService.searchDrugs(query as string, companyId);
    res.json({ success: true, drugs });
  } catch (error) {
    logger.error({ error }, 'Search drugs error');
    res.status(500).json({ success: false, error: 'Failed to search drugs' });
  }
});

router.get('/drugs/:drugId', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const drug = await ClinicalDecisionSupportService.getDrug(req.params.drugId, companyId);
    if (!drug) {
      return res.status(404).json({ success: false, error: 'Drug not found' });
    }
    res.json({ success: true, drug });
  } catch (error) {
    logger.error({ error }, 'Get drug error');
    res.status(500).json({ success: false, error: 'Failed to get drug' });
  }
});

router.post('/drugs/interactions', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { drugIds } = req.body;
    if (!Array.isArray(drugIds)) {
      return res.status(400).json({ success: false, error: 'drugIds must be an array' });
    }
    const interactions = await ClinicalDecisionSupportService.checkDrugInteractions(companyId, drugIds);
    res.json({ success: true, interactions });
  } catch (error) {
    logger.error({ error }, 'Check drug interactions error');
    res.status(500).json({ success: false, error: 'Failed to check drug interactions' });
  }
});

router.post('/drugs/allergies', async (req, res) => {
  try {
    const { patientAllergies, drugId } = req.body;
    if (!Array.isArray(patientAllergies) || !drugId) {
      return res.status(400).json({ success: false, error: 'Invalid request parameters' });
    }
    const alerts = ClinicalDecisionSupportService.checkAllergies(patientAllergies, drugId);
    res.json({ success: true, alerts });
  } catch (error) {
    logger.error({ error }, 'Check allergies error');
    res.status(500).json({ success: false, error: 'Failed to check allergies' });
  }
});

router.get('/guidelines', async (req, res) => {
  try {
    const { condition } = req.query;
    if (!condition) {
      return res.status(400).json({ success: false, error: 'Condition parameter required' });
    }
    const guidelines = ClinicalDecisionSupportService.searchGuidelines(condition as string);
    res.json({ success: true, guidelines });
  } catch (error) {
    logger.error({ error }, 'Search guidelines error');
    res.status(500).json({ success: false, error: 'Failed to search guidelines' });
  }
});

router.get('/guidelines/:guidelineId', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const guideline = await ClinicalDecisionSupportService.getGuideline(req.params.guidelineId, companyId);
    if (!guideline) {
      return res.status(404).json({ success: false, error: 'Guideline not found' });
    }
    res.json({ success: true, guideline });
  } catch (error) {
    logger.error({ error }, 'Get guideline error');
    res.status(500).json({ success: false, error: 'Failed to get guideline' });
  }
});

router.post('/guidelines/:guidelineId/recommendations', async (req, res) => {
  try {
    const { patientCriteria } = req.body;
    if (!Array.isArray(patientCriteria)) {
      return res.status(400).json({ success: false, error: 'patientCriteria must be an array' });
    }
    const recommendations = ClinicalDecisionSupportService.getApplicableRecommendations(
      req.params.guidelineId,
      patientCriteria
    );
    res.json({ success: true, recommendations });
  } catch (error) {
    logger.error({ error }, 'Get recommendations error');
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

router.post('/treatment-recommendations', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { patientId, condition, diagnosis, patientCriteria } = req.body;
    const recommendations = await ClinicalDecisionSupportService.generateTreatmentRecommendations(
      companyId,
      patientId,
      condition,
      diagnosis,
      patientCriteria || []
    );
    res.status(201).json({ success: true, recommendations });
  } catch (error) {
    logger.error({ error }, 'Generate treatment recommendations error');
    res.status(500).json({ success: false, error: 'Failed to generate treatment recommendations' });
  }
});

router.post('/diagnostic-suggestions', async (req, res) => {
  try {
    const { patientId, symptoms, labResults, vitalSigns } = req.body;
    const suggestions = ClinicalDecisionSupportService.generateDiagnosticSuggestions(
      patientId,
      symptoms || [],
      labResults,
      vitalSigns
    );
    res.status(201).json({ success: true, suggestions });
  } catch (error) {
    logger.error({ error }, 'Generate diagnostic suggestions error');
    res.status(500).json({ success: false, error: 'Failed to generate diagnostic suggestions' });
  }
});

router.post('/lab-interpretation', async (req, res) => {
  try {
    const { testName, value, unit } = req.body;
    if (!testName || value === undefined || !unit) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }
    const interpretation = ClinicalDecisionSupportService.interpretLabResult(testName, value, unit);
    res.json({ success: true, interpretation });
  } catch (error) {
    logger.error({ error }, 'Interpret lab result error');
    res.status(500).json({ success: false, error: 'Failed to interpret lab result' });
  }
});

router.get('/clinical-alerts', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { patientId, type, severity } = req.query;
    const alerts = await ClinicalDecisionSupportService.getAlerts(
      companyId,
      patientId as string,
      type as any,
      severity as any
    );
    res.json({ success: true, alerts });
  } catch (error) {
    logger.error({ error }, 'Get clinical alerts error');
    res.status(500).json({ success: false, error: 'Failed to get clinical alerts' });
  }
});

router.post('/clinical-alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { userId } = req.body;
    const alert = await ClinicalDecisionSupportService.acknowledgeAlert(req.params.alertId, companyId, userId);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, alert });
  } catch (error) {
    logger.error({ error }, 'Acknowledge clinical alert error');
    res.status(500).json({ success: false, error: 'Failed to acknowledge clinical alert' });
  }
});

router.get('/cds/statistics', async (req, res) => {
  try {
    const stats = ClinicalDecisionSupportService.getStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    logger.error({ error }, 'Get CDS statistics error');
    res.status(500).json({ success: false, error: 'Failed to get CDS statistics' });
  }
});

// ========== Predictive Analytics ==========

router.get('/models', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { status } = req.query;
    const models = await PredictiveAnalyticsService.listModels(companyId, status as any);
    res.json({ success: true, models });
  } catch (error) {
    logger.error({ error }, 'List models error');
    res.status(500).json({ success: false, error: 'Failed to list models' });
  }
});

router.get('/models/:modelId', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const model = await PredictiveAnalyticsService.getModel(companyId, req.params.modelId);
    if (!model) {
      return res.status(404).json({ success: false, error: 'Model not found' });
    }
    res.json({ success: true, model });
  } catch (error) {
    logger.error({ error }, 'Get model error');
    res.status(500).json({ success: false, error: 'Failed to get model' });
  }
});

router.post('/risk-stratification', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { patientId, riskType, patientData } = req.body;
    const stratification = await PredictiveAnalyticsService.calculateRiskStratification(
      companyId,
      patientId,
      riskType,
      patientData || {}
    );
    res.status(201).json({ success: true, stratification });
  } catch (error) {
    logger.error({ error }, 'Calculate risk stratification error');
    res.status(500).json({ success: false, error: 'Failed to calculate risk stratification' });
  }
});

router.get('/risk-stratification/:patientId', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { riskType } = req.query;
    const stratifications = await PredictiveAnalyticsService.getRiskStratification(
      companyId,
      req.params.patientId,
      riskType as any
    );
    res.json({ success: true, stratifications });
  } catch (error) {
    logger.error({ error }, 'Get risk stratification error');
    res.status(500).json({ success: false, error: 'Failed to get risk stratification' });
  }
});

router.post('/predict/readmission', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { patientId, admissionId, timeframe, patientData } = req.body;
    const prediction = await PredictiveAnalyticsService.predictReadmission(
      companyId,
      patientId,
      admissionId,
      timeframe,
      patientData || {}
    );
    res.status(201).json({ success: true, prediction });
  } catch (error) {
    logger.error({ error }, 'Predict readmission error');
    res.status(500).json({ success: false, error: 'Failed to predict readmission' });
  }
});

router.post('/predict/no-show', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { patientId, appointmentId, appointmentData } = req.body;
    const prediction = await PredictiveAnalyticsService.predictNoShow(
      companyId,
      patientId,
      appointmentId,
      appointmentData || {}
    );
    res.status(201).json({ success: true, prediction });
  } catch (error) {
    logger.error({ error }, 'Predict no-show error');
    res.status(500).json({ success: false, error: 'Failed to predict no-show' });
  }
});

router.post('/predict/disease-progression', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { patientId, disease, currentStage, patientData } = req.body;
    const prediction = await PredictiveAnalyticsService.predictDiseaseProgression(
      companyId,
      patientId,
      disease,
      currentStage,
      patientData || {}
    );
    res.status(201).json({ success: true, prediction });
  } catch (error) {
    logger.error({ error }, 'Predict disease progression error');
    res.status(500).json({ success: false, error: 'Failed to predict disease progression' });
  }
});

router.post('/predict/treatment-outcome', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { patientId, treatment, condition, patientData } = req.body;
    const prediction = await PredictiveAnalyticsService.predictTreatmentOutcome(
      companyId,
      patientId,
      treatment,
      condition,
      patientData || {}
    );
    res.status(201).json({ success: true, prediction });
  } catch (error) {
    logger.error({ error }, 'Predict treatment outcome error');
    res.status(500).json({ success: false, error: 'Failed to predict treatment outcome' });
  }
});

router.post('/population-health', async (req, res) => {
  try {
    const { cohort, patientData } = req.body;
    if (!Array.isArray(patientData)) {
      return res.status(400).json({ success: false, error: 'patientData must be an array' });
    }
    const metrics = PredictiveAnalyticsService.calculatePopulationHealthMetrics(
      cohort,
      patientData
    );
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error({ error }, 'Calculate population health metrics error');
    res.status(500).json({ success: false, error: 'Failed to calculate population health metrics' });
  }
});

router.get('/analytics/statistics', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const stats = await PredictiveAnalyticsService.getStatistics(companyId);
    res.json({ success: true, statistics: stats });
  } catch (error) {
    logger.error({ error }, 'Get analytics statistics error');
    res.status(500).json({ success: false, error: 'Failed to get analytics statistics' });
  }
});

// ========== NLP & Image Analysis ==========

router.post('/nlp/extract-entities', async (req, res) => {
  try {
    const { noteId, noteText } = req.body;
    if (!noteId || !noteText) {
      return res.status(400).json({ success: false, error: 'noteId and noteText required' });
    }
    const extraction = NLPImageAnalysisService.extractEntitiesFromNote(noteId, noteText);
    res.status(201).json({ success: true, extraction });
  } catch (error) {
    logger.error({ error }, 'Extract entities error');
    res.status(500).json({ success: false, error: 'Failed to extract entities' });
  }
});

router.post('/nlp/medical-coding', async (req, res) => {
  try {
    const { noteText } = req.body;
    if (!noteText) {
      return res.status(400).json({ success: false, error: 'noteText required' });
    }
    const suggestion = NLPImageAnalysisService.suggestMedicalCodes(noteText);
    res.status(201).json({ success: true, suggestion });
  } catch (error) {
    logger.error({ error }, 'Suggest medical codes error');
    res.status(500).json({ success: false, error: 'Failed to suggest medical codes' });
  }
});

router.post('/nlp/classify-document', async (req, res) => {
  try {
    const { documentId, documentText } = req.body;
    if (!documentId || !documentText) {
      return res.status(400).json({ success: false, error: 'documentId and documentText required' });
    }
    const classification = NLPImageAnalysisService.classifyDocument(documentId, documentText);
    res.status(201).json({ success: true, classification });
  } catch (error) {
    logger.error({ error }, 'Classify document error');
    res.status(500).json({ success: false, error: 'Failed to classify document' });
  }
});

router.post('/nlp/summarize', async (req, res) => {
  try {
    const { text, maxSentences } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'text required' });
    }
    const summarization = NLPImageAnalysisService.summarizeText(text, maxSentences);
    res.json({ success: true, summarization });
  } catch (error) {
    logger.error({ error }, 'Summarize text error');
    res.status(500).json({ success: false, error: 'Failed to summarize text' });
  }
});

router.post('/imaging/analyze', async (req, res) => {
  try {
    const { imageId, imageType, imageData } = req.body;
    if (!imageId || !imageType) {
      return res.status(400).json({ success: false, error: 'imageId and imageType required' });
    }
    const analysis = NLPImageAnalysisService.analyzeImage(imageId, imageType, imageData);
    res.status(201).json({ success: true, analysis });
  } catch (error) {
    logger.error({ error }, 'Analyze image error');
    res.status(500).json({ success: false, error: 'Failed to analyze image' });
  }
});

router.get('/imaging/:imageId', async (req, res) => {
  try {
    const analysis = NLPImageAnalysisService.getImageAnalysis(req.params.imageId);
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Image analysis not found' });
    }
    res.json({ success: true, analysis });
  } catch (error) {
    logger.error({ error }, 'Get image analysis error');
    res.status(500).json({ success: false, error: 'Failed to get image analysis' });
  }
});

router.post('/ocr', async (req, res) => {
  try {
    const { documentId, imageData } = req.body;
    if (!documentId) {
      return res.status(400).json({ success: false, error: 'documentId required' });
    }
    const result = NLPImageAnalysisService.performOCR(documentId, imageData);
    res.status(201).json({ success: true, result });
  } catch (error) {
    logger.error({ error }, 'Perform OCR error');
    res.status(500).json({ success: false, error: 'Failed to perform OCR' });
  }
});

router.get('/nlp/statistics', async (req, res) => {
  try {
    const stats = NLPImageAnalysisService.getStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    logger.error({ error }, 'Get NLP statistics error');
    res.status(500).json({ success: false, error: 'Failed to get NLP statistics' });
  }
});

export default router;
