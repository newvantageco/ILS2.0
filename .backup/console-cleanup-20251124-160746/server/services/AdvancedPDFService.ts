import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { db } from '../db';
import { 
  pdfTemplates, 
  posTransactions, 
  posTransactionItems, 
  products, 
  users,
  companies,
  orders,
  prescriptions,
  patients
} from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

interface PDFOptions {
  companyId: string;
  templateType: 'invoice' | 'receipt' | 'prescription' | 'report' | 'order' | 'label';
  data: any;
  customTemplate?: {
    headerLogoUrl?: string;
    footerText?: string;
    primaryColor?: string;
    secondaryColor?: string;
    paperSize?: 'A4' | 'Letter' | 'Receipt' | 'Label';
    orientation?: 'portrait' | 'landscape';
  };
}

interface ReceiptData {
  transactionId: string;
  transaction: any;
  items: any[];
  customer?: {
    name: string;
    email?: string;
  };
  staff: any;
  company: any;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  notes?: string;
}

class AdvancedPDFService {
  private static instance: AdvancedPDFService;

  private constructor() {}

  public static getInstance(): AdvancedPDFService {
    if (!AdvancedPDFService.instance) {
      AdvancedPDFService.instance = new AdvancedPDFService();
    }
    return AdvancedPDFService.instance;
  }

  /**
   * Get company template or default template
   */
  private async getTemplate(companyId: string, templateType: string) {
    const templates = await db
      .select()
      .from(pdfTemplates)
      .where(
        and(
          eq(pdfTemplates.companyId, companyId),
          eq(pdfTemplates.templateType, templateType)
        )
      )
      .limit(1);

    return templates[0] || null;
  }

  /**
   * Generate QR code as data URL
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 200,
        margin: 1,
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      return '';
    }
  }

  /**
   * Draw header with logo and branding
   */
  private async drawHeader(
    doc: PDFKit.PDFDocument,
    company: any,
    template: any,
    title: string
  ) {
    const primaryColor = template?.primaryColor || '#2563eb';
    
    // Header background
    doc
      .rect(0, 0, doc.page.width, 120)
      .fill(primaryColor);

    // Reset to black for text
    doc.fillColor('#ffffff');

    // Title
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .text(title, 50, 30, { align: 'left' });

    // Company name
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(company?.name || 'Integrated Lens System', 50, 70);

    // Company contact info
    if (company?.contactEmail) {
      doc
        .fontSize(9)
        .text(company.contactEmail, 50, 90);
    }

    // Logo placeholder (if URL provided, would need to fetch and embed)
    if (template?.headerLogoUrl) {
      // In production, fetch and embed logo image
      doc
        .fontSize(8)
        .text('[LOGO]', doc.page.width - 150, 40);
    }

    // Reset color
    doc.fillColor('#000000');
  }

  /**
   * Draw footer with page numbers and custom text
   */
  private drawFooter(
    doc: PDFKit.PDFDocument,
    template: any,
    pageNumber: number
  ) {
    const footerY = doc.page.height - 50;
    const secondaryColor = template?.secondaryColor || '#6b7280';

    doc
      .fontSize(8)
      .fillColor(secondaryColor)
      .text(
        template?.footerText || 'Thank you for your business',
        50,
        footerY,
        { align: 'center', width: doc.page.width - 100 }
      );

    doc.text(
      `Page ${pageNumber}`,
      50,
      footerY + 15,
      { align: 'center', width: doc.page.width - 100 }
    );

    doc.fillColor('#000000');
  }

  /**
   * Generate POS Receipt
   */
  public async generateReceipt(transactionId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch transaction data
        const [transaction] = await db
          .select()
          .from(posTransactions)
          .where(eq(posTransactions.id, transactionId));

        if (!transaction) {
          throw new Error('Transaction not found');
        }

        const items = await db
          .select({
            itemId: posTransactionItems.id,
            productName: products.name,
            quantity: posTransactionItems.quantity,
            unitPrice: posTransactionItems.unitPrice,
            lineTotal: posTransactionItems.lineTotal,
          })
          .from(posTransactionItems)
          .innerJoin(products, eq(posTransactionItems.productId, products.id))
          .where(eq(posTransactionItems.transactionId, transactionId));

        const [staff] = await db
          .select()
          .from(users)
          .where(eq(users.id, transaction.staffId));

        const [company] = await db
          .select()
          .from(companies)
          .where(eq(companies.id, transaction.companyId));

        const template = await this.getTemplate(transaction.companyId, 'receipt');

        // Create PDF - Receipt size (80mm width)
        const doc = new PDFDocument({
          size: [227, 842], // 80mm width, variable height
          margin: 10,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Company Name (centered)
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(company?.name || 'Store Name', { align: 'center' });

        doc
          .fontSize(8)
          .font('Helvetica')
          .text(company?.email || '', { align: 'center' })
          .text(company?.phone || '', { align: 'center' });

        doc.moveDown(0.5);

        // Receipt Header
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('RECEIPT', { align: 'center' });

        doc.moveDown(0.5);

        // Transaction Info
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(`Receipt #: ${transaction.transactionNumber || transaction.id.slice(0, 8).toUpperCase()}`, { align: 'left' })
          .text(`Date: ${new Date(transaction.transactionDate).toLocaleString()}`, { align: 'left' })
          .text(`Staff: ${staff?.firstName || ''} ${staff?.lastName || ''}`, { align: 'left' })
          .text(`Payment: ${transaction.paymentMethod.toUpperCase()}`, { align: 'left' });

        doc.moveDown(0.5);
        doc
          .moveTo(10, doc.y)
          .lineTo(217, doc.y)
          .stroke();
        doc.moveDown(0.5);

        // Items
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('ITEMS', { align: 'left' });

        doc.moveDown(0.5);

        items.forEach((item) => {
          const price = parseFloat(item.unitPrice as string);
          const total = parseFloat(item.lineTotal as string);

          doc
            .font('Helvetica')
            .text(item.productName || 'Product', { align: 'left' });

          doc.text(
            `  ${item.quantity} x £${price.toFixed(2)} = £${total.toFixed(2)}`,
            { align: 'left' }
          );

          doc.moveDown(0.3);
        });

        doc.moveDown(0.5);
        doc
          .moveTo(10, doc.y)
          .lineTo(217, doc.y)
          .stroke();
        doc.moveDown(0.5);

        // Totals
        const subtotal = parseFloat(transaction.subtotal);
        const tax = parseFloat(transaction.taxAmount || '0');
        const discount = parseFloat(transaction.discountAmount || '0');
        const total = parseFloat(transaction.totalAmount);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(`Subtotal:`, 10, doc.y, { continued: true, width: 150 })
          .text(`£${subtotal.toFixed(2)}`, { align: 'right' });

        if (discount > 0) {
          doc
            .text(`Discount:`, 10, doc.y, { continued: true, width: 150 })
            .text(`-£${discount.toFixed(2)}`, { align: 'right' });
        }

        if (tax > 0) {
          doc
            .text(`Tax:`, 10, doc.y, { continued: true, width: 150 })
            .text(`£${tax.toFixed(2)}`, { align: 'right' });
        }

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`TOTAL:`, 10, doc.y, { continued: true, width: 150 })
          .text(`£${total.toFixed(2)}`, { align: 'right' });

        doc.moveDown(0.5);

        // QR Code for verification
        doc.moveDown(1);
        const qrData = `RECEIPT:${transaction.id}`;
        const qrCode = await this.generateQRCode(qrData);

        if (qrCode) {
          doc.image(qrCode, (227 - 100) / 2, doc.y, { width: 100, height: 100 });
          doc.moveDown(6);
        }

        // Footer
        doc.moveDown(0.5);
        doc
          .fontSize(7)
          .font('Helvetica')
          .text(template?.footerText || 'Thank you for your purchase!', { align: 'center' });

        doc
          .fontSize(6)
          .text('Keep this receipt for returns and exchanges', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Professional Invoice
   */
  public async generateInvoice(invoiceData: InvoiceData, companyId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const [company] = await db
          .select()
          .from(companies)
          .where(eq(companies.id, companyId));

        const template = await this.getTemplate(companyId, 'invoice');

        const doc = new PDFDocument({
          size: template?.paperSize || 'A4',
          margin: 50,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        await this.drawHeader(doc, company, template, 'INVOICE');

        // Invoice details
        const yPos = 140;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`Invoice #: ${invoiceData.invoiceNumber}`, 50, yPos);

        doc
          .font('Helvetica')
          .text(`Date: ${invoiceData.invoiceDate.toLocaleDateString()}`, 50, yPos + 15);

        if (invoiceData.dueDate) {
          doc.text(`Due Date: ${invoiceData.dueDate.toLocaleDateString()}`, 50, yPos + 30);
        }

        // Customer details
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('BILL TO:', 50, yPos + 60);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(invoiceData.customer.name, 50, yPos + 80)
          .text(invoiceData.customer.email, 50, yPos + 95);

        if (invoiceData.customer.phone) {
          doc.text(invoiceData.customer.phone, 50, yPos + 110);
        }

        if (invoiceData.customer.address) {
          doc.text(invoiceData.customer.address, 50, yPos + 125, { width: 250 });
        }

        // Items table
        const tableTop = yPos + 180;
        const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Total'];
        const columnWidths = [250, 80, 100, 100];
        const columnX = [50, 300, 380, 480];

        // Table header
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000');

        tableHeaders.forEach((header, i) => {
          doc.text(header, columnX[i], tableTop, {
            width: columnWidths[i],
            align: i === 0 ? 'left' : 'right',
          });
        });

        // Header line
        doc
          .moveTo(50, tableTop + 15)
          .lineTo(580, tableTop + 15)
          .stroke();

        // Table rows
        let itemY = tableTop + 25;
        doc.font('Helvetica').fontSize(9);

        invoiceData.items.forEach((item) => {
          if (itemY > 700) {
            doc.addPage();
            itemY = 50;
          }

          doc.text(item.description, columnX[0], itemY, { width: columnWidths[0] });
          doc.text(String(item.quantity), columnX[1], itemY, { width: columnWidths[1], align: 'right' });
          doc.text(`£${item.unitPrice.toFixed(2)}`, columnX[2], itemY, { width: columnWidths[2], align: 'right' });
          doc.text(`£${item.total.toFixed(2)}`, columnX[3], itemY, { width: columnWidths[3], align: 'right' });

          itemY += 20;
        });

        // Totals section
        itemY += 20;
        doc
          .moveTo(380, itemY)
          .lineTo(580, itemY)
          .stroke();

        itemY += 15;
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Subtotal:', 380, itemY)
          .text(`£${invoiceData.subtotal.toFixed(2)}`, 480, itemY, { width: 100, align: 'right' });

        if (invoiceData.discount && invoiceData.discount > 0) {
          itemY += 20;
          doc
            .text('Discount:', 380, itemY)
            .text(`-£${invoiceData.discount.toFixed(2)}`, 480, itemY, { width: 100, align: 'right' });
        }

        itemY += 20;
        doc
          .text('Tax:', 380, itemY)
          .text(`£${invoiceData.tax.toFixed(2)}`, 480, itemY, { width: 100, align: 'right' });

        itemY += 20;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('TOTAL:', 380, itemY)
          .text(`£${invoiceData.total.toFixed(2)}`, 480, itemY, { width: 100, align: 'right' });

        // Notes
        if (invoiceData.notes) {
          itemY += 40;
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Notes:', 50, itemY);

          itemY += 15;
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(invoiceData.notes, 50, itemY, { width: 520 });
        }

        // QR Code
        const qrData = `INVOICE:${invoiceData.invoiceNumber}`;
        const qrCode = await this.generateQRCode(qrData);

        if (qrCode) {
          doc.image(qrCode, 50, doc.page.height - 180, { width: 100, height: 100 });
        }

        // Footer
        this.drawFooter(doc, template, 1);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Order Confirmation PDF
   */
  public async generateOrderConfirmation(orderId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId));

        if (!order) {
          throw new Error('Order not found');
        }

        // Fetch related data (customer, items, etc.)
        // Implementation similar to invoice generation

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Simple order confirmation for now
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('ORDER CONFIRMATION', 50, 50);

        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Order #: ${order.orderNumber}`, 50, 100)
          .text(`Status: ${order.status}`, 50, 120)
          .text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 50, 140);

        // QR Code
        const qrData = `ORDER:${order.id}`;
        const qrCode = await this.generateQRCode(qrData);

        if (qrCode) {
          doc.image(qrCode, 50, 200, { width: 150, height: 150 });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Label PDF (for products, prescriptions, etc.)
   */
  public async generateLabel(labelData: {
    type: 'product' | 'prescription' | 'order';
    title: string;
    subtitle?: string;
    qrData: string;
    additionalInfo?: Array<{ label: string; value: string }>;
  }): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Label size: 4x6 inches (common shipping label)
        const doc = new PDFDocument({
          size: [288, 432], // 4x6 inches in points
          margin: 20,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(labelData.title, { align: 'center' });

        if (labelData.subtitle) {
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(labelData.subtitle, { align: 'center' });
        }

        doc.moveDown(1);

        // QR Code
        const qrCode = await this.generateQRCode(labelData.qrData);
        if (qrCode) {
          const qrSize = 150;
          const qrX = (288 - qrSize) / 2;
          doc.image(qrCode, qrX, doc.y, { width: qrSize, height: qrSize });
          doc.moveDown(10);
        }

        // Additional info
        if (labelData.additionalInfo) {
          doc.fontSize(9).font('Helvetica');
          labelData.additionalInfo.forEach((info) => {
            doc.text(`${info.label}: ${info.value}`, { align: 'left' });
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default AdvancedPDFService;
