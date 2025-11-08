/**
 * Patient Portal Service
 *
 * Consolidated service for patient portal features including medical records,
 * prescriptions, messaging, and bill payments
 */

import { loggers } from '../../utils/logger.js';
import { db } from '../../db.js';
import { patients, orders } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Medical Records ==========

export interface MedicalRecord {
  id: string;
  patientId: string;
  type: 'exam' | 'prescription' | 'lab_result' | 'document' | 'image';
  title: string;
  date: Date;
  provider: string;
  summary?: string;
  details?: Record<string, any>;
  attachments?: Array<{
    id: string;
    filename: string;
    fileType: string;
    fileSize: number;
    url: string;
  }>;
  viewable: boolean; // Some records may be restricted
  createdAt: Date;
}

// ========== Prescriptions ==========

export interface Prescription {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  quantity: string;
  refills: number;
  refillsRemaining: number;
  prescribedBy: string;
  prescribedDate: Date;
  expiresDate: Date;
  status: 'active' | 'expired' | 'cancelled' | 'completed';
  pharmacy?: string;
  instructions?: string;
  warnings?: string[];
}

// ========== Messaging ==========

export interface Message {
  id: string;
  conversationId: string;
  from: 'patient' | 'provider';
  senderId: string;
  senderName: string;
  recipientId: string;
  subject?: string;
  body: string;
  attachments?: Array<{
    filename: string;
    url: string;
  }>;
  read: boolean;
  readAt?: Date;
  sentAt: Date;
}

export interface Conversation {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  subject: string;
  status: 'open' | 'closed';
  lastMessageAt: Date;
  unreadCount: number;
  createdAt: Date;
}

// ========== Bills & Payments ==========

export interface Bill {
  id: string;
  patientId: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  amount: number;
  amountPaid: number;
  amountDue: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  description: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  insurance?: {
    company: string;
    claimNumber?: string;
    covered: number;
  };
}

export interface Payment {
  id: string;
  billId: string;
  patientId: string;
  amount: number;
  method: 'card' | 'ach' | 'cash' | 'check';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  processedAt?: Date;
  createdAt: Date;
}

/**
 * Patient Portal Service
 */
export class PatientPortalService {
  /**
   * In-memory stores (use database in production)
   */
  private static records = new Map<string, MedicalRecord>();
  private static prescriptions = new Map<string, Prescription>();
  private static messages: Message[] = [];
  private static conversations = new Map<string, Conversation>();
  private static bills = new Map<string, Bill>();
  private static payments: Payment[] = [];

  // ========== Medical Records ==========

  /**
   * Get patient medical records
   */
  static async getMedicalRecords(
    patientId: string,
    filters?: {
      type?: MedicalRecord['type'];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<MedicalRecord[]> {
    let records = Array.from(this.records.values()).filter(
      (r) => r.patientId === patientId && r.viewable
    );

    if (filters?.type) {
      records = records.filter((r) => r.type === filters.type);
    }

    if (filters?.startDate) {
      records = records.filter((r) => r.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      records = records.filter((r) => r.date <= filters.endDate!);
    }

    return records.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get single medical record
   */
  static async getMedicalRecord(
    recordId: string,
    patientId: string
  ): Promise<MedicalRecord | null> {
    const record = this.records.get(recordId);

    if (!record || record.patientId !== patientId || !record.viewable) {
      return null;
    }

    return record;
  }

  /**
   * Request medical records download
   */
  static async requestRecordsDownload(
    patientId: string,
    recordIds: string[]
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    // Verify all records belong to patient
    const records = recordIds
      .map((id) => this.records.get(id))
      .filter((r): r is MedicalRecord => r !== undefined && r.patientId === patientId);

    if (records.length !== recordIds.length) {
      return { success: false, error: 'Some records not found or access denied' };
    }

    // In production, would generate PDF or ZIP file
    const downloadUrl = `/api/patient-portal/records/download/${crypto.randomUUID()}`;

    logger.info({ patientId, recordCount: records.length }, 'Medical records download requested');

    return { success: true, downloadUrl };
  }

  // ========== Prescriptions ==========

  /**
   * Get patient prescriptions
   */
  static async getPrescriptions(
    patientId: string,
    activeOnly: boolean = false
  ): Promise<Prescription[]> {
    let prescriptions = Array.from(this.prescriptions.values()).filter(
      (p) => p.patientId === patientId
    );

    if (activeOnly) {
      prescriptions = prescriptions.filter((p) => p.status === 'active');
    }

    return prescriptions.sort((a, b) => b.prescribedDate.getTime() - a.prescribedDate.getTime());
  }

  /**
   * Request prescription refill
   */
  static async requestRefill(
    prescriptionId: string,
    patientId: string,
    pharmacy?: string
  ): Promise<{ success: boolean; error?: string }> {
    const prescription = this.prescriptions.get(prescriptionId);

    if (!prescription || prescription.patientId !== patientId) {
      return { success: false, error: 'Prescription not found' };
    }

    if (prescription.status !== 'active') {
      return { success: false, error: 'Prescription is not active' };
    }

    if (prescription.refillsRemaining <= 0) {
      return { success: false, error: 'No refills remaining' };
    }

    if (prescription.expiresDate < new Date()) {
      return { success: false, error: 'Prescription has expired' };
    }

    // Update refills
    prescription.refillsRemaining--;

    if (pharmacy) {
      prescription.pharmacy = pharmacy;
    }

    this.prescriptions.set(prescriptionId, prescription);

    logger.info({ prescriptionId, patientId }, 'Prescription refill requested');

    // In production, would send to pharmacy system

    return { success: true };
  }

  // ========== Messaging ==========

  /**
   * Get patient conversations
   */
  static async getConversations(patientId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  /**
   * Get messages in a conversation
   */
  static async getMessages(
    conversationId: string,
    patientId: string
  ): Promise<Message[]> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation || conversation.patientId !== patientId) {
      return [];
    }

    const messages = this.messages.filter((m) => m.conversationId === conversationId);

    // Mark messages as read
    messages.forEach((msg) => {
      if (msg.from === 'provider' && !msg.read) {
        msg.read = true;
        msg.readAt = new Date();
      }
    });

    // Update unread count
    conversation.unreadCount = 0;
    this.conversations.set(conversationId, conversation);

    return messages.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }

  /**
   * Send message
   */
  static async sendMessage(
    patientId: string,
    conversationId: string,
    body: string,
    attachments?: Array<{ filename: string; url: string }>
  ): Promise<{ success: boolean; message?: Message; error?: string }> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation || conversation.patientId !== patientId) {
      return { success: false, error: 'Conversation not found' };
    }

    if (conversation.status === 'closed') {
      return { success: false, error: 'Conversation is closed' };
    }

    const message: Message = {
      id: crypto.randomUUID(),
      conversationId,
      from: 'patient',
      senderId: patientId,
      senderName: 'Patient', // Would get from patient data
      recipientId: conversation.providerId,
      body,
      attachments,
      read: false,
      sentAt: new Date(),
    };

    this.messages.push(message);

    // Update conversation
    conversation.lastMessageAt = new Date();
    this.conversations.set(conversationId, conversation);

    logger.info({ conversationId, patientId }, 'Message sent');

    // In production, would send notification to provider

    return { success: true, message };
  }

  /**
   * Start new conversation
   */
  static async startConversation(
    patientId: string,
    providerId: string,
    subject: string,
    initialMessage: string
  ): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      patientId,
      providerId,
      providerName: 'Dr. Provider', // Would get from provider data
      subject,
      status: 'open',
      lastMessageAt: new Date(),
      unreadCount: 0,
      createdAt: new Date(),
    };

    this.conversations.set(conversation.id, conversation);

    // Send initial message
    await this.sendMessage(patientId, conversation.id, initialMessage);

    logger.info({ conversationId: conversation.id, patientId }, 'Conversation started');

    return { success: true, conversation };
  }

  // ========== Bills & Payments ==========

  /**
   * Get patient bills
   */
  static async getBills(
    patientId: string,
    unpaidOnly: boolean = false
  ): Promise<Bill[]> {
    let bills = Array.from(this.bills.values()).filter((b) => b.patientId === patientId);

    if (unpaidOnly) {
      bills = bills.filter((b) => b.status === 'unpaid' || b.status === 'partial' || b.status === 'overdue');
    }

    return bills.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get single bill
   */
  static async getBill(billId: string, patientId: string): Promise<Bill | null> {
    const bill = this.bills.get(billId);

    if (!bill || bill.patientId !== patientId) {
      return null;
    }

    return bill;
  }

  /**
   * Make payment
   */
  static async makePayment(
    billId: string,
    patientId: string,
    amount: number,
    method: Payment['method'],
    paymentDetails: Record<string, any>
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    const bill = this.bills.get(billId);

    if (!bill || bill.patientId !== patientId) {
      return { success: false, error: 'Bill not found' };
    }

    if (amount <= 0 || amount > bill.amountDue) {
      return { success: false, error: 'Invalid payment amount' };
    }

    // Create payment record
    const payment: Payment = {
      id: crypto.randomUUID(),
      billId,
      patientId,
      amount,
      method,
      status: 'pending',
      createdAt: new Date(),
    };

    // In production, would process payment through payment gateway
    // For now, simulate successful payment
    payment.status = 'completed';
    payment.transactionId = `TXN-${Date.now()}`;
    payment.processedAt = new Date();

    this.payments.push(payment);

    // Update bill
    bill.amountPaid += amount;
    bill.amountDue -= amount;

    if (bill.amountDue === 0) {
      bill.status = 'paid';
    } else if (bill.amountPaid > 0) {
      bill.status = 'partial';
    }

    this.bills.set(billId, bill);

    logger.info({ billId, patientId, amount }, 'Payment processed');

    return { success: true, payment };
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(patientId: string): Promise<Payment[]> {
    return this.payments
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Request payment plan
   */
  static async requestPaymentPlan(
    billId: string,
    patientId: string,
    proposedMonthlyPayment: number
  ): Promise<{ success: boolean; error?: string }> {
    const bill = this.bills.get(billId);

    if (!bill || bill.patientId !== patientId) {
      return { success: false, error: 'Bill not found' };
    }

    if (bill.status === 'paid') {
      return { success: false, error: 'Bill is already paid' };
    }

    logger.info(
      { billId, patientId, proposedMonthlyPayment },
      'Payment plan requested'
    );

    // In production, would create payment plan request for review

    return { success: true };
  }

  // ========== Dashboard ==========

  /**
   * Get patient dashboard summary
   */
  static async getDashboard(patientId: string): Promise<{
    upcomingAppointments: number;
    unreadMessages: number;
    activePrescriptions: number;
    unpaidBills: number;
    totalAmountDue: number;
    recentRecords: number;
  }> {
    const conversations = await this.getConversations(patientId);
    const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    const prescriptions = await this.getPrescriptions(patientId, true);
    const bills = await this.getBills(patientId, true);

    const totalAmountDue = bills.reduce((sum, b) => sum + b.amountDue, 0);

    const recentRecords = (await this.getMedicalRecords(patientId)).filter(
      (r) => r.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    ).length;

    return {
      upcomingAppointments: 0, // Would get from AppointmentBookingService
      unreadMessages,
      activePrescriptions: prescriptions.length,
      unpaidBills: bills.length,
      totalAmountDue,
      recentRecords,
    };
  }
}
