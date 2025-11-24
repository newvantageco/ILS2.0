import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Input validation middleware
const validatePrescriptionInput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { patientName, patientId, prescription, doctorName, licenseNumber } = req.body;
  if (!patientName || !patientId || !prescription || !doctorName || !licenseNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  next();
};

// Equipment routes
app.get('/api/equipment', (req, res) => {
  res.json([]);
});

app.get('/api/equipment/status', (req, res) => {
  res.json({ devices: [] });
});

// PDF routes
app.post('/api/pdf/prescription', validatePrescriptionInput, (req, res) => {
  res.type('application/pdf').send(Buffer.from(''));
});

app.post('/api/pdf/examination', (req, res) => {
  res.type('application/pdf').send(Buffer.from(''));
});

// Notification routes
app.get('/api/notifications', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json([]);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ status: 'success' });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export { app };