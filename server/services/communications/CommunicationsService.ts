/**
 * Communications Service
 *
 * Unified messaging service for email, SMS, and push notifications
 * with template management and delivery tracking
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Communication channel
 */
export type CommunicationChannel = 'email' | 'sms' | 'push' | 'in_app';

/**
 * Message status
 */
export type MessageStatus =
  | 'draft'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'unsubscribed';

/**
 * Message priority
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Message template
 */
export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  channel: CommunicationChannel;
  subject?: string; // For email
  body: string; // Supports template variables like {{firstName}}
  variables: string[]; // List of required variables
  category: 'transactional' | 'marketing' | 'appointment' | 'clinical' | 'billing';
  active: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Message
 */
export interface Message {
  id: string;
  channel: CommunicationChannel;
  templateId?: string;

  // Recipients
  recipientId: string; // Patient/User ID
  recipientType: 'patient' | 'user' | 'provider';
  to: string; // Email address, phone number, or device token

  // Content
  subject?: string;
  body: string;
  metadata?: Record<string, any>;

  // Status
  status: MessageStatus;
  priority: MessagePriority;
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failedAt?: Date;

  // Error handling
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;

  // Tracking
  trackingId?: string;
  campaignId?: string;

  createdAt: Date;
}

/**
 * Unsubscribe record
 */
export interface UnsubscribeRecord {
  id: string;
  recipientId: string;
  channel: CommunicationChannel;
  category?: MessageTemplate['category'];
  unsubscribedAt: Date;
  reason?: string;
}

/**
 * Message statistics
 */
export interface MessageStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

/**
 * Communications Service
 */
export class CommunicationsService {
  /**
   * In-memory stores (use database in production)
   */
  private static templates = new Map<string, MessageTemplate>();
  private static messages: Message[] = [];
  private static unsubscribes = new Map<string, UnsubscribeRecord>();

  /**
   * Configuration
   */
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 60000; // 1 minute

  /**
   * Default templates
   */
  static {
    this.initializeDefaultTemplates();
  }

  // ========== Template Management ==========

  /**
   * Initialize default templates
   */
  private static initializeDefaultTemplates(): void {
    // Appointment reminder email
    this.createTemplate({
      name: 'Appointment Reminder',
      description: 'Reminder for upcoming appointment',
      channel: 'email',
      subject: 'Reminder: Upcoming Appointment on {{appointmentDate}}',
      body: `
Hello {{firstName}},

This is a friendly reminder about your upcoming appointment:

Date: {{appointmentDate}}
Time: {{appointmentTime}}
Provider: {{providerName}}
Location: {{locationName}}

If you need to cancel or reschedule, please call us at {{clinicPhone}} or use the patient portal.

Thank you,
{{clinicName}}
      `.trim(),
      variables: ['firstName', 'appointmentDate', 'appointmentTime', 'providerName', 'locationName', 'clinicPhone', 'clinicName'],
      category: 'appointment',
      active: true,
    });

    // Appointment reminder SMS
    this.createTemplate({
      name: 'Appointment Reminder SMS',
      description: 'SMS reminder for upcoming appointment',
      channel: 'sms',
      body: 'Reminder: Your appointment with {{providerName}} is on {{appointmentDate}} at {{appointmentTime}}. Reply CANCEL to cancel.',
      variables: ['providerName', 'appointmentDate', 'appointmentTime'],
      category: 'appointment',
      active: true,
    });

    // Welcome email
    this.createTemplate({
      name: 'Welcome Email',
      description: 'Welcome new patients',
      channel: 'email',
      subject: 'Welcome to {{clinicName}}!',
      body: `
Dear {{firstName}} {{lastName}},

Welcome to {{clinicName}}! We're excited to have you as a patient.

Your patient portal account has been created. You can:
- Schedule appointments online
- View your medical records
- Request prescription refills
- Communicate with your care team

Portal URL: {{portalUrl}}
Username: {{email}}

If you have any questions, please don't hesitate to contact us.

Best regards,
{{clinicName}} Team
      `.trim(),
      variables: ['firstName', 'lastName', 'clinicName', 'portalUrl', 'email'],
      category: 'transactional',
      active: true,
    });

    // Test results notification
    this.createTemplate({
      name: 'Test Results Available',
      description: 'Notify patient that test results are ready',
      channel: 'email',
      subject: 'Your Test Results Are Ready',
      body: `
Dear {{firstName}},

Your recent test results are now available in your patient portal.

Test: {{testName}}
Date: {{testDate}}

Please log in to your patient portal to view the results. If you have any questions, please contact our office.

Best regards,
{{clinicName}}
      `.trim(),
      variables: ['firstName', 'testName', 'testDate', 'clinicName'],
      category: 'clinical',
      active: true,
    });

    // Bill payment reminder
    this.createTemplate({
      name: 'Payment Reminder',
      description: 'Reminder for outstanding bill',
      channel: 'email',
      subject: 'Payment Reminder - Invoice {{invoiceNumber}}',
      body: `
Dear {{firstName}} {{lastName}},

This is a reminder that you have an outstanding balance:

Invoice #: {{invoiceNumber}}
Amount Due: {{amountDue}}
Due Date: {{dueDate}}

You can make a payment online through your patient portal or call our billing department at {{billingPhone}}.

Thank you,
{{clinicName}} Billing
      `.trim(),
      variables: ['firstName', 'lastName', 'invoiceNumber', 'amountDue', 'dueDate', 'billingPhone', 'clinicName'],
      category: 'billing',
      active: true,
    });
  }

  /**
   * Create template
   */
  static createTemplate(
    template: Omit<MessageTemplate, 'id' | 'createdAt'>
  ): MessageTemplate {
    const newTemplate: MessageTemplate = {
      id: crypto.randomUUID(),
      ...template,
      createdAt: new Date(),
    };

    this.templates.set(newTemplate.id, newTemplate);

    logger.info({ templateId: newTemplate.id, name: template.name }, 'Message template created');

    return newTemplate;
  }

  /**
   * Get template
   */
  static getTemplate(templateId: string): MessageTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * List templates
   */
  static listTemplates(
    channel?: CommunicationChannel,
    category?: MessageTemplate['category']
  ): MessageTemplate[] {
    let templates = Array.from(this.templates.values()).filter((t) => t.active);

    if (channel) {
      templates = templates.filter((t) => t.channel === channel);
    }

    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Update template
   */
  static updateTemplate(
    templateId: string,
    updates: Partial<Omit<MessageTemplate, 'id' | 'createdAt'>>
  ): MessageTemplate | null {
    const template = this.templates.get(templateId);

    if (!template) {
      return null;
    }

    Object.assign(template, updates, {
      updatedAt: new Date(),
    });

    this.templates.set(templateId, template);

    return template;
  }

  // ========== Message Sending ==========

  /**
   * Send message using template
   */
  static async sendFromTemplate(
    templateId: string,
    recipientId: string,
    recipientType: Message['recipientType'],
    to: string,
    variables: Record<string, string>,
    options?: {
      priority?: MessagePriority;
      scheduledFor?: Date;
      campaignId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; message?: Message; error?: string }> {
    const template = this.templates.get(templateId);

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Check if unsubscribed
    const isUnsubscribed = await this.isUnsubscribed(
      recipientId,
      template.channel,
      template.category
    );

    if (isUnsubscribed) {
      return { success: false, error: 'Recipient has unsubscribed' };
    }

    // Validate required variables
    const missingVars = template.variables.filter((v) => !variables[v]);
    if (missingVars.length > 0) {
      return {
        success: false,
        error: `Missing required variables: ${missingVars.join(', ')}`,
      };
    }

    // Replace variables in template
    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      if (subject) subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    // Create message
    const message: Message = {
      id: crypto.randomUUID(),
      channel: template.channel,
      templateId,
      recipientId,
      recipientType,
      to,
      subject,
      body,
      status: options?.scheduledFor ? 'queued' : 'sending',
      priority: options?.priority || 'normal',
      scheduledFor: options?.scheduledFor,
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
      trackingId: crypto.randomUUID(),
      campaignId: options?.campaignId,
      metadata: options?.metadata,
      createdAt: new Date(),
    };

    this.messages.push(message);

    // Send immediately or schedule
    if (!options?.scheduledFor) {
      await this.deliverMessage(message);
    }

    logger.info(
      {
        messageId: message.id,
        channel: message.channel,
        recipientId,
        scheduled: !!options?.scheduledFor,
      },
      'Message created'
    );

    return { success: true, message };
  }

  /**
   * Send custom message
   */
  static async sendMessage(
    channel: CommunicationChannel,
    recipientId: string,
    recipientType: Message['recipientType'],
    to: string,
    content: {
      subject?: string;
      body: string;
    },
    options?: {
      priority?: MessagePriority;
      scheduledFor?: Date;
      campaignId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; message?: Message; error?: string }> {
    const message: Message = {
      id: crypto.randomUUID(),
      channel,
      recipientId,
      recipientType,
      to,
      subject: content.subject,
      body: content.body,
      status: options?.scheduledFor ? 'queued' : 'sending',
      priority: options?.priority || 'normal',
      scheduledFor: options?.scheduledFor,
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
      trackingId: crypto.randomUUID(),
      campaignId: options?.campaignId,
      metadata: options?.metadata,
      createdAt: new Date(),
    };

    this.messages.push(message);

    if (!options?.scheduledFor) {
      await this.deliverMessage(message);
    }

    return { success: true, message };
  }

  /**
   * Deliver message (integrate with actual email/SMS provider)
   */
  private static async deliverMessage(message: Message): Promise<void> {
    try {
      // In production, integrate with:
      // - Email: SendGrid, AWS SES, Mailgun
      // - SMS: Twilio, AWS SNS
      // - Push: Firebase Cloud Messaging, AWS SNS

      // Simulate delivery
      message.status = 'sent';
      message.sentAt = new Date();

      // Simulate delivery confirmation
      setTimeout(() => {
        message.status = 'delivered';
        message.deliveredAt = new Date();
      }, 1000);

      logger.info({ messageId: message.id, channel: message.channel }, 'Message delivered');
    } catch (error) {
      message.status = 'failed';
      message.failedAt = new Date();
      message.errorMessage = (error as Error).message;

      logger.error({ error, messageId: message.id }, 'Message delivery failed');

      // Retry if not exceeded max retries
      if (message.retryCount < message.maxRetries) {
        message.retryCount++;
        message.status = 'queued';

        setTimeout(() => {
          this.deliverMessage(message);
        }, this.RETRY_DELAY_MS * message.retryCount);
      }
    }
  }

  // ========== Message Tracking ==========

  /**
   * Track message open
   */
  static trackOpen(trackingId: string): void {
    const message = this.messages.find((m) => m.trackingId === trackingId);

    if (message && !message.openedAt) {
      message.status = 'opened';
      message.openedAt = new Date();

      logger.info({ messageId: message.id }, 'Message opened');
    }
  }

  /**
   * Track message click
   */
  static trackClick(trackingId: string): void {
    const message = this.messages.find((m) => m.trackingId === trackingId);

    if (message && !message.clickedAt) {
      message.status = 'clicked';
      message.clickedAt = new Date();

      logger.info({ messageId: message.id }, 'Message clicked');
    }
  }

  /**
   * Get message
   */
  static getMessage(messageId: string): Message | null {
    return this.messages.find((m) => m.id === messageId) || null;
  }

  /**
   * Get messages by recipient
   */
  static getRecipientMessages(
    recipientId: string,
    channel?: CommunicationChannel
  ): Message[] {
    let messages = this.messages.filter((m) => m.recipientId === recipientId);

    if (channel) {
      messages = messages.filter((m) => m.channel === channel);
    }

    return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get campaign messages
   */
  static getCampaignMessages(campaignId: string): Message[] {
    return this.messages
      .filter((m) => m.campaignId === campaignId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get message statistics
   */
  static getMessageStats(
    filter?: {
      campaignId?: string;
      channel?: CommunicationChannel;
      startDate?: Date;
      endDate?: Date;
    }
  ): MessageStats {
    let messages = this.messages;

    if (filter?.campaignId) {
      messages = messages.filter((m) => m.campaignId === filter.campaignId);
    }

    if (filter?.channel) {
      messages = messages.filter((m) => m.channel === filter.channel);
    }

    if (filter?.startDate) {
      messages = messages.filter((m) => m.createdAt >= filter.startDate!);
    }

    if (filter?.endDate) {
      messages = messages.filter((m) => m.createdAt <= filter.endDate!);
    }

    const total = messages.length;
    const sent = messages.filter((m) => m.sentAt).length;
    const delivered = messages.filter((m) => m.deliveredAt).length;
    const opened = messages.filter((m) => m.openedAt).length;
    const clicked = messages.filter((m) => m.clickedAt).length;
    const bounced = messages.filter((m) => m.status === 'bounced').length;
    const failed = messages.filter((m) => m.status === 'failed').length;

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
    };
  }

  // ========== Unsubscribe Management ==========

  /**
   * Unsubscribe recipient
   */
  static unsubscribe(
    recipientId: string,
    channel: CommunicationChannel,
    category?: MessageTemplate['category'],
    reason?: string
  ): void {
    const key = `${recipientId}-${channel}-${category || 'all'}`;

    const record: UnsubscribeRecord = {
      id: crypto.randomUUID(),
      recipientId,
      channel,
      category,
      unsubscribedAt: new Date(),
      reason,
    };

    this.unsubscribes.set(key, record);

    logger.info({ recipientId, channel, category }, 'Recipient unsubscribed');
  }

  /**
   * Check if unsubscribed
   */
  static async isUnsubscribed(
    recipientId: string,
    channel: CommunicationChannel,
    category?: MessageTemplate['category']
  ): Promise<boolean> {
    // Check specific category unsubscribe
    if (category) {
      const categoryKey = `${recipientId}-${channel}-${category}`;
      if (this.unsubscribes.has(categoryKey)) {
        return true;
      }
    }

    // Check all messages for this channel
    const allKey = `${recipientId}-${channel}-all`;
    return this.unsubscribes.has(allKey);
  }

  /**
   * Resubscribe recipient
   */
  static resubscribe(
    recipientId: string,
    channel: CommunicationChannel,
    category?: MessageTemplate['category']
  ): void {
    const key = `${recipientId}-${channel}-${category || 'all'}`;
    this.unsubscribes.delete(key);

    logger.info({ recipientId, channel, category }, 'Recipient resubscribed');
  }

  // ========== Scheduled Messages ==========

  /**
   * Process scheduled messages (call this periodically)
   */
  static async processScheduledMessages(): Promise<number> {
    const now = new Date();
    const dueMessages = this.messages.filter(
      (m) =>
        m.status === 'queued' &&
        m.scheduledFor &&
        m.scheduledFor <= now
    );

    for (const message of dueMessages) {
      await this.deliverMessage(message);
    }

    return dueMessages.length;
  }
}
