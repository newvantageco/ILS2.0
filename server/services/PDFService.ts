import PDFDocument from "pdfkit";
import { createLogger, type Logger } from "../utils/logger";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
}

export class PDFService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger("PDFService");
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        this.addHeader(doc, data);

        // Invoice info
        this.addInvoiceInfo(doc, data);

        // Customer info
        this.addCustomerInfo(doc, data);

        // Line items table
        this.addLineItems(doc, data);

        // Totals
        this.addTotals(doc, data);

        // Footer
        this.addFooter(doc, data);

        doc.end();
      } catch (error) {
        this.logger.error("Error generating PDF", error as Error);
        reject(error);
      }
    });
  }

  /**
   * Add header section
   */
  private addHeader(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    // Company name
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(data.companyName, 50, 50);

    // Company details
    if (data.companyAddress || data.companyPhone || data.companyEmail) {
      let y = 75;
      doc.fontSize(10).font("Helvetica");

      if (data.companyAddress) {
        doc.text(data.companyAddress, 50, y);
        y += 15;
      }
      if (data.companyPhone) {
        doc.text(`Phone: ${data.companyPhone}`, 50, y);
        y += 15;
      }
      if (data.companyEmail) {
        doc.text(`Email: ${data.companyEmail}`, 50, y);
      }
    }

    // Invoice title
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 50, { align: "right" });

    doc.moveDown();
  }

  /**
   * Add invoice information
   */
  private addInvoiceInfo(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const startY = 150;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Invoice Number:", 400, startY)
      .font("Helvetica")
      .text(data.invoiceNumber, 500, startY);

    doc
      .font("Helvetica-Bold")
      .text("Invoice Date:", 400, startY + 15)
      .font("Helvetica")
      .text(data.invoiceDate, 500, startY + 15);

    doc
      .font("Helvetica-Bold")
      .text("Due Date:", 400, startY + 30)
      .font("Helvetica")
      .text(data.dueDate, 500, startY + 30);
  }

  /**
   * Add customer information
   */
  private addCustomerInfo(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const startY = 150;

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Bill To:", 50, startY);

    let y = startY + 20;
    doc.fontSize(10).font("Helvetica");

    doc.text(data.customerName, 50, y);
    y += 15;

    if (data.customerAddress) {
      doc.text(data.customerAddress, 50, y);
      y += 15;
    }

    if (data.customerEmail) {
      doc.text(data.customerEmail, 50, y);
    }
  }

  /**
   * Add line items table
   */
  private addLineItems(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const tableTop = 250;
    const itemCodeX = 50;
    const descriptionX = 150;
    const quantityX = 350;
    const priceX = 420;
    const amountX = 490;

    // Table header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Item", itemCodeX, tableTop)
      .text("Description", descriptionX, tableTop)
      .text("Qty", quantityX, tableTop)
      .text("Price", priceX, tableTop)
      .text("Amount", amountX, tableTop);

    // Header line
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor("#cccccc")
      .stroke();

    // Table rows
    doc.font("Helvetica");
    let y = tableTop + 25;

    data.items.forEach((item, index) => {
      if (y > 700) {
        // Add new page if needed
        doc.addPage();
        y = 50;
      }

      doc
        .text(index + 1, itemCodeX, y)
        .text(item.description, descriptionX, y, { width: 180 })
        .text(item.quantity.toString(), quantityX, y)
        .text(`£${item.unitPrice.toFixed(2)}`, priceX, y)
        .text(`£${item.total.toFixed(2)}`, amountX, y);

      y += 25;
    });

    // Bottom line
    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .strokeColor("#cccccc")
      .stroke();
  }

  /**
   * Add totals section
   */
  private addTotals(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const tableBottom = doc.y + 20;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Subtotal:", 400, tableBottom)
      .font("Helvetica")
      .text(`£${data.subtotal.toFixed(2)}`, 490, tableBottom);

    doc
      .font("Helvetica-Bold")
      .text(`Tax (${(data.taxRate * 100).toFixed(0)}%):`, 400, tableBottom + 15)
      .font("Helvetica")
      .text(`£${data.tax.toFixed(2)}`, 490, tableBottom + 15);

    // Total line
    doc
      .moveTo(400, tableBottom + 35)
      .lineTo(550, tableBottom + 35)
      .strokeColor("#4F46E5")
      .lineWidth(2)
      .stroke();

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#4F46E5")
      .text("Total:", 400, tableBottom + 45)
      .text(`£${data.total.toFixed(2)}`, 490, tableBottom + 45);

    doc.fillColor("#000000");
  }

  /**
   * Add footer section
   */
  private addFooter(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const footerTop = 680;

    if (data.notes) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Notes:", 50, footerTop)
        .font("Helvetica")
        .text(data.notes, 50, footerTop + 15, { width: 500 });
    }

    if (data.paymentTerms) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Payment Terms:", 50, 730)
        .font("Helvetica")
        .text(data.paymentTerms, 50, 745, { width: 500 });
    }

    // Thank you message
    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text("Thank you for your business!", 50, 780, {
        align: "center",
        width: 500,
      });
  }

  /**
   * Generate order receipt PDF
   */
  async generateReceiptPDF(data: {
    receiptNumber: string;
    date: string;
    customerName: string;
    items: Array<{ description: string; quantity: number; price: number }>;
    total: number;
    paymentMethod: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: [300, 500], margin: 20 });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          resolve(Buffer.concat(buffers));
        });

        // Header
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("RECEIPT", { align: "center" });

        doc.fontSize(10).font("Helvetica").moveDown();

        // Receipt info
        doc.text(`Receipt #: ${data.receiptNumber}`);
        doc.text(`Date: ${data.date}`);
        doc.text(`Customer: ${data.customerName}`);

        doc.moveDown();

        // Items
        doc.fontSize(8);
        data.items.forEach((item) => {
          doc.text(
            `${item.quantity}x ${item.description} - £${item.price.toFixed(2)}`
          );
        });

        doc.moveDown();

        // Total
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text(`Total: £${data.total.toFixed(2)}`, { align: "right" });

        doc.fontSize(10).font("Helvetica");
        doc.text(`Payment: ${data.paymentMethod}`, { align: "right" });

        doc.moveDown();

        // Footer
        doc.fontSize(8).text("Thank you!", { align: "center" });

        doc.end();
      } catch (error) {
        this.logger.error("Error generating receipt PDF", error as Error);
        reject(error);
      }
    });
  }
}

// Create singleton instance
export const pdfService = new PDFService();
