import { Router } from "express";
import { createLogger } from "../utils/logger";
import { storage } from "../storage";
import { db } from "../db";

const router = Router();
const logger = createLogger('verification');

// Service health check endpoints
const SERVICES = {
  // Core services
  main: { url: process.env.APP_URL || 'http://localhost:5000', name: 'Main Platform' },
  database: { url: process.env.DATABASE_URL, name: 'PostgreSQL Database' },
  redis: { url: process.env.REDIS_URL, name: 'Redis Cache' },
  
  // AI/ML services
  aiService: { url: process.env.AI_SERVICE_URL || 'http://localhost:8080', name: 'AI Service (FastAPI)' },
  pythonService: { url: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000', name: 'Python Analytics Service' },
  
  // External APIs
  openai: { url: 'https://api.openai.com/v1/models', name: 'OpenAI API', key: process.env.OPENAI_API_KEY },
  anthropic: { url: 'https://api.anthropic.com/v1/messages', name: 'Anthropic API', key: process.env.ANTHROPIC_API_KEY },
  
  // Storage
  awsS3: { 
    url: `https://s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`, 
    name: 'AWS S3 Storage',
    key: process.env.AWS_ACCESS_KEY_ID
  },
  
  // Email
  resend: { url: 'https://api.resend.com/domains', name: 'Resend Email', key: process.env.RESEND_API_KEY },
};

// Shopify integration endpoints
const SHOPIFY_ENDPOINTS = [
  '/api/shopify/config',
  '/api/shopify/stores',
  '/api/shopify/products',
  '/api/shopify/orders',
  '/api/shopify/webhooks',
  '/api/shopify/prescriptions/upload',
  '/api/shopify/analytics/dashboard'
];

// AI/ML endpoints
const AI_ML_ENDPOINTS = [
  '/api/ai/chat',
  '/api/ai/usage',
  '/api/ai-ml/ml/models',
  '/api/ai-ml/ml/deployments',
  '/api/ai-ml/ml/prediction-stats',
  '/api/ai-ml/ml/predict',
  '/api/ai-ml/ml/bootstrap'
];

// Core platform endpoints
const CORE_ENDPOINTS = [
  '/api/health',
  '/api/companies',
  '/api/users',
  '/api/patients',
  '/api/prescriptions',
  '/api/orders',
  '/api/inventory'
];

async function checkHttpService(url: string, apiKey?: string): Promise<{
  status: 'healthy' | 'unhealthy' | 'error';
  responseTime?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ILS-2.0-Verification/1.0'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkDatabase(): Promise<{
  status: 'healthy' | 'unhealthy' | 'error';
  connectionCount?: number;
  error?: string;
}> {
  try {
    // Test database connection with a simple query
    const result = await db.execute('SELECT 1 as test');
    const connectionCount = Array.isArray(result) ? result.length : (result.rows?.length || 0);
    
    return {
      status: 'healthy',
      connectionCount
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkTables(): Promise<{
  total: number;
  existing: string[];
  missing: string[];
  critical: string[];
}> {
  const criticalTables = [
    'companies',
    'users', 
    'ai_model_versions',
    'ai_model_deployments',
    'shopify_stores',
    'shopify_orders',
    'prescriptions',
    'prescription_uploads'
  ];
  
  try {
    // Check if critical tables exist
    const existing: string[] = [];
    const missing: string[] = [];
    
    for (const table of criticalTables) {
      try {
        await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        existing.push(table);
      } catch {
        missing.push(table);
      }
    }
    
    // Get total table count
    const allTables = await db.execute(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    return {
      total: Array.isArray(allTables) ? allTables.length : (allTables.rows?.length || 0),
      existing,
      missing,
      critical: missing.filter(t => criticalTables.includes(t))
    };
  } catch (error) {
    return {
      total: 0,
      existing: [],
      missing: criticalTables,
      critical: criticalTables
    };
  }
}

// GET /api/verification/status
router.get("/status", async (req, res) => {
  logger.info("Comprehensive service verification requested");
  
  const results: any = {
    timestamp: new Date().toISOString(),
    services: {},
    endpoints: {},
    database: {},
    summary: {
      total: 0,
      healthy: 0,
      unhealthy: 0,
      errors: 0
    }
  };
  
  // Check external services
  for (const [key, service] of Object.entries(SERVICES)) {
    if (!service.url) {
      results.services[key] = {
        name: service.name,
        status: 'error',
        error: 'URL not configured'
      };
      results.summary.errors++;
      results.summary.total++;
      continue;
    }
    
    const serviceKey = service as any;
    const check = await checkHttpService(service.url, serviceKey?.key);
    results.services[key] = {
      name: service.name,
      url: service.url.replace(/\/\/[^@]*@/, '//***:***@'), // Hide credentials
      ...check
    };
    
    results.summary[check.status]++;
    results.summary.total++;
  }
  
  // Check database specifically
  const dbCheck = await checkDatabase();
  results.database.connection = dbCheck;
  
  // Check database tables
  const tableCheck = await checkTables();
  results.database.tables = tableCheck;
  
  // Check platform endpoints
  for (const endpoint of CORE_ENDPOINTS) {
    try {
      const response = await fetch(`${process.env.APP_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      results.endpoints[endpoint] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status
      };
      
      results.summary[response.ok ? 'healthy' : 'unhealthy']++;
      results.summary.total++;
    } catch (error) {
      results.endpoints[endpoint] = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Endpoint unavailable'
      };
      results.summary.errors++;
      results.summary.total++;
    }
  }
  
  // Check AI/ML endpoints
  results.endpoints.ai_ml = {};
  for (const endpoint of AI_ML_ENDPOINTS) {
    try {
      const response = await fetch(`${process.env.APP_URL || 'http://localhost:5000'}${endpoint}`, {
        method: endpoint.includes('predict') || endpoint.includes('bootstrap') ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      results.endpoints.ai_ml[endpoint] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status
      };
      
      results.summary[response.ok ? 'healthy' : 'unhealthy']++;
      results.summary.total++;
    } catch (error) {
      results.endpoints.ai_ml[endpoint] = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Endpoint unavailable'
      };
      results.summary.errors++;
      results.summary.total++;
    }
  }
  
  // Check Shopify endpoints
  results.endpoints.shopify = {};
  for (const endpoint of SHOPIFY_ENDPOINTS) {
    try {
      const response = await fetch(`${process.env.APP_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      results.endpoints.shopify[endpoint] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status
      };
      
      results.summary[response.ok ? 'healthy' : 'unhealthy']++;
      results.summary.total++;
    } catch (error) {
      results.endpoints.shopify[endpoint] = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Endpoint unavailable'
      };
      results.summary.errors++;
      results.summary.total++;
    }
  }
  
  // Calculate overall health
  const healthPercentage = results.summary.total > 0 
    ? Math.round((results.summary.healthy / results.summary.total) * 100)
    : 0;
  
  results.overall = {
    status: healthPercentage >= 90 ? 'healthy' : healthPercentage >= 70 ? 'degraded' : 'unhealthy',
    healthPercentage,
    recommendation: healthPercentage >= 90 
      ? 'All systems operational'
      : healthPercentage >= 70
      ? 'Some services need attention'
      : 'Critical issues require immediate attention'
  };
  
  logger.info("Service verification completed" as any, {
    total: results.summary.total,
    healthy: results.summary.healthy,
    healthPercentage
  } as any);
  
  res.json(results);
});

// GET /api/verification/quick
router.get("/quick", async (req, res) => {
  // Quick health check for critical services only
  const critical = [
    'main',
    'database',
    'aiService',
    'openai'
  ];
  
  const results: any = {};
  
  for (const serviceKey of critical) {
    const service = SERVICES[serviceKey as keyof typeof SERVICES];
    if (service?.url) {
      const serviceObj = service as any;
      const check = await checkHttpService(service.url, serviceObj?.key);
      results[serviceKey] = {
        name: service.name,
        status: check.status,
        responseTime: check.responseTime
      };
    } else {
      results[serviceKey] = {
        name: service?.name || serviceKey,
        status: 'error',
        error: 'Not configured'
      };
    }
  }
  
  const allHealthy = Object.values(results).every((r: any) => r.status === 'healthy');
  
  res.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: results
  });
});

// GET /api/verification/shopify
router.get("/shopify", async (req, res) => {
  // Specific Shopify integration verification
  const results: any = {
    endpoints: {},
    webhooks: {},
    configuration: {},
    summary: { total: 0, working: 0, failed: 0 }
  };
  
  // Check Shopify API endpoints
  for (const endpoint of SHOPIFY_ENDPOINTS) {
    try {
      const response = await fetch(`${process.env.APP_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      results.endpoints[endpoint] = {
        status: response.ok ? 'working' : 'failed',
        statusCode: response.status,
        requiresAuth: response.status === 401
      };
      
      results.summary[response.ok ? 'working' : 'failed']++;
      results.summary.total++;
    } catch (error) {
      results.endpoints[endpoint] = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Endpoint unavailable'
      };
      results.summary.failed++;
      results.summary.total++;
    }
  }
  
  // Check Shopify configuration
  results.configuration = {
    shopifyWebhookUrl: !!process.env.SHOPIFY_WEBHOOK_URL,
    encryptionKey: !!process.env.ENCRYPTION_KEY,
    appUrl: !!process.env.APP_URL
  };
  
  results.overall = {
    status: results.summary.failed === 0 ? 'operational' : 'issues_detected',
    endpointsWorking: results.summary.working,
    endpointsTotal: results.summary.total
  };
  
  res.json(results);
});

// GET /api/verification/ai-ml
router.get("/ai-ml", async (req, res) => {
  // Specific AI/ML service verification
  const results: any = {
    services: {},
    endpoints: {},
    models: {},
    summary: { total: 0, working: 0, failed: 0 }
  };
  
  // Check AI services
  const aiServices = ['aiService', 'pythonService', 'openai', 'anthropic'];
  
  for (const serviceKey of aiServices) {
    const service = SERVICES[serviceKey as keyof typeof SERVICES];
    if (service?.url) {
      const serviceObj = service as any;
      const check = await checkHttpService(service.url, serviceObj?.key);
      results.services[serviceKey] = {
        name: service.name,
        status: check.status === 'healthy' ? 'working' : 'failed',
        responseTime: check.responseTime,
        error: check.error
      };
      
      results.summary[check.status === 'healthy' ? 'working' : 'failed']++;
      results.summary.total++;
    }
  }
  
  // Check AI/ML endpoints
  for (const endpoint of AI_ML_ENDPOINTS) {
    try {
      const response = await fetch(`${process.env.APP_URL || 'http://localhost:5000'}${endpoint}`, {
        method: endpoint.includes('predict') || endpoint.includes('bootstrap') ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      results.endpoints[endpoint] = {
        status: response.ok ? 'working' : 'failed',
        statusCode: response.status,
        requiresAuth: response.status === 401
      };
      
      results.summary[response.ok ? 'working' : 'failed']++;
      results.summary.total++;
    } catch (error) {
      results.endpoints[endpoint] = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Endpoint unavailable'
      };
      results.summary.failed++;
      results.summary.total++;
    }
  }
  
  // Check ML models in database
  try {
    const models = await storage.getAIModelVersions('default', {});
    results.models = {
      total: models.length,
      active: models.filter(m => m.status === 'active').length,
      types: Array.from(new Set(models.map(m => m.modelType)))
    };
  } catch (error) {
    results.models = {
      error: 'Failed to query models',
      total: 0
    };
  }
  
  results.overall = {
    status: results.summary.failed === 0 ? 'operational' : 'issues_detected',
    servicesWorking: results.summary.working,
    servicesTotal: results.summary.total
  };
  
  res.json(results);
});

export default router;
