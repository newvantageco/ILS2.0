/**
 * Modern UI Component Library
 *
 * NHS-compliant, beautiful, and accessible UI components
 * built with the ILS 2.0 design system.
 */

// Core UI Components
export { default as StatsCard } from './StatsCard';
export { default as GradientCard, GradientCardHeader, GradientCardContent, GradientCardActions } from './GradientCard';
export { default as ModernBadge, StatusBadge } from './ModernBadge';
export { default as LoadingSkeleton, SkeletonCard, SkeletonTable, SkeletonStats, SkeletonList } from './LoadingSkeleton';

// Animation Components
export { AnimatedCard, StatCard } from './AnimatedCard';
export { PageTransition } from './PageTransition';

// Calendar & Booking Components
export { ModernCalendar, CalendarQuickFilters } from './modern-calendar';
export { EnhancedCalendar } from './EnhancedCalendar';
export { BookingModal } from './BookingModal';
export type { BookingData } from './BookingModal';
export type { CalendarEvent } from './EnhancedCalendar';

// Loading Skeletons
export {
  Skeleton,
  AnimatedSkeleton,
  StatsCardSkeleton,
  StatsGridSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  CalendarSkeleton,
  ChartSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  PatientCardSkeleton,
  AppointmentCardSkeleton,
  NotificationSkeleton,
  ProfileSkeleton,
  OrderTrackingSkeleton,
} from './LoadingSkeletons';

// Theme Toggle
export { ThemeToggle, useTheme } from './ThemeToggle';
