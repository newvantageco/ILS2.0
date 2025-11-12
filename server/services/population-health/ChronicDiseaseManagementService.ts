import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { storage, type IStorage } from '../../storage';

// ============================================================================
// Chronic Disease Management Types
// ============================================================================

export interface DiseaseRegistry {
  id: string;
  name: string;
  diseaseCode: string;
  description: string;
  criteria: RegistryCriteria[];
  active: boolean;
  patientCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistryCriteria {
  type: 'diagnosis' | 'lab_value' | 'medication' | 'procedure' | 'risk_score';
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
}

export interface RegistryEnrollment {
  id: string;
  registryId: string;
  patientId: string;
  enrollmentDate: Date;
  status: 'active' | 'inactive' | 'graduated' | 'deceased' | 'transferred';
  enrollmentReason: string;
  disenrollmentDate?: Date;
  disenrollmentReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiseaseManagementProgram {
  id: string;
  name: string;
  diseaseType: string;
  description: string;
  objectives: string[];
  eligibilityCriteria: ProgramCriteria[];
  interventions: ProgramIntervention[];
  qualityMeasures: QualityMeasure[];
  duration: number; // days
  active: boolean;
  enrollmentCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgramCriteria {
  type: 'clinical' | 'demographic' | 'behavioral' | 'financial';
  description: string;
  required: boolean;
}

export interface ProgramIntervention {
  id: string;
  type: 'education' | 'coaching' | 'monitoring' | 'medication_management' | 'lifestyle';
  name: string;
  description: string;
  frequency: string;
  duration: number; // days
  deliveryMethod: 'in_person' | 'phone' | 'video' | 'online' | 'app';
}

export interface QualityMeasure {
  id: string;
  name: string;
  description: string;
  numerator: string;
  denominator: string;
  targetValue: number;
  unit: string;
  measurementFrequency: 'monthly' | 'quarterly' | 'annually';
}

export interface ProgramEnrollment {
  id: string;
  programId: string;
  patientId: string;
  enrollmentDate: Date;
  expectedEndDate: Date;
  status: 'active' | 'completed' | 'withdrawn' | 'failed';
  completionPercentage: number;
  interventionsCompleted: string[];
  outcomesAchieved: string[];
  withdrawalReason?: string;
  endDate?: Date;
  assignedCoach?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicalMetric {
  id: string;
  patientId: string;
  registryId?: string;
  programId?: string;
  metricType: string;
  metricName: string;
  value: number;
  unit: string;
  targetValue?: number;
  isAtGoal: boolean;
  measurementDate: Date;
  source: string;
  notes?: string;
  createdAt: Date;
}

export interface PatientEngagement {
  id: string;
  patientId: string;
  programId?: string;
  engagementType: 'education_completed' | 'coaching_session' | 'self_monitoring' | 'goal_set' | 'milestone_achieved';
  description: string;
  engagementDate: Date;
  score?: number;
  notes: string;
  recordedBy: string;
  createdAt: Date;
}

export interface OutcomeTracking {
  id: string;
  patientId: string;
  programId?: string;
  registryId?: string;
  outcomeType: 'clinical' | 'functional' | 'behavioral' | 'quality_of_life' | 'cost';
  measure: string;
  baselineValue: number;
  currentValue: number;
  targetValue?: number;
  improvement: number;
  improvementPercentage: number;
  unit: string;
  baselineDate: Date;
  latestMeasurementDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreventiveCareRecommendation {
  id: string;
  patientId: string;
  recommendationType: 'screening' | 'vaccination' | 'counseling' | 'medication';
  name: string;
  description: string;
  frequency: string;
  dueDate: Date;
  status: 'due' | 'overdue' | 'completed' | 'not_applicable' | 'refused';
  completedDate?: Date;
  nextDueDate?: Date;
  evidence: string;
  importance: 'routine' | 'recommended' | 'essential';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Chronic Disease Management Service
// ============================================================================

export class ChronicDiseaseManagementService {
  private static db: IStorage = storage;

  // ============================================================================
  // Disease Registry Management
  // ============================================================================

  static async createDiseaseRegistry(companyId: string, data: {
    name: string;
    diseaseCode: string;
    description: string;
    criteria: RegistryCriteria[];
    createdBy: string;
  }): Promise<DiseaseRegistry> {
    const id = uuidv4();

    const registry = await this.db.createDiseaseRegistry({
      id,
      companyId,
      name: data.name,
      diseaseCode: data.diseaseCode,
      description: data.description,
      criteria: data.criteria,
      active: true,
      patientCount: 0,
      createdBy: data.createdBy,
    });

    logger.info(`Disease registry created: ${data.name}`);

    return registry;
  }

  static async enrollInRegistry(companyId: string, data: {
    registryId: string;
    patientId: string;
    enrollmentReason: string;
  }): Promise<RegistryEnrollment> {
    const id = uuidv4();
    const registry = await this.db.getDiseaseRegistry(companyId, data.registryId);

    if (!registry) {
      throw new Error('Disease registry not found');
    }

    // Check if already enrolled
    const existingEnrollments = await this.db.getRegistryEnrollmentsByPatient(companyId, data.patientId);
    const existing = existingEnrollments.find(
      (e) => e.registryId === data.registryId && e.status === 'active'
    );

    if (existing) {
      throw new Error('Patient already enrolled in this registry');
    }

    const enrollment = await this.db.createRegistryEnrollment({
      id,
      companyId,
      registryId: data.registryId,
      patientId: data.patientId,
      enrollmentDate: new Date(),
      status: 'active',
      enrollmentReason: data.enrollmentReason,
    });

    // Update patient count
    await this.db.updateDiseaseRegistry(companyId, data.registryId, {
      patientCount: registry.patientCount + 1,
    });

    logger.info(`Patient ${data.patientId} enrolled in registry ${registry.name}`);

    return enrollment;
  }

  static async updateRegistryEnrollment(
    companyId: string,
    enrollmentId: string,
    updates: {
      status?: RegistryEnrollment['status'];
      disenrollmentReason?: string;
    }
  ): Promise<RegistryEnrollment> {
    const enrollment = await this.db.getRegistryEnrollment(companyId, enrollmentId);
    if (!enrollment) {
      throw new Error('Registry enrollment not found');
    }

    const updateData: any = {};

    if (updates.status && updates.status !== enrollment.status) {
      updateData.status = updates.status;
      if (updates.status !== 'active') {
        updateData.disenrollmentDate = new Date();
        updateData.disenrollmentReason = updates.disenrollmentReason;

        // Update patient count
        const registry = await this.db.getDiseaseRegistry(companyId, enrollment.registryId);
        if (registry && registry.patientCount > 0) {
          await this.db.updateDiseaseRegistry(companyId, enrollment.registryId, {
            patientCount: registry.patientCount - 1,
          });
        }
      }
    }

    const updated = await this.db.updateRegistryEnrollment(companyId, enrollmentId, updateData);

    logger.info(`Registry enrollment updated: ${enrollmentId}`);
    return updated;
  }

  static async getDiseaseRegistryById(companyId: string, id: string): Promise<DiseaseRegistry | undefined> {
    return await this.db.getDiseaseRegistry(companyId, id);
  }

  static async getDiseaseRegistries(companyId: string, activeOnly: boolean = true): Promise<DiseaseRegistry[]> {
    return await this.db.getDiseaseRegistries(companyId, { active: activeOnly });
  }

  static async getPatientRegistries(companyId: string, patientId: string): Promise<RegistryEnrollment[]> {
    const enrollments = await this.db.getRegistryEnrollmentsByPatient(companyId, patientId);
    return enrollments.filter((e) => e.status === 'active');
  }

  static async getRegistryPatients(companyId: string, registryId: string): Promise<RegistryEnrollment[]> {
    const enrollments = await this.db.getRegistryEnrollmentsByRegistry(companyId, registryId);
    return enrollments.filter((e) => e.status === 'active');
  }

  // ============================================================================
  // Disease Management Program
  // ============================================================================

  static async createDiseaseManagementProgram(companyId: string, data: {
    name: string;
    diseaseType: string;
    description: string;
    objectives: string[];
    eligibilityCriteria: ProgramCriteria[];
    interventions: ProgramIntervention[];
    qualityMeasures: QualityMeasure[];
    duration: number;
    createdBy: string;
  }): Promise<DiseaseManagementProgram> {
    const id = uuidv4();

    const program = await this.db.createDiseaseManagementProgram({
      id,
      companyId,
      name: data.name,
      diseaseType: data.diseaseType,
      description: data.description,
      objectives: data.objectives,
      eligibilityCriteria: data.eligibilityCriteria,
      interventions: data.interventions,
      qualityMeasures: data.qualityMeasures,
      duration: data.duration,
      active: true,
      enrollmentCount: 0,
      createdBy: data.createdBy,
    });

    logger.info(`Disease management program created: ${data.name}`);

    return program;
  }

  static async enrollInProgram(companyId: string, data: {
    programId: string;
    patientId: string;
    assignedCoach?: string;
  }): Promise<ProgramEnrollment> {
    const id = uuidv4();
    const program = await this.db.getDiseaseManagementProgram(companyId, data.programId);

    if (!program || !program.active) {
      throw new Error('Disease management program not found or inactive');
    }

    // Check if already enrolled
    const existingEnrollments = await this.db.getProgramEnrollmentsByPatient(companyId, data.patientId);
    const existing = existingEnrollments.find(
      (e) => e.programId === data.programId && e.status === 'active'
    );

    if (existing) {
      throw new Error('Patient already enrolled in this program');
    }

    const enrollmentDate = new Date();
    const expectedEndDate = new Date(enrollmentDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + program.duration);

    const enrollment = await this.db.createProgramEnrollment({
      id,
      companyId,
      programId: data.programId,
      patientId: data.patientId,
      enrollmentDate,
      expectedEndDate,
      status: 'active',
      completionPercentage: 0,
      interventionsCompleted: [],
      outcomesAchieved: [],
      assignedCoach: data.assignedCoach,
    });

    // Update enrollment count
    await this.db.updateDiseaseManagementProgram(companyId, data.programId, {
      enrollmentCount: program.enrollmentCount + 1,
    });

    logger.info(`Patient ${data.patientId} enrolled in program ${program.name}`);

    return enrollment;
  }

  static async recordInterventionCompletion(
    companyId: string,
    enrollmentId: string,
    interventionId: string,
    outcome: string
  ): Promise<ProgramEnrollment> {
    const enrollment = await this.db.getProgramEnrollment(companyId, enrollmentId);
    if (!enrollment) {
      throw new Error('Program enrollment not found');
    }

    const interventionsCompleted = [...enrollment.interventionsCompleted];
    if (!interventionsCompleted.includes(interventionId)) {
      interventionsCompleted.push(interventionId);
    }

    const outcomesAchieved = [...enrollment.outcomesAchieved];
    if (outcome && !outcomesAchieved.includes(outcome)) {
      outcomesAchieved.push(outcome);
    }

    // Update completion percentage
    const program = await this.db.getDiseaseManagementProgram(companyId, enrollment.programId);
    let completionPercentage = enrollment.completionPercentage;
    if (program) {
      completionPercentage = Math.round(
        (interventionsCompleted.length / program.interventions.length) * 100
      );
    }

    const updated = await this.db.updateProgramEnrollment(companyId, enrollmentId, {
      interventionsCompleted,
      outcomesAchieved,
      completionPercentage,
    });

    logger.info(`Intervention completed for enrollment ${enrollmentId}`);

    return updated;
  }

  static async updateProgramEnrollment(
    companyId: string,
    enrollmentId: string,
    updates: {
      status?: ProgramEnrollment['status'];
      withdrawalReason?: string;
      assignedCoach?: string;
    }
  ): Promise<ProgramEnrollment> {
    const enrollment = await this.db.getProgramEnrollment(companyId, enrollmentId);
    if (!enrollment) {
      throw new Error('Program enrollment not found');
    }

    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.assignedCoach) updateData.assignedCoach = updates.assignedCoach;
    if (updates.withdrawalReason) updateData.withdrawalReason = updates.withdrawalReason;

    if (updates.status && (updates.status === 'completed' || updates.status === 'withdrawn' || updates.status === 'failed')) {
      updateData.endDate = new Date();
    }

    const updated = await this.db.updateProgramEnrollment(companyId, enrollmentId, updateData);

    logger.info(`Program enrollment updated: ${enrollmentId} -> ${updates.status}`);

    return updated;
  }

  static async getDiseaseManagementProgramById(companyId: string, id: string): Promise<DiseaseManagementProgram | undefined> {
    return await this.db.getDiseaseManagementProgram(companyId, id);
  }

  static async getDiseaseManagementPrograms(companyId: string, activeOnly: boolean = true): Promise<DiseaseManagementProgram[]> {
    return await this.db.getDiseaseManagementPrograms(companyId, { active: activeOnly });
  }

  static async getPatientPrograms(companyId: string, patientId: string): Promise<ProgramEnrollment[]> {
    const enrollments = await this.db.getProgramEnrollmentsByPatient(companyId, patientId);
    return enrollments.filter((e) => e.status === 'active');
  }

  static async getProgramEnrollments(companyId: string, programId: string): Promise<ProgramEnrollment[]> {
    const enrollments = await this.db.getProgramEnrollmentsByProgram(companyId, programId);
    return enrollments.filter((e) => e.status === 'active');
  }

  // ============================================================================
  // Clinical Metrics Tracking
  // ============================================================================

  static async recordClinicalMetric(companyId: string, data: {
    patientId: string;
    registryId?: string;
    programId?: string;
    metricType: string;
    metricName: string;
    value: number;
    unit: string;
    targetValue?: number;
    measurementDate: Date;
    source: string;
    notes?: string;
  }): Promise<ClinicalMetric> {
    const id = uuidv4();

    const isAtGoal = data.targetValue !== undefined ? this.isMetricAtGoal(data.value, data.targetValue, data.metricType) : false;

    const metric = await this.db.createClinicalMetric({
      id,
      companyId,
      patientId: data.patientId,
      registryId: data.registryId,
      programId: data.programId,
      metricType: data.metricType,
      metricName: data.metricName,
      value: data.value,
      unit: data.unit,
      targetValue: data.targetValue,
      isAtGoal,
      measurementDate: data.measurementDate,
      source: data.source,
      notes: data.notes,
    });

    logger.info(`Clinical metric recorded for patient ${data.patientId}: ${data.metricName} = ${data.value}${data.unit}`);

    // Update outcome tracking if baseline exists
    await this.updateOutcomeTracking(companyId, data.patientId, data.metricType, data.value, data.measurementDate);

    return metric;
  }

  static async getClinicalMetricsByPatient(
    companyId: string,
    patientId: string,
    metricType?: string
  ): Promise<ClinicalMetric[]> {
    const metrics = await this.db.getClinicalMetricsByPatient(companyId, patientId);
    return metricType ? metrics.filter((m) => m.metricType === metricType) : metrics;
  }

  static async getLatestMetric(companyId: string, patientId: string, metricType: string): Promise<ClinicalMetric | undefined> {
    const metrics = await this.getClinicalMetricsByPatient(companyId, patientId, metricType);
    const sorted = metrics.sort(
      (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    );
    return sorted[0];
  }

  private static isMetricAtGoal(value: number, target: number, metricType: string): boolean {
    // Different metrics have different goal criteria
    const lowerIsBetter = ['hba1c', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'cholesterol_ldl', 'weight', 'bmi'];
    const higherIsBetter = ['cholesterol_hdl', 'peak_flow'];

    if (lowerIsBetter.includes(metricType.toLowerCase())) {
      return value <= target;
    } else if (higherIsBetter.includes(metricType.toLowerCase())) {
      return value >= target;
    }

    // Default: within 10% of target
    return Math.abs(value - target) <= target * 0.1;
  }

  // ============================================================================
  // Patient Engagement Tracking
  // ============================================================================

  static async recordPatientEngagement(companyId: string, data: {
    patientId: string;
    programId?: string;
    engagementType: PatientEngagement['engagementType'];
    description: string;
    engagementDate: Date;
    score?: number;
    notes: string;
    recordedBy: string;
  }): Promise<PatientEngagement> {
    const id = uuidv4();

    const engagement = await this.db.createPatientEngagement({
      id,
      companyId,
      patientId: data.patientId,
      programId: data.programId,
      engagementType: data.engagementType,
      description: data.description,
      engagementDate: data.engagementDate,
      score: data.score,
      notes: data.notes,
      recordedBy: data.recordedBy,
    });

    logger.info(`Patient engagement recorded for ${data.patientId}: ${data.engagementType}`);

    return engagement;
  }

  static async getPatientEngagement(
    companyId: string,
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PatientEngagement[]> {
    const engagements = await this.db.getPatientEngagement(companyId, patientId);
    return engagements.filter((e) => {
      if (startDate && new Date(e.engagementDate) < startDate) return false;
      if (endDate && new Date(e.engagementDate) > endDate) return false;
      return true;
    });
  }

  static async calculateEngagementScore(companyId: string, patientId: string, days: number = 30): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const engagements = await this.getPatientEngagement(companyId, patientId, since);

    // Engagement scoring: different types worth different points
    const weights = {
      education_completed: 10,
      coaching_session: 15,
      self_monitoring: 5,
      goal_set: 8,
      milestone_achieved: 20,
    };

    let totalScore = 0;
    for (const engagement of engagements) {
      totalScore += weights[engagement.engagementType] || 0;
      if (engagement.score) totalScore += engagement.score;
    }

    return totalScore;
  }

  // ============================================================================
  // Outcome Tracking
  // ============================================================================

  static async initializeOutcomeTracking(companyId: string, data: {
    patientId: string;
    programId?: string;
    registryId?: string;
    outcomeType: OutcomeTracking['outcomeType'];
    measure: string;
    baselineValue: number;
    targetValue?: number;
    unit: string;
    baselineDate: Date;
  }): Promise<OutcomeTracking> {
    const id = uuidv4();

    const outcome = await this.db.createOutcomeTracking({
      id,
      companyId,
      patientId: data.patientId,
      programId: data.programId,
      registryId: data.registryId,
      outcomeType: data.outcomeType,
      measure: data.measure,
      baselineValue: data.baselineValue,
      currentValue: data.baselineValue,
      targetValue: data.targetValue,
      improvement: 0,
      improvementPercentage: 0,
      unit: data.unit,
      baselineDate: data.baselineDate,
      latestMeasurementDate: data.baselineDate,
    });

    logger.info(`Outcome tracking initialized for patient ${data.patientId}: ${data.measure}`);

    return outcome;
  }

  private static async updateOutcomeTracking(
    companyId: string,
    patientId: string,
    measure: string,
    newValue: number,
    measurementDate: Date
  ): Promise<void> {
    const outcomes = await this.db.getOutcomeTrackingByPatient(companyId, patientId);
    const outcome = outcomes.find((o) => o.measure === measure);

    if (!outcome) return;

    const improvement = outcome.baselineValue - newValue;
    const improvementPercentage =
      outcome.baselineValue !== 0
        ? Math.round((improvement / outcome.baselineValue) * 100)
        : 0;

    await this.db.updateOutcomeTracking(companyId, outcome.id, {
      currentValue: newValue,
      improvement,
      improvementPercentage,
      latestMeasurementDate: measurementDate,
    });
  }

  static async getOutcomesByPatient(companyId: string, patientId: string): Promise<OutcomeTracking[]> {
    return await this.db.getOutcomeTrackingByPatient(companyId, patientId);
  }

  static async getOutcomesByProgram(companyId: string, programId: string): Promise<OutcomeTracking[]> {
    const allOutcomes = await this.db.getOutcomeTrackingByPatient(companyId, ''); // This needs a proper method
    return allOutcomes.filter((o) => o.programId === programId);
  }

  // ============================================================================
  // Preventive Care
  // ============================================================================

  static async createPreventiveCareRecommendation(companyId: string, data: {
    patientId: string;
    recommendationType: PreventiveCareRecommendation['recommendationType'];
    name: string;
    description: string;
    frequency: string;
    dueDate: Date;
    evidence: string;
    importance: PreventiveCareRecommendation['importance'];
  }): Promise<PreventiveCareRecommendation> {
    const id = uuidv4();

    const now = new Date();
    const status: PreventiveCareRecommendation['status'] = data.dueDate > now ? 'due' : 'overdue';

    const recommendation = await this.db.createPreventiveCareRecommendation({
      id,
      companyId,
      patientId: data.patientId,
      recommendationType: data.recommendationType,
      name: data.name,
      description: data.description,
      frequency: data.frequency,
      dueDate: data.dueDate,
      status,
      evidence: data.evidence,
      importance: data.importance,
    });

    logger.info(`Preventive care recommendation created for patient ${data.patientId}: ${data.name}`);

    return recommendation;
  }

  static async completePreventiveCare(
    companyId: string,
    recommendationId: string,
    completedDate: Date,
    nextDueDate?: Date
  ): Promise<PreventiveCareRecommendation> {
    const recommendation = await this.db.getPreventiveCareRecommendation(companyId, recommendationId);
    if (!recommendation) {
      throw new Error('Preventive care recommendation not found');
    }

    const updated = await this.db.updatePreventiveCareRecommendation(companyId, recommendationId, {
      status: 'completed',
      completedDate,
      nextDueDate,
    });

    logger.info(`Preventive care completed: ${recommendationId}`);

    return updated;
  }

  static async getPreventiveCareByPatient(
    companyId: string,
    patientId: string,
    status?: PreventiveCareRecommendation['status']
  ): Promise<PreventiveCareRecommendation[]> {
    const recommendations = await this.db.getPreventiveCareRecommendationsByPatient(companyId, patientId);
    return status ? recommendations.filter((r) => r.status === status) : recommendations;
  }

  static async getDuePreventiveCare(companyId: string, daysAhead: number = 30): Promise<PreventiveCareRecommendation[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const allRecommendations = await this.db.getPreventiveCareRecommendationsByPatient(companyId, ''); // This needs a proper method
    return allRecommendations.filter(
      (r) => (r.status === 'due' || r.status === 'overdue') && new Date(r.dueDate) <= futureDate
    );
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================
  // Note: Default data initialization removed - will be seeded per company via database seeding

  static async getStatistics(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    registries: {
      total: number;
      totalPatients: number;
      byDisease: { disease: string; count: number }[];
    };
    programs: {
      total: number;
      activeEnrollments: number;
      completionRate: number;
      byDisease: { disease: string; enrollments: number }[];
    };
    clinicalMetrics: {
      totalRecorded: number;
      patientsAtGoal: number;
      percentageAtGoal: number;
      byMetric: { metric: string; count: number; avgValue: number }[];
    };
    engagement: {
      totalEngagements: number;
      avgEngagementScore: number;
      byType: { type: string; count: number }[];
    };
    outcomes: {
      totalTracked: number;
      improving: number;
      avgImprovement: number;
    };
    preventiveCare: {
      totalRecommendations: number;
      due: number;
      overdue: number;
      completed: number;
      completionRate: number;
    };
  }> {
    // Registries
    const registries = await this.db.getDiseaseRegistries(companyId, {});
    const totalPatients = registries.reduce((sum, r) => sum + r.patientCount, 0);

    // Programs
    const programs = await this.db.getDiseaseManagementPrograms(companyId, {});
    // Note: We'd need to query all enrollments to get accurate counts
    // For now, using placeholder values - would need proper aggregate queries
    const activeEnrollments = 0; // Would need db.getAllProgramEnrollments with filter
    const completedEnrollments = 0;
    const totalEnrollments = 0;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    // Clinical Metrics
    // Note: Would need a method to get all metrics for a company
    const metrics: ClinicalMetric[] = []; // Placeholder - need db.getAllClinicalMetrics(companyId)
    const metricsAtGoal = metrics.filter((m) => m.isAtGoal).length;
    const percentageAtGoal = metrics.length > 0 ? Math.round((metricsAtGoal / metrics.length) * 100) : 0;

    // Group metrics by type
    const metricsByType = new Map<string, { count: number; totalValue: number }>();
    for (const metric of metrics) {
      const existing = metricsByType.get(metric.metricType) || { count: 0, totalValue: 0 };
      metricsByType.set(metric.metricType, {
        count: existing.count + 1,
        totalValue: existing.totalValue + metric.value,
      });
    }

    // Engagement
    const engagements: PatientEngagement[] = []; // Placeholder - need db.getAllPatientEngagement(companyId)
    const engagementsByType = new Map<string, number>();
    for (const engagement of engagements) {
      const count = engagementsByType.get(engagement.engagementType) || 0;
      engagementsByType.set(engagement.engagementType, count + 1);
    }

    // Outcomes
    const outcomes: OutcomeTracking[] = []; // Placeholder - need db.getAllOutcomeTracking(companyId)
    const improving = outcomes.filter((o) => o.improvement > 0).length;
    const avgImprovement =
      outcomes.length > 0
        ? outcomes.reduce((sum, o) => sum + o.improvementPercentage, 0) / outcomes.length
        : 0;

    // Preventive Care
    const preventive: PreventiveCareRecommendation[] = []; // Placeholder - need db.getAllPreventiveCare(companyId)
    const due = preventive.filter((p) => p.status === 'due').length;
    const overdue = preventive.filter((p) => p.status === 'overdue').length;
    const completed = preventive.filter((p) => p.status === 'completed').length;
    const preventiveCompletionRate =
      preventive.length > 0 ? Math.round((completed / preventive.length) * 100) : 0;

    return {
      registries: {
        total: registries.length,
        totalPatients,
        byDisease: registries.map((r) => ({
          disease: r.name,
          count: r.patientCount,
        })),
      },
      programs: {
        total: programs.length,
        activeEnrollments,
        completionRate,
        byDisease: programs.map((p) => ({
          disease: p.diseaseType,
          enrollments: p.enrollmentCount,
        })),
      },
      clinicalMetrics: {
        totalRecorded: metrics.length,
        patientsAtGoal: metricsAtGoal,
        percentageAtGoal,
        byMetric: Array.from(metricsByType.entries()).map(([metric, data]) => ({
          metric,
          count: data.count,
          avgValue: Math.round((data.totalValue / data.count) * 100) / 100,
        })),
      },
      engagement: {
        totalEngagements: engagements.length,
        avgEngagementScore: 0, // Would calculate across all patients
        byType: Array.from(engagementsByType.entries()).map(([type, count]) => ({
          type,
          count,
        })),
      },
      outcomes: {
        totalTracked: outcomes.length,
        improving,
        avgImprovement: Math.round(avgImprovement * 100) / 100,
      },
      preventiveCare: {
        totalRecommendations: preventive.length,
        due,
        overdue,
        completed,
        completionRate: preventiveCompletionRate,
      },
    };
  }
}
