import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { storage, type IStorage } from '../../storage';

// ============================================================================
// Quality Improvement Types
// ============================================================================

export interface QualityImprovementProject {
  id: string;
  projectNumber: string;
  name: string;
  description: string;
  aim: string;
  scope: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  teamLead: string;
  teamMembers: string[];
  startDate: Date;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  baseline: ProjectBaseline;
  target: ProjectTarget;
  pdsaCycles: string[]; // Array of PDSA cycle IDs
  interventions: QIIntervention[];
  barriers: string[];
  successFactors: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectBaseline {
  metric: string;
  value: number;
  measurementDate: Date;
  dataSource: string;
}

export interface ProjectTarget {
  metric: string;
  targetValue: number;
  targetDate: Date;
  stretchGoalValue?: number;
}

export interface QIIntervention {
  id: string;
  name: string;
  description: string;
  type: 'process_change' | 'education' | 'technology' | 'policy' | 'workflow' | 'other';
  implementationDate: Date;
  status: 'planned' | 'implemented' | 'sustained' | 'abandoned';
  impact: 'positive' | 'negative' | 'neutral' | 'unknown';
  notes: string;
}

export interface PDSACycle {
  id: string;
  cycleNumber: number;
  projectId: string;
  status: 'plan' | 'do' | 'study' | 'act' | 'completed';
  plan: {
    objective: string;
    predictions: string[];
    measures: string[];
    plan: string[];
  };
  do: {
    implementationDate?: Date;
    observations: string[];
    dataCollected: CycleData[];
    issues: string[];
  };
  study: {
    results: string[];
    comparedToObjective: string;
    learnings: string[];
    unexpectedFindings: string[];
  };
  act: {
    decision: 'adopt' | 'adapt' | 'abandon';
    nextSteps: string[];
    changesAdopted: string[];
    nextCycleChanges: string[];
  };
  startDate: Date;
  completionDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CycleData {
  dataPoint: string;
  value: number;
  collectionDate: Date;
  notes: string;
}

export interface CareBundle {
  id: string;
  bundleId: string;
  name: string;
  description: string;
  category: string;
  elements: BundleElement[];
  evidenceBase: string;
  targetPopulation: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BundleElement {
  id: string;
  elementNumber: number;
  description: string;
  specification: string;
  frequency: string;
  responsible: string;
  criticalElement: boolean;
}

export interface BundleCompliance {
  id: string;
  bundleId: string;
  encounterId: string;
  patientId: string;
  assessmentDate: Date;
  elementCompliance: ElementCompliance[];
  overallCompliance: boolean;
  complianceRate: number;
  assessedBy: string;
  createdAt: Date;
}

export interface ElementCompliance {
  elementId: string;
  compliant: boolean;
  notApplicable: boolean;
  reason?: string;
  evidence?: string;
}

export interface PerformanceImprovement {
  id: string;
  name: string;
  description: string;
  metric: string;
  baselineValue: number;
  baselineDate: Date;
  targetValue: number;
  targetDate: Date;
  currentValue: number;
  currentDate: Date;
  improvement: number;
  improvementPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
  status: 'active' | 'met' | 'missed' | 'abandoned';
  dataPoints: DataPoint[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataPoint {
  date: Date;
  value: number;
  notes: string;
}

export interface BestPractice {
  id: string;
  practiceId: string;
  name: string;
  description: string;
  category: string;
  clinicalArea: string;
  evidenceLevel: 'Level_I' | 'Level_II' | 'Level_III' | 'Level_IV' | 'Level_V';
  evidenceSource: string;
  implementation: string;
  outcomes: string[];
  adoptionStatus: 'proposed' | 'pilot' | 'adopted' | 'sustained';
  adoptionDate?: Date;
  owner: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Quality Improvement Service
// ============================================================================

export class QualityImprovementService {
  private static db: IStorage = storage;
  private static projectCounter = 1000; // Will be replaced with database sequence

  // NOTE: Default bundles should be seeded via database migration per company

  // ============================================================================
  // Quality Improvement Projects
  // ============================================================================

  static async createQIProject(companyId: string, data: {
    name: string;
    description: string;
    aim: string;
    scope: string;
    priority: QualityImprovementProject['priority'];
    teamLead: string;
    teamMembers: string[];
    startDate: Date;
    targetCompletionDate: Date;
    baseline: ProjectBaseline;
    target: ProjectTarget;
    createdBy: string;
  }): Promise<QualityImprovementProject> {
    const id = uuidv4();
    const projectNumber = `QI-${this.projectCounter++}`;

    const project = await this.db.createQIProject({
      id,
      companyId,
      projectNumber,
      name: data.name,
      description: data.description,
      aim: data.aim,
      scope: data.scope,
      status: 'planning',
      priority: data.priority,
      teamLead: data.teamLead,
      teamMembers: data.teamMembers,
      startDate: data.startDate,
      targetCompletionDate: data.targetCompletionDate,
      baseline: {
        metric: data.baseline.metric,
        value: data.baseline.value,
        measurementDate: data.baseline.measurementDate.toISOString(),
        dataSource: data.baseline.dataSource,
      },
      target: {
        metric: data.target.metric,
        targetValue: data.target.targetValue,
        targetDate: data.target.targetDate.toISOString(),
        stretchGoalValue: data.target.stretchGoalValue,
      },
      pdsaCycles: [],
      interventions: [],
      barriers: [],
      successFactors: [],
      createdBy: data.createdBy,
    });

    logger.info(`QI project created: ${projectNumber} - ${data.name}`);

    return project;
  }

  static async updateQIProjectStatus(
    companyId: string,
    projectId: string,
    status: QualityImprovementProject['status']
  ): Promise<QualityImprovementProject> {
    const project = await this.db.getQIProject(companyId, projectId);
    if (!project) {
      throw new Error('QI project not found');
    }

    const updateData: any = { status };
    if (status === 'completed') {
      updateData.actualCompletionDate = new Date();
    }

    const updated = await this.db.updateQIProject(companyId, projectId, updateData);
    logger.info(`QI project ${project.projectNumber} status updated to ${status}`);

    return updated!;
  }

  static async addQIIntervention(
    companyId: string,
    projectId: string,
    intervention: Omit<QIIntervention, 'id'>
  ): Promise<QualityImprovementProject> {
    const project = await this.db.getQIProject(companyId, projectId);
    if (!project) {
      throw new Error('QI project not found');
    }

    const interventionWithId: QIIntervention = {
      ...intervention,
      id: uuidv4(),
    };

    const updatedInterventions = [...project.interventions, {
      ...interventionWithId,
      implementationDate: interventionWithId.implementationDate.toISOString(),
    }];

    const updated = await this.db.updateQIProject(companyId, projectId, {
      interventions: updatedInterventions,
    });

    logger.info(`Intervention added to project ${project.projectNumber}`);

    return updated!;
  }

  static async getQIProjectById(companyId: string, id: string): Promise<QualityImprovementProject | undefined> {
    return await this.db.getQIProject(companyId, id);
  }

  static async getQIProjects(companyId: string, status?: QualityImprovementProject['status']): Promise<QualityImprovementProject[]> {
    return await this.db.getQIProjects(companyId, status ? { status } : {});
  }

  // ============================================================================
  // PDSA Cycles
  // ============================================================================

  static createPDSACycle(data: {
    projectId: string;
    plan: PDSACycle['plan'];
    createdBy: string;
  }): PDSACycle {
    const id = uuidv4();
    const project = this.projects.get(data.projectId);

    if (!project) {
      throw new Error('QI project not found');
    }

    const cycleNumber = project.pdsaCycles.length + 1;

    const cycle: PDSACycle = {
      id,
      cycleNumber,
      projectId: data.projectId,
      status: 'plan',
      plan: data.plan,
      do: {
        observations: [],
        dataCollected: [],
        issues: [],
      },
      study: {
        results: [],
        comparedToObjective: '',
        learnings: [],
        unexpectedFindings: [],
      },
      act: {
        decision: 'adapt',
        nextSteps: [],
        changesAdopted: [],
        nextCycleChanges: [],
      },
      startDate: new Date(),
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.pdsaCycles.set(id, cycle);

    // Add to project
    project.pdsaCycles.push(id);
    this.projects.set(data.projectId, project);

    logger.info(`PDSA Cycle ${cycleNumber} created for project ${project.projectNumber}`);

    return cycle;
  }

  static updatePDSAPhase(
    cycleId: string,
    phase: 'do' | 'study' | 'act',
    data: Partial<PDSACycle['do' | 'study' | 'act']>
  ): PDSACycle {
    const cycle = this.pdsaCycles.get(cycleId);
    if (!cycle) {
      throw new Error('PDSA cycle not found');
    }

    Object.assign(cycle[phase], data);

    // Update status
    if (phase === 'do' && cycle.status === 'plan') {
      cycle.status = 'do';
    } else if (phase === 'study' && cycle.status === 'do') {
      cycle.status = 'study';
    } else if (phase === 'act' && cycle.status === 'study') {
      cycle.status = 'act';
    }

    cycle.updatedAt = new Date();
    this.pdsaCycles.set(cycleId, cycle);

    logger.info(`PDSA Cycle ${cycle.cycleNumber} updated: ${phase} phase`);

    return cycle;
  }

  static completePDSACycle(cycleId: string): PDSACycle {
    const cycle = this.pdsaCycles.get(cycleId);
    if (!cycle) {
      throw new Error('PDSA cycle not found');
    }

    cycle.status = 'completed';
    cycle.completionDate = new Date();
    cycle.updatedAt = new Date();

    this.pdsaCycles.set(cycleId, cycle);
    logger.info(`PDSA Cycle ${cycle.cycleNumber} completed`);

    return cycle;
  }

  static getPDSACycleById(id: string): PDSACycle | undefined {
    return this.pdsaCycles.get(id);
  }

  static getPDSACyclesByProject(projectId: string): PDSACycle[] {
    return Array.from(this.pdsaCycles.values())
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => a.cycleNumber - b.cycleNumber);
  }

  // ============================================================================
  // Care Bundles
  // ============================================================================

  static createCareBundle(data: {
    bundleId: string;
    name: string;
    description: string;
    category: string;
    elements: Omit<BundleElement, 'id'>[];
    evidenceBase: string;
    targetPopulation: string;
    createdBy: string;
  }): CareBundle {
    const id = uuidv4();

    const elementsWithIds: BundleElement[] = data.elements.map((e) => ({
      ...e,
      id: uuidv4(),
    }));

    const bundle: CareBundle = {
      id,
      bundleId: data.bundleId,
      name: data.name,
      description: data.description,
      category: data.category,
      elements: elementsWithIds,
      evidenceBase: data.evidenceBase,
      targetPopulation: data.targetPopulation,
      active: true,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.careBundles.set(id, bundle);
    logger.info(`Care bundle created: ${data.bundleId} - ${data.name}`);

    return bundle;
  }

  static assessBundleCompliance(data: {
    bundleId: string;
    encounterId: string;
    patientId: string;
    elementCompliance: Omit<ElementCompliance, 'elementId'>[];
    assessedBy: string;
  }): BundleCompliance {
    const id = uuidv4();
    const bundle = Array.from(this.careBundles.values()).find((b) => b.bundleId === data.bundleId);

    if (!bundle) {
      throw new Error('Care bundle not found');
    }

    // Map compliance to elements
    const elementCompliance: ElementCompliance[] = bundle.elements.map((element, index) => ({
      elementId: element.id,
      ...(data.elementCompliance[index] || {
        compliant: false,
        notApplicable: false,
      }),
    }));

    // Calculate compliance rate (excluding N/A)
    const applicableElements = elementCompliance.filter((ec) => !ec.notApplicable);
    const compliantElements = applicableElements.filter((ec) => ec.compliant);
    const complianceRate =
      applicableElements.length > 0
        ? (compliantElements.length / applicableElements.length) * 100
        : 0;

    // Check if all critical elements are compliant
    const criticalElements = bundle.elements.filter((e) => e.criticalElement);
    const criticalCompliance = criticalElements.every((ce) => {
      const compliance = elementCompliance.find((ec) => ec.elementId === ce.id);
      return compliance && (compliance.compliant || compliance.notApplicable);
    });

    const compliance: BundleCompliance = {
      id,
      bundleId: data.bundleId,
      encounterId: data.encounterId,
      patientId: data.patientId,
      assessmentDate: new Date(),
      elementCompliance,
      overallCompliance: criticalCompliance && complianceRate === 100,
      complianceRate: Math.round(complianceRate * 100) / 100,
      assessedBy: data.assessedBy,
      createdAt: new Date(),
    };

    this.bundleCompliance.set(id, compliance);
    logger.info(`Bundle compliance assessed: ${data.bundleId} - ${complianceRate}% compliant`);

    return compliance;
  }

  static getCareBundleById(id: string): CareBundle | undefined {
    return this.careBundles.get(id);
  }

  static getCareBundles(activeOnly: boolean = true): CareBundle[] {
    let bundles = Array.from(this.careBundles.values());

    if (activeOnly) {
      bundles = bundles.filter((b) => b.active);
    }

    return bundles;
  }

  static getBundleCompliance(bundleId?: string): BundleCompliance[] {
    let compliance = Array.from(this.bundleCompliance.values());

    if (bundleId) {
      compliance = compliance.filter((c) => c.bundleId === bundleId);
    }

    return compliance.sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
  }

  static getBundleComplianceStats(bundleId: string, startDate?: Date, endDate?: Date): {
    totalAssessments: number;
    overallComplianceRate: number;
    perfectComplianceCount: number;
    perfectComplianceRate: number;
    elementCompliance: {
      elementId: string;
      description: string;
      complianceRate: number;
      complianceCount: number;
      totalAssessments: number;
    }[];
  } {
    const bundle = Array.from(this.careBundles.values()).find((b) => b.bundleId === bundleId);
    if (!bundle) {
      throw new Error('Care bundle not found');
    }

    let assessments = this.getBundleCompliance(bundleId);

    if (startDate) {
      assessments = assessments.filter((a) => a.assessmentDate >= startDate);
    }
    if (endDate) {
      assessments = assessments.filter((a) => a.assessmentDate <= endDate);
    }

    const totalAssessments = assessments.length;
    const perfectCompliance = assessments.filter((a) => a.overallCompliance).length;
    const perfectComplianceRate =
      totalAssessments > 0 ? (perfectCompliance / totalAssessments) * 100 : 0;

    const totalComplianceRate =
      totalAssessments > 0
        ? assessments.reduce((sum, a) => sum + a.complianceRate, 0) / totalAssessments
        : 0;

    // Calculate per-element compliance
    const elementStats = bundle.elements.map((element) => {
      const elementAssessments = assessments.map((a) =>
        a.elementCompliance.find((ec) => ec.elementId === element.id)
      );

      const applicableCount = elementAssessments.filter((ec) => ec && !ec.notApplicable).length;
      const compliantCount = elementAssessments.filter((ec) => ec && ec.compliant).length;
      const complianceRate = applicableCount > 0 ? (compliantCount / applicableCount) * 100 : 0;

      return {
        elementId: element.id,
        description: element.description,
        complianceRate: Math.round(complianceRate * 100) / 100,
        complianceCount: compliantCount,
        totalAssessments: applicableCount,
      };
    });

    return {
      totalAssessments,
      overallComplianceRate: Math.round(totalComplianceRate * 100) / 100,
      perfectComplianceCount: perfectCompliance,
      perfectComplianceRate: Math.round(perfectComplianceRate * 100) / 100,
      elementCompliance: elementStats,
    };
  }

  // ============================================================================
  // Performance Improvement
  // ============================================================================

  static createPerformanceImprovement(data: {
    name: string;
    description: string;
    metric: string;
    baselineValue: number;
    baselineDate: Date;
    targetValue: number;
    targetDate: Date;
    createdBy: string;
  }): PerformanceImprovement {
    const id = uuidv4();

    const improvement: PerformanceImprovement = {
      id,
      name: data.name,
      description: data.description,
      metric: data.metric,
      baselineValue: data.baselineValue,
      baselineDate: data.baselineDate,
      targetValue: data.targetValue,
      targetDate: data.targetDate,
      currentValue: data.baselineValue,
      currentDate: data.baselineDate,
      improvement: 0,
      improvementPercentage: 0,
      trend: 'stable',
      status: 'active',
      dataPoints: [
        {
          date: data.baselineDate,
          value: data.baselineValue,
          notes: 'Baseline measurement',
        },
      ],
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.performanceImprovements.set(id, improvement);
    logger.info(`Performance improvement created: ${data.name}`);

    return improvement;
  }

  static addDataPoint(
    improvementId: string,
    dataPoint: Omit<DataPoint, 'date'> & { date?: Date }
  ): PerformanceImprovement {
    const improvement = this.performanceImprovements.get(improvementId);
    if (!improvement) {
      throw new Error('Performance improvement not found');
    }

    const newDataPoint: DataPoint = {
      date: dataPoint.date || new Date(),
      value: dataPoint.value,
      notes: dataPoint.notes,
    };

    improvement.dataPoints.push(newDataPoint);
    improvement.currentValue = dataPoint.value;
    improvement.currentDate = newDataPoint.date;

    // Calculate improvement
    improvement.improvement = dataPoint.value - improvement.baselineValue;
    improvement.improvementPercentage =
      improvement.baselineValue !== 0
        ? (improvement.improvement / improvement.baselineValue) * 100
        : 0;

    // Determine trend (simplified - last 3 data points)
    if (improvement.dataPoints.length >= 3) {
      const recent = improvement.dataPoints.slice(-3);
      const isImproving = recent.every((dp, i) => i === 0 || dp.value >= recent[i - 1].value);
      const isDeclining = recent.every((dp, i) => i === 0 || dp.value <= recent[i - 1].value);

      improvement.trend = isImproving ? 'improving' : isDeclining ? 'declining' : 'stable';
    }

    // Check if target met
    if (
      (improvement.targetValue > improvement.baselineValue &&
        dataPoint.value >= improvement.targetValue) ||
      (improvement.targetValue < improvement.baselineValue &&
        dataPoint.value <= improvement.targetValue)
    ) {
      improvement.status = 'met';
    }

    improvement.updatedAt = new Date();
    this.performanceImprovements.set(improvementId, improvement);

    logger.info(`Data point added to performance improvement ${improvement.name}`);

    return improvement;
  }

  static getPerformanceImprovementById(id: string): PerformanceImprovement | undefined {
    return this.performanceImprovements.get(id);
  }

  static getPerformanceImprovements(
    status?: PerformanceImprovement['status']
  ): PerformanceImprovement[] {
    let improvements = Array.from(this.performanceImprovements.values());

    if (status) {
      improvements = improvements.filter((i) => i.status === status);
    }

    return improvements;
  }

  // ============================================================================
  // Best Practices
  // ============================================================================

  static createBestPractice(data: {
    practiceId: string;
    name: string;
    description: string;
    category: string;
    clinicalArea: string;
    evidenceLevel: BestPractice['evidenceLevel'];
    evidenceSource: string;
    implementation: string;
    outcomes: string[];
    owner: string;
  }): BestPractice {
    const id = uuidv4();

    const bestPractice: BestPractice = {
      id,
      practiceId: data.practiceId,
      name: data.name,
      description: data.description,
      category: data.category,
      clinicalArea: data.clinicalArea,
      evidenceLevel: data.evidenceLevel,
      evidenceSource: data.evidenceSource,
      implementation: data.implementation,
      outcomes: data.outcomes,
      adoptionStatus: 'proposed',
      owner: data.owner,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bestPractices.set(id, bestPractice);
    logger.info(`Best practice created: ${data.practiceId} - ${data.name}`);

    return bestPractice;
  }

  static updateBestPracticeStatus(
    id: string,
    status: BestPractice['adoptionStatus']
  ): BestPractice {
    const practice = this.bestPractices.get(id);
    if (!practice) {
      throw new Error('Best practice not found');
    }

    practice.adoptionStatus = status;
    if (status === 'adopted' && !practice.adoptionDate) {
      practice.adoptionDate = new Date();
    }
    practice.updatedAt = new Date();

    this.bestPractices.set(id, practice);
    logger.info(`Best practice ${practice.practiceId} status updated to ${status}`);

    return practice;
  }

  static getBestPracticeById(id: string): BestPractice | undefined {
    return this.bestPractices.get(id);
  }

  static getBestPractices(activeOnly: boolean = true): BestPractice[] {
    let practices = Array.from(this.bestPractices.values());

    if (activeOnly) {
      practices = practices.filter((p) => p.active);
    }

    return practices;
  }

  // ============================================================================
  // Default Data Initialization
  // ============================================================================

  private static initializeDefaultBundles(): void {
    // Sepsis Bundle
    this.createCareBundle({
      bundleId: 'SEP-3',
      name: 'Sepsis-3 Hour Bundle',
      description: 'Evidence-based bundle for early sepsis management',
      category: 'Critical Care',
      elements: [
        {
          elementNumber: 1,
          description: 'Measure lactate level',
          specification: 'Lactate measured within 3 hours of presentation',
          frequency: 'Once on presentation',
          responsible: 'ED Nurse/Physician',
          criticalElement: true,
        },
        {
          elementNumber: 2,
          description: 'Obtain blood cultures prior to antibiotics',
          specification: 'At least 2 sets of blood cultures drawn before antibiotic administration',
          frequency: 'Once prior to antibiotics',
          responsible: 'ED Nurse',
          criticalElement: true,
        },
        {
          elementNumber: 3,
          description: 'Administer broad-spectrum antibiotics',
          specification: 'Broad-spectrum antibiotics administered within 3 hours',
          frequency: 'Once within 3 hours',
          responsible: 'ED Nurse',
          criticalElement: true,
        },
        {
          elementNumber: 4,
          description: 'Begin rapid administration of crystalloid for hypotension or lactate ≥4',
          specification: '30 mL/kg crystalloid for hypotension or lactate ≥4 mmol/L',
          frequency: 'Once if indicated',
          responsible: 'ED Nurse/Physician',
          criticalElement: true,
        },
      ],
      evidenceBase: 'Surviving Sepsis Campaign Guidelines 2021',
      targetPopulation: 'Patients with suspected or confirmed sepsis',
      createdBy: 'system',
    });

    // Central Line Bundle
    this.createCareBundle({
      bundleId: 'CLABSI',
      name: 'Central Line Insertion Bundle',
      description: 'Evidence-based bundle to prevent central line-associated bloodstream infections',
      category: 'Infection Prevention',
      elements: [
        {
          elementNumber: 1,
          description: 'Hand hygiene',
          specification: 'Perform hand hygiene before catheter insertion',
          frequency: 'Before insertion',
          responsible: 'All team members',
          criticalElement: true,
        },
        {
          elementNumber: 2,
          description: 'Maximal barrier precautions',
          specification: 'Use cap, mask, sterile gown, sterile gloves, and full-body drape',
          frequency: 'During insertion',
          responsible: 'Inserting physician',
          criticalElement: true,
        },
        {
          elementNumber: 3,
          description: 'Chlorhexidine skin antisepsis',
          specification: 'Cleanse skin with >0.5% chlorhexidine with alcohol',
          frequency: 'Before insertion',
          responsible: 'Inserting physician',
          criticalElement: true,
        },
        {
          elementNumber: 4,
          description: 'Optimal catheter site selection',
          specification: 'Avoid femoral vein for central venous access in adult patients',
          frequency: 'During site selection',
          responsible: 'Inserting physician',
          criticalElement: true,
        },
        {
          elementNumber: 5,
          description: 'Daily review of line necessity',
          specification: 'Review daily and remove if no longer necessary',
          frequency: 'Daily',
          responsible: 'Care team',
          criticalElement: true,
        },
      ],
      evidenceBase: 'CDC Guidelines for Prevention of CLABSI 2011',
      targetPopulation: 'All patients requiring central venous catheter',
      createdBy: 'system',
    });

    // Heart Failure Bundle
    this.createCareBundle({
      bundleId: 'HF-ADMIT',
      name: 'Heart Failure Admission Bundle',
      description: 'Evidence-based care for patients admitted with heart failure',
      category: 'Cardiology',
      elements: [
        {
          elementNumber: 1,
          description: 'Initiate GDMT within 24 hours',
          specification: 'Start guideline-directed medical therapy for heart failure',
          frequency: 'Within 24 hours',
          responsible: 'Cardiologist/Hospitalist',
          criticalElement: true,
        },
        {
          elementNumber: 2,
          description: 'Daily weights',
          specification: 'Measure and document weight daily',
          frequency: 'Daily',
          responsible: 'Nursing',
          criticalElement: false,
        },
        {
          elementNumber: 3,
          description: 'Discharge education',
          specification: 'Provide structured discharge education including weight monitoring, diet, medications',
          frequency: 'Prior to discharge',
          responsible: 'RN/Pharmacist',
          criticalElement: true,
        },
        {
          elementNumber: 4,
          description: 'Follow-up appointment scheduled',
          specification: 'Schedule follow-up within 7 days of discharge',
          frequency: 'Prior to discharge',
          responsible: 'Care Coordinator',
          criticalElement: true,
        },
      ],
      evidenceBase: 'AHA/ACC Heart Failure Guidelines 2022',
      targetPopulation: 'Patients admitted with acute decompensated heart failure',
      createdBy: 'system',
    });

    logger.info('Default care bundles initialized');
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================

  static getStatistics(): {
    projects: {
      total: number;
      active: number;
      completed: number;
      byPriority: { priority: string; count: number }[];
    };
    pdsaCycles: {
      total: number;
      completed: number;
      byStatus: { status: string; count: number }[];
    };
    careBundles: {
      total: number;
      active: number;
      averageComplianceRate: number;
      perfectComplianceRate: number;
    };
    performanceImprovements: {
      total: number;
      active: number;
      targetsMet: number;
      improving: number;
      declining: number;
    };
    bestPractices: {
      total: number;
      adopted: number;
      sustained: number;
      byEvidenceLevel: { level: string; count: number }[];
    };
  } {
    // Projects
    const projects = Array.from(this.projects.values());
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;

    const projectsByPriority = new Map<string, number>();
    for (const project of projects) {
      const count = projectsByPriority.get(project.priority) || 0;
      projectsByPriority.set(project.priority, count + 1);
    }

    // PDSA Cycles
    const cycles = Array.from(this.pdsaCycles.values());
    const completedCycles = cycles.filter((c) => c.status === 'completed').length;

    const cyclesByStatus = new Map<string, number>();
    for (const cycle of cycles) {
      const count = cyclesByStatus.get(cycle.status) || 0;
      cyclesByStatus.set(cycle.status, count + 1);
    }

    // Care Bundles
    const bundles = Array.from(this.careBundles.values());
    const activeBundles = bundles.filter((b) => b.active).length;

    const allCompliance = Array.from(this.bundleCompliance.values());
    const averageComplianceRate =
      allCompliance.length > 0
        ? allCompliance.reduce((sum, c) => sum + c.complianceRate, 0) / allCompliance.length
        : 0;
    const perfectCompliance = allCompliance.filter((c) => c.overallCompliance).length;
    const perfectComplianceRate =
      allCompliance.length > 0 ? (perfectCompliance / allCompliance.length) * 100 : 0;

    // Performance Improvements
    const improvements = Array.from(this.performanceImprovements.values());
    const activeImprovements = improvements.filter((i) => i.status === 'active').length;
    const targetsMet = improvements.filter((i) => i.status === 'met').length;
    const improving = improvements.filter((i) => i.trend === 'improving').length;
    const declining = improvements.filter((i) => i.trend === 'declining').length;

    // Best Practices
    const practices = Array.from(this.bestPractices.values());
    const adoptedPractices = practices.filter((p) => p.adoptionStatus === 'adopted').length;
    const sustainedPractices = practices.filter((p) => p.adoptionStatus === 'sustained').length;

    const practicesByLevel = new Map<string, number>();
    for (const practice of practices) {
      const count = practicesByLevel.get(practice.evidenceLevel) || 0;
      practicesByLevel.set(practice.evidenceLevel, count + 1);
    }

    return {
      projects: {
        total: projects.length,
        active: activeProjects,
        completed: completedProjects,
        byPriority: Array.from(projectsByPriority.entries()).map(([priority, count]) => ({
          priority,
          count,
        })),
      },
      pdsaCycles: {
        total: cycles.length,
        completed: completedCycles,
        byStatus: Array.from(cyclesByStatus.entries()).map(([status, count]) => ({
          status,
          count,
        })),
      },
      careBundles: {
        total: bundles.length,
        active: activeBundles,
        averageComplianceRate: Math.round(averageComplianceRate * 100) / 100,
        perfectComplianceRate: Math.round(perfectComplianceRate * 100) / 100,
      },
      performanceImprovements: {
        total: improvements.length,
        active: activeImprovements,
        targetsMet,
        improving,
        declining,
      },
      bestPractices: {
        total: practices.length,
        adopted: adoptedPractices,
        sustained: sustainedPractices,
        byEvidenceLevel: Array.from(practicesByLevel.entries()).map(([level, count]) => ({
          level,
          count,
        })),
      },
    };
  }
}
