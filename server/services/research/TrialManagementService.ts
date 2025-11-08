import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

export type StudyPhase = 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'observational';
export type StudyStatus = 'planning' | 'recruiting' | 'active' | 'suspended' | 'completed' | 'terminated';
export type DocumentType = 'protocol' | 'consent' | 'irb_approval' | 'amendment' | 'safety_report' | 'closeout';

export interface ClinicalTrial {
  id: string;
  trialNumber: string;
  title: string;
  phase: StudyPhase;
  status: StudyStatus;
  sponsor: string;
  principalInvestigator: string;
  condition: string;
  intervention: string;
  primaryObjective: string;
  targetEnrollment: number;
  actualEnrollment: number;
  startDate: Date;
  estimatedCompletionDate: Date;
  actualCompletionDate?: Date;
}

export interface StudyProtocol {
  id: string;
  trialId: string;
  version: string;
  effectiveDate: Date;
  primaryEndpoints: string[];
  secondaryEndpoints: string[];
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  studyDuration: number; // days
  visitSchedule: string[];
  sampleSize: number;
  statisticalMethod: string;
}

export interface StudyArm {
  id: string;
  trialId: string;
  armName: string;
  armType: 'experimental' | 'active_comparator' | 'placebo' | 'no_intervention';
  description: string;
  targetN: number;
  actualN: number;
}

export interface StudySite {
  id: string;
  trialId: string;
  siteName: string;
  siteNumber: string;
  principalInvestigator: string;
  address: string;
  status: 'pending' | 'active' | 'inactive' | 'closed';
  activationDate?: Date;
  targetEnrollment: number;
  actualEnrollment: number;
}

export interface RegulatoryDocument {
  id: string;
  trialId: string;
  documentType: DocumentType;
  title: string;
  version: string;
  effectiveDate: Date;
  expirationDate?: Date;
  approvalDate?: Date;
  approvedBy?: string;
  status: 'draft' | 'submitted' | 'approved' | 'expired';
  filePath?: string;
}

export interface ProtocolDeviation {
  id: string;
  trialId: string;
  participantId: string;
  siteId: string;
  deviationType: 'inclusion_violation' | 'exclusion_violation' | 'visit_window' | 'procedure_missed' | 'other';
  description: string;
  severity: 'minor' | 'major' | 'critical';
  reportedDate: Date;
  resolved: boolean;
  correctiveAction?: string;
}

export class TrialManagementService {
  private static trials: Map<string, ClinicalTrial> = new Map();
  private static protocols: Map<string, StudyProtocol> = new Map();
  private static arms: Map<string, StudyArm> = new Map();
  private static sites: Map<string, StudySite> = new Map();
  private static documents: Map<string, RegulatoryDocument> = new Map();
  private static deviations: Map<string, ProtocolDeviation> = new Map();
  private static trialCounter = 1000;

  static createTrial(data: Omit<ClinicalTrial, 'id' | 'trialNumber' | 'actualEnrollment'>): ClinicalTrial {
    const trial: ClinicalTrial = {
      ...data,
      id: uuidv4(),
      trialNumber: `CT-${String(this.trialCounter++).padStart(6, '0')}`,
      actualEnrollment: 0
    };
    this.trials.set(trial.id, trial);
    logger.info(`Clinical trial created: ${trial.trialNumber} - ${trial.title}`);
    return trial;
  }

  static createProtocol(data: Omit<StudyProtocol, 'id'>): StudyProtocol {
    const protocol: StudyProtocol = { ...data, id: uuidv4() };
    this.protocols.set(protocol.id, protocol);
    return protocol;
  }

  static createArm(data: Omit<StudyArm, 'id' | 'actualN'>): StudyArm {
    const arm: StudyArm = { ...data, id: uuidv4(), actualN: 0 };
    this.arms.set(arm.id, arm);
    return arm;
  }

  static createSite(data: Omit<StudySite, 'id' | 'actualEnrollment'>): StudySite {
    const site: StudySite = { ...data, id: uuidv4(), actualEnrollment: 0 };
    this.sites.set(site.id, site);
    return site;
  }

  static activateSite(siteId: string): StudySite {
    const site = this.sites.get(siteId);
    if (!site) throw new Error('Site not found');
    site.status = 'active';
    site.activationDate = new Date();
    return site;
  }

  static createDocument(data: Omit<RegulatoryDocument, 'id'>): RegulatoryDocument {
    const document: RegulatoryDocument = { ...data, id: uuidv4() };
    this.documents.set(document.id, document);
    logger.info(`Regulatory document created: ${document.documentType} - ${document.title}`);
    return document;
  }

  static approveDocument(documentId: string, approvedBy: string): RegulatoryDocument {
    const document = this.documents.get(documentId);
    if (!document) throw new Error('Document not found');
    document.status = 'approved';
    document.approvalDate = new Date();
    document.approvedBy = approvedBy;
    return document;
  }

  static recordDeviation(data: Omit<ProtocolDeviation, 'id' | 'reportedDate' | 'resolved'>): ProtocolDeviation {
    const deviation: ProtocolDeviation = {
      ...data,
      id: uuidv4(),
      reportedDate: new Date(),
      resolved: false
    };
    this.deviations.set(deviation.id, deviation);
    logger.warn(`Protocol deviation recorded: ${deviation.deviationType} - ${deviation.severity}`);
    return deviation;
  }

  static resolveDeviation(deviationId: string, correctiveAction: string): ProtocolDeviation {
    const deviation = this.deviations.get(deviationId);
    if (!deviation) throw new Error('Deviation not found');
    deviation.resolved = true;
    deviation.correctiveAction = correctiveAction;
    return deviation;
  }

  static updateTrialStatus(trialId: string, status: StudyStatus): ClinicalTrial {
    const trial = this.trials.get(trialId);
    if (!trial) throw new Error('Trial not found');
    trial.status = status;
    if (status === 'completed' || status === 'terminated') {
      trial.actualCompletionDate = new Date();
    }
    logger.info(`Trial ${trial.trialNumber} status updated to ${status}`);
    return trial;
  }

  static getTrial(trialId: string): ClinicalTrial | undefined {
    return this.trials.get(trialId);
  }

  static getTrials(status?: StudyStatus): ClinicalTrial[] {
    let trials = Array.from(this.trials.values());
    if (status) trials = trials.filter(t => t.status === status);
    return trials.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  static getProtocol(trialId: string): StudyProtocol | undefined {
    return Array.from(this.protocols.values()).find(p => p.trialId === trialId);
  }

  static getArms(trialId: string): StudyArm[] {
    return Array.from(this.arms.values()).filter(a => a.trialId === trialId);
  }

  static getSites(trialId: string): StudySite[] {
    return Array.from(this.sites.values()).filter(s => s.trialId === trialId);
  }

  static getDocuments(trialId: string, documentType?: DocumentType): RegulatoryDocument[] {
    let docs = Array.from(this.documents.values()).filter(d => d.trialId === trialId);
    if (documentType) docs = docs.filter(d => d.documentType === documentType);
    return docs.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  }

  static getDeviations(trialId: string, resolved?: boolean): ProtocolDeviation[] {
    let deviations = Array.from(this.deviations.values()).filter(d => d.trialId === trialId);
    if (resolved !== undefined) deviations = deviations.filter(d => d.resolved === resolved);
    return deviations.sort((a, b) => b.reportedDate.getTime() - a.reportedDate.getTime());
  }

  static getStatistics() {
    const trials = Array.from(this.trials.values());
    return {
      totalTrials: this.trials.size,
      activeTrials: trials.filter(t => t.status === 'active' || t.status === 'recruiting').length,
      completedTrials: trials.filter(t => t.status === 'completed').length,
      totalEnrollment: trials.reduce((sum, t) => sum + t.actualEnrollment, 0),
      activeSites: Array.from(this.sites.values()).filter(s => s.status === 'active').length,
      openDeviations: Array.from(this.deviations.values()).filter(d => !d.resolved).length,
      pendingDocuments: Array.from(this.documents.values()).filter(d => d.status === 'submitted').length
    };
  }
}
