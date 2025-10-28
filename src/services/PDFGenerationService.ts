import { inflateSync } from 'node:zlib';
import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import type { PDFGenerationService, PrescriptionData, ExaminationData } from '@/types/services';

export class PDFGenerationServiceImpl implements PDFGenerationService {
  public async generatePrescription(data: PrescriptionData): Promise<Buffer> {
    return this.renderToBuffer(doc => {
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
    });
  }

  public async generateExaminationReport(data: ExaminationData): Promise<Buffer> {
    return this.renderToBuffer(doc => {
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
    });
  }

  public async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const streamMarker = Buffer.from('stream');
      const endStreamMarker = Buffer.from('endstream');
      let offset = 0;
      const collected: string[] = [];

      while (offset < buffer.length) {
        const streamIndex = buffer.indexOf(streamMarker, offset);
        if (streamIndex === -1) {
          break;
        }

        let streamStart = streamIndex + streamMarker.length;
        if (buffer[streamStart] === 0x0d && buffer[streamStart + 1] === 0x0a) {
          streamStart += 2;
        } else if (buffer[streamStart] === 0x0a) {
          streamStart += 1;
        }

        const endStreamIndex = buffer.indexOf(endStreamMarker, streamStart);
        if (endStreamIndex === -1) {
          break;
        }

        let streamEnd = endStreamIndex;
        if (buffer[streamEnd - 1] === 0x0d) {
          streamEnd -= 1;
        }
        if (buffer[streamEnd - 1] === 0x0a) {
          streamEnd -= 1;
        }

        const streamContent = buffer.slice(streamStart, streamEnd);
        collected.push(this.decodePdfStream(streamContent));
        offset = endStreamIndex + endStreamMarker.length;
      }

      return collected.join(' ').replace(/\s+/g, ' ').trim();
    } catch {
      return buffer.toString('utf-8');
    }
  }

  private renderToBuffer(render: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      render(doc);
      doc.end();
    });
  }

  private decodePdfStream(content: Buffer): string {
    try {
      return this.extractPdfText(inflateSync(content).toString('utf-8'));
    } catch {
      return this.extractPdfText(content.toString('utf-8'));
    }
  }

  private extractPdfText(source: string): string {
    const tokens: string[] = [];

    const hexRegex = /<([0-9A-Fa-f]+)>/g;
    let match: RegExpExecArray | null;
    while ((match = hexRegex.exec(source)) !== null) {
      const hex = match[1];
      if (hex.length % 2 === 0) {
        tokens.push(Buffer.from(hex, 'hex').toString('utf-8'));
      }
    }

    const literalRegex = /\(([^(\)]*)\)/g;
    while ((match = literalRegex.exec(source)) !== null) {
      tokens.push(match[1]);
    }

    const text = tokens.join('');
    return text.replace(/\s+/g, ' ').trim();
  }
}