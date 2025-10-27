import { PDFGenerationServiceImpl } from '@/services/PDFGenerationService';
import type { PrescriptionData, ExaminationData } from '@/types/services';
import fs from 'fs/promises';
import path from 'path';

describe('PDFGenerationService', () => {
  let service: PDFGenerationServiceImpl;

  beforeEach(() => {
    service = new PDFGenerationServiceImpl();
  });

  describe('Prescription Generation', () => {
    it('should generate a prescription PDF', async () => {
      const prescriptionData: PrescriptionData = {
        patientName: 'John Doe',
        patientId: '12345',
        prescription: {
          rightEye: {
            sphere: -1.25,
            cylinder: -0.5,
            axis: 180,
            add: '+2.00'
          },
          leftEye: {
            sphere: -1.50,
            cylinder: -0.75,
            axis: 175,
            add: '+2.00'
          }
        },
        doctorName: 'Dr. Smith',
        licenseNumber: 'ABC123'
      };

      const pdfBuffer = await service.generatePrescription(prescriptionData);
      
      // Verify PDF was generated
      expect(Buffer.isBuffer(pdfBuffer)).toBeTruthy();
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Save PDF for manual inspection during development
      if (process.env.SAVE_TEST_PDFS) {
        const testOutputDir = path.join(__dirname, 'test-output');
        await fs.mkdir(testOutputDir, { recursive: true });
        await fs.writeFile(
          path.join(testOutputDir, 'test-prescription.pdf'),
          pdfBuffer
        );
      }
    });
  });

  describe('Examination Report Generation', () => {
    it('should generate an examination report PDF', async () => {
      const examData: ExaminationData = {
        patientName: 'Jane Smith',
        patientId: '67890',
        examinations: [
          {
            type: 'Visual Acuity',
            rightEye: '20/20',
            leftEye: '20/25'
          },
          {
            type: 'Intraocular Pressure',
            rightEye: '14 mmHg',
            leftEye: '15 mmHg'
          }
        ],
        diagnosis: 'Mild myopia with astigmatism',
        recommendations: 'Annual follow-up recommended',
        doctorName: 'Dr. Smith',
        licenseNumber: 'ABC123'
      };

      const pdfBuffer = await service.generateExaminationReport(examData);

      // Verify PDF was generated
      expect(Buffer.isBuffer(pdfBuffer)).toBeTruthy();
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Save PDF for manual inspection during development
      if (process.env.SAVE_TEST_PDFS) {
        const testOutputDir = path.join(__dirname, 'test-output');
        await fs.mkdir(testOutputDir, { recursive: true });
        await fs.writeFile(
          path.join(testOutputDir, 'test-exam-report.pdf'),
          pdfBuffer
        );
      }
    });
  });

  describe('PDF Content Validation', () => {
    it('should include patient details in prescription', async () => {
      const prescriptionData: PrescriptionData = {
        patientName: 'Test Patient',
        patientId: 'TEST123',
        prescription: {
          rightEye: {
            sphere: 0,
            cylinder: 0,
            axis: 0
          },
          leftEye: {
            sphere: 0,
            cylinder: 0,
            axis: 0
          }
        },
        doctorName: 'Test Doctor',
        licenseNumber: 'TEST456'
      };

      const pdfBuffer = await service.generatePrescription(prescriptionData);
      
      // Convert PDF to text for content verification
      const pdfText = await service.extractTextFromPDF(pdfBuffer);
      
      // Verify content
      expect(pdfText).toContain('PRESCRIPTION');
      expect(pdfText).toContain(prescriptionData.patientName);
      expect(pdfText).toContain(prescriptionData.doctorName);
    });

    it('should include examination details in report', async () => {
      const examData: ExaminationData = {
        patientName: 'Test Patient',
        patientId: 'TEST123',
        examinations: [
          {
            type: 'Visual Acuity',
            rightEye: '20/20',
            leftEye: '20/20'
          }
        ],
        diagnosis: 'Test diagnosis',
        recommendations: 'Test recommendations',
        doctorName: 'Test Doctor',
        licenseNumber: 'TEST456'
      };

      const pdfBuffer = await service.generateExaminationReport(examData);
      
      // Convert PDF to text for content verification
      const pdfText = await service.extractTextFromPDF(pdfBuffer);
      
      // Verify content
      expect(pdfText).toContain('EXAMINATION REPORT');
      expect(pdfText).toContain(examData.patientName);
      expect(pdfText).toContain(examData.diagnosis);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid prescription data', async () => {
      const invalidData = {
        // Missing required fields
        patientName: 'Test Patient'
      };

      await expect(
        service.generatePrescription(invalidData as any)
      ).rejects.toThrow();
    });

    it('should handle invalid examination data', async () => {
      const invalidData = {
        // Missing required fields
        patientName: 'Test Patient'
      };

      await expect(
        service.generateExaminationReport(invalidData as any)
      ).rejects.toThrow();
    });
  });
});