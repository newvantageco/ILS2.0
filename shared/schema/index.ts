/**
 * Schema Index - Modular Schema Exports
 *
 * This file provides a unified export for modular schema definitions.
 * It re-exports from domain-specific schema modules while maintaining
 * backward compatibility with the main schema.ts file.
 *
 * @module shared/schema
 */

// ============================================
// CORE EXPORTS
// ============================================

// Core enums - shared across domains
export * from './core/enums';

// ============================================
// DOMAIN EXPORTS
// ============================================

// AI Domain - conversations, knowledge base, learning
export * from './ai';

// Clinical Domain - examinations, prescriptions, test rooms
export * from './clinical';

// Billing Domain - invoices, payments, subscriptions
export * from './billing';

// Inventory Domain - products, stock, frame characteristics
export * from './inventory';

// Future domains (uncomment as migration progresses):
// export * from './analytics';
// export * from './nhs';
// export * from './communications';

// ============================================
// BACKWARD COMPATIBILITY
// ============================================

/**
 * Re-export everything from main schema for backward compatibility.
 * This ensures existing imports continue to work:
 *
 * ```typescript
 * import { users, orders } from '@shared/schema';
 * ```
 *
 * New code can use domain imports:
 *
 * ```typescript
 * import { aiConversations } from '@shared/schema/ai';
 * ```
 */
export * from '../schema';
