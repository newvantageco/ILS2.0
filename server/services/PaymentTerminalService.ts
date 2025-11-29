/**
 * Payment Terminal Service
 *
 * Integrates with Stripe Terminal for in-person card payments.
 * Supports:
 * - Terminal reader registration
 * - Payment intent creation for terminal payments
 * - Connection token generation for Stripe Terminal SDK
 * - Reader status monitoring
 *
 * NHS PCSE Compliant - Audit logging and secure storage
 */

import Stripe from 'stripe';
import { db } from "../db";
import * as schema from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import logger from "../utils/logger";

// Initialize Stripe
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required for payment terminal");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });
  }
  return stripe;
}

export interface TerminalReader {
  id: string;
  companyId: string;
  readerId: string;
  readerLabel: string;
  readerType: string;
  locationId?: string;
  status: 'online' | 'offline' | 'busy';
  lastSeenAt?: Date;
  registeredAt: Date;
  metadata?: Record<string, any>;
}

export interface TerminalPaymentRequest {
  companyId: string;
  readerId: string;
  amount: number;
  currency?: string;
  description?: string;
  patientId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

export interface TerminalPaymentResult {
  success: boolean;
  paymentIntentId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export class PaymentTerminalService {
  /**
   * Generate a connection token for Stripe Terminal SDK
   * Used by the client-side terminal SDK to connect to readers
   */
  static async createConnectionToken(companyId: string): Promise<string> {
    try {
      const stripeClient = getStripe();

      const connectionToken = await stripeClient.terminal.connectionTokens.create();

      logger.info({
        context: 'PaymentTerminalService',
        action: 'createConnectionToken',
        companyId,
      }, 'Connection token created');

      return connectionToken.secret;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'createConnectionToken',
        error: error instanceof Error ? error.message : String(error),
        companyId,
      }, 'Failed to create connection token');
      throw error;
    }
  }

  /**
   * Register a new terminal reader for a company location
   */
  static async registerReader(
    companyId: string,
    registrationCode: string,
    label: string,
    locationId?: string
  ): Promise<Stripe.Terminal.Reader> {
    try {
      const stripeClient = getStripe();

      // Register the reader with Stripe
      const reader = await stripeClient.terminal.readers.create({
        registration_code: registrationCode,
        label: label,
        location: locationId,
      });

      logger.info({
        context: 'PaymentTerminalService',
        action: 'registerReader',
        companyId,
        readerId: reader.id,
        label,
      }, 'Terminal reader registered');

      return reader;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'registerReader',
        error: error instanceof Error ? error.message : String(error),
        companyId,
      }, 'Failed to register terminal reader');
      throw error;
    }
  }

  /**
   * List available terminal readers for a company
   */
  static async listReaders(companyId: string, locationId?: string): Promise<Stripe.Terminal.Reader[]> {
    try {
      const stripeClient = getStripe();

      const params: Stripe.Terminal.ReaderListParams = {
        limit: 100,
      };

      if (locationId) {
        params.location = locationId;
      }

      const readers = await stripeClient.terminal.readers.list(params);

      return readers.data;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'listReaders',
        error: error instanceof Error ? error.message : String(error),
        companyId,
      }, 'Failed to list terminal readers');
      throw error;
    }
  }

  /**
   * Create a payment intent for terminal payment
   * This is called when user selects card payment at the POS
   */
  static async createTerminalPaymentIntent(
    request: TerminalPaymentRequest
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripeClient = getStripe();

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to pence/cents
        currency: request.currency || 'gbp',
        payment_method_types: ['card_present'],
        capture_method: 'automatic',
        description: request.description || 'POS Transaction',
        metadata: {
          companyId: request.companyId,
          readerId: request.readerId,
          patientId: request.patientId || '',
          orderId: request.orderId || '',
          source: 'payment_terminal',
          ...request.metadata,
        },
      });

      logger.info({
        context: 'PaymentTerminalService',
        action: 'createTerminalPaymentIntent',
        paymentIntentId: paymentIntent.id,
        amount: request.amount,
        companyId: request.companyId,
      }, 'Terminal payment intent created');

      return paymentIntent;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'createTerminalPaymentIntent',
        error: error instanceof Error ? error.message : String(error),
        companyId: request.companyId,
      }, 'Failed to create terminal payment intent');
      throw error;
    }
  }

  /**
   * Process payment on a specific terminal reader
   * Sends payment intent to the reader for customer to tap/insert card
   */
  static async processPayment(
    readerId: string,
    paymentIntentId: string,
    companyId: string
  ): Promise<Stripe.Terminal.Reader> {
    try {
      const stripeClient = getStripe();

      // Send payment to the reader
      const reader = await stripeClient.terminal.readers.processPaymentIntent(
        readerId,
        {
          payment_intent: paymentIntentId,
        }
      );

      logger.info({
        context: 'PaymentTerminalService',
        action: 'processPayment',
        readerId,
        paymentIntentId,
        companyId,
        readerStatus: reader.status,
      }, 'Payment sent to terminal reader');

      return reader;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'processPayment',
        error: error instanceof Error ? error.message : String(error),
        readerId,
        paymentIntentId,
        companyId,
      }, 'Failed to process payment on terminal');
      throw error;
    }
  }

  /**
   * Cancel a payment that is in progress on a reader
   */
  static async cancelReaderAction(
    readerId: string,
    companyId: string
  ): Promise<Stripe.Terminal.Reader> {
    try {
      const stripeClient = getStripe();

      const reader = await stripeClient.terminal.readers.cancelAction(readerId);

      logger.info({
        context: 'PaymentTerminalService',
        action: 'cancelReaderAction',
        readerId,
        companyId,
      }, 'Reader action cancelled');

      return reader;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'cancelReaderAction',
        error: error instanceof Error ? error.message : String(error),
        readerId,
        companyId,
      }, 'Failed to cancel reader action');
      throw error;
    }
  }

  /**
   * Get current status of a reader
   */
  static async getReaderStatus(
    readerId: string,
    companyId: string
  ): Promise<Stripe.Terminal.Reader> {
    try {
      const stripeClient = getStripe();

      const reader = await stripeClient.terminal.readers.retrieve(readerId);

      return reader;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'getReaderStatus',
        error: error instanceof Error ? error.message : String(error),
        readerId,
        companyId,
      }, 'Failed to get reader status');
      throw error;
    }
  }

  /**
   * Simulate terminal payment in development/test mode
   * For use with Stripe test mode simulated readers
   */
  static async simulateTerminalPayment(
    readerId: string,
    companyId: string
  ): Promise<Stripe.Terminal.Reader> {
    try {
      const stripeClient = getStripe();

      // Only works in test mode with simulated readers
      const reader = await stripeClient.testHelpers.terminal.readers.presentPaymentMethod(
        readerId
      );

      logger.info({
        context: 'PaymentTerminalService',
        action: 'simulateTerminalPayment',
        readerId,
        companyId,
      }, 'Simulated terminal payment');

      return reader;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'simulateTerminalPayment',
        error: error instanceof Error ? error.message : String(error),
        readerId,
        companyId,
      }, 'Failed to simulate terminal payment');
      throw error;
    }
  }

  /**
   * Check payment intent status (used for polling after terminal payment)
   */
  static async getPaymentIntentStatus(
    paymentIntentId: string,
    companyId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripeClient = getStripe();

      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

      return paymentIntent;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'getPaymentIntentStatus',
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId,
        companyId,
      }, 'Failed to get payment intent status');
      throw error;
    }
  }

  /**
   * Create a Stripe Terminal Location (represents a physical store location)
   * Required for registering readers
   */
  static async createLocation(
    companyId: string,
    displayName: string,
    address: {
      line1: string;
      city: string;
      postalCode: string;
      country: string;
      state?: string;
    }
  ): Promise<Stripe.Terminal.Location> {
    try {
      const stripeClient = getStripe();

      const location = await stripeClient.terminal.locations.create({
        display_name: displayName,
        address: {
          line1: address.line1,
          city: address.city,
          postal_code: address.postalCode,
          country: address.country,
          state: address.state,
        },
        metadata: {
          companyId,
        },
      });

      logger.info({
        context: 'PaymentTerminalService',
        action: 'createLocation',
        locationId: location.id,
        displayName,
        companyId,
      }, 'Terminal location created');

      return location;
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'createLocation',
        error: error instanceof Error ? error.message : String(error),
        companyId,
      }, 'Failed to create terminal location');
      throw error;
    }
  }

  /**
   * List locations for a company
   */
  static async listLocations(companyId: string): Promise<Stripe.Terminal.Location[]> {
    try {
      const stripeClient = getStripe();

      const locations = await stripeClient.terminal.locations.list({
        limit: 100,
      });

      // Filter by company metadata if needed
      return locations.data.filter(
        loc => loc.metadata?.companyId === companyId
      );
    } catch (error) {
      logger.error({
        context: 'PaymentTerminalService',
        action: 'listLocations',
        error: error instanceof Error ? error.message : String(error),
        companyId,
      }, 'Failed to list locations');
      throw error;
    }
  }
}

export default PaymentTerminalService;
