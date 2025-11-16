/**
 * Stripe Payment Integration Routes
 * 
 * Handles subscription management, payment processing, and webhooks
 * for the Integrated Lens System
 */

import { Router, Request, Response } from "express";
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

const router = Router();
const logger = createLogger('payments');

// Initialize Stripe
// CRITICAL: STRIPE_SECRET_KEY must be set in production
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY environment variable is required. " +
    "Payment processing cannot function without it. " +
    "Set this in your .env file or environment configuration."
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  logger.warn('STRIPE_WEBHOOK_SECRET is not set - webhook signature verification will fail');
}

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Middleware to check if user is authenticated
 */
function isAuthenticated(req: any, res: Response, next: Function) {
  if (req.user) {
    return next();
  }
  throw new UnauthorizedError("Authentication required");
}

/**
 * Middleware to check if user is platform admin
 */
function isPlatformAdmin(req: any, res: Response, next: Function) {
  if (req.user && req.user.role === "platform_admin") {
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
router.post("/create-checkout-session", isAuthenticated, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.claims?.sub || req.user?.id;
  const user = await storage.getUserById_Internal(userId);
  
  if (!user || !user.companyId) {
    throw new BadRequestError("User must belong to a company");
  }

  const { planId, billingInterval } = req.body;

  if (!planId || !billingInterval) {
    throw new BadRequestError("Plan ID and billing interval required");
  }

  // Get company and plan details
  const company = await storage.getCompany(user.companyId);
  const plans = await storage.getSubscriptionPlans();
  const plan = plans.find(p => p.id === planId);

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
        const customer = await stripe.customers.create({
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
      } catch (stripeError: any) {
        throw new StripeError("Failed to create customer", { error: stripeError.message });
      }
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
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
router.post("/create-portal-session", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    const user = await storage.getUserById_Internal(userId);
    
    if (!user || !user.companyId) {
      return res.status(400).json({ error: "User must belong to a company" });
    }

    const company = await storage.getCompany(user.companyId);
    
    if (!company?.stripeCustomerId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${process.env.APP_URL || "http://localhost:3000"}/subscription`,
    });

    res.json({ success: true, url: session.url });
  } catch (error: any) {
    logger.error({ error, userId, companyId: user?.companyId }, 'Error creating portal session');
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

/**
 * GET /api/payments/subscription-status
 * Get current subscription status for user's company
 */
router.get("/subscription-status", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
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
  } catch (error: any) {
    logger.error({ error, userId, companyId: user?.companyId }, 'Error fetching subscription status');
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
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error({ error: err }, 'Webhook signature verification failed');
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
  } catch (error: any) {
    logger.error({ error, eventType: event.type }, 'Error handling webhook');
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
  const currentPeriodEnd = (subscription as any).current_period_end;

  await storage.updateCompany(companyId, {
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: subscription.status,
    stripeCurrentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
    subscriptionPlan: planId as any,
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
  const paymentIntent = (invoice as any).payment_intent;
  
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
        subscriptionId: (invoice as any).subscription as string,
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

export function registerPaymentRoutes(app: any) {
  app.use("/api/payments", router);
}
