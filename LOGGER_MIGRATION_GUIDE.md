# Console.log → Pino Logger Migration Guide

## Overview
Converting 1,155+ `console.*` statements across the server codebase to use structured Pino logging.

**Status:** In progress
- ✅ aiWorker.ts (26 statements) - COMPLETE
- ⏳ routes.ts (160 statements) - NEXT PRIORITY
- ⏳ ecp.ts (37 statements)
- ⏳ QueueService.ts (28 statements)
- ⏳ index.ts (27 statements)
- ⏳ 45+ other files

## Pino Logger Format

All logger calls must follow Pino's format:

```typescript
// IMPORT
import logger from '../utils/logger';

// FORMAT: logger.METHOD(metadata, message)
logger.info({ contextKey: value }, 'Human readable message');
logger.warn({ error: errorMsg }, 'Warning message');
logger.error({ error: errorMsg, context: data }, 'Error message');
logger.debug({ details: data }, 'Debug message');
```

### Key Rules
1. **Metadata first, message second** - Pino format is `(metadata, message)` NOT `(message, metadata)`
2. **Include contextual data** in metadata object for searchability/debugging
3. **Message as simple string** - Include user-facing context in metadata, not message
4. **Error handling** - Always pass error message, not error object: `{ error: err instanceof Error ? err.message : String(err) }`

## Conversion Patterns

### Pattern 1: Simple Info Log
```typescript
// BEFORE
console.log('Processing order');

// AFTER
logger.info({ context: 'orderProcessing' }, 'Processing order');
```

### Pattern 2: Contextual Info
```typescript
// BEFORE
console.log(`Processing order ${orderId}`);

// AFTER
logger.info({ orderId }, 'Processing order');
```

### Pattern 3: Error with Message
```typescript
// BEFORE
console.error("Failed to fetch JWKS", error as Error);

// AFTER
logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch JWKS');
```

### Pattern 4: Warning with Details
```typescript
// BEFORE
console.warn("LIMS integration unavailable, creating order directly:", limsError.message);

// AFTER
logger.warn({ limsUnavailable: true, error: limsError.message }, 'LIMS unavailable, using fallback');
```

### Pattern 5: Debug with Structured Data
```typescript
// BEFORE
console.log(`User ${userId} switched role to ${role}`);

// AFTER
logger.debug({ userId, newRole: role }, 'User switched role');
```

## File Priority Order

Based on console statement count (descending):

1. **routes.ts** (160) - High impact, core business logic
2. **ecp.ts** (37) - Feature-specific routes
3. **testDynamicRBAC.ts** (32) - Test file, lower priority
4. **QueueService.ts** (28) - Background job orchestration
5. **index.ts** (27) - Initialization and startup
6. **aiWorker.ts** (26) - ✅ COMPLETE
7. **OrderHandlers.ts** (24) - Event handlers
8. **nhs.ts** (22) - NHS integration routes
9. **notificationWorker.ts** (19)
10. **ScheduledEmailService.ts** (19)
... and 40+ more files

## Automated Replacement Strategy

### Semi-Manual Approach (Recommended)
For each file:
1. Add logger import at top: `import logger from '../utils/logger';`
2. Use search/replace in VS Code with regex patterns (see below)
3. Manually verify context to ensure metadata is semantically correct
4. Run TypeScript check: `npm run check`

### Regex Patterns for Search/Replace

**Find simple console.log statements:**
```regex
console\.log\(`([^`]+)`\)
```
Replace with: `logger.info({ context: 'source' }, '$1');` then verify

**Find console.error statements:**
```regex
console\.error\(`([^`]+)`\)
```
Replace with: `logger.error({ error: 'unknown' }, '$1');` then verify

**Find statements with context variables:**
```regex
console\.log\(`([^$]+)\$\{([^}]+)\}([^`]*)`\)
```
This requires manual review to extract context properly.

## Implementation Timeline

### Phase 1: Critical Files (this week)
- [ ] routes.ts (160) - 2-3 hours manual work
- [ ] index.ts (27) - 30 min
- [ ] QueueService.ts (28) - 45 min

### Phase 2: Service Files (next week)
- [ ] OrderHandlers.ts (24)
- [ ] ScheduledEmailService.ts (19)
- [ ] CacheService.ts (13)

### Phase 3: Route Feature Files (week after)
- [ ] ecp.ts (37)
- [ ] nhs.ts (22)
- [ ] Remaining route files

### Phase 4: Tests & Scripts (optional)
- [ ] testDynamicRBAC.ts (32)
- [ ] setNewVantagePassword.ts (20)
- [ ] seedPermissions.ts (17)

## Validation Checklist

After migrating each file:

- [ ] `npm run check` passes (zero TypeScript errors)
- [ ] All console.* statements replaced (grep for 'console\.' should return 0)
- [ ] Logger import added
- [ ] Metadata includes relevant context for debugging
- [ ] No breaking changes to functionality
- [ ] Error messages are clear and actionable

## Example: Complete routes.ts Migration

Before (sample):
```typescript
console.log('Processing order');
console.error("Error creating order:", error);
console.log(`User ${userId} switched role to ${role}`);
```

After:
```typescript
import logger from '../utils/logger';

logger.info({ context: 'orderProcessing' }, 'Processing order');
logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error creating order');
logger.info({ userId, newRole: role }, 'User switched role');
```

## Benefits

1. **Structured Logs** - All logs are JSON-serializable for centralized logging services
2. **Searchability** - Filter logs by metadata (userId, orderId, provider, etc.)
3. **Performance** - Pino is optimized for production logging
4. **Consistency** - Single logging pattern across entire codebase
5. **Debugging** - Rich context in logs makes troubleshooting easier
6. **Production Ready** - Aligns with enterprise logging standards

## Questions?

Refer to Pino documentation: https://getpino.io/
Or check existing implementations in:
- server/services/AuthService.ts (OAuth token refresh)
- server/utils/logger.ts (logger configuration)
- server/middleware/requestLogger.ts (middleware logging)
