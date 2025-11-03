import { db } from "../db";
import { emailLogs, emailTemplates, emailTrackingEvents, type EmailLog, type EmailTemplate, type InsertEmailLog, type InsertEmailTrackingEvent } from "../../shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import nodemailer from "nodemailer";
import crypto from "crypto";

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailType: "invoice" | "receipt" | "prescription_reminder" | "recall_notification" | "appointment_reminder" | "order_confirmation" | "order_update" | "marketing" | "general";
  companyId: string;
  sentBy: string;
  patientId?: string;
  templateId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: any;
}

interface TrackingPixelOptions {
  emailLogId: string;
  trackingId: string;
}

interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  avgTimeToOpen?: number; // in minutes
  deviceBreakdown: Record<string, number>;
  topClickedLinks: Array<{ url: string; clicks: number }>;
}

export class EmailTrackingService {
  private transporter: nodemailer.Transporter;
  private baseUrl: string;

  constructor() {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    this.baseUrl = process.env.BASE_URL || "http://localhost:3000";
  }

  /**
   * Generate a unique tracking ID for email tracking
   */
  private generateTrackingId(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Inject tracking pixel and tracked links into HTML content
   */
  private injectTracking(htmlContent: string, trackingId: string): string {
    // Add tracking pixel at the end of the email
    const trackingPixel = `<img src="${this.baseUrl}/api/emails/track/open/${trackingId}" width="1" height="1" alt="" style="display:none;" />`;
    
    // Replace all links with tracked links
    const trackedHtml = htmlContent.replace(
      /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
      (match, attrs, url) => {
        const trackedUrl = `${this.baseUrl}/api/emails/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
        return `<a ${attrs.replace(/href=["'][^"']+["']/, `href="${trackedUrl}"`)} data-original-url="${url}">`;
      }
    );

    return trackedHtml + trackingPixel;
  }

  /**
   * Send an email with tracking
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailLog> {
    const trackingId = this.generateTrackingId();
    
    // Inject tracking into HTML content
    const trackedHtmlContent = this.injectTracking(options.htmlContent, trackingId);

    // Create email log record
    const [emailLog] = await db
      .insert(emailLogs)
      .values({
        companyId: options.companyId,
        recipientEmail: options.to,
        recipientName: options.toName,
        patientId: options.patientId,
        emailType: options.emailType,
        subject: options.subject,
        htmlContent: options.htmlContent, // Store original content
        textContent: options.textContent,
        status: "queued",
        trackingId,
        templateId: options.templateId,
        relatedEntityType: options.relatedEntityType,
        relatedEntityId: options.relatedEntityId,
        sentBy: options.sentBy,
        metadata: options.metadata,
      } as any)
      .returning();

    try {
      // Send email via SMTP
      const info = await this.transporter.sendMail({
        from: `${process.env.SMTP_FROM_NAME || "ILS System"} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: trackedHtmlContent,
        text: options.textContent,
      });

      // Update email log with sent status
      const [updatedLog] = await db
        .update(emailLogs)
        .set({
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailLogs.id, emailLog.id))
        .returning();

      // Log sent event
      await this.logTrackingEvent({
        emailLogId: emailLog.id,
        eventType: "sent",
        eventData: { messageId: info.messageId },
      });

      return updatedLog;
    } catch (error: any) {
      // Update email log with failed status
      await db
        .update(emailLogs)
        .set({
          status: "failed",
          errorMessage: error.message,
          retryCount: emailLog.retryCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(emailLogs.id, emailLog.id));

      throw error;
    }
  }

  /**
   * Send an email using a template
   */
  async sendTemplateEmail(
    templateId: string,
    variables: Record<string, any>,
    options: Omit<SendEmailOptions, "subject" | "htmlContent" | "textContent" | "templateId" | "emailType">
  ): Promise<EmailLog> {
    // Fetch template
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId));

    if (!template) {
      throw new Error("Template not found");
    }

    // Replace variables in template
    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent || "";

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, String(value));
      htmlContent = htmlContent.replace(regex, String(value));
      textContent = textContent.replace(regex, String(value));
    });

    return this.sendEmail({
      ...options,
      subject,
      htmlContent,
      textContent,
      templateId,
      emailType: template.emailType,
    });
  }

  /**
   * Track email open event
   */
  async trackOpen(trackingId: string, userAgent?: string, ipAddress?: string): Promise<void> {
    const [emailLog] = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.trackingId, trackingId));

    if (!emailLog) {
      return;
    }

    const now = new Date();
    const isFirstOpen = emailLog.openCount === 0;

    // Update email log
    await db
      .update(emailLogs)
      .set({
        status: emailLog.status === "sent" || emailLog.status === "delivered" ? "opened" : emailLog.status,
        openCount: emailLog.openCount + 1,
        firstOpenedAt: isFirstOpen ? now : emailLog.firstOpenedAt,
        lastOpenedAt: now,
        updatedAt: now,
      })
      .where(eq(emailLogs.id, emailLog.id));

    // Log tracking event
    await this.logTrackingEvent({
      emailLogId: emailLog.id,
      eventType: "opened",
      eventData: {},
      userAgent,
      ipAddress,
      device: this.detectDevice(userAgent),
    });
  }

  /**
   * Track email click event
   */
  async trackClick(
    trackingId: string,
    clickedUrl: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    const [emailLog] = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.trackingId, trackingId));

    if (!emailLog) {
      return;
    }

    const now = new Date();
    const isFirstClick = emailLog.clickCount === 0;

    // Update email log
    await db
      .update(emailLogs)
      .set({
        status: "clicked",
        clickCount: emailLog.clickCount + 1,
        firstClickedAt: isFirstClick ? now : emailLog.firstClickedAt,
        lastClickedAt: now,
        updatedAt: now,
      })
      .where(eq(emailLogs.id, emailLog.id));

    // Log tracking event
    await this.logTrackingEvent({
      emailLogId: emailLog.id,
      eventType: "clicked",
      eventData: { url: clickedUrl },
      userAgent,
      ipAddress,
      device: this.detectDevice(userAgent),
    });
  }

  /**
   * Log a tracking event
   */
  private async logTrackingEvent(
    event: Omit<InsertEmailTrackingEvent, "id" | "timestamp">
  ): Promise<void> {
    await db.insert(emailTrackingEvents).values(event as any);
  }

  /**
   * Detect device type from user agent
   */
  private detectDevice(userAgent?: string): string {
    if (!userAgent) return "unknown";
    
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
    }
    return "desktop";
  }

  /**
   * Get analytics for a specific email type or company
   */
  async getAnalytics(
    companyId: string,
    options?: {
      emailType?: string;
      startDate?: Date;
      endDate?: Date;
      patientId?: string;
    }
  ): Promise<EmailAnalytics> {
    let query = db
      .select({
        status: emailLogs.status,
        openCount: emailLogs.openCount,
        clickCount: emailLogs.clickCount,
        sentAt: emailLogs.sentAt,
        firstOpenedAt: emailLogs.firstOpenedAt,
      })
      .from(emailLogs)
      .where(eq(emailLogs.companyId, companyId));

    // Apply filters
    const conditions: any[] = [eq(emailLogs.companyId, companyId)];
    
    if (options?.emailType) {
      conditions.push(eq(emailLogs.emailType, options.emailType as any));
    }
    
    if (options?.patientId) {
      conditions.push(eq(emailLogs.patientId, options.patientId));
    }
    
    if (options?.startDate) {
      conditions.push(gte(emailLogs.sentAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(emailLogs.sentAt, options.endDate));
    }

    const logs = await db
      .select()
      .from(emailLogs)
      .where(and(...conditions));

    // Calculate metrics
    const totalSent = logs.filter(log => log.sentAt !== null).length;
    const totalDelivered = logs.filter(log => ["delivered", "opened", "clicked"].includes(log.status)).length;
    const totalOpened = logs.filter(log => log.openCount > 0).length;
    const totalClicked = logs.filter(log => log.clickCount > 0).length;
    const totalBounced = logs.filter(log => log.status === "bounced").length;
    const totalFailed = logs.filter(log => log.status === "failed").length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    // Calculate average time to open
    let avgTimeToOpen: number | undefined;
    const openedLogs = logs.filter(log => log.sentAt && log.firstOpenedAt);
    if (openedLogs.length > 0) {
      const totalMinutes = openedLogs.reduce((sum, log) => {
        const diff = new Date(log.firstOpenedAt!).getTime() - new Date(log.sentAt!).getTime();
        return sum + diff / (1000 * 60); // Convert to minutes
      }, 0);
      avgTimeToOpen = totalMinutes / openedLogs.length;
    }

    // Get device breakdown
    const events = await db
      .select()
      .from(emailTrackingEvents)
      .where(
        sql`${emailTrackingEvents.emailLogId} IN (${sql.raw(logs.map(l => `'${l.id}'`).join(",") || "''")})`
      );

    const deviceBreakdown: Record<string, number> = {};
    events.forEach(event => {
      const device = event.device || "unknown";
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    // Get top clicked links
    const clickEvents = events.filter(e => e.eventType === "clicked");
    const linkCounts: Record<string, number> = {};
    clickEvents.forEach(event => {
      const url = (event.eventData as any)?.url;
      if (url) {
        linkCounts[url] = (linkCounts[url] || 0) + 1;
      }
    });

    const topClickedLinks = Object.entries(linkCounts)
      .map(([url, clicks]) => ({ url, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalFailed,
      openRate,
      clickRate,
      bounceRate,
      avgTimeToOpen,
      deviceBreakdown,
      topClickedLinks,
    };
  }

  /**
   * Get email history for a patient
   */
  async getPatientEmailHistory(patientId: string, companyId: string): Promise<EmailLog[]> {
    return db
      .select()
      .from(emailLogs)
      .where(and(eq(emailLogs.patientId, patientId), eq(emailLogs.companyId, companyId)))
      .orderBy(desc(emailLogs.sentAt));
  }

  /**
   * Get tracking events for an email
   */
  async getEmailTrackingEvents(emailLogId: string): Promise<any[]> {
    return db
      .select()
      .from(emailTrackingEvents)
      .where(eq(emailTrackingEvents.emailLogId, emailLogId))
      .orderBy(desc(emailTrackingEvents.timestamp));
  }

  /**
   * Retry sending a failed email
   */
  async retryEmail(emailLogId: string): Promise<EmailLog> {
    const [emailLog] = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.id, emailLogId));

    if (!emailLog) {
      throw new Error("Email log not found");
    }

    if (emailLog.status !== "failed" && emailLog.status !== "bounced") {
      throw new Error("Can only retry failed or bounced emails");
    }

    // Re-send the email
    const newTrackingId = this.generateTrackingId();
    const trackedHtmlContent = this.injectTracking(emailLog.htmlContent, newTrackingId);

    try {
      await this.transporter.sendMail({
        from: `${process.env.SMTP_FROM_NAME || "ILS System"} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: emailLog.recipientEmail,
        subject: emailLog.subject,
        html: trackedHtmlContent,
        text: emailLog.textContent || undefined,
      });

      // Update email log
      const [updatedLog] = await db
        .update(emailLogs)
        .set({
          status: "sent",
          trackingId: newTrackingId,
          sentAt: new Date(),
          retryCount: emailLog.retryCount + 1,
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(emailLogs.id, emailLogId))
        .returning();

      await this.logTrackingEvent({
        emailLogId: emailLogId,
        eventType: "sent",
        eventData: { retry: true },
      });

      return updatedLog;
    } catch (error: any) {
      await db
        .update(emailLogs)
        .set({
          errorMessage: error.message,
          retryCount: emailLog.retryCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(emailLogs.id, emailLogId));

      throw error;
    }
  }
}

export const emailTrackingService = new EmailTrackingService();
