import { Router, Request, Response } from 'express';
import AdvancedPDFService from '../services/AdvancedPDFService';
import { db } from '../db';
import { pdfTemplates } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();
const pdfService = AdvancedPDFService.getInstance();

/**
 * POST /api/pdf/receipt/:transactionId
 * Generate POS receipt PDF
 */
router.post('/receipt/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const companyId = req.user!.companyId;

    const pdfBuffer = await pdfService.generateReceipt(transactionId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${transactionId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    res.status(500).json({ error: 'Failed to generate receipt PDF' });
  }
});

/**
 * POST /api/pdf/invoice
 * Generate invoice PDF
 */
router.post('/invoice', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const invoiceSchema = z.object({
      invoiceNumber: z.string(),
      invoiceDate: z.string().transform((val) => new Date(val)),
      dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
      customer: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
      }),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      })),
      subtotal: z.number(),
      tax: z.number(),
      discount: z.number().optional(),
      total: z.number(),
      notes: z.string().optional(),
    });

    const invoiceData = invoiceSchema.parse(req.body);

    const pdfBuffer = await pdfService.generateInvoice(invoiceData, companyId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoiceData.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid invoice data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to generate invoice PDF' });
    }
  }
});

/**
 * POST /api/pdf/order/:orderId
 * Generate order confirmation PDF
 */
router.post('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const pdfBuffer = await pdfService.generateOrderConfirmation(orderId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order_${orderId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating order PDF:', error);
    res.status(500).json({ error: 'Failed to generate order PDF' });
  }
});

/**
 * POST /api/pdf/label
 * Generate label PDF
 */
router.post('/label', async (req: Request, res: Response) => {
  try {
    const labelSchema = z.object({
      type: z.enum(['product', 'prescription', 'order']),
      title: z.string(),
      subtitle: z.string().optional(),
      qrData: z.string(),
      additionalInfo: z.array(z.object({
        label: z.string(),
        value: z.string(),
      })).optional(),
    });

    const labelData = labelSchema.parse(req.body);

    const pdfBuffer = await pdfService.generateLabel(labelData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=label_${labelData.type}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating label PDF:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid label data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to generate label PDF' });
    }
  }
});

/**
 * GET /api/pdf/templates
 * Get all PDF templates for company
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const templates = await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.companyId, companyId));

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * POST /api/pdf/templates
 * Create new PDF template
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const templateSchema = z.object({
      name: z.string().max(100),
      templateType: z.enum(['invoice', 'receipt', 'prescription', 'report', 'order', 'label']),
      htmlTemplate: z.string(),
      cssStyles: z.string().optional(),
      headerLogoUrl: z.string().optional(),
      footerText: z.string().optional(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      isDefault: z.boolean().optional(),
      paperSize: z.enum(['A4', 'Letter', 'Receipt', 'Label']).optional(),
      orientation: z.enum(['portrait', 'landscape']).optional(),
    });

    const templateData = templateSchema.parse(req.body);

    const [newTemplate] = await db
      .insert(pdfTemplates)
      .values({
        ...templateData,
        companyId,
      })
      .returning();

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid template data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
});

/**
 * PUT /api/pdf/templates/:id
 * Update PDF template
 */
router.put('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const templateSchema = z.object({
      name: z.string().max(100).optional(),
      htmlTemplate: z.string().optional(),
      cssStyles: z.string().optional(),
      headerLogoUrl: z.string().optional(),
      footerText: z.string().optional(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      isDefault: z.boolean().optional(),
      paperSize: z.enum(['A4', 'Letter', 'Receipt', 'Label']).optional(),
      orientation: z.enum(['portrait', 'landscape']).optional(),
    });

    const updateData = templateSchema.parse(req.body);

    const [updatedTemplate] = await db
      .update(pdfTemplates)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pdfTemplates.id, id),
          eq(pdfTemplates.companyId, companyId)
        )
      )
      .returning();

    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid template data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update template' });
    }
  }
});

/**
 * DELETE /api/pdf/templates/:id
 * Delete PDF template
 */
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const [deletedTemplate] = await db
      .delete(pdfTemplates)
      .where(
        and(
          eq(pdfTemplates.id, id),
          eq(pdfTemplates.companyId, companyId)
        )
      )
      .returning();

    if (!deletedTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
