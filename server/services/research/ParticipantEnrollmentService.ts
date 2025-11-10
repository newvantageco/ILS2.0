import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

export type ParticipantStatus = 'screening' | 'enrolled' | 'active' | 'completed' | 'withdrawn' | 'screen_failed';
export type ConsentStatus = 'pending' | 'obtained' | 'withdrawn' | 'expired';
export type WithdrawalReason = 'adverse_event' | 'lack_efficacy' | 'personal_choice' | 'protocol_violation' | 'lost_to_followup' | 'other';

export interface ResearchParticipant {
  id: string;
  subjectNumber: string;
  trialId: string;
  siteId: string;
  patientId: string;
  studyArmId?: string;
  status: ParticipantStatus;
  screeningDate: Date;
  enrollmentDate?: Date;
  completionDate?: Date;
  withdrawalDate?: Date;
  withdrawalReason?: WithdrawalReason;
}

export interface ScreeningAssessment {
  id: string;
  participantId: string;
  trialId: string;
  assessmentDate: Date;
  inclusionCriteriaMet: boolean;
  exclusionCriteriaPresent: boolean;
  eligible: boolean;
  criteriaChecklist: Array<{
    criterion: string;
    met: boolean;
    notes?: string;
  }>;
  assessedBy: string;
}

export interface InformedConsent {
  id: string;
  participantId: string;
  trialId: string;
  consentVersion: string;
  consentDate: Date;
  expirationDate?: Date;
  status: ConsentStatus;
  consentedBy: string;
  witnessedBy?: string;
  consentFormSigned: boolean;
  hipaaAuthorizationSigned: boolean;
  withdrawnDate?: Date;
}

export interface Randomization {
  id: string;
  participantId: string;
  trialId: string;
  studyArmId: string;
  randomizationDate: Date;
  stratificationFactors?: Record<string, any>;
  randomizationMethod: string;
  randomizedBy: string;
}

export interface ParticipantWithdrawal {
  id: string;
  participantId: string;
  trialId: string;
  withdrawalDate: Date;
  reason: WithdrawalReason;
  reasonDetails: string;
  continueFollowup: boolean;
  reportedBy: string;
}

export class ParticipantEnrollmentService {
  private static participants: Map<string, ResearchParticipant> = new Map();
  private static screenings: Map<string, ScreeningAssessment> = new Map();
  private static consents: Map<string, InformedConsent> = new Map();
  private static randomizations: Map<string, Randomization> = new Map();
  private static withdrawals: Map<string, ParticipantWithdrawal> = new Map();
  private static subjectCounter = 10000;

  static createParticipant(data: Omit<ResearchParticipant, 'id' | 'subjectNumber' | 'status' | 'screeningDate'>): ResearchParticipant {
    const participant: ResearchParticipant = {
      ...data,
      id: uuidv4(),
      subjectNumber: `SUB-${String(this.subjectCounter++).padStart(6, '0')}`,
      status: 'screening',
      screeningDate: new Date()
    };
    this.participants.set(participant.id, participant);
    logger.info(`Participant created: ${participant.subjectNumber}`);
    return participant;
  }

  static recordScreening(data: Omit<ScreeningAssessment, 'id' | 'assessmentDate'>): ScreeningAssessment {
    const screening: ScreeningAssessment = {
      ...data,
      id: uuidv4(),
      assessmentDate: new Date()
    };
    this.screenings.set(screening.id, screening);

    // Update participant status
    const participant = this.participants.get(screening.participantId);
    if (participant) {
      if (!screening.eligible) {
        participant.status = 'screen_failed';
        logger.info(`Participant ${participant.subjectNumber} failed screening`);
      }
    }

    return screening;
  }

  static obtainConsent(data: Omit<InformedConsent, 'id' | 'consentDate' | 'status'>): InformedConsent {
    const consent: InformedConsent = {
      ...data,
      id: uuidv4(),
      consentDate: new Date(),
      status: 'obtained'
    };
    this.consents.set(consent.id, consent);
    logger.info(`Informed consent obtained for participant: ${data.participantId}`);
    return consent;
  }

  static enrollParticipant(participantId: string): ResearchParticipant {
    const participant = this.participants.get(participantId);
    if (!participant) throw new Error('Participant not found');

    // Check eligibility
    const screening = Array.from(this.screenings.values())
      .find(s => s.participantId === participantId);
    if (!screening || !screening.eligible) {
      throw new Error('Participant is not eligible');
    }

    // Check consent
    const consent = Array.from(this.consents.values())
      .find(c => c.participantId === participantId && c.status === 'obtained');
    if (!consent) {
      throw new Error('Valid informed consent required');
    }

    participant.status = 'enrolled';
    participant.enrollmentDate = new Date();
    logger.info(`Participant ${participant.subjectNumber} enrolled`);
    return participant;
  }

  static randomizeParticipant(data: Omit<Randomization, 'id' | 'randomizationDate'>): Randomization {
    const participant = this.participants.get(data.participantId);
    if (!participant) throw new Error('Participant not found');
    if (participant.status !== 'enrolled') throw new Error('Participant must be enrolled');

    const randomization: Randomization = {
      ...data,
      id: uuidv4(),
      randomizationDate: new Date()
    };
    this.randomizations.set(randomization.id, randomization);

    // Update participant
    participant.studyArmId = randomization.studyArmId;
    participant.status = 'active';

    logger.info(`Participant ${participant.subjectNumber} randomized to arm ${randomization.studyArmId}`);
    return randomization;
  }

  static withdrawParticipant(data: Omit<ParticipantWithdrawal, 'id' | 'withdrawalDate'>): ParticipantWithdrawal {
    const participant = this.participants.get(data.participantId);
    if (!participant) throw new Error('Participant not found');

    const withdrawal: ParticipantWithdrawal = {
      ...data,
      id: uuidv4(),
      withdrawalDate: new Date()
    };
    this.withdrawals.set(withdrawal.id, withdrawal);

    // Update participant
    participant.status = 'withdrawn';
    participant.withdrawalDate = withdrawal.withdrawalDate;
    participant.withdrawalReason = withdrawal.reason;

    // Withdraw consent if applicable
    const consents = Array.from(this.consents.values())
      .filter(c => c.participantId === data.participantId && c.status === 'obtained');
    consents.forEach(c => {
      c.status = 'withdrawn';
      c.withdrawnDate = withdrawal.withdrawalDate;
    });

    logger.info(`Participant ${participant.subjectNumber} withdrawn: ${withdrawal.reason}`);
    return withdrawal;
  }

  static completeParticipant(participantId: string): ResearchParticipant {
    const participant = this.participants.get(participantId);
    if (!participant) throw new Error('Participant not found');
    participant.status = 'completed';
    participant.completionDate = new Date();
    logger.info(`Participant ${participant.subjectNumber} completed study`);
    return participant;
  }

  static getParticipant(participantId: string): ResearchParticipant | undefined {
    return this.participants.get(participantId);
  }

  static getParticipants(trialId: string, status?: ParticipantStatus): ResearchParticipant[] {
    let participants = Array.from(this.participants.values()).filter(p => p.trialId === trialId);
    if (status) participants = participants.filter(p => p.status === status);
    return participants.sort((a, b) => a.subjectNumber.localeCompare(b.subjectNumber));
  }

  static getScreening(participantId: string): ScreeningAssessment | undefined {
    return Array.from(this.screenings.values()).find(s => s.participantId === participantId);
  }

  static getConsent(participantId: string): InformedConsent | undefined {
    return Array.from(this.consents.values())
      .filter(c => c.participantId === participantId)
      .sort((a, b) => b.consentDate.getTime() - a.consentDate.getTime())[0];
  }

  static getRandomization(participantId: string): Randomization | undefined {
    return Array.from(this.randomizations.values()).find(r => r.participantId === participantId);
  }

  static getWithdrawals(trialId: string): ParticipantWithdrawal[] {
    return Array.from(this.withdrawals.values())
      .filter(w => w.trialId === trialId)
      .sort((a, b) => b.withdrawalDate.getTime() - a.withdrawalDate.getTime());
  }

  static getEnrollmentStatistics(trialId: string) {
    const participants = this.getParticipants(trialId);
    const screenings = Array.from(this.screenings.values()).filter(s => s.trialId === trialId);
    const withdrawals = Array.from(this.withdrawals.values()).filter(w => w.trialId === trialId);

    return {
      totalScreened: participants.filter(p => p.status !== 'screening').length + participants.filter(p => p.status === 'screen_failed').length,
      screenFailed: participants.filter(p => p.status === 'screen_failed').length,
      enrolled: participants.filter(p => ['enrolled', 'active', 'completed', 'withdrawn'].includes(p.status)).length,
      active: participants.filter(p => p.status === 'active').length,
      completed: participants.filter(p => p.status === 'completed').length,
      withdrawn: participants.filter(p => p.status === 'withdrawn').length,
      screenFailRate: screenings.length > 0 ? (screenings.filter(s => !s.eligible).length / screenings.length * 100).toFixed(1) : '0.0',
      withdrawalRate: participants.filter(p => ['enrolled', 'active', 'completed', 'withdrawn'].includes(p.status)).length > 0
        ? (withdrawals.length / participants.filter(p => ['enrolled', 'active', 'completed', 'withdrawn'].includes(p.status)).length * 100).toFixed(1)
        : '0.0'
    };
  }

  static getStatistics() {
    const participants = Array.from(this.participants.values());
    return {
      totalParticipants: this.participants.size,
      activeParticipants: participants.filter(p => p.status === 'active').length,
      screening: participants.filter(p => p.status === 'screening').length,
      enrolled: participants.filter(p => p.status === 'enrolled').length,
      completed: participants.filter(p => p.status === 'completed').length,
      withdrawn: participants.filter(p => p.status === 'withdrawn').length,
      screenFailed: participants.filter(p => p.status === 'screen_failed').length
    };
  }
}
