import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

// ============================================================================
// Risk Stratification Types
// ============================================================================

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type RiskCategory =
  | 'clinical'
  | 'financial'
  | 'utilization'
  | 'social'
  | 'behavioral'
  | 'functional';

export interface RiskScore {
  id: string;
  patientId: string;
  scoreType: string;
  score: number;
  riskLevel: RiskLevel;
  category: RiskCategory;
  factors: RiskFactor[];
  calculatedDate: Date;
  validUntil: Date;
  calculatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskFactor {
  factor: string;
  category: string;
  weight: number;
  value: any;
  impact: number;
  description: string;
}

export interface HealthRiskAssessment {
  id: string;
  patientId: string;
  assessmentType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  responses: AssessmentResponse[];
  totalScore: number;
  riskLevel: RiskLevel;
  recommendations: string[];
  completedDate?: Date;
  expirationDate: Date;
  administeredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentResponse {
  questionId: string;
  question: string;
  response: any;
  score: number;
  category: string;
}

export interface PredictiveModel {
  id: string;
  name: string;
  version: string;
  modelType: string;
  description: string;
  inputFeatures: string[];
  outputMetric: string;
  accuracy: number;
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface PredictiveAnalysis {
  id: string;
  patientId: string;
  modelId: string;
  modelName: string;
  predictedOutcome: string;
  probability: number;
  confidence: number;
  riskLevel: RiskLevel;
  contributingFactors: {
    factor: string;
    contribution: number;
  }[];
  recommendations: string[];
  analyzedDate: Date;
  createdAt: Date;
}

export interface SocialDeterminant {
  id: string;
  patientId: string;
  category:
    | 'economic_stability'
    | 'education'
    | 'social_community'
    | 'healthcare_access'
    | 'neighborhood_environment';
  factor: string;
  status: 'identified' | 'intervention_planned' | 'intervention_active' | 'resolved';
  severity: 'low' | 'moderate' | 'high';
  description: string;
  impact: string;
  interventions: string[];
  identifiedDate: Date;
  resolvedDate?: Date;
  identifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskStratificationCohort {
  id: string;
  name: string;
  description: string;
  criteria: CohortCriteria[];
  riskLevels: RiskLevel[];
  patientCount: number;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CohortCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
}

// ============================================================================
// Risk Stratification Service
// ============================================================================

export class RiskStratificationService {
  private static riskScores: Map<string, RiskScore> = new Map();
  private static healthRiskAssessments: Map<string, HealthRiskAssessment> = new Map();
  private static predictiveModels: Map<string, PredictiveModel> = new Map();
  private static predictiveAnalyses: Map<string, PredictiveAnalysis> = new Map();
  private static socialDeterminants: Map<string, SocialDeterminant> = new Map();
  private static cohorts: Map<string, RiskStratificationCohort> = new Map();

  // Initialize with default predictive models
  static {
    this.initializeDefaultModels();
  }

  // ============================================================================
  // Risk Score Management
  // ============================================================================

  static calculateRiskScore(data: {
    patientId: string;
    scoreType: string;
    category: RiskCategory;
    factors: RiskFactor[];
    calculatedBy: string;
  }): RiskScore {
    const id = uuidv4();

    // Calculate weighted score
    const totalWeight = data.factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedScore = data.factors.reduce((sum, f) => sum + f.impact * f.weight, 0);
    const normalizedScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;

    // Determine risk level based on score
    const riskLevel = this.determineRiskLevel(normalizedScore);

    const riskScore: RiskScore = {
      id,
      patientId: data.patientId,
      scoreType: data.scoreType,
      score: Math.round(normalizedScore * 100) / 100,
      riskLevel,
      category: data.category,
      factors: data.factors,
      calculatedDate: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      calculatedBy: data.calculatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.riskScores.set(id, riskScore);
    logger.info(`Risk score calculated for patient ${data.patientId}: ${normalizedScore} (${riskLevel})`);

    return riskScore;
  }

  static getRiskScoreById(id: string): RiskScore | undefined {
    return this.riskScores.get(id);
  }

  static getRiskScoresByPatient(patientId: string): RiskScore[] {
    return Array.from(this.riskScores.values()).filter(
      (score) => score.patientId === patientId
    );
  }

  static getLatestRiskScore(patientId: string, scoreType?: string): RiskScore | undefined {
    const scores = this.getRiskScoresByPatient(patientId)
      .filter((s) => !scoreType || s.scoreType === scoreType)
      .filter((s) => s.validUntil > new Date())
      .sort((a, b) => b.calculatedDate.getTime() - a.calculatedDate.getTime());

    return scores[0];
  }

  static getPatientsByRiskLevel(riskLevel: RiskLevel, category?: RiskCategory): string[] {
    const patientScores = new Map<string, RiskScore>();

    // Get latest score for each patient
    for (const score of this.riskScores.values()) {
      if (category && score.category !== category) continue;
      if (score.validUntil < new Date()) continue;

      const existing = patientScores.get(score.patientId);
      if (!existing || score.calculatedDate > existing.calculatedDate) {
        patientScores.set(score.patientId, score);
      }
    }

    // Filter by risk level
    return Array.from(patientScores.values())
      .filter((score) => score.riskLevel === riskLevel)
      .map((score) => score.patientId);
  }

  private static determineRiskLevel(score: number): RiskLevel {
    if (score >= 75) return 'very_high';
    if (score >= 50) return 'high';
    if (score >= 25) return 'moderate';
    return 'low';
  }

  // ============================================================================
  // Health Risk Assessment
  // ============================================================================

  static createHealthRiskAssessment(data: {
    patientId: string;
    assessmentType: string;
    expirationDate: Date;
  }): HealthRiskAssessment {
    const id = uuidv4();

    const assessment: HealthRiskAssessment = {
      id,
      patientId: data.patientId,
      assessmentType: data.assessmentType,
      status: 'pending',
      responses: [],
      totalScore: 0,
      riskLevel: 'low',
      recommendations: [],
      expirationDate: data.expirationDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.healthRiskAssessments.set(id, assessment);
    logger.info(`Health risk assessment created: ${id}`);

    return assessment;
  }

  static recordAssessmentResponse(
    assessmentId: string,
    response: AssessmentResponse
  ): HealthRiskAssessment {
    const assessment = this.healthRiskAssessments.get(assessmentId);
    if (!assessment) {
      throw new Error('Health risk assessment not found');
    }

    if (assessment.status === 'completed' || assessment.status === 'expired') {
      throw new Error(`Cannot update assessment with status: ${assessment.status}`);
    }

    // Add or update response
    const existingIndex = assessment.responses.findIndex((r) => r.questionId === response.questionId);
    if (existingIndex >= 0) {
      assessment.responses[existingIndex] = response;
    } else {
      assessment.responses.push(response);
    }

    assessment.status = 'in_progress';
    assessment.updatedAt = new Date();

    this.healthRiskAssessments.set(assessmentId, assessment);
    logger.info(`Assessment response recorded for ${assessmentId}`);

    return assessment;
  }

  static completeHealthRiskAssessment(
    assessmentId: string,
    administeredBy: string
  ): HealthRiskAssessment {
    const assessment = this.healthRiskAssessments.get(assessmentId);
    if (!assessment) {
      throw new Error('Health risk assessment not found');
    }

    // Calculate total score
    assessment.totalScore = assessment.responses.reduce((sum, r) => sum + r.score, 0);

    // Determine risk level
    assessment.riskLevel = this.determineRiskLevel(assessment.totalScore);

    // Generate recommendations based on responses
    assessment.recommendations = this.generateHRARecommendations(assessment);

    assessment.status = 'completed';
    assessment.completedDate = new Date();
    assessment.administeredBy = administeredBy;
    assessment.updatedAt = new Date();

    this.healthRiskAssessments.set(assessmentId, assessment);
    logger.info(`Health risk assessment completed: ${assessmentId}`);

    return assessment;
  }

  static getHealthRiskAssessmentById(id: string): HealthRiskAssessment | undefined {
    return this.healthRiskAssessments.get(id);
  }

  static getHealthRiskAssessmentsByPatient(patientId: string): HealthRiskAssessment[] {
    return Array.from(this.healthRiskAssessments.values()).filter(
      (assessment) => assessment.patientId === patientId
    );
  }

  private static generateHRARecommendations(assessment: HealthRiskAssessment): string[] {
    const recommendations: string[] = [];

    // Analyze responses by category
    const categoryScores = new Map<string, number>();
    for (const response of assessment.responses) {
      const current = categoryScores.get(response.category) || 0;
      categoryScores.set(response.category, current + response.score);
    }

    // Generate recommendations based on high-risk categories
    for (const [category, score] of categoryScores.entries()) {
      if (score >= 20) {
        recommendations.push(
          `High risk identified in ${category} - recommend targeted intervention`
        );
      }
    }

    if (assessment.totalScore >= 75) {
      recommendations.push('Very high overall risk - recommend immediate care management enrollment');
    } else if (assessment.totalScore >= 50) {
      recommendations.push('High risk - recommend care coordination and monitoring');
    }

    return recommendations;
  }

  // ============================================================================
  // Predictive Analytics
  // ============================================================================

  static createPredictiveModel(data: {
    name: string;
    version: string;
    modelType: string;
    description: string;
    inputFeatures: string[];
    outputMetric: string;
    accuracy: number;
    validFrom: Date;
    validUntil?: Date;
    createdBy: string;
  }): PredictiveModel {
    const id = uuidv4();

    const model: PredictiveModel = {
      id,
      name: data.name,
      version: data.version,
      modelType: data.modelType,
      description: data.description,
      inputFeatures: data.inputFeatures,
      outputMetric: data.outputMetric,
      accuracy: data.accuracy,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      isActive: true,
      createdBy: data.createdBy,
      createdAt: new Date(),
    };

    this.predictiveModels.set(id, model);
    logger.info(`Predictive model created: ${data.name} v${data.version}`);

    return model;
  }

  static runPredictiveAnalysis(data: {
    patientId: string;
    modelId: string;
    inputData: Record<string, any>;
  }): PredictiveAnalysis {
    const id = uuidv4();
    const model = this.predictiveModels.get(data.modelId);

    if (!model || !model.isActive) {
      throw new Error('Predictive model not found or inactive');
    }

    // Validate input features
    for (const feature of model.inputFeatures) {
      if (!(feature in data.inputData)) {
        throw new Error(`Missing required input feature: ${feature}`);
      }
    }

    // Run prediction (simplified simulation)
    const prediction = this.simulatePrediction(model, data.inputData);

    const analysis: PredictiveAnalysis = {
      id,
      patientId: data.patientId,
      modelId: data.modelId,
      modelName: model.name,
      predictedOutcome: prediction.outcome,
      probability: prediction.probability,
      confidence: prediction.confidence,
      riskLevel: this.determineRiskLevel(prediction.probability * 100),
      contributingFactors: prediction.contributingFactors,
      recommendations: prediction.recommendations,
      analyzedDate: new Date(),
      createdAt: new Date(),
    };

    this.predictiveAnalyses.set(id, analysis);
    logger.info(`Predictive analysis completed for patient ${data.patientId}`);

    return analysis;
  }

  static getPredictiveAnalysisById(id: string): PredictiveAnalysis | undefined {
    return this.predictiveAnalyses.get(id);
  }

  static getPredictiveAnalysesByPatient(patientId: string): PredictiveAnalysis[] {
    return Array.from(this.predictiveAnalyses.values()).filter(
      (analysis) => analysis.patientId === patientId
    );
  }

  static getPredictiveModels(activeOnly: boolean = true): PredictiveModel[] {
    const models = Array.from(this.predictiveModels.values());
    return activeOnly ? models.filter((m) => m.isActive) : models;
  }

  private static simulatePrediction(
    model: PredictiveModel,
    inputData: Record<string, any>
  ): {
    outcome: string;
    probability: number;
    confidence: number;
    contributingFactors: { factor: string; contribution: number }[];
    recommendations: string[];
  } {
    // Simplified prediction simulation based on model type
    let probability = 0;
    const contributingFactors: { factor: string; contribution: number }[] = [];

    // Calculate probability based on input features (simplified)
    for (const feature of model.inputFeatures) {
      const value = inputData[feature];
      let contribution = 0;

      if (typeof value === 'number') {
        contribution = Math.min(value / 100, 1);
      } else if (typeof value === 'boolean') {
        contribution = value ? 0.2 : 0;
      }

      contributingFactors.push({
        factor: feature,
        contribution: Math.round(contribution * 100),
      });

      probability += contribution;
    }

    probability = Math.min(probability / model.inputFeatures.length, 1);
    const confidence = model.accuracy;

    // Generate recommendations
    const recommendations: string[] = [];
    if (probability > 0.7) {
      recommendations.push('High risk - recommend proactive intervention');
      recommendations.push('Enroll in disease management program');
    } else if (probability > 0.4) {
      recommendations.push('Moderate risk - recommend monitoring and preventive measures');
    }

    return {
      outcome: model.outputMetric,
      probability,
      confidence,
      contributingFactors,
      recommendations,
    };
  }

  private static initializeDefaultModels(): void {
    // Readmission Risk Model
    this.createPredictiveModel({
      name: 'Hospital Readmission Risk',
      version: '1.0',
      modelType: 'classification',
      description: '30-day hospital readmission risk prediction',
      inputFeatures: [
        'age',
        'comorbidities_count',
        'previous_admissions',
        'length_of_stay',
        'discharge_disposition',
      ],
      outputMetric: '30_day_readmission',
      accuracy: 0.82,
      validFrom: new Date('2024-01-01'),
      createdBy: 'system',
    });

    // Diabetes Complication Risk
    this.createPredictiveModel({
      name: 'Diabetes Complication Risk',
      version: '1.0',
      modelType: 'classification',
      description: 'Risk of diabetes-related complications',
      inputFeatures: [
        'hba1c',
        'blood_pressure',
        'cholesterol',
        'bmi',
        'smoking_status',
        'disease_duration',
      ],
      outputMetric: 'diabetes_complication',
      accuracy: 0.78,
      validFrom: new Date('2024-01-01'),
      createdBy: 'system',
    });

    // High Utilizer Prediction
    this.createPredictiveModel({
      name: 'High Utilizer Prediction',
      version: '1.0',
      modelType: 'classification',
      description: 'Predicts patients likely to become high healthcare utilizers',
      inputFeatures: [
        'age',
        'chronic_conditions',
        'er_visits_last_year',
        'hospitalizations_last_year',
        'medication_adherence',
        'social_determinants_score',
      ],
      outputMetric: 'high_utilization',
      accuracy: 0.75,
      validFrom: new Date('2024-01-01'),
      createdBy: 'system',
    });

    // Medication Non-Adherence Risk
    this.createPredictiveModel({
      name: 'Medication Non-Adherence Risk',
      version: '1.0',
      modelType: 'classification',
      description: 'Predicts risk of medication non-adherence',
      inputFeatures: [
        'age',
        'number_of_medications',
        'medication_complexity',
        'copay_burden',
        'previous_adherence',
        'cognitive_status',
      ],
      outputMetric: 'medication_nonadherence',
      accuracy: 0.73,
      validFrom: new Date('2024-01-01'),
      createdBy: 'system',
    });

    logger.info('Default predictive models initialized');
  }

  // ============================================================================
  // Social Determinants of Health
  // ============================================================================

  static recordSocialDeterminant(data: {
    patientId: string;
    category: SocialDeterminant['category'];
    factor: string;
    severity: SocialDeterminant['severity'];
    description: string;
    impact: string;
    identifiedBy: string;
  }): SocialDeterminant {
    const id = uuidv4();

    const determinant: SocialDeterminant = {
      id,
      patientId: data.patientId,
      category: data.category,
      factor: data.factor,
      status: 'identified',
      severity: data.severity,
      description: data.description,
      impact: data.impact,
      interventions: [],
      identifiedDate: new Date(),
      identifiedBy: data.identifiedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.socialDeterminants.set(id, determinant);
    logger.info(`Social determinant recorded for patient ${data.patientId}: ${data.factor}`);

    return determinant;
  }

  static updateSocialDeterminant(
    id: string,
    updates: {
      status?: SocialDeterminant['status'];
      interventions?: string[];
      resolvedDate?: Date;
    }
  ): SocialDeterminant {
    const determinant = this.socialDeterminants.get(id);
    if (!determinant) {
      throw new Error('Social determinant not found');
    }

    if (updates.status) determinant.status = updates.status;
    if (updates.interventions) determinant.interventions = updates.interventions;
    if (updates.resolvedDate) determinant.resolvedDate = updates.resolvedDate;

    determinant.updatedAt = new Date();

    this.socialDeterminants.set(id, determinant);
    logger.info(`Social determinant updated: ${id}`);

    return determinant;
  }

  static getSocialDeterminantById(id: string): SocialDeterminant | undefined {
    return this.socialDeterminants.get(id);
  }

  static getSocialDeterminantsByPatient(patientId: string): SocialDeterminant[] {
    return Array.from(this.socialDeterminants.values()).filter(
      (determinant) => determinant.patientId === patientId
    );
  }

  static getSocialDeterminantsByCategory(
    category: SocialDeterminant['category']
  ): SocialDeterminant[] {
    return Array.from(this.socialDeterminants.values()).filter(
      (determinant) => determinant.category === category
    );
  }

  // ============================================================================
  // Risk Stratification Cohorts
  // ============================================================================

  static createRiskStratificationCohort(data: {
    name: string;
    description: string;
    criteria: CohortCriteria[];
    riskLevels: RiskLevel[];
    createdBy: string;
  }): RiskStratificationCohort {
    const id = uuidv4();

    const cohort: RiskStratificationCohort = {
      id,
      name: data.name,
      description: data.description,
      criteria: data.criteria,
      riskLevels: data.riskLevels,
      patientCount: 0,
      active: true,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cohorts.set(id, cohort);
    logger.info(`Risk stratification cohort created: ${data.name}`);

    return cohort;
  }

  static getCohortById(id: string): RiskStratificationCohort | undefined {
    return this.cohorts.get(id);
  }

  static getCohorts(activeOnly: boolean = true): RiskStratificationCohort[] {
    const cohorts = Array.from(this.cohorts.values());
    return activeOnly ? cohorts.filter((c) => c.active) : cohorts;
  }

  static getPatientCohorts(patientId: string): RiskStratificationCohort[] {
    const patientRiskScore = this.getLatestRiskScore(patientId);
    if (!patientRiskScore) return [];

    return Array.from(this.cohorts.values()).filter((cohort) => {
      if (!cohort.active) return false;
      if (!cohort.riskLevels.includes(patientRiskScore.riskLevel)) return false;

      // Check if patient meets all criteria
      return cohort.criteria.every((criterion) => {
        // Simplified criteria matching - in production, this would query actual patient data
        return true;
      });
    });
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================

  static getStatistics(
    startDate?: Date,
    endDate?: Date
  ): {
    riskDistribution: { riskLevel: RiskLevel; count: number; percentage: number }[];
    totalPatients: number;
    assessmentsCompleted: number;
    predictiveAnalysesRun: number;
    socialDeterminantsIdentified: number;
    highRiskPatients: number;
    activeCohorts: number;
    averageRiskScore: number;
  } {
    // Filter data by date range
    const filteredScores = Array.from(this.riskScores.values()).filter((score) => {
      if (startDate && score.calculatedDate < startDate) return false;
      if (endDate && score.calculatedDate > endDate) return false;
      return true;
    });

    // Get latest score per patient
    const latestScores = new Map<string, RiskScore>();
    for (const score of filteredScores) {
      const existing = latestScores.get(score.patientId);
      if (!existing || score.calculatedDate > existing.calculatedDate) {
        latestScores.set(score.patientId, score);
      }
    }

    // Calculate risk distribution
    const riskCounts = new Map<RiskLevel, number>([
      ['low', 0],
      ['moderate', 0],
      ['high', 0],
      ['very_high', 0],
    ]);

    let totalScore = 0;
    for (const score of latestScores.values()) {
      const current = riskCounts.get(score.riskLevel) || 0;
      riskCounts.set(score.riskLevel, current + 1);
      totalScore += score.score;
    }

    const totalPatients = latestScores.size;
    const riskDistribution = Array.from(riskCounts.entries()).map(([riskLevel, count]) => ({
      riskLevel,
      count,
      percentage: totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0,
    }));

    const assessmentsCompleted = Array.from(this.healthRiskAssessments.values()).filter(
      (a) => a.status === 'completed'
    ).length;

    const socialDeterminantsIdentified = Array.from(this.socialDeterminants.values()).filter(
      (d) => {
        if (startDate && d.identifiedDate < startDate) return false;
        if (endDate && d.identifiedDate > endDate) return false;
        return true;
      }
    ).length;

    return {
      riskDistribution,
      totalPatients,
      assessmentsCompleted,
      predictiveAnalysesRun: this.predictiveAnalyses.size,
      socialDeterminantsIdentified,
      highRiskPatients: (riskCounts.get('high') || 0) + (riskCounts.get('very_high') || 0),
      activeCohorts: Array.from(this.cohorts.values()).filter((c) => c.active).length,
      averageRiskScore: totalPatients > 0 ? Math.round((totalScore / totalPatients) * 100) / 100 : 0,
    };
  }
}
