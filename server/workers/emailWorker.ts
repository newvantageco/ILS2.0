import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../queue/config';
import { db } from '../../db';
import { users, companies, orders } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import logger from '../utils/logger';


/**
 * Email Job Data Types
 */
interface OrderConfirmationEmailData {
  type: 'order-confirmation';
  orderId: string;
  userId: string;
}

interface OrderShipmentEmailData {
  type: 'order-shipment';
  orderId: string;
  trackingNumber: string;
  carrier: string;
}

interface MarketplaceConnectionEmailData {
  type: 'marketplace-connection';
  connectionId: number;
  requesterCompanyId: string;
  targetCompanyId: string;
}

interface DailyBriefingEmailData {
  type: 'daily-briefing';
  userId: string;
  companyId: string;
  date: string;
}

interface GenericEmailData {
  type: 'generic';
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type EmailJobData = 
  | OrderConfirmationEmailData
  | OrderShipmentEmailData
  | MarketplaceConnectionEmailData
  | DailyBriefingEmailData
  | GenericEmailData;

/**
 * Email Worker
 * Processes email jobs from the email queue
 */
export function createEmailWorker() {
  const connection = getRedisConnection();
  
  if (!connection) {
    logger.warn('⚠️  Email worker not started - Redis not available');
    return null;
  }

  const worker = new Worker<EmailJobData>(
    'emails',
    async (job: Job<EmailJobData>) => {
      logger.info(`📧 Processing email job ${job.id}: ${job.data.type}`);
      
      try {
        switch (job.data.type) {
          case 'order-confirmation':
            await processOrderConfirmation(job.data);
            break;
          
          case 'order-shipment':
            await processOrderShipment(job.data);
            break;
          
          case 'marketplace-connection':
            await processMarketplaceConnection(job.data);
            break;
          
          case 'daily-briefing':
            await processDailyBriefing(job.data);
            break;
          
          case 'generic':
            await processGenericEmail(job.data);
            break;
          
          default:
            throw new Error(`Unknown email type: ${(job.data as any).type}`);
        }
        
        logger.info(`✅ Email job ${job.id} completed successfully`);
        return { success: true, sentAt: new Date().toISOString() };
      } catch (error) {
        logger.error(`❌ Email job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5, // Process up to 5 emails concurrently
      limiter: {
        max: 100, // Max 100 emails
        duration: 60000, // Per minute (rate limiting)
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info(`✅ Email job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Email job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error('Email worker error:', err);
  });

  logger.info('✅ Email worker started');
  return worker;
}

/**
 * Process order confirmation email
 */
async function processOrderConfirmation(data: OrderConfirmationEmailData): Promise<void> {
  const { orderId, userId } = data;
  
  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, order.companyId),
  });

  // Get user email
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.email) {
    throw new Error(`User ${userId} email not found`);
  }

  // Send order confirmation email
  const html = `
    <h2>Order Confirmation</h2>
    <p>Your order #${order.orderNumber} has been confirmed.</p>
    <p><strong>Company:</strong> ${company?.name || 'N/A'}</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <p>Thank you for your order!</p>
  `;

  await processGenericEmail({
    type: 'generic',
    to: user.email,
    subject: `Order Confirmation #${order.orderNumber}`,
    html,
  });
}

/**
 * Process order shipment notification
 */
async function processOrderShipment(data: OrderShipmentEmailData): Promise<void> {
  const { orderId, trackingNumber, carrier } = data;
  
  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, order.companyId),
  });

  // Get user email
  const user = await db.query.users.findFirst({
    where: eq(users.companyId, order.companyId),
  });

  if (!user?.email) {
    throw new Error(`User for company ${order.companyId} not found`);
  }

  // Send shipment notification
  const html = `
    <h2>Your Order Has Been Shipped! 🚚</h2>
    <p>Your order #${order.orderNumber} has been dispatched and is on its way.</p>
    <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
    <p><strong>Carrier:</strong> ${carrier}</p>
    <p>You can track your shipment using the tracking number above.</p>
  `;

  await processGenericEmail({
    type: 'generic',
    to: user.email,
    subject: `Order #${order.orderNumber} Shipped - ${company?.name || 'Order'}`,
    html,
  });
}

/**
 * Process marketplace connection request email
 */
async function processMarketplaceConnection(data: MarketplaceConnectionEmailData): Promise<void> {
  const { connectionId, requesterCompanyId, targetCompanyId } = data;
  
  // Get company details
  const requesterCompany = await db.query.companies.findFirst({
    where: eq(companies.id, requesterCompanyId),
  });

  const targetCompany = await db.query.companies.findFirst({
    where: eq(companies.id, targetCompanyId),
  });

  if (!requesterCompany || !targetCompany) {
    throw new Error('Company not found for connection request');
  }

  // Get target company admin email
  const targetUser = await db.query.users.findFirst({
    where: and(
      eq(users.companyId, targetCompanyId),
      eq(users.role, 'admin')
    ),
  });

  if (!targetUser?.email) {
    throw new Error(`Admin user for company ${targetCompanyId} not found`);
  }

  // Send connection request email
  const html = `
    <h2>New Marketplace Connection Request</h2>
    <p>${requesterCompany.name} would like to connect with ${targetCompany.name} on the IntegratedLens Marketplace.</p>
    <p>Log in to your account to review and respond to this request.</p>
    <p><a href="${process.env.VITE_BASE_URL || 'http://localhost:5000'}/marketplace/connections">View Connection Request</a></p>
  `;

  await processGenericEmail({
    type: 'generic',
    to: targetUser.email,
    subject: `New Connection Request from ${requesterCompany.name}`,
    html,
  });
}

/**
 * Process daily briefing email
 */
async function processDailyBriefing(data: DailyBriefingEmailData): Promise<void> {
  const { userId, companyId, date } = data;
  
  // Get user
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.email) {
    throw new Error(`User ${userId} not found`);
  }

  // Get company
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  // For now, send a placeholder briefing
  // In production, this would fetch the actual AI-generated briefing
  const html = `
    <h2>Daily Briefing - ${new Date(date).toLocaleDateString()}</h2>
    <h3>${company.name}</h3>
    <div>
      <p>Your daily briefing will be available soon.</p>
      <p>This feature is currently being developed.</p>
    </div>
    <hr />
    <p><em>This is an automated briefing generated by IntegratedLens AI.</em></p>
  `;

  await processGenericEmail({
    type: 'generic',
    to: user.email,
    subject: `Daily Briefing - ${company.name} - ${new Date(date).toLocaleDateString()}`,
    html,
  });
}

/**
 * Process generic email
 */
async function processGenericEmail(data: GenericEmailData): Promise<void> {
  const { to, subject, html, text } = data;
  
  // Use Resend to send email
  const Resend = (await import('resend')).Resend;
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'IntegratedLens <noreply@integratedlens.com>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  });
}

/**
 * Fallback: Execute email immediately if queue not available
 */
export async function sendEmailImmediate(data: EmailJobData): Promise<void> {
  logger.info(`⚠️  [FALLBACK] Sending email immediately: ${data.type}`);
  
  switch (data.type) {
    case 'order-confirmation':
      await processOrderConfirmation(data);
      break;
    case 'order-shipment':
      await processOrderShipment(data);
      break;
    case 'marketplace-connection':
      await processMarketplaceConnection(data);
      break;
    case 'daily-briefing':
      await processDailyBriefing(data);
      break;
    case 'generic':
      await processGenericEmail(data);
      break;
    default:
      throw new Error(`Unknown email type: ${(data as any).type}`);
  }
}

// Export the factory function - worker is initialized after Redis connects
// Do NOT auto-create at import time to avoid boot order issues
export { createEmailWorker };
