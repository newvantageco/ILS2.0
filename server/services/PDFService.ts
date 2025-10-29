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

export interface OrderSheetData {
  orderNumber: string;
  orderDate: string;
  patientName: string;
  patientDOB?: string;
  ecpName: string;
  status: string;
  lensType: string;
  lensMaterial: string;
  coating: string;
  frameType?: string;
  rightEye: {
    sphere?: string;
    cylinder?: string;
    axis?: string;
    add?: string;
  };
  leftEye: {
    sphere?: string;
    cylinder?: string;
    axis?: string;
    add?: string;
  };
  pd?: string;
  notes?: string;
  customerReferenceNumber?: string;
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
    // Add colored header bar
    doc
      .rect(0, 0, 612, 120)
      .fillAndStroke("#4F46E5", "#4338CA");

    // Company name in white
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text(data.companyName, 50, 35);

    // Company details in light gray
    if (data.companyAddress || data.companyPhone || data.companyEmail) {
      let y = 65;
      doc.fontSize(9).font("Helvetica").fillColor("#E0E7FF");

      if (data.companyAddress) {
        doc.text(data.companyAddress, 50, y);
        y += 12;
      }
      if (data.companyPhone) {
        doc.text(`📞 ${data.companyPhone}`, 50, y);
        y += 12;
      }
      if (data.companyEmail) {
        doc.text(`✉ ${data.companyEmail}`, 50, y);
      }
    }

    // Invoice title with background
    doc
      .fontSize(26)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text("INVOICE", 400, 45, { align: "right" });

    // Reset fill color
    doc.fillColor("#000000");
    doc.moveDown();
  }

  /**
   * Add invoice information
   */
  private addInvoiceInfo(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const startY = 150;

    // Add bordered box for invoice details
    doc
      .roundedRect(380, startY - 10, 170, 85, 5)
      .fillAndStroke("#F9FAFB", "#E5E7EB");

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Invoice Number:", 390, startY)
      .font("Helvetica")
      .fillColor("#111827")
      .text(data.invoiceNumber, 490, startY);

    doc
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Invoice Date:", 390, startY + 20)
      .font("Helvetica")
      .fillColor("#111827")
      .text(data.invoiceDate, 490, startY + 20);

    doc
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Due Date:", 390, startY + 40)
      .font("Helvetica")
      .fillColor("#DC2626")
      .text(data.dueDate, 490, startY + 40);

    doc.fillColor("#000000");
  }

  /**
   * Add customer information
   */
  private addCustomerInfo(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const startY = 150;

    // Add bordered box for customer details
    doc
      .roundedRect(40, startY - 10, 320, 85, 5)
      .fillAndStroke("#F0F9FF", "#BAE6FD");

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#0C4A6E")
      .text("BILL TO:", 50, startY);

    let y = startY + 22;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827");
    doc.text(data.customerName, 50, y);
    y += 16;

    doc.font("Helvetica").fillColor("#374151");
    if (data.customerAddress) {
      doc.text(data.customerAddress, 50, y);
      y += 14;
    }

    if (data.customerEmail) {
      doc.text(`✉ ${data.customerEmail}`, 50, y);
    }

    doc.fillColor("#000000");
  }

  /**
   * Add line items table
   */
  private addLineItems(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const tableTop = 260;
    const itemCodeX = 50;
    const descriptionX = 140;
    const quantityX = 360;
    const priceX = 430;
    const amountX = 500;

    // Table header background
    doc
      .rect(40, tableTop - 5, 520, 22)
      .fillAndStroke("#4F46E5", "#4338CA");

    // Table header text
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text("Item", itemCodeX, tableTop)
      .text("Description", descriptionX, tableTop)
      .text("Qty", quantityX, tableTop)
      .text("Price", priceX, tableTop)
      .text("Amount", amountX, tableTop);

    doc.fillColor("#000000");

    // Table rows
    doc.font("Helvetica");
    let y = tableTop + 30;
    let rowIndex = 0;

    data.items.forEach((item, index) => {
      if (y > 680) {
        // Add new page if needed
        doc.addPage();
        y = 50;
        rowIndex = 0;
      }

      // Alternating row colors
      if (rowIndex % 2 === 0) {
        doc
          .rect(40, y - 5, 520, 22)
          .fillAndStroke("#F9FAFB", "#F9FAFB");
      }

      doc
        .fillColor("#374151")
        .text(index + 1, itemCodeX, y)
        .fillColor("#111827")
        .text(item.description, descriptionX, y, { width: 200 })
        .fillColor("#374151")
        .text(item.quantity.toString(), quantityX, y)
        .text(`£${item.unitPrice.toFixed(2)}`, priceX, y)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text(`£${item.total.toFixed(2)}`, amountX, y);

      doc.font("Helvetica");
      y += 25;
      rowIndex++;
    });

    // Bottom border line
    doc
      .moveTo(40, y)
      .lineTo(560, y)
      .strokeColor("#4F46E5")
      .lineWidth(2)
      .stroke();

    doc.fillColor("#000000").lineWidth(1);
  }

  /**
   * Add totals section
   */
  private addTotals(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const tableBottom = doc.y + 30;

    // Totals box with border
    doc
      .roundedRect(380, tableBottom - 10, 170, 100, 5)
      .fillAndStroke("#F9FAFB", "#E5E7EB");

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Subtotal:", 390, tableBottom)
      .font("Helvetica")
      .fillColor("#111827")
      .text(`£${data.subtotal.toFixed(2)}`, 490, tableBottom);

    doc
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text(`Tax (${(data.taxRate * 100).toFixed(0)}%):`, 390, tableBottom + 20)
      .font("Helvetica")
      .fillColor("#111827")
      .text(`£${data.tax.toFixed(2)}`, 490, tableBottom + 20);

    // Total with colored background
    doc
      .roundedRect(385, tableBottom + 48, 160, 32, 5)
      .fillAndStroke("#4F46E5", "#4338CA");

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text("TOTAL:", 390, tableBottom + 56)
      .text(`£${data.total.toFixed(2)}`, 490, tableBottom + 56);

    doc.fillColor("#000000").lineWidth(1);
  }

  /**
   * Add footer section
   */
  private addFooter(doc: typeof PDFDocument.prototype, data: InvoiceData): void {
    const footerTop = 650;

    if (data.notes) {
      doc
        .roundedRect(40, footerTop - 5, 520, 60, 5)
        .fillAndStroke("#FEF3C7", "#FCD34D");

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#92400E")
        .text("📝 Notes:", 50, footerTop + 5)
        .font("Helvetica")
        .fillColor("#78350F")
        .text(data.notes, 50, footerTop + 20, { width: 500 });
    }

    if (data.paymentTerms) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#374151")
        .text("Payment Terms:", 50, 725)
        .font("Helvetica")
        .fillColor("#6B7280")
        .text(data.paymentTerms, 50, 738, { width: 500 });
    }

    // Footer bar
    doc
      .rect(0, 760, 612, 72)
      .fillAndStroke("#F3F4F6", "#E5E7EB");

    // Thank you message
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#4F46E5")
      .text("Thank you for your business!", 0, 780, {
        align: "center",
        width: 612,
      });

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6B7280")
      .text("For questions, please contact us at the details above.", 0, 800, {
        align: "center",
        width: 612,
      });

    doc.fillColor("#000000");
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

  /**
   * Generate order sheet PDF
   */
  async generateOrderSheetPDF(data: OrderSheetData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header with colored background
        doc
          .rect(0, 0, 612, 100)
          .fillAndStroke("#10B981", "#059669");

        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .fillColor("#FFFFFF")
          .text("LENS ORDER SHEET", 0, 30, { align: "center", width: 612 });
        
        doc.fontSize(11).fillColor("#D1FAE5");
        doc.text(`Order #: ${data.orderNumber}`, 0, 60, { align: "center", width: 612 });
        doc.text(`Date: ${data.orderDate}`, 0, 75, { align: "center", width: 612 });

        doc.fillColor("#000000");
        doc.moveDown(1);

        // Status Badge
        const statusY = 115;
        let statusColor = "#10B981";
        let statusBg = "#D1FAE5";
        
        if (data.status.toLowerCase() === "completed") {
          statusColor = "#059669";
          statusBg = "#A7F3D0";
        } else if (data.status.toLowerCase() === "pending") {
          statusColor = "#F59E0B";
          statusBg = "#FEF3C7";
        } else if (data.status.toLowerCase() === "processing") {
          statusColor = "#3B82F6";
          statusBg = "#DBEAFE";
        }

        doc
          .roundedRect(230, statusY, 150, 25, 5)
          .fillAndStroke(statusBg, statusColor);

        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor(statusColor)
          .text(`Status: ${data.status.toUpperCase()}`, 0, statusY + 7, {
            align: "center",
            width: 612,
          });

        doc.fillColor("#000000");
        doc.y = statusY + 45;

        // Patient Information Section
        doc
          .roundedRect(40, doc.y, 250, 90, 5)
          .fillAndStroke("#EFF6FF", "#BFDBFE");

        const patientY = doc.y + 15;
        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#1E40AF")
          .text("👤 PATIENT INFORMATION", 50, patientY);

        doc.fontSize(10).font("Helvetica").fillColor("#374151");
        doc.text(`Name: ${data.patientName}`, 50, patientY + 25);
        if (data.patientDOB) {
          doc.text(`Date of Birth: ${data.patientDOB}`, 50, patientY + 40);
        }
        if (data.customerReferenceNumber) {
          doc.text(`Customer #: ${data.customerReferenceNumber}`, 50, patientY + 55);
        }

        // Provider Information Section
        doc
          .roundedRect(310, patientY - 15, 250, 90, 5)
          .fillAndStroke("#FEF3C7", "#FCD34D");

        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#92400E")
          .text("🏥 EYE CARE PROVIDER", 320, patientY);

        doc.fontSize(10).font("Helvetica").fillColor("#374151");
        doc.text(`Provider: ${data.ecpName}`, 320, patientY + 25);

        doc.fillColor("#000000");
        doc.y = patientY + 100;

        // Prescription Details Section
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#4F46E5")
          .text("👁 PRESCRIPTION DETAILS", 50, doc.y);

        doc.moveDown(0.8);
        
        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 160;
        const col3X = 270;
        const col4X = 380;
        const col5X = 490;

        // Table header with background
        doc
          .rect(40, tableTop - 5, 520, 25)
          .fillAndStroke("#4F46E5", "#4338CA");

        doc.fontSize(10).font("Helvetica-Bold").fillColor("#FFFFFF");
        doc.text("Eye", col1X, tableTop);
        doc.text("Sphere", col2X, tableTop);
        doc.text("Cylinder", col3X, tableTop);
        doc.text("Axis", col4X, tableTop);
        doc.text("Add", col5X, tableTop);

        doc.fillColor("#000000");

        // Right Eye Row
        let currentY = tableTop + 30;
        doc
          .rect(40, currentY - 5, 520, 25)
          .fillAndStroke("#F9FAFB", "#E5E7EB");

        doc.font("Helvetica-Bold").fillColor("#374151");
        doc.text("OD (Right)", col1X, currentY);
        
        doc.font("Helvetica").fillColor("#111827");
        doc.text(data.rightEye.sphere || "—", col2X, currentY);
        doc.text(data.rightEye.cylinder || "—", col3X, currentY);
        doc.text(data.rightEye.axis || "—", col4X, currentY);
        doc.text(data.rightEye.add || "—", col5X, currentY);

        // Left Eye Row
        currentY += 30;
        doc
          .rect(40, currentY - 5, 520, 25)
          .fillAndStroke("#FFFFFF", "#E5E7EB");

        doc.font("Helvetica-Bold").fillColor("#374151");
        doc.text("OS (Left)", col1X, currentY);
        
        doc.font("Helvetica").fillColor("#111827");
        doc.text(data.leftEye.sphere || "—", col2X, currentY);
        doc.text(data.leftEye.cylinder || "—", col3X, currentY);
        doc.text(data.leftEye.axis || "—", col4X, currentY);
        doc.text(data.leftEye.add || "—", col5X, currentY);

        doc.fillColor("#000000");
        doc.y = currentY + 40;

        // PD Section
        if (data.pd) {
          doc
            .roundedRect(40, doc.y, 520, 30, 5)
            .fillAndStroke("#DBEAFE", "#93C5FD");

          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .fillColor("#1E40AF")
            .text(`📏 Pupillary Distance (PD): ${data.pd} mm`, 50, doc.y + 10);

          doc.y += 40;
        }

        // Lens Specifications Section
        doc.moveDown(1);
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#4F46E5")
          .text("🔬 LENS SPECIFICATIONS", 50, doc.y);

        doc.moveDown(0.8);

        const specsY = doc.y;
        doc
          .roundedRect(40, specsY - 5, 520, 90, 5)
          .fillAndStroke("#F0FDF4", "#BBF7D0");

        doc.fontSize(10).font("Helvetica").fillColor("#374151");
        doc.text(`Lens Type: ${data.lensType}`, 50, specsY + 10);
        doc.text(`Material: ${data.lensMaterial}`, 50, specsY + 30);
        doc.text(`Coating: ${data.coating}`, 50, specsY + 50);
        if (data.frameType) {
          doc.text(`Frame Type: ${data.frameType}`, 50, specsY + 70);
        }

        doc.fillColor("#000000");
        doc.y = specsY + 105;

        // Notes Section
        if (data.notes) {
          doc.moveDown(1);
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#4F46E5")
            .text("📝 ADDITIONAL NOTES", 50, doc.y);

          doc.moveDown(0.5);

          doc
            .roundedRect(40, doc.y, 520, 60, 5)
            .fillAndStroke("#FEF3C7", "#FCD34D");

          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#78350F")
            .text(data.notes, 50, doc.y + 15, {
              width: 500,
              align: "left",
            });

          doc.y += 75;
        }

        // Footer
        doc
          .rect(0, 750, 612, 92)
          .fillAndStroke("#F3F4F6", "#E5E7EB");

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6B7280")
          .text("This order sheet was generated by Integrated Lens System", 0, 770, {
            align: "center",
            width: 612,
          });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 0, 785, {
          align: "center",
          width: 612,
        });

        doc.end();
      } catch (error) {
        this.logger.error("Error generating order sheet PDF", error as Error);
        reject(error);
      }
    });
  }
}

// Create singleton instance
export const pdfService = new PDFService();
