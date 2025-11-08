import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

// ============================================================================
// Regulatory Compliance Types
// ============================================================================

export type ComplianceProgram =
  | 'MIPS'
  | 'APM'
  | 'MACRA'
  | 'Meaningful_Use'
  | 'PQRS'
  | 'HEDIS'
  | 'Joint_Commission'
  | 'State_Licensing'
  | 'HIPAA'
  | 'OSHA';

export type AuditStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'passed';

export interface ComplianceRequirement {
  id: string;
  program: ComplianceProgram;
  requirementId: string;
  name: string;
  description: string;
  category: string;
  mandatory: boolean;
  frequency: 'annual' | 'quarterly' | 'monthly' | 'ongoing' | 'one_time';
  nextDueDate: Date;
  responsible: string;
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'not_applicable';
  evidenceRequired: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceAttestation {
  id: string;
  requirementId: string;
  attestationType: 'self_attestation' | 'external_validation' | 'audit';
  attestedBy: string;
  attestationDate: Date;
  status: 'attested' | 'disputed' | 'revoked';
  evidence: AttestationEvidence[];
  notes: string;
  validFrom: Date;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttestationEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'report' | 'certificate' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedDate: Date;
  description: string;
}

export interface RegulatoryAudit {
  id: string;
  auditNumber: string;
  program: ComplianceProgram;
  auditType: 'internal' | 'external' | 'cms' | 'state' | 'accreditation';
  scope: string;
  status: AuditStatus;
  auditor: string;
  auditFirm?: string;
  scheduledDate: Date;
  startDate?: Date;
  completionDate?: Date;
  findings: AuditFinding[];
  recommendations: string[];
  correctiveActions: CorrectiveAction[];
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFinding {
  id: string;
  findingNumber: string;
  category: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  requirement: string;
  impact: string;
  evidenceDate: Date;
  identifiedBy: string;
}

export interface CorrectiveAction {
  id: string;
  findingId: string;
  action: string;
  assignedTo: string;
  dueDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'verified' | 'overdue';
  completedDate?: Date;
  verifiedBy?: string;
  verificationDate?: Date;
  notes: string;
}

export interface MIPSSubmission {
  id: string;
  submissionYear: number;
  tin: string;
  npi: string;
  performanceCategory: 'quality' | 'cost' | 'ia' | 'pi';
  measures: MIPSMeasureSubmission[];
  submissionMethod: 'claims' | 'registry' | 'ehr' | 'qcdr' | 'cms_web_interface';
  submissionDate?: Date;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  score?: number;
  feedback?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MIPSMeasureSubmission {
  measureId: string;
  performanceRate: number;
  numerator: number;
  denominator: number;
  eligible: boolean;
  performanceMet: boolean;
  points: number;
}

export interface ComplianceReport {
  id: string;
  program: ComplianceProgram;
  reportType: string;
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
  requirements: {
    requirementId: string;
    status: string;
    complianceRate: number;
  }[];
  overallComplianceRate: number;
  findings: string[];
  recommendations: string[];
  generatedDate: Date;
  generatedBy: string;
  createdAt: Date;
}

export interface PolicyDocument {
  id: string;
  policyNumber: string;
  title: string;
  category: string;
  program?: ComplianceProgram;
  version: string;
  effectiveDate: Date;
  reviewDate: Date;
  nextReviewDate: Date;
  owner: string;
  approvedBy: string;
  status: 'draft' | 'under_review' | 'approved' | 'archived';
  content: string;
  relatedRequirements: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskAssessment {
  id: string;
  assessmentType: 'hipaa' | 'security' | 'compliance' | 'operational' | 'financial';
  assessmentDate: Date;
  scope: string;
  risks: IdentifiedRisk[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationPlan: string[];
  assessedBy: string;
  approvedBy?: string;
  nextAssessmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IdentifiedRisk {
  id: string;
  riskCategory: string;
  description: string;
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain';
  impact: 'insignificant' | 'minor' | 'moderate' | 'major' | 'catastrophic';
  riskScore: number;
  currentControls: string[];
  additionalControls: string[];
  residualRisk: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
}

// ============================================================================
// Regulatory Compliance Service
// ============================================================================

export class RegulatoryComplianceService {
  private static complianceRequirements: Map<string, ComplianceRequirement> = new Map();
  private static attestations: Map<string, ComplianceAttestation> = new Map();
  private static audits: Map<string, RegulatoryAudit> = new Map();
  private static mipsSubmissions: Map<string, MIPSSubmission> = new Map();
  private static complianceReports: Map<string, ComplianceReport> = new Map();
  private static policyDocuments: Map<string, PolicyDocument> = new Map();
  private static riskAssessments: Map<string, RiskAssessment> = new Map();
  private static auditCounter = 1000;

  // Initialize with default requirements
  static {
    this.initializeDefaultRequirements();
  }

  // ============================================================================
  // Compliance Requirements
  // ============================================================================

  static createComplianceRequirement(data: {
    program: ComplianceProgram;
    requirementId: string;
    name: string;
    description: string;
    category: string;
    mandatory: boolean;
    frequency: ComplianceRequirement['frequency'];
    nextDueDate: Date;
    responsible: string;
    evidenceRequired: string[];
  }): ComplianceRequirement {
    const id = uuidv4();

    const requirement: ComplianceRequirement = {
      id,
      program: data.program,
      requirementId: data.requirementId,
      name: data.name,
      description: data.description,
      category: data.category,
      mandatory: data.mandatory,
      frequency: data.frequency,
      nextDueDate: data.nextDueDate,
      responsible: data.responsible,
      status: 'in_progress',
      evidenceRequired: data.evidenceRequired,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.complianceRequirements.set(id, requirement);
    logger.info(`Compliance requirement created: ${data.program} - ${data.requirementId}`);

    return requirement;
  }

  static updateComplianceRequirement(
    id: string,
    updates: Partial<Omit<ComplianceRequirement, 'id' | 'createdAt'>>
  ): ComplianceRequirement {
    const requirement = this.complianceRequirements.get(id);
    if (!requirement) {
      throw new Error('Compliance requirement not found');
    }

    Object.assign(requirement, updates);
    requirement.updatedAt = new Date();

    this.complianceRequirements.set(id, requirement);
    logger.info(`Compliance requirement updated: ${id}`);

    return requirement;
  }

  static getComplianceRequirementById(id: string): ComplianceRequirement | undefined {
    return this.complianceRequirements.get(id);
  }

  static getComplianceRequirements(
    program?: ComplianceProgram,
    status?: ComplianceRequirement['status']
  ): ComplianceRequirement[] {
    let requirements = Array.from(this.complianceRequirements.values());

    if (program) {
      requirements = requirements.filter((r) => r.program === program);
    }

    if (status) {
      requirements = requirements.filter((r) => r.status === status);
    }

    return requirements;
  }

  static getOverdueRequirements(): ComplianceRequirement[] {
    const now = new Date();
    return Array.from(this.complianceRequirements.values()).filter(
      (r) => r.nextDueDate < now && r.status !== 'compliant'
    );
  }

  // ============================================================================
  // Attestations
  // ============================================================================

  static createAttestation(data: {
    requirementId: string;
    attestationType: ComplianceAttestation['attestationType'];
    attestedBy: string;
    evidence: Omit<AttestationEvidence, 'id'>[];
    notes: string;
    validFrom: Date;
    validUntil: Date;
  }): ComplianceAttestation {
    const id = uuidv4();

    const evidenceWithIds: AttestationEvidence[] = data.evidence.map((e) => ({
      ...e,
      id: uuidv4(),
    }));

    const attestation: ComplianceAttestation = {
      id,
      requirementId: data.requirementId,
      attestationType: data.attestationType,
      attestedBy: data.attestedBy,
      attestationDate: new Date(),
      status: 'attested',
      evidence: evidenceWithIds,
      notes: data.notes,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.attestations.set(id, attestation);

    // Update requirement status to compliant
    const requirement = this.complianceRequirements.get(data.requirementId);
    if (requirement) {
      requirement.status = 'compliant';
      requirement.updatedAt = new Date();
      this.complianceRequirements.set(data.requirementId, requirement);
    }

    logger.info(`Compliance attestation created for requirement: ${data.requirementId}`);

    return attestation;
  }

  static getAttestationById(id: string): ComplianceAttestation | undefined {
    return this.attestations.get(id);
  }

  static getAttestationsByRequirement(requirementId: string): ComplianceAttestation[] {
    return Array.from(this.attestations.values())
      .filter((a) => a.requirementId === requirementId)
      .sort((a, b) => b.attestationDate.getTime() - a.attestationDate.getTime());
  }

  static revokeAttestation(id: string, revokedBy: string, reason: string): ComplianceAttestation {
    const attestation = this.attestations.get(id);
    if (!attestation) {
      throw new Error('Attestation not found');
    }

    attestation.status = 'revoked';
    attestation.notes += `\n\nRevoked by ${revokedBy} on ${new Date().toISOString()}: ${reason}`;
    attestation.updatedAt = new Date();

    this.attestations.set(id, attestation);

    // Update requirement status back to in_progress
    const requirement = this.complianceRequirements.get(attestation.requirementId);
    if (requirement) {
      requirement.status = 'in_progress';
      requirement.updatedAt = new Date();
      this.complianceRequirements.set(attestation.requirementId, requirement);
    }

    logger.info(`Attestation revoked: ${id}`);

    return attestation;
  }

  // ============================================================================
  // Regulatory Audits
  // ============================================================================

  static createRegulatoryAudit(data: {
    program: ComplianceProgram;
    auditType: RegulatoryAudit['auditType'];
    scope: string;
    auditor: string;
    auditFirm?: string;
    scheduledDate: Date;
    riskRating: RegulatoryAudit['riskRating'];
    createdBy: string;
  }): RegulatoryAudit {
    const id = uuidv4();
    const auditNumber = `AUD-${this.auditCounter++}`;

    const audit: RegulatoryAudit = {
      id,
      auditNumber,
      program: data.program,
      auditType: data.auditType,
      scope: data.scope,
      status: 'scheduled',
      auditor: data.auditor,
      auditFirm: data.auditFirm,
      scheduledDate: data.scheduledDate,
      findings: [],
      recommendations: [],
      correctiveActions: [],
      riskRating: data.riskRating,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.audits.set(id, audit);
    logger.info(`Regulatory audit created: ${auditNumber}`);

    return audit;
  }

  static addAuditFinding(
    auditId: string,
    finding: Omit<AuditFinding, 'id' | 'findingNumber'>
  ): RegulatoryAudit {
    const audit = this.audits.get(auditId);
    if (!audit) {
      throw new Error('Audit not found');
    }

    const findingWithId: AuditFinding = {
      ...finding,
      id: uuidv4(),
      findingNumber: `${audit.auditNumber}-F${audit.findings.length + 1}`,
    };

    audit.findings.push(findingWithId);
    audit.updatedAt = new Date();

    this.audits.set(auditId, audit);
    logger.info(`Audit finding added to ${audit.auditNumber}`);

    return audit;
  }

  static addCorrectiveAction(
    auditId: string,
    action: Omit<CorrectiveAction, 'id' | 'status'>
  ): RegulatoryAudit {
    const audit = this.audits.get(auditId);
    if (!audit) {
      throw new Error('Audit not found');
    }

    const correctiveAction: CorrectiveAction = {
      ...action,
      id: uuidv4(),
      status: 'planned',
    };

    audit.correctiveActions.push(correctiveAction);
    audit.updatedAt = new Date();

    this.audits.set(auditId, audit);
    logger.info(`Corrective action added to ${audit.auditNumber}`);

    return audit;
  }

  static updateCorrectiveActionStatus(
    auditId: string,
    actionId: string,
    status: CorrectiveAction['status'],
    updatedBy: string
  ): RegulatoryAudit {
    const audit = this.audits.get(auditId);
    if (!audit) {
      throw new Error('Audit not found');
    }

    const action = audit.correctiveActions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error('Corrective action not found');
    }

    action.status = status;
    if (status === 'completed') {
      action.completedDate = new Date();
    } else if (status === 'verified') {
      action.verifiedBy = updatedBy;
      action.verificationDate = new Date();
    }

    audit.updatedAt = new Date();
    this.audits.set(auditId, audit);

    logger.info(`Corrective action ${actionId} status updated to ${status}`);

    return audit;
  }

  static updateAuditStatus(auditId: string, status: AuditStatus): RegulatoryAudit {
    const audit = this.audits.get(auditId);
    if (!audit) {
      throw new Error('Audit not found');
    }

    audit.status = status;
    if (status === 'in_progress' && !audit.startDate) {
      audit.startDate = new Date();
    } else if (status === 'completed' || status === 'passed' || status === 'failed') {
      audit.completionDate = new Date();
    }

    audit.updatedAt = new Date();
    this.audits.set(auditId, audit);

    logger.info(`Audit ${audit.auditNumber} status updated to ${status}`);

    return audit;
  }

  static getRegulatoryAuditById(id: string): RegulatoryAudit | undefined {
    return this.audits.get(id);
  }

  static getRegulatoryAudits(
    program?: ComplianceProgram,
    status?: AuditStatus
  ): RegulatoryAudit[] {
    let audits = Array.from(this.audits.values());

    if (program) {
      audits = audits.filter((a) => a.program === program);
    }

    if (status) {
      audits = audits.filter((a) => a.status === status);
    }

    return audits.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  }

  // ============================================================================
  // MIPS Submissions
  // ============================================================================

  static createMIPSSubmission(data: {
    submissionYear: number;
    tin: string;
    npi: string;
    performanceCategory: MIPSSubmission['performanceCategory'];
    measures: MIPSMeasureSubmission[];
    submissionMethod: MIPSSubmission['submissionMethod'];
    createdBy: string;
  }): MIPSSubmission {
    const id = uuidv4();

    const submission: MIPSSubmission = {
      id,
      submissionYear: data.submissionYear,
      tin: data.tin,
      npi: data.npi,
      performanceCategory: data.performanceCategory,
      measures: data.measures,
      submissionMethod: data.submissionMethod,
      status: 'draft',
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mipsSubmissions.set(id, submission);
    logger.info(`MIPS submission created for ${data.submissionYear}`);

    return submission;
  }

  static submitMIPS(id: string, submittedBy: string): MIPSSubmission {
    const submission = this.mipsSubmissions.get(id);
    if (!submission) {
      throw new Error('MIPS submission not found');
    }

    // Calculate score
    const totalPoints = submission.measures.reduce((sum, m) => sum + m.points, 0);
    const maxPoints = submission.measures.length * 10; // Simplified scoring
    const score = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    submission.status = 'submitted';
    submission.submissionDate = new Date();
    submission.score = Math.round(score * 100) / 100;
    submission.updatedAt = new Date();

    this.mipsSubmissions.set(id, submission);
    logger.info(`MIPS submission ${id} submitted with score: ${submission.score}`);

    return submission;
  }

  static getMIPSSubmissionById(id: string): MIPSSubmission | undefined {
    return this.mipsSubmissions.get(id);
  }

  static getMIPSSubmissions(
    submissionYear?: number,
    status?: MIPSSubmission['status']
  ): MIPSSubmission[] {
    let submissions = Array.from(this.mipsSubmissions.values());

    if (submissionYear) {
      submissions = submissions.filter((s) => s.submissionYear === submissionYear);
    }

    if (status) {
      submissions = submissions.filter((s) => s.status === status);
    }

    return submissions.sort((a, b) => b.submissionYear - a.submissionYear);
  }

  // ============================================================================
  // Compliance Reporting
  // ============================================================================

  static generateComplianceReport(data: {
    program: ComplianceProgram;
    reportType: string;
    reportingPeriodStart: Date;
    reportingPeriodEnd: Date;
    generatedBy: string;
  }): ComplianceReport {
    const id = uuidv4();

    // Get all requirements for the program
    const requirements = this.getComplianceRequirements(data.program);

    // Calculate compliance for each requirement
    const requirementStatuses = requirements.map((req) => {
      const attestations = this.getAttestationsByRequirement(req.id).filter(
        (a) =>
          a.status === 'attested' &&
          a.validFrom >= data.reportingPeriodStart &&
          a.validFrom <= data.reportingPeriodEnd
      );

      const complianceRate = attestations.length > 0 ? 100 : req.status === 'compliant' ? 100 : 0;

      return {
        requirementId: req.requirementId,
        status: req.status,
        complianceRate,
      };
    });

    // Calculate overall compliance rate
    const overallComplianceRate =
      requirementStatuses.length > 0
        ? requirementStatuses.reduce((sum, r) => sum + r.complianceRate, 0) /
          requirementStatuses.length
        : 0;

    // Generate findings
    const findings: string[] = [];
    const nonCompliant = requirementStatuses.filter((r) => r.complianceRate < 100);
    if (nonCompliant.length > 0) {
      findings.push(`${nonCompliant.length} requirements are not fully compliant`);
    }

    const overdue = this.getOverdueRequirements().filter((r) => r.program === data.program);
    if (overdue.length > 0) {
      findings.push(`${overdue.length} requirements are overdue`);
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (overallComplianceRate < 90) {
      recommendations.push('Implement systematic compliance monitoring process');
      recommendations.push('Assign dedicated compliance officer for this program');
    }
    if (overdue.length > 0) {
      recommendations.push('Create action plan to address overdue requirements');
    }

    const report: ComplianceReport = {
      id,
      program: data.program,
      reportType: data.reportType,
      reportingPeriodStart: data.reportingPeriodStart,
      reportingPeriodEnd: data.reportingPeriodEnd,
      requirements: requirementStatuses,
      overallComplianceRate: Math.round(overallComplianceRate * 100) / 100,
      findings,
      recommendations,
      generatedDate: new Date(),
      generatedBy: data.generatedBy,
      createdAt: new Date(),
    };

    this.complianceReports.set(id, report);
    logger.info(`Compliance report generated for ${data.program}: ${overallComplianceRate}%`);

    return report;
  }

  static getComplianceReportById(id: string): ComplianceReport | undefined {
    return this.complianceReports.get(id);
  }

  static getComplianceReports(program?: ComplianceProgram): ComplianceReport[] {
    let reports = Array.from(this.complianceReports.values());

    if (program) {
      reports = reports.filter((r) => r.program === program);
    }

    return reports.sort((a, b) => b.generatedDate.getTime() - a.generatedDate.getTime());
  }

  // ============================================================================
  // Policy Management
  // ============================================================================

  static createPolicyDocument(data: {
    policyNumber: string;
    title: string;
    category: string;
    program?: ComplianceProgram;
    version: string;
    effectiveDate: Date;
    owner: string;
    approvedBy: string;
    content: string;
    relatedRequirements: string[];
  }): PolicyDocument {
    const id = uuidv4();

    const nextReviewDate = new Date(data.effectiveDate);
    nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1); // Annual review

    const policy: PolicyDocument = {
      id,
      policyNumber: data.policyNumber,
      title: data.title,
      category: data.category,
      program: data.program,
      version: data.version,
      effectiveDate: data.effectiveDate,
      reviewDate: new Date(),
      nextReviewDate,
      owner: data.owner,
      approvedBy: data.approvedBy,
      status: 'approved',
      content: data.content,
      relatedRequirements: data.relatedRequirements,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policyDocuments.set(id, policy);
    logger.info(`Policy document created: ${data.policyNumber} - ${data.title}`);

    return policy;
  }

  static getPolicyDocumentById(id: string): PolicyDocument | undefined {
    return this.policyDocuments.get(id);
  }

  static getPolicyDocuments(
    program?: ComplianceProgram,
    status?: PolicyDocument['status']
  ): PolicyDocument[] {
    let policies = Array.from(this.policyDocuments.values());

    if (program) {
      policies = policies.filter((p) => p.program === program);
    }

    if (status) {
      policies = policies.filter((p) => p.status === status);
    }

    return policies;
  }

  static getPoliciesDueForReview(daysAhead: number = 30): PolicyDocument[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Array.from(this.policyDocuments.values()).filter(
      (p) => p.nextReviewDate <= futureDate && p.status === 'approved'
    );
  }

  // ============================================================================
  // Risk Assessment
  // ============================================================================

  static createRiskAssessment(data: {
    assessmentType: RiskAssessment['assessmentType'];
    scope: string;
    risks: Omit<IdentifiedRisk, 'id' | 'riskScore'>[];
    mitigationPlan: string[];
    assessedBy: string;
    nextAssessmentDate: Date;
  }): RiskAssessment {
    const id = uuidv4();

    // Calculate risk scores
    const likelihoodScores = {
      rare: 1,
      unlikely: 2,
      possible: 3,
      likely: 4,
      almost_certain: 5,
    };

    const impactScores = {
      insignificant: 1,
      minor: 2,
      moderate: 3,
      major: 4,
      catastrophic: 5,
    };

    const risksWithScores: IdentifiedRisk[] = data.risks.map((risk) => {
      const riskScore = likelihoodScores[risk.likelihood] * impactScores[risk.impact];

      return {
        ...risk,
        id: uuidv4(),
        riskScore,
      };
    });

    // Determine overall risk level
    const maxRiskScore = Math.max(...risksWithScores.map((r) => r.riskScore), 0);
    let overallRiskLevel: RiskAssessment['overallRiskLevel'];
    if (maxRiskScore >= 20) overallRiskLevel = 'critical';
    else if (maxRiskScore >= 12) overallRiskLevel = 'high';
    else if (maxRiskScore >= 6) overallRiskLevel = 'medium';
    else overallRiskLevel = 'low';

    const assessment: RiskAssessment = {
      id,
      assessmentType: data.assessmentType,
      assessmentDate: new Date(),
      scope: data.scope,
      risks: risksWithScores,
      overallRiskLevel,
      mitigationPlan: data.mitigationPlan,
      assessedBy: data.assessedBy,
      nextAssessmentDate: data.nextAssessmentDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.riskAssessments.set(id, assessment);
    logger.info(`Risk assessment created: ${data.assessmentType} - ${overallRiskLevel} risk`);

    return assessment;
  }

  static getRiskAssessmentById(id: string): RiskAssessment | undefined {
    return this.riskAssessments.get(id);
  }

  static getRiskAssessments(assessmentType?: RiskAssessment['assessmentType']): RiskAssessment[] {
    let assessments = Array.from(this.riskAssessments.values());

    if (assessmentType) {
      assessments = assessments.filter((a) => a.assessmentType === assessmentType);
    }

    return assessments.sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
  }

  // ============================================================================
  // Default Data Initialization
  // ============================================================================

  private static initializeDefaultRequirements(): void {
    // HIPAA Requirements
    this.createComplianceRequirement({
      program: 'HIPAA',
      requirementId: 'HIPAA-SEC-001',
      name: 'Annual Security Risk Assessment',
      description: 'Conduct comprehensive security risk assessment of all systems containing ePHI',
      category: 'Security',
      mandatory: true,
      frequency: 'annual',
      nextDueDate: new Date('2024-12-31'),
      responsible: 'Security Officer',
      evidenceRequired: ['Risk assessment report', 'Mitigation plan', 'Management approval'],
    });

    this.createComplianceRequirement({
      program: 'HIPAA',
      requirementId: 'HIPAA-PRIV-001',
      name: 'Annual Privacy Training',
      description: 'All workforce members must complete annual HIPAA privacy training',
      category: 'Privacy',
      mandatory: true,
      frequency: 'annual',
      nextDueDate: new Date('2024-12-31'),
      responsible: 'Privacy Officer',
      evidenceRequired: ['Training completion certificates', 'Attendance records'],
    });

    // MIPS Requirements
    this.createComplianceRequirement({
      program: 'MIPS',
      requirementId: 'MIPS-QUAL-001',
      name: 'Quality Measure Reporting',
      description: 'Report on at least 6 quality measures across multiple performance categories',
      category: 'Quality',
      mandatory: true,
      frequency: 'annual',
      nextDueDate: new Date('2024-03-31'),
      responsible: 'Quality Director',
      evidenceRequired: ['Quality measure data', 'QPP submission confirmation'],
    });

    this.createComplianceRequirement({
      program: 'MIPS',
      requirementId: 'MIPS-IA-001',
      name: 'Improvement Activities Attestation',
      description: 'Attest to performance of improvement activities for minimum 90 days',
      category: 'Improvement Activities',
      mandatory: true,
      frequency: 'annual',
      nextDueDate: new Date('2024-03-31'),
      responsible: 'Quality Director',
      evidenceRequired: ['Activity documentation', 'Attestation forms'],
    });

    // Meaningful Use
    this.createComplianceRequirement({
      program: 'Meaningful_Use',
      requirementId: 'MU-CORE-001',
      name: 'e-Prescribing',
      description: 'Generate and transmit permissible prescriptions electronically',
      category: 'Core Objectives',
      mandatory: true,
      frequency: 'ongoing',
      nextDueDate: new Date('2024-12-31'),
      responsible: 'EHR Administrator',
      evidenceRequired: ['e-Prescribing reports', 'Usage statistics'],
    });

    logger.info('Default compliance requirements initialized');
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================

  static getStatistics(
    startDate?: Date,
    endDate?: Date
  ): {
    requirements: {
      total: number;
      compliant: number;
      nonCompliant: number;
      overdue: number;
      complianceRate: number;
      byProgram: { program: ComplianceProgram; count: number; compliantCount: number }[];
    };
    attestations: {
      total: number;
      active: number;
      revoked: number;
    };
    audits: {
      total: number;
      scheduled: number;
      inProgress: number;
      completed: number;
      totalFindings: number;
      criticalFindings: number;
      correctiveActionsCompleted: number;
      correctiveActionsOverdue: number;
    };
    mipsSubmissions: {
      total: number;
      submitted: number;
      averageScore: number;
    };
    riskAssessments: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  } {
    // Requirements statistics
    const requirements = Array.from(this.complianceRequirements.values());
    const compliant = requirements.filter((r) => r.status === 'compliant').length;
    const nonCompliant = requirements.filter((r) => r.status === 'non_compliant').length;
    const overdue = this.getOverdueRequirements().length;
    const complianceRate =
      requirements.length > 0 ? (compliant / requirements.length) * 100 : 0;

    const byProgram = new Map<
      ComplianceProgram,
      { total: number; compliant: number }
    >();
    for (const req of requirements) {
      const stats = byProgram.get(req.program) || { total: 0, compliant: 0 };
      stats.total++;
      if (req.status === 'compliant') stats.compliant++;
      byProgram.set(req.program, stats);
    }

    // Attestations statistics
    const attestations = Array.from(this.attestations.values());
    const activeAttestations = attestations.filter((a) => a.status === 'attested').length;
    const revokedAttestations = attestations.filter((a) => a.status === 'revoked').length;

    // Audits statistics
    const audits = Array.from(this.audits.values());
    const scheduledAudits = audits.filter((a) => a.status === 'scheduled').length;
    const inProgressAudits = audits.filter((a) => a.status === 'in_progress').length;
    const completedAudits = audits.filter((a) => a.status === 'completed').length;

    const totalFindings = audits.reduce((sum, a) => sum + a.findings.length, 0);
    const criticalFindings = audits.reduce(
      (sum, a) => sum + a.findings.filter((f) => f.severity === 'critical').length,
      0
    );

    const allCorrectiveActions = audits.flatMap((a) => a.correctiveActions);
    const correctiveActionsCompleted = allCorrectiveActions.filter(
      (ca) => ca.status === 'completed' || ca.status === 'verified'
    ).length;
    const now = new Date();
    const correctiveActionsOverdue = allCorrectiveActions.filter(
      (ca) =>
        ca.dueDate < now &&
        ca.status !== 'completed' &&
        ca.status !== 'verified'
    ).length;

    // MIPS submissions
    const mipsSubmissions = Array.from(this.mipsSubmissions.values());
    const submittedMIPS = mipsSubmissions.filter((s) => s.status === 'submitted').length;
    const scoresSum = mipsSubmissions
      .filter((s) => s.score !== undefined)
      .reduce((sum, s) => sum + (s.score || 0), 0);
    const averageScore =
      submittedMIPS > 0 ? scoresSum / submittedMIPS : 0;

    // Risk assessments
    const riskAssessments = Array.from(this.riskAssessments.values());
    const critical = riskAssessments.filter((r) => r.overallRiskLevel === 'critical').length;
    const high = riskAssessments.filter((r) => r.overallRiskLevel === 'high').length;
    const medium = riskAssessments.filter((r) => r.overallRiskLevel === 'medium').length;
    const low = riskAssessments.filter((r) => r.overallRiskLevel === 'low').length;

    return {
      requirements: {
        total: requirements.length,
        compliant,
        nonCompliant,
        overdue,
        complianceRate: Math.round(complianceRate * 100) / 100,
        byProgram: Array.from(byProgram.entries()).map(([program, stats]) => ({
          program,
          count: stats.total,
          compliantCount: stats.compliant,
        })),
      },
      attestations: {
        total: attestations.length,
        active: activeAttestations,
        revoked: revokedAttestations,
      },
      audits: {
        total: audits.length,
        scheduled: scheduledAudits,
        inProgress: inProgressAudits,
        completed: completedAudits,
        totalFindings,
        criticalFindings,
        correctiveActionsCompleted,
        correctiveActionsOverdue,
      },
      mipsSubmissions: {
        total: mipsSubmissions.length,
        submitted: submittedMIPS,
        averageScore: Math.round(averageScore * 100) / 100,
      },
      riskAssessments: {
        total: riskAssessments.length,
        critical,
        high,
        medium,
        low,
      },
    };
  }
}
