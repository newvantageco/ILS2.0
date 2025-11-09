# 🚀 Quick Start: Using New UI Components

## For Developers Adding New Pages

This guide shows you how to use the new UI/UX components in your pages.

---

## 📦 Import What You Need

```tsx
// Skeleton Loading States
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { CardSkeleton, StatCardSkeleton } from "@/components/ui/CardSkeleton";

// Empty States
import { EmptyState } from "@/components/ui/EmptyState";

// Forms
import { FormWrapper, FormInputField } from "@/components/ui/FormWrapper";

// Multi-Step Wizard
import { MultiStepWizard } from "@/components/ui/MultiStepWizard";

// Advanced Tables
import { DataTable } from "@/components/ui/DataTable";

// Card Descriptions
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Icons
import { Package, UserCircle, FileText } from "lucide-react";
```

---

## 🎯 Common Use Cases

### 1. Loading State for Tables

**Pattern:**
```tsx
{isLoading ? (
  <TableSkeleton rows={5} columns={6} />
) : (
  <Table>
    {/* Your table content */}
  </Table>
)}
```

**Props:**
- `rows` - Number of skeleton rows (default: 5)
- `columns` - Number of skeleton columns (default: 5)
- `showHeader` - Show header row (default: true)

---

### 2. Loading State for Stat Cards

**Pattern:**
```tsx
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Your stat cards */}
  </div>
)}
```

---

### 3. Empty State with Action

**Pattern:**
```tsx
{!data || data.length === 0 ? (
  <EmptyState
    icon={Package}
    title="No items yet"
    description="Get started by adding your first item"
    action={{
      label: "Add Item",
      onClick: () => setIsModalOpen(true)
    }}
  />
) : (
  // Your data display
)}
```

**Props:**
- `icon` - Lucide icon component (required)
- `title` - Main heading (required)
- `description` - Descriptive text (required)
- `action` - Primary action button (optional)
  - `label` - Button text
  - `onClick` - Handler function
- `secondaryAction` - Secondary button (optional, same structure)

---

### 4. Search Empty State

**Pattern:**
```tsx
<EmptyState
  icon={Search}
  title={searchQuery ? "No results found" : "No items yet"}
  description={
    searchQuery
      ? "Try adjusting your search query"
      : "Items will appear here"
  }
  action={
    !searchQuery
      ? {
          label: "Add Item",
          onClick: handleAdd
        }
      : undefined
  }
/>
```

---

### 5. Card with Description

**Pattern:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>
      Additional context or description for this section
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Your content */}
  </CardContent>
</Card>
```

---

### 6. Page Header

**Standard Pattern:**
```tsx
<div className="space-y-6">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground mt-2">
      Page description or subtitle
    </p>
  </div>
  
  {/* Rest of page content */}
</div>
```

---

### 7. Form with Validation

**Pattern:**
```tsx
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

function MyForm() {
  return (
    <FormWrapper
      schema={schema}
      onSubmit={(data) => console.log(data)}
      isLoading={isSubmitting}
    >
      <FormInputField
        name="name"
        label="Name"
        placeholder="Enter name"
        required
      />
      
      <FormInputField
        name="email"
        label="Email"
        type="email"
        placeholder="Enter email"
        required
      />
    </FormWrapper>
  );
}
```

---

### 8. Multi-Step Wizard

**Pattern:**
```tsx
const steps = [
  { id: 1, title: "Basic Info", description: "Enter basic information" },
  { id: 2, title: "Details", description: "Additional details" },
  { id: 3, title: "Review", description: "Review your information" },
];

function MyWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  
  return (
    <MultiStepWizard
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onComplete={handleSubmit}
      canProceed={isStepValid()}
      isLastStepSubmitting={isSubmitting}
    >
      {currentStep === 1 && <Step1Content />}
      {currentStep === 2 && <Step2Content />}
      {currentStep === 3 && <Step3Content />}
    </MultiStepWizard>
  );
}
```

---

## 🎨 Color Variables

Use these CSS variables for consistent theming:

```tsx
// Primary colors
className="bg-primary text-primary-foreground"
className="text-primary"
className="border-primary"

// Muted text (for descriptions)
className="text-muted-foreground"

// Card backgrounds
className="bg-card"

// Accents
className="bg-accent text-accent-foreground"
```

---

## 📏 Spacing Utilities

Standard spacing for consistency:

```tsx
// Page container
className="space-y-6"  // Vertical spacing between sections

// Card grids
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Header spacing
className="mb-6"  // After page headers

// Content padding
className="p-6"  // Standard card padding
```

---

## 🎯 Typography Scale

Consistent heading sizes:

```tsx
// Page title
<h1 className="text-3xl font-bold tracking-tight">

// Section title (in cards)
<CardTitle>  // Already styled

// Subsection
<h3 className="text-lg font-semibold">

// Body text
<p className="text-muted-foreground">

// Small text
<span className="text-sm text-muted-foreground">
```

---

## 🏃 Complete Page Template

```tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package, Plus } from "lucide-react";
import { useState } from "react";

export default function MyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ["/api/my-data"],
  });
  
  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={5} columns={6} />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main Render
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Page</h1>
          <p className="text-muted-foreground mt-2">
            Description of what this page does
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>
      
      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>View and manage your items</CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No items yet"
              description="Get started by adding your first item"
              action={{
                label: "Add Item",
                onClick: () => setIsModalOpen(true)
              }}
            />
          ) : (
            // Your data display here
            <div>Data goes here</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ✅ Checklist for New Pages

When creating a new page, ensure you:

- [ ] Add proper loading state with skeleton components
- [ ] Add empty state with helpful message and action
- [ ] Use CardDescription in card headers
- [ ] Use consistent page title styling (`text-3xl font-bold tracking-tight`)
- [ ] Add muted description below title
- [ ] Use `space-y-6` for vertical spacing
- [ ] Test with empty data
- [ ] Test loading states
- [ ] Ensure mobile responsive
- [ ] Verify icons are from lucide-react

---

## 📚 Learn More

- **Full Guide:** See `UI_UX_ENHANCEMENTS_COMPLETE.md`
- **Quick Reference:** See `UI_UX_SUMMARY.md`
- **Examples:** Look at `ECPDashboard.tsx`, `PatientsPage.tsx`, or `NewOrderPage.tsx`

---

## 🆘 Troubleshooting

**Problem:** Component not found  
**Solution:** Make sure you're importing from the correct path (`@/components/ui/...`)

**Problem:** TypeScript errors  
**Solution:** Check that all required props are provided (icon, title, description for EmptyState)

**Problem:** Skeleton doesn't match my layout  
**Solution:** Use CardSkeleton for generic cards, adjust rows/columns for TableSkeleton

**Problem:** Empty state not showing  
**Solution:** Check your conditional logic - `!data || data.length === 0`

---

**Happy Coding! 🚀**
