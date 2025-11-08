/**
 * Payment Processing Service
 *
 * Handles payment processing for insurance payments, patient payments,
 * payment plans, and refunds
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Payment type
 */
export type PaymentType = 'insurance' | 'patient' | 'patient_copay' | 'patient_deductible' | 'patient_coinsurance';

/**
 * Payment method
 */
export type PaymentMethod =
  | 'check'
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'ach'
  | 'wire_transfer'
  | 'electronic';

/**
 * Payment status
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'voided';

/**
 * Payment
 */
export interface Payment {
  id: string;
  paymentNumber: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;

  // Payer information
  payerId?: string; // Insurance payer
  patientId?: string; // Patient

  // Amount
  amount: number; // in cents
  refundedAmount?: number;

  // Payment details
  checkNumber?: string;
  confirmationNumber?: string;
  transactionId?: string;
  last4?: string; // Last 4 digits of card

  // Allocation
  claimIds: string[];
  allocations: {
    claimId: string;
    amount: number;
  }[];

  // Dates
  paymentDate: Date;
  depositDate?: Date;
  processedDate?: Date;

  // Metadata
  notes?: string;
  createdAt: Date;
  createdBy: string;
  processedBy?: string;
}

/**
 * Payment plan
 */
export interface PaymentPlan {
  id: string;
  planNumber: string;
  patientId: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';

  // Financial details
  totalAmount: number; // in cents
  downPayment: number;
  balanceAmount: number;
  numberOfPayments: number;
  paymentAmount: number; // Per installment
  frequency: 'weekly' | 'bi-weekly' | 'monthly';

  // Schedule
  startDate: Date;
  nextPaymentDate: Date;
  paymentsMade: number;
  paymentsRemaining: number;

  // Tracking
  totalPaid: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;

  // Terms
  interestRate: number; // Percentage
  lateFee: number;
  daysPastDue: number;

  // Metadata
  createdAt: Date;
  createdBy: string;
  notes?: string;
}

/**
 * Payment plan installment
 */
export interface PaymentPlanInstallment {
  id: string;
  planId: string;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'late' | 'missed';
  paidDate?: Date;
  paidAmount?: number;
  paymentId?: string;
}

/**
 * Refund
 */
export interface Refund {
  id: string;
  refundNumber: string;
  originalPaymentId: string;
  amount: number; // in cents
  reason: string;
  method: PaymentMethod;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';

  // Details
  checkNumber?: string;
  confirmationNumber?: string;

  // Approval
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  processedAt?: Date;

  notes?: string;
}

/**
 * Patient statement
 */
export interface PatientStatement {
  id: string;
  statementNumber: string;
  patientId: string;
  statementDate: Date;
  dueDate: Date;

  // Financial summary
  previousBalance: number;
  newCharges: number;
  payments: number;
  adjustments: number;
  currentBalance: number;

  // Aging
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120Plus: number;

  // Line items
  lineItems: {
    date: Date;
    description: string;
    chargeAmount: number;
    insurancePayment: number;
    adjustment: number;
    patientResponsibility: number;
  }[];

  // Status
  sent: boolean;
  sentDate?: Date;
  sentMethod?: 'mail' | 'email' | 'portal';
  viewed: boolean;
  viewedDate?: Date;
}

/**
 * Payment Processing Service
 */
export class PaymentProcessingService {
  /**
   * In-memory stores (use database in production)
   */
  private static payments = new Map<string, Payment>();
  private static paymentPlans = new Map<string, PaymentPlan>();
  private static installments: PaymentPlanInstallment[] = [];
  private static refunds = new Map<string, Refund>();
  private static statements = new Map<string, PatientStatement>();
  private static paymentCounter = 1000;
  private static planCounter = 1000;
  private static refundCounter = 1000;
  private static statementCounter = 1000;

  // ========== Payment Processing ==========

  /**
   * Record payment
   */
  static recordPayment(
    paymentData: Omit<Payment, 'id' | 'paymentNumber' | 'status' | 'createdAt'>
  ): Payment {
    const paymentNumber = `PAY-${this.paymentCounter++}`;

    const payment: Payment = {
      id: crypto.randomUUID(),
      paymentNumber,
      status: 'pending',
      ...paymentData,
      createdAt: new Date(),
    };

    this.payments.set(payment.id, payment);

    logger.info(
      { paymentId: payment.id, paymentNumber, amount: payment.amount },
      'Payment recorded'
    );

    return payment;
  }

  /**
   * Process payment
   */
  static async processPayment(paymentId: string, processedBy: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'pending') {
      return { success: false, error: 'Payment already processed' };
    }

    payment.status = 'processing';
    this.payments.set(paymentId, payment);

    // Simulate payment processing
    // In production: Process through payment gateway (Stripe, Square, etc.)

    try {
      // Process based on method
      if (payment.method === 'credit_card' || payment.method === 'debit_card') {
        // Process card payment
        await this.processCardPayment(payment);
      } else if (payment.method === 'ach') {
        // Process ACH payment
        await this.processACHPayment(payment);
      } else if (payment.method === 'check') {
        // Record check payment
        await this.processCheckPayment(payment);
      } else {
        // Cash or other
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      payment.status = 'completed';
      payment.processedDate = new Date();
      payment.processedBy = processedBy;

      this.payments.set(paymentId, payment);

      logger.info({ paymentId, amount: payment.amount }, 'Payment processed successfully');

      return { success: true };
    } catch (error: any) {
      payment.status = 'failed';
      this.payments.set(paymentId, payment);

      logger.error({ paymentId, error: error.message }, 'Payment processing failed');

      return { success: false, error: error.message };
    }
  }

  /**
   * Process card payment
   */
  private static async processCardPayment(payment: Payment): Promise<void> {
    // In production: Use payment gateway API (Stripe, Square, etc.)
    await new Promise((resolve) => setTimeout(resolve, 500));

    payment.transactionId = `TXN-${crypto.randomUUID().substring(0, 8)}`;
    payment.confirmationNumber = `CONF-${crypto.randomUUID().substring(0, 8)}`;
  }

  /**
   * Process ACH payment
   */
  private static async processACHPayment(payment: Payment): Promise<void> {
    // In production: Submit ACH transaction
    await new Promise((resolve) => setTimeout(resolve, 500));

    payment.transactionId = `ACH-${crypto.randomUUID().substring(0, 8)}`;
  }

  /**
   * Process check payment
   */
  private static async processCheckPayment(payment: Payment): Promise<void> {
    // Record check details
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Get payment
   */
  static getPayment(paymentId: string): Payment | null {
    return this.payments.get(paymentId) || null;
  }

  /**
   * List payments
   */
  static listPayments(filters?: {
    patientId?: string;
    payerId?: string;
    status?: PaymentStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Payment[] {
    let payments = Array.from(this.payments.values());

    if (filters) {
      if (filters.patientId) {
        payments = payments.filter((p) => p.patientId === filters.patientId);
      }
      if (filters.payerId) {
        payments = payments.filter((p) => p.payerId === filters.payerId);
      }
      if (filters.status) {
        payments = payments.filter((p) => p.status === filters.status);
      }
      if (filters.dateFrom) {
        payments = payments.filter((p) => p.paymentDate >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        payments = payments.filter((p) => p.paymentDate <= filters.dateTo!);
      }
    }

    return payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }

  // ========== Payment Plans ==========

  /**
   * Create payment plan
   */
  static createPaymentPlan(
    patientId: string,
    totalAmount: number,
    downPayment: number,
    numberOfPayments: number,
    frequency: PaymentPlan['frequency'],
    createdBy: string
  ): PaymentPlan {
    const planNumber = `PLAN-${this.planCounter++}`;
    const balanceAmount = totalAmount - downPayment;
    const paymentAmount = Math.ceil(balanceAmount / numberOfPayments);

    const plan: PaymentPlan = {
      id: crypto.randomUUID(),
      planNumber,
      patientId,
      status: 'active',
      totalAmount,
      downPayment,
      balanceAmount,
      numberOfPayments,
      paymentAmount,
      frequency,
      startDate: new Date(),
      nextPaymentDate: this.calculateNextPaymentDate(new Date(), frequency),
      paymentsMade: 0,
      paymentsRemaining: numberOfPayments,
      totalPaid: downPayment,
      interestRate: 0, // No interest for simplicity
      lateFee: 2500, // $25 late fee
      daysPastDue: 0,
      createdAt: new Date(),
      createdBy,
    };

    this.paymentPlans.set(plan.id, plan);

    // Generate installments
    this.generateInstallments(plan);

    logger.info(
      { planId: plan.id, planNumber, totalAmount, numberOfPayments },
      'Payment plan created'
    );

    return plan;
  }

  /**
   * Generate installments
   */
  private static generateInstallments(plan: PaymentPlan): void {
    let dueDate = plan.nextPaymentDate;

    for (let i = 1; i <= plan.numberOfPayments; i++) {
      const installment: PaymentPlanInstallment = {
        id: crypto.randomUUID(),
        planId: plan.id,
        installmentNumber: i,
        dueDate: new Date(dueDate),
        amount: plan.paymentAmount,
        status: 'pending',
      };

      this.installments.push(installment);

      // Calculate next due date
      dueDate = this.calculateNextPaymentDate(dueDate, plan.frequency);
    }
  }

  /**
   * Calculate next payment date
   */
  private static calculateNextPaymentDate(
    currentDate: Date,
    frequency: PaymentPlan['frequency']
  ): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate;
  }

  /**
   * Record plan payment
   */
  static recordPlanPayment(
    planId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    createdBy: string
  ): { success: boolean; error?: string; payment?: Payment } {
    const plan = this.paymentPlans.get(planId);

    if (!plan) {
      return { success: false, error: 'Payment plan not found' };
    }

    if (plan.status !== 'active') {
      return { success: false, error: 'Payment plan is not active' };
    }

    // Find next pending installment
    const nextInstallment = this.installments.find(
      (i) => i.planId === planId && i.status === 'pending'
    );

    if (!nextInstallment) {
      return { success: false, error: 'No pending installments' };
    }

    // Record payment
    const payment = this.recordPayment({
      type: 'patient',
      method: paymentMethod,
      patientId: plan.patientId,
      amount,
      claimIds: [],
      allocations: [],
      paymentDate: new Date(),
      createdBy,
    });

    // Update installment
    nextInstallment.status = 'paid';
    nextInstallment.paidDate = new Date();
    nextInstallment.paidAmount = amount;
    nextInstallment.paymentId = payment.id;

    // Update plan
    plan.paymentsMade++;
    plan.paymentsRemaining--;
    plan.totalPaid += amount;
    plan.lastPaymentDate = new Date();
    plan.lastPaymentAmount = amount;
    plan.nextPaymentDate = this.calculateNextPaymentDate(plan.nextPaymentDate, plan.frequency);
    plan.daysPastDue = 0;

    if (plan.paymentsRemaining === 0) {
      plan.status = 'completed';
    }

    this.paymentPlans.set(planId, plan);

    logger.info({ planId, paymentId: payment.id, amount }, 'Payment plan payment recorded');

    return { success: true, payment };
  }

  /**
   * Get payment plan
   */
  static getPaymentPlan(planId: string): PaymentPlan | null {
    return this.paymentPlans.get(planId) || null;
  }

  /**
   * Get plan installments
   */
  static getPlanInstallments(planId: string): PaymentPlanInstallment[] {
    return this.installments
      .filter((i) => i.planId === planId)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  /**
   * Check for overdue installments
   */
  static checkOverdueInstallments(): void {
    const today = new Date();

    this.installments.forEach((installment) => {
      if (installment.status === 'pending' && installment.dueDate < today) {
        installment.status = 'late';

        // Update plan
        const plan = this.paymentPlans.get(installment.planId);
        if (plan) {
          const daysPastDue = Math.floor(
            (today.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          plan.daysPastDue = daysPastDue;

          if (daysPastDue > 30) {
            plan.status = 'defaulted';
          }

          this.paymentPlans.set(plan.id, plan);
        }
      }
    });
  }

  // ========== Refunds ==========

  /**
   * Request refund
   */
  static requestRefund(
    paymentId: string,
    amount: number,
    reason: string,
    requestedBy: string
  ): Refund {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    const refundNumber = `REF-${this.refundCounter++}`;

    const refund: Refund = {
      id: crypto.randomUUID(),
      refundNumber,
      originalPaymentId: paymentId,
      amount,
      reason,
      method: payment.method,
      status: 'pending',
      requestedBy,
      requestedAt: new Date(),
    };

    this.refunds.set(refund.id, refund);

    logger.info({ refundId: refund.id, refundNumber, amount }, 'Refund requested');

    return refund;
  }

  /**
   * Approve refund
   */
  static approveRefund(refundId: string, approvedBy: string): Refund | null {
    const refund = this.refunds.get(refundId);

    if (!refund) {
      return null;
    }

    refund.status = 'approved';
    refund.approvedBy = approvedBy;
    refund.approvedAt = new Date();

    this.refunds.set(refundId, refund);

    logger.info({ refundId, approvedBy }, 'Refund approved');

    return refund;
  }

  /**
   * Process refund
   */
  static async processRefund(refundId: string): Promise<{ success: boolean; error?: string }> {
    const refund = this.refunds.get(refundId);

    if (!refund) {
      return { success: false, error: 'Refund not found' };
    }

    if (refund.status !== 'approved') {
      return { success: false, error: 'Refund not approved' };
    }

    refund.status = 'processing';
    this.refunds.set(refundId, refund);

    try {
      // Process refund based on method
      // In production: Process through payment gateway
      await new Promise((resolve) => setTimeout(resolve, 500));

      refund.status = 'completed';
      refund.processedAt = new Date();
      refund.confirmationNumber = `CONF-${crypto.randomUUID().substring(0, 8)}`;

      // Update original payment
      const payment = this.payments.get(refund.originalPaymentId);
      if (payment) {
        payment.refundedAmount = (payment.refundedAmount || 0) + refund.amount;

        if (payment.refundedAmount >= payment.amount) {
          payment.status = 'refunded';
        } else {
          payment.status = 'partially_refunded';
        }

        this.payments.set(payment.id, payment);
      }

      this.refunds.set(refundId, refund);

      logger.info({ refundId, amount: refund.amount }, 'Refund processed');

      return { success: true };
    } catch (error: any) {
      refund.status = 'pending';
      this.refunds.set(refundId, refund);

      return { success: false, error: error.message };
    }
  }

  /**
   * Get refund
   */
  static getRefund(refundId: string): Refund | null {
    return this.refunds.get(refundId) || null;
  }

  // ========== Patient Statements ==========

  /**
   * Generate patient statement
   */
  static generateStatement(
    patientId: string,
    previousBalance: number,
    newCharges: number,
    payments: number,
    adjustments: number,
    lineItems: PatientStatement['lineItems']
  ): PatientStatement {
    const statementNumber = `STMT-${this.statementCounter++}`;
    const currentBalance = previousBalance + newCharges - payments - adjustments;

    // Calculate aging (simplified)
    const current = Math.max(0, newCharges);
    const days30 = Math.max(0, previousBalance * 0.4);
    const days60 = Math.max(0, previousBalance * 0.3);
    const days90 = Math.max(0, previousBalance * 0.2);
    const days120Plus = Math.max(0, previousBalance * 0.1);

    const statement: PatientStatement = {
      id: crypto.randomUUID(),
      statementNumber,
      patientId,
      statementDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      previousBalance,
      newCharges,
      payments,
      adjustments,
      currentBalance,
      current,
      days30,
      days60,
      days90,
      days120Plus,
      lineItems,
      sent: false,
      viewed: false,
    };

    this.statements.set(statement.id, statement);

    logger.info(
      { statementId: statement.id, statementNumber, currentBalance },
      'Patient statement generated'
    );

    return statement;
  }

  /**
   * Send statement
   */
  static sendStatement(
    statementId: string,
    method: PatientStatement['sentMethod']
  ): PatientStatement | null {
    const statement = this.statements.get(statementId);

    if (!statement) {
      return null;
    }

    statement.sent = true;
    statement.sentDate = new Date();
    statement.sentMethod = method;

    this.statements.set(statementId, statement);

    logger.info({ statementId, method }, 'Patient statement sent');

    return statement;
  }

  /**
   * Get statement
   */
  static getStatement(statementId: string): PatientStatement | null {
    return this.statements.get(statementId) || null;
  }

  /**
   * Get patient statements
   */
  static getPatientStatements(patientId: string): PatientStatement[] {
    return Array.from(this.statements.values())
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => b.statementDate.getTime() - a.statementDate.getTime());
  }

  // ========== Statistics ==========

  /**
   * Get payment statistics
   */
  static getStatistics(): {
    totalPayments: number;
    totalAmount: number;
    paymentsByType: Record<PaymentType, number>;
    paymentsByMethod: Record<PaymentMethod, number>;
    totalRefunded: number;
    activePlans: number;
    totalPlansAmount: number;
  } {
    const payments = Array.from(this.payments.values());
    const plans = Array.from(this.paymentPlans.values()).filter((p) => p.status === 'active');
    const refunds = Array.from(this.refunds.values()).filter((r) => r.status === 'completed');

    const paymentsByType: Record<PaymentType, number> = {
      insurance: 0,
      patient: 0,
      patient_copay: 0,
      patient_deductible: 0,
      patient_coinsurance: 0,
    };

    const paymentsByMethod: Record<PaymentMethod, number> = {
      check: 0,
      cash: 0,
      credit_card: 0,
      debit_card: 0,
      ach: 0,
      wire_transfer: 0,
      electronic: 0,
    };

    let totalAmount = 0;

    payments.forEach((payment) => {
      if (payment.status === 'completed') {
        paymentsByType[payment.type]++;
        paymentsByMethod[payment.method]++;
        totalAmount += payment.amount;
      }
    });

    const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);
    const totalPlansAmount = plans.reduce((sum, p) => sum + p.balanceAmount, 0);

    return {
      totalPayments: payments.filter((p) => p.status === 'completed').length,
      totalAmount,
      paymentsByType,
      paymentsByMethod,
      totalRefunded,
      activePlans: plans.length,
      totalPlansAmount,
    };
  }
}
