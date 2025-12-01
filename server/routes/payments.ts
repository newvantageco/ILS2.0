/**
 * Stripe Payment Integration Routes
 * 
 * Handles subscription management, payment processing, and webhooks
 * for the Integrated Lens System
 */

import { Router, Request, Response, NextFunction, Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  StripeError
} from "../utils/ApiError";
import { withTransaction } from "../utils/transaction";
import { createLogger } from "../utils/logger";
import { z } from "zod";

// Type definitions for authenticated requests
interface AuthenticatedUser {
  id: string;
  email?: string;
  companyId?: string;
  role?: string;
  claims?: {
    sub?: string;
  };
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Zod schemas for request validation
const createCheckoutSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  billingInterval: z.enum(["monthly", "yearly"], {
    errorMap: () => ({ message: "Billing interval must be 'monthly' or 'yearly'" })
  }),
});

type CreateCheckoutBody = z.infer<typeof createCheckoutSchema>;

const router = Router();
const logger = createLogger('payments');

// Initialize Stripe (lazy initialization)
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY environment variable is required. " +
        "Payment processing cannot function without it."
      );
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover" as any,
    });
  }
  return stripe;
}

// Log warning at startup if Stripe is not configured
if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY is not set - payment routes will return errors until configured');
} else {
  logger.info('Stripe payment processing is configured');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  logger.warn('STRIPE_WEBHOOK_SECRET is not set - webhook signature verification will fail');
}

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Middleware to check if user is authenticated
 */
function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if ((req as AuthenticatedRequest).user) {
    return next();
  }
  throw new UnauthorizedError("Authentication required");
}

/**
 * Middleware to check if user is platform admin
 */
function isPlatformAdmin(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user && authReq.user.role === "platform_admin") {
    return next();
  }
  throw new UnauthorizedError("Platform admin access required");
}

/**
 * GET /api/payments/subscription-plans
 * Get all available subscription plans
 */
router.get("/subscription-plans", asyncHandler(async (req: Request, res: Response) => {
  const plans = await storage.getSubscriptionPlans();
  res.json({ success: true, plans });
}));

/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe Checkout session for subscription
 */
router.post("/create-checkout-session", isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  
  // Validate request body
  const validatedBody = createCheckoutSchema.parse(req.body);
  const { planId, billingInterval } = validatedBody;
  
  const userId = authReq.user?.claims?.sub || authReq.user?.id;
  const user = await storage.getUserById_Internal(userId);
  
  if (!user || !user.companyId) {
    throw new BadRequestError("User must belong to a company");
  }

  // Get company and plan details
  const company = await storage.getCompany(user.companyId);
  const plans = await storage.getSubscriptionPlans();
  const plan = plans.find((p: typeof plans[0]) => p.id === planId);

  if (!plan) {
    throw new NotFoundError("Subscription plan");
  }

  const priceId = billingInterval === "yearly" 
    ? plan.stripePriceIdYearly 
    : plan.stripePriceIdMonthly;

  if (!priceId) {
    throw new BadRequestError("Price not configured for this plan");
  }

  // Create or retrieve Stripe customer in transaction
  const result = await withTransaction(async () => {
    let customerId = company?.stripeCustomerId;
    
    if (!customerId) {
      try {
        const customer = await getStripe().customers.create({
          email: company?.email || user.email || undefined,
          name: company?.name,
          metadata: {
            companyId: user.companyId,
            userId: user.id,
          },
        });
        customerId = customer.id;
        
        // Update company with Stripe customer ID
        if (user.companyId) {
          await storage.updateCompany(user.companyId, { stripeCustomerId: customerId });
        }
      } catch (stripeError) {
        const errorMessage = stripeError instanceof Error ? stripeError.message : "Unknown error";
        throw new StripeError("Failed to create customer", { error: errorMessage });
      }
    }

    // Create Checkout Session
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || "http://localhost:3000"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/subscription/cancelled`,
      metadata: {
        companyId: user.companyId,
        planId: planId,
        userId: user.id,
      },
    });

    return { sessionId: session.id, url: session.url };
  });

  res.json({ success: true, ...result });
}));

/**
 * POST /api/payments/create-portal-session
 * Create a Stripe Customer Portal session for managing subscription
 */
router.post("/create-portal-session", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.claims?.sub || authReq.user?.id;
    const user = await storage.getUserById_Internal(userId);
    
    if (!user || !user.companyId) {
      return res.status(400).json({ error: "User must belong to a company" });
    }

    const company = await storage.getCompany(user.companyId);
    
    if (!company?.stripeCustomerId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${process.env.APP_URL || "http://localhost:3000"}/subscription`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Error creating portal session');
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

/**
 * GET /api/payments/subscription-status
 * Get current subscription status for user's company
 */
router.get("/subscription-status", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.claims?.sub || authReq.user?.id;
    const user = await storage.getUserById_Internal(userId);
    
    if (!user || !user.companyId) {
      return res.status(400).json({ error: "User must belong to a company" });
    }

    const company = await storage.getCompany(user.companyId);
    
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Get subscription history
    const history = await storage.getSubscriptionHistory(user.companyId);

    res.json({
      success: true,
      subscription: {
        plan: company.subscriptionPlan,
        status: company.stripeSubscriptionStatus,
        currentPeriodEnd: company.stripeCurrentPeriodEnd,
        isExempt: company.isSubscriptionExempt,
        customerId: company.stripeCustomerId,
        subscriptionId: company.stripeSubscriptionId,
      },
      history,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Error fetching subscription status');
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 */
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: "Missing signature or webhook secret" });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Webhook signature verification failed');
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info({ eventType: event.type }, 'Unhandled webhook event type');
    }

    res.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, eventType: event.type }, 'Error handling webhook');
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const companyId = subscription.metadata.companyId;

  if (!companyId) {
    logger.error({ subscriptionId: subscription.id }, 'No companyId in subscription metadata');
    return;
  }

  const planId = subscription.metadata.planId || "professional";
  const currentPeriodEnd = subscription.current_period_end;

  await storage.updateCompany(companyId, {
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: subscription.status,
    stripeCurrentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
    subscriptionPlan: planId as "free" | "pro" | "premium" | "enterprise" | "full" | "free_ecp",
    subscriptionStartDate: new Date(subscription.created * 1000),
  });

  // Log subscription history
  await storage.createSubscriptionHistory({
    companyId,
    eventType: "updated",
    newPlan: planId,
    reason: `Subscription ${subscription.status}`,
    metadata: { subscriptionId: subscription.id },
  });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const companyId = subscription.metadata.companyId;
  
  if (!companyId) return;

  const company = await storage.getCompany(companyId);

  await storage.updateCompany(companyId, {
    stripeSubscriptionStatus: "cancelled",
    subscriptionCancelledAt: new Date(),
    subscriptionPlan: "free_ecp",
  });

  // Log cancellation
  await storage.createSubscriptionHistory({
    companyId,
    eventType: "cancelled",
    oldPlan: company?.subscriptionPlan,
    newPlan: "free_ecp",
    reason: "Subscription cancelled",
  });
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const paymentIntent = invoice.payment_intent;
  
  // Record payment intent
  if (paymentIntent) {
    const company = await storage.getCompanyByStripeCustomerId(customerId);

    if (company) {
      await storage.createPaymentIntent({
        id: paymentIntent as string,
        companyId: company.id,
        amount: invoice.amount_paid,
        currency: invoice.currency.toUpperCase(),
        status: "succeeded",
        customerId: customerId,
        subscriptionId: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id || null,
        metadata: { invoiceId: invoice.id },
      });
    }
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  const company = await storage.getCompanyByStripeCustomerId(customerId);

  if (company) {
    await storage.createSubscriptionHistory({
      companyId: company.id,
      eventType: "payment_failed",
      reason: `Payment failed for invoice ${invoice.id}`,
      metadata: { invoiceId: invoice.id },
    });
  }
}

export function registerPaymentRoutes(app: Express): void {
  app.use("/api/payments", router);
}
