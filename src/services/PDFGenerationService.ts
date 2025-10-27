import PDFDocument from 'pdfkit';
import type { PDFGenerationService, PrescriptionData, ExaminationData } from '@/types/services';

export class PDFGenerationServiceImpl implements PDFGenerationService {
  public async generatePrescription(data: PrescriptionData): Promise<Buffer> {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});

    // Add header
    doc.fontSize(18).text('PRESCRIPTION', { align: 'center' });
    doc.moveDown();

    // Add patient info
    doc.fontSize(12);
    doc.text(`Patient Name: ${data.patientName}`);
    doc.text(`Patient ID: ${data.patientId}`);
    doc.text(`Date: ${data.date || new Date().toISOString().split('T')[0]}`);
    doc.moveDown();

    // Add prescription details
    doc.text('Right Eye:');
    doc.text(`Sphere: ${data.prescription.rightEye.sphere}`);
    doc.text(`Cylinder: ${data.prescription.rightEye.cylinder}`);
    doc.text(`Axis: ${data.prescription.rightEye.axis}`);
    if (data.prescription.rightEye.add) {
      doc.text(`Add: ${data.prescription.rightEye.add}`);
    }
    doc.moveDown();

    doc.text('Left Eye:');
    doc.text(`Sphere: ${data.prescription.leftEye.sphere}`);
    doc.text(`Cylinder: ${data.prescription.leftEye.cylinder}`);
    doc.text(`Axis: ${data.prescription.leftEye.axis}`);
    if (data.prescription.leftEye.add) {
      doc.text(`Add: ${data.prescription.leftEye.add}`);
    }
    doc.moveDown();

    // Add doctor info
    doc.moveDown();
    doc.text(`Doctor: ${data.doctorName}`);
    doc.text(`License: ${data.licenseNumber}`);

    doc.end();

    return Buffer.concat(chunks);
  }

  public async generateExaminationReport(data: ExaminationData): Promise<Buffer> {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});

    // Add header
    doc.fontSize(18).text('EXAMINATION REPORT', { align: 'center' });
    doc.moveDown();

    // Add patient info
    doc.fontSize(12);
    doc.text(`Patient Name: ${data.patientName}`);
    doc.text(`Patient ID: ${data.patientId}`);
    doc.text(`Date: ${data.date || new Date().toISOString().split('T')[0]}`);
    doc.moveDown();

    // Add examination details
    doc.text('Examination Results:', { underline: true });
    data.examinations.forEach(exam => {
      doc.moveDown();
      doc.text(`${exam.type}:`);
      doc.text(`Right Eye: ${exam.rightEye}`);
      doc.text(`Left Eye: ${exam.leftEye}`);
    });

    // Add diagnosis and recommendations
    doc.moveDown();
    doc.text('Diagnosis:', { underline: true });
    doc.text(data.diagnosis);
    doc.moveDown();
    doc.text('Recommendations:', { underline: true });
    doc.text(data.recommendations);

    // Add doctor info
    doc.moveDown();
    doc.text(`Doctor: ${data.doctorName}`);
    doc.text(`License: ${data.licenseNumber}`);

    doc.end();

    return Buffer.concat(chunks);
  }

  public async extractTextFromPDF(buffer: Buffer): Promise<string> {
    // This is a mock implementation for testing
    // In a real implementation, we would use a PDF parsing library
    return buffer.toString('utf-8');
  }
}