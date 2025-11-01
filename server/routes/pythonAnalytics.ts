import { Router, Request, Response } from 'express';
import {
  checkPythonServiceHealth,
  getOrderTrends,
  predictProductionTime,
  analyzeQualityControl,
  generateBatchReport,
  recommendLens
} from '../services/pythonService';

const router = Router();

// Health check for Python service
router.get('/api/python/health', async (req: Request, res: Response) => {
  try {
    const health = await checkPythonServiceHealth();
    res.json(health);
  } catch (error: any) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Python service unavailable',
      error: error.message 
    });
  }
});

// Analytics endpoint that calls Python service
router.get('/api/analytics/trends', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trends = await getOrderTrends(days);
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to fetch analytics trends',
      message: error.message 
    });
  }
});

// Production time prediction
router.post('/api/orders/predict-time', async (req: Request, res: Response) => {
  try {
    const { lensType, lensMaterial, coating, complexityScore } = req.body;
    
    if (!lensType || !lensMaterial || !coating) {
      return res.status(400).json({ 
        error: 'Missing required fields: lensType, lensMaterial, coating' 
      });
    }
    
    const prediction = await predictProductionTime({
      lensType,
      lensMaterial,
      coating,
      complexityScore
    });
    
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to predict production time',
      message: error.message 
    });
  }
});

// QC analysis
router.post('/api/qc/analyze', async (req: Request, res: Response) => {
  try {
    const { orderId, measurements, images } = req.body;
    
    if (!orderId || !measurements) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, measurements' 
      });
    }
    
    const analysis = await analyzeQualityControl({
      orderId,
      measurements,
      images
    });
    
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to analyze quality control',
      message: error.message 
    });
  }
});

// Batch report generation
router.post('/api/analytics/batch-report', async (req: Request, res: Response) => {
  try {
    const { orderIds } = req.body;
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ 
        error: 'orderIds must be a non-empty array' 
      });
    }
    
    const report = await generateBatchReport(orderIds);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to generate batch report',
      message: error.message 
    });
  }
});

// Lens recommendation
router.post('/api/ml/recommend-lens', async (req: Request, res: Response) => {
  try {
    const { prescription, patientAge, lifestyle, budget } = req.body;
    
    if (!prescription) {
      return res.status(400).json({ 
        error: 'prescription is required' 
      });
    }
    
    const recommendation = await recommendLens({
      prescription,
      patientAge,
      lifestyle,
      budget
    });
    
    res.json(recommendation);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to get lens recommendation',
      message: error.message 
    });
  }
});

export default router;
