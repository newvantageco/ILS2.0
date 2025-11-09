# UI/UX Enhancement - Quick Reference Guide

**For: Development Team**  
**Updated: November 2, 2025**

This is your 2-minute guide to using the new UI/UX enhancements.

---

## 🚀 Optimistic Updates

### When to Use
- Any user action that modifies server state (create, update, delete)
- High-frequency operations (order status, toggles, approvals)
- Low-risk mutations (not financial transactions)

### How to Implement

```typescript
import { useMutation } from "@tanstack/react-query";
import { createOptimisticHandlers, optimisticArrayUpdate } from "@/lib/optimisticUpdates";

const updateMutation = useMutation({
  mutationFn: async ({ id, updates }) => {
    const res = await apiRequest("PATCH", `/api/items/${id}`, updates);
    return await res.json();
  },
  ...createOptimisticHandlers<Item[], { id: string; updates: Partial<Item> }>({
    queryKey: ["/api/items"],
    updater: (oldData, variables) => {
      return optimisticArrayUpdate(oldData, variables.id, (item) => ({
        ...item,
        ...variables.updates,
      })) || [];
    },
    successMessage: "Updated successfully",
    errorMessage: "Failed to update",
  }),
});
```

### Helper Functions Available
```typescript
// Update item in array
optimisticArrayUpdate(array, itemId, (item) => ({ ...item, newProp: value }))

// Toggle boolean property
optimisticToggle(array, itemId, 'isActive')

// Remove item from array
optimisticRemove(array, itemId)

// Add item to array
optimisticAdd(array, newItem)
```

---

## ⌨️ Command Palette

### For Users
- **Cmd+K** (Mac) / **Ctrl+K** (Windows/Linux) - Open command palette
- Type to search orders, navigate, or execute actions
- Arrow keys to navigate, Enter to select

### For Developers
Already integrated globally in `App.tsx`. No additional code needed.

To open programmatically (rare):
```typescript
import { commandPaletteManager } from "@/stores/commandPaletteStore";
commandPaletteManager.open();
```

---

## ⏳ Global Loading Bar

### Automatic Integration
✅ **Already works for all TanStack Query mutations!**

The loading bar automatically appears at the top of the page when any mutation is running.

### Manual Control (Advanced)
```typescript
import { globalLoadingManager } from "@/lib/globalLoading";

const endLoading = globalLoadingManager.start();
try {
  await longRunningOperation();
} finally {
  endLoading(); // Always call this
}
```

### In React Components
```typescript
import { useGlobalLoading } from "@/lib/globalLoading";

function MyComponent() {
  const { isLoading, start } = useGlobalLoading();
  
  const handleAction = async () => {
    const endLoading = start();
    await doSomething();
    endLoading();
  };
}
```

---

## 🎨 Consistent Feedback Patterns

### Toasts (Already Implemented)
```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// Success
toast({ title: "Order created" });

// Error
toast({ 
  title: "Failed to create order", 
  description: error.message,
  variant: "destructive" 
});

// Info
toast({ 
  title: "Processing...",
  description: "This may take a moment"
});
```

### Empty States (Already Implemented)
```typescript
import { EmptyState } from "@/components/ui/EmptyState";
import { PackageOpen } from "lucide-react";

<EmptyState
  icon={PackageOpen}
  title="No orders found"
  description="Create your first order to get started"
  action={{
    label: "Create Order",
    onClick: () => navigate("/ecp/new-order"),
  }}
/>
```

---

## ♿ Accessibility Best Practices

### Enforced by ESLint
These will **fail your build** if violated:

❌ **Bad:**
```typescript
<img src="photo.jpg" /> // Missing alt
<div onClick={handleClick}>Click me</div> // Not keyboard accessible
```

✅ **Good:**
```typescript
<img src="photo.jpg" alt="Patient photo" />
<button onClick={handleClick}>Click me</button>
```

### Using Radix UI Components
Always prefer Radix-based components (from `@/components/ui/*`):
- ✅ Built-in keyboard navigation
- ✅ ARIA attributes automatic
- ✅ Screen reader support
- ✅ Focus management

---

## 📦 Code Splitting (Optional)

### Infrastructure Ready
Lazy loading infrastructure is available in `client/src/routes/lazyRoutes.ts`.

### To Migrate a Route
1. Ensure route is exported from `lazyRoutes.ts`
2. In `App.tsx`, wrap route in `<Suspense>`
3. Use lazy component: `<Route component={LazyRoutes.MyPage} />`

Example:
```typescript
import { Suspense } from "react";
import * as LazyRoutes from "@/routes/lazyRoutes";

<Suspense fallback={<RouteLoadingFallback />}>
  <Route path="/example" component={LazyRoutes.ExamplePage} />
</Suspense>
```

---

## 🧪 Testing Your Changes

### Manual Checklist
- [ ] Action feels instant (optimistic update working)
- [ ] Loading bar appears at top during network request
- [ ] Success toast shows on completion
- [ ] Error toast shows on failure (test with network throttling)
- [ ] Can navigate with keyboard only (Tab, Enter, Escape)
- [ ] Screen reader announces actions (test with VoiceOver/NVDA)

### Run Linter
```bash
npm run lint
```

### Check Accessibility
```bash
# Will show jsx-a11y violations
npm run lint
```

---

## 🐛 Troubleshooting

### "Optimistic update not rolling back on error"
- Ensure you're using `createOptimisticHandlers()` (not manual onError)
- Check network tab - is the request actually failing?

### "Loading bar stuck visible"
- Check for unmatched `start()` calls without `endLoading()`
- Verify mutation `onSettled` is being called

### "Command palette not opening"
- Check keyboard shortcut isn't being captured by browser/OS
- Try `commandPaletteManager.open()` programmatically

### "Build failing with accessibility errors"
- Read the ESLint error carefully
- Add missing `alt`, `aria-label`, or convert `<div>` to `<button>`
- Reference shadcn/ui components as examples

---

## 📚 File Reference

| Feature | Files |
|---------|-------|
| Optimistic Updates | `lib/optimisticUpdates.ts`, `pages/AdminDashboard.tsx`, `pages/LabDashboard.tsx` |
| Command Palette | `components/ui/CommandPalette.tsx`, `stores/commandPaletteStore.ts` |
| Global Loading | `lib/globalLoading.ts`, `components/ui/GlobalLoadingBar.tsx` |
| Empty States | `components/ui/EmptyState.tsx` |
| Code Splitting | `routes/lazyRoutes.ts` |
| Accessibility | `.eslintrc.json` |

---

## 🎯 Common Patterns

### Pattern: List with Actions
```typescript
// Admin dashboard style
const items = useQuery(["/api/items"]);

const updateMutation = useMutation({
  mutationFn: (data) => apiRequest("PATCH", `/api/items/${data.id}`, data),
  ...createOptimisticHandlers({
    queryKey: ["/api/items"],
    updater: (old, vars) => optimisticArrayUpdate(old, vars.id, ...),
  }),
});

return items.map(item => (
  <button onClick={() => updateMutation.mutate({ id: item.id, ... })}>
    Action
  </button>
));
```

### Pattern: Form Submission
```typescript
const createMutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/items", data),
  onSuccess: () => {
    toast({ title: "Created successfully" });
    navigate("/items");
  },
  onError: (error) => {
    toast({ title: "Failed", description: error.message, variant: "destructive" });
  },
});
```

### Pattern: Empty State → First Item
```typescript
{items.length === 0 ? (
  <EmptyState
    icon={Package}
    title="No items yet"
    description="Get started by creating your first item"
    action={{ label: "Create Item", onClick: () => setDialogOpen(true) }}
  />
) : (
  <ItemsList items={items} />
)}
```

---

## 🎓 Learn More

- **Full Implementation:** See `UI_UX_ENHANCEMENT_IMPLEMENTATION.md`
- **Original Directive:** Technical note from Lead Architect
- **TanStack Query Docs:** https://tanstack.com/query/latest
- **Radix UI Docs:** https://radix-ui.com
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Questions?** Check inline code comments or the full implementation doc.
