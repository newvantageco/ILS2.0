import nodemailer from "nodemailer";
import { createLogger, type Logger } from "../utils/logger";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

export interface InvoiceEmailData {
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export class EmailService {
  private logger: Logger;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.logger = createLogger("EmailService");
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private initialize(): void {
    try {
      // Configure based on environment variables
      const emailConfig = this.getEmailConfig();

      this.transporter = nodemailer.createTransport(emailConfig as any);

      this.logger.info("Email service initialized");
    } catch (error) {
      this.logger.error("Failed to initialize email service", error as Error);
    }
  }

  /**
   * Get email configuration from environment variables
   */
  private getEmailConfig(): any {
    // For development, use ethereal email (test email service)
    if (process.env.NODE_ENV === "development" && !process.env.EMAIL_HOST) {
      return {
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER || "test@ethereal.email",
          pass: process.env.ETHEREAL_PASS || "test123",
        },
      };
    }

    // Production configuration
    return {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    };
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error("Email transporter not initialized");
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"${process.env.COMPANY_NAME || 'ILS'}" <noreply@ils.com>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.info("Email sent successfully", {
        messageId: info.messageId,
        to: options.to,
      });

      // If using ethereal for testing, log the preview URL
      if (process.env.NODE_ENV === "development") {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.info("Preview email", { url: previewUrl });
        }
      }

      return true;
    } catch (error) {
      this.logger.error("Failed to send email", error as Error);
      return false;
    }
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    data: InvoiceEmailData,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    const html = this.generateInvoiceEmailTemplate(data);

    return await this.sendEmail({
      to: data.recipientEmail,
      subject: `Invoice #${data.invoiceNumber} from ${data.companyName}`,
      html,
      attachments: [
        {
          filename: `Invoice-${data.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  }

  /**
   * Generate HTML template for invoice email
   */
  private generateInvoiceEmailTemplate(data: InvoiceEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .invoice-details {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .total-row {
            font-weight: bold;
            font-size: 1.2em;
            color: #4F46E5;
            padding-top: 10px;
            border-top: 2px solid #4F46E5;
          }
          .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invoice from ${data.companyName}</h1>
        </div>
        <div class="content">
          <p>Dear ${data.recipientName},</p>
          <p>Thank you for your business! Please find your invoice details below.</p>
          
          <div class="invoice-details">
            <div class="detail-row">
              <span><strong>Invoice Number:</strong></span>
              <span>${data.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span><strong>Invoice Date:</strong></span>
              <span>${data.invoiceDate}</span>
            </div>
            <div class="detail-row">
              <span><strong>Due Date:</strong></span>
              <span>${data.dueDate}</span>
            </div>
            <div class="detail-row">
              <span><strong>Subtotal:</strong></span>
              <span>£${data.subtotal.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span><strong>Tax:</strong></span>
              <span>£${data.tax.toFixed(2)}</span>
            </div>
            <div class="detail-row total-row">
              <span>Total Amount:</span>
              <span>£${data.total.toFixed(2)}</span>
            </div>
          </div>

          <p>A detailed PDF invoice is attached to this email.</p>

          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

          <div class="footer">
            <p><strong>${data.companyName}</strong></p>
            ${data.companyAddress ? `<p>${data.companyAddress}</p>` : ""}
            ${data.companyPhone ? `<p>Phone: ${data.companyPhone}</p>` : ""}
            ${data.companyEmail ? `<p>Email: ${data.companyEmail}</p>` : ""}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    recipientEmail: string,
    recipientName: string,
    orderNumber: string,
    orderDetails: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            <p>Thank you for your order! Your order <strong>#${orderNumber}</strong> has been received and is being processed.</p>
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              ${orderDetails}
            </div>
            <p>You will receive another email once your order has been shipped.</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Order Confirmation #${orderNumber}`,
      html,
    });
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(
    recipientEmail: string,
    recipientName: string,
    appointmentDate: string,
    appointmentTime: string,
    location: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f0fdf4; }
          .appointment-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            <p>This is a reminder of your upcoming appointment:</p>
            <div class="appointment-box">
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Location:</strong> ${location}</p>
            </div>
            <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
            <p>We look forward to seeing you!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: "Appointment Reminder",
      html,
    });
  }

  /**
   * Send welcome email with password setup link
   * SECURITY: Never send plain text passwords via email
   */
  async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string,
    setupToken: string,
    companyName: string,
    role: string
  ): Promise<boolean> {
    const setupUrl = `${process.env.APP_URL || 'http://localhost:5000'}/setup-password?token=${setupToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .info-item {
            margin: 15px 0;
            padding: 12px;
            background-color: #f3f4f6;
            border-radius: 6px;
          }
          .info-label {
            font-weight: bold;
            color: #4b5563;
            font-size: 12px;
            text-transform: uppercase;
          }
          .info-value {
            font-size: 16px;
            color: #111827;
            margin-top: 5px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            margin-top: 30px;
          }
          .security-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Integrated Lens System</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>Your account for <strong>${companyName}</strong> has been created.</p>

          <div class="info-box">
            <h3>Your Account Details</h3>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${recipientEmail}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Role</div>
              <div class="info-value">${role.replace('_', ' ').toUpperCase()}</div>
            </div>
          </div>

          <p>To complete your account setup, please click the button below to set your password:</p>

          <div style="text-align: center;">
            <a href="${setupUrl}" class="button">
              Set Your Password
            </a>
          </div>

          <div class="security-notice">
            <strong>Security Notice:</strong> This link will expire in 24 hours. If you did not request this account, please ignore this email.
          </div>

          <div class="footer">
            <p><strong>Integrated Lens System</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Welcome to Integrated Lens System - Set Your Password`,
      html,
    });
  }

  /**
   * Send company approval notification email
   */
  async sendCompanyApprovalEmail(
    recipientEmail: string,
    recipientName: string,
    companyName: string
  ): Promise<boolean> {
    const loginUrl = process.env.APP_URL || 'http://localhost:5000';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f0fdf4;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .success-box {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #10b981;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Company Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>Great news! Your company <strong>${companyName}</strong> has been approved on the Integrated Lens System platform.</p>

          <div class="success-box">
            <h2 style="color: #10b981; margin: 0 0 10px 0;">You're All Set!</h2>
            <p style="margin: 0;">Your company is now active and you can start using all platform features.</p>
          </div>

          <h3>What's Next?</h3>
          <ul>
            <li>Log in to your dashboard</li>
            <li>Invite your team members</li>
            <li>Configure your company settings</li>
            <li>Start managing your optical business</li>
          </ul>

          <div style="text-align: center;">
            <a href="${loginUrl}/login" class="button">
              Go to Dashboard
            </a>
          </div>

          <div class="footer">
            <p>Need help? Contact us at support@integratedlenssystem.com</p>
            <p><strong>Integrated Lens System</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Your Company "${companyName}" Has Been Approved - ILS`,
      html,
    });
  }

  /**
   * Send company rejection notification email
   */
  async sendCompanyRejectionEmail(
    recipientEmail: string,
    recipientName: string,
    companyName: string,
    reason?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #fef2f2;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .reason-box {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #ef4444;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Company Registration Update</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>We regret to inform you that your company registration for <strong>${companyName}</strong> could not be approved at this time.</p>

          ${reason ? `
          <div class="reason-box">
            <h3 style="color: #ef4444; margin: 0 0 10px 0;">Reason:</h3>
            <p style="margin: 0;">${reason}</p>
          </div>
          ` : ''}

          <h3>What You Can Do:</h3>
          <ul>
            <li>Review the reason provided above</li>
            <li>Contact our support team for clarification</li>
            <li>Submit a new registration with updated information</li>
          </ul>

          <p>If you believe this was a mistake, please don't hesitate to reach out to us.</p>

          <div class="footer">
            <p>Need help? Contact us at support@integratedlenssystem.com</p>
            <p><strong>Integrated Lens System</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Company Registration Update - ${companyName}`,
      html,
    });
  }

  /**
   * Send user approval notification email
   */
  async sendUserApprovalEmail(
    recipientEmail: string,
    recipientName: string,
    companyName: string,
    role: string
  ): Promise<boolean> {
    const loginUrl = process.env.APP_URL || 'http://localhost:5000';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #eff6ff;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .success-box {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to ${companyName}!</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>Your request to join <strong>${companyName}</strong> has been approved!</p>

          <div class="success-box">
            <p><strong>Your Role:</strong> ${role.replace('_', ' ').toUpperCase()}</p>
            <p>You now have access to the platform and can start using all features available to your role.</p>
          </div>

          <div style="text-align: center;">
            <a href="${loginUrl}/login" class="button">
              Start Using ILS
            </a>
          </div>

          <div class="footer">
            <p>Need help? Contact your company administrator or support@integratedlenssystem.com</p>
            <p><strong>Integrated Lens System</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `You've Been Added to ${companyName} - ILS`,
      html,
    });
  }

  /**
   * Send pending join request notification to company admin
   */
  async sendJoinRequestNotification(
    adminEmail: string,
    adminName: string,
    requestorName: string,
    requestorEmail: string,
    companyName: string
  ): Promise<boolean> {
    const dashboardUrl = process.env.APP_URL || 'http://localhost:5000';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #fffbeb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .request-box {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #f59e0b;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Join Request</h1>
        </div>
        <div class="content">
          <p>Dear ${adminName},</p>
          <p>Someone has requested to join <strong>${companyName}</strong> on the ILS platform.</p>

          <div class="request-box">
            <h3 style="color: #f59e0b; margin: 0 0 15px 0;">Requestor Details</h3>
            <p><strong>Name:</strong> ${requestorName}</p>
            <p><strong>Email:</strong> ${requestorEmail}</p>
          </div>

          <p>Please review this request and approve or reject it through your admin dashboard.</p>

          <div style="text-align: center;">
            <a href="${dashboardUrl}/company-admin/users" class="button">
              Review Request
            </a>
          </div>

          <div class="footer">
            <p><strong>Integrated Lens System</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: adminEmail,
      subject: `New Join Request for ${companyName} - Action Required`,
      html,
    });
  }
}

// Create singleton instance
export const emailService = new EmailService();
