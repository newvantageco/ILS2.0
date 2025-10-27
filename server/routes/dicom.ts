import { Router } from 'express';
import multer from 'multer';
import DicomService from '../services/DicomService';
import { prisma } from '../db';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const dicomService = DicomService.getInstance();

// Upload DICOM data from equipment
router.post(
  '/api/examinations/:examinationId/dicom',
  authenticateUser,
  requireRole(['ecp']),
  upload.single('dicomFile'),
  async (req, res) => {
    try {
      const { examinationId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No DICOM file provided' });
      }

      // Parse DICOM data
      const dicomReading = await dicomService.parseDicomData(req.file.buffer);

      // Validate the reading
      if (!dicomService.validateReading(dicomReading)) {
        return res.status(400).json({ error: 'Invalid DICOM data format' });
      }

      // Store the reading
      await dicomService.storeReading(examinationId, dicomReading);

      // Update examination status
      await prisma.eyeExamination.update({
        where: { id: examinationId },
        data: {
          updatedAt: new Date()
        }
      });

      res.status(200).json({
        message: 'DICOM data processed successfully',
        readingId: dicomReading.imageInstanceUID
      });
    } catch (error) {
      console.error('Error processing DICOM data:', error);
      res.status(500).json({ error: 'Failed to process DICOM data' });
    }
  }
);

// Get DICOM readings for an examination
router.get(
  '/api/examinations/:examinationId/dicom',
  authenticateUser,
  requireRole(['ecp', 'lab_tech']),
  async (req, res) => {
    try {
      const { examinationId } = req.params;

      const examination = await prisma.eyeExamination.findUnique({
        where: { id: examinationId },
        select: { equipmentReadings: true }
      });

      if (!examination) {
        return res.status(404).json({ error: 'Examination not found' });
      }

      res.status(200).json(examination.equipmentReadings);
    } catch (error) {
      console.error('Error fetching DICOM readings:', error);
      res.status(500).json({ error: 'Failed to fetch DICOM readings' });
    }
  }
);

export default router;