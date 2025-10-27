import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { formatDate } from '../utils/dateUtils';

interface PrescriptionData {
  examinationId: string;
  patientId: string;
  ecpId: string;
  prescription: {
    od: {
      sphere: string;
      cylinder: string;
      axis: string;
      add?: string;
    };
    os: {
      sphere: string;
      cylinder: string;
      axis: string;
      add?: string;
    };
    pd: string;
    notes?: string;
  };
}

interface ReportOptions {
  includeHeader?: boolean;
  includeLogo?: boolean;
  includeFooter?: boolean;
  orientation?: 'portrait' | 'landscape';
}

class PDFGenerationService {
  private static instance: PDFGenerationService;

  private constructor() {}

  public static getInstance(): PDFGenerationService {
    if (!PDFGenerationService.instance) {
      PDFGenerationService.instance = new PDFGenerationService();
    }
    return PDFGenerationService.instance;
  }

  /**
   * Generate a prescription PDF
   */
  public async generatePrescription(data: PrescriptionData): Promise<Buffer> {
    try {
      const [patient, ecp, examination] = await Promise.all([
        db.select().from(schema.patients).where(eq(schema.patients.id, data.patientId)).execute(),
        db.select().from(schema.users).where(eq(schema.users.id, data.ecpId)).execute(),
        db.select().from(schema.eyeExaminations).where(eq(schema.eyeExaminations.id, data.examinationId)).execute()
      ]);

      if (!patient.length || !ecp.length || !examination.length) {
        throw new Error('Required data not found');
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Create a buffer to store the PDF
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      
      const pdfPromise = new Promise<Buffer>((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      });

      // Add header
      this.addHeader(doc);

      // Add prescription details
      doc.moveDown(2);
      doc.fontSize(14).text('Optical Prescription', { align: 'center' });
      doc.moveDown();

      // Patient details
      doc.fontSize(12).text('Patient Details:', { underline: true });
      doc.fontSize(10)
        .text(`Name: ${patient[0].name}`)
        .text(`DOB: ${patient[0].dateOfBirth}`)
        .text(`NHS Number: ${patient[0].nhsNumber || 'N/A'}`);
      doc.moveDown();

      // Prescription table
      this.drawPrescriptionTable(doc, data.prescription);
      doc.moveDown();

      // Additional notes
      if (data.prescription.notes) {
        doc.fontSize(12).text('Notes:', { underline: true });
        doc.fontSize(10).text(data.prescription.notes);
        doc.moveDown();
      }

      // ECP details and signature
      doc.fontSize(12).text('Prescribed by:', { underline: true });
      doc.fontSize(10)
        .text(`${ecp[0].firstName} ${ecp[0].lastName}`)
        .text(`GOC Number: ${ecp[0].gocNumber}`)
        .text(`Date: ${formatDate(examination[0].createdAt)}`);

      // Add footer
      this.addFooter(doc);

      // Finalize PDF
      doc.end();

      return pdfPromise;
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      throw error;
    }
  }

  /**
   * Generate an examination report PDF
   */
  public async generateExaminationReport(examinationId: string, options: ReportOptions = {}): Promise<Buffer> {
    try {
      const [examination, patient, ecp] = await Promise.all([
        db.select().from(schema.eyeExaminations).where(eq(schema.eyeExaminations.id, examinationId)).execute(),
        db.select().from(schema.patients).where(eq(schema.patients.id, schema.eyeExaminations.patientId)).execute(),
        db.select().from(schema.users).where(eq(schema.users.id, schema.eyeExaminations.ecpId)).execute()
      ]);

      if (!examination.length || !patient.length || !ecp.length) {
        throw new Error('Required data not found');
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        layout: options.orientation || 'portrait'
      });

      // Create a buffer to store the PDF
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      
      const pdfPromise = new Promise<Buffer>((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      });

      if (options.includeHeader) {
        this.addHeader(doc);
      }

      // Report title
      doc.moveDown(2);
      doc.fontSize(14).text('Eye Examination Report', { align: 'center' });
      doc.moveDown();

      // Patient information
      this.addPatientSection(doc, patient[0]);
      doc.moveDown();

      // Examination details
      this.addExaminationSection(doc, examination[0]);
      doc.moveDown();

      // Clinical findings
      this.addClinicalFindingsSection(doc, examination[0]);
      doc.moveDown();

      // Management plan
      this.addManagementSection(doc, examination[0]);
      doc.moveDown();

      // Equipment readings
      if (examination[0].equipmentReadings) {
        this.addEquipmentReadingsSection(doc, examination[0].equipmentReadings);
        doc.moveDown();
      }

      // ECP signature
      this.addSignatureSection(doc, ecp[0], examination[0]);

      if (options.includeFooter) {
        this.addFooter(doc);
      }

      // Finalize PDF
      doc.end();

      return pdfPromise;
    } catch (error) {
      console.error('Error generating examination report PDF:', error);
      throw error;
    }
  }

  private addHeader(doc: PDFKit.PDFDocument): void {
    // Add company logo
    // doc.image('path/to/logo.png', 50, 45, { width: 50 });

    // Add company details
    doc.fontSize(10)
      .text('Your Optical Practice', 50, 50, { align: 'left' })
      .text('123 Eye Street', 50, 65)
      .text('London, SW1A 1AA', 50, 80)
      .text('Tel: 020 7123 4567', 50, 95);

    doc.moveDown(2);
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const today = new Date().toLocaleDateString();
    
    doc.fontSize(8)
      .text(
        `Generated on ${today} | Page ${doc.bufferedPageRange().start + 1}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
  }

  private drawPrescriptionTable(doc: PDFKit.PDFDocument, prescription: PrescriptionData['prescription']): void {
    const tableTop = doc.y + 20;
    const colWidth = (doc.page.width - 100) / 5;

    // Draw headers
    doc.fontSize(10)
      .text('', 50, tableTop)
      .text('SPH', 50 + colWidth)
      .text('CYL', 50 + colWidth * 2)
      .text('AXIS', 50 + colWidth * 3)
      .text('ADD', 50 + colWidth * 4);

    // Draw right eye data
    doc.text('R', 50, tableTop + 20)
      .text(prescription.od.sphere, 50 + colWidth)
      .text(prescription.od.cylinder, 50 + colWidth * 2)
      .text(prescription.od.axis, 50 + colWidth * 3)
      .text(prescription.od.add || 'N/A', 50 + colWidth * 4);

    // Draw left eye data
    doc.text('L', 50, tableTop + 40)
      .text(prescription.os.sphere, 50 + colWidth)
      .text(prescription.os.cylinder, 50 + colWidth * 2)
      .text(prescription.os.axis, 50 + colWidth * 3)
      .text(prescription.os.add || 'N/A', 50 + colWidth * 4);

    // Draw PD
    doc.moveDown()
      .text(`PD: ${prescription.pd}mm`);
  }

  private addPatientSection(doc: PDFKit.PDFDocument, patient: any): void {
    doc.fontSize(12).text('Patient Information:', { underline: true });
    doc.fontSize(10)
      .text(`Name: ${patient.name}`)
      .text(`Date of Birth: ${patient.dateOfBirth}`)
      .text(`NHS Number: ${patient.nhsNumber || 'N/A'}`);
  }

  private addExaminationSection(doc: PDFKit.PDFDocument, examination: any): void {
    doc.fontSize(12).text('Examination Details:', { underline: true });
    doc.fontSize(10)
      .text(`Date: ${formatDate(examination.createdAt)}`)
      .text(`Type: ${examination.examType}`)
      .text(`Reason for Visit: ${examination.reasonForVisit || 'Routine'}`);
  }

  private addClinicalFindingsSection(doc: PDFKit.PDFDocument, examination: any): void {
    doc.fontSize(12).text('Clinical Findings:', { underline: true });
    doc.fontSize(10).text(examination.clinicalFindings);
  }

  private addManagementSection(doc: PDFKit.PDFDocument, examination: any): void {
    doc.fontSize(12).text('Management Plan:', { underline: true });
    doc.fontSize(10)
      .text(examination.managementPlan)
      .moveDown()
      .text('Advice Given:')
      .text(examination.adviceGiven);
  }

  private addEquipmentReadingsSection(doc: PDFKit.PDFDocument, readings: any): void {
    doc.fontSize(12).text('Equipment Readings:', { underline: true });
    doc.fontSize(10);

    Object.entries(readings).forEach(([device, data]) => {
      doc.text(`${device}:`)
         .text(JSON.stringify(data, null, 2))
         .moveDown();
    });
  }

  private addSignatureSection(doc: PDFKit.PDFDocument, ecp: any, examination: any): void {
    doc.moveDown()
      .fontSize(10)
      .text('Examined by:')
      .text(`${ecp.firstName} ${ecp.lastName}`)
      .text(`GOC Number: ${ecp.gocNumber}`)
      .text(`Date: ${formatDate(examination.signedAt || examination.updatedAt)}`);
  }
}

export default PDFGenerationService;