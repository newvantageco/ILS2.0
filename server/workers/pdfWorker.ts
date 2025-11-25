import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../queue/config';
import { db } from '../../db';
import { orders } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';


/**
 * PDF Job Data Types
 */
interface OrderSheetPDFData {
  type: 'order-sheet';
  orderId: string;
}

interface LabWorkTicketPDFData {
  type: 'lab-work-ticket';
  orderId: string;
}

interface ExaminationFormPDFData {
  type: 'examination-form';
  patientId: string;
  examinationId?: string;
}

interface InvoicePDFData {
  type: 'invoice';
  orderId: string;
}

interface ReceiptPDFData {
  type: 'receipt';
  orderId: string;
}

type PDFJobData = 
  | OrderSheetPDFData
  | LabWorkTicketPDFData
  | ExaminationFormPDFData
  | InvoicePDFData
  | ReceiptPDFData;

/**
 * PDF Worker
 * Processes PDF generation jobs from the PDF queue
 */
export function createPDFWorker() {
  const connection = getRedisConnection();
  
  if (!connection) {
    logger.warn('⚠️  PDF worker not started - Redis not available');
    return null;
  }

  const worker = new Worker<PDFJobData>(
    'pdfs',
    async (job: Job<PDFJobData>) => {
      logger.info(`📄 Processing PDF job ${job.id}: ${job.data.type}`);
      
      try {
        let pdfPath: string;
        
        switch (job.data.type) {
          case 'order-sheet':
            pdfPath = await generateOrderSheet(job.data);
            break;
          
          case 'lab-work-ticket':
            pdfPath = await generateLabWorkTicket(job.data);
            break;
          
          case 'examination-form':
            pdfPath = await generateExaminationForm(job.data);
            break;
          
          case 'invoice':
            pdfPath = await generateInvoice(job.data);
            break;
          
          case 'receipt':
            pdfPath = await generateReceipt(job.data);
            break;
          
          default:
            throw new Error(`Unknown PDF type: ${(job.data as any).type}`);
        }
        
        logger.info(`✅ PDF job ${job.id} completed: ${pdfPath}`);
        return { 
          success: true, 
          path: pdfPath,
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        logger.error(`❌ PDF job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 3, // Process up to 3 PDFs concurrently (CPU intensive)
      lockDuration: 600000, // 10 minute timeout for PDF generation
      limiter: {
        max: 20, // Max 20 PDFs
        duration: 60000, // Per minute
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info(`✅ PDF job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ PDF job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error('PDF worker error:', err);
  });

  logger.info('✅ PDF worker started');
  return worker;
}

/**
 * Ensure uploads directory exists
 */
async function ensureUploadsDir(): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
  await fs.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

/**
 * Generate order sheet PDF
 */
async function generateOrderSheet(data: OrderSheetPDFData): Promise<string> {
  const { orderId } = data;
  
  // Get order details  
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      company: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const uploadsDir = await ensureUploadsDir();
  const filename = `order-${order.orderNumber}-${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  // Generate simple HTML content for order sheet
  const html = generateOrderSheetHTML(order);
  
  // Write HTML to file (PDF generation will be added later with Puppeteer)
  await fs.writeFile(filepath.replace('.pdf', '.html'), html);
  
  logger.info(`✅ Order sheet HTML generated: ${filepath}`);
  return filepath;
}

/**
 * Generate lab work ticket PDF
 */
async function generateLabWorkTicket(data: LabWorkTicketPDFData): Promise<string> {
  const { orderId } = data;
  
  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      company: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const uploadsDir = await ensureUploadsDir();
  const filename = `lab-ticket-${order.orderNumber}-${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);
  
  // Generate lab ticket HTML
  const html = generateLabTicketHTML(order);
  await fs.writeFile(filepath.replace('.pdf', '.html'), html);
  
  logger.info(`✅ Lab work ticket HTML generated: ${filepath}`);
  return filepath;
}

/**
 * Generate examination form PDF
 */
async function generateExaminationForm(data: ExaminationFormPDFData): Promise<string> {
  const { patientId, examinationId } = data;
  
  // Get patient data
  const patient = await db.query.patients.findFirst({
    where: (patients, { eq }) => eq(patients.id, patientId),
  });

  if (!patient) {
    throw new Error(`Patient ${patientId} not found`);
  }

  let examination = null;
  if (examinationId) {
    examination = await db.query.eyeExaminations.findFirst({
      where: (examinations, { eq }) => eq(examinations.id, examinationId),
    });
  }

  const uploadsDir = await ensureUploadsDir();
  const filename = `examination-${patient.name}-${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);
  
  // Generate examination form HTML
  const html = generateExaminationFormHTML(patient, examination);
  await fs.writeFile(filepath.replace('.pdf', '.html'), html);
  
  logger.info(`✅ Examination form HTML generated: ${filepath}`);
  return filepath;
}

/**
 * Generate invoice PDF
 */
async function generateInvoice(data: InvoicePDFData): Promise<string> {
  const { orderId } = data;
  
  // Get order with payment details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      company: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const uploadsDir = await ensureUploadsDir();
  const filename = `invoice-${order.orderNumber}-${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  // Generate invoice HTML
  const html = generateInvoiceHTML(order);
  await fs.writeFile(filepath.replace('.pdf', '.html'), html);
  
  logger.info(`✅ Invoice HTML generated: ${filepath}`);
  return filepath;
}

/**
 * Generate receipt PDF
 */
async function generateReceipt(data: ReceiptPDFData): Promise<string> {
  const { orderId } = data;
  
  // Get order with payment details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      company: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const uploadsDir = await ensureUploadsDir();
  const filename = `receipt-${order.orderNumber}-${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  // Generate receipt HTML
  const html = generateReceiptHTML(order);
  await fs.writeFile(filepath.replace('.pdf', '.html'), html);
  
  logger.info(`✅ Receipt HTML generated: ${filepath}`);
  return filepath;
}

/**
 * HTML template generators
 */
function generateOrderSheetHTML(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f4f4f4; }
        .total { font-weight: bold; font-size: 1.2em; }
      </style>
    </head>
    <body>
      <h1>Order Sheet #${order.orderNumber}</h1>
      <p><strong>Company:</strong> ${order.company.name}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      
      <h2>Prescription Details</h2>
      <table>
        <thead>
          <tr>
            <th>Eye</th>
            <th>Sphere</th>
            <th>Cylinder</th>
            <th>Axis</th>
            <th>Add</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>OD (Right)</td>
            <td>${order.odSphere || 'N/A'}</td>
            <td>${order.odCylinder || 'N/A'}</td>
            <td>${order.odAxis || 'N/A'}</td>
            <td>${order.odAdd || 'N/A'}</td>
          </tr>
          <tr>
            <td>OS (Left)</td>
            <td>${order.osSphere || 'N/A'}</td>
            <td>${order.osCylinder || 'N/A'}</td>
            <td>${order.osAxis || 'N/A'}</td>
            <td>${order.osAdd || 'N/A'}</td>
          </tr>
        </tbody>
      </table>
      
      <h2>Lens Details</h2>
      <p><strong>Type:</strong> ${order.lensType}</p>
      <p><strong>Material:</strong> ${order.lensMaterial}</p>
      <p><strong>Coating:</strong> ${order.coating}</p>
      <p><strong>PD:</strong> ${order.pd}</p>
    </body>
    </html>
  `;
}

function generateLabTicketHTML(order: any): string {
  return generateOrderSheetHTML(order).replace('Order Sheet', 'Lab Work Ticket');
}

function generateExaminationFormHTML(patient: any, examination: any | null): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        .section { margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>Eye Examination Form</h1>
      <div class="section">
        <h2>Patient Information</h2>
        <p><strong>Name:</strong> ${patient.name}</p>
        <p><strong>Date of Birth:</strong> ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Contact:</strong> ${patient.email || 'N/A'} | ${patient.phone || 'N/A'}</p>
      </div>
      ${examination ? `
      <div class="section">
        <h2>Examination Details</h2>
        <p><strong>Date:</strong> ${new Date(examination.createdAt).toLocaleDateString()}</p>
        <p><strong>Notes:</strong> ${examination.notes || 'N/A'}</p>
      </div>
      ` : ''}
    </body>
    </html>
  `;
}

function generateInvoiceHTML(order: any): string {
  return generateOrderSheetHTML(order).replace('Order Sheet', 'Invoice');
}

function generateReceiptHTML(order: any): string {
  return generateOrderSheetHTML(order).replace('Order Sheet', 'Receipt');
}

/**
 * Fallback: Generate PDF immediately if queue not available
 */
export async function generatePDFImmediate(data: PDFJobData): Promise<string> {
  logger.info(`⚠️  [FALLBACK] Generating PDF immediately: ${data.type}`);
  
  switch (data.type) {
    case 'order-sheet':
      return await generateOrderSheet(data);
    case 'lab-work-ticket':
      return await generateLabWorkTicket(data);
    case 'examination-form':
      return await generateExaminationForm(data);
    case 'invoice':
      return await generateInvoice(data);
    case 'receipt':
      return await generateReceipt(data);
    default:
      throw new Error(`Unknown PDF type: ${(data as any).type}`);
  }
}

// Export the factory function - worker is initialized after Redis connects
// Do NOT auto-create at import time to avoid boot order issues
export { createPDFWorker };
