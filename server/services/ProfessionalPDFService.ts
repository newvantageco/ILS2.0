import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { db } from '../db';
import { 
  prescriptions,
  patients,
  users,
  companies,
  orders,
  eyeExaminations
} from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Professional PDF Service for Optical Practice Documents
 * Designed with British optical standards and GOC compliance in mind
 */
class ProfessionalPDFService {
  private static instance: ProfessionalPDFService;

  private constructor() {}

  public static getInstance(): ProfessionalPDFService {
    if (!ProfessionalPDFService.instance) {
      ProfessionalPDFService.instance = new ProfessionalPDFService();
    }
    return ProfessionalPDFService.instance;
  }

  /**
   * Generate QR code as data URL
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 150,
        margin: 1,
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      return '';
    }
  }

  /**
   * Draw professional header with gradient and branding
   */
  private drawProfessionalHeader(
    doc: PDFKit.PDFDocument,
    company: any,
    title: string,
    subtitle?: string
  ) {
    const primaryColor = '#1e40af'; // Professional blue
    const lightColor = '#3b82f6';

    // Gradient header background
    doc.save();
    const gradient = doc.linearGradient(0, 0, doc.page.width, 0);
    gradient.stop(0, primaryColor).stop(1, lightColor);
    
    doc.rect(0, 0, doc.page.width, 140).fill(gradient);
    doc.restore();

    // Company logo placeholder area
    doc.save();
    doc.rect(50, 30, 80, 80).fill('#ffffff');
    doc.restore();

    // Title
    doc
      .fillColor('#ffffff')
      .fontSize(32)
      .font('Helvetica-Bold')
      .text(title, 150, 40, { align: 'left' });

    if (subtitle) {
      doc
        .fontSize(14)
        .font('Helvetica')
        .text(subtitle, 150, 75);
    }

    // Company details
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(company?.name || 'Optical Practice', 150, 95);

    if (company?.contactEmail) {
      doc.text(company.contactEmail, 150, 110);
    }

    // Reset color
    doc.fillColor('#000000');
  }

  /**
   * Draw info box with label and value
   */
  private drawInfoBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    label: string,
    value: string | null | undefined,
    options: { backgroundColor?: string; borderColor?: string } = {}
  ) {
    const backgroundColor = options.backgroundColor || '#f3f4f6';
    const borderColor = options.borderColor || '#d1d5db';

    // Box background
    doc.save();
    doc.rect(x, y, width, 40).fill(backgroundColor);
    doc.rect(x, y, width, 40).stroke(borderColor);
    doc.restore();

    // Label
    doc
      .fontSize(8)
      .fillColor('#6b7280')
      .font('Helvetica')
      .text(label, x + 8, y + 8, { width: width - 16 });

    // Value
    doc
      .fontSize(11)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text(value || 'N/A', x + 8, y + 22, { width: width - 16 });

    doc.fillColor('#000000');
  }

  /**
   * Draw prescription table for spectacle values
   */
  private drawPrescriptionTable(
    doc: PDFKit.PDFDocument,
    startY: number,
    prescriptionData: any
  ) {
    const tableX = 50;
    const tableWidth = 495;
    const rowHeight = 35;
    const headerColor = '#1e40af';
    const evenRowColor = '#f9fafb';

    // Table header
    doc.save();
    doc.rect(tableX, startY, tableWidth, 40).fill(headerColor);
    doc.restore();

    const columns = [
      { label: 'Eye', x: tableX + 10, width: 60 },
      { label: 'Sphere', x: tableX + 80, width: 80 },
      { label: 'Cylinder', x: tableX + 170, width: 80 },
      { label: 'Axis', x: tableX + 260, width: 65 },
      { label: 'Add', x: tableX + 335, width: 70 },
      { label: 'Prism', x: tableX + 415, width: 70 }
    ];

    // Draw column headers
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    columns.forEach(col => {
      doc.text(col.label, col.x, startY + 12, { width: col.width, align: 'center' });
    });

    doc.fillColor('#000000');

    // Right Eye (OD)
    let currentY = startY + 40;
    doc.save();
    doc.rect(tableX, currentY, tableWidth, rowHeight).fill(evenRowColor);
    doc.restore();

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('OD (Right)', columns[0].x, currentY + 10, { width: columns[0].width });

    doc.font('Helvetica');
    doc.text(prescriptionData.odSphere || '-', columns[1].x, currentY + 10, { width: columns[1].width, align: 'center' });
    doc.text(prescriptionData.odCylinder || '-', columns[2].x, currentY + 10, { width: columns[2].width, align: 'center' });
    doc.text(prescriptionData.odAxis || '-', columns[3].x, currentY + 10, { width: columns[3].width, align: 'center' });
    doc.text(prescriptionData.odAdd || '-', columns[4].x, currentY + 10, { width: columns[4].width, align: 'center' });
    
    const odPrism = prescriptionData.odPrismHorizontal || prescriptionData.odPrismVertical
      ? `${prescriptionData.odPrismHorizontal || '0'}/${prescriptionData.odPrismVertical || '0'} ${prescriptionData.odPrismBase || ''}`
      : '-';
    doc.text(odPrism, columns[5].x, currentY + 10, { width: columns[5].width, align: 'center' });

    // Left Eye (OS)
    currentY += rowHeight;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('OS (Left)', columns[0].x, currentY + 10, { width: columns[0].width });

    doc.font('Helvetica');
    doc.text(prescriptionData.osSphere || '-', columns[1].x, currentY + 10, { width: columns[1].width, align: 'center' });
    doc.text(prescriptionData.osCylinder || '-', columns[2].x, currentY + 10, { width: columns[2].width, align: 'center' });
    doc.text(prescriptionData.osAxis || '-', columns[3].x, currentY + 10, { width: columns[3].width, align: 'center' });
    doc.text(prescriptionData.osAdd || '-', columns[4].x, currentY + 10, { width: columns[4].width, align: 'center' });
    
    const osPrism = prescriptionData.osPrismHorizontal || prescriptionData.osPrismVertical
      ? `${prescriptionData.osPrismHorizontal || '0'}/${prescriptionData.osPrismVertical || '0'} ${prescriptionData.osPrismBase || ''}`
      : '-';
    doc.text(osPrism, columns[5].x, currentY + 10, { width: columns[5].width, align: 'center' });

    // Draw table border
    doc.rect(tableX, startY, tableWidth, 40 + rowHeight * 2).stroke('#d1d5db');

    return currentY + rowHeight;
  }

  /**
   * Generate Professional Prescription PDF with GOC Compliance
   */
  public async generatePrescriptionPDF(prescriptionId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch prescription with all related data
        const [prescription] = await db
          .select({
            prescription: prescriptions,
            patient: patients,
            prescriber: users,
            company: companies,
          })
          .from(prescriptions)
          .innerJoin(patients, eq(prescriptions.patientId, patients.id))
          .innerJoin(users, eq(prescriptions.ecpId, users.id))
          .innerJoin(companies, eq(prescriptions.companyId, companies.id))
          .where(eq(prescriptions.id, prescriptionId));

        if (!prescription) {
          throw new Error('Prescription not found');
        }

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Prescription - ${prescription.patient.name}`,
            Author: `${prescription.prescriber.firstName} ${prescription.prescriber.lastName}`,
            Subject: 'Optical Prescription',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.drawProfessionalHeader(
          doc,
          prescription.company,
          'OPTICAL PRESCRIPTION',
          'GOC Compliant Prescription Record'
        );

        // Document reference and dates
        let yPos = 160;
        this.drawInfoBox(doc, 50, yPos, 150, 'Prescription ID', prescription.prescription.id.substring(0, 8).toUpperCase());
        this.drawInfoBox(doc, 210, yPos, 150, 'Issue Date', new Date(prescription.prescription.issueDate).toLocaleDateString('en-GB'));
        this.drawInfoBox(doc, 370, yPos, 175, 'Expiry Date', 
          prescription.prescription.expiryDate ? new Date(prescription.prescription.expiryDate).toLocaleDateString('en-GB') : 'N/A'
        );

        // Patient Information Section
        yPos += 60;
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('PATIENT INFORMATION', 50, yPos);

        doc.fillColor('#000000');
        yPos += 30;

        this.drawInfoBox(doc, 50, yPos, 240, 'Patient Name', prescription.patient.name);
        this.drawInfoBox(doc, 300, yPos, 245, 'Date of Birth', prescription.patient.dateOfBirth || 'N/A');

        yPos += 50;
        this.drawInfoBox(doc, 50, yPos, 240, 'Customer Number', prescription.patient.customerNumber);
        this.drawInfoBox(doc, 300, yPos, 245, 'NHS Number', prescription.patient.nhsNumber || 'N/A');

        // Prescription Details Section
        yPos += 70;
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('PRESCRIPTION DETAILS', 50, yPos);

        doc.fillColor('#000000');
        yPos += 30;

        // Main prescription table
        const tableEndY = this.drawPrescriptionTable(doc, yPos, prescription.prescription);
        yPos = tableEndY + 20;

        // Pupillary Distance Information
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Pupillary Distance (PD):', 50, yPos);

        yPos += 25;
        this.drawInfoBox(doc, 50, yPos, 120, 'Binocular PD', prescription.prescription.binocularPd?.toString() || prescription.prescription.pd || 'N/A');
        this.drawInfoBox(doc, 180, yPos, 120, 'Right (Monocular)', prescription.prescription.pdRight?.toString() || 'N/A');
        this.drawInfoBox(doc, 310, yPos, 120, 'Left (Monocular)', prescription.prescription.pdLeft?.toString() || 'N/A');
        this.drawInfoBox(doc, 440, yPos, 105, 'Near PD', prescription.prescription.nearPd?.toString() || 'N/A');

        // Additional Clinical Information
        yPos += 60;
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('CLINICAL INFORMATION', 50, yPos);

        doc.fillColor('#000000');
        yPos += 30;

        // Visual Acuity
        if (prescription.prescription.odVisualAcuityAided || prescription.prescription.osVisualAcuityAided) {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Visual Acuity:', 50, yPos);

          yPos += 20;
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(`OD (Right): ${prescription.prescription.odVisualAcuityAided || 'Not recorded'}`, 50, yPos)
            .text(`OS (Left): ${prescription.prescription.osVisualAcuityAided || 'Not recorded'}`, 300, yPos);

          yPos += 15;
          if (prescription.prescription.binocularVisualAcuity) {
            doc.text(`Binocular: ${prescription.prescription.binocularVisualAcuity}`, 50, yPos);
          }
          yPos += 25;
        }

        // Prescription Type & Recommendations
        if (prescription.prescription.prescriptionType || prescription.prescription.recommendedLensType) {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Prescription Type & Recommendations:', 50, yPos);

          yPos += 20;
          doc
            .fontSize(9)
            .font('Helvetica');

          if (prescription.prescription.prescriptionType) {
            doc.text(`Type: ${prescription.prescription.prescriptionType}`, 50, yPos);
            yPos += 15;
          }

          if (prescription.prescription.recommendedLensType) {
            doc.text(`Recommended Lens: ${prescription.prescription.recommendedLensType}`, 50, yPos);
            yPos += 15;
          }

          if (prescription.prescription.recommendedLensMaterial) {
            doc.text(`Recommended Material: ${prescription.prescription.recommendedLensMaterial}`, 50, yPos);
            yPos += 15;
          }

          yPos += 10;
        }

        // Clinical Notes
        if (prescription.prescription.dispensingNotes || prescription.prescription.clinicalRecommendations) {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Clinical Notes:', 50, yPos);

          yPos += 20;
          doc
            .fontSize(9)
            .font('Helvetica');

          if (prescription.prescription.dispensingNotes) {
            doc.text(prescription.prescription.dispensingNotes, 50, yPos, { width: 495, align: 'justify' });
            yPos += doc.heightOfString(prescription.prescription.dispensingNotes, { width: 495 }) + 10;
          }

          if (prescription.prescription.clinicalRecommendations) {
            doc.text(prescription.prescription.clinicalRecommendations, 50, yPos, { width: 495, align: 'justify' });
            yPos += doc.heightOfString(prescription.prescription.clinicalRecommendations, { width: 495 }) + 10;
          }
        }

        // Prescriber Information
        yPos += 20;
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('PRESCRIBER INFORMATION', 50, yPos);

        doc.fillColor('#000000');
        yPos += 30;

        const prescriberName = prescription.prescription.prescriberName || 
          `${prescription.prescriber.firstName} ${prescription.prescriber.lastName}`;

        this.drawInfoBox(doc, 50, yPos, 240, 'Prescriber', prescriberName);
        this.drawInfoBox(doc, 300, yPos, 245, 'GOC Number', prescription.prescription.prescriberGocNumber || 'N/A');

        yPos += 50;
        this.drawInfoBox(doc, 50, yPos, 240, 'Qualifications', prescription.prescription.prescriberQualifications || 'N/A');
        this.drawInfoBox(doc, 300, yPos, 245, 'Test Room', prescription.prescription.testRoomName || 'N/A');

        // Digital Signature Status
        yPos += 70;
        doc
          .fontSize(12)
          .font('Helvetica-Bold');

        if (prescription.prescription.isSigned) {
          doc
            .fillColor('#16a34a')
            .text('✓ DIGITALLY SIGNED', 50, yPos);

          if (prescription.prescription.signedAt) {
            doc
              .fontSize(9)
              .font('Helvetica')
              .fillColor('#000000')
              .text(`Signed on: ${new Date(prescription.prescription.signedAt).toLocaleString('en-GB')}`, 50, yPos + 20);
          }
        } else {
          doc
            .fillColor('#dc2626')
            .text('⚠ NOT SIGNED', 50, yPos);

          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text('This prescription must be signed before being dispensed', 50, yPos + 20);
        }

        // QR Code for verification
        const qrData = JSON.stringify({
          type: 'prescription',
          id: prescription.prescription.id,
          patient: prescription.patient.customerNumber,
          issued: prescription.prescription.issueDate,
        });

        const qrCode = await this.generateQRCode(qrData);
        if (qrCode) {
          doc.image(qrCode, 450, yPos - 10, { width: 100, height: 100 });
        }

        // Footer with compliance notes
        const footerY = doc.page.height - 80;
        doc
          .fontSize(8)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(
            'This prescription is issued in accordance with GOC standards and must be retained for the period specified by regulations.',
            50,
            footerY,
            { width: 495, align: 'center' }
          );

        doc
          .fontSize(7)
          .text(
            `Record Retention: ${prescription.prescription.recordRetentionDate ? new Date(prescription.prescription.recordRetentionDate).toLocaleDateString('en-GB') : 'As per GOC guidelines'}`,
            50,
            footerY + 20,
            { width: 495, align: 'center' }
          );

        doc.end();
      } catch (error) {
        console.error('Error generating prescription PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Professional Order Slip for Lab
   */
  public async generateOrderSlipPDF(orderId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch order with all related data
        const [orderData] = await db
          .select({
            order: orders,
            patient: patients,
            ecp: users,
            company: companies,
          })
          .from(orders)
          .innerJoin(patients, eq(orders.patientId, patients.id))
          .innerJoin(users, eq(orders.ecpId, users.id))
          .innerJoin(companies, eq(orders.companyId, companies.id))
          .where(eq(orders.id, orderId));

        if (!orderData) {
          throw new Error('Order not found');
        }

        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Lab Order - ${orderData.order.orderNumber}`,
            Author: orderData.company.name,
            Subject: 'Laboratory Order Slip',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.drawProfessionalHeader(
          doc,
          orderData.company,
          'LAB ORDER SLIP',
          'Laboratory Processing Order'
        );

        // Order Information Bar
        let yPos = 160;
        doc
          .save()
          .rect(40, yPos, 515, 50)
          .fill('#fef3c7')
          .stroke('#f59e0b')
          .restore();

        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#92400e')
          .text(`ORDER #: ${orderData.order.orderNumber}`, 50, yPos + 8);

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#78350f')
          .text(`Status: ${orderData.order.status.toUpperCase()}`, 50, yPos + 30)
          .text(`Order Date: ${new Date(orderData.order.orderDate).toLocaleDateString('en-GB')}`, 250, yPos + 30);

        if (orderData.order.dueDate) {
          doc
            .font('Helvetica-Bold')
            .text(`DUE: ${new Date(orderData.order.dueDate).toLocaleDateString('en-GB')}`, 420, yPos + 30);
        }

        doc.fillColor('#000000');

        // Patient Information
        yPos += 70;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('PATIENT INFORMATION', 40, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        this.drawInfoBox(doc, 40, yPos, 250, 'Patient Name', orderData.patient.name, { backgroundColor: '#e0f2fe' });
        this.drawInfoBox(doc, 300, yPos, 255, 'Customer Number', orderData.patient.customerNumber, { backgroundColor: '#e0f2fe' });

        yPos += 50;
        this.drawInfoBox(doc, 40, yPos, 250, 'Date of Birth', orderData.patient.dateOfBirth || 'N/A');
        
        const customerRef = orderData.order.customerReferenceLabel && orderData.order.customerReferenceNumber
          ? `${orderData.order.customerReferenceLabel}: ${orderData.order.customerReferenceNumber}`
          : 'N/A';
        this.drawInfoBox(doc, 300, yPos, 255, 'Customer Reference', customerRef);

        // Prescription Details
        yPos += 70;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('PRESCRIPTION DETAILS', 40, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        const tableEndY = this.drawPrescriptionTable(doc, yPos, orderData.order);
        yPos = tableEndY + 20;

        // PD Information
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Pupillary Distance:', 40, yPos);

        yPos += 20;
        this.drawInfoBox(doc, 40, yPos, 170, 'PD', orderData.order.pd || 'N/A', { backgroundColor: '#fef9c3' });

        // Lens Specifications
        yPos += 60;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('LENS SPECIFICATIONS', 40, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        this.drawInfoBox(doc, 40, yPos, 165, 'Lens Type', orderData.order.lensType, { backgroundColor: '#dbeafe' });
        this.drawInfoBox(doc, 215, yPos, 165, 'Lens Material', orderData.order.lensMaterial, { backgroundColor: '#dbeafe' });
        this.drawInfoBox(doc, 390, yPos, 165, 'Coating', orderData.order.coating, { backgroundColor: '#dbeafe' });

        yPos += 50;
        if (orderData.order.frameType) {
          this.drawInfoBox(doc, 40, yPos, 515, 'Frame Type', orderData.order.frameType);
          yPos += 50;
        }

        // Special Instructions & Notes
        if (orderData.order.notes) {
          yPos += 10;
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#dc2626')
            .text('SPECIAL INSTRUCTIONS:', 40, yPos);

          doc.fillColor('#000000');
          yPos += 20;

          doc
            .save()
            .rect(40, yPos, 515, 60)
            .fill('#fef2f2')
            .stroke('#dc2626')
            .restore();

          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#000000')
            .text(orderData.order.notes, 50, yPos + 10, { width: 495, align: 'left' });

          yPos += 70;
        }

        // Lab Processing Information
        yPos += 10;
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('LAB PROCESSING', 40, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        this.drawInfoBox(doc, 40, yPos, 165, 'Job ID', orderData.order.jobId || 'Pending', { backgroundColor: '#f0fdf4' });
        this.drawInfoBox(doc, 215, yPos, 165, 'Job Status', orderData.order.jobStatus || 'Not Started', { backgroundColor: '#f0fdf4' });
        this.drawInfoBox(doc, 390, yPos, 165, 'Tracking #', orderData.order.trackingNumber || 'N/A', { backgroundColor: '#f0fdf4' });

        // Ordered By
        yPos += 70;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Ordered By:', 40, yPos);

        yPos += 20;
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`${orderData.ecp.firstName} ${orderData.ecp.lastName}`, 40, yPos)
          .text(`${orderData.company.name}`, 40, yPos + 15);

        if (orderData.company.email) {
          doc.text(orderData.company.email, 40, yPos + 30);
        }

        // Large QR Code for scanning in lab
        const qrData = JSON.stringify({
          type: 'order',
          orderNumber: orderData.order.orderNumber,
          id: orderData.order.id,
          patient: orderData.patient.customerNumber,
        });

        const qrCode = await this.generateQRCode(qrData);
        if (qrCode) {
          doc.image(qrCode, 400, yPos - 20, { width: 150, height: 150 });
        }

        // Barcode alternative text
        doc
          .fontSize(8)
          .fillColor('#6b7280')
          .font('Courier')
          .text(orderData.order.orderNumber, 400, yPos + 135, { width: 150, align: 'center' });

        doc.fillColor('#000000');

        // Footer
        const footerY = doc.page.height - 60;
        doc
          .fontSize(7)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(
            'This order slip must accompany the job through all stages of production. Verify all measurements before processing.',
            40,
            footerY,
            { width: 515, align: 'center' }
          );

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .text(`Page 1 of 1 - Generated: ${new Date().toLocaleString('en-GB')}`, 40, footerY + 20, {
            width: 515,
            align: 'center',
          });

        doc.end();
      } catch (error) {
        console.error('Error generating order slip PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Comprehensive Customer/Patient Information Sheet
   */
  public async generateCustomerInfoPDF(patientId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch patient with company info
        const [patientData] = await db
          .select({
            patient: patients,
            company: companies,
            ecp: users,
          })
          .from(patients)
          .innerJoin(companies, eq(patients.companyId, companies.id))
          .leftJoin(users, eq(patients.ecpId, users.id))
          .where(eq(patients.id, patientId));

        if (!patientData) {
          throw new Error('Patient not found');
        }

        // Get prescription history
        const recentPrescriptions = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.patientId, patientId))
          .orderBy(prescriptions.issueDate)
          .limit(5);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Patient Information - ${patientData.patient.name}`,
            Author: patientData.company.name,
            Subject: 'Patient Information Sheet',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.drawProfessionalHeader(
          doc,
          patientData.company,
          'PATIENT INFORMATION',
          'Comprehensive Patient Record'
        );

        // Patient ID and Status Bar
        let yPos = 160;
        doc
          .save()
          .rect(50, yPos, 495, 45)
          .fill('#ecfdf5')
          .stroke('#10b981')
          .restore();

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#065f46')
          .text(patientData.patient.name, 60, yPos + 8);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Customer #: ${patientData.patient.customerNumber}`, 60, yPos + 28);

        doc
          .fontSize(9)
          .text(`Created: ${new Date(patientData.patient.createdAt).toLocaleDateString('en-GB')}`, 350, yPos + 28);

        doc.fillColor('#000000');

        // Demographics Section
        yPos += 65;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('DEMOGRAPHICS', 50, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        this.drawInfoBox(doc, 50, yPos, 240, 'Full Name', patientData.patient.name);
        this.drawInfoBox(doc, 300, yPos, 245, 'Date of Birth', patientData.patient.dateOfBirth || 'N/A');

        yPos += 50;
        this.drawInfoBox(doc, 50, yPos, 240, 'Email', patientData.patient.email || 'N/A');
        this.drawInfoBox(doc, 300, yPos, 245, 'NHS Number', patientData.patient.nhsNumber || 'N/A');

        yPos += 50;
        const address = patientData.patient.fullAddress 
          ? typeof patientData.patient.fullAddress === 'string' 
            ? patientData.patient.fullAddress 
            : JSON.stringify(patientData.patient.fullAddress)
          : 'N/A';
        
        doc
          .fontSize(8)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text('Full Address', 50, yPos);

        doc
          .fontSize(10)
          .fillColor('#000000')
          .font('Helvetica')
          .text(address, 50, yPos + 15, { width: 495 });

        // Clinical Information
        yPos += 55;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('CLINICAL INFORMATION', 50, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        this.drawInfoBox(doc, 50, yPos, 165, 'Contact Lens Wearer', patientData.patient.contactLensWearer ? 'Yes' : 'No');
        this.drawInfoBox(doc, 225, yPos, 165, 'VDU User', patientData.patient.vduUser ? 'Yes' : 'No');
        this.drawInfoBox(doc, 400, yPos, 145, 'Driving Requirement', patientData.patient.drivingRequirement ? 'Yes' : 'No');

        yPos += 50;
        this.drawInfoBox(doc, 50, yPos, 240, 'Last Examination', 
          patientData.patient.lastExaminationDate 
            ? new Date(patientData.patient.lastExaminationDate).toLocaleDateString('en-GB') 
            : 'N/A'
        );
        this.drawInfoBox(doc, 300, yPos, 245, 'Next Exam Due', 
          patientData.patient.nextExaminationDue 
            ? new Date(patientData.patient.nextExaminationDue).toLocaleDateString('en-GB') 
            : 'N/A'
        );

        yPos += 50;
        this.drawInfoBox(doc, 50, yPos, 240, 'Occupation', patientData.patient.occupation || 'N/A');
        this.drawInfoBox(doc, 300, yPos, 245, 'Preferred Contact', patientData.patient.preferredContactMethod || 'N/A');

        // Medical History
        yPos += 60;
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('MEDICAL HISTORY', 50, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        if (patientData.patient.medicalHistory) {
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(JSON.stringify(patientData.patient.medicalHistory), 50, yPos, { width: 495 });
          yPos += doc.heightOfString(JSON.stringify(patientData.patient.medicalHistory), { width: 495 }) + 20;
        } else {
          doc
            .fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor('#6b7280')
            .text('No medical history recorded', 50, yPos);
          yPos += 30;
        }

        if (patientData.patient.currentMedications) {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('Current Medications:', 50, yPos);

          yPos += 15;
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(patientData.patient.currentMedications, 50, yPos, { width: 495 });
          yPos += doc.heightOfString(patientData.patient.currentMedications, { width: 495 }) + 20;
        }

        if (patientData.patient.familyOcularHistory) {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Family Ocular History:', 50, yPos);

          yPos += 15;
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(patientData.patient.familyOcularHistory, 50, yPos, { width: 495 });
          yPos += doc.heightOfString(patientData.patient.familyOcularHistory, { width: 495 }) + 20;
        }

        // Healthcare Providers
        yPos += 10;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('HEALTHCARE PROVIDERS', 50, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        this.drawInfoBox(doc, 50, yPos, 240, 'GP Name', patientData.patient.gpName || 'N/A');
        this.drawInfoBox(doc, 300, yPos, 245, 'GP Practice', patientData.patient.gpPractice || 'N/A');

        yPos += 50;
        this.drawInfoBox(doc, 50, yPos, 240, 'Previous Optician', patientData.patient.previousOptician || 'N/A');
        this.drawInfoBox(doc, 300, yPos, 245, 'Primary ECP', 
          patientData.ecp ? `${patientData.ecp.firstName} ${patientData.ecp.lastName}` : 'N/A'
        );

        // Emergency Contact
        yPos += 60;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#dc2626')
          .text('EMERGENCY CONTACT', 50, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        this.drawInfoBox(doc, 50, yPos, 240, 'Name', patientData.patient.emergencyContactName || 'N/A', 
          { backgroundColor: '#fee2e2', borderColor: '#dc2626' }
        );
        this.drawInfoBox(doc, 300, yPos, 245, 'Phone', patientData.patient.emergencyContactPhone || 'N/A', 
          { backgroundColor: '#fee2e2', borderColor: '#dc2626' }
        );

        yPos += 50;
        this.drawInfoBox(doc, 50, yPos, 495, 'Relationship', patientData.patient.emergencyContactRelationship || 'N/A', 
          { backgroundColor: '#fee2e2', borderColor: '#dc2626' }
        );

        // Consent & Preferences
        yPos += 70;
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('CONSENT & PREFERENCES', 50, yPos);

        doc.fillColor('#000000');
        yPos += 25;

        this.drawInfoBox(doc, 50, yPos, 165, 'Marketing Consent', patientData.patient.marketingConsent ? '✓ Yes' : '✗ No');
        this.drawInfoBox(doc, 225, yPos, 165, 'Data Sharing', patientData.patient.dataSharingConsent ? '✓ Yes' : '✗ No');

        // Recent Prescription History
        if (recentPrescriptions.length > 0) {
          yPos += 60;
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#1e40af')
            .text('RECENT PRESCRIPTION HISTORY', 50, yPos);

          doc.fillColor('#000000');
          yPos += 25;

          recentPrescriptions.slice(0, 3).forEach((rx, index) => {
            const rxDate = new Date(rx.issueDate).toLocaleDateString('en-GB');
            const rxSummary = `${rxDate} - OD: ${rx.odSphere || '-'}/${rx.odCylinder || '-'} OS: ${rx.osSphere || '-'}/${rx.osCylinder || '-'}`;

            doc
              .fontSize(9)
              .font('Helvetica')
              .text(`${index + 1}. ${rxSummary}`, 50, yPos);

            yPos += 15;
          });
        }

        // QR Code
        const qrData = JSON.stringify({
          type: 'patient',
          id: patientData.patient.id,
          customerNumber: patientData.patient.customerNumber,
          name: patientData.patient.name,
        });

        const qrCode = await this.generateQRCode(qrData);
        if (qrCode) {
          doc.image(qrCode, 420, doc.page.height - 180, { width: 120, height: 120 });
        }

        // Footer
        const footerY = doc.page.height - 60;
        doc
          .fontSize(8)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(
            'This document contains confidential patient information. Handle in accordance with GDPR and data protection regulations.',
            50,
            footerY,
            { width: 350, align: 'center' }
          );

        doc
          .fontSize(7)
          .text(`Generated: ${new Date().toLocaleString('en-GB')}`, 50, footerY + 20, {
            width: 350,
            align: 'center',
          });

        doc.end();
      } catch (error) {
        console.error('Error generating customer info PDF:', error);
        reject(error);
      }
    });
  }
}

export default ProfessionalPDFService;
