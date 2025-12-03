/**
 * Unified Dashboard Framework - Super Enhanced Edition
 *
 * A comprehensive framework for building consistent, animated, performant dashboards.
 * Includes layout, animations, error boundaries, and performance monitoring.
 *
 * @module DashboardFramework
 * @author Claude Code
 */

import { ReactNode, Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, RefreshCcw, Loader2 } from "lucide-react";
import { pageVariants, staggerContainer } from "@/lib/animations";
import { prefersReducedMotion, advancedTransitions } from "@/lib/animationsAdvanced";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ============================================================================
// TYPES
// ============================================================================

interface DashboardFrameworkProps {
  children: ReactNode;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  className?: string;
  enableAnimations?: boolean;
  performanceMode?: "high" | "balanced" | "low";
}

interface DashboardSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// ERROR FALLBACK
// ============================================================================

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Alert variant="destructive" className="m-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{error.message}</p>
        <Button
          onClick={resetErrorBoundary}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function DashboardLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// DASHBOARD FRAMEWORK
// ============================================================================

export function DashboardFramework({
  children,
  title,
  description,
  headerActions,
  loading = false,
  error = null,
  onRefresh,
  className = "",
  enableAnimations = true,
  performanceMode = "balanced",
}: DashboardFrameworkProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    setMounted(true);

    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 1000) {
        console.warn(`Dashboard render took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, []);

  // Determine if animations should be enabled
  const animationsEnabled = enableAnimations && !shouldReduceMotion && mounted;

  // Get animation variants based on performance mode
  const getVariants = () => {
    if (!animationsEnabled) {
      return { initial: {}, animate: {}, exit: {} };
    }

    switch (performanceMode) {
      case "high":
        return pageVariants;
      case "low":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { duration: 0.2 } },
          exit: { opacity: 0, transition: { duration: 0.1 } },
        };
      default: // balanced
        return pageVariants;
    }
  };

  const variants = getVariants();

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={onRefresh}
    >
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`min-h-screen bg-background ${className}`}
      >
        {/* Header */}
        {(title || description || headerActions) && (
          <div className="border-b bg-card">
            <div className="container mx-auto px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  {title && (
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                  )}
                  {description && (
                    <p className="text-muted-foreground">{description}</p>
                  )}
                </div>
                {headerActions && (
                  <div className="flex items-center gap-2">
                    {headerActions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <DashboardLoading key="loading" />
            ) : error ? (
              <Alert variant="destructive" key="error">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error loading dashboard</AlertTitle>
                <AlertDescription>
                  {error.message}
                  {onRefresh && (
                    <Button
                      onClick={onRefresh}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Suspense fallback={<DashboardLoading />} key="content">
                {children}
              </Suspense>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}

// ============================================================================
// DASHBOARD SECTION
// ============================================================================

export function DashboardSection({
  children,
  title,
  description,
  icon,
  actions,
  loading = false,
  className = "",
  collapsible = false,
  defaultCollapsed = false,
}: DashboardSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={advancedTransitions.physics}
      className={`space-y-4 ${className}`}
    >
      {/* Section Header */}
      {(title || description || actions) && (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {title && (
              <div className="flex items-center gap-2">
                {icon}
                <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
              </div>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? "Expand" : "Collapse"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={advancedTransitions.physics}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              children
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = "neutral",
  loading = false,
  onClick,
  className = "",
}: StatCardProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1, y: onClick ? -2 : 0 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg border bg-card p-6
        ${onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold">{value}</p>
          )}
          {change !== undefined && !loading && (
            <div className="flex items-center gap-1 text-sm">
              <span className={trendColors[trend]}>
                {trendIcons[trend]} {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground opacity-50">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// DASHBOARD GRID
// ============================================================================

export function DashboardGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// DASHBOARD ACTIONS BAR
// ============================================================================

export function DashboardActionsBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-4 bg-card border rounded-lg ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// DASHBOARD CARD
// ============================================================================

export function DashboardCard({
  children,
  title,
  description,
  headerActions,
  className = "",
  loading = false,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  className?: string;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={advancedTransitions.physics}
      className={`rounded-lg border bg-card ${className}`}
    >
      {(title || description || headerActions) && (
        <div className="border-b p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && <h3 className="font-semibold leading-none tracking-tight">{title}</h3>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {headerActions}
          </div>
        </div>
      )}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DashboardFramework,
  DashboardSection,
  DashboardGrid,
  DashboardActionsBar,
  DashboardCard,
  StatCard,
};
