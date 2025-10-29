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
}

// Create singleton instance
export const emailService = new EmailService();
