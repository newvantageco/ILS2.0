import { Router, Request, Response } from "express";
import { db } from "../db";
import { emailLogs, emailTemplates, emailTrackingEvents } from "../../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { emailTrackingService } from "../services/EmailTrackingService";
import { authenticateUser, type AuthenticatedRequest } from "../middleware/auth";
import { createLogger } from "../utils/logger";

const router = Router();
const logger = createLogger('emails');

// ============================================
// Email Sending Routes
// ============================================

/**
 * Send a custom email with tracking
 * POST /api/emails/send
 */
router.post("/send", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const {
      to,
      toName,
      subject,
      htmlContent,
      textContent,
      emailType,
      patientId,
      relatedEntityType,
      relatedEntityId,
      metadata,
    } = req.body;

    if (!to || !subject || !htmlContent || !emailType) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, htmlContent, emailType",
      });
    }

    const emailLog = await emailTrackingService.sendEmail({
      to,
      toName,
      subject,
      htmlContent,
      textContent,
      emailType,
      companyId: user.companyId!,
      sentBy: user.id,
      patientId,
      relatedEntityType,
      relatedEntityId,
      metadata,
    });

    res.json(emailLog);
  } catch (error: any) {
    logger.error({ error, to, subject }, 'Error sending email');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send an email using a template
 * POST /api/emails/send-template
 */
router.post("/send-template", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const {
      templateId,
      to,
      toName,
      variables,
      patientId,
      relatedEntityType,
      relatedEntityId,
      metadata,
    } = req.body;

    if (!templateId || !to || !variables) {
      return res.status(400).json({
        error: "Missing required fields: templateId, to, variables",
      });
    }

    const emailLog = await emailTrackingService.sendTemplateEmail(
      templateId,
      variables,
      {
        to,
        toName,
        companyId: user.companyId!,
        sentBy: user.id,
        patientId,
        relatedEntityType,
        relatedEntityId,
        metadata,
      } as any // Template provides emailType
    );

    res.json(emailLog);
  } catch (error: any) {
    logger.error({ error, templateId, to }, 'Error sending template email');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Retry a failed email
 * POST /api/emails/:id/retry
 */
router.post("/:id/retry", authenticateUser, async (req: Request, res: Response) => {
  try {
    const emailLog = await emailTrackingService.retryEmail(req.params.id);
    res.json(emailLog);
  } catch (error: any) {
    logger.error({ error, emailLogId }, 'Error retrying email');
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Email Tracking Routes (Public)
// ============================================

/**
 * Track email open (tracking pixel endpoint)
 * GET /api/emails/track/open/:trackingId
 */
router.get("/track/open/:trackingId", async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress;

    await emailTrackingService.trackOpen(trackingId, userAgent, ipAddress);

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    res.end(pixel);
  } catch (error) {
    logger.error({ error, emailLogId, trackingId }, 'Error tracking email open');
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length,
    });
    res.end(pixel);
  }
});

/**
 * Track email link click and redirect
 * GET /api/emails/track/click/:trackingId
 */
router.get("/track/click/:trackingId", async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;
    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress;

    if (!url) {
      return res.status(400).send("Missing URL parameter");
    }

    await emailTrackingService.trackClick(
      trackingId,
      url as string,
      userAgent,
      ipAddress
    );

    // Redirect to the original URL
    res.redirect(url as string);
  } catch (error) {
    logger.error({ error, emailLogId, trackingId, url }, 'Error tracking email click');
    // Redirect anyway even if tracking fails
    const { url } = req.query;
    if (url) {
      res.redirect(url as string);
    } else {
      res.status(400).send("Missing URL parameter");
    }
  }
});

// ============================================
// Email Analytics Routes
// ============================================

/**
 * Get email analytics for company
 * GET /api/emails/analytics
 */
router.get("/analytics", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { emailType, startDate, endDate, patientId } = req.query;

    const analytics = await emailTrackingService.getAnalytics(
      user.companyId!,
      {
        emailType: emailType as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        patientId: patientId as string | undefined,
      }
    );

    res.json(analytics);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching email analytics');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get email logs with filtering and pagination
 * GET /api/emails/logs
 */
router.get("/logs", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { emailType, status, patientId, page = "1", limit = "50" } = req.query;
    
    const conditions: any[] = [eq(emailLogs.companyId, user.companyId!)];

    if (emailType) {
      conditions.push(eq(emailLogs.emailType, emailType as any));
    }

    if (status) {
      conditions.push(eq(emailLogs.status, status as any));
    }

    if (patientId) {
      conditions.push(eq(emailLogs.patientId, patientId as string));
    }

    const logs = await db
      .select()
      .from(emailLogs)
      .where(and(...conditions))
      .orderBy(desc(emailLogs.sentAt))
      .limit(parseInt(limit as string))
      .offset((parseInt(page as string) - 1) * parseInt(limit as string));

    res.json(logs);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching email logs');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific email log with tracking events
 * GET /api/emails/logs/:id
 */
router.get("/logs/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const [emailLog] = await db
      .select()
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.id, req.params.id),
          eq(emailLogs.companyId, user.companyId!)
        )
      );

    if (!emailLog) {
      return res.status(404).json({ error: "Email log not found" });
    }

    const events = await emailTrackingService.getEmailTrackingEvents(emailLog.id);

    res.json({
      ...emailLog,
      events,
    });
  } catch (error: any) {
    logger.error({ error, emailLogId: id }, 'Error fetching email log');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get email history for a patient
 * GET /api/emails/patient/:patientId
 */
router.get("/patient/:patientId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const history = await emailTrackingService.getPatientEmailHistory(
      req.params.patientId,
      user.companyId!
    );

    res.json(history);
  } catch (error: any) {
    logger.error({ error, patientId }, 'Error fetching patient email history');
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Email Template Routes
// ============================================

/**
 * Get all email templates
 * GET /api/emails/templates
 */
router.get("/templates", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { emailType, isActive } = req.query;
    
    const conditions: any[] = [eq(emailTemplates.companyId, user.companyId!)];

    if (emailType) {
      conditions.push(eq(emailTemplates.emailType, emailType as any));
    }

    if (isActive !== undefined) {
      conditions.push(eq(emailTemplates.isActive, isActive === "true"));
    }

    const templates = await db
      .select()
      .from(emailTemplates)
      .where(and(...conditions))
      .orderBy(desc(emailTemplates.createdAt));

    res.json(templates);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching email templates');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific email template
 * GET /api/emails/templates/:id
 */
router.get("/templates/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(
        and(
          eq(emailTemplates.id, req.params.id),
          eq(emailTemplates.companyId, user.companyId!)
        )
      );

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error: any) {
    logger.error({ error, templateId: id }, 'Error fetching email template');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create a new email template
 * POST /api/emails/templates
 */
router.post("/templates", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const {
      name,
      description,
      emailType,
      subject,
      htmlContent,
      textContent,
      variables,
      isActive,
      isDefault,
    } = req.body;

    if (!name || !emailType || !subject || !htmlContent) {
      return res.status(400).json({
        error: "Missing required fields: name, emailType, subject, htmlContent",
      });
    }

    const [template] = await db
      .insert(emailTemplates)
      .values({
        companyId: user.companyId!,
        name,
        description,
        emailType,
        subject,
        htmlContent,
        textContent,
        variables,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        createdBy: user.id,
      } as any)
      .returning();

    res.status(201).json(template);
  } catch (error: any) {
    logger.error({ error, templateName: name }, 'Error creating email template');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update an email template
 * PATCH /api/emails/templates/:id
 */
router.patch("/templates/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const {
      name,
      description,
      subject,
      htmlContent,
      textContent,
      variables,
      isActive,
      isDefault,
    } = req.body;

    const [template] = await db
      .update(emailTemplates)
      .set({
        name,
        description,
        subject,
        htmlContent,
        textContent,
        variables,
        isActive,
        isDefault,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(emailTemplates.id, req.params.id),
          eq(emailTemplates.companyId, user.companyId!)
        )
      )
      .returning();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error: any) {
    logger.error({ error, templateId: id }, 'Error updating email template');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete an email template
 * DELETE /api/emails/templates/:id
 */
router.delete("/templates/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const [template] = await db
      .delete(emailTemplates)
      .where(
        and(
          eq(emailTemplates.id, req.params.id),
          eq(emailTemplates.companyId, user.companyId!)
        )
      )
      .returning();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error: any) {
    logger.error({ error, templateId: id }, 'Error deleting email template');
    res.status(500).json({ error: error.message });
  }
});

export default router;
