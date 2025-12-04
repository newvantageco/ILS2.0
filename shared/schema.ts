/**
 * UNIFIED SCHEMA EXPORT
 *
 * This file provides the main export point for all modular schema definitions.
 *
 * MIGRATION STATUS:
 * - Phase 1 Complete: Foundation tables (companies, users, patients, orders)
 * - Phase 2 Complete: System tables (permissions, roles, RBAC, audit logs)
 * - Phase 3a Complete: Communications tables (notifications, messages, messageTemplates)
 * - Remaining: ~200 tables still in schemaLegacy.ts awaiting extraction (Phase 3b-4)
 *
 * USAGE:
 * ```typescript
 * // Import from modular domains:
 * import { users, companies } from '@shared/schema/core';
 * import { patients } from '@shared/schema/patients';
 * import { orders } from '@shared/schema/orders';
 * import { permissions, auditLogs } from '@shared/schema/system';
 * import { notifications, messages } from '@shared/schema/communications';
 *
 * // Or use the unified export:
 * import { users, orders, patients, permissions, notifications } from '@shared/schema';
 *
 * // For tables not yet extracted, import from schemaLegacy:
 * import { appointments, equipment } from '@shared/schemaLegacy';
 * ```
 *
 * NOTE: schemaLegacy.ts is NOT re-exported here to avoid duplicate export conflicts.
 * Import directly from schemaLegacy for tables not yet extracted to modular domains.
 */

// Re-export all modular schema tables
export * from './schema/index';

// Re-export remaining tables from schemaLegacy (backward compatibility)
// TODO: 65 duplicate tables need to be commented out in schemaLegacy.ts
// For now, we'll address duplicates as they cause conflicts
export * from './schemaLegacy';
