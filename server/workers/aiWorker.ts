import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../queue/config';
import { db } from '../../db';
import { users, companies } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * AI Job Data Types
 */
interface DailyBriefingJobData {
  type: 'daily-briefing';
  companyId: string;
  date: string;
  userIds?: string[]; // Optional: specific users to notify
}

interface DemandForecastJobData {
  type: 'demand-forecast';
  companyId: string;
  productIds?: string[];
  forecastDays: number;
}

interface AnomalyDetectionJobData {
  type: 'anomaly-detection';
  companyId: string;
  metricType: 'revenue' | 'inventory' | 'orders' | 'patients';
  timeRange: 'daily' | 'weekly' | 'monthly';
}

interface InsightGenerationJobData {
  type: 'insight-generation';
  companyId: string;
  insightType: 'revenue' | 'inventory' | 'patient-care' | 'operations';
  periodStart: string;
  periodEnd: string;
}

interface ChatResponseJobData {
  type: 'chat-response';
  userId: string;
  companyId: string;
  conversationId: string;
  message: string;
}

type AIJobData = 
  | DailyBriefingJobData
  | DemandForecastJobData
  | AnomalyDetectionJobData
  | InsightGenerationJobData
  | ChatResponseJobData;

/**
 * AI Worker
 * Processes AI tasks from the AI queue
 */
export function createAIWorker() {
  const connection = getRedisConnection();
  
  if (!connection) {
    console.warn('⚠️  AI worker not started - Redis not available');
    return null;
  }

  const worker = new Worker<AIJobData>(
    'ai-processing',
    async (job: Job<AIJobData>) => {
      console.log(`🤖 Processing AI job ${job.id}: ${job.data.type}`);
      
      try {
        let result;
        
        switch (job.data.type) {
          case 'daily-briefing':
            result = await processDailyBriefing(job.data);
            break;
          
          case 'demand-forecast':
            result = await processDemandForecast(job.data);
            break;
          
          case 'anomaly-detection':
            result = await processAnomalyDetection(job.data);
            break;
          
          case 'insight-generation':
            result = await processInsightGeneration(job.data);
            break;
          
          case 'chat-response':
            result = await processChatResponse(job.data);
            break;
          
          default:
            throw new Error(`Unknown AI job type: ${(job.data as any).type}`);
        }
        
        console.log(`✅ AI job ${job.id} completed successfully`);
        return { success: true, result, completedAt: new Date().toISOString() };
      } catch (error) {
        console.error(`❌ AI job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 2, // AI tasks are expensive, limit concurrency
      lockDuration: 120000, // 2-minute timeout for AI operations
      limiter: {
        max: 10, // Max 10 AI jobs
        duration: 60000, // Per minute
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    console.log(`✅ AI job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ AI job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('AI worker error:', err);
  });

  console.log('✅ AI worker started');
  return worker;
}

/**
 * Process daily briefing generation
 */
async function processDailyBriefing(data: DailyBriefingJobData): Promise<any> {
  const { companyId, date, userIds } = data;
  
  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  console.log(`📊 Generating daily briefing for ${company.name} on ${date}`);

  // TODO: Implement actual AI briefing generation
  // For now, return placeholder data
  const briefing = {
    date,
    companyId,
    companyName: company.name,
    summary: 'Daily operations are running smoothly. Key metrics are within expected ranges.',
    highlights: [
      'Revenue trending above average',
      'Inventory levels optimal',
      'No critical alerts',
    ],
    recommendations: [
      'Consider restocking popular lens types',
      'Follow up with pending orders',
    ],
    metrics: {
      ordersToday: 0, // TODO: Query actual data
      revenueToday: 0,
      patientsToday: 0,
    },
  };

  // TODO: Store briefing in database
  // await db.insert(aiNotifications).values({
  //   companyId,
  //   type: 'daily_briefing',
  //   date,
  //   title: `Daily Briefing - ${date}`,
  //   content: JSON.stringify(briefing),
  // });

  console.log(`✅ Daily briefing generated for ${company.name}`);
  return briefing;
}

/**
 * Process demand forecast
 */
async function processDemandForecast(data: DemandForecastJobData): Promise<any> {
  const { companyId, productIds, forecastDays } = data;
  
  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  console.log(`📈 Generating ${forecastDays}-day demand forecast for ${company.name}`);

  // TODO: Implement actual demand forecasting with AI
  const forecast = {
    companyId,
    companyName: company.name,
    forecastDays,
    generatedAt: new Date().toISOString(),
    predictions: [
      {
        productId: 'sample-product',
        productName: 'Sample Lens',
        currentStock: 100,
        predictedDemand: 150,
        recommendation: 'Order 50 units',
        confidence: 0.85,
      },
    ],
    summary: `Forecast generated for ${forecastDays} days ahead`,
  };

  // TODO: Store forecast in database
  console.log(`✅ Demand forecast generated for ${company.name}`);
  return forecast;
}

/**
 * Process anomaly detection
 */
async function processAnomalyDetection(data: AnomalyDetectionJobData): Promise<any> {
  const { companyId, metricType, timeRange } = data;
  
  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  console.log(`🔍 Running anomaly detection for ${company.name}: ${metricType} (${timeRange})`);

  // TODO: Implement actual anomaly detection with AI
  const results = {
    companyId,
    companyName: company.name,
    metricType,
    timeRange,
    anomaliesDetected: [],
    summary: 'No significant anomalies detected',
    checkedAt: new Date().toISOString(),
  };

  console.log(`✅ Anomaly detection completed for ${company.name}`);
  return results;
}

/**
 * Process insight generation
 */
async function processInsightGeneration(data: InsightGenerationJobData): Promise<any> {
  const { companyId, insightType, periodStart, periodEnd } = data;
  
  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  console.log(`💡 Generating ${insightType} insights for ${company.name}`);
  console.log(`   Period: ${periodStart} to ${periodEnd}`);

  // TODO: Implement actual insight generation with AI
  const insights = {
    companyId,
    companyName: company.name,
    insightType,
    periodStart,
    periodEnd,
    insights: [
      {
        title: 'Sample Insight',
        description: 'This is a placeholder insight',
        priority: 'medium',
        actionable: true,
        recommendation: 'Consider implementing this suggestion',
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  console.log(`✅ Insights generated for ${company.name}`);
  return insights;
}

/**
 * Process chat response (AI assistant)
 */
async function processChatResponse(data: ChatResponseJobData): Promise<any> {
  const { userId, companyId, conversationId, message } = data;
  
  // Get user and company details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!user || !company) {
    throw new Error('User or company not found');
  }

  console.log(`💬 Processing chat response for ${user.email} (${company.name})`);
  console.log(`   Message: ${message.substring(0, 50)}...`);

  // TODO: Implement actual AI chat response
  const response = {
    conversationId,
    userId,
    companyId,
    message: message,
    response: 'This is a placeholder AI response. The actual AI assistant integration is pending.',
    timestamp: new Date().toISOString(),
  };

  console.log(`✅ Chat response generated`);
  return response;
}

/**
 * Fallback: Process AI job immediately if queue not available
 */
export async function processAIImmediate(data: AIJobData): Promise<any> {
  console.log(`⚠️  [FALLBACK] Processing AI job immediately: ${data.type}`);
  
  switch (data.type) {
    case 'daily-briefing':
      return await processDailyBriefing(data);
    case 'demand-forecast':
      return await processDemandForecast(data);
    case 'anomaly-detection':
      return await processAnomalyDetection(data);
    case 'insight-generation':
      return await processInsightGeneration(data);
    case 'chat-response':
      return await processChatResponse(data);
    default:
      throw new Error(`Unknown AI job type: ${(data as any).type}`);
  }
}

// Start worker if Redis is available
export const aiWorker = createAIWorker();
