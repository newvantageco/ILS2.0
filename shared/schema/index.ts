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

// Core tables and enums - foundation of multi-tenant architecture
export * from './core';

// ============================================
// DOMAIN EXPORTS
// ============================================

// Patients Domain - patient records and activity
export * from './patients';

// Orders Domain - order management, timeline, consultation logs
export * from './orders';

// System Domain - permissions, roles, RBAC, audit logs (HIPAA/GOC compliance)
export * from './system';

// AI Domain - conversations, knowledge base, learning
export * from './ai/index';
export * from './ai';  // Additional AI tables (risk scores, recommendations, PDSA cycles)

// Clinical Domain - examinations, prescriptions, test rooms
export * from './clinical';

// Billing Domain - invoices, payments, subscriptions
export * from './billing';

// Inventory Domain - products, stock, frame characteristics
export * from './inventory';

// Analytics Domain - metrics, audit logs, SaaS analytics
export * from './analytics';

// NHS Domain - UK healthcare NHS/PCSE integration
export * from './nhs';

// Communications Domain - email templates, logs, tracking
export * from './communications';

// Healthcare Domain - care plans, PDSA cycles, risk scores
export * from './healthcare';

// Appointments Domain - scheduling, bookings, calendar management
export * from './appointments';

// Contact Lens Domain - assessments, fittings, prescriptions, aftercare
export * from './contactlens';

// Patient Portal Domain - self-service portal, messaging, documents
export * from './patientportal';

// Lab Domain - laboratory tests, results, quality control
export * from './lab';

// EHR Domain - electronic health records, medications, allergies, clinical notes
export * from './ehr';

// Insurance Domain - claims, payers, eligibility, preauthorizations
export * from './insurance';

// Quality Domain - quality measures, star ratings, gap analyses, dashboards
export * from './quality';

// Population Health Domain - risk stratification, predictive analytics, SDOH
export * from './populationhealth';

// Campaigns Domain - marketing campaigns, audience segments, campaign tracking
export * from './campaigns';

// CDS Domain - clinical decision support, drug interactions, guidelines, alerts
export * from './cds';

// Workflows Domain - automated patient engagement, workflow automation
export * from './workflows';

// Predictive Domain - ML/AI predictions, risk stratification, outcome forecasting
export * from './predictive';

// ============================================
// BACKWARD COMPATIBILITY REMOVED
// ============================================

/**
 * MIGRATION COMPLETE: Foundation tables (companies, users, sessions, userRoles,
 * patients, orders) are now exported from their respective modular domains.
 *
 * The monolithic schema.ts backward compatibility export has been removed.
 * All table imports now use the modular schema structure:
 *
 * ```typescript
 * import { users, companies } from '@shared/schema/core';
 * import { patients } from '@shared/schema/patients';
 * import { orders } from '@shared/schema/orders';
 * ```
 *
 * Or use the unified export:
 *
 * ```typescript
 * import { users, orders, patients } from '@shared/schema';
 * ```
 */
