import { Request, Response, NextFunction } from 'express';

export const validatePrescriptionInput = (req: Request, res: Response, next: NextFunction) => {
  const { patientName, patientId, prescription, doctorName, licenseNumber } = req.body;
  if (!patientName || !patientId || !prescription || !doctorName || !licenseNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  next();
};