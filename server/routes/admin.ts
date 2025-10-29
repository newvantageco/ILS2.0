/**
 * Platform Admin Routes
 * 
 * Special routes for platform_admin (master administrator) to manage
 * companies, subscriptions, and system-wide AI training
 */

import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

/**
 * Middleware to check if user is platform admin
 */
function isPlatformAdmin(req: any, res: Response, next: Function) {
  if (req.user && (req.user.role === "platform_admin" || req.user.role === "admin")) {
    return next();
  }
  res.status(403).json({ error: "Platform admin access required" });
}

/**
 * Schema for creating company without subscription
 */
const createCompanySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["ecp", "lab", "supplier"]),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  gocNumber: z.string().optional(),
  subscriptionExempt: z.boolean().default(false),
  subscriptionPlan: z.enum(["free_ecp", "full"]).default("full"),
  adminUser: z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string().min(8),
  }),
});

/**
 * POST /api/admin/companies
 * Create a new company with optional subscription exemption
 * Only platform_admin can create companies without subscription requirement
 */
router.post("/companies", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const validation = createCompanySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.errors,
      });
    }

    const data = validation.data;

    // Create company with subscription exemption if specified
    const company = await storage.createCompany({
      name: data.name,
      type: data.type,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      gocNumber: data.gocNumber,
      subscriptionPlan: data.subscriptionPlan,
      status: "active", // Admin-created companies are automatically active
      isSubscriptionExempt: data.subscriptionExempt,
      subscriptionStartDate: data.subscriptionExempt ? new Date() : undefined,
      aiEnabled: true,
    });

    // Create admin user for the company
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(data.adminUser.password, 10);

    const adminUser = await storage.upsertUser({
      email: data.adminUser.email,
      firstName: data.adminUser.firstName,
      lastName: data.adminUser.lastName,
      password: hashedPassword,
      companyId: company.id,
      role: "company_admin",
      accountStatus: "active",
      isVerified: true,
    });

    // Log the creation in subscription history
    const userId = req.user?.claims?.sub || req.user?.id;
    await storage.db.insert(storage.subscriptionHistory).values({
      companyId: company.id,
      eventType: "created",
      newPlan: data.subscriptionPlan,
      changedBy: userId,
      reason: data.subscriptionExempt 
        ? "Company created by platform admin with subscription exemption" 
        : "Company created by platform admin",
      metadata: { createdBy: userId },
    });

    res.status(201).json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        type: company.type,
        status: company.status,
        subscriptionPlan: company.subscriptionPlan,
        isSubscriptionExempt: company.isSubscriptionExempt,
      },
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
      },
    });
  } catch (error: any) {
    console.error("Error creating company:", error);
    res.status(500).json({ 
      error: "Failed to create company",
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/companies/:companyId/subscription-exemption
 * Grant or revoke subscription exemption for a company
 */
router.put("/companies/:companyId/subscription-exemption", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { companyId } = req.params;
    const { exempt, reason } = req.body;

    if (typeof exempt !== "boolean") {
      return res.status(400).json({ error: "exempt must be a boolean" });
    }

    const company = await storage.getCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    await storage.updateCompany(companyId, {
      isSubscriptionExempt: exempt,
      subscriptionPlan: exempt ? "full" : company.subscriptionPlan,
    });

    // Log the change
    const userId = req.user?.claims?.sub || req.user?.id;
    await storage.db.insert(storage.subscriptionHistory).values({
      companyId,
      eventType: "updated",
      changedBy: userId,
      reason: reason || (exempt ? "Subscription exemption granted" : "Subscription exemption revoked"),
      metadata: { exemptionChanged: true, newValue: exempt },
    });

    res.json({
      success: true,
      message: exempt 
        ? "Subscription exemption granted" 
        : "Subscription exemption revoked",
    });
  } catch (error: any) {
    console.error("Error updating subscription exemption:", error);
    res.status(500).json({ error: "Failed to update subscription exemption" });
  }
});

/**
 * GET /api/admin/companies
 * Get all companies (platform admin view)
 */
router.get("/companies", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { type, status, subscriptionPlan } = req.query;

    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;

    const companies = await storage.getCompanies(filters);

    // Filter by subscription plan if specified
    let filteredCompanies = companies;
    if (subscriptionPlan) {
      filteredCompanies = companies.filter(c => c.subscriptionPlan === subscriptionPlan);
    }

    res.json({
      success: true,
      companies: filteredCompanies.map(company => ({
        ...company,
        // Don't expose sensitive data
        stripeAccessToken: undefined,
        shopifyAccessToken: undefined,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

/**
 * GET /api/admin/subscription-stats
 * Get subscription statistics across all companies
 */
router.get("/subscription-stats", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const companies = await storage.getCompanies();

    const stats = {
      total: companies.length,
      byPlan: {
        free_ecp: companies.filter(c => c.subscriptionPlan === "free_ecp").length,
        full: companies.filter(c => c.subscriptionPlan === "full").length,
      },
      byStatus: {
        active: companies.filter(c => c.status === "active").length,
        pending: companies.filter(c => c.status === "pending_approval").length,
        suspended: companies.filter(c => c.status === "suspended").length,
      },
      exemptCompanies: companies.filter(c => c.isSubscriptionExempt).length,
      withStripeSubscription: companies.filter(c => c.stripeSubscriptionId).length,
    };

    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("Error fetching subscription stats:", error);
    res.status(500).json({ error: "Failed to fetch subscription stats" });
  }
});

/**
 * PUT /api/admin/companies/:companyId/subscription
 * Manually change a company's subscription plan
 */
router.put("/companies/:companyId/subscription", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { companyId } = req.params;
    const { plan, reason } = req.body;

    if (!["free_ecp", "full"].includes(plan)) {
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    const company = await storage.getCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    await storage.updateCompany(companyId, {
      subscriptionPlan: plan,
    });

    // Log the change
    const userId = req.user?.claims?.sub || req.user?.id;
    await storage.db.insert(storage.subscriptionHistory).values({
      companyId,
      eventType: "updated",
      oldPlan: company.subscriptionPlan,
      newPlan: plan,
      changedBy: userId,
      reason: reason || "Manually changed by platform admin",
    });

    res.json({
      success: true,
      message: "Subscription plan updated",
    });
  } catch (error: any) {
    console.error("Error updating subscription plan:", error);
    res.status(500).json({ error: "Failed to update subscription plan" });
  }
});

export function registerAdminRoutes(app: any) {
  app.use("/api/admin", router);
}
