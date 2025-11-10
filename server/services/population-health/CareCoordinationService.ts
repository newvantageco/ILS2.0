import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

// ============================================================================
// Care Coordination Types
// ============================================================================

export interface CarePlan {
  id: string;
  patientId: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  category: 'chronic_disease' | 'preventive' | 'transitional' | 'behavioral_health' | 'other';
  goals: CareGoal[];
  interventions: CareIntervention[];
  careTeamId?: string;
  startDate: Date;
  endDate?: Date;
  reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  nextReviewDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareGoal {
  id: string;
  description: string;
  targetDate: Date;
  status: 'not_started' | 'in_progress' | 'achieved' | 'not_achieved' | 'cancelled';
  measurableOutcome: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  progress: number;
  barriers: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareIntervention {
  id: string;
  type: 'education' | 'medication' | 'monitoring' | 'lifestyle' | 'referral' | 'therapy' | 'other';
  description: string;
  frequency: string;
  assignedTo?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  outcomes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CareTeam {
  id: string;
  name: string;
  patientId: string;
  description: string;
  members: CareTeamMember[];
  status: 'active' | 'inactive';
  primaryContact?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareTeamMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  specialty?: string;
  isPrimary: boolean;
  responsibilities: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    extension?: string;
  };
  joinedDate: Date;
  status: 'active' | 'inactive';
}

export interface CareGap {
  id: string;
  patientId: string;
  gapType: string;
  category: 'preventive' | 'chronic_care' | 'medication' | 'screening' | 'follow_up';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'closed' | 'not_applicable';
  identifiedDate: Date;
  dueDate: Date;
  closedDate?: Date;
  recommendations: string[];
  assignedTo?: string;
  evidence: string;
  measure?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransitionOfCare {
  id: string;
  patientId: string;
  transitionType:
    | 'hospital_to_home'
    | 'hospital_to_snf'
    | 'snf_to_home'
    | 'er_to_home'
    | 'specialist_referral'
    | 'other';
  fromLocation: string;
  toLocation: string;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  dischargeDate?: Date;
  admissionDate?: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpCompleted: boolean;
  medications: MedicationReconciliation[];
  careInstructions: string[];
  riskFactors: string[];
  responsibleProvider?: string;
  coordinatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationReconciliation {
  medicationId: string;
  medicationName: string;
  action: 'continue' | 'new' | 'discontinued' | 'changed';
  previousDose?: string;
  newDose?: string;
  reason?: string;
  reconciledBy: string;
  reconciledDate: Date;
}

export interface CareCoordinationTask {
  id: string;
  patientId: string;
  carePlanId?: string;
  transitionId?: string;
  gapId?: string;
  title: string;
  description: string;
  type: 'outreach' | 'follow_up' | 'assessment' | 'referral' | 'education' | 'coordination' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate: Date;
  completedDate?: Date;
  completedBy?: string;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientOutreach {
  id: string;
  patientId: string;
  taskId?: string;
  outreachType: 'phone' | 'email' | 'sms' | 'mail' | 'in_person' | 'portal';
  purpose: string;
  status: 'scheduled' | 'attempted' | 'completed' | 'failed' | 'cancelled';
  scheduledDate?: Date;
  attemptedDate?: Date;
  completedDate?: Date;
  contactResult?: 'successful' | 'no_answer' | 'left_message' | 'wrong_number' | 'declined';
  notes: string;
  nextSteps: string[];
  performedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Care Coordination Service
// ============================================================================

export class CareCoordinationService {
  private static carePlans: Map<string, CarePlan> = new Map();
  private static careTeams: Map<string, CareTeam> = new Map();
  private static careGaps: Map<string, CareGap> = new Map();
  private static transitions: Map<string, TransitionOfCare> = new Map();
  private static tasks: Map<string, CareCoordinationTask> = new Map();
  private static outreach: Map<string, PatientOutreach> = new Map();

  // ============================================================================
  // Care Plan Management
  // ============================================================================

  static createCarePlan(data: {
    patientId: string;
    name: string;
    description: string;
    category: CarePlan['category'];
    startDate: Date;
    reviewFrequency: CarePlan['reviewFrequency'];
    createdBy: string;
  }): CarePlan {
    const id = uuidv4();

    // Calculate next review date
    const nextReviewDate = this.calculateNextReviewDate(data.startDate, data.reviewFrequency);

    const carePlan: CarePlan = {
      id,
      patientId: data.patientId,
      name: data.name,
      description: data.description,
      status: 'draft',
      category: data.category,
      goals: [],
      interventions: [],
      startDate: data.startDate,
      reviewFrequency: data.reviewFrequency,
      nextReviewDate,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.carePlans.set(id, carePlan);
    logger.info(`Care plan created for patient ${data.patientId}: ${data.name}`);

    return carePlan;
  }

  static addCareGoal(carePlanId: string, goal: Omit<CareGoal, 'id' | 'createdAt' | 'updatedAt'>): CarePlan {
    const carePlan = this.carePlans.get(carePlanId);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    const careGoal: CareGoal = {
      ...goal,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    carePlan.goals.push(careGoal);
    carePlan.updatedAt = new Date();

    this.carePlans.set(carePlanId, carePlan);
    logger.info(`Care goal added to plan ${carePlanId}`);

    return carePlan;
  }

  static updateCareGoal(
    carePlanId: string,
    goalId: string,
    updates: Partial<Omit<CareGoal, 'id' | 'createdAt' | 'updatedAt'>>
  ): CarePlan {
    const carePlan = this.carePlans.get(carePlanId);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    const goalIndex = carePlan.goals.findIndex((g) => g.id === goalId);
    if (goalIndex === -1) {
      throw new Error('Care goal not found');
    }

    carePlan.goals[goalIndex] = {
      ...carePlan.goals[goalIndex],
      ...updates,
      updatedAt: new Date(),
    };

    carePlan.updatedAt = new Date();
    this.carePlans.set(carePlanId, carePlan);

    logger.info(`Care goal ${goalId} updated`);
    return carePlan;
  }

  static addCareIntervention(
    carePlanId: string,
    intervention: Omit<CareIntervention, 'id' | 'createdAt' | 'updatedAt'>
  ): CarePlan {
    const carePlan = this.carePlans.get(carePlanId);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    const careIntervention: CareIntervention = {
      ...intervention,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    carePlan.interventions.push(careIntervention);
    carePlan.updatedAt = new Date();

    this.carePlans.set(carePlanId, carePlan);
    logger.info(`Care intervention added to plan ${carePlanId}`);

    return carePlan;
  }

  static activateCarePlan(carePlanId: string): CarePlan {
    const carePlan = this.carePlans.get(carePlanId);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    if (carePlan.goals.length === 0) {
      throw new Error('Cannot activate care plan without goals');
    }

    carePlan.status = 'active';
    carePlan.updatedAt = new Date();

    this.carePlans.set(carePlanId, carePlan);
    logger.info(`Care plan activated: ${carePlanId}`);

    return carePlan;
  }

  static updateCarePlanStatus(
    carePlanId: string,
    status: CarePlan['status']
  ): CarePlan {
    const carePlan = this.carePlans.get(carePlanId);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    carePlan.status = status;
    if (status === 'completed' || status === 'cancelled') {
      carePlan.endDate = new Date();
    }
    carePlan.updatedAt = new Date();

    this.carePlans.set(carePlanId, carePlan);
    logger.info(`Care plan status updated: ${carePlanId} -> ${status}`);

    return carePlan;
  }

  static getCarePlanById(id: string): CarePlan | undefined {
    return this.carePlans.get(id);
  }

  static getCarePlansByPatient(patientId: string): CarePlan[] {
    return Array.from(this.carePlans.values()).filter((plan) => plan.patientId === patientId);
  }

  static getActiveCarePlans(): CarePlan[] {
    return Array.from(this.carePlans.values()).filter((plan) => plan.status === 'active');
  }

  static getCarePlansDueForReview(daysAhead: number = 7): CarePlan[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Array.from(this.carePlans.values()).filter(
      (plan) => plan.status === 'active' && plan.nextReviewDate <= futureDate
    );
  }

  private static calculateNextReviewDate(
    fromDate: Date,
    frequency: CarePlan['reviewFrequency']
  ): Date {
    const nextDate = new Date(fromDate);

    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
    }

    return nextDate;
  }

  // ============================================================================
  // Care Team Management
  // ============================================================================

  static createCareTeam(data: {
    name: string;
    patientId: string;
    description: string;
    createdBy: string;
  }): CareTeam {
    const id = uuidv4();

    const careTeam: CareTeam = {
      id,
      name: data.name,
      patientId: data.patientId,
      description: data.description,
      members: [],
      status: 'active',
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.careTeams.set(id, careTeam);
    logger.info(`Care team created for patient ${data.patientId}`);

    return careTeam;
  }

  static addCareTeamMember(
    careTeamId: string,
    member: Omit<CareTeamMember, 'id' | 'joinedDate' | 'status'>
  ): CareTeam {
    const careTeam = this.careTeams.get(careTeamId);
    if (!careTeam) {
      throw new Error('Care team not found');
    }

    // If this member is set as primary, unset others
    if (member.isPrimary) {
      careTeam.members.forEach((m) => (m.isPrimary = false));
      careTeam.primaryContact = member.userId;
    }

    const careTeamMember: CareTeamMember = {
      ...member,
      id: uuidv4(),
      joinedDate: new Date(),
      status: 'active',
    };

    careTeam.members.push(careTeamMember);
    careTeam.updatedAt = new Date();

    this.careTeams.set(careTeamId, careTeam);
    logger.info(`Member added to care team ${careTeamId}`);

    return careTeam;
  }

  static removeCareTeamMember(careTeamId: string, memberId: string): CareTeam {
    const careTeam = this.careTeams.get(careTeamId);
    if (!careTeam) {
      throw new Error('Care team not found');
    }

    const memberIndex = careTeam.members.findIndex((m) => m.id === memberId);
    if (memberIndex !== -1) {
      careTeam.members[memberIndex].status = 'inactive';
      careTeam.updatedAt = new Date();

      this.careTeams.set(careTeamId, careTeam);
      logger.info(`Member removed from care team ${careTeamId}`);
    }

    return careTeam;
  }

  static getCareTeamById(id: string): CareTeam | undefined {
    return this.careTeams.get(id);
  }

  static getCareTeamsByPatient(patientId: string): CareTeam[] {
    return Array.from(this.careTeams.values()).filter((team) => team.patientId === patientId);
  }

  // ============================================================================
  // Care Gap Management
  // ============================================================================

  static identifyCareGap(data: {
    patientId: string;
    gapType: string;
    category: CareGap['category'];
    description: string;
    severity: CareGap['severity'];
    dueDate: Date;
    recommendations: string[];
    evidence: string;
    measure?: string;
  }): CareGap {
    const id = uuidv4();

    const careGap: CareGap = {
      id,
      patientId: data.patientId,
      gapType: data.gapType,
      category: data.category,
      description: data.description,
      severity: data.severity,
      status: 'open',
      identifiedDate: new Date(),
      dueDate: data.dueDate,
      recommendations: data.recommendations,
      evidence: data.evidence,
      measure: data.measure,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.careGaps.set(id, careGap);
    logger.info(`Care gap identified for patient ${data.patientId}: ${data.gapType}`);

    // Auto-create task for high/critical gaps
    if (data.severity === 'high' || data.severity === 'critical') {
      this.createCareCoordinationTask({
        patientId: data.patientId,
        gapId: id,
        title: `Address care gap: ${data.gapType}`,
        description: data.description,
        type: 'assessment',
        priority: data.severity === 'critical' ? 'urgent' : 'high',
        dueDate: data.dueDate,
        createdBy: 'system',
      });
    }

    return careGap;
  }

  static updateCareGap(
    id: string,
    updates: {
      status?: CareGap['status'];
      assignedTo?: string;
      closedDate?: Date;
    }
  ): CareGap {
    const careGap = this.careGaps.get(id);
    if (!careGap) {
      throw new Error('Care gap not found');
    }

    if (updates.status) careGap.status = updates.status;
    if (updates.assignedTo) careGap.assignedTo = updates.assignedTo;
    if (updates.closedDate) careGap.closedDate = updates.closedDate;

    if (updates.status === 'closed' && !careGap.closedDate) {
      careGap.closedDate = new Date();
    }

    careGap.updatedAt = new Date();

    this.careGaps.set(id, careGap);
    logger.info(`Care gap updated: ${id} -> ${updates.status}`);

    return careGap;
  }

  static getCareGapById(id: string): CareGap | undefined {
    return this.careGaps.get(id);
  }

  static getCareGapsByPatient(patientId: string): CareGap[] {
    return Array.from(this.careGaps.values()).filter((gap) => gap.patientId === patientId);
  }

  static getOpenCareGaps(category?: CareGap['category']): CareGap[] {
    return Array.from(this.careGaps.values()).filter(
      (gap) => gap.status === 'open' && (!category || gap.category === category)
    );
  }

  static getOverdueCareGaps(): CareGap[] {
    const now = new Date();
    return Array.from(this.careGaps.values()).filter(
      (gap) => gap.status === 'open' && gap.dueDate < now
    );
  }

  // ============================================================================
  // Transitions of Care
  // ============================================================================

  static createTransitionOfCare(data: {
    patientId: string;
    transitionType: TransitionOfCare['transitionType'];
    fromLocation: string;
    toLocation: string;
    dischargeDate?: Date;
    admissionDate?: Date;
    followUpRequired: boolean;
    followUpDate?: Date;
    careInstructions: string[];
    riskFactors: string[];
    responsibleProvider?: string;
    coordinatedBy: string;
  }): TransitionOfCare {
    const id = uuidv4();

    const transition: TransitionOfCare = {
      id,
      patientId: data.patientId,
      transitionType: data.transitionType,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      status: 'planned',
      dischargeDate: data.dischargeDate,
      admissionDate: data.admissionDate,
      followUpRequired: data.followUpRequired,
      followUpDate: data.followUpDate,
      followUpCompleted: false,
      medications: [],
      careInstructions: data.careInstructions,
      riskFactors: data.riskFactors,
      responsibleProvider: data.responsibleProvider,
      coordinatedBy: data.coordinatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transitions.set(id, transition);
    logger.info(`Transition of care created for patient ${data.patientId}`);

    // Create follow-up task if required
    if (data.followUpRequired && data.followUpDate) {
      this.createCareCoordinationTask({
        patientId: data.patientId,
        transitionId: id,
        title: `Follow-up after ${data.transitionType}`,
        description: `Follow-up appointment required after transition from ${data.fromLocation} to ${data.toLocation}`,
        type: 'follow_up',
        priority: 'high',
        dueDate: data.followUpDate,
        createdBy: data.coordinatedBy,
      });
    }

    return transition;
  }

  static addMedicationReconciliation(
    transitionId: string,
    reconciliation: MedicationReconciliation
  ): TransitionOfCare {
    const transition = this.transitions.get(transitionId);
    if (!transition) {
      throw new Error('Transition of care not found');
    }

    transition.medications.push(reconciliation);
    transition.updatedAt = new Date();

    this.transitions.set(transitionId, transition);
    logger.info(`Medication reconciliation added to transition ${transitionId}`);

    return transition;
  }

  static updateTransitionStatus(
    transitionId: string,
    status: TransitionOfCare['status']
  ): TransitionOfCare {
    const transition = this.transitions.get(transitionId);
    if (!transition) {
      throw new Error('Transition of care not found');
    }

    transition.status = status;
    transition.updatedAt = new Date();

    this.transitions.set(transitionId, transition);
    logger.info(`Transition status updated: ${transitionId} -> ${status}`);

    return transition;
  }

  static completeFollowUp(transitionId: string): TransitionOfCare {
    const transition = this.transitions.get(transitionId);
    if (!transition) {
      throw new Error('Transition of care not found');
    }

    transition.followUpCompleted = true;
    transition.updatedAt = new Date();

    this.transitions.set(transitionId, transition);
    logger.info(`Follow-up completed for transition ${transitionId}`);

    return transition;
  }

  static getTransitionById(id: string): TransitionOfCare | undefined {
    return this.transitions.get(id);
  }

  static getTransitionsByPatient(patientId: string): TransitionOfCare[] {
    return Array.from(this.transitions.values()).filter((t) => t.patientId === patientId);
  }

  static getPendingFollowUps(): TransitionOfCare[] {
    const now = new Date();
    return Array.from(this.transitions.values()).filter(
      (t) =>
        t.followUpRequired &&
        !t.followUpCompleted &&
        t.followUpDate &&
        t.followUpDate <= now
    );
  }

  // ============================================================================
  // Care Coordination Tasks
  // ============================================================================

  static createCareCoordinationTask(data: {
    patientId: string;
    carePlanId?: string;
    transitionId?: string;
    gapId?: string;
    title: string;
    description: string;
    type: CareCoordinationTask['type'];
    priority: CareCoordinationTask['priority'];
    dueDate: Date;
    assignedTo?: string;
    createdBy: string;
  }): CareCoordinationTask {
    const id = uuidv4();

    const task: CareCoordinationTask = {
      id,
      patientId: data.patientId,
      carePlanId: data.carePlanId,
      transitionId: data.transitionId,
      gapId: data.gapId,
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      status: 'pending',
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      notes: '',
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(id, task);
    logger.info(`Care coordination task created: ${data.title}`);

    return task;
  }

  static updateTaskStatus(
    taskId: string,
    status: CareCoordinationTask['status'],
    completedBy?: string,
    notes?: string
  ): CareCoordinationTask {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.status = status;
    if (status === 'completed') {
      task.completedDate = new Date();
      task.completedBy = completedBy;
    }
    if (notes) {
      task.notes = notes;
    }
    task.updatedAt = new Date();

    this.tasks.set(taskId, task);
    logger.info(`Task status updated: ${taskId} -> ${status}`);

    return task;
  }

  static assignTask(taskId: string, assignedTo: string): CareCoordinationTask {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.assignedTo = assignedTo;
    task.updatedAt = new Date();

    this.tasks.set(taskId, task);
    logger.info(`Task assigned: ${taskId} -> ${assignedTo}`);

    return task;
  }

  static getTaskById(id: string): CareCoordinationTask | undefined {
    return this.tasks.get(id);
  }

  static getTasksByPatient(patientId: string): CareCoordinationTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.patientId === patientId);
  }

  static getTasksByAssignee(userId: string): CareCoordinationTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.assignedTo === userId);
  }

  static getOverdueTasks(): CareCoordinationTask[] {
    const now = new Date();
    return Array.from(this.tasks.values()).filter(
      (task) => task.status !== 'completed' && task.status !== 'cancelled' && task.dueDate < now
    );
  }

  // ============================================================================
  // Patient Outreach
  // ============================================================================

  static createPatientOutreach(data: {
    patientId: string;
    taskId?: string;
    outreachType: PatientOutreach['outreachType'];
    purpose: string;
    scheduledDate?: Date;
    createdBy: string;
  }): PatientOutreach {
    const id = uuidv4();

    const outreach: PatientOutreach = {
      id,
      patientId: data.patientId,
      taskId: data.taskId,
      outreachType: data.outreachType,
      purpose: data.purpose,
      status: data.scheduledDate ? 'scheduled' : 'attempted',
      scheduledDate: data.scheduledDate,
      notes: '',
      nextSteps: [],
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.outreach.set(id, outreach);
    logger.info(`Patient outreach created for patient ${data.patientId}`);

    return outreach;
  }

  static recordOutreachAttempt(
    outreachId: string,
    data: {
      contactResult: PatientOutreach['contactResult'];
      notes: string;
      nextSteps: string[];
      performedBy: string;
    }
  ): PatientOutreach {
    const outreach = this.outreach.get(outreachId);
    if (!outreach) {
      throw new Error('Outreach not found');
    }

    outreach.status = data.contactResult === 'successful' ? 'completed' : 'attempted';
    outreach.attemptedDate = new Date();
    outreach.contactResult = data.contactResult;
    outreach.notes = data.notes;
    outreach.nextSteps = data.nextSteps;
    outreach.performedBy = data.performedBy;

    if (data.contactResult === 'successful') {
      outreach.completedDate = new Date();
    }

    outreach.updatedAt = new Date();

    this.outreach.set(outreachId, outreach);
    logger.info(`Outreach attempt recorded: ${outreachId}`);

    return outreach;
  }

  static getOutreachById(id: string): PatientOutreach | undefined {
    return this.outreach.get(id);
  }

  static getOutreachByPatient(patientId: string): PatientOutreach[] {
    return Array.from(this.outreach.values()).filter((o) => o.patientId === patientId);
  }

  static getScheduledOutreach(daysAhead: number = 7): PatientOutreach[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Array.from(this.outreach.values()).filter(
      (o) =>
        o.status === 'scheduled' &&
        o.scheduledDate &&
        o.scheduledDate <= futureDate
    );
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================

  static getStatistics(
    startDate?: Date,
    endDate?: Date
  ): {
    carePlans: {
      total: number;
      active: number;
      completed: number;
      byCategory: { category: string; count: number }[];
    };
    careGaps: {
      total: number;
      open: number;
      overdue: number;
      byCategory: { category: string; count: number }[];
      bySeverity: { severity: string; count: number }[];
    };
    transitions: {
      total: number;
      pendingFollowUps: number;
      completedFollowUps: number;
      byType: { type: string; count: number }[];
    };
    tasks: {
      total: number;
      pending: number;
      overdue: number;
      completed: number;
      byPriority: { priority: string; count: number }[];
    };
    outreach: {
      total: number;
      successful: number;
      successRate: number;
      byType: { type: string; count: number }[];
    };
  } {
    // Filter by date range
    const filterByDate = (item: { createdAt: Date }) => {
      if (startDate && item.createdAt < startDate) return false;
      if (endDate && item.createdAt > endDate) return false;
      return true;
    };

    const filteredCarePlans = Array.from(this.carePlans.values()).filter(filterByDate);
    const filteredGaps = Array.from(this.careGaps.values()).filter(filterByDate);
    const filteredTransitions = Array.from(this.transitions.values()).filter(filterByDate);
    const filteredTasks = Array.from(this.tasks.values()).filter(filterByDate);
    const filteredOutreach = Array.from(this.outreach.values()).filter(filterByDate);

    // Care Plans statistics
    const carePlansByCategory = new Map<string, number>();
    for (const plan of filteredCarePlans) {
      const count = carePlansByCategory.get(plan.category) || 0;
      carePlansByCategory.set(plan.category, count + 1);
    }

    // Care Gaps statistics
    const gapsByCategory = new Map<string, number>();
    const gapsBySeverity = new Map<string, number>();
    for (const gap of filteredGaps) {
      const catCount = gapsByCategory.get(gap.category) || 0;
      gapsByCategory.set(gap.category, catCount + 1);

      const sevCount = gapsBySeverity.get(gap.severity) || 0;
      gapsBySeverity.set(gap.severity, sevCount + 1);
    }

    // Transitions statistics
    const transitionsByType = new Map<string, number>();
    for (const transition of filteredTransitions) {
      const count = transitionsByType.get(transition.transitionType) || 0;
      transitionsByType.set(transition.transitionType, count + 1);
    }

    // Tasks statistics
    const tasksByPriority = new Map<string, number>();
    for (const task of filteredTasks) {
      const count = tasksByPriority.get(task.priority) || 0;
      tasksByPriority.set(task.priority, count + 1);
    }

    // Outreach statistics
    const outreachByType = new Map<string, number>();
    let successfulOutreach = 0;
    for (const o of filteredOutreach) {
      const count = outreachByType.get(o.outreachType) || 0;
      outreachByType.set(o.outreachType, count + 1);

      if (o.contactResult === 'successful') successfulOutreach++;
    }

    return {
      carePlans: {
        total: filteredCarePlans.length,
        active: filteredCarePlans.filter((p) => p.status === 'active').length,
        completed: filteredCarePlans.filter((p) => p.status === 'completed').length,
        byCategory: Array.from(carePlansByCategory.entries()).map(([category, count]) => ({
          category,
          count,
        })),
      },
      careGaps: {
        total: filteredGaps.length,
        open: filteredGaps.filter((g) => g.status === 'open').length,
        overdue: this.getOverdueCareGaps().length,
        byCategory: Array.from(gapsByCategory.entries()).map(([category, count]) => ({
          category,
          count,
        })),
        bySeverity: Array.from(gapsBySeverity.entries()).map(([severity, count]) => ({
          severity,
          count,
        })),
      },
      transitions: {
        total: filteredTransitions.length,
        pendingFollowUps: filteredTransitions.filter(
          (t) => t.followUpRequired && !t.followUpCompleted
        ).length,
        completedFollowUps: filteredTransitions.filter(
          (t) => t.followUpRequired && t.followUpCompleted
        ).length,
        byType: Array.from(transitionsByType.entries()).map(([type, count]) => ({
          type,
          count,
        })),
      },
      tasks: {
        total: filteredTasks.length,
        pending: filteredTasks.filter((t) => t.status === 'pending').length,
        overdue: this.getOverdueTasks().length,
        completed: filteredTasks.filter((t) => t.status === 'completed').length,
        byPriority: Array.from(tasksByPriority.entries()).map(([priority, count]) => ({
          priority,
          count,
        })),
      },
      outreach: {
        total: filteredOutreach.length,
        successful: successfulOutreach,
        successRate:
          filteredOutreach.length > 0
            ? Math.round((successfulOutreach / filteredOutreach.length) * 100)
            : 0,
        byType: Array.from(outreachByType.entries()).map(([type, count]) => ({
          type,
          count,
        })),
      },
    };
  }
}
