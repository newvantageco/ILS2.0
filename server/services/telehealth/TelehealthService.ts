/**
 * Telehealth Service
 *
 * Manages virtual visits, video consultations, and remote care workflows
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Virtual visit types
 */
export type VisitType =
  | 'initial_consultation'
  | 'follow_up'
  | 'urgent_care'
  | 'prescription_refill'
  | 'second_opinion'
  | 'post_op_checkup'
  | 'chronic_care_management';

/**
 * Visit status
 */
export type VisitStatus =
  | 'scheduled'
  | 'waiting_room'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'technical_issue';

/**
 * Visit reason codes
 */
export type VisitReason =
  | 'eye_pain'
  | 'vision_changes'
  | 'red_eye'
  | 'dry_eyes'
  | 'prescription_needed'
  | 'contact_lens_issues'
  | 'follow_up_care'
  | 'medication_review'
  | 'other';

/**
 * Virtual Visit
 */
export interface VirtualVisit {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  visitType: VisitType;
  visitReason: VisitReason;
  reasonDetails?: string;
  scheduledDate: Date;
  scheduledTime: string; // HH:MM
  duration: number; // minutes
  status: VisitStatus;

  // Video session info
  sessionId?: string;
  videoRoomId?: string;
  videoRoomToken?: string;

  // Waiting room
  checkedInAt?: Date;
  waitingRoomPosition?: number;
  estimatedWaitMinutes?: number;

  // Visit details
  startedAt?: Date;
  completedAt?: Date;
  actualDuration?: number;

  // Clinical
  chiefComplaint?: string;
  symptoms?: string[];
  vitalSigns?: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    oxygenSaturation?: number;
  };

  // Documentation
  visitNotes?: string;
  diagnoses?: Array<{
    code: string;
    description: string;
  }>;
  prescriptions?: Array<{
    medication: string;
    dosage: string;
    instructions: string;
  }>;
  orders?: Array<{
    type: string;
    description: string;
  }>;
  followUpRequired?: boolean;
  followUpInstructions?: string;

  // Recording (with consent)
  recordingEnabled: boolean;
  recordingConsent?: boolean;
  recordingUrl?: string;

  // Payment
  cost: number;
  insuranceCoverage?: number;
  patientResponsibility?: number;
  paymentStatus: 'pending' | 'paid' | 'insurance_pending' | 'waived';

  // Metadata
  platform: 'web' | 'mobile' | 'tablet';
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  technicalIssues?: string[];

  createdAt: Date;
  updatedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

/**
 * Provider availability for telehealth
 */
export interface ProviderTelehealthAvailability {
  providerId: string;
  providerName: string;
  enabled: boolean;
  maxDailyVirtualVisits: number;
  virtualVisitDuration: number; // default duration in minutes
  availableHours: Array<{
    dayOfWeek: number; // 0-6
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  }>;
  breakTimes: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  supportedVisitTypes: VisitType[];
  acceptsInsurance: boolean;
  acceptsCash: boolean;
  videoProvider: 'twilio' | 'zoom' | 'agora' | 'daily' | 'vonage';
}

/**
 * Telehealth consent
 */
export interface TelehealthConsent {
  id: string;
  patientId: string;
  consentedAt: Date;
  consentVersion: string;
  ipAddress: string;
  userAgent: string;
  consentText: string;
  expiresAt?: Date;
  revokedAt?: Date;
}

/**
 * Pre-visit questionnaire
 */
export interface PreVisitQuestionnaire {
  id: string;
  visitId: string;
  patientId: string;
  submittedAt: Date;
  responses: Array<{
    question: string;
    answer: string | string[] | boolean;
    questionType: 'text' | 'multiple_choice' | 'yes_no' | 'rating';
  }>;
}

/**
 * Telehealth Service
 */
export class TelehealthService {
  /**
   * In-memory stores (use database in production)
   */
  private static visits = new Map<string, VirtualVisit>();
  private static providerAvailability = new Map<string, ProviderTelehealthAvailability>();
  private static consents = new Map<string, TelehealthConsent>();
  private static questionnaires = new Map<string, PreVisitQuestionnaire>();

  /**
   * Configuration
   */
  private static readonly DEFAULT_VISIT_DURATION = 30; // minutes
  private static readonly MIN_ADVANCE_HOURS = 1;
  private static readonly MAX_ADVANCE_DAYS = 60;
  private static readonly WAITING_ROOM_TIMEOUT_MINUTES = 30;
  private static readonly CONSENT_VERSION = '1.0';

  /**
   * Default visit costs (in cents)
   */
  private static readonly VISIT_COSTS: Record<VisitType, number> = {
    initial_consultation: 7500, // $75
    follow_up: 5000, // $50
    urgent_care: 10000, // $100
    prescription_refill: 3500, // $35
    second_opinion: 12500, // $125
    post_op_checkup: 5000, // $50
    chronic_care_management: 6000, // $60
  };

  // ========== Provider Management ==========

  /**
   * Enable telehealth for provider
   */
  static async enableProviderTelehealth(
    providerId: string,
    providerName: string,
    config: Partial<ProviderTelehealthAvailability>
  ): Promise<ProviderTelehealthAvailability> {
    const availability: ProviderTelehealthAvailability = {
      providerId,
      providerName,
      enabled: true,
      maxDailyVirtualVisits: config.maxDailyVirtualVisits || 20,
      virtualVisitDuration: config.virtualVisitDuration || this.DEFAULT_VISIT_DURATION,
      availableHours: config.availableHours || [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }, // Friday
      ],
      breakTimes: config.breakTimes || [
        { dayOfWeek: 1, startTime: '12:00', endTime: '13:00' },
        { dayOfWeek: 2, startTime: '12:00', endTime: '13:00' },
        { dayOfWeek: 3, startTime: '12:00', endTime: '13:00' },
        { dayOfWeek: 4, startTime: '12:00', endTime: '13:00' },
        { dayOfWeek: 5, startTime: '12:00', endTime: '13:00' },
      ],
      supportedVisitTypes: config.supportedVisitTypes || [
        'initial_consultation',
        'follow_up',
        'urgent_care',
        'prescription_refill',
      ],
      acceptsInsurance: config.acceptsInsurance ?? true,
      acceptsCash: config.acceptsCash ?? true,
      videoProvider: config.videoProvider || 'twilio',
    };

    this.providerAvailability.set(providerId, availability);

    logger.info({ providerId }, 'Provider telehealth enabled');

    return availability;
  }

  /**
   * Get telehealth-enabled providers
   */
  static async getTelehealthProviders(visitType?: VisitType): Promise<ProviderTelehealthAvailability[]> {
    let providers = Array.from(this.providerAvailability.values()).filter((p) => p.enabled);

    if (visitType) {
      providers = providers.filter((p) => p.supportedVisitTypes.includes(visitType));
    }

    return providers;
  }

  // ========== Consent Management ==========

  /**
   * Record telehealth consent
   */
  static async recordConsent(
    patientId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<TelehealthConsent> {
    const consent: TelehealthConsent = {
      id: crypto.randomUUID(),
      patientId,
      consentedAt: new Date(),
      consentVersion: this.CONSENT_VERSION,
      ipAddress,
      userAgent,
      consentText: this.getConsentText(),
    };

    this.consents.set(consent.id, consent);

    logger.info({ patientId, consentId: consent.id }, 'Telehealth consent recorded');

    return consent;
  }

  /**
   * Verify patient has valid consent
   */
  static async verifyConsent(patientId: string): Promise<boolean> {
    const patientConsents = Array.from(this.consents.values())
      .filter((c) => c.patientId === patientId && !c.revokedAt)
      .sort((a, b) => b.consentedAt.getTime() - a.consentedAt.getTime());

    if (patientConsents.length === 0) {
      return false;
    }

    const latestConsent = patientConsents[0];

    // Check if expired
    if (latestConsent.expiresAt && latestConsent.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Get consent text
   */
  private static getConsentText(): string {
    return `
I consent to receiving healthcare services via telehealth. I understand that:

1. Telehealth involves the use of electronic communications to enable healthcare providers at different locations to share individual patient medical information for the purpose of providing clinical care.

2. I may expect the anticipated benefits from the use of telehealth in my care, but that no results can be guaranteed or assured.

3. The laws that protect the privacy and confidentiality of medical information also apply to telehealth.

4. I have the right to withhold or withdraw my consent to the use of telehealth in the course of my care at any time.

5. There are potential risks associated with the use of telehealth, including but not limited to:
   - Information transmission may not be sufficient for decision-making
   - Delays in medical evaluation and treatment could occur due to technical failures
   - Security protocols could fail, causing a breach of privacy

6. I understand that I may be charged for telehealth services and that my insurance may not cover all telehealth services.

7. I understand that I have the right to request a face-to-face visit at any time.
    `.trim();
  }

  // ========== Visit Scheduling ==========

  /**
   * Schedule virtual visit
   */
  static async scheduleVisit(request: {
    patientId: string;
    patientName: string;
    providerId: string;
    visitType: VisitType;
    visitReason: VisitReason;
    reasonDetails?: string;
    scheduledDate: Date;
    scheduledTime: string;
    recordingConsent: boolean;
    platform: VirtualVisit['platform'];
  }): Promise<{ success: boolean; visit?: VirtualVisit; error?: string }> {
    // Verify consent
    const hasConsent = await this.verifyConsent(request.patientId);
    if (!hasConsent) {
      return { success: false, error: 'Telehealth consent required' };
    }

    // Verify provider availability
    const providerAvailability = this.providerAvailability.get(request.providerId);
    if (!providerAvailability || !providerAvailability.enabled) {
      return { success: false, error: 'Provider not available for telehealth' };
    }

    if (!providerAvailability.supportedVisitTypes.includes(request.visitType)) {
      return { success: false, error: 'Provider does not support this visit type' };
    }

    // Validate timing
    const now = new Date();
    const visitDateTime = new Date(request.scheduledDate);
    visitDateTime.setHours(
      parseInt(request.scheduledTime.split(':')[0]),
      parseInt(request.scheduledTime.split(':')[1])
    );

    const hoursUntilVisit = (visitDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilVisit < this.MIN_ADVANCE_HOURS) {
      return {
        success: false,
        error: `Virtual visits must be scheduled at least ${this.MIN_ADVANCE_HOURS} hour(s) in advance`,
      };
    }

    const daysUntilVisit = hoursUntilVisit / 24;
    if (daysUntilVisit > this.MAX_ADVANCE_DAYS) {
      return {
        success: false,
        error: `Virtual visits cannot be scheduled more than ${this.MAX_ADVANCE_DAYS} days in advance`,
      };
    }

    // Check for scheduling conflicts
    const existingVisits = Array.from(this.visits.values()).filter(
      (v) =>
        v.providerId === request.providerId &&
        v.status !== 'cancelled' &&
        v.status !== 'no_show' &&
        v.status !== 'completed' &&
        v.scheduledDate.toDateString() === request.scheduledDate.toDateString() &&
        v.scheduledTime === request.scheduledTime
    );

    if (existingVisits.length > 0) {
      return { success: false, error: 'Time slot not available' };
    }

    // Create visit
    const cost = this.VISIT_COSTS[request.visitType];

    const visit: VirtualVisit = {
      id: crypto.randomUUID(),
      patientId: request.patientId,
      patientName: request.patientName,
      providerId: request.providerId,
      providerName: providerAvailability.providerName,
      visitType: request.visitType,
      visitReason: request.visitReason,
      reasonDetails: request.reasonDetails,
      scheduledDate: request.scheduledDate,
      scheduledTime: request.scheduledTime,
      duration: providerAvailability.virtualVisitDuration,
      status: 'scheduled',
      recordingEnabled: false,
      recordingConsent: request.recordingConsent,
      cost,
      patientResponsibility: cost, // Will be updated after insurance check
      paymentStatus: 'pending',
      platform: request.platform,
      createdAt: new Date(),
    };

    this.visits.set(visit.id, visit);

    logger.info({ visitId: visit.id, patientId: request.patientId }, 'Virtual visit scheduled');

    // In production: Send confirmation email/SMS

    return { success: true, visit };
  }

  /**
   * Get patient visits
   */
  static async getPatientVisits(
    patientId: string,
    status?: VisitStatus
  ): Promise<VirtualVisit[]> {
    let visits = Array.from(this.visits.values()).filter((v) => v.patientId === patientId);

    if (status) {
      visits = visits.filter((v) => v.status === status);
    }

    return visits.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  }

  /**
   * Get provider visits
   */
  static async getProviderVisits(
    providerId: string,
    date?: Date,
    status?: VisitStatus
  ): Promise<VirtualVisit[]> {
    let visits = Array.from(this.visits.values()).filter((v) => v.providerId === providerId);

    if (date) {
      visits = visits.filter((v) => v.scheduledDate.toDateString() === date.toDateString());
    }

    if (status) {
      visits = visits.filter((v) => v.status === status);
    }

    return visits.sort((a, b) => {
      const dateCompare = a.scheduledDate.getTime() - b.scheduledDate.getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
  }

  /**
   * Get single visit
   */
  static async getVisit(visitId: string): Promise<VirtualVisit | null> {
    return this.visits.get(visitId) || null;
  }

  /**
   * Cancel visit
   */
  static async cancelVisit(
    visitId: string,
    cancelledBy: 'patient' | 'provider',
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const visit = this.visits.get(visitId);

    if (!visit) {
      return { success: false, error: 'Visit not found' };
    }

    if (visit.status === 'completed' || visit.status === 'cancelled') {
      return { success: false, error: 'Visit cannot be cancelled' };
    }

    if (visit.status === 'in_progress') {
      return { success: false, error: 'Cannot cancel visit in progress' };
    }

    visit.status = 'cancelled';
    visit.cancelledAt = new Date();
    visit.cancellationReason = `${cancelledBy}: ${reason}`;
    visit.updatedAt = new Date();

    this.visits.set(visitId, visit);

    logger.info({ visitId, cancelledBy, reason }, 'Virtual visit cancelled');

    // In production: Send cancellation notification

    return { success: true };
  }

  // ========== Visit Workflow ==========

  /**
   * Patient check-in to waiting room
   */
  static async checkIn(visitId: string, patientId: string): Promise<{
    success: boolean;
    waitingRoomPosition?: number;
    estimatedWaitMinutes?: number;
    error?: string;
  }> {
    const visit = this.visits.get(visitId);

    if (!visit || visit.patientId !== patientId) {
      return { success: false, error: 'Visit not found' };
    }

    if (visit.status !== 'scheduled') {
      return { success: false, error: 'Visit already checked in or completed' };
    }

    // Check if scheduled time is within reasonable window
    const now = new Date();
    const scheduledDateTime = new Date(visit.scheduledDate);
    scheduledDateTime.setHours(
      parseInt(visit.scheduledTime.split(':')[0]),
      parseInt(visit.scheduledTime.split(':')[1])
    );

    const minutesUntilVisit = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (minutesUntilVisit > 15) {
      return {
        success: false,
        error: `Check-in opens 15 minutes before scheduled time (${visit.scheduledTime})`,
      };
    }

    // Get waiting room position
    const waitingRoomVisits = Array.from(this.visits.values())
      .filter((v) => v.providerId === visit.providerId && v.status === 'waiting_room')
      .sort((a, b) => (a.checkedInAt?.getTime() || 0) - (b.checkedInAt?.getTime() || 0));

    const position = waitingRoomVisits.length + 1;
    const estimatedWait = position * visit.duration;

    visit.status = 'waiting_room';
    visit.checkedInAt = new Date();
    visit.waitingRoomPosition = position;
    visit.estimatedWaitMinutes = estimatedWait;
    visit.updatedAt = new Date();

    this.visits.set(visitId, visit);

    logger.info({ visitId, patientId, position, estimatedWait }, 'Patient checked in to waiting room');

    return {
      success: true,
      waitingRoomPosition: position,
      estimatedWaitMinutes: estimatedWait,
    };
  }

  /**
   * Provider starts visit
   */
  static async startVisit(
    visitId: string,
    providerId: string
  ): Promise<{ success: boolean; error?: string }> {
    const visit = this.visits.get(visitId);

    if (!visit || visit.providerId !== providerId) {
      return { success: false, error: 'Visit not found' };
    }

    if (visit.status !== 'waiting_room') {
      return { success: false, error: 'Patient not in waiting room' };
    }

    visit.status = 'in_progress';
    visit.startedAt = new Date();
    visit.updatedAt = new Date();

    this.visits.set(visitId, visit);

    logger.info({ visitId, providerId }, 'Virtual visit started');

    return { success: true };
  }

  /**
   * Complete visit with documentation
   */
  static async completeVisit(
    visitId: string,
    providerId: string,
    documentation: {
      visitNotes: string;
      diagnoses?: VirtualVisit['diagnoses'];
      prescriptions?: VirtualVisit['prescriptions'];
      orders?: VirtualVisit['orders'];
      followUpRequired?: boolean;
      followUpInstructions?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const visit = this.visits.get(visitId);

    if (!visit || visit.providerId !== providerId) {
      return { success: false, error: 'Visit not found' };
    }

    if (visit.status !== 'in_progress') {
      return { success: false, error: 'Visit not in progress' };
    }

    const completedAt = new Date();
    const actualDuration = visit.startedAt
      ? Math.round((completedAt.getTime() - visit.startedAt.getTime()) / (1000 * 60))
      : visit.duration;

    visit.status = 'completed';
    visit.completedAt = completedAt;
    visit.actualDuration = actualDuration;
    visit.visitNotes = documentation.visitNotes;
    visit.diagnoses = documentation.diagnoses;
    visit.prescriptions = documentation.prescriptions;
    visit.orders = documentation.orders;
    visit.followUpRequired = documentation.followUpRequired;
    visit.followUpInstructions = documentation.followUpInstructions;
    visit.updatedAt = new Date();

    this.visits.set(visitId, visit);

    logger.info({ visitId, providerId, actualDuration }, 'Virtual visit completed');

    // In production: Generate visit summary, send to patient

    return { success: true };
  }

  /**
   * Update visit connection quality
   */
  static async updateConnectionQuality(
    visitId: string,
    quality: VirtualVisit['connectionQuality'],
    technicalIssue?: string
  ): Promise<void> {
    const visit = this.visits.get(visitId);

    if (!visit) {
      return;
    }

    visit.connectionQuality = quality;

    if (technicalIssue) {
      if (!visit.technicalIssues) {
        visit.technicalIssues = [];
      }
      visit.technicalIssues.push(technicalIssue);
    }

    visit.updatedAt = new Date();

    this.visits.set(visitId, visit);

    logger.info({ visitId, quality, technicalIssue }, 'Connection quality updated');
  }

  // ========== Pre-Visit Questionnaire ==========

  /**
   * Submit pre-visit questionnaire
   */
  static async submitQuestionnaire(
    visitId: string,
    patientId: string,
    responses: PreVisitQuestionnaire['responses']
  ): Promise<PreVisitQuestionnaire> {
    const visit = this.visits.get(visitId);

    if (!visit || visit.patientId !== patientId) {
      throw new Error('Visit not found');
    }

    const questionnaire: PreVisitQuestionnaire = {
      id: crypto.randomUUID(),
      visitId,
      patientId,
      submittedAt: new Date(),
      responses,
    };

    this.questionnaires.set(questionnaire.id, questionnaire);

    // Extract chief complaint and symptoms from questionnaire
    const chiefComplaintResponse = responses.find((r) => r.question.includes('chief complaint'));
    if (chiefComplaintResponse) {
      visit.chiefComplaint = chiefComplaintResponse.answer as string;
    }

    const symptomsResponse = responses.find((r) => r.question.includes('symptoms'));
    if (symptomsResponse && Array.isArray(symptomsResponse.answer)) {
      visit.symptoms = symptomsResponse.answer as string[];
    }

    this.visits.set(visitId, visit);

    logger.info({ visitId, patientId }, 'Pre-visit questionnaire submitted');

    return questionnaire;
  }

  /**
   * Get questionnaire for visit
   */
  static async getQuestionnaire(visitId: string): Promise<PreVisitQuestionnaire | null> {
    return (
      Array.from(this.questionnaires.values()).find((q) => q.visitId === visitId) || null
    );
  }

  // ========== Statistics ==========

  /**
   * Get telehealth statistics
   */
  static async getStatistics(providerId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalVisits: number;
    completedVisits: number;
    cancelledVisits: number;
    noShowRate: number;
    averageDuration: number;
    totalRevenue: number;
    visitsByType: Record<VisitType, number>;
    visitsByStatus: Record<VisitStatus, number>;
    averageWaitTime: number;
    technicalIssueRate: number;
  }> {
    let visits = Array.from(this.visits.values());

    if (providerId) {
      visits = visits.filter((v) => v.providerId === providerId);
    }

    if (startDate) {
      visits = visits.filter((v) => v.scheduledDate >= startDate);
    }

    if (endDate) {
      visits = visits.filter((v) => v.scheduledDate <= endDate);
    }

    const totalVisits = visits.length;
    const completedVisits = visits.filter((v) => v.status === 'completed').length;
    const cancelledVisits = visits.filter((v) => v.status === 'cancelled').length;
    const noShowVisits = visits.filter((v) => v.status === 'no_show').length;

    const noShowRate = totalVisits > 0 ? (noShowVisits / totalVisits) * 100 : 0;

    const durations = visits
      .filter((v) => v.actualDuration)
      .map((v) => v.actualDuration!);
    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const totalRevenue = visits
      .filter((v) => v.paymentStatus === 'paid')
      .reduce((sum, v) => sum + v.cost, 0);

    const visitsByType: Record<VisitType, number> = {
      initial_consultation: 0,
      follow_up: 0,
      urgent_care: 0,
      prescription_refill: 0,
      second_opinion: 0,
      post_op_checkup: 0,
      chronic_care_management: 0,
    };

    visits.forEach((v) => {
      visitsByType[v.visitType]++;
    });

    const visitsByStatus: Record<VisitStatus, number> = {
      scheduled: 0,
      waiting_room: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      technical_issue: 0,
    };

    visits.forEach((v) => {
      visitsByStatus[v.status]++;
    });

    const waitTimes = visits
      .filter((v) => v.checkedInAt && v.startedAt)
      .map((v) => (v.startedAt!.getTime() - v.checkedInAt!.getTime()) / (1000 * 60));

    const averageWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((sum, w) => sum + w, 0) / waitTimes.length
      : 0;

    const visitsWithIssues = visits.filter(
      (v) => v.technicalIssues && v.technicalIssues.length > 0
    ).length;

    const technicalIssueRate = totalVisits > 0 ? (visitsWithIssues / totalVisits) * 100 : 0;

    return {
      totalVisits,
      completedVisits,
      cancelledVisits,
      noShowRate,
      averageDuration,
      totalRevenue,
      visitsByType,
      visitsByStatus,
      averageWaitTime,
      technicalIssueRate,
    };
  }
}
