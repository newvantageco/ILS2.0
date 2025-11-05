import { emailQueue, pdfQueue, notificationQueue, aiQueue, isRedisAvailable } from '../queue/config';
import { sendEmailImmediate } from '../workers/emailWorker';
import { generatePDFImmediate } from '../workers/pdfWorker';
import { sendNotificationImmediate } from '../workers/notificationWorker';
import { processAIImmediate } from '../workers/aiWorker';

/**
 * Queue Helper Functions
 * Provides simple interface for adding jobs to queues with fallback to immediate execution
 */

/**
 * Email Queue Helpers
 */
export async function queueOrderConfirmationEmail(orderId: string, userId: string) {
  const data = { type: 'order-confirmation' as const, orderId, userId };
  
  if (isRedisAvailable() && emailQueue) {
    await emailQueue.add('order-confirmation', data, {
      priority: 1, // High priority
      attempts: 3,
    });
    console.log(`✅ Order confirmation email queued for order ${orderId}`);
  } else {
    await sendEmailImmediate(data);
  }
}

export async function queueOrderShipmentEmail(orderId: string, trackingNumber: string, carrier: string) {
  const data = { type: 'order-shipment' as const, orderId, trackingNumber, carrier };
  
  if (isRedisAvailable() && emailQueue) {
    await emailQueue.add('order-shipment', data, {
      priority: 2, // Medium priority
      attempts: 3,
    });
    console.log(`✅ Order shipment email queued for order ${orderId}`);
  } else {
    await sendEmailImmediate(data);
  }
}

export async function queueMarketplaceConnectionEmail(
  connectionId: number, 
  requesterCompanyId: string, 
  targetCompanyId: string
) {
  const data = { 
    type: 'marketplace-connection' as const, 
    connectionId, 
    requesterCompanyId, 
    targetCompanyId 
  };
  
  if (isRedisAvailable() && emailQueue) {
    await emailQueue.add('marketplace-connection', data, {
      priority: 3, // Lower priority
      attempts: 5,
    });
    console.log(`✅ Marketplace connection email queued for connection ${connectionId}`);
  } else {
    await sendEmailImmediate(data);
  }
}

export async function queueDailyBriefingEmail(userId: string, companyId: string, date: string) {
  const data = { type: 'daily-briefing' as const, userId, companyId, date };
  
  if (isRedisAvailable() && emailQueue) {
    await emailQueue.add('daily-briefing', data, {
      priority: 5, // Low priority
      attempts: 2,
    });
    console.log(`✅ Daily briefing email queued for user ${userId}`);
  } else {
    await sendEmailImmediate(data);
  }
}

export async function queueGenericEmail(to: string, subject: string, html: string, text?: string) {
  const data = { type: 'generic' as const, to, subject, html, text };
  
  if (isRedisAvailable() && emailQueue) {
    await emailQueue.add('generic', data, {
      priority: 3,
      attempts: 3,
    });
    console.log(`✅ Generic email queued to ${to}`);
  } else {
    await sendEmailImmediate(data);
  }
}

/**
 * PDF Queue Helpers
 */
export async function queueOrderSheetPDF(orderId: string): Promise<void> {
  const data = { type: 'order-sheet' as const, orderId };
  
  if (isRedisAvailable() && pdfQueue) {
    await pdfQueue.add('order-sheet', data, {
      priority: 2,
      attempts: 2,
    });
    console.log(`✅ Order sheet PDF queued for order ${orderId}`);
  } else {
    await generatePDFImmediate(data);
  }
}

export async function queueLabWorkTicketPDF(orderId: string): Promise<void> {
  const data = { type: 'lab-work-ticket' as const, orderId };
  
  if (isRedisAvailable() && pdfQueue) {
    await pdfQueue.add('lab-work-ticket', data, {
      priority: 1, // High priority
      attempts: 2,
    });
    console.log(`✅ Lab work ticket PDF queued for order ${orderId}`);
  } else {
    await generatePDFImmediate(data);
  }
}

export async function queueExaminationFormPDF(patientId: string, examinationId?: string): Promise<void> {
  const data = { type: 'examination-form' as const, patientId, examinationId };
  
  if (isRedisAvailable() && pdfQueue) {
    await pdfQueue.add('examination-form', data, {
      priority: 2,
      attempts: 2,
    });
    console.log(`✅ Examination form PDF queued for patient ${patientId}`);
  } else {
    await generatePDFImmediate(data);
  }
}

export async function queueInvoicePDF(orderId: string): Promise<void> {
  const data = { type: 'invoice' as const, orderId };
  
  if (isRedisAvailable() && pdfQueue) {
    await pdfQueue.add('invoice', data, {
      priority: 1, // High priority
      attempts: 2,
    });
    console.log(`✅ Invoice PDF queued for order ${orderId}`);
  } else {
    await generatePDFImmediate(data);
  }
}

export async function queueReceiptPDF(orderId: string): Promise<void> {
  const data = { type: 'receipt' as const, orderId };
  
  if (isRedisAvailable() && pdfQueue) {
    await pdfQueue.add('receipt', data, {
      priority: 3, // Lower priority
      attempts: 2,
    });
    console.log(`✅ Receipt PDF queued for order ${orderId}`);
  } else {
    await generatePDFImmediate(data);
  }
}

/**
 * Queue Statistics
 */
export async function getQueueStats() {
  if (!isRedisAvailable()) {
    return {
      redis: false,
      message: 'Redis not available - using immediate execution fallback',
    };
  }

  const stats: any = { redis: true };

  if (emailQueue) {
    const counts = await emailQueue.getJobCounts();
    stats.email = counts;
  }

  if (pdfQueue) {
    const counts = await pdfQueue.getJobCounts();
    stats.pdf = counts;
  }

  if (notificationQueue) {
    const counts = await notificationQueue.getJobCounts();
    stats.notification = counts;
  }

  if (aiQueue) {
    const counts = await aiQueue.getJobCounts();
    stats.ai = counts;
  }

  return stats;
}

/**
 * Notification Queue Helpers
 */
export async function queueSystemNotification(
  userId: string,
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  actionUrl?: string
) {
  const data = { type: 'system' as const, userId, title, message, priority, actionUrl };
  
  if (isRedisAvailable() && notificationQueue) {
    await notificationQueue.add('system-notification', data, {
      priority: priority === 'urgent' ? 1 : priority === 'high' ? 2 : priority === 'medium' ? 3 : 4,
      attempts: 5,
    });
    console.log(`✅ System notification queued for user ${userId}`);
  } else {
    await sendNotificationImmediate(data);
  }
}

export async function queueOrderNotification(userId: string, orderId: string, status: string, message: string) {
  const data = { type: 'order' as const, userId, orderId, status, message };
  
  if (isRedisAvailable() && notificationQueue) {
    await notificationQueue.add('order-notification', data, {
      priority: 2,
      attempts: 5,
    });
    console.log(`✅ Order notification queued for user ${userId}`);
  } else {
    await sendNotificationImmediate(data);
  }
}

export async function queueAIInsightNotification(
  userId: string,
  insightType: 'briefing' | 'forecast' | 'anomaly' | 'recommendation',
  title: string,
  summary: string,
  detailUrl?: string
) {
  const data = { type: 'ai-insight' as const, userId, insightType, title, summary, detailUrl };
  
  if (isRedisAvailable() && notificationQueue) {
    await notificationQueue.add('ai-insight-notification', data, {
      priority: 3,
      attempts: 3,
    });
    console.log(`✅ AI insight notification queued for user ${userId}`);
  } else {
    await sendNotificationImmediate(data);
  }
}

export async function queueMarketplaceNotification(
  userId: string,
  connectionId: number,
  action: 'request' | 'accepted' | 'rejected',
  companyName: string
) {
  const data = { type: 'marketplace' as const, userId, connectionId, action, companyName };
  
  if (isRedisAvailable() && notificationQueue) {
    await notificationQueue.add('marketplace-notification', data, {
      priority: 2,
      attempts: 3,
    });
    console.log(`✅ Marketplace notification queued for user ${userId}`);
  } else {
    await sendNotificationImmediate(data);
  }
}

/**
 * AI Queue Helpers
 */
export async function queueDailyBriefing(companyId: string, date: string, userIds?: string[]) {
  const data = { type: 'daily-briefing' as const, companyId, date, userIds };
  
  if (isRedisAvailable() && aiQueue) {
    await aiQueue.add('daily-briefing', data, {
      priority: 3,
      attempts: 2,
    });
    console.log(`✅ Daily briefing queued for company ${companyId}`);
  } else {
    await processAIImmediate(data);
  }
}

export async function queueDemandForecast(
  companyId: string,
  forecastDays: number = 30,
  productIds?: string[]
) {
  const data = { type: 'demand-forecast' as const, companyId, forecastDays, productIds };
  
  if (isRedisAvailable() && aiQueue) {
    await aiQueue.add('demand-forecast', data, {
      priority: 3,
      attempts: 2,
    });
    console.log(`✅ Demand forecast queued for company ${companyId}`);
  } else {
    await processAIImmediate(data);
  }
}

export async function queueAnomalyDetection(
  companyId: string,
  metricType: 'revenue' | 'inventory' | 'orders' | 'patients',
  timeRange: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const data = { type: 'anomaly-detection' as const, companyId, metricType, timeRange };
  
  if (isRedisAvailable() && aiQueue) {
    await aiQueue.add('anomaly-detection', data, {
      priority: 2,
      attempts: 2,
    });
    console.log(`✅ Anomaly detection queued for company ${companyId}`);
  } else {
    await processAIImmediate(data);
  }
}

export async function queueInsightGeneration(
  companyId: string,
  insightType: 'revenue' | 'inventory' | 'patient-care' | 'operations',
  periodStart: string,
  periodEnd: string
) {
  const data = { type: 'insight-generation' as const, companyId, insightType, periodStart, periodEnd };
  
  if (isRedisAvailable() && aiQueue) {
    await aiQueue.add('insight-generation', data, {
      priority: 3,
      attempts: 2,
    });
    console.log(`✅ Insight generation queued for company ${companyId}`);
  } else {
    await processAIImmediate(data);
  }
}

export async function queueChatResponse(
  userId: string,
  companyId: string,
  conversationId: string,
  message: string
) {
  const data = { type: 'chat-response' as const, userId, companyId, conversationId, message };
  
  if (isRedisAvailable() && aiQueue) {
    await aiQueue.add('chat-response', data, {
      priority: 1, // High priority for chat
      attempts: 2,
    });
    console.log(`✅ Chat response queued for user ${userId}`);
  } else {
    await processAIImmediate(data);
  }
}
