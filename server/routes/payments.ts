/**
 * Stripe Payment Integration Routes
 * 
 * Handles subscription management, payment processing, and webhooks
 * for the Integrated Lens System
 */

import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "../storage";

const router = Router();

// Initialize Stripe (use environment variable in production)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-10-28.acacia",
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Middleware to check if user is authenticated
 */
function isAuthenticated(req: any, res: Response, next: Function) {
  if (req.user) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

/**
 * Middleware to check if user is platform admin
 */
function isPlatformAdmin(req: any, res: Response, next: Function) {
  if (req.user && req.user.role === "platform_admin") {
    return next();
  }
  res.status(403).json({ error: "Platform admin access required" });
}

/**
 * GET /api/payments/subscription-plans
 * Get all available subscription plans
 */
router.get("/subscription-plans", async (req: Request, res: Response) => {
  try {
    const plans = await storage.db.select().from(storage.subscriptionPlans).where({ isActive: true });
    res.json({ success: true, plans });
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe Checkout session for subscription
 */
router.post("/create-checkout-session", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    const user = await storage.getUser(userId);
    
    if (!user || !user.companyId) {
      return res.status(400).json({ error: "User must belong to a company" });
    }

    const { planId, billingInterval } = req.body; // monthly or yearly

    if (!planId || !billingInterval) {
      return res.status(400).json({ error: "Plan ID and billing interval required" });
    }

    // Get company and plan details
    const company = await storage.getCompany(user.companyId);
    const plan = await storage.db.select().from(storage.subscriptionPlans).where({ id: planId }).limit(1);

    if (!plan || plan.length === 0) {
      return res.status(404).json({ error: "Subscription plan not found" });
    }

    const selectedPlan = plan[0];
    const priceId = billingInterval === "yearly" 
      ? selectedPlan.stripePriceIdYearly 
      : selectedPlan.stripePriceIdMonthly;

    if (!priceId) {
      return res.status(400).json({ error: "Price not configured for this plan" });
    }

    // Create or retrieve Stripe customer
    let customerId = company?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company?.email || user.email,
        name: company?.name,
        metadata: {
          companyId: user.companyId,
          userId: user.id,
        },
      });
      customerId = customer.id;
      
      // Update company with Stripe customer ID
      await storage.updateCompany(user.companyId, { stripeCustomerId: customerId });
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

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session", message: error.message });
  }
});

/**
 * POST /api/payments/create-portal-session
 * Create a Stripe Customer Portal session for managing subscription
 */
router.post("/create-portal-session", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    const user = await storage.getUser(userId);
    
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
    console.error("Error creating portal session:", error);
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
    const user = await storage.getUser(userId);
    
    if (!user || !user.companyId) {
      return res.status(400).json({ error: "User must belong to a company" });
    }

    const company = await storage.getCompany(user.companyId);
    
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Get subscription history
    const history = await storage.db.select()
      .from(storage.subscriptionHistory)
      .where({ companyId: user.companyId })
      .orderBy({ createdAt: "desc" })
      .limit(10);

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
    console.error("Error fetching subscription status:", error);
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
    console.error("Webhook signature verification failed:", err.message);
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const companyId = subscription.metadata.companyId;
  
  if (!companyId) {
    console.error("No companyId in subscription metadata");
    return;
  }

  const planId = subscription.metadata.planId || "professional";

  await storage.updateCompany(companyId, {
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: subscription.status,
    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    subscriptionPlan: planId as any,
    subscriptionStartDate: new Date(subscription.created * 1000),
  });

  // Log subscription history
  await storage.db.insert(storage.subscriptionHistory).values({
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
  await storage.db.insert(storage.subscriptionHistory).values({
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
  
  // Record payment intent
  if (invoice.payment_intent) {
    const companies = await storage.db.select()
      .from(storage.companies)
      .where({ stripeCustomerId: customerId })
      .limit(1);

    if (companies.length > 0) {
      await storage.db.insert(storage.stripePaymentIntents).values({
        id: invoice.payment_intent as string,
        companyId: companies[0].id,
        amount: invoice.amount_paid,
        currency: invoice.currency.toUpperCase(),
        status: "succeeded",
        customerId: customerId,
        subscriptionId: invoice.subscription as string,
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
  
  const companies = await storage.db.select()
    .from(storage.companies)
    .where({ stripeCustomerId: customerId })
    .limit(1);

  if (companies.length > 0) {
    await storage.db.insert(storage.subscriptionHistory).values({
      companyId: companies[0].id,
      eventType: "payment_failed",
      reason: `Payment failed for invoice ${invoice.id}`,
      metadata: { invoiceId: invoice.id },
    });
  }
}

export function registerPaymentRoutes(app: any) {
  app.use("/api/payments", router);
}
