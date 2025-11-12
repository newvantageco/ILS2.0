# Remaining TODOs

This document catalogs all remaining TODO/FIXME comments in the codebase for future work.

## ✅ COMPLETED (Critical Security & Features)

- [x] **server/websocket.ts:452** - Implement token validation (COMPLETED: Now validates session via Redis)
- [x] **server/services/NotificationService.ts:140,145** - Implement role/org checks (COMPLETED: Now queries database)
- [x] **server/workers/aiWorker.ts** - All AI/ML features implemented (COMPLETED: Jan 2025)
  - [x] Daily briefing with real data and AI (Claude/GPT)
  - [x] Real database queries for orders/revenue/patients
  - [x] ML-based demand forecasting with historical analysis
  - [x] Statistical anomaly detection (Z-score analysis)
  - [x] AI-powered insight generation
  - [x] AI chat assistant with Claude 3.5 Sonnet / GPT-4
  - **See `AI_ML_FEATURES.md` for complete documentation**

## 🔴 HIGH PRIORITY (Feature Completion)

*All high-priority AI/ML items completed!*

### AuthService
**File:** `server/services/AuthService.ts`

- [ ] **Line 341**: Implement provider-specific token refresh
  - For OAuth providers (Cognito, Auth0, etc.)
  - Not needed if only using session-based auth
  - Should call provider's token refresh endpoint

## 🟡 MEDIUM PRIORITY (Non-Critical)

### Remaining console.log statements
Approximately **250+ console.log statements** should be replaced with structured logger:

- Most are in development/debugging code
- Low security risk but affects production logs
- Use ESLint `no-console` rule to track: `npm run lint`

### TypeScript 'any' types
Approximately **878 'any' types** should be replaced with proper types:

- Largest offenders:
  - `server/routes.ts` (441 instances)
  - `server/storage.ts` (22 instances)
  - `server/services/ProprietaryAIService.ts` (14 instances)
- Use ESLint `@typescript-eslint/no-explicit-any` rule to track

## 🔵 LOW PRIORITY (Future Enhancement)

### Large Files Needing Refactoring

1. **server/routes.ts** (5,469 lines)
   - Split into route modules
   - See [docs/REFACTORING_PLAN.md](./REFACTORING_PLAN.md)

2. **server/storage.ts** (1,885 lines)
   - Split into service classes
   - Consider repository pattern

3. **Large React Components** (67 files >400 lines)
   - Break into smaller components
   - Extract custom hooks
   - Separate container/presentational logic

### Disabled Features

**File:** `server/routes.ts`

- [ ] **Line 72**: Platform AI routes disabled (schema issues)
- [ ] **Line 192**: Platform AI analytics disabled

**File:** `server/services/PlatformAIService.ts`

- [ ] **Lines 230, 237, 258**: Booking pattern analysis disabled (missing table)

## 📝 Notes

### Not Actually TODOs (Design Decisions)

Some comments say "TODO" but are actually:
- **Intentional stubs** for optional features
- **Future enhancements** not in current scope
- **Provider-specific code** not needed for current auth setup

### How to Track

1. **Run ESLint** to find code quality issues:
   ```bash
   npm run lint
   ```

2. **Search for TODOs**:
   ```bash
   grep -r "TODO\|FIXME" server/ client/ --include="*.ts" --include="*.tsx"
   ```

3. **Use GitHub Issues** to track work:
   - Create issues for high-priority TODOs
   - Label by priority (critical, high, medium, low)
   - Assign to milestones

## 🎯 Recommended Next Steps

1. **Implement AI worker features** (Lines in aiWorker.ts)
   - Integrate actual AI models
   - Connect to real data sources
   - Store results in database

2. **Complete OAuth token refresh** (AuthService.ts:341)
   - Only if using OAuth providers
   - Test with Cognito/Auth0 if configured

3. **Refactor routes.ts** into modules
   - Create `server/routes/` directory
   - Split by feature domain
   - Maintain backward compatibility

4. **Replace console.log** with structured logging
   - Run `npm run lint:fix` for auto-fixable issues
   - Manually update remaining statements
   - Use appropriate log levels

5. **Fix TypeScript 'any' types**
   - Start with routes.ts
   - Create proper type definitions
   - Use generics where appropriate
