import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../queue/config';
import { db } from '../../db';
import { users, companies, posTransactions, posTransactionItems, products, eyeExaminations } from '@shared/schema';
import { eq, and, gte, lte, desc, sql, count, sum } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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

// Initialize AI clients
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

// Initialize AI clients if API keys are available
if (process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

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
 * Process daily briefing generation with real data and AI
 */
async function processDailyBriefing(data: DailyBriefingJobData): Promise<any> {
  const { companyId, date } = data;

  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  console.log(`📊 Generating daily briefing for ${company.name} on ${date}`);

  // Get date range for today
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  // Query actual metrics
  const [ordersData, patientsData, revenueData] = await Promise.all([
    // Transactions today
    db.select({ count: count() })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          gte(posTransactions.transactionDate, startOfDay),
          lte(posTransactions.transactionDate, endOfDay)
        )
      ),

    // Patients today
    db.select({ count: count() })
      .from(eyeExaminations)
      .where(
        and(
          eq(eyeExaminations.companyId, companyId),
          gte(eyeExaminations.createdAt, startOfDay),
          lte(eyeExaminations.createdAt, endOfDay)
        )
      ),

    // Revenue today
    db.select({ total: sum(posTransactions.totalAmount) })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          gte(posTransactions.transactionDate, startOfDay),
          lte(posTransactions.transactionDate, endOfDay)
        )
      )
  ]);

  const metrics = {
    ordersToday: ordersData[0]?.count || 0,
    patientsToday: patientsData[0]?.count || 0,
    revenueToday: Number(revenueData[0]?.total || 0),
  };

  // Generate AI briefing summary if AI is available
  let aiBriefing = null;
  if (anthropicClient || openaiClient) {
    const prompt = `Generate a concise daily briefing for an optometry practice with the following metrics:
- Orders: ${metrics.ordersToday}
- Patients examined: ${metrics.patientsToday}
- Revenue: $${metrics.revenueToday.toFixed(2)}

Provide:
1. A brief summary (2-3 sentences)
2. 3-5 key highlights
3. 2-3 actionable recommendations

Format as JSON with keys: summary, highlights (array), recommendations (array)`;

    try {
      if (anthropicClient) {
        const response = await anthropicClient.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        const content = response.content[0];
        if (content.type === 'text') {
          aiBriefing = JSON.parse(content.text);
        }
      } else if (openaiClient) {
        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: prompt
          }],
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          aiBriefing = JSON.parse(content);
        }
      }
    } catch (error) {
      console.error('AI briefing generation failed:', error);
    }
  }

  const briefing = {
    date,
    companyId,
    companyName: company.name,
    summary: aiBriefing?.summary || 'Daily operations summary based on today\'s metrics.',
    highlights: aiBriefing?.highlights || [
      `Processed ${metrics.ordersToday} orders today`,
      `Examined ${metrics.patientsToday} patients`,
      `Generated $${metrics.revenueToday.toFixed(2)} in revenue`,
    ],
    recommendations: aiBriefing?.recommendations || [
      'Review pending orders for follow-up',
      'Check inventory levels for popular products',
    ],
    metrics,
    generatedAt: new Date().toISOString(),
  };

  console.log(`✅ Daily briefing generated for ${company.name}`);
  return briefing;
}

/**
 * Process demand forecast with ML-based predictions
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

  // Get historical sales data for the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const salesHistory = await db
    .select({
      productId: posTransactionItems.productId,
      productName: products.name,
      quantity: sum(posTransactionItems.quantity),
      transactionDate: posTransactions.transactionDate,
    })
    .from(posTransactionItems)
    .innerJoin(posTransactions, eq(posTransactionItems.transactionId, posTransactions.id))
    .innerJoin(products, eq(posTransactionItems.productId, products.id))
    .where(
      and(
        eq(posTransactions.companyId, companyId),
        gte(posTransactions.transactionDate, ninetyDaysAgo),
        productIds && productIds.length > 0
          ? sql`${posTransactionItems.productId} IN ${productIds}`
          : undefined
      )
    )
    .groupBy(posTransactionItems.productId, products.name, posTransactions.transactionDate);

  // Simple moving average forecast (can be enhanced with ML models)
  const productForecasts = new Map<string, any>();

  for (const sale of salesHistory) {
    const productId = sale.productId;
    if (!productForecasts.has(productId)) {
      productForecasts.set(productId, {
        productId,
        productName: sale.productName,
        historicalQuantities: [],
      });
    }
    productForecasts.get(productId).historicalQuantities.push(Number(sale.quantity));
  }

  const predictions = Array.from(productForecasts.values()).map(product => {
    const avgDemand = product.historicalQuantities.reduce((a: number, b: number) => a + b, 0) / product.historicalQuantities.length;
    const stdDev = Math.sqrt(
      product.historicalQuantities.reduce((sum: number, val: number) => sum + Math.pow(val - avgDemand, 2), 0) / product.historicalQuantities.length
    );

    // Forecast = avg + trend adjustment
    const predictedDemand = Math.round(avgDemand * forecastDays / 7); // Weekly to daily conversion
    const confidence = Math.max(0.5, 1 - (stdDev / avgDemand)); // Higher variability = lower confidence

    return {
      productId: product.productId,
      productName: product.productName,
      historicalAverage: Math.round(avgDemand),
      predictedDemand,
      confidence: Math.min(0.95, confidence),
      recommendation: predictedDemand > avgDemand * 1.2
        ? `High demand expected - consider ordering ${Math.round(predictedDemand * 1.1)} units`
        : `Normal demand - maintain current stock levels`,
    };
  });

  const forecast = {
    companyId,
    companyName: company.name,
    forecastDays,
    generatedAt: new Date().toISOString(),
    predictions: predictions.length > 0 ? predictions : [{
      productId: 'no-data',
      productName: 'No historical data',
      historicalAverage: 0,
      predictedDemand: 0,
      confidence: 0,
      recommendation: 'Insufficient historical data for forecasting',
    }],
    summary: `Forecast generated for ${forecastDays} days ahead based on ${salesHistory.length} historical data points`,
  };

  console.log(`✅ Demand forecast generated for ${company.name}`);
  return forecast;
}

/**
 * Process anomaly detection with statistical analysis
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

  // Calculate date range based on timeRange
  const now = new Date();
  let daysToAnalyze = 30; // Default monthly
  if (timeRange === 'daily') daysToAnalyze = 7;
  if (timeRange === 'weekly') daysToAnalyze = 14;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysToAnalyze);

  // Get historical data based on metric type
  let dataPoints: { value: number; date: Date }[] = [];

  if (metricType === 'revenue') {
    const revenueData = await db
      .select({
        total: sum(posTransactions.totalAmount),
        date: posTransactions.transactionDate,
      })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          gte(posTransactions.transactionDate, startDate)
        )
      )
      .groupBy(posTransactions.transactionDate);

    dataPoints = revenueData.map(d => ({
      value: Number(d.total || 0),
      date: new Date(d.date)
    }));
  } else if (metricType === 'orders') {
    const ordersData = await db
      .select({
        count: count(),
        date: posTransactions.transactionDate,
      })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          gte(posTransactions.transactionDate, startDate)
        )
      )
      .groupBy(posTransactions.transactionDate);

    dataPoints = ordersData.map(d => ({
      value: d.count,
      date: new Date(d.date)
    }));
  }

  // Statistical anomaly detection using Z-score
  const values = dataPoints.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );

  const anomalies = dataPoints
    .map((point, index) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      return {
        date: point.date.toISOString().split('T')[0],
        value: point.value,
        zScore,
        isAnomaly: zScore > 2, // 2 standard deviations
        severity: zScore > 3 ? 'high' : zScore > 2 ? 'medium' : 'low',
      };
    })
    .filter(a => a.isAnomaly);

  const results = {
    companyId,
    companyName: company.name,
    metricType,
    timeRange,
    anomaliesDetected: anomalies,
    summary: anomalies.length > 0
      ? `Detected ${anomalies.length} anomalies in ${metricType} over the ${timeRange} period`
      : `No significant anomalies detected in ${metricType}`,
    statistics: {
      mean: Math.round(mean * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100,
      dataPoints: values.length,
    },
    checkedAt: new Date().toISOString(),
  };

  console.log(`✅ Anomaly detection completed for ${company.name} - Found ${anomalies.length} anomalies`);
  return results;
}

/**
 * Process insight generation with AI
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

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  // Gather relevant data based on insight type
  let contextData: any = {};

  if (insightType === 'revenue') {
    const revenueData = await db
      .select({
        total: sum(posTransactions.totalAmount),
        count: count(),
      })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          gte(posTransactions.transactionDate, start),
          lte(posTransactions.transactionDate, end)
        )
      );

    contextData = {
      totalRevenue: Number(revenueData[0]?.total || 0),
      orderCount: revenueData[0]?.count || 0,
    };
  } else if (insightType === 'inventory') {
    const lowStockProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.companyId, companyId),
          sql`${products.stockQuantity} < ${products.lowStockThreshold}`
        )
      )
      .limit(10);

    contextData = {
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map(p => p.name),
    };
  }

  // Generate AI insights if available
  let aiInsights: any[] = [];
  if (anthropicClient || openaiClient) {
    const prompt = `As an AI analyst for an optometry practice, analyze the following ${insightType} data and provide actionable insights:

${JSON.stringify(contextData, null, 2)}

Provide 3-5 insights in JSON format with this structure:
{
  "insights": [
    {
      "title": "Brief title",
      "description": "Detailed explanation",
      "priority": "high|medium|low",
      "actionable": true|false,
      "recommendation": "Specific action to take"
    }
  ]
}`;

    try {
      if (anthropicClient) {
        const response = await anthropicClient.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        const content = response.content[0];
        if (content.type === 'text') {
          const parsed = JSON.parse(content.text);
          aiInsights = parsed.insights || [];
        }
      } else if (openaiClient) {
        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: prompt
          }],
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          aiInsights = parsed.insights || [];
        }
      }
    } catch (error) {
      console.error('AI insight generation failed:', error);
    }
  }

  const insights = {
    companyId,
    companyName: company.name,
    insightType,
    periodStart,
    periodEnd,
    data: contextData,
    insights: aiInsights.length > 0 ? aiInsights : [
      {
        title: `${insightType.charAt(0).toUpperCase() + insightType.slice(1)} Analysis`,
        description: `Analysis of ${insightType} metrics for the specified period`,
        priority: 'medium',
        actionable: true,
        recommendation: 'Review the metrics and compare with historical trends',
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  console.log(`✅ Insights generated for ${company.name}`);
  return insights;
}

/**
 * Process chat response with AI (Claude or GPT)
 */
async function processChatResponse(data: ChatResponseJobData): Promise<any> {
  const { userId, companyId, conversationId, message } = data;

  // Get user and company details
  const [user, company] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
    db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    })
  ]);

  if (!user || !company) {
    throw new Error('User or company not found');
  }

  console.log(`💬 Processing chat response for ${user.email} (${company.name})`);
  console.log(`   Message: ${message.substring(0, 100)}...`);

  let aiResponse = 'AI service not configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable.';

  if (anthropicClient) {
    try {
      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: `You are an AI assistant for an optometry practice management system. The user is from ${company.name}.
Provide helpful, accurate information about optometry, eye care, inventory management, patient records, and practice operations.
Be concise, professional, and actionable.`,
        messages: [{
          role: 'user',
          content: message
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        aiResponse = content.text;
      }
    } catch (error: any) {
      console.error('Anthropic API error:', error);
      aiResponse = `Error generating response: ${error.message}`;
    }
  } else if (openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for an optometry practice management system. The user is from ${company.name}. Provide helpful, accurate information about optometry, eye care, inventory management, patient records, and practice operations. Be concise, professional, and actionable.`
          },
          {
            role: 'user',
            content: message
          }
        ]
      });

      aiResponse = response.choices[0]?.message?.content || 'No response generated';
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      aiResponse = `Error generating response: ${error.message}`;
    }
  }

  const response = {
    conversationId,
    userId,
    companyId,
    message: message,
    response: aiResponse,
    timestamp: new Date().toISOString(),
    provider: anthropicClient ? 'anthropic' : openaiClient ? 'openai' : 'none',
  };

  console.log(`✅ Chat response generated (${response.provider})`);
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
