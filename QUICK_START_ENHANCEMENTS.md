# Quick Start Guide - Enhanced Components

Quick reference for using the new enhanced UI/UX components in ILS 2.0.

---

## 📁 File Locations

| Component | Path |
|-----------|------|
| Animations | `client/src/lib/animations.ts` |
| DataTable | `client/src/components/ui/DataTableAdvanced.tsx` |
| Forms | `client/src/components/ui/FormAdvanced.tsx` |
| Animated Components | `client/src/components/ui/AnimatedComponents.tsx` |
| Charts | `client/src/components/ui/ChartAdvanced.tsx` |
| Utility Hooks | `client/src/hooks/useEnhancedHooks.ts` |
| Example Dashboard | `client/src/pages/EnhancedDashboardExample.tsx` |

---

## 🚀 Quick Examples

### 1. Add Page Animation
```typescript
import { motion } from 'framer-motion';
import { pageVariants } from '@/lib/animations';

function MyPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container"
    >
      {/* Your content */}
    </motion.div>
  );
}
```

### 2. Create Advanced Table
```typescript
import { DataTableAdvanced } from '@/components/ui/DataTableAdvanced';

<DataTableAdvanced
  data={users}
  columns={columns}
  enableFiltering
  enableRowSelection
  enableExport
  bulkActions={[
    {
      label: 'Delete',
      icon: <Trash />,
      onClick: (rows) => handleDelete(rows),
    },
  ]}
/>
```

### 3. Build a Form
```typescript
import { FormAdvanced } from '@/components/ui/FormAdvanced';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

<FormAdvanced
  schema={schema}
  fields={[
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Password', type: 'password', required: true },
  ]}
  onSubmit={handleSubmit}
/>
```

### 4. Add Animated Counter
```typescript
import { NumberCounter } from '@/components/ui/AnimatedComponents';

<NumberCounter
  to={1234}
  duration={2}
  prefix="$"
  suffix="/mo"
/>
```

### 5. Create Interactive Chart
```typescript
import { InteractiveLineChart } from '@/components/ui/ChartAdvanced';

<InteractiveLineChart
  data={revenueData}
  xAxisKey="month"
  config={[
    { dataKey: 'revenue', name: 'Revenue', color: '#3b82f6' },
  ]}
  enableZoom
  enableExport
/>
```

### 6. Use Utility Hooks
```typescript
import { useDebounce, useLocalStorage, useMediaQuery } from '@/hooks/useEnhancedHooks';

function MyComponent() {
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [theme, setTheme] = useLocalStorage('theme', 'light');

  const isMobile = useMediaQuery('(max-width: 768px)');

  return <div>...</div>;
}
```

---

## 🎨 Common Patterns

### Animated List with Stagger
```typescript
import { StaggeredList, StaggeredItem } from '@/components/ui/AnimatedComponents';

<StaggeredList>
  {items.map(item => (
    <StaggeredItem key={item.id}>
      <Card>{item.name}</Card>
    </StaggeredItem>
  ))}
</StaggeredList>
```

### Multi-Step Form Wizard
```typescript
const steps = [
  {
    title: 'Step 1',
    fields: ['name', 'email'],
  },
  {
    title: 'Step 2',
    fields: ['address', 'city'],
  },
];

<FormAdvanced
  schema={schema}
  fields={allFields}
  steps={steps}
  enableAutoSave
  autoSaveKey="wizard-draft"
  onSubmit={handleSubmit}
/>
```

### Stat Card with Sparkline
```typescript
import { StatCard } from '@/components/ui/ChartAdvanced';

<StatCard
  title="Revenue"
  value="$67,000"
  change={15.3}
  trend="up"
  sparklineData={[45, 52, 48, 61, 58, 67]}
  icon={<DollarSign />}
/>
```

### Progress Ring
```typescript
import { ProgressRing } from '@/components/ui/AnimatedComponents';

<ProgressRing
  progress={75}
  size={120}
  strokeWidth={10}
  showPercentage
/>
```

### Slide Panel
```typescript
import { SlidePanel } from '@/components/ui/AnimatedComponents';

<SlidePanel
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  direction="right"
  title="Settings"
>
  <div>Panel content</div>
</SlidePanel>
```

---

## 📊 Chart Examples

### Line Chart
```typescript
<InteractiveLineChart
  title="Revenue Trend"
  data={data}
  xAxisKey="month"
  config={[
    { dataKey: 'revenue', name: 'Revenue', color: '#3b82f6' },
    { dataKey: 'orders', name: 'Orders', color: '#10b981' },
  ]}
  height={300}
  enableZoom
  enableExport
/>
```

### Bar Chart
```typescript
<InteractiveBarChart
  title="Sales by Category"
  data={data}
  xAxisKey="category"
  config={[{ dataKey: 'sales', name: 'Sales' }]}
  onDataPointClick={(data) => console.log(data)}
/>
```

### Sparkline
```typescript
<SparklineChart
  data={[45, 52, 48, 61, 58, 67]}
  width={100}
  height={30}
  showTrend
  showValue
/>
```

### Gauge
```typescript
<GaugeChart
  value={85}
  max={100}
  label="Performance"
  size={200}
/>
```

---

## 🎯 Animation Variants

### Available Variants
```typescript
import {
  pageVariants,      // Page transitions
  fadeVariants,      // Fade in/out
  slideVariants,     // Slide from direction
  scaleVariants,     // Scale in/out
  cardVariants,      // Card hover effects
  staggerContainer,  // List container
  staggerItem,       // List items
  buttonVariants,    // Button hover/tap
} from '@/lib/animations';
```

### Usage
```typescript
<motion.div variants={fadeVariants} initial="initial" animate="animate">
  Content
</motion.div>
```

---

## 🛠️ Utility Hooks

### State Management
- `useLocalStorage` - Persist state to localStorage
- `useToggle` - Boolean toggle with helpers
- `usePrevious` - Get previous value

### Performance
- `useDebounce` - Debounce value changes
- `useThrottle` - Throttle value changes
- `useMounted` - Check if component is mounted

### UI Interactions
- `useHover` - Detect hover state
- `useFocus` - Detect focus state
- `useClickOutside` - Detect clicks outside element
- `useLongPress` - Detect long press

### Responsive
- `useMediaQuery` - Match media queries
- `useWindowSize` - Get window dimensions

### Network
- `useOnlineStatus` - Check online status
- `useAsync` - Handle async operations

### Visibility
- `useIntersectionObserver` - Element visibility
- `usePageVisibility` - Page visibility
- `useScrollPosition` - Scroll position

---

## 📖 Full Documentation

For complete documentation, see:
- **Comprehensive Guide:** `ENHANCEMENTS.md`
- **Summary:** `ENHANCEMENT_SUMMARY.md`
- **Live Example:** `client/src/pages/EnhancedDashboardExample.tsx`

---

## 🆘 Need Help?

1. Check the example dashboard: `/enhanced-dashboard-example`
2. Read the full documentation: `ENHANCEMENTS.md`
3. Look at component source code for inline documentation
4. Review the summary: `ENHANCEMENT_SUMMARY.md`

---

## 🎨 Tips

### Performance
- Use `React.memo()` for heavy components
- Lazy load charts: `const Chart = React.lazy(() => import(...))`
- Debounce search inputs: `useDebounce(search, 300)`

### Accessibility
- Always provide ARIA labels
- Use semantic HTML elements
- Support keyboard navigation
- Test with screen readers

### Animations
- Keep animations under 500ms
- Respect `prefers-reduced-motion`
- Use spring for natural feel
- Use tween for controlled timing

---

**Created:** December 2, 2025
**Version:** 2.0
