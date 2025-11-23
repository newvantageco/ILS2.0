# Code Cleanup Report - ILS 2.0

## Date: November 23, 2025

This document tracks redundant code that was identified and eliminated, as well as documenting components that appear similar but serve distinct purposes.

---

## Redundant Code Removed

### 1. Unused Skeleton Loader Component
**Deleted:** `client/src/components/ui/SkeletonLoader.tsx`

**Reason:** This file exported `TableSkeleton`, `CardSkeleton`, `DashboardSkeleton`, `FormSkeleton`, and `ListSkeleton` but had **zero imports** across the codebase. These functions were duplicated in:
- `LoadingSkeletons.tsx` (comprehensive, animated version - **in use**)
- `LoadingSkeleton.tsx` (base component - **in use**)

**Impact:** Removed ~120 lines of dead code.

---

### 2. Duplicate ThemeToggle Component
**Deleted:** `client/src/components/ThemeToggle.tsx`

**Reason:** Simple implementation (38 lines) that lacked features present in `client/src/components/ui/ThemeToggle.tsx`:
- No system theme preference detection
- No animation support
- Only "icon" variant (enhanced has dropdown, switch variants)
- No media query listener for real-time system theme changes

**Migration:** Updated `App.tsx` to import from `@/components/ui/ThemeToggle` instead.

**Impact:** Removed ~40 lines of duplicate code, gained better UX.

---

### 3. Unused App Alternative File
**Deleted:** `client/src/App-New.tsx`

**Reason:** Alternative App component (~150 lines) with comments indicating it was meant to "replace the old role-based routing duplication." It was never imported or used anywhere.

**Impact:** Removed ~150 lines of dead code.

---

## Total Lines Removed: ~310

---

## Components That Appear Similar But Serve Different Purposes

### StatCard Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `StatCard` | `client/src/components/StatCard.tsx` | General-purpose stats display with trend indicator |
| `StatCard` | `client/src/components/healthcare/StatCard.tsx` | Healthcare-specific with change percentage and description |

**Differences:**
- Base `StatCard` uses `trend: { value: string, isPositive: boolean }` pattern
- Healthcare `StatCard` uses `change: { value: number, type: "increase" | "decrease" }` pattern
- Healthcare version supports optional icons and descriptions
- Both are actively used in different contexts

**Recommendation:** Keep both - they serve distinct use cases in different domains.

---

### StatusBadge Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `StatusBadge` | `client/src/components/StatusBadge.tsx` | Order-specific with typed `OrderStatus` enum |
| `StatusBadge` | `client/src/components/healthcare/StatusBadge.tsx` | Generic, accepts any status string |

**Differences:**
- Base `StatusBadge` has dark mode support with typed order statuses
- Healthcare `StatusBadge` handles arbitrary status strings with fallback formatting
- Healthcare version includes healthcare-specific statuses (urgent, routine, stat)

**Recommendation:** Keep both - they serve distinct use cases.

---

### DataTable Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DataTable` | `client/src/components/healthcare/DataTable.tsx` | Simple implementation with basic search/pagination |
| `DataTable` | `client/src/components/ui/DataTable.tsx` | Advanced TanStack React Table implementation |

**Differences:**
- UI `DataTable` uses TanStack React Table with sorting, filtering, column visibility
- Healthcare `DataTable` is simpler, faster to use for basic cases

**Recommendation:** For new development, prefer `ui/DataTable`. Consider gradual migration.

---

### Currency Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `currency.ts` | `client/src/lib/currency.ts` | Simple functions for GBP/USD conversion |
| `CurrencyService` | `client/src/services/currencyService.ts` | Class-based with multiple API fallbacks |

**Usage:**
- `currency.ts` used in `InvoicesPage.tsx`
- `currencyService.ts` used in `CurrencyDisplay.tsx`

**Recommendation:** Consider consolidating when refactoring, but both currently have active imports.

---

## Skeleton Component Organization

After cleanup, the skeleton component structure is:

```
client/src/components/ui/
├── skeleton.tsx              # Base shadcn/ui Skeleton primitive
├── LoadingSkeleton.tsx       # Simple variants (SkeletonCard, SkeletonTable, etc.)
├── LoadingSkeletons.tsx      # Animated variants with framer-motion
└── CardSkeleton.tsx          # Specialized card skeletons (StatCard, OrderCard)
```

**Usage Guide:**
- For simple loading states: Use `LoadingSkeleton`
- For animated, polished skeletons: Use `LoadingSkeletons`
- For specialized card loading: Use `CardSkeleton`

---

## Future Cleanup Opportunities

### Low Priority
1. Consider consolidating currency utilities
2. Standardize export patterns (named vs default exports)
3. Review analytics-utils.ts for unused functions

### Not Recommended
1. Do NOT consolidate StatCard components (different APIs for different contexts)
2. Do NOT consolidate StatusBadge components (typed vs generic serve different needs)
3. Do NOT consolidate DataTable components (different complexity levels needed)

---

## Verification

After cleanup, run:
```bash
npm run build
npm run check
npm run test
```

All tests should pass. No import errors should occur.
