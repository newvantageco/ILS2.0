import express, { Request, Response } from 'express';
import { RemoteMonitoringService } from '../services/mhealth/RemoteMonitoringService';
import { PatientEngagementService } from '../services/mhealth/PatientEngagementService';
import { DeviceIntegrationService } from '../services/mhealth/DeviceIntegrationService';

const router = express.Router();

// Remote Monitoring Routes
router.post('/monitoring/programs', async (req: Request, res: Response) => {
  try {
    const program = RemoteMonitoringService.createProgram(req.body);
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/monitoring/enroll', async (req: Request, res: Response) => {
  try {
    const { patientId, programId } = req.body;
    const monitoring = RemoteMonitoringService.enrollPatient(patientId, programId);
    res.status(201).json({ success: true, data: monitoring });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/monitoring/readings', async (req: Request, res: Response) => {
  try {
    const reading = RemoteMonitoringService.recordReading(req.body);
    res.status(201).json({ success: true, data: reading });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/monitoring/readings/:patientId', async (req: Request, res: Response) => {
  try {
    const readings = RemoteMonitoringService.getReadings(req.params.patientId);
    res.json({ success: true, data: readings, count: readings.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/monitoring/alerts', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query;
    const alerts = RemoteMonitoringService.getActiveAlerts(patientId as string);
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

// Patient Engagement Routes
router.post('/engagement/reminders', async (req: Request, res: Response) => {
  try {
    const reminder = PatientEngagementService.createReminder(req.body);
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/engagement/reminders/:patientId', async (req: Request, res: Response) => {
  try {
    const reminders = PatientEngagementService.getReminders(req.params.patientId);
    res.json({ success: true, data: reminders, count: reminders.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/engagement/content', async (req: Request, res: Response) => {
  try {
    const content = PatientEngagementService.createContent(req.body);
    res.status(201).json({ success: true, data: content });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/engagement/content', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const content = PatientEngagementService.getContent(category as string);
    res.json({ success: true, data: content, count: content.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/engagement/messages', async (req: Request, res: Response) => {
  try {
    const message = PatientEngagementService.sendMessage(req.body);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/engagement/messages/:patientId', async (req: Request, res: Response) => {
  try {
    const messages = PatientEngagementService.getMessages(req.params.patientId);
    res.json({ success: true, data: messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/engagement/surveys', async (req: Request, res: Response) => {
  try {
    const survey = PatientEngagementService.submitSurvey(req.body);
    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

// Device Integration Routes
router.post('/devices', async (req: Request, res: Response) => {
  try {
    const device = DeviceIntegrationService.registerDevice(req.body);
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.put('/devices/:deviceId/assign', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;
    const device = DeviceIntegrationService.assignDevice(req.params.deviceId, patientId);
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/devices/sync', async (req: Request, res: Response) => {
  try {
    const reading = DeviceIntegrationService.syncDeviceData(req.body);
    res.status(201).json({ success: true, data: reading });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/devices/:deviceId/readings', async (req: Request, res: Response) => {
  try {
    const { startDate } = req.query;
    const readings = DeviceIntegrationService.getDeviceReadings(
      req.params.deviceId,
      startDate ? new Date(startDate as string) : undefined
    );
    res.json({ success: true, data: readings, count: readings.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/devices/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const devices = DeviceIntegrationService.getPatientDevices(req.params.patientId);
    res.json({ success: true, data: devices, count: devices.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/devices/wearable', async (req: Request, res: Response) => {
  try {
    const data = DeviceIntegrationService.recordWearableData(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/devices/wearable/:patientId', async (req: Request, res: Response) => {
  try {
    const { dataType } = req.query;
    const data = DeviceIntegrationService.getWearableData(req.params.patientId, dataType as string);
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

// Statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = {
      monitoring: RemoteMonitoringService.getStatistics(),
      engagement: PatientEngagementService.getStatistics(),
      devices: DeviceIntegrationService.getStatistics()
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;
