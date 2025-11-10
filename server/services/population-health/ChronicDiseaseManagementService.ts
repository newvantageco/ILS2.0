import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

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
  private static diseaseRegistries: Map<string, DiseaseRegistry> = new Map();
  private static registryEnrollments: Map<string, RegistryEnrollment> = new Map();
  private static diseasePrograms: Map<string, DiseaseManagementProgram> = new Map();
  private static programEnrollments: Map<string, ProgramEnrollment> = new Map();
  private static clinicalMetrics: Map<string, ClinicalMetric> = new Map();
  private static patientEngagement: Map<string, PatientEngagement> = new Map();
  private static outcomeTracking: Map<string, OutcomeTracking> = new Map();
  private static preventiveCare: Map<string, PreventiveCareRecommendation> = new Map();

  // Initialize with default registries and programs
  static {
    this.initializeDefaultRegistries();
    this.initializeDefaultPrograms();
  }

  // ============================================================================
  // Disease Registry Management
  // ============================================================================

  static createDiseaseRegistry(data: {
    name: string;
    diseaseCode: string;
    description: string;
    criteria: RegistryCriteria[];
    createdBy: string;
  }): DiseaseRegistry {
    const id = uuidv4();

    const registry: DiseaseRegistry = {
      id,
      name: data.name,
      diseaseCode: data.diseaseCode,
      description: data.description,
      criteria: data.criteria,
      active: true,
      patientCount: 0,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.diseaseRegistries.set(id, registry);
    logger.info(`Disease registry created: ${data.name}`);

    return registry;
  }

  static enrollInRegistry(data: {
    registryId: string;
    patientId: string;
    enrollmentReason: string;
  }): RegistryEnrollment {
    const id = uuidv4();
    const registry = this.diseaseRegistries.get(data.registryId);

    if (!registry) {
      throw new Error('Disease registry not found');
    }

    // Check if already enrolled
    const existing = Array.from(this.registryEnrollments.values()).find(
      (e) =>
        e.registryId === data.registryId &&
        e.patientId === data.patientId &&
        e.status === 'active'
    );

    if (existing) {
      throw new Error('Patient already enrolled in this registry');
    }

    const enrollment: RegistryEnrollment = {
      id,
      registryId: data.registryId,
      patientId: data.patientId,
      enrollmentDate: new Date(),
      status: 'active',
      enrollmentReason: data.enrollmentReason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.registryEnrollments.set(id, enrollment);

    // Update patient count
    registry.patientCount++;
    this.diseaseRegistries.set(data.registryId, registry);

    logger.info(`Patient ${data.patientId} enrolled in registry ${registry.name}`);

    return enrollment;
  }

  static updateRegistryEnrollment(
    enrollmentId: string,
    updates: {
      status?: RegistryEnrollment['status'];
      disenrollmentReason?: string;
    }
  ): RegistryEnrollment {
    const enrollment = this.registryEnrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error('Registry enrollment not found');
    }

    if (updates.status && updates.status !== enrollment.status) {
      enrollment.status = updates.status;
      if (updates.status !== 'active') {
        enrollment.disenrollmentDate = new Date();
        enrollment.disenrollmentReason = updates.disenrollmentReason;

        // Update patient count
        const registry = this.diseaseRegistries.get(enrollment.registryId);
        if (registry) {
          registry.patientCount--;
          this.diseaseRegistries.set(enrollment.registryId, registry);
        }
      }
    }

    enrollment.updatedAt = new Date();
    this.registryEnrollments.set(enrollmentId, enrollment);

    logger.info(`Registry enrollment updated: ${enrollmentId}`);
    return enrollment;
  }

  static getDiseaseRegistryById(id: string): DiseaseRegistry | undefined {
    return this.diseaseRegistries.get(id);
  }

  static getDiseaseRegistries(activeOnly: boolean = true): DiseaseRegistry[] {
    const registries = Array.from(this.diseaseRegistries.values());
    return activeOnly ? registries.filter((r) => r.active) : registries;
  }

  static getPatientRegistries(patientId: string): RegistryEnrollment[] {
    return Array.from(this.registryEnrollments.values()).filter(
      (e) => e.patientId === patientId && e.status === 'active'
    );
  }

  static getRegistryPatients(registryId: string): RegistryEnrollment[] {
    return Array.from(this.registryEnrollments.values()).filter(
      (e) => e.registryId === registryId && e.status === 'active'
    );
  }

  // ============================================================================
  // Disease Management Program
  // ============================================================================

  static createDiseaseManagementProgram(data: {
    name: string;
    diseaseType: string;
    description: string;
    objectives: string[];
    eligibilityCriteria: ProgramCriteria[];
    interventions: ProgramIntervention[];
    qualityMeasures: QualityMeasure[];
    duration: number;
    createdBy: string;
  }): DiseaseManagementProgram {
    const id = uuidv4();

    const program: DiseaseManagementProgram = {
      id,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.diseasePrograms.set(id, program);
    logger.info(`Disease management program created: ${data.name}`);

    return program;
  }

  static enrollInProgram(data: {
    programId: string;
    patientId: string;
    assignedCoach?: string;
  }): ProgramEnrollment {
    const id = uuidv4();
    const program = this.diseasePrograms.get(data.programId);

    if (!program || !program.active) {
      throw new Error('Disease management program not found or inactive');
    }

    // Check if already enrolled
    const existing = Array.from(this.programEnrollments.values()).find(
      (e) =>
        e.programId === data.programId &&
        e.patientId === data.patientId &&
        e.status === 'active'
    );

    if (existing) {
      throw new Error('Patient already enrolled in this program');
    }

    const enrollmentDate = new Date();
    const expectedEndDate = new Date(enrollmentDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + program.duration);

    const enrollment: ProgramEnrollment = {
      id,
      programId: data.programId,
      patientId: data.patientId,
      enrollmentDate,
      expectedEndDate,
      status: 'active',
      completionPercentage: 0,
      interventionsCompleted: [],
      outcomesAchieved: [],
      assignedCoach: data.assignedCoach,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.programEnrollments.set(id, enrollment);

    // Update enrollment count
    program.enrollmentCount++;
    this.diseasePrograms.set(data.programId, program);

    logger.info(`Patient ${data.patientId} enrolled in program ${program.name}`);

    return enrollment;
  }

  static recordInterventionCompletion(
    enrollmentId: string,
    interventionId: string,
    outcome: string
  ): ProgramEnrollment {
    const enrollment = this.programEnrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error('Program enrollment not found');
    }

    if (!enrollment.interventionsCompleted.includes(interventionId)) {
      enrollment.interventionsCompleted.push(interventionId);
    }

    if (outcome && !enrollment.outcomesAchieved.includes(outcome)) {
      enrollment.outcomesAchieved.push(outcome);
    }

    // Update completion percentage
    const program = this.diseasePrograms.get(enrollment.programId);
    if (program) {
      enrollment.completionPercentage = Math.round(
        (enrollment.interventionsCompleted.length / program.interventions.length) * 100
      );
    }

    enrollment.updatedAt = new Date();
    this.programEnrollments.set(enrollmentId, enrollment);

    logger.info(`Intervention completed for enrollment ${enrollmentId}`);

    return enrollment;
  }

  static updateProgramEnrollment(
    enrollmentId: string,
    updates: {
      status?: ProgramEnrollment['status'];
      withdrawalReason?: string;
      assignedCoach?: string;
    }
  ): ProgramEnrollment {
    const enrollment = this.programEnrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error('Program enrollment not found');
    }

    if (updates.status) enrollment.status = updates.status;
    if (updates.assignedCoach) enrollment.assignedCoach = updates.assignedCoach;
    if (updates.withdrawalReason) enrollment.withdrawalReason = updates.withdrawalReason;

    if (updates.status && (updates.status === 'completed' || updates.status === 'withdrawn' || updates.status === 'failed')) {
      enrollment.endDate = new Date();
    }

    enrollment.updatedAt = new Date();
    this.programEnrollments.set(enrollmentId, enrollment);

    logger.info(`Program enrollment updated: ${enrollmentId} -> ${updates.status}`);

    return enrollment;
  }

  static getDiseaseManagementProgramById(id: string): DiseaseManagementProgram | undefined {
    return this.diseasePrograms.get(id);
  }

  static getDiseaseManagementPrograms(activeOnly: boolean = true): DiseaseManagementProgram[] {
    const programs = Array.from(this.diseasePrograms.values());
    return activeOnly ? programs.filter((p) => p.active) : programs;
  }

  static getPatientPrograms(patientId: string): ProgramEnrollment[] {
    return Array.from(this.programEnrollments.values()).filter(
      (e) => e.patientId === patientId && e.status === 'active'
    );
  }

  static getProgramEnrollments(programId: string): ProgramEnrollment[] {
    return Array.from(this.programEnrollments.values()).filter(
      (e) => e.programId === programId && e.status === 'active'
    );
  }

  // ============================================================================
  // Clinical Metrics Tracking
  // ============================================================================

  static recordClinicalMetric(data: {
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
  }): ClinicalMetric {
    const id = uuidv4();

    const isAtGoal = data.targetValue !== undefined ? this.isMetricAtGoal(data.value, data.targetValue, data.metricType) : false;

    const metric: ClinicalMetric = {
      id,
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
      createdAt: new Date(),
    };

    this.clinicalMetrics.set(id, metric);
    logger.info(`Clinical metric recorded for patient ${data.patientId}: ${data.metricName} = ${data.value}${data.unit}`);

    // Update outcome tracking if baseline exists
    this.updateOutcomeTracking(data.patientId, data.metricType, data.value, data.measurementDate);

    return metric;
  }

  static getClinicalMetricsByPatient(
    patientId: string,
    metricType?: string
  ): ClinicalMetric[] {
    return Array.from(this.clinicalMetrics.values()).filter(
      (m) => m.patientId === patientId && (!metricType || m.metricType === metricType)
    );
  }

  static getLatestMetric(patientId: string, metricType: string): ClinicalMetric | undefined {
    const metrics = this.getClinicalMetricsByPatient(patientId, metricType).sort(
      (a, b) => b.measurementDate.getTime() - a.measurementDate.getTime()
    );
    return metrics[0];
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

  static recordPatientEngagement(data: {
    patientId: string;
    programId?: string;
    engagementType: PatientEngagement['engagementType'];
    description: string;
    engagementDate: Date;
    score?: number;
    notes: string;
    recordedBy: string;
  }): PatientEngagement {
    const id = uuidv4();

    const engagement: PatientEngagement = {
      id,
      patientId: data.patientId,
      programId: data.programId,
      engagementType: data.engagementType,
      description: data.description,
      engagementDate: data.engagementDate,
      score: data.score,
      notes: data.notes,
      recordedBy: data.recordedBy,
      createdAt: new Date(),
    };

    this.patientEngagement.set(id, engagement);
    logger.info(`Patient engagement recorded for ${data.patientId}: ${data.engagementType}`);

    return engagement;
  }

  static getPatientEngagement(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): PatientEngagement[] {
    return Array.from(this.patientEngagement.values()).filter((e) => {
      if (e.patientId !== patientId) return false;
      if (startDate && e.engagementDate < startDate) return false;
      if (endDate && e.engagementDate > endDate) return false;
      return true;
    });
  }

  static calculateEngagementScore(patientId: string, days: number = 30): number {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const engagements = this.getPatientEngagement(patientId, since);

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

  static initializeOutcomeTracking(data: {
    patientId: string;
    programId?: string;
    registryId?: string;
    outcomeType: OutcomeTracking['outcomeType'];
    measure: string;
    baselineValue: number;
    targetValue?: number;
    unit: string;
    baselineDate: Date;
  }): OutcomeTracking {
    const id = uuidv4();

    const outcome: OutcomeTracking = {
      id,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.outcomeTracking.set(id, outcome);
    logger.info(`Outcome tracking initialized for patient ${data.patientId}: ${data.measure}`);

    return outcome;
  }

  private static updateOutcomeTracking(
    patientId: string,
    measure: string,
    newValue: number,
    measurementDate: Date
  ): void {
    const outcome = Array.from(this.outcomeTracking.values()).find(
      (o) => o.patientId === patientId && o.measure === measure
    );

    if (!outcome) return;

    outcome.currentValue = newValue;
    outcome.improvement = outcome.baselineValue - newValue;
    outcome.improvementPercentage =
      outcome.baselineValue !== 0
        ? Math.round((outcome.improvement / outcome.baselineValue) * 100)
        : 0;
    outcome.latestMeasurementDate = measurementDate;
    outcome.updatedAt = new Date();

    this.outcomeTracking.set(outcome.id, outcome);
  }

  static getOutcomesByPatient(patientId: string): OutcomeTracking[] {
    return Array.from(this.outcomeTracking.values()).filter((o) => o.patientId === patientId);
  }

  static getOutcomesByProgram(programId: string): OutcomeTracking[] {
    return Array.from(this.outcomeTracking.values()).filter((o) => o.programId === programId);
  }

  // ============================================================================
  // Preventive Care
  // ============================================================================

  static createPreventiveCareRecommendation(data: {
    patientId: string;
    recommendationType: PreventiveCareRecommendation['recommendationType'];
    name: string;
    description: string;
    frequency: string;
    dueDate: Date;
    evidence: string;
    importance: PreventiveCareRecommendation['importance'];
  }): PreventiveCareRecommendation {
    const id = uuidv4();

    const now = new Date();
    const status: PreventiveCareRecommendation['status'] = data.dueDate > now ? 'due' : 'overdue';

    const recommendation: PreventiveCareRecommendation = {
      id,
      patientId: data.patientId,
      recommendationType: data.recommendationType,
      name: data.name,
      description: data.description,
      frequency: data.frequency,
      dueDate: data.dueDate,
      status,
      evidence: data.evidence,
      importance: data.importance,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.preventiveCare.set(id, recommendation);
    logger.info(`Preventive care recommendation created for patient ${data.patientId}: ${data.name}`);

    return recommendation;
  }

  static completePreventiveCare(
    recommendationId: string,
    completedDate: Date,
    nextDueDate?: Date
  ): PreventiveCareRecommendation {
    const recommendation = this.preventiveCare.get(recommendationId);
    if (!recommendation) {
      throw new Error('Preventive care recommendation not found');
    }

    recommendation.status = 'completed';
    recommendation.completedDate = completedDate;
    recommendation.nextDueDate = nextDueDate;
    recommendation.updatedAt = new Date();

    this.preventiveCare.set(recommendationId, recommendation);
    logger.info(`Preventive care completed: ${recommendationId}`);

    return recommendation;
  }

  static getPreventiveCareByPatient(
    patientId: string,
    status?: PreventiveCareRecommendation['status']
  ): PreventiveCareRecommendation[] {
    return Array.from(this.preventiveCare.values()).filter(
      (r) => r.patientId === patientId && (!status || r.status === status)
    );
  }

  static getDuePreventiveCare(daysAhead: number = 30): PreventiveCareRecommendation[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Array.from(this.preventiveCare.values()).filter(
      (r) => (r.status === 'due' || r.status === 'overdue') && r.dueDate <= futureDate
    );
  }

  // ============================================================================
  // Default Data Initialization
  // ============================================================================

  private static initializeDefaultRegistries(): void {
    // Diabetes Registry
    this.createDiseaseRegistry({
      name: 'Diabetes Registry',
      diseaseCode: 'E11',
      description: 'Registry for patients with Type 2 Diabetes',
      criteria: [
        {
          type: 'diagnosis',
          field: 'icd10_code',
          operator: 'contains',
          value: 'E11',
        },
      ],
      createdBy: 'system',
    });

    // Hypertension Registry
    this.createDiseaseRegistry({
      name: 'Hypertension Registry',
      diseaseCode: 'I10',
      description: 'Registry for patients with essential hypertension',
      criteria: [
        {
          type: 'diagnosis',
          field: 'icd10_code',
          operator: 'equals',
          value: 'I10',
        },
      ],
      createdBy: 'system',
    });

    // COPD Registry
    this.createDiseaseRegistry({
      name: 'COPD Registry',
      diseaseCode: 'J44',
      description: 'Registry for patients with Chronic Obstructive Pulmonary Disease',
      criteria: [
        {
          type: 'diagnosis',
          field: 'icd10_code',
          operator: 'contains',
          value: 'J44',
        },
      ],
      createdBy: 'system',
    });

    // Heart Failure Registry
    this.createDiseaseRegistry({
      name: 'Heart Failure Registry',
      diseaseCode: 'I50',
      description: 'Registry for patients with heart failure',
      criteria: [
        {
          type: 'diagnosis',
          field: 'icd10_code',
          operator: 'contains',
          value: 'I50',
        },
      ],
      createdBy: 'system',
    });

    // CKD Registry
    this.createDiseaseRegistry({
      name: 'Chronic Kidney Disease Registry',
      diseaseCode: 'N18',
      description: 'Registry for patients with chronic kidney disease',
      criteria: [
        {
          type: 'diagnosis',
          field: 'icd10_code',
          operator: 'contains',
          value: 'N18',
        },
      ],
      createdBy: 'system',
    });

    logger.info('Default disease registries initialized');
  }

  private static initializeDefaultPrograms(): void {
    // Diabetes Management Program
    this.createDiseaseManagementProgram({
      name: 'Diabetes Self-Management Education and Support',
      diseaseType: 'Diabetes',
      description: 'Comprehensive diabetes management program focusing on self-care and education',
      objectives: [
        'Achieve HbA1c < 7% for most patients',
        'Improve medication adherence',
        'Reduce diabetes-related complications',
        'Improve quality of life',
      ],
      eligibilityCriteria: [
        {
          type: 'clinical',
          description: 'Diagnosis of Type 1 or Type 2 Diabetes',
          required: true,
        },
        {
          type: 'clinical',
          description: 'HbA1c > 8% or newly diagnosed',
          required: false,
        },
      ],
      interventions: [
        {
          id: uuidv4(),
          type: 'education',
          name: 'Diabetes Self-Care Education',
          description: 'Comprehensive education on diabetes self-management',
          frequency: 'Weekly for 4 weeks',
          duration: 28,
          deliveryMethod: 'in_person',
        },
        {
          id: uuidv4(),
          type: 'monitoring',
          name: 'Blood Glucose Monitoring',
          description: 'Daily blood glucose monitoring with reporting',
          frequency: 'Daily',
          duration: 180,
          deliveryMethod: 'app',
        },
        {
          id: uuidv4(),
          type: 'coaching',
          name: 'Lifestyle Coaching',
          description: 'One-on-one coaching for diet and exercise',
          frequency: 'Bi-weekly',
          duration: 90,
          deliveryMethod: 'phone',
        },
      ],
      qualityMeasures: [
        {
          id: uuidv4(),
          name: 'HbA1c Control',
          description: 'Percentage of patients with HbA1c < 8%',
          numerator: 'Patients with HbA1c < 8%',
          denominator: 'All patients in program',
          targetValue: 80,
          unit: '%',
          measurementFrequency: 'quarterly',
        },
      ],
      duration: 180,
      createdBy: 'system',
    });

    // Hypertension Management Program
    this.createDiseaseManagementProgram({
      name: 'Hypertension Control Program',
      diseaseType: 'Hypertension',
      description: 'Evidence-based program for blood pressure control',
      objectives: [
        'Achieve blood pressure < 140/90 mmHg',
        'Improve medication adherence',
        'Reduce cardiovascular risk',
        'Promote healthy lifestyle changes',
      ],
      eligibilityCriteria: [
        {
          type: 'clinical',
          description: 'Diagnosis of essential hypertension',
          required: true,
        },
        {
          type: 'clinical',
          description: 'Blood pressure > 140/90 mmHg',
          required: false,
        },
      ],
      interventions: [
        {
          id: uuidv4(),
          type: 'monitoring',
          name: 'Home Blood Pressure Monitoring',
          description: 'Regular home BP monitoring with tracking',
          frequency: 'Daily',
          duration: 90,
          deliveryMethod: 'app',
        },
        {
          id: uuidv4(),
          type: 'medication_management',
          name: 'Medication Adherence Support',
          description: 'Support for medication adherence and adjustment',
          frequency: 'Monthly',
          duration: 90,
          deliveryMethod: 'phone',
        },
        {
          id: uuidv4(),
          type: 'lifestyle',
          name: 'DASH Diet Education',
          description: 'Education on Dietary Approaches to Stop Hypertension',
          frequency: 'One-time',
          duration: 7,
          deliveryMethod: 'online',
        },
      ],
      qualityMeasures: [
        {
          id: uuidv4(),
          name: 'BP Control',
          description: 'Percentage of patients with BP < 140/90',
          numerator: 'Patients with BP < 140/90',
          denominator: 'All patients in program',
          targetValue: 75,
          unit: '%',
          measurementFrequency: 'quarterly',
        },
      ],
      duration: 90,
      createdBy: 'system',
    });

    // Heart Failure Management Program
    this.createDiseaseManagementProgram({
      name: 'Heart Failure Care Management',
      diseaseType: 'Heart Failure',
      description: 'Comprehensive care management for heart failure patients',
      objectives: [
        'Reduce hospital readmissions',
        'Improve functional status',
        'Optimize medication therapy',
        'Improve quality of life',
      ],
      eligibilityCriteria: [
        {
          type: 'clinical',
          description: 'Diagnosis of heart failure',
          required: true,
        },
        {
          type: 'clinical',
          description: 'Recent hospitalization or high risk',
          required: false,
        },
      ],
      interventions: [
        {
          id: uuidv4(),
          type: 'monitoring',
          name: 'Daily Weight and Symptom Monitoring',
          description: 'Daily monitoring of weight, symptoms, and vital signs',
          frequency: 'Daily',
          duration: 90,
          deliveryMethod: 'app',
        },
        {
          id: uuidv4(),
          type: 'coaching',
          name: 'Nurse Care Management',
          description: 'Regular contact with specialized HF nurse',
          frequency: 'Weekly',
          duration: 90,
          deliveryMethod: 'phone',
        },
        {
          id: uuidv4(),
          type: 'education',
          name: 'Heart Failure Self-Care Education',
          description: 'Education on HF self-care and warning signs',
          frequency: 'One-time',
          duration: 7,
          deliveryMethod: 'video',
        },
      ],
      qualityMeasures: [
        {
          id: uuidv4(),
          name: '30-Day Readmission Rate',
          description: 'Percentage of patients readmitted within 30 days',
          numerator: 'Patients readmitted within 30 days',
          denominator: 'All patients discharged',
          targetValue: 15,
          unit: '%',
          measurementFrequency: 'monthly',
        },
      ],
      duration: 90,
      createdBy: 'system',
    });

    logger.info('Default disease management programs initialized');
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================

  static getStatistics(
    startDate?: Date,
    endDate?: Date
  ): {
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
  } {
    // Registries
    const registries = Array.from(this.diseaseRegistries.values());
    const totalPatients = registries.reduce((sum, r) => sum + r.patientCount, 0);

    // Programs
    const programs = Array.from(this.diseasePrograms.values());
    const activeEnrollments = Array.from(this.programEnrollments.values()).filter(
      (e) => e.status === 'active'
    ).length;
    const completedEnrollments = Array.from(this.programEnrollments.values()).filter(
      (e) => e.status === 'completed'
    ).length;
    const totalEnrollments = this.programEnrollments.size;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    // Clinical Metrics
    const metrics = Array.from(this.clinicalMetrics.values());
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
    const engagements = Array.from(this.patientEngagement.values());
    const engagementsByType = new Map<string, number>();
    for (const engagement of engagements) {
      const count = engagementsByType.get(engagement.engagementType) || 0;
      engagementsByType.set(engagement.engagementType, count + 1);
    }

    // Outcomes
    const outcomes = Array.from(this.outcomeTracking.values());
    const improving = outcomes.filter((o) => o.improvement > 0).length;
    const avgImprovement =
      outcomes.length > 0
        ? outcomes.reduce((sum, o) => sum + o.improvementPercentage, 0) / outcomes.length
        : 0;

    // Preventive Care
    const preventive = Array.from(this.preventiveCare.values());
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
