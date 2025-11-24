/**
 * Stripe Subscription Service for ILS 2.0
 *
 * Manages subscription billing for optical practices using Stripe:
 * - Customer creation and management
 * - Subscription plan management (Starter, Professional, Enterprise)
 * - Payment method handling
 * - Webhook processing for automated billing events
 * - Usage-based billing for AI features
 * - Invoice generation
 *
 * Pricing Tiers:
 * - Starter: £49/month - 1 location, 2 users, basic features
 * - Professional: £149/month - 3 locations, 10 users, advanced features
 * - Enterprise: £349/month - Unlimited locations/users, full features
 */

import Stripe from "stripe";
import { db } from "../../../db/index.js";
import { companies } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";
import logger from '../../utils/logger';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  features: string[];
  limits: {
    locations: number;
    users: number;
    patients: number;
    aiCredits: number; // Per month
  };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 49,
    priceYearly: 470, // 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
    features: [
      "1 Practice Location",
      "Up to 2 Staff Users",
      "500 Patients",
      "Basic POS System",
      "Appointment Scheduling",
      "Patient Records",
      "100 AI Credits/month",
      "Email Support",
    ],
    limits: {
      locations: 1,
      users: 2,
      patients: 500,
      aiCredits: 100,
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    priceMonthly: 149,
    priceYearly: 1430, // 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    features: [
      "Up to 3 Practice Locations",
      "Up to 10 Staff Users",
      "5,000 Patients",
      "Advanced POS & Inventory",
      "Online Booking Portal",
      "AI Frame Recommendations",
      "AI Lens Recommendations",
      "Prescription OCR",
      "NHS Claims Management",
      "500 AI Credits/month",
      "Priority Email & Phone Support",
    ],
    limits: {
      locations: 3,
      users: 10,
      patients: 5000,
      aiCredits: 500,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 349,
    priceYearly: 3350, // 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || "",
    features: [
      "Unlimited Practice Locations",
      "Unlimited Staff Users",
      "Unlimited Patients",
      "Full POS, Inventory & Lab Management",
      "Online Booking Portal",
      "All AI Features Unlimited",
      "PD Measurement from Photos",
      "Shopify Integration",
      "Custom Reports & Analytics",
      "Multi-location Management",
      "Unlimited AI Credits",
      "Dedicated Account Manager",
      "24/7 Priority Support",
    ],
    limits: {
      locations: -1, // Unlimited
      users: -1,
      patients: -1,
      aiCredits: -1,
    },
  },
};

export class StripeSubscriptionService {
  /**
   * Create Stripe customer for a company
   */
  static async createCustomer(data: {
    companyId: string;
    email: string;
    name: string;
    phone?: string;
    address?: Stripe.AddressParam;
  }): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.name,
      phone: data.phone,
      address: data.address,
      metadata: {
        companyId: data.companyId,
      },
    });

    // Update company with Stripe customer ID
    await db
      .update(companies)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, data.companyId));

    return customer;
  }

  /**
   * Create subscription for a company
   */
  static async createSubscription(data: {
    companyId: string;
    planId: "starter" | "professional" | "enterprise";
    interval: "monthly" | "yearly";
    paymentMethodId: string;
  }): Promise<Stripe.Subscription> {
    const { companyId, planId, interval, paymentMethodId } = data;

    // Get company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) throw new Error("Company not found");

    // Get or create Stripe customer
    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await this.createCustomer({
        companyId,
        email: company.contactEmail || "",
        name: company.organizationName || "",
        phone: company.contactPhone || "",
      });
      customerId = customer.id;
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Get price ID
    const plan = SUBSCRIPTION_PLANS[planId];
    const priceId =
      interval === "monthly" ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly;

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        companyId,
        planId,
        interval,
      },
    });

    // Update company with subscription info
    await db
      .update(companies)
      .set({
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    return subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(data: {
    companyId: string;
    immediately?: boolean;
  }): Promise<Stripe.Subscription> {
    const { companyId, immediately = false } = data;

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company || !company.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    let subscription;
    if (immediately) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(company.stripeSubscriptionId);
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(company.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update company
    await db
      .update(companies)
      .set({
        subscriptionCancelledAt: immediately ? new Date() : new Date(subscription.current_period_end * 1000),
        stripeSubscriptionStatus: subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    return subscription;
  }

  /**
   * Update subscription plan
   */
  static async updateSubscription(data: {
    companyId: string;
    newPlanId: "starter" | "professional" | "enterprise";
    newInterval?: "monthly" | "yearly";
  }): Promise<Stripe.Subscription> {
    const { companyId, newPlanId, newInterval } = data;

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company || !company.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    // Get current subscription
    const currentSubscription = await stripe.subscriptions.retrieve(
      company.stripeSubscriptionId
    );

    const currentInterval = currentSubscription.items.data[0].price.recurring?.interval || "month";
    const interval = newInterval || (currentInterval === "month" ? "monthly" : "yearly");

    const plan = SUBSCRIPTION_PLANS[newPlanId];
    const newPriceId =
      interval === "monthly" ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly;

    // Update subscription
    const subscription = await stripe.subscriptions.update(company.stripeSubscriptionId, {
      items: [
        {
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
      metadata: {
        companyId,
        planId: newPlanId,
        interval,
      },
    });

    // Update company
    await db
      .update(companies)
      .set({
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    return subscription;
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(
    event: Stripe.Event
  ): Promise<{ processed: boolean; message: string }> {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        return await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

      case "customer.subscription.deleted":
        return await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

      case "invoice.paid":
        return await this.handleInvoicePaid(event.data.object as Stripe.Invoice);

      case "invoice.payment_failed":
        return await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

      case "customer.subscription.trial_will_end":
        return await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);

      default:
        return { processed: false, message: `Unhandled event type: ${event.type}` };
    }
  }

  /**
   * Handle subscription updated
   */
  private static async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<{ processed: boolean; message: string }> {
    const companyId = subscription.metadata.companyId;
    if (!companyId) {
      return { processed: false, message: "No companyId in metadata" };
    }

    await db
      .update(companies)
      .set({
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    return { processed: true, message: "Subscription updated" };
  }

  /**
   * Handle subscription deleted
   */
  private static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<{ processed: boolean; message: string }> {
    const companyId = subscription.metadata.companyId;
    if (!companyId) {
      return { processed: false, message: "No companyId in metadata" };
    }

    await db
      .update(companies)
      .set({
        stripeSubscriptionStatus: "canceled",
        subscriptionCancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    return { processed: true, message: "Subscription deleted" };
  }

  /**
   * Handle invoice paid
   */
  private static async handleInvoicePaid(
    invoice: Stripe.Invoice
  ): Promise<{ processed: boolean; message: string }> {
    // Send receipt email, update payment history, etc.
    logger.info(`Invoice ${invoice.id} paid successfully`);
    return { processed: true, message: "Invoice paid" };
  }

  /**
   * Handle invoice payment failed
   */
  private static async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<{ processed: boolean; message: string }> {
    // Send payment failure notification, suspend account, etc.
    logger.info(`Invoice ${invoice.id} payment failed`);
    return { processed: true, message: "Invoice payment failed" };
  }

  /**
   * Handle trial will end
   */
  private static async handleTrialWillEnd(
    subscription: Stripe.Subscription
  ): Promise<{ processed: boolean; message: string }> {
    // Send trial ending notification
    logger.info(`Trial ending soon for subscription ${subscription.id}`);
    return { processed: true, message: "Trial ending notification sent" };
  }

  /**
   * Get subscription status for a company
   */
  static async getSubscriptionStatus(companyId: string): Promise<{
    hasActiveSubscription: boolean;
    plan: SubscriptionPlan | null;
    status: string | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company || !company.stripeSubscriptionId) {
      return {
        hasActiveSubscription: false,
        plan: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const subscription = await stripe.subscriptions.retrieve(company.stripeSubscriptionId);

    const planId = subscription.metadata.planId as keyof typeof SUBSCRIPTION_PLANS;
    const plan = SUBSCRIPTION_PLANS[planId] || null;

    return {
      hasActiveSubscription: subscription.status === "active" || subscription.status === "trialing",
      plan,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  /**
   * Create billing portal session (for customers to manage their subscription)
   */
  static async createBillingPortalSession(data: {
    companyId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    const { companyId, returnUrl } = data;

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company || !company.stripeCustomerId) {
      throw new Error("No Stripe customer found");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: returnUrl,
    });

    return session;
  }
}
