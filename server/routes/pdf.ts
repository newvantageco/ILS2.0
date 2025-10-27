import { Router } from 'express';
import { authenticateUser, requireRole } from '../middleware/auth';
import PDFGenerationService from '../services/PDFGenerationService';

const router = Router();
const pdfService = PDFGenerationService.getInstance();

// Generate prescription PDF
router.get(
  '/api/prescriptions/:examinationId/pdf',
  authenticateUser,
  requireRole(['ecp', 'lab_tech']),
  async (req, res) => {
    try {
      const { examinationId } = req.params;

      const pdf = await pdfService.generatePrescription({
        examinationId,
        patientId: req.query.patientId as string,
        ecpId: req.query.ecpId as string,
        prescription: {
          od: {
            sphere: req.query.odSphere as string,
            cylinder: req.query.odCylinder as string,
            axis: req.query.odAxis as string,
            add: req.query.odAdd as string,
          },
          os: {
            sphere: req.query.osSphere as string,
            cylinder: req.query.osCylinder as string,
            axis: req.query.osAxis as string,
            add: req.query.osAdd as string,
          },
          pd: req.query.pd as string,
          notes: req.query.notes as string,
        }
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=prescription_${examinationId}.pdf`);
      res.send(pdf);
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      res.status(500).json({ error: 'Failed to generate prescription PDF' });
    }
  }
);

// Generate examination report PDF
router.get(
  '/api/examinations/:examinationId/pdf',
  authenticateUser,
  requireRole(['ecp', 'lab_tech']),
  async (req, res) => {
    try {
      const { examinationId } = req.params;
      const options = {
        includeHeader: req.query.includeHeader === 'true',
        includeLogo: req.query.includeLogo === 'true',
        includeFooter: req.query.includeFooter === 'true',
        orientation: req.query.orientation as 'portrait' | 'landscape',
      };

      const pdf = await pdfService.generateExaminationReport(examinationId, options);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=examination_${examinationId}.pdf`);
      res.send(pdf);
    } catch (error) {
      console.error('Error generating examination report PDF:', error);
      res.status(500).json({ error: 'Failed to generate examination report PDF' });
    }
  }
);

export default router;