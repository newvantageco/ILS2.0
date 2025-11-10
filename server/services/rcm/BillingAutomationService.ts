/**
 * Billing Automation Service
 *
 * Automates charge capture, billing, collections, and financial workflows
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Charge
 */
export interface Charge {
  id: string;
  chargeNumber: string;
  patientId: string;
  encounterId: string;
  providerId: string;

  // Service details
  serviceDate: Date;
  procedureCode: string; // CPT code
  modifiers?: string[];
  diagnosisCodes: string[]; // ICD-10 codes
  units: number;
  chargeAmount: number; // in cents

  // Status
  status: 'pending' | 'billed' | 'on_hold' | 'voided';
  billedDate?: Date;
  claimId?: string;

  // Metadata
  createdAt: Date;
  createdBy: string;
  notes?: string;
}

/**
 * Charge capture rule
 */
export interface ChargeCaptureRule {
  id: string;
  name: string;
  description: string;
  active: boolean;

  // Trigger
  triggerEvent: 'appointment_completed' | 'procedure_completed' | 'service_rendered';
  triggerConditions?: Record<string, any>;

  // Actions
  actions: {
    type: 'create_charge' | 'notify' | 'create_task';
    parameters: Record<string, any>;
  }[];

  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

/**
 * Collections case
 */
export interface CollectionsCase {
  id: string;
  caseNumber: string;
  patientId: string;
  status: 'new' | 'in_progress' | 'payment_plan' | 'legal' | 'closed' | 'written_off';

  // Financial details
  originalBalance: number;
  currentBalance: number;
  payments: number;
  writeOffs: number;

  // Aging
  daysPastDue: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '91-120' | '120+';

  // Activity
  lastContactDate?: Date;
  lastContactMethod?: 'phone' | 'email' | 'letter';
  nextFollowUpDate?: Date;
  contactAttempts: number;

  // Assignment
  assignedTo?: string;
  assignedDate?: Date;

  // Metadata
  createdAt: Date;
  createdBy: string;
  closedDate?: Date;
  closedReason?: string;
  notes?: string;
}

/**
 * Collections activity
 */
export interface CollectionsActivity {
  id: string;
  caseId: string;
  activityType: 'call' | 'email' | 'letter' | 'payment' | 'promise_to_pay' | 'note';
  activityDate: Date;
  performedBy: string;

  // Details
  contactResult?: 'answered' | 'no_answer' | 'left_message' | 'busy';
  promiseAmount?: number;
  promiseDate?: Date;
  notes?: string;
}

/**
 * Write-off
 */
export interface WriteOff {
  id: string;
  writeOffNumber: string;
  type: 'bad_debt' | 'courtesy' | 'contract_adjustment' | 'small_balance';
  amount: number;

  // References
  patientId?: string;
  claimId?: string;
  collectionsCaseId?: string;

  // Approval
  reason: string;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Fee schedule
 */
export interface FeeSchedule {
  id: string;
  name: string;
  description?: string;
  effectiveDate: Date;
  expirationDate?: Date;
  active: boolean;

  // Fee schedule items
  items: {
    procedureCode: string;
    description: string;
    amount: number; // in cents
    modifierAdjustments?: {
      modifier: string;
      adjustmentPercent: number;
    }[];
  }[];
}

/**
 * Contract
 */
export interface PayerContract {
  id: string;
  contractNumber: string;
  payerId: string;
  payerName: string;

  // Terms
  contractType: 'fee_for_service' | 'capitation' | 'case_rate' | 'percentage_of_charges';
  effectiveDate: Date;
  expirationDate?: Date;
  autoRenew: boolean;

  // Financial terms
  reimbursementRate?: number; // Percentage for percentage_of_charges
  feeScheduleId?: string;

  // Claims
  timelyFilingDays: number;
  appealLimitDays: number;

  status: 'active' | 'pending' | 'expired' | 'terminated';
  notes?: string;
}

/**
 * Billing Automation Service
 */
export class BillingAutomationService {
  /**
   * In-memory stores (use database in production)
   */
  private static charges = new Map<string, Charge>();
  private static chargeCaptureRules = new Map<string, ChargeCaptureRule>();
  private static collectionsCases = new Map<string, CollectionsCase>();
  private static collectionsActivities: CollectionsActivity[] = [];
  private static writeOffs = new Map<string, WriteOff>();
  private static feeSchedules = new Map<string, FeeSchedule>();
  private static contracts = new Map<string, PayerContract>();
  private static chargeCounter = 1000;
  private static caseCounter = 1000;
  private static writeOffCounter = 1000;

  /**
   * Initialize default data
   */
  static {
    this.initializeDefaultFeeSchedule();
    this.initializeDefaultRules();
  }

  // ========== Charge Capture ==========

  /**
   * Initialize default fee schedule
   */
  private static initializeDefaultFeeSchedule(): void {
    const defaultSchedule: FeeSchedule = {
      id: crypto.randomUUID(),
      name: 'Standard Fee Schedule',
      description: 'Default fee schedule for ophthalmic services',
      effectiveDate: new Date('2024-01-01'),
      active: true,
      items: [
        {
          procedureCode: '92004',
          description: 'Comprehensive eye exam, new patient',
          amount: 15000, // $150
        },
        {
          procedureCode: '92014',
          description: 'Comprehensive eye exam, established patient',
          amount: 10000, // $100
        },
        {
          procedureCode: '92134',
          description: 'OCT imaging',
          amount: 7500, // $75
        },
        {
          procedureCode: '92250',
          description: 'Fundus photography',
          amount: 5000, // $50
        },
        {
          procedureCode: '92083',
          description: 'Visual field examination',
          amount: 6000, // $60
        },
        {
          procedureCode: '66984',
          description: 'Cataract surgery with IOL',
          amount: 250000, // $2500
        },
        {
          procedureCode: '67228',
          description: 'Intravitreal injection',
          amount: 180000, // $1800
        },
      ],
    };

    this.feeSchedules.set(defaultSchedule.id, defaultSchedule);

    logger.info('Default fee schedule initialized');
  }

  /**
   * Initialize default charge capture rules
   */
  private static initializeDefaultRules(): void {
    const rules: Omit<ChargeCaptureRule, 'id' | 'createdAt'>[] = [
      {
        name: 'Auto-charge for completed appointments',
        description: 'Automatically create charges when appointments are marked as completed',
        active: true,
        triggerEvent: 'appointment_completed',
        actions: [
          {
            type: 'create_charge',
            parameters: {
              useProcedureFromAppointment: true,
              useDefaultFeeSchedule: true,
            },
          },
        ],
      },
      {
        name: 'Notify for unbilled charges',
        description: 'Send notification when charges remain unbilled for 24 hours',
        active: true,
        triggerEvent: 'service_rendered',
        actions: [
          {
            type: 'notify',
            parameters: {
              recipients: ['billing_team'],
              message: 'Unbilled charges need attention',
            },
          },
        ],
      },
    ];

    rules.forEach((rule) => {
      const newRule: ChargeCaptureRule = {
        id: crypto.randomUUID(),
        ...rule,
        createdAt: new Date(),
      };
      this.chargeCaptureRules.set(newRule.id, newRule);
    });

    logger.info({ ruleCount: this.chargeCaptureRules.size }, 'Charge capture rules initialized');
  }

  /**
   * Create charge
   */
  static createCharge(
    chargeData: Omit<Charge, 'id' | 'chargeNumber' | 'status' | 'createdAt'>
  ): Charge {
    const chargeNumber = `CHG-${this.chargeCounter++}`;

    const charge: Charge = {
      id: crypto.randomUUID(),
      chargeNumber,
      status: 'pending',
      ...chargeData,
      createdAt: new Date(),
    };

    this.charges.set(charge.id, charge);

    logger.info({ chargeId: charge.id, chargeNumber, amount: charge.chargeAmount }, 'Charge created');

    return charge;
  }

  /**
   * Auto-capture charges from encounter
   */
  static autoCaptureCharges(
    encounterId: string,
    patientId: string,
    providerId: string,
    serviceDate: Date,
    procedures: {
      procedureCode: string;
      units: number;
      diagnosisCodes: string[];
    }[],
    createdBy: string
  ): Charge[] {
    const charges: Charge[] = [];

    // Get default fee schedule
    const feeSchedule = Array.from(this.feeSchedules.values()).find((fs) => fs.active);

    procedures.forEach((procedure) => {
      // Lookup charge amount from fee schedule
      let chargeAmount = 0;
      if (feeSchedule) {
        const feeItem = feeSchedule.items.find((item) => item.procedureCode === procedure.procedureCode);
        if (feeItem) {
          chargeAmount = feeItem.amount * procedure.units;
        }
      }

      if (chargeAmount === 0) {
        logger.warn(
          { procedureCode: procedure.procedureCode },
          'No fee found for procedure code, using default amount'
        );
        chargeAmount = 10000; // Default $100
      }

      const charge = this.createCharge({
        patientId,
        encounterId,
        providerId,
        serviceDate,
        procedureCode: procedure.procedureCode,
        diagnosisCodes: procedure.diagnosisCodes,
        units: procedure.units,
        chargeAmount,
        createdBy,
      });

      charges.push(charge);
    });

    logger.info({ encounterId, chargeCount: charges.length }, 'Charges auto-captured');

    return charges;
  }

  /**
   * Get charge
   */
  static getCharge(chargeId: string): Charge | null {
    return this.charges.get(chargeId) || null;
  }

  /**
   * List charges
   */
  static listCharges(filters?: {
    patientId?: string;
    encounterId?: string;
    status?: Charge['status'];
    dateFrom?: Date;
    dateTo?: Date;
  }): Charge[] {
    let charges = Array.from(this.charges.values());

    if (filters) {
      if (filters.patientId) {
        charges = charges.filter((c) => c.patientId === filters.patientId);
      }
      if (filters.encounterId) {
        charges = charges.filter((c) => c.encounterId === filters.encounterId);
      }
      if (filters.status) {
        charges = charges.filter((c) => c.status === filters.status);
      }
      if (filters.dateFrom) {
        charges = charges.filter((c) => c.serviceDate >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        charges = charges.filter((c) => c.serviceDate <= filters.dateTo!);
      }
    }

    return charges.sort((a, b) => b.serviceDate.getTime() - a.serviceDate.getTime());
  }

  /**
   * Update charge status
   */
  static updateChargeStatus(chargeId: string, status: Charge['status']): Charge | null {
    const charge = this.charges.get(chargeId);

    if (!charge) {
      return null;
    }

    charge.status = status;

    if (status === 'billed') {
      charge.billedDate = new Date();
    }

    this.charges.set(chargeId, charge);

    return charge;
  }

  // ========== Collections ==========

  /**
   * Create collections case
   */
  static createCollectionsCase(
    patientId: string,
    originalBalance: number,
    daysPastDue: number,
    createdBy: string
  ): CollectionsCase {
    const caseNumber = `COLL-${this.caseCounter++}`;

    // Determine aging bucket
    let agingBucket: CollectionsCase['agingBucket'];
    if (daysPastDue <= 30) {
      agingBucket = '0-30';
    } else if (daysPastDue <= 60) {
      agingBucket = '31-60';
    } else if (daysPastDue <= 90) {
      agingBucket = '61-90';
    } else if (daysPastDue <= 120) {
      agingBucket = '91-120';
    } else {
      agingBucket = '120+';
    }

    const collectionsCase: CollectionsCase = {
      id: crypto.randomUUID(),
      caseNumber,
      patientId,
      status: 'new',
      originalBalance,
      currentBalance: originalBalance,
      payments: 0,
      writeOffs: 0,
      daysPastDue,
      agingBucket,
      contactAttempts: 0,
      createdAt: new Date(),
      createdBy,
    };

    this.collectionsCases.set(collectionsCase.id, collectionsCase);

    logger.info(
      { caseId: collectionsCase.id, caseNumber, balance: originalBalance },
      'Collections case created'
    );

    return collectionsCase;
  }

  /**
   * Record collections activity
   */
  static recordCollectionsActivity(
    caseId: string,
    activityData: Omit<CollectionsActivity, 'id' | 'caseId'>
  ): CollectionsActivity {
    const activity: CollectionsActivity = {
      id: crypto.randomUUID(),
      caseId,
      ...activityData,
    };

    this.collectionsActivities.push(activity);

    // Update case
    const collectionsCase = this.collectionsCases.get(caseId);
    if (collectionsCase) {
      collectionsCase.lastContactDate = activity.activityDate;
      if (['call', 'email', 'letter'].includes(activity.activityType)) {
        collectionsCase.lastContactMethod = activity.activityType as any;
        collectionsCase.contactAttempts++;
      }

      this.collectionsCases.set(caseId, collectionsCase);
    }

    logger.info({ activityId: activity.id, caseId, activityType: activity.activityType }, 'Collections activity recorded');

    return activity;
  }

  /**
   * Get collections case
   */
  static getCollectionsCase(caseId: string): CollectionsCase | null {
    return this.collectionsCases.get(caseId) || null;
  }

  /**
   * Get case activities
   */
  static getCaseActivities(caseId: string): CollectionsActivity[] {
    return this.collectionsActivities
      .filter((a) => a.caseId === caseId)
      .sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime());
  }

  /**
   * Update case status
   */
  static updateCaseStatus(
    caseId: string,
    status: CollectionsCase['status'],
    closedReason?: string
  ): CollectionsCase | null {
    const collectionsCase = this.collectionsCases.get(caseId);

    if (!collectionsCase) {
      return null;
    }

    collectionsCase.status = status;

    if (status === 'closed') {
      collectionsCase.closedDate = new Date();
      collectionsCase.closedReason = closedReason;
    }

    this.collectionsCases.set(caseId, collectionsCase);

    return collectionsCase;
  }

  /**
   * Assign case
   */
  static assignCase(caseId: string, assignedTo: string): CollectionsCase | null {
    const collectionsCase = this.collectionsCases.get(caseId);

    if (!collectionsCase) {
      return null;
    }

    collectionsCase.assignedTo = assignedTo;
    collectionsCase.assignedDate = new Date();
    collectionsCase.status = 'in_progress';

    this.collectionsCases.set(caseId, collectionsCase);

    logger.info({ caseId, assignedTo }, 'Collections case assigned');

    return collectionsCase;
  }

  // ========== Write-Offs ==========

  /**
   * Request write-off
   */
  static requestWriteOff(
    writeOffData: Omit<WriteOff, 'id' | 'writeOffNumber' | 'status' | 'requestedAt'>
  ): WriteOff {
    const writeOffNumber = `WO-${this.writeOffCounter++}`;

    const writeOff: WriteOff = {
      id: crypto.randomUUID(),
      writeOffNumber,
      status: 'pending',
      requestedAt: new Date(),
      ...writeOffData,
    };

    this.writeOffs.set(writeOff.id, writeOff);

    logger.info({ writeOffId: writeOff.id, writeOffNumber, amount: writeOff.amount }, 'Write-off requested');

    return writeOff;
  }

  /**
   * Approve write-off
   */
  static approveWriteOff(writeOffId: string, approvedBy: string): WriteOff | null {
    const writeOff = this.writeOffs.get(writeOffId);

    if (!writeOff) {
      return null;
    }

    writeOff.status = 'approved';
    writeOff.approvedBy = approvedBy;
    writeOff.approvedAt = new Date();

    // Update collections case if applicable
    if (writeOff.collectionsCaseId) {
      const collectionsCase = this.collectionsCases.get(writeOff.collectionsCaseId);
      if (collectionsCase) {
        collectionsCase.writeOffs += writeOff.amount;
        collectionsCase.currentBalance -= writeOff.amount;

        if (collectionsCase.currentBalance <= 0) {
          collectionsCase.status = 'closed';
          collectionsCase.closedDate = new Date();
          collectionsCase.closedReason = 'Written off';
        } else {
          collectionsCase.status = 'written_off';
        }

        this.collectionsCases.set(collectionsCase.id, collectionsCase);
      }
    }

    this.writeOffs.set(writeOffId, writeOff);

    logger.info({ writeOffId, approvedBy }, 'Write-off approved');

    return writeOff;
  }

  /**
   * Get write-off
   */
  static getWriteOff(writeOffId: string): WriteOff | null {
    return this.writeOffs.get(writeOffId) || null;
  }

  // ========== Fee Schedules & Contracts ==========

  /**
   * Create fee schedule
   */
  static createFeeSchedule(
    feeScheduleData: Omit<FeeSchedule, 'id'>
  ): FeeSchedule {
    const feeSchedule: FeeSchedule = {
      id: crypto.randomUUID(),
      ...feeScheduleData,
    };

    this.feeSchedules.set(feeSchedule.id, feeSchedule);

    logger.info({ feeScheduleId: feeSchedule.id, name: feeSchedule.name }, 'Fee schedule created');

    return feeSchedule;
  }

  /**
   * Get fee schedule
   */
  static getFeeSchedule(feeScheduleId: string): FeeSchedule | null {
    return this.feeSchedules.get(feeScheduleId) || null;
  }

  /**
   * Lookup fee
   */
  static lookupFee(procedureCode: string, feeScheduleId?: string): number | null {
    let feeSchedule: FeeSchedule | undefined;

    if (feeScheduleId) {
      feeSchedule = this.feeSchedules.get(feeScheduleId);
    } else {
      // Use default active fee schedule
      feeSchedule = Array.from(this.feeSchedules.values()).find((fs) => fs.active);
    }

    if (!feeSchedule) {
      return null;
    }

    const feeItem = feeSchedule.items.find((item) => item.procedureCode === procedureCode);

    return feeItem ? feeItem.amount : null;
  }

  /**
   * List fee schedules
   */
  static getFeeSchedules(active?: boolean): FeeSchedule[] {
    let schedules = Array.from(this.feeSchedules.values());

    if (active !== undefined) {
      schedules = schedules.filter((fs) => fs.active === active);
    }

    return schedules.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  }

  // ========== Payer Contracts ==========

  /**
   * Create payer contract
   */
  static createPayerContract(contractData: Omit<PayerContract, 'id' | 'contractNumber'>): PayerContract {
    const contractNumber = `CON-${Date.now()}`;

    const contract: PayerContract = {
      id: crypto.randomUUID(),
      contractNumber,
      ...contractData,
    };

    this.contracts.set(contract.id, contract);

    logger.info({ contractId: contract.id, payerName: contract.payerName }, 'Payer contract created');

    return contract;
  }

  /**
   * Get payer contracts
   */
  static getPayerContracts(payerId?: string, active?: boolean): PayerContract[] {
    let contracts = Array.from(this.contracts.values());

    if (payerId) {
      contracts = contracts.filter((c) => c.payerId === payerId);
    }

    if (active !== undefined) {
      const isActive = active;
      contracts = contracts.filter((c) => (c.status === 'active') === isActive);
    }

    return contracts.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  }

  // ========== Charge Capture Rules ==========

  /**
   * Create charge capture rule
   */
  static createChargeCaptureRule(ruleData: Omit<ChargeCaptureRule, 'id' | 'createdAt'>): ChargeCaptureRule {
    const rule: ChargeCaptureRule = {
      id: crypto.randomUUID(),
      ...ruleData,
      createdAt: new Date(),
    };

    this.chargeCaptureRules.set(rule.id, rule);

    logger.info({ ruleId: rule.id, name: rule.name }, 'Charge capture rule created');

    return rule;
  }

  /**
   * Get charge capture rules
   */
  static getChargeCaptureRules(active?: boolean): ChargeCaptureRule[] {
    let rules = Array.from(this.chargeCaptureRules.values());

    if (active !== undefined) {
      rules = rules.filter((r) => r.active === active);
    }

    return rules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ========== Convenience Methods ==========

  /**
   * Get charge by ID (alias for getCharge)
   */
  static getChargeById(chargeId: string): Charge | null {
    return this.getCharge(chargeId);
  }

  /**
   * Get charges by patient
   */
  static getChargesByPatient(patientId: string): Charge[] {
    return this.listCharges({ patientId });
  }

  /**
   * Get charges by encounter
   */
  static getChargesByEncounter(encounterId: string): Charge[] {
    return this.listCharges({ encounterId });
  }

  /**
   * Get collections case by ID (alias for getCollectionsCase)
   */
  static getCollectionsCaseById(caseId: string): CollectionsCase | null {
    return this.getCollectionsCase(caseId);
  }

  /**
   * Get collections cases by patient
   */
  static getCollectionsCasesByPatient(patientId: string): CollectionsCase[] {
    return Array.from(this.collectionsCases.values())
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get collections activities by case (alias for getCaseActivities)
   */
  static getCollectionsActivitiesByCase(caseId: string): CollectionsActivity[] {
    return this.getCaseActivities(caseId);
  }

  /**
   * Add collections activity (alias for recordCollectionsActivity)
   */
  static addCollectionsActivity(
    caseId: string,
    activity: Omit<CollectionsActivity, 'id' | 'caseId' | 'activityDate'>
  ): CollectionsActivity {
    return this.recordCollectionsActivity(caseId, activity);
  }

  /**
   * Create write-off (alias for requestWriteOff)
   */
  static createWriteOff(
    writeOffData: Omit<WriteOff, 'id' | 'writeOffNumber' | 'status' | 'requestedAt'>
  ): WriteOff {
    return this.requestWriteOff(writeOffData);
  }

  /**
   * Get write-offs by patient
   */
  static getWriteOffsByPatient(patientId: string): WriteOff[] {
    return Array.from(this.writeOffs.values())
      .filter((w) => w.patientId === patientId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  /**
   * Reject write-off
   */
  static rejectWriteOff(writeOffId: string, rejectedBy: string, reason?: string): WriteOff | null {
    const writeOff = this.writeOffs.get(writeOffId);

    if (!writeOff) {
      return null;
    }

    if (writeOff.status !== 'pending') {
      logger.warn({ writeOffId }, 'Cannot reject non-pending write-off');
      return null;
    }

    writeOff.status = 'rejected';
    writeOff.approvedBy = rejectedBy;
    writeOff.approvedAt = new Date();

    this.writeOffs.set(writeOffId, writeOff);

    logger.info({ writeOffId, rejectedBy, reason }, 'Write-off rejected');

    return writeOff;
  }

  /**
   * Generate aging report (alias for getAgingReport)
   */
  static generateAgingReport(): Record<CollectionsCase['agingBucket'], number> {
    return this.getAgingReport();
  }

  // ========== Statistics ==========

  /**
   * Get billing statistics
   */
  static getStatistics(): {
    totalCharges: number;
    totalChargeAmount: number;
    unbilledCharges: number;
    unbilledAmount: number;
    activeCollectionsCases: number;
    totalCollectionsBalance: number;
    totalWriteOffs: number;
    totalWriteOffAmount: number;
  } {
    const charges = Array.from(this.charges.values());
    const collectionsCases = Array.from(this.collectionsCases.values()).filter(
      (c) => c.status !== 'closed'
    );
    const writeOffs = Array.from(this.writeOffs.values()).filter((w) => w.status === 'approved');

    const unbilledCharges = charges.filter((c) => c.status === 'pending');

    return {
      totalCharges: charges.length,
      totalChargeAmount: charges.reduce((sum, c) => sum + c.chargeAmount, 0),
      unbilledCharges: unbilledCharges.length,
      unbilledAmount: unbilledCharges.reduce((sum, c) => sum + c.chargeAmount, 0),
      activeCollectionsCases: collectionsCases.length,
      totalCollectionsBalance: collectionsCases.reduce((sum, c) => sum + c.currentBalance, 0),
      totalWriteOffs: writeOffs.length,
      totalWriteOffAmount: writeOffs.reduce((sum, w) => sum + w.amount, 0),
    };
  }

  /**
   * Get aging report
   */
  static getAgingReport(): Record<CollectionsCase['agingBucket'], number> {
    const collectionsCases = Array.from(this.collectionsCases.values()).filter(
      (c) => c.status !== 'closed'
    );

    const aging: Record<CollectionsCase['agingBucket'], number> = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '91-120': 0,
      '120+': 0,
    };

    collectionsCases.forEach((c) => {
      aging[c.agingBucket] += c.currentBalance;
    });

    return aging;
  }
}
