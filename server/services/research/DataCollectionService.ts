import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

export type VisitType = 'screening' | 'baseline' | 'treatment' | 'followup' | 'early_termination' | 'closeout';
export type VisitStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';
export type CRFStatus = 'not_started' | 'in_progress' | 'completed' | 'verified' | 'locked';
export type QueryStatus = 'open' | 'answered' | 'closed' | 'cancelled';
export type AESeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'death';

export interface StudyVisit {
  id: string;
  participantId: string;
  trialId: string;
  visitType: VisitType;
  visitNumber: number;
  visitName: string;
  scheduledDate: Date;
  actualDate?: Date;
  status: VisitStatus;
  windowStart: Date;
  windowEnd: Date;
  completedBy?: string;
  notes?: string;
}

export interface CaseReportForm {
  id: string;
  participantId: string;
  trialId: string;
  visitId: string;
  formName: string;
  formVersion: string;
  status: CRFStatus;
  data: Record<string, any>;
  enteredBy?: string;
  enteredDate?: Date;
  verifiedBy?: string;
  verifiedDate?: Date;
  lockedBy?: string;
  lockedDate?: Date;
}

export interface AdverseEvent {
  id: string;
  aeNumber: string;
  participantId: string;
  trialId: string;
  eventTerm: string;
  severity: AESeverity;
  serious: boolean;
  onsetDate: Date;
  resolutionDate?: Date;
  outcome: 'recovered' | 'recovering' | 'not_recovered' | 'fatal' | 'unknown';
  relatedToStudy: boolean;
  actionTaken: string;
  reportedDate: Date;
  reportedBy: string;
}

export interface DataQuery {
  id: string;
  queryNumber: string;
  participantId: string;
  trialId: string;
  crfId: string;
  fieldName: string;
  queryText: string;
  status: QueryStatus;
  priority: 'low' | 'medium' | 'high';
  raisedBy: string;
  raisedDate: Date;
  response?: string;
  respondedBy?: string;
  respondedDate?: Date;
  closedDate?: Date;
}

export interface SourceDocumentVerification {
  id: string;
  participantId: string;
  trialId: string;
  visitId: string;
  crfId: string;
  verifiedBy: string;
  verifiedDate: Date;
  discrepanciesFound: boolean;
  discrepancyDetails?: string;
  correctiveAction?: string;
}

export class DataCollectionService {
  private static visits: Map<string, StudyVisit> = new Map();
  private static crfs: Map<string, CaseReportForm> = new Map();
  private static adverseEvents: Map<string, AdverseEvent> = new Map();
  private static queries: Map<string, DataQuery> = new Map();
  private static sdvs: Map<string, SourceDocumentVerification> = new Map();
  private static aeCounter = 20000;
  private static queryCounter = 30000;

  static scheduleVisit(data: Omit<StudyVisit, 'id' | 'status'>): StudyVisit {
    const visit: StudyVisit = {
      ...data,
      id: uuidv4(),
      status: 'scheduled'
    };
    this.visits.set(visit.id, visit);
    logger.info(`Visit scheduled: ${visit.visitName} for participant ${visit.participantId}`);
    return visit;
  }

  static completeVisit(visitId: string, completedBy: string, actualDate?: Date): StudyVisit {
    const visit = this.visits.get(visitId);
    if (!visit) throw new Error('Visit not found');
    visit.status = 'completed';
    visit.actualDate = actualDate || new Date();
    visit.completedBy = completedBy;
    logger.info(`Visit completed: ${visit.visitName}`);
    return visit;
  }

  static markVisitMissed(visitId: string, notes?: string): StudyVisit {
    const visit = this.visits.get(visitId);
    if (!visit) throw new Error('Visit not found');
    visit.status = 'missed';
    visit.notes = notes;
    logger.warn(`Visit missed: ${visit.visitName} for participant ${visit.participantId}`);
    return visit;
  }

  static createCRF(data: Omit<CaseReportForm, 'id' | 'status'>): CaseReportForm {
    const crf: CaseReportForm = {
      ...data,
      id: uuidv4(),
      status: 'not_started'
    };
    this.crfs.set(crf.id, crf);
    return crf;
  }

  static updateCRF(crfId: string, data: Record<string, any>, enteredBy: string): CaseReportForm {
    const crf = this.crfs.get(crfId);
    if (!crf) throw new Error('CRF not found');
    if (crf.status === 'locked') throw new Error('CRF is locked');

    crf.data = { ...crf.data, ...data };
    crf.status = 'in_progress';
    crf.enteredBy = enteredBy;
    crf.enteredDate = new Date();
    return crf;
  }

  static completeCRF(crfId: string): CaseReportForm {
    const crf = this.crfs.get(crfId);
    if (!crf) throw new Error('CRF not found');
    if (crf.status === 'locked') throw new Error('CRF is locked');
    crf.status = 'completed';
    return crf;
  }

  static verifyCRF(crfId: string, verifiedBy: string): CaseReportForm {
    const crf = this.crfs.get(crfId);
    if (!crf) throw new Error('CRF not found');
    if (crf.status === 'locked') throw new Error('CRF is locked');
    crf.status = 'verified';
    crf.verifiedBy = verifiedBy;
    crf.verifiedDate = new Date();
    logger.info(`CRF verified: ${crf.formName} for participant ${crf.participantId}`);
    return crf;
  }

  static lockCRF(crfId: string, lockedBy: string): CaseReportForm {
    const crf = this.crfs.get(crfId);
    if (!crf) throw new Error('CRF not found');
    crf.status = 'locked';
    crf.lockedBy = lockedBy;
    crf.lockedDate = new Date();
    logger.info(`CRF locked: ${crf.formName}`);
    return crf;
  }

  static reportAdverseEvent(data: Omit<AdverseEvent, 'id' | 'aeNumber' | 'reportedDate'>): AdverseEvent {
    const ae: AdverseEvent = {
      ...data,
      id: uuidv4(),
      aeNumber: `AE-${String(this.aeCounter++).padStart(6, '0')}`,
      reportedDate: new Date()
    };
    this.adverseEvents.set(ae.id, ae);

    const severityLevel = ae.serious ? 'SERIOUS' : ae.severity.toUpperCase();
    logger.warn(`Adverse Event reported: ${ae.aeNumber} - ${severityLevel} - ${ae.eventTerm}`);

    return ae;
  }

  static updateAEResolution(aeId: string, resolutionDate: Date, outcome: AdverseEvent['outcome']): AdverseEvent {
    const ae = this.adverseEvents.get(aeId);
    if (!ae) throw new Error('Adverse event not found');
    ae.resolutionDate = resolutionDate;
    ae.outcome = outcome;
    logger.info(`Adverse event ${ae.aeNumber} resolved: ${outcome}`);
    return ae;
  }

  static raiseQuery(data: Omit<DataQuery, 'id' | 'queryNumber' | 'status' | 'raisedDate'>): DataQuery {
    const query: DataQuery = {
      ...data,
      id: uuidv4(),
      queryNumber: `Q-${String(this.queryCounter++).padStart(6, '0')}`,
      status: 'open',
      raisedDate: new Date()
    };
    this.queries.set(query.id, query);
    logger.info(`Data query raised: ${query.queryNumber} - ${query.queryText}`);
    return query;
  }

  static answerQuery(queryId: string, response: string, respondedBy: string): DataQuery {
    const query = this.queries.get(queryId);
    if (!query) throw new Error('Query not found');
    query.response = response;
    query.respondedBy = respondedBy;
    query.respondedDate = new Date();
    query.status = 'answered';
    logger.info(`Data query answered: ${query.queryNumber}`);
    return query;
  }

  static closeQuery(queryId: string): DataQuery {
    const query = this.queries.get(queryId);
    if (!query) throw new Error('Query not found');
    if (query.status !== 'answered') throw new Error('Query must be answered before closing');
    query.status = 'closed';
    query.closedDate = new Date();
    logger.info(`Data query closed: ${query.queryNumber}`);
    return query;
  }

  static performSDV(data: Omit<SourceDocumentVerification, 'id' | 'verifiedDate'>): SourceDocumentVerification {
    const sdv: SourceDocumentVerification = {
      ...data,
      id: uuidv4(),
      verifiedDate: new Date()
    };
    this.sdvs.set(sdv.id, sdv);
    logger.info(`SDV performed for participant ${sdv.participantId}, visit ${sdv.visitId}`);
    return sdv;
  }

  static getVisits(participantId: string): StudyVisit[] {
    return Array.from(this.visits.values())
      .filter(v => v.participantId === participantId)
      .sort((a, b) => a.visitNumber - b.visitNumber);
  }

  static getUpcomingVisits(trialId: string, days: number = 7): StudyVisit[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return Array.from(this.visits.values())
      .filter(v => v.trialId === trialId && v.status === 'scheduled' && v.scheduledDate >= now && v.scheduledDate <= futureDate)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  static getCRFs(participantId: string, visitId?: string): CaseReportForm[] {
    let crfs = Array.from(this.crfs.values()).filter(c => c.participantId === participantId);
    if (visitId) crfs = crfs.filter(c => c.visitId === visitId);
    return crfs;
  }

  static getAdverseEvents(participantId?: string, trialId?: string, serious?: boolean): AdverseEvent[] {
    let aes = Array.from(this.adverseEvents.values());
    if (participantId) aes = aes.filter(ae => ae.participantId === participantId);
    if (trialId) aes = aes.filter(ae => ae.trialId === trialId);
    if (serious !== undefined) aes = aes.filter(ae => ae.serious === serious);
    return aes.sort((a, b) => b.reportedDate.getTime() - a.reportedDate.getTime());
  }

  static getQueries(trialId: string, status?: QueryStatus, priority?: string): DataQuery[] {
    let queries = Array.from(this.queries.values()).filter(q => q.trialId === trialId);
    if (status) queries = queries.filter(q => q.status === status);
    if (priority) queries = queries.filter(q => q.priority === priority);
    return queries.sort((a, b) => b.raisedDate.getTime() - a.raisedDate.getTime());
  }

  static getSDVs(participantId: string): SourceDocumentVerification[] {
    return Array.from(this.sdvs.values())
      .filter(s => s.participantId === participantId)
      .sort((a, b) => b.verifiedDate.getTime() - a.verifiedDate.getTime());
  }

  static getDataCompletionRate(trialId: string): number {
    const crfs = Array.from(this.crfs.values()).filter(c => c.trialId === trialId);
    if (crfs.length === 0) return 100;
    const completed = crfs.filter(c => c.status === 'completed' || c.status === 'verified' || c.status === 'locked').length;
    return Math.round((completed / crfs.length) * 100);
  }

  static getStatistics() {
    return {
      totalVisits: this.visits.size,
      completedVisits: Array.from(this.visits.values()).filter(v => v.status === 'completed').length,
      missedVisits: Array.from(this.visits.values()).filter(v => v.status === 'missed').length,
      totalCRFs: this.crfs.size,
      lockedCRFs: Array.from(this.crfs.values()).filter(c => c.status === 'locked').length,
      totalAdverseEvents: this.adverseEvents.size,
      seriousAdverseEvents: Array.from(this.adverseEvents.values()).filter(ae => ae.serious).length,
      openQueries: Array.from(this.queries.values()).filter(q => q.status === 'open').length,
      totalSDVs: this.sdvs.size
    };
  }
}
