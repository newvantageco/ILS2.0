# ILS 2.0 UX Patterns - Implementation Guide & Code Examples

This document provides code snippets and implementation details for the UX patterns found in the ILS 2.0 codebase.

---

## 1. WELCOME MODAL PATTERN

### File: `/client/src/components/WelcomeModal.tsx`

**Key Implementation Details:**
```tsx
// Uses localStorage to persist onboarding state
const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

// 4-step carousel with progress dots
const steps = [
  { icon: Sparkles, title: 'Welcome to ILS!', color: 'blue' },
  { icon: ShoppingBag, title: 'Streamline Operations', color: 'green' },
  { icon: BarChart, title: 'AI-Powered Insights', color: 'purple' },
  { icon: Users, title: 'Connect Your Network', color: 'orange' }
];

// Clickable progress dots for navigation
<div className="flex justify-center gap-2 mb-8">
  {steps.map((_, index) => (
    <button
      onClick={() => setCurrentStep(index)}
      className={`w-2 h-2 rounded-full transition-all ${
        index === currentStep ? 'w-8 bg-blue-600' : 'bg-gray-300'
      }`}
    />
  ))}
</div>
```

**Best Practices:**
- Persistent state prevents repeated onboarding
- Skip option reduces friction
- Color coding helps visual memory
- Icon usage reduces cognitive load
- Smooth transitions with Framer Motion

---

## 2. ONBOARDING FLOW PATTERN

### File: `/client/src/pages/OnboardingFlow.tsx`

**3-Step Flow Architecture:**
```tsx
{step === 1 && <PathSelection /> }
{step === 2 && <Setup /> }
{step === 3 && <Completion /> }

// Progress indicator with labels
<div className="flex items-center justify-center gap-4">
  {[1, 2, 3].map((num) => (
    <div key={num} className="flex items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200'
      }`}>
        {step > num ? <CheckCircle2 /> : num}
      </div>
      {num < 3 && (
        <div className={`w-16 h-1 mx-2 rounded ${
          step > num ? 'bg-blue-600' : 'bg-gray-200'
        }`} />
      )}
    </div>
  ))}
</div>
```

**Data Collection Pattern:**
```tsx
const [newCompanyData, setNewCompanyData] = useState({
  name: '',
  industry: '',
  size: '',
  description: '',
});

// Mutations for async operations
const createCompanyMutation = useMutation({
  mutationFn: async (data) => {
    const response = await apiRequest('POST', '/api/companies', data);
    return await response.json();
  },
  onSuccess: (company) => {
    toast({ title: 'Company created!' });
    setStep(3);
  }
});
```

**Best Practices:**
- Clear path options reduce decision fatigue
- Step validation before progression
- Toast notifications for feedback
- Loading states during async operations
- Success confirmation at completion

---

## 3. SIGNUP/REGISTRATION PATTERN

### File: `/client/src/pages/SignupPage.tsx`

**Role-Based Dynamic Form:**
```tsx
// Role determines visible fields
const [formData, setFormData] = useState({
  role: '' as "ecp" | "lab_tech" | "engineer" | "supplier" | "admin" | "",
  organizationName: '',
  gocNumber: '',
  subscriptionPlan: '' as "full" | "free_ecp" | "",
});

// Conditional rendering based on role
{(formData.role === "optometrist" || formData.role === "ecp") && (
  <div className="space-y-2">
    <Label htmlFor="gocNumber">GOC Registration Number *</Label>
    <Input
      id="gocNumber"
      value={formData.gocNumber}
      onChange={(e) => setFormData({ ...formData, gocNumber: e.target.value })}
      placeholder="Enter your GOC registration number"
    />
  </div>
)}

// Plan selection with pricing
<RadioGroup value={formData.subscriptionPlan} onValueChange={(value) => {...}}>
  <Label className="flex items-start gap-3 rounded-lg border p-4">
    <RadioGroupItem id="plan-full" value="full" />
    <div className="space-y-1">
      <div className="flex gap-2 items-center">
        <Crown className="h-4 w-4" />
        <span>Full Experience</span>
        <span>£199/month</span>
      </div>
      <p>Access every module in ILS...</p>
    </div>
  </Label>
</RadioGroup>
```

**Best Practices:**
- Pre-filled data from auth provider reduces friction
- Role-based field requirement management
- Dynamic pricing display
- Clear feature descriptions per plan
- Adaptive form reduces cognitive overload

---

## 4. FEEDBACK SYSTEM PATTERN

### File: `/client/src/hooks/useFeedback.ts`

**Hook-Based Toast System:**
```tsx
export function useFeedback() {
  const [messages, setMessages] = React.useState<ToastMessage[]>([])

  const enqueueToast = React.useCallback((payload: ToastPayload) => {
    const id = Math.random().toString(36).slice(2)
    const message: ToastMessage = { id, ...payload }
    
    setMessages((prev) => [...prev, message])
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id))
    }, TOAST_TIMEOUT)
  }, [])

  // Success with technical detail support
  const success = React.useCallback(
    (title: string, technicalDetail?: string) => {
      showToast({
        title,
        description: technicalDetail,
        variant: "default",
      })
    },
    [showToast]
  )

  // Error with debugging info
  const error = React.useCallback(
    (title: string, error?: Error | string) => {
      showToast({
        title,
        description: typeof error === "string" ? error : error?.message,
        variant: "destructive",
      })
    },
    [showToast]
  )

  return { messages, success, error, info, warn }
}
```

**Usage Pattern:**
```tsx
const { success, error } = useFeedback()

const handleSubmit = async (data) => {
  try {
    await submitOrder(data)
    success(
      "Order Submitted Successfully",
      `Order #${data.orderId} has been sent to the lab`
    )
  } catch (err) {
    error(
      "Order Submission Failed",
      "Please check the prescription values and try again"
    )
  }
}
```

**Best Practices:**
- Context hook for easy access throughout app
- Multiple feedback levels (success, error, info, warn)
- Auto-dismiss prevents notification pile-up
- Technical details for debugging
- Action button support for user agency

---

## 5. NOTIFICATION CENTER PATTERN

### File: `/client/src/components/NotificationBell.tsx`

**Real-Time Notification Handling:**
```tsx
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)

  // Unread count polling
  const { data: unreadData } = useQuery({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const response = await fetch("/api/ai-notifications/unread-count", {
        credentials: "include",
      })
      return response.json()
    },
    refetchInterval: 30000, // Poll every 30 seconds
  })

  // Lazy-load notifications only when panel opens
  const { data: notificationsData } = useQuery({
    queryKey: ["ai-notifications"],
    enabled: isOpen, // Only fetch when open
  })

  const markReadMutation = useMutation({
    mutationFn: async (notificationIds: string[] | "all") => {
      const response = await fetch("/api/ai-notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notificationIds }),
      })
      return response.json()
    },
    onSuccess: () => {
      // Invalidate caches to refresh counts
      queryClient.invalidateQueries({ queryKey: ["ai-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notification-count"] })
    },
  })
}
```

**Priority-Based Styling:**
```tsx
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical": return "bg-red-50 border-red-200"
    case "high": return "bg-orange-50 border-orange-200"
    case "medium": return "bg-blue-50 border-blue-200"
    case "low": return "bg-gray-50 border-gray-200"
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "critical": return "🚨"
    case "high": return "⚠️"
    case "medium": return "ℹ️"
    case "low": return "📝"
  }
}
```

**Best Practices:**
- Badge count for unread notifications
- Priority-based visual hierarchy
- Lazy loading prevents performance impact
- Navigation from notifications
- Real-time updates via WebSocket
- Batch mark-as-read functionality

---

## 6. EMPTY STATE PATTERN

### File: `/client/src/components/ui/EmptyState.tsx`

**Reusable Empty State Component:**
```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center p-8"
    >
      {/* Animated icon background */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4"
      >
        <Icon className="w-10 h-10 text-muted-foreground" />
      </motion.div>

      {/* Staggered text reveals */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-semibold mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-6 max-w-md"
      >
        {description}
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3"
      >
        {action && <Button onClick={action.onClick}>{action.label}</Button>}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}
```

**Usage Example:**
```tsx
{notifications.length === 0 ? (
  <EmptyState
    icon={Bell}
    title="No insights yet"
    description="Check back tomorrow for your daily briefing"
    action={{
      label: "Create First Item",
      onClick: () => navigateTo("/create")
    }}
  />
) : (
  <NotificationList notifications={notifications} />
)}
```

**Best Practices:**
- Animated icon draws attention
- Staggered text reveals maintain visual interest
- Contextual messaging guides user action
- Primary and secondary CTAs provide options
- No cognitive overload from empty state

---

## 7. TOOLTIP PATTERN

### File: `/client/src/components/ui/AdvancedTooltip.tsx`

**Animated Tooltip Component:**
```tsx
interface AdvancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  showArrow?: boolean;
  rich?: boolean;
}

export function AdvancedTooltip({
  children,
  content,
  side = "top",
  delayDuration = 200,
  showArrow = true,
  rich = false,
}: AdvancedTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <AnimatePresence>
          {open && (
            <TooltipPrimitive.Portal forceMount>
              <TooltipPrimitive.Content
                side={side}
                align={align}
                asChild
              >
                {/* Smooth entrance animation */}
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.96,
                    y: side === "top" ? 4 : -4
                  }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.96,
                    y: side === "top" ? 4 : -4
                  }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "z-50 overflow-hidden rounded-md border bg-popover",
                    rich && "px-4 py-3 max-w-xs",
                    "px-3 py-1.5 text-sm shadow-md"
                  )}
                >
                  {content}
                  {showArrow && <TooltipPrimitive.Arrow />}
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

// Keyboard shortcut tooltip specialization
export function KeyboardShortcutTooltip({
  children,
  keys,
  description,
}) {
  return (
    <AdvancedTooltip
      content={
        <div className="flex flex-col gap-1">
          <p className="font-medium">{description}</p>
          <div className="flex gap-1 mt-1">
            {keys.map((key, i) => (
              <Fragment key={key}>
                {i > 0 && <span className="text-muted-foreground">+</span>}
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                  {key}
                </kbd>
              </Fragment>
            ))}
          </div>
        </div>
      }
      rich
    >
      {children}
    </AdvancedTooltip>
  )
}
```

**Usage Example:**
```tsx
<KeyboardShortcutTooltip keys={["⌘", "K"]} description="Open command palette">
  <button>Search</button>
</KeyboardShortcutTooltip>
```

**Best Practices:**
- Customizable delay prevents tooltip spam
- Arrow helps identify trigger element
- Rich content mode for complex tooltips
- Smooth animations reduce jarring effect
- Keyboard shortcut tooltips enhance discoverability

---

## 8. LOADING STATE PATTERN

### File: `/client/src/components/ui/GlobalLoadingBar.tsx`

**NProgress-Style Loading Bar:**
```tsx
import { useGlobalLoading } from "@/lib/globalLoading"

export function GlobalLoadingBar() {
  const { isLoading } = useGlobalLoading()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setVisible(true)
      setProgress(0)

      // Simulate natural progression
      const timer1 = setTimeout(() => setProgress(30), 100)
      const timer2 = setTimeout(() => setProgress(60), 300)
      const timer3 = setTimeout(() => setProgress(80), 600)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    } else {
      // Complete progress bar
      setProgress(100)
      
      // Hide after animation
      const hideTimer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)

      return () => clearTimeout(hideTimer)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 200ms" : "width 300ms",
        }}
      />
    </div>
  )
}
```

**Skeleton Loader Pattern:**
```tsx
interface LoadingSkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "card"
  width?: string
  height?: string
  count?: number
}

export function LoadingSkeleton({
  variant = "rectangular",
  width,
  height,
  count = 1,
}: LoadingSkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "text": return "h-4 rounded"
      case "circular": return "rounded-full aspect-square"
      case "rectangular": return "rounded-lg"
      case "card": return "rounded-xl h-32"
    }
  }

  const skeleton = (
    <div
      className={`bg-gray-200 animate-pulse ${getVariantStyles()}`}
      style={{
        width: width || "100%",
        height: height || "auto",
      }}
    />
  )

  if (count === 1) return skeleton

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeleton}</div>
      ))}
    </div>
  )
}
```

**Best Practices:**
- Natural progression simulation improves perceived speed
- Skeleton screens prevent layout shift (CLS)
- Multiple variant options for different contexts
- Accessibility attributes for progress bar
- Auto-hide prevents lingering indicators

---

## 9. COMMAND PALETTE PATTERN

### File: `/client/src/components/ui/CommandPalette.tsx`

**Keyboard-First Navigation:**
```tsx
interface CommandItem {
  label: string
  icon: React.ComponentType
  path: string
  shortcut?: string
  keywords?: string[]
}

export function CommandPalette({ userRole }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [, setLocation] = useLocation()

  // Lazy-load search results
  const { data: searchResults } = useQuery({
    queryKey: ["/api/orders", `?search=${search}`],
    enabled: search.length > 2 && open,
    staleTime: 30000,
  })

  const getNavigationItems = (): CommandItem[] => {
    const commonItems = [
      {
        label: "Settings",
        icon: Settings,
        path: "/settings",
        shortcut: "⌘S",
        keywords: ["settings", "preferences", "config"],
      },
      {
        label: "AI Assistant",
        icon: Sparkles,
        path: "/ai-assistant",
        shortcut: "⌘K",
        keywords: ["ai", "assistant", "help", "chat"],
      },
      // More items...
    ]

    // Role-based navigation items
    switch (userRole) {
      case "ecp":
        return [
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/ecp/dashboard",
            shortcut: "⌘H",
          },
          // More ECP-specific items
          ...commonItems,
        ]
      // Other roles...
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search commands, orders, features..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Navigation group */}
        <CommandGroup heading="Navigation">
          {getNavigationItems().map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => {
                setLocation(item.path)
                setOpen(false)
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Search results */}
        {searchResults && searchResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Orders">
              {searchResults.map((order) => (
                <CommandItem key={order.id} onSelect={() => {...}}>
                  {order.orderNumber}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
```

**Best Practices:**
- Global ⌘K shortcut increases discoverability
- Fuzzy search improves findability
- Lazy loading prevents performance impact
- Keyboard shortcuts displayed for learning
- Order search integrated into navigation
- Role-based navigation items

---

## 10. PROGRESS STEPPER PATTERN

### File: `/client/src/components/ProgressStepper.tsx`

**Visual Progress Indicator:**
```tsx
interface Step {
  label: string
  description?: string
}

interface ProgressStepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function ProgressStepper({
  steps,
  currentStep,
  className,
}: ProgressStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {/* Step indicator circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "border-2 transition-colors",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary bg-primary/10",
                    !isCompleted && !isCurrent && "border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step label and description */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      (isCompleted || isCurrent) && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Best Practices:**
- Clear visual distinction between step states
- Checkmark indicates completion
- Connecting lines show progress
- Optional descriptions provide context
- Smooth color transitions
- Accessible structure with proper hierarchy

---

## Summary of Implementation Patterns

All patterns in ILS 2.0 follow these principles:

1. **Progressive Enhancement**: Content reveals gradually
2. **Clear Feedback**: Every action gets immediate visual response
3. **Accessibility**: ARIA attributes, keyboard navigation, semantic HTML
4. **Performance**: Lazy loading, code splitting, optimized animations
5. **Consistency**: Reusable components, unified design tokens
6. **User Agency**: Clear CTAs, multiple pathways, easy dismissal

The codebase demonstrates professional-grade SaaS UX implementation with strong patterns that can be extended with the recommendations from the main analysis report.
