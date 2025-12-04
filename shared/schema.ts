/**
 * TEMPORARY RE-EXPORT SHIM
 *
 * This file provides backward compatibility for the 142 files still importing
 * from the old monolithic schema.ts location.
 *
 * MIGRATION STATUS:
 * - Phase 1 Complete: Foundation tables (companies, users, patients, orders) extracted to modular domains
 * - Phase 2 Complete: System tables (permissions, roles, RBAC, audit logs) extracted to system domain
 * - Remaining: 137 tables still in schema.ts.OLD awaiting extraction (Phase 3-4)
 *
 * This shim exports:
 * 1. Modular schema tables (from schema/index)
 * 2. Remaining tables from schema.ts.OLD (temporary, until Phase 3-4 complete)
 *
 * DO NOT ADD NEW IMPORTS TO THIS FILE.
 * All new code should import from the modular schema structure:
 *
 * ```typescript
 * import { users, companies } from '@shared/schema/core';
 * import { patients } from '@shared/schema/patients';
 * import { orders } from '@shared/schema/orders';
 * import { permissions, auditLogs } from '@shared/schema/system';
 * ```
 *
 * Or use the unified export:
 *
 * ```typescript
 * import { users, orders, patients, permissions } from '@shared/schema';
 * ```
 *
 * TODO: Complete Phase 3-4 to extract remaining 137 tables, then delete this file.
 */

// Re-export modular schema tables (Phase 1 & 2 extractions)
export * from './schema/index';

// TEMPORARY: Re-export remaining tables from schemaLegacy.ts (Phase 3-4 awaiting extraction)
// This provides backward compatibility while migration continues
export * from './schemaLegacy';
