# Accessibility (a11y) Enhancement Plan

## 🎯 Overview
This document outlines accessibility improvements to make the Integrated Lens System usable by everyone, including users with disabilities.

---

## ✅ Already Implemented (shadcn/ui provides)

### Component-Level Accessibility
- ✅ **Radix UI Foundation**: All shadcn/ui components built on Radix primitives
- ✅ **ARIA Attributes**: Dialogs, dropdowns, and menus have proper roles
- ✅ **Focus Management**: Modal dialogs trap focus correctly
- ✅ **Semantic HTML**: Button, input, label elements used properly
- ✅ **Color Contrast**: Theme colors meet WCAG AA standards

---

## 🚀 Recommended Enhancements

### 1. **Keyboard Navigation**

#### Current State
- Basic keyboard support from Radix UI
- Tab navigation works for most components

#### Improvements Needed
```tsx
// Add keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  'Ctrl+N': 'New Order',
  'Ctrl+S': 'Save',
  'Esc': 'Close Modal',
  '/': 'Focus Search',
  '?': 'Show Shortcuts Help',
};

// Implement with:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      navigateToNewOrder();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### Testing Checklist
- [ ] Tab through entire dashboard without mouse
- [ ] Arrow keys navigate tables and lists
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals and dropdowns
- [ ] Shift+Tab moves backward
- [ ] No keyboard traps

---

### 2. **Focus States**

#### Current State
- Default browser focus outlines
- Tailwind's `focus-visible` utility available

#### Improvements Needed
```tsx
// Add visible focus rings consistently
className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"

// Skip-to-content link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Focus on navigation after page change
useEffect(() => {
  document.getElementById('main-content')?.focus();
}, [location]);
```

#### Testing Checklist
- [ ] All interactive elements have visible focus
- [ ] Focus ring color has sufficient contrast
- [ ] Focus doesn't jump unexpectedly
- [ ] Skip navigation link appears on Tab
- [ ] Custom components maintain focus state

---

### 3. **Screen Reader Support**

#### Current State
- Basic semantic HTML structure
- Some ARIA labels from shadcn/ui

#### Improvements Needed
```tsx
// Add descriptive labels
<Button aria-label="Create new lens order">
  <Plus className="h-4 w-4" />
</Button>

// Announce dynamic changes
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading ? 'Loading orders...' : `${orders.length} orders found`}
</div>

// Label form relationships
<Label htmlFor="patient-name">Patient Name</Label>
<Input id="patient-name" aria-required="true" aria-invalid={!!errors.name} />
{errors.name && (
  <span id="name-error" role="alert" className="text-sm text-destructive">
    {errors.name}
  </span>
)}

// Table accessibility
<Table aria-label="Order list" aria-describedby="table-description">
  <caption id="table-description" className="sr-only">
    List of recent lens orders with status and actions
  </caption>
</Table>
```

#### Testing Checklist
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] All images have alt text
- [ ] Form errors announced to screen readers
- [ ] Loading states announced
- [ ] Dynamic content changes announced
- [ ] Tables have captions and headers

---

### 4. **Color & Contrast**

#### Current State
- Theme colors designed for contrast
- Text on backgrounds mostly readable

#### Improvements Needed
```tsx
// Check all color combinations
// WCAG AA requires 4.5:1 for normal text, 3:1 for large text

// Add indicators beyond color
<Badge variant={status === 'completed' ? 'success' : 'default'}>
  {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
  {status}
</Badge>

// Error states with icons
<FormMessage className="flex items-center gap-1">
  <AlertCircle className="h-4 w-4" />
  {error.message}
</FormMessage>
```

#### Testing Checklist
- [ ] Run contrast checker on all text/background pairs
- [ ] Test with colorblind simulators
- [ ] Status not conveyed by color alone
- [ ] Error states have icons + text
- [ ] Links distinguishable without color

---

### 5. **Form Accessibility**

#### Current State
- Labels connected to inputs (htmlFor)
- Some validation feedback

#### Improvements Needed
```tsx
// Enhanced error handling
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="email">Email Address</FormLabel>
      <FormControl>
        <Input
          id="email"
          type="email"
          aria-required="true"
          aria-invalid={!!form.formState.errors.email}
          aria-describedby={form.formState.errors.email ? "email-error" : "email-help"}
          {...field}
        />
      </FormControl>
      <FormDescription id="email-help">
        We'll use this for order notifications
      </FormDescription>
      {form.formState.errors.email && (
        <FormMessage id="email-error" role="alert">
          {form.formState.errors.email.message}
        </FormMessage>
      )}
    </FormItem>
  )}
/>

// Required field indicator
<FormLabel>
  Patient Name
  <span className="text-destructive" aria-label="required">*</span>
</FormLabel>

// Group related fields
<fieldset>
  <legend className="text-lg font-semibold mb-4">OD (Right Eye)</legend>
  {/* Sphere, Cylinder, Axis, Add inputs */}
</fieldset>
```

#### Testing Checklist
- [ ] All inputs have associated labels
- [ ] Required fields marked clearly
- [ ] Error messages linked to fields
- [ ] Field groups use fieldset/legend
- [ ] Instructions provided before form
- [ ] Submit disabled during processing

---

### 6. **Mobile & Touch Accessibility**

#### Current State
- Responsive design with Tailwind
- Some mobile-friendly sizing

#### Improvements Needed
```tsx
// Ensure minimum touch target size (44x44px)
<Button className="min-h-[44px] min-w-[44px]">
  <Icon className="h-5 w-5" />
</Button>

// Add touch-friendly spacing
<div className="space-y-4 sm:space-y-6">
  {/* Mobile gets less space, desktop gets more */}
</div>

// Prevent zoom disable
// NEVER use: <meta name="viewport" content="user-scalable=no">
```

#### Testing Checklist
- [ ] All buttons at least 44x44px
- [ ] Touch targets have spacing
- [ ] Zoom enabled (pinch to zoom)
- [ ] Horizontal scrolling minimal
- [ ] Large font size supported
- [ ] Landscape orientation works

---

### 7. **Semantic HTML Structure**

#### Current State
- Basic heading hierarchy
- Some landmark regions

#### Improvements Needed
```tsx
// Add landmark roles
<div className="App">
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      {/* Sidebar */}
    </nav>
  </header>
  
  <main role="main" id="main-content" tabIndex={-1}>
    {/* Page content */}
  </main>
  
  <aside role="complementary" aria-label="Recent activity">
    {/* Side panel */}
  </aside>
</div>

// Proper heading hierarchy
<h1>Dashboard</h1>
  <h2>Recent Orders</h2>
    <h3>Order #12345</h3>
  <h2>Statistics</h2>
```

#### Testing Checklist
- [ ] One h1 per page
- [ ] Headings in logical order (h1 → h2 → h3)
- [ ] Landmarks used correctly
- [ ] Lists use ul/ol elements
- [ ] Buttons are `<button>`, links are `<a>`

---

### 8. **Media & Content**

#### Current State
- Icons used extensively
- Some images for features

#### Improvements Needed
```tsx
// Decorative images
<img src="logo.png" alt="" role="presentation" />

// Informative images
<img 
  src="chart.png" 
  alt="Line chart showing 20% increase in orders this month"
/>

// Icons with meaning
<Button>
  <Plus className="h-4 w-4" aria-hidden="true" />
  <span>New Order</span> {/* Text always present */}
</Button>

// Icon-only buttons
<Button aria-label="Delete order #12345">
  <Trash className="h-4 w-4" />
</Button>
```

#### Testing Checklist
- [ ] All images have alt text
- [ ] Decorative images marked as such
- [ ] Icons have labels when standalone
- [ ] Charts have text alternatives
- [ ] Videos have captions/transcripts

---

### 9. **Error Handling & Feedback**

#### Current State
- Toast notifications for actions
- Form validation errors

#### Improvements Needed
```tsx
// Announce errors to screen readers
<div role="alert" aria-live="assertive">
  <AlertCircle className="h-4 w-4" />
  <span>Failed to create order. Please try again.</span>
</div>

// Success messages
<div role="status" aria-live="polite">
  <CheckCircle className="h-4 w-4" />
  <span>Order created successfully</span>
</div>

// Loading announcements
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading order details...' : null}
</div>
```

#### Testing Checklist
- [ ] Errors announced immediately
- [ ] Success messages announced
- [ ] Loading states communicated
- [ ] Error recovery suggested
- [ ] Timeout warnings given

---

### 10. **Documentation & Help**

#### Current State
- Some placeholder help pages
- Tooltips on hover

#### Improvements Needed
```tsx
// Keyboard shortcut reference
<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Show keyboard shortcuts">
      <Keyboard className="h-4 w-4" />
    </Button>
  </DialogTrigger>
  <DialogContent aria-labelledby="shortcuts-title">
    <DialogHeader>
      <DialogTitle id="shortcuts-title">Keyboard Shortcuts</DialogTitle>
    </DialogHeader>
    {/* List of shortcuts */}
  </DialogContent>
</Dialog>

// Accessible tooltips
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="More information">
        <HelpCircle className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>This field is optional</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

#### Testing Checklist
- [ ] Help documentation available
- [ ] Keyboard shortcuts documented
- [ ] Tooltips keyboard accessible
- [ ] Error messages helpful
- [ ] Support contact accessible

---

## 🛠️ Testing Tools

### Automated Testing
```bash
# Install axe-core for accessibility testing
npm install --save-dev @axe-core/react

# Add to main.tsx in development
if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

### Manual Testing Tools
- **WAVE**: Browser extension for visual accessibility checking
- **axe DevTools**: Chrome/Firefox extension
- **Lighthouse**: Built into Chrome DevTools
- **NVDA/VoiceOver**: Screen reader testing
- **Keyboard**: Test without mouse

### Testing Checklist
```bash
# Run Lighthouse accessibility audit
npm run build
npx serve dist
# Open Chrome DevTools → Lighthouse → Accessibility

# Check color contrast
# Use: https://webaim.org/resources/contrastchecker/

# Test with screen reader
# Mac: Cmd+F5 to enable VoiceOver
# Windows: Download NVDA (free)
```

---

## 📊 Priority Matrix

### High Priority (Do First)
1. ✅ Keyboard navigation
2. ✅ Focus states
3. ✅ Form labels and errors
4. ✅ Color contrast fixes

### Medium Priority (Do Next)
5. Screen reader improvements
6. ARIA labels for complex widgets
7. Table accessibility
8. Error announcements

### Low Priority (Nice to Have)
9. Keyboard shortcuts reference
10. Enhanced tooltips
11. Skip navigation links
12. Reduced motion preferences

---

## 🎯 Implementation Plan

### Week 1: Foundation
- [ ] Add focus-visible styles globally
- [ ] Implement skip navigation
- [ ] Fix all form labels
- [ ] Test keyboard navigation

### Week 2: Screen Readers
- [ ] Add ARIA labels to icon buttons
- [ ] Improve table accessibility
- [ ] Add live regions for updates
- [ ] Test with NVDA/VoiceOver

### Week 3: Polish
- [ ] Fix color contrast issues
- [ ] Add keyboard shortcuts
- [ ] Create accessibility docs
- [ ] Run automated tests

### Week 4: Validation
- [ ] Manual testing with users
- [ ] Lighthouse audit (target: 95+)
- [ ] Fix remaining issues
- [ ] Document best practices

---

## 📚 Resources

### Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

### Testing
- [WebAIM WAVE Tool](https://wave.webaim.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Learning
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Inclusive Components](https://inclusive-components.design/)

---

**Status**: 📝 Planning Phase
**Target Completion**: 4 weeks
**Expected Lighthouse Score**: 95+ (currently ~85)
