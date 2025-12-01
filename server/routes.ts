import type { Express, Response, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRepository } from "./repositories/AuthRepository";
import { setupAuth as setupReplitAuth, isAuthenticated } from "./replitAuth";
import type { AuthenticatedRequest } from "./middleware/auth";
import { hashPassword } from "./localAuth";
import type {
  RoleSelectionBody,
  UserUpdateBody,
  PasswordUpdateBody,
  OMAFileBody,
  EmailBody,
  FeedbackResponseBody,
  InvoiceBody,
  ShopifyConfigBody,
  POSTransactionBody,
  StatusUpdateBody,
  AmountBody,
  ActionBody,
  LensParametersBody,
} from "./types/request";
import passport from "passport";
import { 
  insertOrderSchema, 
  updateOrderStatusSchema,
  insertConsultLogSchema,
  insertPurchaseOrderSchema,
  insertPOLineItemSchema,
  insertTechnicalDocumentSchema,
  updatePOStatusSchema,
  insertSupplierSchema,
  updateSupplierSchema,
  updateOrganizationSettingsSchema,
  updateUserPreferencesSchema,
  insertEyeExaminationSchema,
  insertPrescriptionSchema,
  insertProductSchema,
  insertInvoiceSchema,
  insertInvoiceLineItemSchema,
  insertPatientSchema,
  User
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generatePurchaseOrderPDF } from "./pdfService";
import { sendPurchaseOrderEmail, sendShipmentNotificationEmail } from "./emailService";
import { pdfService, type OrderSheetData } from "./services/PDFService";
import { labWorkTicketService, type LabWorkTicketData } from "./services/LabWorkTicketService";
import { examinationFormService, type ExaminationFormData } from "./services/ExaminationFormService";
import { emailService } from "./services/EmailService";
import { z } from "zod";
import { parseOMAFile, isValidOMAFile } from "@shared/omaParser";
import { normalizeEmail } from "./utils/normalizeEmail";
import { addCreationTimestamp, addUpdateTimestamp } from "./utils/timestamps";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import logger from "./utils/logger";

// Security and validation imports
import { asyncHandler } from "./middleware/errorHandler";
import { 
  validateRequest,
  loginSchema,
  registerSchema,
  passwordResetSchema,
  createOrderSchema,
  updateOrderStatusSchema as updateOrderStatusValidationSchema,
  createPaymentIntentSchema,
  confirmPaymentSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  aiQuerySchema
} from "./middleware/validation";
import {
  securityHeaders,
  enforceTLS,
  corsConfig,
  validateSSLCertificate,
  auditLog
} from "./middleware/security";
import { getCsrfToken, csrfProtection } from "./middleware/csrfProtection";
import { requireMFA, checkMFASetup } from "./middleware/mfa-enforcement";
import { 
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  InsufficientCreditsError
} from "./utils/ApiError";
import { withTransaction, transactionalInsert, transactionalUpdate } from "./utils/transaction";

import { registerMetricsRoutes } from "./routes/metrics";
import { registerBiRoutes } from "./routes/bi";
import { registerSaaSRoutes } from "./routes/saas-analytics";
import { registerMasterAIRoutes } from "./routes/master-ai";
import platformAIRoutes from "./routes/platform-ai";
import { registerAINotificationRoutes } from "./routes/ai-notifications";
import { registerAutonomousPORoutes } from "./routes/ai-purchase-orders";
// AI Assistant routes are now in master-ai.ts
import { registerDemandForecastingRoutes } from "./routes/demand-forecasting";

// NEW: Unified AI routes (consolidates all AI services)
import unifiedAIRoutes from "./routes/domains/ai";
import { deprecateAIRoute } from "./middleware/deprecation";
// Domain routes registry for organized route management
import { registerDomainRoutes, registerLegacyAIRoutes } from "./routes/domains";
// Request context for correlation ID propagation
import {
  requestContextMiddleware,
  enrichUserContext,
  requestTimingMiddleware,
  errorContextMiddleware
} from "./middleware/requestContextMiddleware";
import { registerMarketplaceRoutes } from "./routes/marketplace";
import { registerQueueRoutes } from "./routes/queue";
import platformAdminRoutes from "./routes/platform-admin";
import systemAdminRoutes from "./routes/system-admin";
import { registerPermissionRoutes } from "./routes/permissions";
import { registerAdminRoutes } from "./routes/admin";
import userManagementRoutes from "./routes/userManagement";
import ecpRoutes from "./routes/ecp";
import posRoutes from "./routes/pos";
import authJWTRoutes from "./routes/auth-jwt.js";
import { jwtService } from "./services/JWTService.js";
import { authenticateHybrid } from "./middleware/auth-hybrid.js";
import { secureRoute, secureAdminRoute, securePlatformAdminRoute } from "./middleware/secureRoute.js";
import analyticsRoutes from "./routes/analytics";
import pdfGenerationRoutes from "./routes/pdfGeneration";
import companiesRoutes from "./routes/companies";
import onboardingRoutes from "./routes/onboarding";
import auditLogRoutes from "./routes/auditLogs";
import inventoryRoutes from "./routes/inventory";
import uploadRoutes from "./routes/upload";
import examinationsRoutes from "./routes/examinations";
import eventRoutes from "./routes/events";
import pythonAnalyticsRoutes from "./routes/pythonAnalytics";
import emailRoutes from "./routes/emails";
import scheduledEmailRoutes from "./routes/scheduled-emails";
import orderEmailRoutes from "./routes/order-emails";
import shopifyWebhookRoutes from "./routes/webhooks/shopify";
import clinicalWorkflowRoutes from "./routes/clinical/workflow";
import omaValidationRoutes from "./routes/clinical/oma-validation";
import billingRoutes from "./routes/billing";
import archivalRoutes from "./routes/archival";
import v1ApiRoutes from "./routes/api/v1";
import queryOptimizerRoutes from "./routes/query-optimizer";
import mlModelsRoutes from "./routes/ml-models";
import pythonMLRoutes from "./routes/python-ml";
import shopifyRoutes from "./routes/shopify";
import featureFlagsRoutes from "./routes/feature-flags";
import dynamicRolesRouter from "./routes/dynamicRoles";
import { websocketService } from "./websocket";
import path from "path";

// Healthcare Platform Routes (Phases 17-21)
import rcmRoutes from "./routes/rcm";
import populationHealthRoutes from "./routes/population-health";
import qualityRoutes from "./routes/quality";
import mhealthRoutes from "./routes/mhealth";
import researchRoutes from "./routes/research";
import telehealthRoutes from "./routes/telehealth";

// NHS Integration Routes
import nhsRoutes from "./routes/nhs";

// Patient Portal Routes
import patientPortalRoutes from "./routes/patient-portal";

// Additional Feature Routes
import gdprRoutes from "./routes/gdpr";
import twoFactorRoutes from "./routes/twoFactor";
import integrationsRoutes from "./routes/integrations";
import communicationsRoutes from "./routes/communications";
import recallsRoutes from "./routes/recalls";
import monitoringRoutes from "./routes/monitoring";
import observabilityRoutes from "./routes/observability";
import contactLensRoutes from "./routes/contactLens";
import clinicalReportingRoutes from "./routes/clinical-reporting";
import faceAnalysisRoutes from "./routes/faceAnalysis";
import lensRecommendationsRoutes from "./routes/lens-recommendations";
import importRoutes from "./routes/import";
import biAnalyticsRoutes from "./routes/bi-analytics";
import apiManagementRoutes from "./routes/api-management";
import { registerPaymentRoutes } from "./routes/payments";
import { registerGoogleAuthRoutes } from "./routes/google-auth";
import aiMLRoutes from "./routes/ai-ml";
import ophthalamicAIRoutes from "./routes/ophthalamicAI";
import orderTrackingRoutes from "./routes/orderTracking";
import feedbackRoutes from "./routes/feedback";
import { saasMetricsRouter } from "./routes/saas-metrics";
import appointmentsRoutes from "./routes/appointments";
import ehrRoutes from "./routes/ehr";
import medicalBillingRoutes from "./routes/medical-billing";
import patientPortalV2Routes from "./routes/patient-portal-v2";
import healthcareAnalyticsRoutes from "./routes/healthcare-analytics";
import laboratoryRoutes from "./routes/laboratory";

/**
 * Helper function to get user permissions based on role
 */
function getUserPermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'super_admin': [
      'admin.all',
      'company.all',
      'user.all',
      'data.all',
      'settings.all',
      'reports.all',
      'ai.all'
    ],
    'admin': [
      'company.manage',
      'user.manage',
      'data.all',
      'settings.manage',
      'reports.all',
      'ai.use'
    ],
    'manager': [
      'user.view',
      'data.manage',
      'reports.view',
      'ai.use'
    ],
    'ecp': [
      'data.view',
      'data.create',
      'data.update',
      'reports.view',
      'ai.use'
    ],
    'lab_tech': [
      'data.view',
      'data.create',
      'data.update',
      'reports.view'
    ],
    'staff': [
      'data.view',
      'data.create',
      'data.update',
      'reports.view',
      'ai.use'
    ],
    'user': [
      'data.view',
      'reports.view'
    ]
  };

  return rolePermissions[role] || rolePermissions['user'];
}
import practiceManagementRoutes from "./routes/practice-management";
import verificationRoutes from "./routes/verification";
import backupRoutes from "./routes/backup";
import returnsAndNonAdaptsRoutes from "./routes/returnsAndNonAdaptsRoutes";
import clinicalProtocolsRoutes from "./routes/clinical-protocols";
import notificationsRoutes from "./routes/notifications";
import {
  publicApiLimiter,
  authLimiter,
  signupLimiter,
  webhookLimiter,
  aiQueryLimiter,
  passwordResetLimiter,
  generalLimiter,
  // AI/ML Rate Limiters
  ocrRateLimiter,
  aiAnalysisRateLimiter,
  mlModelsRateLimiter,
  shopifyWidgetRateLimiter,
  burstProtectionRateLimiter,
  setupRateLimiting
} from "./middleware/rateLimiter";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // HELPER: Extract requesting user context from authenticated request
  // Used for tenant-aware operations (P0-2 security fix)
  // ============================================================================
  const getRequestingUser = (req: AuthenticatedRequest) => ({
    id: req.user!.id,
    companyId: req.user!.companyId || null,
    role: req.user!.role
  });

  // Apply comprehensive security middleware stack
  if (process.env.NODE_ENV === 'production') {
    // Enforce HTTPS in production
    // app.use(enforceTLS);

    // Validate SSL certificates
    // app.use('/api', validateSSLCertificate);
  }
  
  // Apply security headers to all requests
  app.use(securityHeaders);

  // Configure CORS
  app.use(corsConfig);

  // =============================================================================
  // REQUEST CONTEXT & TRACING
  // =============================================================================
  // Set up AsyncLocalStorage-based request context for automatic correlation ID
  // propagation to all async operations (database queries, background jobs, etc.)
  app.use(requestTimingMiddleware);  // Track request timing
  app.use(requestContextMiddleware);  // Set up correlation ID and request context
  
  // Setup comprehensive rate limiting for all endpoints
  setupRateLimiting(app);
  
  // Add security audit logging
  app.use('/api', auditLog as any);
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Health check endpoint for deployment monitoring
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API info endpoint
  app.get('/api', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Integrated Lens System API',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        api: '/api',
        docs: '/api/documentation',
        verification: '/api/verification'
      }
    });
  });

  // CSRF Token endpoint - must be called before making state-changing requests
  // This endpoint generates and returns a CSRF token for the client
  app.get('/api/csrf-token', csrfProtection, getCsrfToken);

  // Service verification endpoints
  app.use('/api/verification', verificationRoutes);
  app.use('/api/backup', backupRoutes);

  // JWT Authentication routes (works in all environments)
  app.use('/api/auth', authJWTRoutes);

  if (process.env.NODE_ENV !== 'development') {
    await setupReplitAuth(app);
  }

  // Register Google OAuth routes (works in all environments)
  registerGoogleAuthRoutes(app);

  // Logout route - works for both development and production
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        logger.error({ error: err instanceof Error ? err.message : String(err), context: 'logout' }, 'Logout error');
        return res.status(500).json({ message: "Logout failed" });
      }
      // Clear session
      req.session?.destroy((err) => {
        if (err) {
          logger.error({ error: err instanceof Error ? err.message : String(err), context: 'logout' }, 'Session destroy error');
        }
        // Clear cookie
        res.clearCookie('connect.sid');
        // Redirect to home page
        res.redirect('/');
      });
    });
  });

  // =============================================================================
  // DOMAIN ROUTE REGISTRY (NEW)
  // =============================================================================
  // This registers routes using the new domain-organized structure.
  // Routes are organized by business domain for better maintainability.
  // See docs/ROUTE_ORGANIZATION.md for details.
  //
  // NOTE: Individual route registrations below are being migrated to the
  // domain registry. Once migration is complete, the calls below can be
  // removed and only registerDomainRoutes will be needed.
  // =============================================================================

  registerDomainRoutes(app);

  // Register legacy AI routes with deprecation warnings
  registerLegacyAIRoutes(app);

  // =============================================================================
  // =============================================================================
  // UNIFIED AI SYSTEM (Already registered via domain registry above)
  // =============================================================================
  // All AI endpoints are now consolidated under /api/ai/*
  // See docs/AI_SERVICES_ANALYSIS.md for migration guide
  // The line below is commented out as it's now handled by registerDomainRoutes
  // app.use('/api/ai', ...secureRoute(), unifiedAIRoutes);

  // =============================================================================
  // DEPRECATED AI ROUTES - Will be removed after sunset date
  // Migrate to /api/ai/* endpoints
  // =============================================================================

  // Master AI: DEPRECATED - Use /api/ai/chat instead
  // Sunset: 30 days from deployment
  app.use('/api/master-ai', deprecateAIRoute('/api/master-ai', '/api/ai'));
  registerMasterAIRoutes(app, storage);

  // Platform AI: DEPRECATED - Use /api/ai/* instead
  app.use('/api/platform-ai', deprecateAIRoute('/api/platform-ai', '/api/ai'), ...secureRoute(), platformAIRoutes);

  // AI Notifications: DEPRECATED - Use /api/ai/briefing instead
  app.use('/api/ai-notifications', deprecateAIRoute('/api/ai-notifications', '/api/ai/briefing'));
  registerAINotificationRoutes(app);

  // Company-specific AI Assistant (chat, knowledge, learning)
  // registerAiAssistantRoutes(app); // Moved to master-ai

  // Autonomous Purchasing: DEPRECATED - Use /api/ai/actions instead
  app.use('/api/ai-purchase-orders', deprecateAIRoute('/api/ai-purchase-orders', '/api/ai/actions'));
  registerAutonomousPORoutes(app);

  // Demand Forecasting: DEPRECATED - Use /api/ai/predictions/demand instead
  app.use('/api/demand-forecasting', deprecateAIRoute('/api/demand-forecasting', '/api/ai/predictions/demand'));
  registerDemandForecastingRoutes(app);
  
  // Company Marketplace: B2B network and connections (Chunk 6)
  registerMarketplaceRoutes(app);
  
  // Platform Analytics: Cross-tenant insights & revenue (Chunk 7)
  // SECURITY: MFA required for all platform admin access
  // Uses securePlatformAdminRoute() for platform admin + JWT + tenant context
  app.use('/api/platform-admin', ...securePlatformAdminRoute(), requireMFA, platformAdminRoutes);

  // System Admin: Configuration, monitoring, and operations
  // SECURITY: MFA required for all system admin access
  // Uses securePlatformAdminRoute() for platform admin + JWT + tenant context
  app.use('/api/system-admin', ...securePlatformAdminRoute(), requireMFA, systemAdminRoutes);

  // =============================================================================
  
  // Register Metrics Dashboard routes
  registerMetricsRoutes(app);
  
  // Register Business Intelligence Dashboard routes
  registerBiRoutes(app);
  
  // Register SaaS Analytics routes (customer health, churn, feature usage)
  registerSaaSRoutes(app);
  
  // Register Background Job Queue Management routes (admin-only monitoring)
  registerQueueRoutes(app);
  
  // Register Permission Management routes
  registerPermissionRoutes(app);
  
  // Register Admin Management routes (platform_admin only)
  registerAdminRoutes(app);
  
  // Register ECP Features routes (test rooms, GOC compliance, prescription templates)
  app.use('/api/ecp', ecpRoutes);

  // Register Onboarding routes (automated multi-tenant signup with company creation)
  app.use('/api/onboarding', signupLimiter, onboardingRoutes);

  // Register POS (Point of Sale) routes for over-the-counter sales
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/pos', ...secureRoute(), posRoutes);

  // Register Inventory Management routes for product CRUD and stock adjustments
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/inventory', ...secureRoute(), inventoryRoutes);

  // Register Eye Examination routes for clinical records
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/examinations', ...secureRoute(), examinationsRoutes);

  // Register File Upload routes for images and attachments
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/upload', ...secureRoute(), uploadRoutes);

  // Register Analytics routes (Shopify-style dashboard and reports)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/analytics', ...secureRoute(), analyticsRoutes);

  // Register SaaS Metrics routes (MRR, ARR, CAC, CLV, churn, health scores)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/saas', ...secureRoute(), saasMetricsRouter);

  // Register Appointment Scheduling routes
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/appointments', ...secureRoute(), appointmentsRoutes);

  // Register EHR System routes
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/ehr', ...secureRoute(), ehrRoutes);

  // Register Medical Billing & Insurance routes
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/medical-billing', ...secureRoute(), medicalBillingRoutes);

  // Register Patient Portal routes
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/patient-portal', ...secureRoute(), patientPortalRoutes);

  // Register Healthcare Analytics routes
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/healthcare-analytics', ...secureRoute(), healthcareAnalyticsRoutes);

  // Register Laboratory Integration routes
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/laboratory', ...secureRoute(), laboratoryRoutes);

  // Register Practice Management routes
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/practice-management', ...secureRoute(), practiceManagementRoutes);

  // Register PDF Generation routes (receipts, invoices, labels, templates)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/pdf', ...secureRoute(), pdfGenerationRoutes);

  // Register Companies routes for multi-tenant onboarding
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  // CRITICAL: Company data leaks fixed - now enforces tenant isolation
  app.use('/api/companies', ...secureRoute(), companiesRoutes);

  // Register Returns and Non-Adapts routes (lab operations)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/returns', ...secureRoute(), returnsAndNonAdaptsRoutes);
  app.use('/api/non-adapts', ...secureRoute(), returnsAndNonAdaptsRoutes);

  // Register Clinical Protocols routes (ECP clinical workflows)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/clinical-protocols', ...secureRoute(), clinicalProtocolsRoutes);

  // Register User Management routes (RBAC-protected with company isolation)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/users', ...secureRoute(), userManagementRoutes);

  // Register Audit Log routes (admin-only HIPAA compliance)
  // SECURITY: MFA required for audit log access (sensitive data)
  // Uses secureAdminRoute() for admin-only access + tenant context
  app.use('/api/admin/audit-logs', ...secureAdminRoute(), requireMFA, auditLogRoutes);

  // Register Archival & Data Retrieval routes (soft delete, historical data, reports)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/archival', ...secureRoute(), archivalRoutes);

  // Register Email Tracking & Communication routes (invoices, reminders, recalls with analytics)
  app.use('/api/emails', emailRoutes);
  app.use('/api/scheduled-emails', scheduledEmailRoutes);
  app.use('/api/order-emails', orderEmailRoutes);

  // Register Event System routes (Chunk 9: event monitoring, webhooks, WebSocket stats)
  app.use('/api/events', eventRoutes);

  // Register Python Analytics routes (ML predictions, QC analysis, advanced analytics)
  app.use(pythonAnalyticsRoutes);

  // ============================================================================
  // WORLD-CLASS TRANSFORMATION ROUTES (November 2025)
  // ============================================================================

  // Shopify webhook routes (public, HMAC-verified)
  app.use('/api/webhooks/shopify', webhookLimiter, shopifyWebhookRoutes);

  // Clinical workflow routes (AI-powered recommendations)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/clinical/workflow', ...secureRoute(), clinicalWorkflowRoutes);

  // OMA validation routes (intelligent validation with confidence scoring)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/clinical/oma', ...secureRoute(), omaValidationRoutes);

  // Billing routes (usage tracking, metered billing)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/billing', ...secureRoute(), billingRoutes);

  // Public API v1 routes (RESTful API for third-party integrations)
  app.use('/api/v1', publicApiLimiter, v1ApiRoutes);

  // Query Optimizer routes (database performance monitoring and optimization)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  app.use('/api/query-optimizer', ...secureRoute(), queryOptimizerRoutes);

  // ML Models routes (machine learning model management)
  app.use('/api/ml/models', mlModelsRoutes);

  // Python ML routes (Python ML service integration and monitoring)
  app.use('/api/python-ml', pythonMLRoutes);

  // Shopify Integration routes (e-commerce platform sync)
  app.use('/api/shopify', shopifyRoutes);

  // Feature Flags routes (feature toggle and A/B testing)
  app.use('/api/feature-flags', featureFlagsRoutes);

  // Dynamic RBAC routes (role and permission management)
  // SECURITY: Uses secureRoute() for JWT auth + tenant context (RLS enforcement)
  logger.info({ routePath: '/api/roles', routerType: typeof dynamicRolesRouter }, 'Registering Dynamic RBAC routes');
  app.use('/api/roles', ...secureRoute(), dynamicRolesRouter);
  logger.info({}, 'Dynamic RBAC routes registered');

  // ============================================================================
  // HEALTHCARE PLATFORM ROUTES (Phases 17-21) - NOW CONNECTED!
  // ============================================================================

  // RCM (Revenue Cycle Management) routes
  app.use('/api/rcm', ...secureRoute(), rcmRoutes);

  // Population Health Management routes
  app.use('/api/population-health', ...secureRoute(), populationHealthRoutes);

  // Quality Measures & Compliance routes
  app.use('/api/quality', ...secureRoute(), qualityRoutes);

  // Mobile Health (mHealth) routes
  app.use('/api/mhealth', ...secureRoute(), mhealthRoutes);

  // Clinical Research Platform routes
  app.use('/api/research', ...secureRoute(), researchRoutes);

  // Telehealth routes
  app.use('/api/telehealth', ...secureRoute(), telehealthRoutes);

  // ============================================================================
  // NHS INTEGRATION ROUTES - NOW CONNECTED!
  // ============================================================================

  // NHS/PCSE Integration routes (claims, vouchers, exemptions)
  app.use('/api/nhs', ...secureRoute(), nhsRoutes);

  // ============================================================================
  // PATIENT PORTAL & PUBLIC ROUTES - NOW CONNECTED!
  // ============================================================================

  // Patient Portal routes (public and authenticated)
  app.use('/api/patient-portal', patientPortalV2Routes);

  // ============================================================================
  // SECURITY & COMPLIANCE ROUTES - NOW CONNECTED!
  // ============================================================================

  // GDPR Compliance routes
  app.use('/api/gdpr', ...secureRoute(), gdprRoutes);

  // Two-Factor Authentication routes
  app.use('/api/two-factor', twoFactorRoutes);

  // ============================================================================
  // INTEGRATION & COMMUNICATION ROUTES - NOW CONNECTED!
  // ============================================================================

  // Integration Framework routes
  app.use('/api/integrations', ...secureRoute(), integrationsRoutes);

  // Communications (email, SMS, campaigns) routes
  app.use('/api/communications', ...secureRoute(), communicationsRoutes);

  // Patient Recalls routes
  app.use('/api/recalls', ...secureRoute(), recallsRoutes);

  // ============================================================================
  // MONITORING & OBSERVABILITY ROUTES - NOW CONNECTED!
  // ============================================================================

  // System Monitoring routes
  app.use('/api/monitoring', ...secureRoute(), monitoringRoutes);

  // Observability (tracing, metrics) routes
  app.use('/api/observability', ...secureRoute(), observabilityRoutes);

  // ============================================================================
  // ADDITIONAL FEATURE ROUTES - NOW CONNECTED!
  // ============================================================================

  // Contact Lens Management routes
  app.use('/api/contact-lens', ...secureRoute(), contactLensRoutes);

  // Clinical Reporting routes
  app.use('/api/clinical-reporting', ...secureRoute(), clinicalReportingRoutes);

  // Face Analysis (AI-powered) routes
  app.use('/api/face-analysis', ...secureRoute(), faceAnalysisRoutes);

  // Lens Recommendations (AI-powered) routes
  app.use('/api/lens-recommendations', ...secureRoute(), lensRecommendationsRoutes);

  // Data Import/Export routes
  app.use('/api/import', ...secureRoute(), importRoutes);

  // BI Analytics routes
  app.use('/api/bi-analytics', ...secureRoute(), biAnalyticsRoutes);

  // API Management routes
  app.use('/api/api-management', ...secureRoute(), apiManagementRoutes);

  // Payment Processing routes
  registerPaymentRoutes(app);

  // AI/ML Service routes - DEPRECATED, Use /api/ai/clinical/* instead
  app.use('/api/ai-ml', deprecateAIRoute('/api/ai-ml', '/api/ai/clinical'), ...secureRoute(), aiMLRoutes);

  // Ophthalmic AI routes - DEPRECATED, Use /api/ai/chat instead
  app.use('/api/ophthalmic-ai', deprecateAIRoute('/api/ophthalmic-ai', '/api/ai/chat'), ...secureRoute(), ophthalamicAIRoutes);

  // Order Tracking routes
  app.use('/api/order-tracking', orderTrackingRoutes);

  // User Feedback & NPS routes
  app.use('/api', feedbackRoutes);

  // Notifications routes
  app.use(notificationsRoutes);

  const FULL_PLAN = "full" as const;
  const FREE_ECP_PLAN = "free_ecp" as const;

  const isFreeEcpPlan = (user?: User | null) => user?.role === "ecp" && user.subscriptionPlan === FREE_ECP_PLAN;

  const denyFreePlanAccess = (user: User | undefined, res: Response, feature: string) => {
    if (isFreeEcpPlan(user)) {
      res.status(403).json({
        message: `Upgrade to the Full Experience plan to access ${feature}.`,
        requiredPlan: FULL_PLAN,
      });
      return true;
    }
    return false;
  };

  // Auth routes
  // SECURITY: Uses AuthRepository for audited cross-tenant access during authentication
  app.get('/api/auth/user', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      // Use AuthRepository with audit logging for auth flows
      const user = await authRepository.findUserWithRoles(userId, {
        ip: req.ip,
        reason: 'Get current user session'
      });
      res.json(user);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching user');
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Bootstrap endpoint - returns user and role-based redirect path
  // SECURITY: Uses AuthRepository for audited cross-tenant access during authentication
  app.get('/api/auth/bootstrap', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      // Use AuthRepository with audit logging for auth flows
      const user = await authRepository.findUserWithRoles(userId, {
        ip: req.ip,
        reason: 'Bootstrap session'
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user needs to complete signup
      if (!user.role) {
        return res.json({
          user,
          redirectPath: '/signup',
          requiresSetup: true
        });
      }

      // Check account status
      if (user.accountStatus === 'pending') {
        return res.json({
          user,
          redirectPath: '/pending-approval',
          isPending: true
        });
      }

      if (user.accountStatus === 'suspended') {
        return res.json({
          user,
          redirectPath: '/account-suspended',
          isSuspended: true,
          suspensionReason: user.statusReason
        });
      }

      // Determine redirect path based on user role
      let redirectPath = '/';
      switch (user.role) {
        case 'ecp':
          redirectPath = '/ecp/dashboard';
          break;
        case 'lab_tech':
        case 'engineer':
          redirectPath = '/lab/dashboard';
          break;
        case 'supplier':
          redirectPath = '/supplier/dashboard';
          break;
        case 'admin':
          redirectPath = '/admin/dashboard';
          break;
        default:
          redirectPath = '/';
      }

      res.json({
        user,
        redirectPath
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in bootstrap');
      res.status(500).json({ message: "Failed to bootstrap" });
    }
  });

  // Complete signup endpoint
  // SECURITY: Uses AuthRepository for audited cross-tenant access during authentication
  app.post('/api/auth/complete-signup', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      // Use AuthRepository with audit logging for signup flow
      const user = await authRepository.findUserById(userId, {
        ip: req.ip,
        reason: 'Complete signup flow'
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a role
      if (user.role) {
        return res.status(400).json({ message: "User already has a role assigned" });
      }

  const { role, organizationName, adminSetupKey, subscriptionPlan, gocNumber } = req.body as RoleSelectionBody;
      
      if (!role || !['ecp', 'lab_tech', 'engineer', 'supplier', 'admin', 'optometrist'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      // Validate GOC number for optometrists and ECPs
      if ((role === 'optometrist' || role === 'ecp') && !gocNumber) {
        return res.status(400).json({ message: "GOC registration number is required for optometrists and ECPs" });
      }

      const normalizedPlan = typeof subscriptionPlan === 'string' ? subscriptionPlan : undefined;
      if (normalizedPlan && normalizedPlan !== FULL_PLAN && normalizedPlan !== FREE_ECP_PLAN) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      const allowedPlan = role === 'ecp' ? FREE_ECP_PLAN : FULL_PLAN;
      const chosenPlan = normalizedPlan || allowedPlan;

      if (chosenPlan !== allowedPlan) {
        return res.status(400).json({
          message: role === 'ecp'
            ? "ECP accounts start on the free plan. Upgrade after activation to unlock advanced modules."
            : "This role requires the Full Experience plan.",
          allowedPlan,
        });
      }

      // Handle admin signup with key verification
      if (role === 'admin') {
        const expectedKey = process.env.ADMIN_SETUP_KEY;
        
        if (!expectedKey) {
          return res.status(500).json({ message: "Admin setup is not configured on this system" });
        }
        
        if (!adminSetupKey || adminSetupKey !== expectedKey) {
          return res.status(403).json({ message: "Invalid admin setup key" });
        }

        // Admin accounts are auto-approved
        const updatedUser = await storage.updateUser(userId, {
          role: 'admin',
          organizationName: organizationName || null,
          accountStatus: 'active',
          subscriptionPlan: chosenPlan,
          gocNumber: gocNumber || null,
        });

        // Initialize user roles
        await storage.addUserRole(userId, 'admin');

        return res.json(updatedUser);
      }

      // Update user with role and organization, set status to pending
      const updateData: any = {
        role,
        organizationName: organizationName || null,
        accountStatus: 'pending',
        subscriptionPlan: chosenPlan,
      };

      // Add GOC number if provided
      if (gocNumber) {
        updateData.gocNumber = gocNumber;
        updateData.gocRegistrationNumber = gocNumber;
      }

      // Set enhanced role for optometrist
      if (role === 'optometrist') {
        updateData.enhancedRole = 'optometrist';
      }

      const updatedUser = await storage.updateUser(userId, updateData);

      // Initialize user roles
      await storage.addUserRole(userId, role);

      res.json(updatedUser);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error completing signup');
      res.status(500).json({ message: "Failed to complete signup" });
    }
  });

  // Get user's available roles
  app.get('/api/auth/available-roles', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const roles = await storage.getUserAvailableRoles(userId);
      res.json({ roles });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching available roles');
      res.status(500).json({ message: "Failed to fetch available roles" });
    }
  });

  // Add a role to user
  app.post('/api/auth/add-role', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const { role } = req.body as { role: string };

      // Security: Use tenant-aware method instead of _Internal (P0-2 fix)
      const user = await authRepository.getUserByIdWithTenantCheck(
        userId,
        getRequestingUser(req),
        { reason: 'Add role to user', ip: req.ip }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Security check: only active users can add roles
      if (user.accountStatus !== 'active') {
        return res.status(403).json({ message: "Only active accounts can add additional roles" });
      }

      if (!role || !['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      // Only allow adding lab_tech/engineer or ecp roles
      if (!['ecp', 'lab_tech', 'engineer'].includes(role)) {
        return res.status(403).json({ message: "Cannot add this role type" });
      }

      // Check if user already has this role
      const existingRoles = await storage.getUserAvailableRoles(userId);
      if (existingRoles.includes(role)) {
        return res.status(400).json({ message: "Role already assigned to this user" });
      }

      await storage.addUserRole(userId, role);

      // Security: Use tenant-aware method instead of _Internal (P0-2 fix)
      const updatedUser = await authRepository.getUserWithRolesWithTenantCheck(
        userId,
        getRequestingUser(req),
        { reason: 'Fetch updated user with roles', ip: req.ip }
      );
      res.json(updatedUser);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error adding role');

      // Handle tenant isolation errors
      if (error instanceof Error && error.message.includes('Cannot access users from different tenant')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.status(500).json({ message: "Failed to add role" });
    }
  });

  // Switch active role
  app.post('/api/auth/switch-role', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const { role } = req.body as { role: string };

      if (!role || !['ecp', 'lab_tech', 'engineer', 'supplier', 'admin', 'company_admin', 'dispenser'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      const updatedUser = await storage.switchUserRole(userId, role);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update the session with the new role
      if (req.user && req.user.claims) {
        req.user.claims.role = role;
      }

      // Log the role switch for audit
      logger.info({ userId, newRole: role }, `User switched role to ${role}`);

      res.json(updatedUser);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error switching role');
      if (error instanceof Error && error.message.includes("does not have access")) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to switch role" });
      }
    }
  });

  // Email/Password Signup
  app.post('/api/auth/signup-email',
    asyncHandler(async (req, res) => {
      const { email, password, firstName, lastName, role, organizationName, adminSetupKey, subscriptionPlan } = req.body as {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: string;
        organizationName?: string;
        adminSetupKey?: string;
        subscriptionPlan?: string;
      };

      // Validation
      if (!email || !password || !firstName || !lastName || !role) {
        throw new BadRequestError("Email, password, first name, last name, and role are required");
      }

      const normalizedEmail = normalizeEmail(email);

      if (!['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
        throw new BadRequestError("Invalid role");
      }

      const normalizedPlan = typeof subscriptionPlan === 'string' ? subscriptionPlan : undefined;
      if (normalizedPlan && normalizedPlan !== FULL_PLAN && normalizedPlan !== FREE_ECP_PLAN) {
        throw new BadRequestError("Invalid subscription plan");
      }

      const allowedPlan = role === 'ecp' ? FREE_ECP_PLAN : FULL_PLAN;
      const chosenPlan = normalizedPlan || allowedPlan;

      if (chosenPlan !== allowedPlan) {
        throw new BadRequestError(
          role === 'ecp'
            ? "ECP accounts start on the free plan. Upgrade after activation to unlock advanced modules."
            : "This role requires the Full Experience plan.",
          { allowedPlan }
        );
      }

      if (password.length < 8) {
        throw new BadRequestError("Password must be at least 8 characters long");
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        throw new BadRequestError("Email already registered");
      }

      // Handle admin signup with key verification
      let accountStatus: 'pending' | 'active' = 'pending';
      if (role === 'admin') {
        const expectedKey = process.env.ADMIN_SETUP_KEY;
        
        if (!expectedKey) {
          throw new Error("Admin setup is not configured on this system");
        }
        
        if (!adminSetupKey || adminSetupKey !== expectedKey) {
          throw new UnauthorizedError("Invalid admin setup key");
        }

        // Admin accounts are auto-approved
        accountStatus = 'active';
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user in transaction
      const newUser = await withTransaction(async (client) => {
        return await storage.upsertUser({
          email: normalizedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          organizationName: organizationName || null,
          accountStatus,
          subscriptionPlan: chosenPlan,
        } as any);
      });

      // Create session
      req.login({
        claims: {
          sub: newUser.id,
          id: newUser.id
        },
        // Top-level email for compatibility with session/user typing
        email: newUser.email || '',
        local: true,
      }, (err) => {
        if (err) {
          logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Session creation error');
          throw new Error("Failed to create session");
        }
        
        res.status(201).json({
          message: "Account created successfully",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            accountStatus: newUser.accountStatus,
            subscriptionPlan: newUser.subscriptionPlan,
          }
        });
      });
    })
  );

  // Email/Password Login
  app.post('/api/auth/login-email',
    validateRequest(loginSchema),
    (req, res, next) => {
      const body = req.body as { email: string; password: string };
      body.email = normalizeEmail(body.email);

      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Login error');
          return res.status(500).json({ message: "Internal server error" });
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            logger.error({ error: loginErr instanceof Error ? loginErr.message : String(loginErr) }, 'Session error');
            return res.status(500).json({ message: "Failed to create session" });
          }

          // Fetch full user from database (login flow - no tenant check needed)
          authRepository.findUserById(user.claims.sub, { reason: "Login session establishment", ip: req.ip }).then((dbUser) => {
            if (!dbUser) {
              return res.status(404).json({ message: "User not found" });
            }

            // Get user permissions based on role
            const permissions = getUserPermissions(dbUser.role);

            // Generate JWT tokens for parallel authentication
            let tokens;
            try {
              tokens = jwtService.generateTokenPair({
                userId: dbUser.id,
                companyId: dbUser.companyId,
                email: dbUser.email,
                role: dbUser.role,
                permissions
              });
              logger.info(`Generated JWT tokens for user: ${dbUser.email}`);
            } catch (jwtError) {
              logger.warn(`Failed to generate JWT tokens: ${jwtError instanceof Error ? jwtError.message : String(jwtError)}`);
              // Continue without JWT tokens - session still works
            }

            res.json({
              message: "Login successful",
              user: {
                id: dbUser.id,
                email: dbUser.email,
                firstName: dbUser.firstName,
                lastName: dbUser.lastName,
                role: dbUser.role,
                accountStatus: dbUser.accountStatus,
                subscriptionPlan: dbUser.subscriptionPlan,
                permissions
              },
              // Include JWT tokens if generated
              ...(tokens && {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn
              })
            });
          }).catch((dbErr) => {
            logger.error({ error: dbErr instanceof Error ? dbErr.message : String(dbErr) }, 'Database error');
          res.status(500).json({ message: "Failed to fetch user data" });
        });
      });
    })(req, res, next);
  });

  // Logout (works for both Replit and local auth)
  app.post('/api/auth/logout-local', (req, res) => {
    req.logout((err) => {
      if (err) {
        logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Logout error');
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Order routes
  app.post('/api/orders', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;

      // Security: Use tenant-aware method instead of _Internal (P0-2 fix)
      const user = await authRepository.getUserByIdWithTenantCheck(
        userId,
        getRequestingUser(req),
        { reason: 'Create order - validate ECP role', ip: req.ip }
      );

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create orders" });
      }

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const validation = insertOrderSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      // Create patient record
      const { patientName, patientDOB, omaFileContent, omaFilename, ...orderData } = validation.data as Record<string, unknown>;
      
      const patient = await storage.createPatient({
        name: patientName,
        dateOfBirth: patientDOB || null,
        companyId: user.companyId,
        ecpId: userId,
      });

      // Parse OMA file if provided
      let omaParsedData = null;
      if (omaFileContent && isValidOMAFile(omaFileContent)) {
        omaParsedData = parseOMAFile(omaFileContent);
      }

      // Use OrderService for LIMS integration (Flow 1: Order Submission)
      // If LIMS is not configured, OrderService will skip LIMS validation
      try {
        const { OrderService } = await import('./services/OrderService');
        const { LimsClient } = await import('../packages/lims-client/src/LimsClient');
        
        // Initialize LIMS client if configured
        let limsClient = null;
        if (process.env.LIMS_API_BASE_URL && process.env.LIMS_API_KEY) {
          limsClient = new LimsClient({
            baseUrl: process.env.LIMS_API_BASE_URL,
            apiKey: process.env.LIMS_API_KEY,
            webhookSecret: process.env.LIMS_WEBHOOK_SECRET || '',
          });
        }
        
        // Use OrderService if LIMS is configured, otherwise fallback to direct storage
        if (limsClient && process.env.ENABLE_LIMS_VALIDATION !== 'false') {
          const orderService = new OrderService(limsClient, storage, {
            enableLimsValidation: true,
          });
          
          const order = await orderService.submitOrder({
            ...orderData,
            companyId: user.companyId,
            patientId: patient.id,
            ecpId: userId,
            omaFileContent: omaFileContent || null,
            omaFilename: omaFilename || null,
            omaParsedData,
          } as InsertOrder, userId);
          
          return res.status(201).json(order);
        }
      } catch (limsError) {
        // If LIMS is not available or OrderService fails, log but continue with direct storage
        // This allows the platform to work without LIMS in development/testing
        const errorMessage = limsError instanceof Error ? limsError.message : 'Unknown error';
        logger.warn({ details: errorMessage }, 'LIMS integration unavailable, creating order directly:');
      }

      // Fallback: Create order directly if LIMS is not configured
      const order = await storage.createOrder({
        ...orderData,
        companyId: user.companyId,
        patientId: patient.id,
        ecpId: userId,
        omaFileContent: omaFileContent || null,
        omaFilename: omaFilename || null,
        omaParsedData,
      } as InsertOrder);

      // Log order placement activity
      try {
        const { PatientActivityLogger } = await import("./lib/patientActivityLogger.js");
        await PatientActivityLogger.logOrderPlaced(
          user.companyId,
          patient.id,
          order.id,
          order.orderNumber,
          order,
          userId,
          `${user.firstName} ${user.lastName}`
        );
      } catch (logError) {
        logger.error({ error: logError instanceof Error ? logError.message : String(logError) }, 'Error logging order activity');
      }

      res.status(201).json(order);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, 'Error creating order');
      
      // Handle LIMS validation errors specifically
      const errorMsg = error instanceof Error ? error.message : '';
      if (errorMsg?.includes('LIMS') || errorMsg?.includes('validation')) {
        return res.status(400).json({ 
          message: "Order validation failed", 
          error: errorMsg,
          details: (error as {details?: unknown}).details || undefined
        });
      }
      
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can access orders
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer' && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, search, limit, offset } = req.query;
      
      const filters: any = {
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      // Add company filtering (admin can see all)
      if (user.role !== 'admin' && user.companyId) {
        filters.companyId = user.companyId;
      }

      // ECPs can only see their own orders
      if (user.role === 'ecp') {
        filters.ecpId = userId;
      }

      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching orders');
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can access orders
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrder(req.params.id, user.companyId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // ECPs can only see their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching order');
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // OMA file upload endpoint
  app.patch('/api/orders/:id/oma', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can upload OMA files
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrder(req.params.id, user.companyId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // ECPs can only upload to their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { fileContent, filename } = req.body as OMAFileBody;

      if (!fileContent || !filename) {
        return res.status(400).json({ message: "File content and filename are required" });
      }

      // Validate OMA file
      if (!isValidOMAFile(fileContent)) {
        return res.status(400).json({ message: "Invalid OMA file format" });
      }

      // Parse OMA file
      const parsedData = parseOMAFile(fileContent);

      // Update order with OMA file data
      const updatedOrder = await storage.updateOrder(req.params.id, {
        omaFileContent: fileContent,
        omaFilename: filename,
        omaParsedData: parsedData as any,
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error uploading OMA file');
      res.status(500).json({ message: "Failed to upload OMA file" });
    }
  });

  // Get OMA file endpoint
  app.get('/api/orders/:id/oma', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can access OMA files
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrder(req.params.id, user.companyId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // ECPs can only access their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!order.omaFileContent) {
        return res.status(404).json({ message: "No OMA file attached to this order" });
      }

      // Return OMA file data
      res.json({
        filename: order.omaFilename,
        content: order.omaFileContent,
        parsedData: order.omaParsedData,
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching OMA file');
      res.status(500).json({ message: "Failed to fetch OMA file" });
    }
  });

  // Delete OMA file endpoint
  app.delete('/api/orders/:id/oma', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can delete OMA files
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrder(req.params.id, user.companyId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // ECPs can only delete from their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Remove OMA file data
      const updatedOrder = await storage.updateOrder(req.params.id, {
        omaFileContent: null,
        omaFilename: null,
        omaParsedData: null,
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ message: "OMA file deleted successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error deleting OMA file');
      res.status(500).json({ message: "Failed to delete OMA file" });
    }
  });

  app.patch('/api/orders/:id/status', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Suppliers don't have access to order data in Phase 1
      if (user.role === 'supplier') {
        return res.status(403).json({ message: "Access denied. Purchase order functionality coming in Phase 2." });
      }
      
      // Only lab techs and engineers can update order status
      if (user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = updateOrderStatusSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Get current order to track status change
      const currentOrder = await storage.getOrder(req.params.id, user.companyId!);
      if (!currentOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const oldStatus = currentOrder.status;
      const order = await storage.updateOrderStatus(req.params.id, validation.data.status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Log order status update activity
      if (oldStatus !== validation.data.status && currentOrder.patientId) {
        try {
          const { PatientActivityLogger } = await import("./lib/patientActivityLogger.js");
          await PatientActivityLogger.logOrderUpdated(
            currentOrder.companyId,
            currentOrder.patientId,
            order.id,
            order.orderNumber,
            oldStatus,
            validation.data.status,
            userId,
            `${user.firstName} ${user.lastName}`
          );
        } catch (logError) {
          logger.error({ error: logError instanceof Error ? logError.message : String(logError) }, 'Error logging order status update');
        }
      }

      res.json(order);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating order status');
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Generate order sheet PDF
  app.get('/api/orders/:id/pdf', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const order = await storage.getOrder(req.params.id, user.companyId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access - ECPs can view their own orders, lab techs and engineers can view all
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const orderData: OrderSheetData = {
        orderNumber: order.orderNumber || order.id.slice(-8).toUpperCase(),
        orderDate: order.orderDate.toISOString().split('T')[0],
        patientName: order.patient?.name || 'Unknown Patient',
        patientDOB: order.patient?.dateOfBirth || undefined,
        ecpName: order.ecp?.organizationName || user.organizationName || 'Unknown Provider',
        status: order.status,
        lensType: order.lensType,
        lensMaterial: order.lensMaterial,
        coating: order.coating,
        frameType: order.frameType || undefined,
        rightEye: {
          sphere: order.odSphere || undefined,
          cylinder: order.odCylinder || undefined,
          axis: order.odAxis?.toString() || undefined,
          add: order.odAdd || undefined,
        },
        leftEye: {
          sphere: order.osSphere || undefined,
          cylinder: order.osCylinder || undefined,
          axis: order.osAxis?.toString() || undefined,
          add: order.osAdd || undefined,
        },
        pd: order.pd || undefined,
        notes: order.notes || undefined,
        customerReferenceNumber: order.customerReferenceNumber || undefined,
      };

      const pdfBuffer = await pdfService.generateOrderSheetPDF(orderData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="order-${orderData.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating order sheet PDF');
      res.status(500).json({ message: "Failed to generate order sheet PDF" });
    }
  });

  // Generate lab work ticket PDF
  app.get('/api/orders/:id/lab-ticket', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const order = await storage.getOrder(req.params.id, user.companyId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only lab techs, engineers, and admins can generate lab work tickets
      if (!user.role || !['lab_tech', 'engineer', 'admin', 'company_admin', 'platform_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied. Lab work tickets are only available to lab personnel." });
      }

      // Build comprehensive lab work ticket data
      const ticketData: LabWorkTicketData = {
        orderInfo: {
          orderId: order.id,
          orderNumber: order.orderNumber || order.id.slice(-8).toUpperCase(),
          customerId: order.customerReferenceNumber || order.patient?.id.slice(-6).toUpperCase(),
          customerName: order.patient?.name || 'Unknown Patient',
          dispenser: order.ecp?.organizationName || 'Unknown Dispenser',
          phone: order.patient?.emergencyContactPhone || undefined,
          dispenseDate: order.orderDate.toISOString().split('T')[0],
          collectionDate: order.dueDate?.toISOString().split('T')[0] || undefined,
          jobStatus: order.status,
        },
        frameInfo: {
          sku: order.frameType || undefined,
          description: order.frameType || 'Frame Not Specified',
          pairType: 'R/L',
        },
        lensInfo: {
          rightLensDesc: order.lensType,
          leftLensDesc: order.lensType,
          material: order.lensMaterial,
          design: order.lensType,
        },
        prescription: {
          right: {
            sph: order.odSphere || undefined,
            cyl: order.odCylinder || undefined,
            axis: order.odAxis?.toString() || undefined,
            add: order.odAdd || undefined,
            // Note: Prism values would need to be added to the order schema
            hPrism: undefined,
            hBase: undefined,
            vPrism: undefined,
            vBase: undefined,
          },
          left: {
            sph: order.osSphere || undefined,
            cyl: order.osCylinder || undefined,
            axis: order.osAxis?.toString() || undefined,
            add: order.osAdd || undefined,
            hPrism: undefined,
            hBase: undefined,
            vPrism: undefined,
            vBase: undefined,
          },
        },
        finishing: {
          rightPD: order.pd ? (parseFloat(order.pd) / 2).toFixed(1) : undefined,
          leftPD: order.pd ? (parseFloat(order.pd) / 2).toFixed(1) : undefined,
          totalPD: order.pd || undefined,
          rightHeight: undefined,
          leftHeight: undefined,
          rightOCHeight: undefined,
          leftOCHeight: undefined,
          rightInset: undefined,
          leftInset: undefined,
          bevelType: 'Auto',
          drillCoords: undefined,
          frameWrapAngle: undefined,
          polish: 'Edge',
        },
        treatments: [order.coating],
        labInstructions: order.notes || 'Follow standard laboratory procedures',
        qualityControl: {
          surfacingQC: false,
          coatingQC: false,
          finishingQC: false,
          finalInspection: false,
        },
        metadata: {
          ecpName: order.ecp?.organizationName || user.organizationName || 'Unknown Provider',
          patientDOB: order.patient?.dateOfBirth || undefined,
          notes: order.notes || undefined,
        },
      };

      const pdfBuffer = await labWorkTicketService.generateLabWorkTicketPDF(ticketData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="lab-ticket-${ticketData.orderInfo.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating lab work ticket PDF');
      res.status(500).json({ message: "Failed to generate lab work ticket PDF" });
    }
  });

  // Email order sheet
  app.post('/api/orders/:id/email', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const order = await storage.getOrder(req.params.id, user.companyId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access - ECPs can email their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get recipient email from request body or use patient email
      const { recipientEmail } = req.body as EmailBody;
      const toEmail = recipientEmail || order.patient?.email;

      if (!toEmail) {
        return res.status(400).json({ message: "No email address available for this order" });
      }

      const orderData: OrderSheetData = {
        orderNumber: order.orderNumber || order.id.slice(-8).toUpperCase(),
        orderDate: order.orderDate.toISOString().split('T')[0],
        patientName: order.patient?.name || 'Unknown Patient',
        patientDOB: order.patient?.dateOfBirth || undefined,
        ecpName: order.ecp?.organizationName || user.organizationName || 'Unknown Provider',
        status: order.status,
        lensType: order.lensType,
        lensMaterial: order.lensMaterial,
        coating: order.coating,
        frameType: order.frameType || undefined,
        rightEye: {
          sphere: order.odSphere || undefined,
          cylinder: order.odCylinder || undefined,
          axis: order.odAxis?.toString() || undefined,
          add: order.odAdd || undefined,
        },
        leftEye: {
          sphere: order.osSphere || undefined,
          cylinder: order.osCylinder || undefined,
          axis: order.osAxis?.toString() || undefined,
          add: order.osAdd || undefined,
        },
        pd: order.pd || undefined,
        notes: order.notes || undefined,
        customerReferenceNumber: order.customerReferenceNumber || undefined,
      };

      const pdfBuffer = await pdfService.generateOrderSheetPDF(orderData);

      await emailService.sendEmail({
        to: toEmail,
        subject: `Order Sheet #${orderData.orderNumber}`,
        text: `Your order sheet for ${order.patient?.name} is attached.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Order Sheet #${orderData.orderNumber}</h2>
            <p>Dear ${order.patient?.name || 'Valued Customer'},</p>
            <p>Please find attached the order sheet for your lens order.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              <strong>Order Details:</strong><br/>
              Order Number: ${orderData.orderNumber}<br/>
              Order Date: ${orderData.orderDate}<br/>
              Status: ${orderData.status}<br/>
            </div>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              This email was sent by ${user.organizationName || 'Integrated Lens System'}
            </p>
          </div>
        `,
        attachments: [{
          filename: `order-${orderData.orderNumber}.pdf`,
          content: pdfBuffer,
        }],
      });

      res.json({ message: "Order sheet sent successfully via email" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error sending order sheet email');
      res.status(500).json({ message: "Failed to send order sheet email" });
    }
  });

  // Suppliers routes
  app.get('/api/suppliers', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can view suppliers" });
      }

      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching suppliers');
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can create suppliers" });
      }

      const validation = insertSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const supplier = await storage.createSupplier(validation.data);
      res.status(201).json(supplier);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating supplier');
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.patch('/api/suppliers/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can update suppliers" });
      }

      const validation = updateSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const supplier = await storage.updateSupplier(req.params.id, validation.data);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json(supplier);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating supplier');
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can delete suppliers" });
      }

      const deleted = await storage.deleteSupplier(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error deleting supplier');
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Stats routes
  app.get('/api/stats', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can access stats
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      // ECPs get stats for their own orders
      const ecpId = user.role === 'ecp' ? userId : undefined;
      const stats = await storage.getOrderStats(ecpId);
      
      res.json(stats);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching stats');
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Consult Log routes (Phase 2)
  app.post('/api/consult-logs', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create consult logs" });
      }

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "lab consultations")) {
        return;
      }

      const validation = insertConsultLogSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const log = await storage.createConsultLog({
        ...validation.data,
        companyId: user.companyId,
        ecpId: userId,
      });

      res.status(201).json(log);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating consult log');
      res.status(500).json({ message: "Failed to create consult log" });
    }
  });

  app.get('/api/consult-logs', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can view consult logs
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (user.role === 'ecp' && denyFreePlanAccess(user, res, "lab consultations")) {
        return;
      }

      const logs = await storage.getAllConsultLogs(user.role === 'ecp' ? userId : undefined);
      res.json(logs);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching consult logs');
      res.status(500).json({ message: "Failed to fetch consult logs" });
    }
  });

  app.get('/api/orders/:orderId/consult-logs', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can view consult logs
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (user.role === 'ecp' && denyFreePlanAccess(user, res, "lab consultations")) {
        return;
      }

      const logs = await storage.getConsultLogs(req.params.orderId);
      res.json(logs);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching consult logs');
      res.status(500).json({ message: "Failed to fetch consult logs" });
    }
  });

  app.patch('/api/consult-logs/:id/respond', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can respond to consult logs" });
      }

      const { response } = req.body as FeedbackResponseBody;
      if (!response || typeof response !== 'string') {
        return res.status(400).json({ message: "Response is required" });
      }

      const log = await storage.respondToConsultLog(req.params.id, response);
      
      if (!log) {
        return res.status(404).json({ message: "Consult log not found" });
      }

      res.json(log);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error responding to consult log');
      res.status(500).json({ message: "Failed to respond to consult log" });
    }
  });

  // Purchase Order routes (Phase 2)
  app.post('/api/purchase-orders', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can create purchase orders" });
      }

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const { lineItems, ...poData } = req.body as { lineItems: unknown[]; [key: string]: unknown };

      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ message: "At least one line item is required" });
      }

      const poValidation = insertPurchaseOrderSchema.safeParse(poData);
      if (!poValidation.success) {
        const validationError = fromZodError(poValidation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const po = await storage.createPurchaseOrder({
        ...poValidation.data,
        companyId: user.companyId,
        lineItems,
      }, userId);

      res.status(201).json(po);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating purchase order');
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  app.get('/api/purchase-orders', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, limit, offset } = req.query;
      
      const filters: any = {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      // Suppliers can only see their own POs
      if (user.role === 'supplier') {
        filters.supplierId = userId;
      }

      const pos = await storage.getPurchaseOrders(filters);
      res.json(pos);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching purchase orders');
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get('/api/purchase-orders/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const po = await storage.getPurchaseOrder(req.params.id);
      
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      // Suppliers can only see their own POs
      if (user.role === 'supplier' && po.supplierId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(po);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching purchase order');
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.patch('/api/purchase-orders/:id/status', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = updatePOStatusSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { status, trackingNumber, actualDeliveryDate } = validation.data;

      const po = await storage.updatePOStatus(
        req.params.id, 
        status,
        trackingNumber,
        actualDeliveryDate ? new Date(actualDeliveryDate) : undefined
      );
      
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      res.json(po);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating purchase order status');
      res.status(500).json({ message: "Failed to update purchase order status" });
    }
  });

  // Technical Document routes (Phase 2)
  app.post('/api/technical-documents', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'supplier') {
        return res.status(403).json({ message: "Only suppliers can upload technical documents" });
      }

      const validation = insertTechnicalDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const doc = await storage.createTechnicalDocument(validation.data, userId);

      res.status(201).json(doc);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating technical document');
      res.status(500).json({ message: "Failed to create technical document" });
    }
  });

  app.get('/api/technical-documents', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Suppliers can only see their own documents
      const supplierId = user.role === 'supplier' ? userId : undefined;
      const docs = await storage.getTechnicalDocuments(supplierId);
      
      res.json(docs);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching technical documents');
      res.status(500).json({ message: "Failed to fetch technical documents" });
    }
  });

  app.delete('/api/technical-documents/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'supplier') {
        return res.status(403).json({ message: "Only suppliers can delete their own documents" });
      }

      const deleted = await storage.deleteTechnicalDocument(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Technical document not found or access denied" });
      }

      res.status(204).send();
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error deleting technical document');
      res.status(500).json({ message: "Failed to delete technical document" });
    }
  });

  // PDF and Email routes
  app.get('/api/purchase-orders/:id/pdf', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer' && user.role !== 'supplier')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const po = await storage.getPurchaseOrderById(req.params.id);
      
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Suppliers can only access their own POs
      if (user.role === 'supplier' && po.supplierId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const pdfDoc = generatePurchaseOrderPDF(po as any);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="PO-${po.poNumber}.pdf"`);
      
      pdfDoc.pipe(res);
      pdfDoc.on('error', (error) => {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'PDF generation error');
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to generate PDF" });
        }
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating PDF');
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate PDF" });
      }
    }
  });

  app.post('/api/purchase-orders/:id/email', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can email purchase orders" });
      }

      const po = await storage.getPurchaseOrderById(req.params.id);
      
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      if (!po.supplier.email) {
        return res.status(400).json({ message: "Supplier email not found" });
      }

      // Generate PDF as buffer
      const pdfDoc = generatePurchaseOrderPDF(po as any);
      const chunks: Buffer[] = [];
      
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      
      await new Promise<void>((resolve, reject) => {
        pdfDoc.on('end', () => resolve());
        pdfDoc.on('error', reject);
      });

      const pdfBuffer = Buffer.concat(chunks);

      await sendPurchaseOrderEmail(
        po.supplier.email,
        po.supplier.organizationName || 'Supplier',
        po.poNumber,
        pdfBuffer,
        po.supplier.accountNumber || undefined
      );

      res.json({ message: "Email sent successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error sending email');
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  const markOrderShippedSchema = z.object({
    trackingNumber: z.string().min(1, "Tracking number is required"),
  });

  app.patch('/api/orders/:id/ship', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can mark orders as shipped" });
      }

      const validation = markOrderShippedSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const order = await storage.markOrderAsShipped(req.params.id, validation.data.trackingNumber);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Send email to ECP
      const ecp = await storage.getUser(order.ecpId, user.companyId!);
      if (ecp && ecp.email) {
        await sendShipmentNotificationEmail(
          ecp.email,
          `${ecp.firstName || ''} ${ecp.lastName || ''}`.trim() || 'Customer',
          order.orderNumber,
          order.patient.name,
          validation.data.trackingNumber
        );
      }

      res.json(order);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error marking order as shipped');
      res.status(500).json({ message: "Failed to mark order as shipped" });
    }
  });

  // Settings routes
  app.get('/api/settings/organization', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer' && user.role !== 'platform_admin' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only lab staff or admins can view organization settings" });
      }

      const settings = await storage.getOrganizationSettings();
      res.json(settings || {});
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching organization settings');
      res.status(500).json({ message: "Failed to fetch organization settings" });
    }
  });

  app.put('/api/settings/organization', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer' && user.role !== 'platform_admin' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only lab staff or admins can update organization settings" });
      }

      const validation = updateOrganizationSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const settings = await storage.updateOrganizationSettings(validation.data, userId);
      res.json(settings);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating organization settings');
      res.status(500).json({ message: "Failed to update organization settings" });
    }
  });

  app.get('/api/settings/preferences', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || {});
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching user preferences');
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.put('/api/settings/preferences', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      
      const validation = updateUserPreferencesSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const preferences = await storage.updateUserPreferences(userId, validation.data);
      res.json(preferences);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating user preferences');
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching all users');
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching user stats');
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.patch('/api/admin/users/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUserId = req.params.id;
      const { role, accountStatus, statusReason } = req.body as UserUpdateBody;

      // Validate updates
      const updates: Partial<UserUpdateBody> = {};
      if (role !== undefined && role !== null) {
        if (!['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        updates.role = role;
      }
      if (accountStatus !== undefined && accountStatus !== null) {
        if (!['pending', 'active', 'suspended'].includes(accountStatus)) {
          return res.status(400).json({ message: "Invalid account status" });
        }
        updates.accountStatus = accountStatus;
      }
      if (statusReason !== undefined) {
        updates.statusReason = statusReason;
      }

      const updatedUser = await storage.updateUser(targetUserId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating user');
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUserId = req.params.id;

      // Prevent admin from deleting themselves
      if (userId === targetUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Get the target user to verify it exists and check status
      const targetUser = await storage.getUser(targetUserId, user.companyId!);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Optional: Only allow deleting suspended users
      // Uncomment the following to enforce this restriction
      // if (targetUser.accountStatus !== 'suspended') {
      //   return res.status(400).json({ message: "Can only delete suspended users" });
      // }

      const deleted = await storage.deleteUser(targetUserId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ message: "User deleted successfully", id: targetUserId });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error deleting user');
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ==================== Platform Admin Routes ====================
  
  // Platform admin - Get all users across all companies
  app.get('/api/platform-admin/users', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'platform_admin') {
        return res.status(403).json({ message: "Platform admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching users');
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Platform admin - Get all companies
  app.get('/api/platform-admin/companies', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'platform_admin') {
        return res.status(403).json({ message: "Platform admin access required" });
      }

      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching companies');
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Platform admin - Update any user
  app.patch('/api/platform-admin/users/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'platform_admin') {
        return res.status(403).json({ message: "Platform admin access required" });
      }

      const updatedUser = await storage.updateUser(req.params.id, req.body as Partial<UserUpdateBody>);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating user');
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Platform admin - Reset user password
  app.post('/api/platform-admin/users/:id/reset-password', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'platform_admin') {
        return res.status(403).json({ message: "Platform admin access required" });
      }

      const { password } = req.body as PasswordUpdateBody;
      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const hashedPassword = await hashPassword(password);
      const updatedUser = await storage.updateUser(req.params.id, { 
        password: hashedPassword 
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error resetting password');
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Platform admin - Delete any user
  app.delete('/api/platform-admin/users/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'platform_admin') {
        return res.status(403).json({ message: "Platform admin access required" });
      }

      const targetUserId = req.params.id;

      // Prevent deleting yourself
      if (userId === targetUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(targetUserId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error deleting user');
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ==================== Company Admin Routes ====================
  
  // Company admin - Get company profile
  app.get('/api/company-admin/profile', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'company_admin') {
        return res.status(403).json({ message: "Company admin access required" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(company);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching company profile');
      res.status(500).json({ message: "Failed to fetch company profile" });
    }
  });

  // Company admin - Update company profile
  app.patch('/api/company-admin/profile', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'company_admin') {
        return res.status(403).json({ message: "Company admin access required" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const updatedCompany = await storage.updateCompany(user.companyId, req.body as Record<string, unknown>);
      if (!updatedCompany) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(updatedCompany);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating company');
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Company admin - Get company users
  app.get('/api/company-admin/users', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'company_admin') {
        return res.status(403).json({ message: "Company admin access required" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const allUsers = await storage.getAllUsers();
      const users = allUsers.filter(u => u.companyId === user.companyId);
      res.json(users);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching company users');
      res.status(500).json({ message: "Failed to fetch company users" });
    }
  });

  // Company admin - Get supplier relationships
  app.get('/api/company-admin/suppliers', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'company_admin') {
        return res.status(403).json({ message: "Company admin access required" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const suppliers = await storage.getCompanySupplierRelationships(user.companyId);
      res.json(suppliers);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching suppliers');
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Company admin - Add user to company (including optometrists)
  app.post('/api/company-admin/users', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'company_admin') {
        return res.status(403).json({ message: "Company admin access required" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const {
        firstName,
        lastName,
        email,
        role,
        enhancedRole,
        gocNumber,
        gocRegistrationNumber,
        gocRegistrationType,
        professionalQualifications,
        contactPhone
      } = req.body as UserUpdateBody;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      if (!role && !enhancedRole) {
        return res.status(400).json({ message: "Either role or enhanced role is required" });
      }

      // Validate GOC number for optometrists
      if ((enhancedRole === 'optometrist' || role === 'ecp') && !gocNumber && !gocRegistrationNumber) {
        return res.status(400).json({ message: "GOC registration number is required for optometrists" });
      }

      // Check if user already exists
      const normalizedEmail = normalizeEmail(email);
      const allUsers = await storage.getAllUsers();
      const existingUser = allUsers.find(u => normalizeEmail(u.email || '') === normalizedEmail);
      
      if (existingUser) {
        // If user exists and is already in this company
        if (existingUser.companyId === user.companyId) {
          return res.status(400).json({ message: "User already exists in your company" });
        }
        // If user exists but in different company
        return res.status(400).json({ message: "User already has an account. They need to join your company through the company join flow." });
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
      const hashedPassword = await hashPassword(tempPassword);

      // Create the new user using upsertUser
      const newUser = await storage.upsertUser({
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'ecp',
        enhancedRole: enhancedRole || undefined,
        companyId: user.companyId,
        accountStatus: 'active', // Directly activate since added by admin
        gocNumber: gocNumber || gocRegistrationNumber || undefined,
        gocRegistrationNumber: gocRegistrationNumber || gocNumber || undefined,
        gocRegistrationType: gocRegistrationType || undefined,
        professionalQualifications: professionalQualifications || undefined,
        contactPhone: contactPhone || undefined,
        subscriptionPlan: 'full',
        isVerified: true,
      });

      // TODO: Send welcome email with temporary password
      // await emailService.sendWelcomeEmail(newUser.email, tempPassword);

      res.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          enhancedRole: newUser.enhancedRole,
          gocNumber: newUser.gocNumber,
          accountStatus: newUser.accountStatus,
        },
        temporaryPassword: tempPassword,
        message: "User added successfully. Please share the temporary password securely with the user."
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error adding user to company');
      res.status(500).json({ message: "Failed to add user to company" });
    }
  });

  // Company admin - Update user in company
  app.patch('/api/company-admin/users/:userId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminUserId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(adminUserId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'company_admin') {
        return res.status(403).json({ message: "Company admin access required" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const { userId } = req.params;
      const targetUser = await storage.getUser(userId, user.companyId!);

      if (!targetUser || targetUser.companyId !== user.companyId) {
        return res.status(404).json({ message: "User not found in your company" });
      }

      const bodyData = req.body as Record<string, unknown>;
      const updates: Record<string, unknown> = {};
      const allowedUpdates = [
        'firstName', 'lastName', 'contactPhone', 'gocNumber',
        'gocRegistrationNumber', 'gocRegistrationType',
        'professionalQualifications', 'accountStatus', 'enhancedRole'
      ];

      for (const field of allowedUpdates) {
        if (bodyData[field] !== undefined) {
          updates[field] = bodyData[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating user');
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Company admin - Remove user from company
  app.delete('/api/company-admin/users/:userId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminUserId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(adminUserId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'company_admin') {
        return res.status(403).json({ message: "Company admin access required" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const { userId } = req.params;
      
      // Prevent admin from removing themselves
      if (userId === adminUserId) {
        return res.status(400).json({ message: "Cannot remove yourself" });
      }

      const targetUser = await storage.getUser(userId, user.companyId!);

      if (!targetUser || targetUser.companyId !== user.companyId) {
        return res.status(404).json({ message: "User not found in your company" });
      }

      // Remove user from company (set companyId to null and status to pending)
      await storage.updateUser(userId, {
        companyId: null,
        accountStatus: 'suspended'
      });

      res.json({ message: "User removed from company successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error removing user');
      res.status(500).json({ message: "Failed to remove user" });
    }
  });

  // ==================== Phase 7: ECP Clinical & Retail Module ====================
  
  // Patient routes
  app.get('/api/patients', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view patients" });
      }

      if (denyFreePlanAccess(user, res, "patient records")) {
        return;
      }

      const patients = await storage.getPatients(userId, user.companyId || undefined);
      res.json(patients);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching patients');
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get('/api/patients/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view patients" });
      }

      if (denyFreePlanAccess(user, res, "patient records")) {
        return;
      }

      const patient = await storage.getPatient(req.params.id, user.companyId!);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(patient);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching patient');
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  // Patient 360 View - Comprehensive Summary
  app.get('/api/patients/:id/summary', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view patient summaries" });
      }

      if (denyFreePlanAccess(user, res, "patient records")) {
        return;
      }

      const patientId = req.params.id;

      // Parallel fetch all patient-related data
      const [
        patient,
        appointments,
        examinations,
        prescriptions,
        orders,
        invoices
      ] = await Promise.all([
        db.select().from(schema.patients).where(eq(schema.patients.id, patientId)).limit(1).then((r: any) => r[0]),
        db.select().from(schema.testRoomBookings).where(eq(schema.testRoomBookings.patientId, patientId)).orderBy(desc(schema.testRoomBookings.bookingDate)),
        db.select().from(schema.eyeExaminations).where(eq(schema.eyeExaminations.patientId, patientId)).orderBy(desc(schema.eyeExaminations.examinationDate)),
        db.select().from(schema.prescriptions).where(eq(schema.prescriptions.patientId, patientId)).orderBy(desc(schema.prescriptions.issueDate)),
        db.select().from(schema.orders).where(eq(schema.orders.patientId, patientId)).orderBy(desc(schema.orders.orderDate)),
        db.select().from(schema.invoices).where(eq(schema.invoices.patientId, patientId)).orderBy(desc(schema.invoices.invoiceDate))
      ]);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Verify access
      if (patient.ecpId !== userId && patient.companyId !== user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Calculate summary stats
      const totalSpent = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0);

      const pendingBalance = invoices
        .filter((inv: any) => inv.status === 'draft')
        .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0);

      const summary = {
        patient,
        stats: {
          totalVisits: examinations.length,
          totalOrders: orders.length,
          totalSpent,
          pendingBalance,
          lastVisit: examinations[0]?.examinationDate || null,
          nextAppointment: appointments.find((apt: any) => 
            apt.status === 'scheduled' && new Date(apt.bookingDate) > new Date()
          )?.bookingDate || null
        },
        appointments: appointments.slice(0, 10), // Last 10 appointments
        examinations: examinations.slice(0, 5),  // Last 5 exams
        prescriptions: prescriptions.slice(0, 5), // Last 5 prescriptions
        orders: orders.slice(0, 10),             // Last 10 orders
        invoices: invoices.slice(0, 10)          // Last 10 invoices
      };

      res.json(summary);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching patient summary');
      res.status(500).json({ message: "Failed to fetch patient summary" });
    }
  });

  // Generate patient examination form PDF
  app.get('/api/patients/:id/examination-form', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ECPs, lab staff, and admins can generate exam forms
      if (!user.role || !['ecp', 'lab_tech', 'engineer', 'admin', 'company_admin', 'platform_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatient(req.params.id, user.companyId!);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Calculate age from date of birth
      const calculateAge = (dob: string): number => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      // Get the most recent order for habitual Rx
      const recentOrders = await storage.getOrders({
        ecpId: patient.ecpId,
        companyId: user.companyId || undefined,
        limit: 1
      });
      const lastOrder = recentOrders && recentOrders.length > 0 ? recentOrders[0] : null;

      // Get the most recent examination if available (if method exists)
      let lastExam = null;
      try {
        if (typeof (storage as any).getExaminationsForPatient === 'function') {
          const examinations = await (storage as any).getExaminationsForPatient(patient.id);
          lastExam = examinations && examinations.length > 0 ? examinations[0] : null;
        }
      } catch (err) {
        // Method doesn't exist, continue without exam data
      }

      // Build examination form data
      const formData: ExaminationFormData = {
        patientDemographics: {
          customerId: patient.customerNumber || patient.id.slice(-6).toUpperCase(),
          title: (patient as any).title || undefined,
          firstName: patient.name.split(' ')[0] || patient.name,
          surname: patient.name.split(' ').slice(1).join(' ') || '',
          dateOfBirth: patient.dateOfBirth || 'Not provided',
          age: patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 0,
          contact: patient.email || patient.emergencyContactPhone || 'Not provided',
          address: [
            (patient as any).addressLine1,
            (patient as any).addressLine2,
            (patient as any).city,
            (patient as any).postalCode
          ].filter(Boolean).join(', ') || undefined,
          ethnicity: (patient as any).ethnicity || undefined,
        },
        appointmentDetails: {
          appointmentDate: new Date().toLocaleDateString('en-GB'),
          appointmentTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          appointmentType: undefined, // Can be populated from appointment system if integrated
          appointmentReason: undefined,
          nhsOrPrivate: 'Private', // Default, can be changed
          lastSightTest: lastExam ? new Date(lastExam.examinationDate).toLocaleDateString('en-GB') : undefined,
          lastContactLensCheck: undefined, // Can be populated if tracked
        },
        habitualRx: lastOrder ? {
          right: {
            sph: lastOrder.odSphere || undefined,
            cyl: lastOrder.odCylinder || undefined,
            axis: lastOrder.odAxis?.toString() || undefined,
            prism: undefined, // Add if available in future
            add: lastOrder.odAdd || undefined,
            type: lastOrder.lensType || undefined,
            pd: lastOrder.pd ? (parseFloat(lastOrder.pd) / 2).toFixed(1) : undefined,
            oc: undefined,
            va: undefined,
          },
          left: {
            sph: lastOrder.osSphere || undefined,
            cyl: lastOrder.osCylinder || undefined,
            axis: lastOrder.osAxis?.toString() || undefined,
            prism: undefined,
            add: lastOrder.osAdd || undefined,
            type: lastOrder.lensType || undefined,
            pd: lastOrder.pd ? (parseFloat(lastOrder.pd) / 2).toFixed(1) : undefined,
            oc: undefined,
            va: undefined,
          },
        } : undefined,
        clinicalNotes: {
          appointmentNotes: req.query.notes as string || undefined,
          previousNotes: (patient as any).notes || undefined,
        },
        practiceInfo: {
          practiceName: user.organizationName || user.companyId || 'Optical Practice',
          practiceAddress: undefined, // Can be populated from company settings
          practicePhone: undefined, // Can be populated from company settings
        },
      };

      const pdfBuffer = await examinationFormService.generateExaminationFormPDF(formData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="exam-form-${patient.customerNumber || patient.id.slice(-6)}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating examination form PDF');
      res.status(500).json({ message: "Failed to generate examination form PDF" });
    }
  });

  app.post('/api/patients', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can add patients" });
      }

      if (denyFreePlanAccess(user, res, "adding patients")) {
        return;
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User must be associated with a company" });
      }

      // Auto-detect timezone from postcode or IP
      const { autoDetectTimezone } = await import("./lib/timezoneDetector.js");
      const ipAddressRaw = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const ipAddress = Array.isArray(ipAddressRaw) ? ipAddressRaw[0] : ipAddressRaw;
      const bodyData = req.body as Record<string, unknown>;
      const timezoneInfo = await autoDetectTimezone(bodyData.postcode as string | undefined, ipAddress);

      // Prepare patient data with auto-generated fields
      const patientDataToValidate = {
        ...bodyData,
        companyId: user.companyId,
        ecpId: userId,
        timezone: timezoneInfo.timezone,
        timezoneOffset: timezoneInfo.offset,
        updatedAt: new Date(),
      };

      // Validate patient data against schema
      const validation = insertPatientSchema.safeParse(patientDataToValidate);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        logger.error({
          error: validationError.message,
          issues: validation.error.issues,
          userId,
          companyId: user.companyId
        }, 'Patient validation failed');
        return res.status(400).json({
          message: validationError.message,
          errors: validation.error.issues
        });
      }

      const patientData = addCreationTimestamp(validation.data, req);

      const patient = await storage.createPatient(patientData);

      // Log patient creation activity
      const { PatientActivityLogger } = await import("./lib/patientActivityLogger.js");
      await PatientActivityLogger.logProfileCreated(
        user.companyId,
        patient.id,
        patientData,
        userId,
        `${user.firstName} ${user.lastName}`,
        { ipAddress, userAgent: req.headers['user-agent'] }
      );

      res.status(201).json(patient);
    } catch (error) {
      // Log detailed error information
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : { error: String(error) };

      logger.error({
        ...errorDetails,
        userId: req.user?.claims?.sub || req.user?.id,
        endpoint: '/api/patients',
        method: 'POST'
      }, 'Error creating patient');

      // Return more specific error message if available
      const errorMessage = error instanceof Error && error.message.includes('generate_customer_number')
        ? "Database configuration error. Please contact support."
        : error instanceof Error
        ? `Failed to create patient: ${error.message}`
        : "Failed to create patient";

      res.status(500).json({ message: errorMessage });
    }
  });

  app.patch('/api/patients/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update patients" });
      }

      if (denyFreePlanAccess(user, res, "patient records")) {
        return;
      }

      const patient = await storage.getPatient(req.params.id, user.companyId!);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update timezone if postcode changed
      const updateBodyData = req.body as Record<string, unknown>;
      let timezoneUpdate = {};
      if (updateBodyData.postcode && updateBodyData.postcode !== patient.postcode) {
        const { autoDetectTimezone } = await import("./lib/timezoneDetector.js");
        const ipAddressRaw = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const ipAddress = Array.isArray(ipAddressRaw) ? ipAddressRaw[0] : ipAddressRaw;
        const timezoneInfo = await autoDetectTimezone(updateBodyData.postcode as string, ipAddress);
        timezoneUpdate = {
          timezone: timezoneInfo.timezone,
          timezoneOffset: timezoneInfo.offset,
        };
      }

      const patientData = addUpdateTimestamp({
        ...updateBodyData,
        ...timezoneUpdate,
        updatedAt: new Date(),
      }, req, patient);
      
      const updatedPatient = await storage.updatePatient(req.params.id, patientData);
      
      // Log patient update activity
      const { PatientActivityLogger } = await import("./lib/patientActivityLogger.js");
      await PatientActivityLogger.logProfileUpdated(
        patient.companyId,
        patient.id,
        patient,
        { ...patient, ...patientData },
        userId,
        `${user.firstName} ${user.lastName}`,
        { 
          ipAddress: Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress),
          userAgent: req.headers['user-agent']
        }
      );
      
      res.json(updatedPatient);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating patient');
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Get patient activity history
  app.get('/api/patients/:id/history', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user) {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatient(req.params.id, user.companyId!);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Check access (ECP who created patient or company admin)
      if (patient.ecpId !== userId && patient.companyId !== user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { PatientActivityLogger } = await import("./lib/patientActivityLogger.js");
      
      const options: any = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      };
      
      if (req.query.activityTypes) {
        options.activityTypes = (req.query.activityTypes as string).split(',');
      }
      
      if (req.query.startDate) {
        options.startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        options.endDate = new Date(req.query.endDate as string);
      }
      
      const history = await PatientActivityLogger.getPatientHistory(
        patient.id,
        patient.companyId,
        options
      );
      
      res.json(history);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching patient history');
      res.status(500).json({ message: "Failed to fetch patient history" });
    }
  });

  // Shopify Integration routes
  app.get('/api/shopify/status', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can access Shopify integration" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User must be associated with a company" });
      }

      const { shopifyService } = await import("./services/ShopifyService");
      const status = await shopifyService.getSyncStatus(user.companyId);
      res.json(status);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching Shopify status');
      res.status(500).json({ message: "Failed to fetch Shopify status" });
    }
  });

  app.post('/api/shopify/verify', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can configure Shopify" });
      }

      const { shopUrl, accessToken, apiVersion } = req.body as ShopifyConfigBody;

      if (!shopUrl || !accessToken) {
        return res.status(400).json({ message: "Shop URL and access token are required" });
      }

      const { shopifyService } = await import("./services/ShopifyService");
      const result = await shopifyService.verifyConnection({
        shopUrl,
        accessToken,
        apiVersion: apiVersion || '2024-10',
      });

      res.json(result);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error verifying Shopify connection');
      res.status(500).json({ message: "Failed to verify connection" });
    }
  });

  app.post('/api/shopify/sync', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can sync Shopify data" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User must be associated with a company" });
      }

      if (denyFreePlanAccess(user, res, "Shopify integration")) {
        return;
      }

      const { shopifyService } = await import("./services/ShopifyService");
      const result = await shopifyService.syncCustomers(user.companyId, user);
      
      res.json({
        ...result,
        message: result.message || "Sync completed",
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error syncing Shopify customers');
      res.status(500).json({ message: "Failed to sync customers" });
    }
  });

  // Eye Examination routes
  app.get('/api/examinations', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view examinations" });
      }

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
      }

      // Multi-tenancy: filter by patient ID if provided, otherwise by ECP
      const patientId = req.query.patientId as string | undefined;
      let examinations;
      
      if (patientId) {
        examinations = await storage.getPatientExaminations(patientId, user.companyId || undefined);
      } else {
        examinations = await storage.getEyeExaminations(userId, user.companyId || undefined);
      }
      
      res.json(examinations);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching examinations');
      res.status(500).json({ message: "Failed to fetch examinations" });
    }
  });

  app.get('/api/examinations/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view examinations" });
      }

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
      }

      const examination = await storage.getEyeExamination(req.params.id, user.companyId || undefined);
      
      if (!examination) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      if (examination.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(examination);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching examination');
      res.status(500).json({ message: "Failed to fetch examination" });
    }
  });

  app.get('/api/patients/:id/examinations', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view examinations" });
      }

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
      }

      const patient = await storage.getPatient(req.params.id, user.companyId!);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const examinations = await storage.getPatientExaminations(req.params.id);
      res.json(examinations);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching patient examinations');
      res.status(500).json({ message: "Failed to fetch patient examinations" });
    }
  });

  app.post('/api/examinations', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create examinations" });
      }

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
      }

      const validation = insertEyeExaminationSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const examination = await storage.createEyeExamination({
        ...validation.data,
        companyId: user.companyId,
      }, userId);
      res.status(201).json(examination);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating examination');
      res.status(500).json({ message: "Failed to create examination" });
    }
  });

  app.patch('/api/examinations/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update examinations" });
      }

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
      }

      const examination = await storage.getEyeExamination(req.params.id);
      
      if (!examination) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      if (examination.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedExamination = await storage.updateEyeExamination(req.params.id, req.body as Record<string, unknown>);
      res.json(updatedExamination);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating examination');
      res.status(500).json({ message: "Failed to update examination" });
    }
  });

  app.post('/api/examinations/:id/finalize', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can finalize examinations" });
      }

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
      }

      const examination = await storage.getEyeExamination(req.params.id);
      
      if (!examination) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      if (examination.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (examination.status === 'finalized') {
        return res.status(400).json({ message: "Examination is already finalized" });
      }

      const finalizedExamination = await storage.finalizeExamination(req.params.id, userId);
      res.json(finalizedExamination);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error finalizing examination');
      res.status(500).json({ message: "Failed to finalize examination" });
    }
  });

  // Prescription routes
  app.get('/api/prescriptions', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view prescriptions" });
      }

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const prescriptions = await storage.getPatients(userId, user.companyId || undefined);
      res.json(prescriptions);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching prescriptions');
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get('/api/prescriptions/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view prescriptions" });
      }

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const prescription = await storage.getPrescription(req.params.id, user.companyId || undefined);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (prescription.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(prescription);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching prescription');
      res.status(500).json({ message: "Failed to fetch prescription" });
    }
  });

  app.post('/api/prescriptions', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create prescriptions" });
      }

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const validation = insertPrescriptionSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const prescriptionData = addCreationTimestamp({
        ...validation.data,
        companyId: user.companyId!,
      }, req);

      const prescription = await storage.createPrescription(prescriptionData, userId);
      res.status(201).json(prescription);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating prescription');
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.post('/api/prescriptions/:id/sign', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can sign prescriptions" });
      }

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const prescription = await storage.getPrescription(req.params.id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (prescription.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (prescription.isSigned) {
        return res.status(400).json({ message: "Prescription is already signed" });
      }

      const { signature } = req.body as { signature: string };
      if (!signature) {
        return res.status(400).json({ message: "Signature is required" });
      }

      const signedPrescription = await storage.signPrescription(req.params.id, userId, signature);
      res.json(signedPrescription);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error signing prescription');
      res.status(500).json({ message: "Failed to sign prescription" });
    }
  });

  app.get('/api/prescriptions/:id/pdf', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can download prescriptions" });
      }

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const prescription = await storage.getPrescription(req.params.id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (prescription.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { generatePrescriptionPDF } = await import('./pdfService');
      // Convert axis values to strings for PDF generation
      const prescriptionData = {
        ...prescription,
        odAxis: prescription.odAxis?.toString() || null,
        osAxis: prescription.osAxis?.toString() || null,
      };
      const pdfBuffer = await generatePrescriptionPDF(prescriptionData as any);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating prescription PDF');
      res.status(500).json({ message: "Failed to generate prescription PDF" });
    }
  });

  app.post('/api/prescriptions/:id/email', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can email prescriptions" });
      }

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const prescription = await storage.getPrescription(req.params.id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (prescription.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!prescription.patient.email) {
        return res.status(400).json({ message: "Patient email not found" });
      }

      const { sendPrescriptionEmail } = await import('./emailService');
      await sendPrescriptionEmail(prescription);

      res.json({ message: "Prescription sent successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error sending prescription');
      res.status(500).json({ message: "Failed to send prescription" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view products" });
      }

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
      }

      const products = await storage.getProducts(userId, user.companyId || undefined);
      res.json(products);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching products');
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view products" });
      }

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
      }

      const product = await storage.getProduct(req.params.id, user.companyId || undefined);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(product);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching product');
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create products" });
      }

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
      }

      const validation = insertProductSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const product = await storage.createProduct({
        ...validation.data,
        companyId: user.companyId,
      }, userId);
      res.status(201).json(product);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating product');
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/products/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update products" });
      }

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
      }

      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedProduct = await storage.updateProduct(req.params.id, req.body as Record<string, unknown>);
      res.json(updatedProduct);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating product');
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can delete products" });
      }

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
      }

      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteProduct(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error deleting product');
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Invoice routes
  app.get('/api/invoices', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view invoices" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoices = await storage.getInvoices(userId, user.companyId || undefined);
      res.json(invoices);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching invoices');
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view invoices" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id, user.companyId!);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(invoice);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching invoice');
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create invoices" });
      }

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const { lineItems, paymentMethod, ...invoiceData } = req.body as POSTransactionBody;

      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ message: "Invoice must have at least one line item" });
      }

      // If status is 'paid', set amountPaid to totalAmount and require payment method
      const invoicePayload: any = { 
        ...invoiceData, 
        companyId: user.companyId,
        lineItems 
      };
      
      if (invoiceData.status === 'paid') {
        if (!paymentMethod || !['cash', 'card', 'mixed'].includes(paymentMethod)) {
          return res.status(400).json({ message: "Valid payment method required for paid invoices" });
        }
        invoicePayload.paymentMethod = paymentMethod;
        invoicePayload.amountPaid = invoiceData.totalAmount;
      }

      const invoice = await storage.createInvoice(invoicePayload, userId);
      res.status(201).json(invoice);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating invoice');
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch('/api/invoices/:id/status', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update invoice status" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id, user.companyId!);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.body as StatusUpdateBody;
      if (!status || !['draft', 'paid', 'void'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedInvoice = await storage.updateInvoiceStatus(req.params.id, status);
      res.json(updatedInvoice);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating invoice status');
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  app.post('/api/invoices/:id/payment', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can record payments" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id, user.companyId!);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { amount } = req.body as AmountBody;
      if (!amount || parseFloat(String(amount)) <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const updatedInvoice = await storage.recordPayment(req.params.id, amount, user.companyId!);
      res.json(updatedInvoice);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error recording payment');
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Email and PDF routes for invoices
  app.get('/api/invoices/:id/pdf', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can download invoice PDFs" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id, user.companyId!);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { PDFService } = await import('./services/PDFService');
      const pdfService = new PDFService();
      
      // Calculate subtotal and tax from line items
      const subtotal = invoice.lineItems.reduce((sum: number, item: any) => 
        sum + parseFloat(item.totalPrice), 0
      );
      const total = parseFloat(invoice.totalAmount);
      const tax = total - subtotal;
      
      const pdfBuffer = await pdfService.generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customerName: invoice.patient?.name || 'Customer',
        customerEmail: invoice.patient?.email ? invoice.patient.email : undefined,
        items: invoice.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.totalPrice)
        })),
        subtotal,
        tax,
        taxRate: subtotal > 0 ? (tax / subtotal) : 0,
        total,
        companyName: user.organizationName || 'Integrated Lens System',
        companyEmail: user.email || process.env.EMAIL_FROM,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating invoice PDF');
      res.status(500).json({ message: "Failed to generate invoice PDF" });
    }
  });

  app.post('/api/invoices/:id/email', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can email invoices" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id, user.companyId!);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if customer has email
      const customerEmail = invoice.patient?.email;
      if (!customerEmail) {
        return res.status(400).json({ message: "Customer email not found" });
      }

      const { EmailService } = await import('./services/EmailService');
      const { PDFService } = await import('./services/PDFService');
      const emailService = new EmailService();
      const pdfService = new PDFService();

      // Calculate subtotal and tax from line items
      const subtotal = invoice.lineItems.reduce((sum: number, item: any) => 
        sum + parseFloat(item.totalPrice), 0
      );
      const total = parseFloat(invoice.totalAmount);
      const tax = total - subtotal;

      // Generate PDF
      const pdfBuffer = await pdfService.generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        customerName: invoice.patient?.name || 'Customer',
        customerEmail: invoice.patient?.email ? invoice.patient.email : undefined,
        items: invoice.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.totalPrice)
        })),
        subtotal,
        tax,
        taxRate: subtotal > 0 ? (tax / subtotal) : 0,
        total,
        companyName: user.organizationName || 'Integrated Lens System',
        companyEmail: user.email || process.env.EMAIL_FROM,
      });

      // Send email with PDF attachment
      await emailService.sendInvoiceEmail({
        recipientEmail: customerEmail,
        recipientName: invoice.patient?.name || 'Customer',
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        items: invoice.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.totalPrice)
        })),
        subtotal,
        tax,
        total,
        companyName: user.organizationName || 'Integrated Lens System',
        companyEmail: user.email || process.env.EMAIL_FROM,
      }, pdfBuffer);

      res.json({ message: "Invoice sent successfully via email" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error sending invoice email');
      res.status(500).json({ message: "Failed to send invoice email" });
    }
  });

  // Receipt PDF endpoint (for POS transactions)
  app.get('/api/invoices/:id/receipt', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can generate receipts" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id, user.companyId!);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { PDFService } = await import('./services/PDFService');
      const pdfService = new PDFService();
      
      const pdfBuffer = await pdfService.generateReceiptPDF({
        receiptNumber: invoice.invoiceNumber,
        date: invoice.invoiceDate.toISOString().split('T')[0],
        customerName: invoice.patient?.name || 'Customer',
        items: invoice.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          price: parseFloat(item.unitPrice)
        })),
        total: parseFloat(invoice.totalAmount),
        paymentMethod: invoice.paymentMethod || 'cash',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating receipt PDF');
      res.status(500).json({ message: "Failed to generate receipt PDF" });
    }
  });

  // Order confirmation email route
  app.post('/api/orders/:id/send-confirmation', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can send order confirmations" });
      }

      const order = await storage.getOrder(req.params.id, user.companyId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get ECP user details
      const ecp = await storage.getUser(order.ecpId, user.companyId!);
      if (!ecp || !ecp.email) {
        return res.status(400).json({ message: "ECP email not found" });
      }

      const { EmailService } = await import('./services/EmailService');
      const emailService = new EmailService();

      // Build order details HTML
      const orderDetails = `
        <p><strong>Patient:</strong> ${order.patient.name}</p>
        <p><strong>Order Date:</strong> ${order.orderDate.toISOString().split('T')[0]}</p>
        <p><strong>Lens Type:</strong> ${order.lensType}</p>
        <p><strong>Lens Material:</strong> ${order.lensMaterial}</p>
        <p><strong>Coating:</strong> ${order.coating}</p>
        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
        <p><strong>Status:</strong> ${order.status}</p>
      `;

      await emailService.sendOrderConfirmation(
        ecp.email,
        `${ecp.firstName || ''} ${ecp.lastName || ''}`.trim() || 'Customer',
        order.orderNumber,
        orderDetails
      );

      res.json({ message: "Order confirmation sent successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error sending order confirmation');
      res.status(500).json({ message: "Failed to send order confirmation" });
    }
  });

  // GitHub routes
  app.get('/api/github/user', async (req, res) => {
    try {
      const { getAuthenticatedUser } = await import('./github-helper');
      const user = await getAuthenticatedUser();
      res.json(user);
    } catch (error: any) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching GitHub user');
      res.status(500).json({ message: error.message || "Failed to fetch GitHub user" });
    }
  });

  app.post('/api/github/create-repo', async (req, res) => {
    try {
      const { createGitHubRepo } = await import('./github-helper');
      const { name, isPrivate, description } = req.body as { name: string; isPrivate?: boolean; description?: string };

      if (!name) {
        return res.status(400).json({ message: "Repository name is required" });
      }

      const repo = await createGitHubRepo(name, isPrivate || false, description);
      res.json(repo);
    } catch (error: any) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating GitHub repo');
      res.status(500).json({ message: error.message || "Failed to create repository" });
    }
  });

  // LIMS Webhook routes (Flow 2: Status updates from LIMS)
  app.post('/api/webhooks/lims-status', async (req, res) => {
    try {
      const { WebhookService } = await import('./services/WebhookService');

      const webhookSecret = process.env.LIMS_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.error({ feature: 'webhook' }, 'LIMS_WEBHOOK_SECRET not configured - webhook verification disabled');
        return res.status(503).json({ error: 'Webhook service not configured' });
      }
      const webhookService = new WebhookService(storage, {
        secret: webhookSecret,
      });

      // Verify webhook signature
      const signature = req.headers['x-lims-signature'] as string;
      const webhookBody = req.body as Record<string, unknown>;
      const payload = JSON.stringify(webhookBody);

      if (!webhookService.verifyWebhookSignature(payload, signature)) {
        logger.warn({ feature: 'webhook' }, 'Invalid webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
      }

      // Process the status update
      const success = await webhookService.handleStatusUpdate(webhookBody);

      if (success) {
        res.json({ message: 'Webhook processed successfully' });
      } else {
        res.status(400).json({ message: 'Failed to process webhook' });
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error processing LIMS webhook:');
      res.status(500).json({ 
        message: 'Failed to process webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============================================================
  // PREDICTIVE NON-ADAPT ALERT API ENDPOINTS (Feature 1)
  // ============================================================

  // Get active prescription alerts for ECP
  app.get('/api/alerts/prescriptions', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can access prescription alerts" });
      }

      const { PredictiveNonAdaptService } = await import('./services/PredictiveNonAdaptService');
      const alertService = PredictiveNonAdaptService.getInstance();

      const alerts = await alertService.getActiveAlerts(userId);
      res.json(alerts);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching prescription alerts:');
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  // Dismiss a prescription alert
  app.post('/api/alerts/prescriptions/:id/dismiss', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can manage alerts" });
      }

      const { actionTaken } = req.body as ActionBody;

      const { PredictiveNonAdaptService } = await import('./services/PredictiveNonAdaptService');
      const alertService = PredictiveNonAdaptService.getInstance();

      await alertService.dismissAlert(req.params.id, userId, actionTaken);
      res.json({ message: 'Alert dismissed successfully' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error dismissing alert:');
      res.status(500).json({ message: 'Failed to dismiss alert' });
    }
  });

  // Analyze order for non-adapt risk (called during order creation)
  app.post('/api/orders/analyze-risk', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can analyze orders" });
      }

      const {
        lensType,
        lensMaterial,
        frameType,
        coating,
        odSphere,
        odCylinder,
        odAxis,
        odAdd,
        osSphere,
        osCylinder,
        osAxis,
        osAdd,
        pd,
      } = req.body as LensParametersBody;

      if (!lensType || !lensMaterial || !odSphere || !osSphere) {
        return res.status(400).json({ message: 'Missing required prescription fields' });
      }

      const { PredictiveNonAdaptService } = await import('./services/PredictiveNonAdaptService');
      const alertService = PredictiveNonAdaptService.getInstance();

      const analysis = await alertService.analyzeOrderForRisk({
        orderId: 'temp-' + Date.now(),
        ecpId: userId,
        lensType,
        lensMaterial,
        frameType,
        coating,
        rxProfile: {
          odSphere: parseFloat(odSphere),
          odCylinder: parseFloat(odCylinder || 0),
          odAxis: parseFloat(odAxis || 0),
          odAdd: parseFloat(odAdd || 0),
          osSphere: parseFloat(osSphere),
          osCylinder: parseFloat(osCylinder || 0),
          osAxis: parseFloat(osAxis || 0),
          osAdd: parseFloat(osAdd || 0),
          pd: parseFloat(pd || 62),
        },
      });

      res.json({ analysis });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error analyzing order risk:');
      res.status(500).json({ message: 'Failed to analyze order risk' });
    }
  });

  // ============================================================
  // INTELLIGENT PURCHASING ASSISTANT API ENDPOINTS (Feature 2)
  // ============================================================

  // Get active BI recommendations for ECP
  app.get('/api/recommendations/bi', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can access BI recommendations" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      const recommendations = await biService.getActiveRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching BI recommendations:');
      res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
  });

  // Trigger BI analysis for an ECP
  app.post('/api/recommendations/bi/analyze', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can trigger BI analysis" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      const recommendations = await biService.analyzeEcpForRecommendations(userId);

      // Create recommendations in database
      const created = [];
      for (const rec of recommendations) {
        const createdRec = await biService.createRecommendation(userId, rec);
        created.push(createdRec);
      }

      res.status(201).json({
        message: `Created ${created.length} new recommendations`,
        recommendations: created,
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error running BI analysis:');
      res.status(500).json({ message: 'Failed to run BI analysis' });
    }
  });

  // Acknowledge a BI recommendation
  app.post('/api/recommendations/bi/:id/acknowledge', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can acknowledge recommendations" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      await biService.acknowledgeRecommendation(req.params.id, userId);
      res.json({ message: 'Recommendation acknowledged' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error acknowledging recommendation:');
      res.status(500).json({ message: 'Failed to acknowledge recommendation' });
    }
  });

  // Start implementation of a BI recommendation
  app.post('/api/recommendations/bi/:id/start-implementation', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can start implementations" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      await biService.startImplementation(req.params.id);
      res.json({ message: 'Implementation started' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error starting implementation:');
      res.status(500).json({ message: 'Failed to start implementation' });
    }
  });

  // Complete implementation of a BI recommendation
  app.post('/api/recommendations/bi/:id/complete-implementation', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can complete implementations" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      await biService.completeImplementation(req.params.id);
      res.json({ message: 'Implementation completed' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error completing implementation:');
      res.status(500).json({ message: 'Failed to complete implementation' });
    }
  });

  // ============================================
  // ADMIN COMPANY MANAGEMENT ENDPOINTS
  // ============================================

  // Get all companies (admin only)
  app.get('/api/admin/companies', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allUsers = await storage.getAllUsers();
      // Filter to get company accounts (non-admin users)
      const companies = allUsers
        .filter(u => u.role !== 'admin' && u.organizationName)
        .map(u => ({
          id: u.id,
          name: u.organizationName || `${u.firstName} ${u.lastName}`,
          email: u.email || '',
          role: u.role || 'ecp',
          accountStatus: u.accountStatus || 'pending',
          createdAt: u.createdAt || new Date().toISOString(),
        }));

      res.json(companies);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching companies:');
      res.status(500).json({ message: 'Failed to fetch companies' });
    }
  });

  // Create new company with auto-generated credentials (admin only)
  app.post('/api/admin/companies', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const {
        companyName,
        email,
        firstName,
        lastName,
        role,
        contactPhone,
        address
      } = req.body as {
        companyName: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        contactPhone?: string;
        address?: string;
      };

      // Validate required fields
      if (!companyName || !email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Generate secure random password
      const crypto = await import('crypto');
      const password = crypto.randomBytes(12).toString('base64').slice(0, 16);
      const hashedPassword = await hashPassword(password);

      // Create company user
      const newUser = await storage.upsertUser({
        id: crypto.randomUUID(),
        email: normalizeEmail(email),
        password: hashedPassword,
        firstName,
        lastName,
        organizationName: companyName,
        role,
        contactPhone,
        address: address ? { street: address } : undefined,
        accountStatus: 'active',
        subscriptionPlan: 'full',
        isActive: true,
        isVerified: true,
      });

      // Send welcome email with credentials
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .credentials-box {
              background-color: white;
              padding: 25px;
              border-radius: 8px;
              margin: 25px 0;
              border-left: 4px solid #667eea;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .credential-item {
              margin: 15px 0;
              padding: 12px;
              background-color: #f3f4f6;
              border-radius: 6px;
            }
            .credential-label {
              font-weight: bold;
              color: #4b5563;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .credential-value {
              font-size: 16px;
              color: #111827;
              font-family: 'Courier New', monospace;
              margin-top: 5px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .warning-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 0.9em;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Integrated Lens System</h1>
            <p>Your account has been created successfully</p>
          </div>
          <div class="content">
            <p>Dear ${firstName} ${lastName},</p>
            <p>Your company account for <strong>${companyName}</strong> has been created in the Integrated Lens System.</p>
            
            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #667eea;">🔐 Your Login Credentials</h3>
              
              <div class="credential-item">
                <div class="credential-label">Email Address</div>
                <div class="credential-value">${email}</div>
              </div>
              
              <div class="credential-item">
                <div class="credential-label">Password</div>
                <div class="credential-value">${password}</div>
              </div>
              
              <div class="credential-item">
                <div class="credential-label">Role</div>
                <div class="credential-value">${role.toUpperCase()}</div>
              </div>
            </div>

            <div class="warning-box">
              <strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.
            </div>

            <div style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" class="button">
                Log In to Your Account
              </a>
            </div>

            <h3 style="color: #374151;">📋 Next Steps:</h3>
            <ol style="color: #6b7280;">
              <li>Click the button above to access the login page</li>
              <li>Enter your email and temporary password</li>
              <li>Complete your profile setup</li>
              <li>Start managing your optical business efficiently</li>
            </ol>

            <p style="color: #6b7280; margin-top: 30px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>

            <div class="footer">
              <p><strong>Integrated Lens System</strong></p>
              <p>The complete solution for optical practice management</p>
              <p style="font-size: 0.85em; color: #9ca3af;">
                This email contains sensitive information. Please keep it secure.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail({
        to: email,
        subject: `Welcome to Integrated Lens System - Your Login Credentials`,
        html: emailHtml,
      });

      logger.info({ companyName }, 'Company created: ...  with user ${email}');

      res.json({
        message: 'Company created successfully',
        userId: newUser.id,
        email: newUser.email,
        password, // Return password for admin to show in dialog
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating company:');
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create company' 
      });
    }
  });

  // Resend credentials to company (admin only)
  app.post('/api/admin/companies/:id/resend-credentials', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const companyUser = await storage.getUser(req.params.id, user.companyId!);
      if (!companyUser) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Generate new password
      const crypto = await import('crypto');
      const newPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await storage.updateUser(req.params.id, { password: hashedPassword });

      // Send email with new credentials
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .credentials-box {
              background-color: white;
              padding: 25px;
              border-radius: 8px;
              margin: 25px 0;
              border-left: 4px solid #667eea;
            }
            .credential-item {
              margin: 15px 0;
              padding: 12px;
              background-color: #f3f4f6;
              border-radius: 6px;
            }
            .credential-value {
              font-size: 16px;
              color: #111827;
              font-family: 'Courier New', monospace;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔑 Password Reset - Integrated Lens System</h1>
          </div>
          <div class="content">
            <p>Dear ${companyUser.firstName} ${companyUser.lastName},</p>
            <p>Your login credentials have been reset. Here are your new login details:</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <strong>Email:</strong>
                <div class="credential-value">${companyUser.email}</div>
              </div>
              <div class="credential-item">
                <strong>New Password:</strong>
                <div class="credential-value">${newPassword}</div>
              </div>
            </div>

            <p style="color: #dc2626; font-weight: bold;">
              ⚠️ Please change this password after logging in for security.
            </p>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail({
        to: companyUser.email!,
        subject: 'Your New Login Credentials - Integrated Lens System',
        html: emailHtml,
      });

      res.json({ message: 'Credentials sent successfully' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error resending credentials:');
      res.status(500).json({ message: 'Failed to resend credentials' });
    }
  });

  // ============================================
  // AI ASSISTANT ENDPOINTS
  // ============================================
  
  // Import AI services
  const { AIAssistantService } = await import('./services/AIAssistantService');
  const aiAssistantService = new AIAssistantService(storage);

  // Ask AI Assistant a question
  app.post('/api/ai-assistant/ask', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const { question, conversationId, context } = req.body as { question: string; conversationId?: string; context?: string };

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Get learning progress for the company
      const learningProgress = await aiAssistantService.getLearningProgress(user.companyId);

      const response = await aiAssistantService.ask(
        {
          question,
          conversationId,
          context,
          userId
        },
        {
          companyId: user.companyId,
          useExternalAi: true,
          learningProgress: learningProgress.progress
        }
      );

      // Save the conversation
      await aiAssistantService.saveConversation(
        conversationId || crypto.randomUUID(),
        userId,
        user.companyId,
        question,
        response.answer
      );

      res.json(response);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error asking AI assistant:');
      res.status(500).json({ message: 'Failed to get AI response' });
    }
  });

  // Get all conversations for a user
  app.get('/api/ai-assistant/conversations', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const conversations = await aiAssistantService.getConversations(userId, user.companyId);
      res.json(conversations);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching conversations:');
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Get a specific conversation with messages
  app.get('/api/ai-assistant/conversations/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      const conversationId = req.params.id;
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const conversation = await aiAssistantService.getConversation(conversationId, user.companyId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching conversation:');
      res.status(500).json({ message: 'Failed to fetch conversation' });
    }
  });

  // Upload document to knowledge base
  app.post('/api/ai-assistant/knowledge/upload', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const { fileName, fileContent, fileType, title, description } = req.body as {
        fileName: string;
        fileContent: string;
        fileType?: string;
        title?: string;
        description?: string;
      };

      if (!fileName || !fileContent) {
        return res.status(400).json({ message: "File name and content are required" });
      }

      const result = await aiAssistantService.uploadDocument(
        user.companyId,
        userId,
        {
          fileName,
          fileContent,
          fileType,
          title,
          description
        }
      );

      res.json(result);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error uploading document:');
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  // Get all knowledge base documents
  app.get('/api/ai-assistant/knowledge', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const documents = await aiAssistantService.getKnowledgeBase(user.companyId);
      res.json(documents);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching knowledge base:');
      res.status(500).json({ message: 'Failed to fetch knowledge base' });
    }
  });

  // Get learning progress
  app.get('/api/ai-assistant/learning-progress', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const progress = await aiAssistantService.getLearningProgress(user.companyId);
      res.json(progress);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching learning progress:');
      
      // UX IMPROVEMENT: Return usable fallback data instead of 500 error
      // This allows UI to show helpful message instead of breaking
      res.json({
        progress: 0,
        totalLearning: 0,
        totalDocuments: 0,
        lastUpdated: new Date().toISOString(),
        _fallback: true,
        _message: "We're setting up your AI Assistant. This usually takes 2-3 minutes. Check back soon!",
        _canRetry: true
      });
    }
  });

  // Get AI assistant statistics
  app.get('/api/ai-assistant/stats', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const stats = await aiAssistantService.getStats(user.companyId);
      res.json(stats);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching AI stats:');
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // AI Usage Stats endpoint (for client compatibility)
  app.get('/api/ai/usage/stats', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: 'User company not found' });
      }

      // Return basic usage stats for now
      const stats = {
        totalQueries: 0,
        totalCost: 0,
        queriesThisMonth: 0,
        costThisMonth: 0,
        averageResponseTime: 0,
      };
      
      res.json(stats);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching AI usage stats');
      res.status(500).json({ message: 'Failed to fetch usage stats' });
    }
  });

  // Provide feedback on AI response
  app.post('/api/ai-assistant/conversations/:id/feedback', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      const conversationId = req.params.id;
      const { messageId, helpful, feedback } = req.body as { messageId: string; helpful: boolean; feedback?: string };

      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Update the saveFeedback call to include userId
      await storage.createAiFeedback({
        messageId,
        userId,
        companyId: user.companyId,
        rating: helpful ? 5 : 1,
        helpful,
        comments: feedback
      });

      res.json({ message: "Feedback saved successfully" });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error saving feedback:');
      res.status(500).json({ message: 'Failed to save feedback' });
    }
  });

  // ============================================
  // AI INTELLIGENCE & BI ENDPOINTS
  // ============================================
  
  const { BusinessIntelligenceService } = await import('./services/BusinessIntelligenceService');
  const biService = new BusinessIntelligenceService(storage);

  // Get BI Dashboard overview
  app.get('/api/ai-intelligence/dashboard', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const dashboard = await biService.getDashboardOverview(user.companyId);
      res.json(dashboard);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching BI dashboard:');
      res.status(500).json({ message: 'Failed to fetch dashboard' });
    }
  });

  // Get AI-generated insights
  app.get('/api/ai-intelligence/insights', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const insights = await biService.generateInsights(user.companyId);
      res.json(insights);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating insights:');
      res.status(500).json({ message: 'Failed to generate insights' });
    }
  });

  // Get growth opportunities
  app.get('/api/ai-intelligence/opportunities', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const opportunities = await biService.identifyGrowthOpportunities(user.companyId);
      res.json(opportunities);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error identifying opportunities:');
      res.status(500).json({ message: 'Failed to identify opportunities' });
    }
  });

  // Get alerts
  app.get('/api/ai-intelligence/alerts', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const alerts = await biService.getAlerts(user.companyId);
      res.json(alerts);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching alerts:');
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  // Generate demand forecast
  app.post('/api/ai-intelligence/forecast', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const { productId, timeframe } = req.body as { productId?: string; timeframe?: number };

      const forecast = await biService.generateForecast(
        user.companyId,
        productId,
        timeframe || 30
      );

      res.json(forecast);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating forecast:');
      res.status(500).json({ message: 'Failed to generate forecast' });
    }
  });

  // Analyze order risk (for prescription alerts)
  app.post('/api/orders/analyze-risk', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "ECP access required" });
      }

      const prescriptionData = req.body as Record<string, unknown>;

      // Simple risk calculation without full PredictiveNonAdaptService
      // Calculate risk based on prescription complexity
      let riskScore = 0;
      const riskFactors: string[] = [];

      // High add power
      if ((prescriptionData.odAdd as number) > 2.5 || (prescriptionData.osAdd as number) > 2.5) {
        riskScore += 0.25;
        riskFactors.push("High add power detected");
      }
      
      // High cylinder
      if (Math.abs(prescriptionData.odCylinder) > 2.0 || Math.abs(prescriptionData.osCylinder) > 2.0) {
        riskScore += 0.15;
        riskFactors.push("High astigmatism");
      }
      
      // High sphere
      const odTotal = Math.abs(prescriptionData.odSphere) + Math.abs(prescriptionData.odCylinder);
      const osTotal = Math.abs(prescriptionData.osSphere) + Math.abs(prescriptionData.osCylinder);
      if (odTotal > 6.0 || osTotal > 6.0) {
        riskScore += 0.20;
        riskFactors.push("High total power");
      }
      
      // Frame type
      if (prescriptionData.frameType === 'wrap' || prescriptionData.frameType === 'sport') {
        riskScore += 0.15;
        riskFactors.push("Wrap/sport frame increases complexity");
      }
      
      // PD variation
      if (prescriptionData.pd < 58 || prescriptionData.pd > 74) {
        riskScore += 0.10;
        riskFactors.push("Non-standard PD");
      }
      
      const severity = riskScore >= 0.45 ? 'critical' : riskScore >= 0.30 ? 'warning' : 'info';
      
      const analysis = {
        severity,
        riskScore,
        riskFactors,
        recommendation: riskScore > 0.30 
          ? "Consider consulting with lab engineer before proceeding"
          : "Prescription within normal parameters",
        suggestedActions: riskScore > 0.30 
          ? ["Review with patient", "Consider alternative frame", "Consult lab engineer"]
          : []
      };

      res.json({ analysis });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error analyzing order risk:');
      res.status(500).json({ message: 'Failed to analyze risk' });
    }
  });

  // ============================================
  // EQUIPMENT MANAGEMENT ENDPOINTS
  // ============================================
  
  const equipmentStorage = await import('./storage/equipment');

  // Get all equipment
  app.get('/api/equipment', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const { status, testRoomId, needsCalibration, needsMaintenance } = req.query;
      
      const filters = {
        companyId: user.companyId,
        status: status as string | undefined,
        testRoomId: testRoomId as string | undefined,
        needsCalibration: needsCalibration === 'true',
        needsMaintenance: needsMaintenance === 'true',
      };

      const equipment = await equipmentStorage.getAllEquipment(filters);
      res.json(equipment);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching equipment:');
      res.status(500).json({ message: 'Failed to fetch equipment' });
    }
  });

  // Get equipment statistics
  app.get('/api/equipment/stats', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const stats = await equipmentStorage.getEquipmentStats(user.companyId);
      res.json(stats);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching equipment stats:');
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Get equipment due for calibration
  app.get('/api/equipment/due-calibration', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const daysAhead = Math.max(1, Math.min(365, parseInt(req.query.days as string) || 30));
      const equipment = await equipmentStorage.getDueCalibrations(user.companyId, daysAhead);
      res.json(equipment);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching due calibrations:');
      res.status(500).json({ message: 'Failed to fetch calibrations' });
    }
  });

  // Get equipment due for maintenance
  app.get('/api/equipment/due-maintenance', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const daysAhead = Math.max(1, Math.min(365, parseInt(req.query.days as string) || 30));
      const equipment = await equipmentStorage.getDueMaintenance(user.companyId, daysAhead);
      res.json(equipment);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching due maintenance:');
      res.status(500).json({ message: 'Failed to fetch maintenance' });
    }
  });

  // Get single equipment by ID
  app.get('/api/equipment/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const equipment = await equipmentStorage.getEquipmentById(req.params.id, user.companyId);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      
      res.json(equipment);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching equipment:');
      res.status(500).json({ message: 'Failed to fetch equipment' });
    }
  });

  // Create new equipment
  app.post('/api/equipment', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Only lab_tech, engineer, and admin can create equipment
      if (user.role && !['lab_tech', 'engineer', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const equipmentBody = req.body as Record<string, unknown>;
      const equipmentData = {
        ...equipmentBody,
        companyId: user.companyId,
      };

      const equipment = await equipmentStorage.createEquipment(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating equipment:');
      res.status(500).json({ message: 'Failed to create equipment' });
    }
  });

  // Update equipment
  app.patch('/api/equipment/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Only lab_tech, engineer, and admin can update equipment
      if (user.role && !['lab_tech', 'engineer', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const equipment = await equipmentStorage.updateEquipment(
        req.params.id,
        user.companyId,
        req.body as Record<string, unknown>
      );

      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }

      res.json(equipment);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating equipment:');
      res.status(500).json({ message: 'Failed to update equipment' });
    }
  });

  // Delete equipment
  app.delete('/api/equipment/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Only admin can delete equipment
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const success = await equipmentStorage.deleteEquipment(req.params.id, user.companyId);
      if (!success) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      
      res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error deleting equipment:');
      res.status(500).json({ message: 'Failed to delete equipment' });
    }
  });

  // Add maintenance record
  app.post('/api/equipment/:id/maintenance', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Only lab_tech, engineer, and admin can add maintenance
      if (user.role && !['lab_tech', 'engineer', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const maintenanceBody = req.body as Record<string, unknown>;
      const maintenanceRecord = {
        ...maintenanceBody,
        date: new Date(maintenanceBody.date as string),
        performedBy: user.email || 'Unknown',
        nextScheduledDate: maintenanceBody.nextScheduledDate ? new Date(maintenanceBody.nextScheduledDate as string) : undefined,
      };

      const equipment = await equipmentStorage.addMaintenanceRecord(
        req.params.id,
        user.companyId,
        maintenanceRecord
      );

      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      
      res.json(equipment);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error adding maintenance record:');
      res.status(500).json({ message: 'Failed to add maintenance record' });
    }
  });

  // Record calibration
  app.post('/api/equipment/:id/calibration', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Only engineer and admin can calibrate
      if (user.role && !['engineer', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Engineer or admin access required" });
      }

      const { calibrationDate, nextCalibrationDate, notes } = req.body as {
        calibrationDate: string;
        nextCalibrationDate?: string;
        notes?: string;
      };

      const equipment = await equipmentStorage.recordCalibration(
        req.params.id,
        user.companyId,
        new Date(calibrationDate),
        new Date(nextCalibrationDate),
        user.email || 'Unknown',
        notes
      );

      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      
      res.json(equipment);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error recording calibration:');
      res.status(500).json({ message: 'Failed to record calibration' });
    }
  });

  // ============================================
  // PRODUCTION TRACKING ENDPOINTS
  // ============================================
  
  const productionStorage = await import('./storage/production');

  // Get production statistics
  app.get('/api/production/stats', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const stats = await productionStorage.getProductionStats(user.companyId);
      res.json(stats);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching production stats:');
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Get orders in production
  app.get('/api/production/orders', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const { status } = req.query;
      const orders = await productionStorage.getOrdersInProduction(
        user.companyId,
        status as string | undefined
      );
      res.json(orders);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching production orders:');
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Get order timeline
  app.get('/api/production/orders/:id/timeline', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const timeline = await productionStorage.getOrderTimeline(req.params.id, user.companyId);
      res.json(timeline);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching order timeline:');
      res.status(500).json({ message: 'Failed to fetch timeline' });
    }
  });

  // Update order status (with timeline event)
  app.patch('/api/production/orders/:id/status', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Only lab_tech, engineer, and admin can update production status
      if (user.role && !['lab_tech', 'engineer', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, notes } = req.body as { status: string; notes?: string };
      const order = await productionStorage.updateOrderStatus(
        req.params.id,
        user.companyId,
        userId,
        status,
        notes
      );

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating order status:');
      res.status(500).json({ message: 'Failed to update status' });
    }
  });

  // Add timeline event
  app.post('/api/production/orders/:id/timeline', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Only lab_tech, engineer, and admin can add timeline events
      if (user.role && !['lab_tech', 'engineer', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, details, metadata } = req.body as { status: string; details?: string; metadata?: Record<string, unknown> };
      const event = await productionStorage.addTimelineEvent(
        req.params.id,
        user.companyId,
        userId,
        status,
        details,
        metadata
      );

      if (!event) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(event);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error adding timeline event:');
      res.status(500).json({ message: 'Failed to add event' });
    }
  });

  // Get production stages analysis
  app.get('/api/production/stages', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const stages = await productionStorage.getProductionStages(user.companyId);
      res.json(stages);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching production stages:');
      res.status(500).json({ message: 'Failed to fetch stages' });
    }
  });

  // Get production bottlenecks
  app.get('/api/production/bottlenecks', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const bottlenecks = await productionStorage.getBottlenecks(user.companyId);
      res.json(bottlenecks);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching bottlenecks:');
      res.status(500).json({ message: 'Failed to fetch bottlenecks' });
    }
  });

  // Get production velocity (orders completed per day)
  app.get('/api/production/velocity', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const days = Math.max(1, Math.min(90, parseInt(req.query.days as string) || 7));
      const velocity = await productionStorage.getProductionVelocity(user.companyId, days);
      res.json(velocity);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching production velocity:');
      res.status(500).json({ message: 'Failed to fetch velocity' });
    }
  });

  // ============================================
  // QUALITY CONTROL ENDPOINTS
  // ============================================
  
  const qcStorage = await import('./storage/qualityControl');

  // Get orders awaiting quality check
  app.get('/api/quality-control/orders', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const orders = await qcStorage.getOrdersForQC(user.companyId);
      res.json(orders);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching QC orders:');
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Get QC statistics
  app.get('/api/quality-control/stats', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const stats = await qcStorage.getQCStats(user.companyId);
      res.json(stats);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching QC stats:');
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Get QC metrics
  app.get('/api/quality-control/metrics', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const metrics = await qcStorage.getQCMetrics(user.companyId);
      res.json(metrics);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching QC metrics:');
      res.status(500).json({ message: 'Failed to fetch metrics' });
    }
  });

  // Get defect trends
  app.get('/api/quality-control/defect-trends', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const days = Math.max(1, Math.min(365, parseInt(req.query.days as string) || 30));
      const trends = await qcStorage.getDefectTrends(user.companyId, days);
      res.json(trends);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching defect trends:');
      res.status(500).json({ message: 'Failed to fetch trends' });
    }
  });

  // Perform quality inspection
  app.post('/api/quality-control/inspect/:orderId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      // Only lab_tech, engineer, and admin can perform QC
      if (user.role && !['lab_tech', 'engineer', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, defects, measurements, notes, images } = req.body as {
        status: string;
        defects?: unknown[];
        measurements?: unknown[];
        notes?: string;
        images?: string[];
      };
      const result = await qcStorage.performQCInspection(
        req.params.orderId,
        user.companyId,
        userId,
        status,
        defects || [],
        measurements || [],
        notes,
        images || []
      );

      if (!result) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(result);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error performing inspection:');
      res.status(500).json({ message: 'Failed to perform inspection' });
    }
  });

  // Get inspection history for an order
  app.get('/api/quality-control/orders/:orderId/history', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.claims?.sub || req.user!.id;
      const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: "User lookup", ip: req.ip });
      
      if (!user || !user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const history = await qcStorage.getInspectionHistory(req.params.orderId, user.companyId);
      res.json(history);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching inspection history:');
      res.status(500).json({ message: 'Failed to fetch history' });
    }
  });

  // Get standard measurements
  app.get('/api/quality-control/standard-measurements', isAuthenticated, async (_req: AuthenticatedRequest, res) => {
    res.json(qcStorage.standardMeasurements);
  });

  // Get defect types
  app.get('/api/quality-control/defect-types', isAuthenticated, async (_req: AuthenticatedRequest, res) => {
    res.json(qcStorage.defectTypes);
  });

  // =============================================================================
  // ERROR HANDLING WITH REQUEST CONTEXT
  // =============================================================================
  // Add error context middleware to enrich errors with correlation IDs
  app.use(errorContextMiddleware);

  const httpServer = createServer(app);

  // Initialize WebSocket server for real-time updates
  websocketService.initialize(httpServer);

  return httpServer;
}
