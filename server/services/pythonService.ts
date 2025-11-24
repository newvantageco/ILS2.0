import axios from 'axios';
import logger from '../utils/logger';


const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Helper function to call Python service
async function callPythonService(endpoint: string, data?: any, method: 'GET' | 'POST' = 'GET') {
  try {
    const url = `${PYTHON_SERVICE_URL}${endpoint}`;
    const response = method === 'GET' 
      ? await axios.get(url, { params: data, timeout: 10000 })
      : await axios.post(url, data, { timeout: 10000 });
    return response.data;
  } catch (error: any) {
    logger.error(`Python service error (${endpoint}):`, error.message);
    
    // Check if service is unreachable
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Python analytics service is not running. Please start it with: cd python-service && python main.py');
    }
    
    throw new Error(`Failed to call Python analytics service: ${error.message}`);
  }
}

// Health check
export async function checkPythonServiceHealth() {
  try {
    return await callPythonService('/health', undefined, 'GET');
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message };
  }
}

// Example: Get order trends
export async function getOrderTrends(days: number = 30) {
  return callPythonService('/api/v1/analytics/order-trends', { days }, 'GET');
}

// Example: Predict production time
export async function predictProductionTime(orderData: {
  lensType: string;
  lensMaterial: string;
  coating: string;
  complexityScore?: number;
}) {
  return callPythonService('/api/v1/ml/predict-production-time', {
    lens_type: orderData.lensType,
    lens_material: orderData.lensMaterial,
    coating: orderData.coating,
    complexity_score: orderData.complexityScore || 1
  }, 'POST');
}

// Example: QC Analysis
export async function analyzeQualityControl(qcData: {
  orderId: string;
  measurements: Record<string, number>;
  images?: string[];
}) {
  return callPythonService('/api/v1/qc/analyze', {
    order_id: qcData.orderId,
    measurements: qcData.measurements,
    images: qcData.images
  }, 'POST');
}

// Batch report
export async function generateBatchReport(orderIds: string[]) {
  return callPythonService('/api/v1/analytics/batch-report', orderIds, 'POST');
}

// Lens recommendation
export async function recommendLens(requestData: {
  prescription: Record<string, number>;
  patientAge?: number;
  lifestyle?: string;
  budget?: string;
}) {
  return callPythonService('/api/v1/ml/recommend-lens', {
    prescription: requestData.prescription,
    patient_age: requestData.patientAge,
    lifestyle: requestData.lifestyle,
    budget: requestData.budget
  }, 'POST');
}
