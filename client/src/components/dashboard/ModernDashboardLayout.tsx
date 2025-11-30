/**
 * Modern Dashboard Layout - Clean Data Visualization
 *
 * Design Principles:
 * - Information hierarchy - key metrics at the top
 * - Clean, focused visualizations - one story at a time
 * - Micro-interactions for engagement
 * - Real-time data with smooth transitions
 * - AI insights integrated seamlessly
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  trend?: "up" | "down" | "neutral";
  sparklineData?: number[];
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  loading?: boolean;
  className?: string;
}

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

interface AIInsightCardProps {
  title: string;
  description: string;
  confidence: number;
  type: "insight" | "alert" | "prediction" | "recommendation";
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// Metric Card Component
export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend = "neutral",
  sparklineData,
  variant = "default",
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "p-5 rounded-xl border border-card-border bg-card",
          "animate-pulse",
          className
        )}
      >
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group p-5 rounded-xl border bg-card",
        "transition-all duration-200",
        "hover:shadow-md hover:border-border-hover",
        variant === "primary" && "border-primary/20 bg-primary-muted/30",
        variant === "success" && "border-success/20 bg-success-muted/30",
        variant === "warning" && "border-warning/20 bg-warning-muted/30",
        variant === "destructive" && "border-destructive/20 bg-destructive-muted/30",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              variant === "default" && "bg-muted",
              variant === "primary" && "bg-primary/10 text-primary",
              variant === "success" && "bg-success/10 text-success",
              variant === "warning" && "bg-warning/10 text-warning",
              variant === "destructive" && "bg-destructive/10 text-destructive"
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" && (
                <ArrowUpRight className="w-3.5 h-3.5 text-success" />
              )}
              {trend === "down" && (
                <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
              )}
              {trend === "neutral" && (
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  trend === "up" && "text-success",
                  trend === "down" && "text-destructive",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} trend={trend} />
        )}
      </div>
    </div>
  );
}

// Sparkline Component
function Sparkline({
  data,
  trend = "neutral",
}: {
  data: number[];
  trend?: "up" | "down" | "neutral";
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => {
        const height = ((value - min) / range) * 100;
        const isLast = i === data.length - 1;

        return (
          <div
            key={i}
            className={cn(
              "w-1.5 rounded-sm transition-all",
              "group-hover:opacity-80",
              isLast
                ? trend === "up"
                  ? "bg-success"
                  : trend === "down"
                  ? "bg-destructive"
                  : "bg-primary"
                : "bg-muted-foreground/20"
            )}
            style={{ height: `${Math.max(height, 10)}%` }}
          />
        );
      })}
    </div>
  );
}

// Dashboard Section Component
export function DashboardSection({
  title,
  subtitle,
  actions,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// AI Insight Card
export function AIInsightCard({
  title,
  description,
  confidence,
  type,
  action,
  className,
}: AIInsightCardProps) {
  const typeStyles = {
    insight: {
      border: "border-primary/20",
      bg: "bg-primary/5",
      icon: TrendingUp,
      iconColor: "text-primary",
    },
    alert: {
      border: "border-warning/20",
      bg: "bg-warning/5",
      icon: TrendingDown,
      iconColor: "text-warning",
    },
    prediction: {
      border: "border-info/20",
      bg: "bg-info/5",
      icon: Sparkles,
      iconColor: "text-info",
    },
    recommendation: {
      border: "border-success/20",
      bg: "bg-success/5",
      icon: ArrowUpRight,
      iconColor: "text-success",
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        style.border,
        style.bg,
        "transition-all duration-200 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            style.bg,
            style.iconColor
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="outline" className="text-xs h-5">
              <Sparkles className="w-3 h-3 mr-1" />
              {confidence}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {action && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 mt-2 -ml-2 text-xs"
              onClick={action.onClick}
            >
              {action.label}
              <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Dashboard Grid Layout
export function DashboardGrid({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Dashboard Header
export function DashboardHeader({
  title,
  subtitle,
  actions,
  lastUpdated,
  onRefresh,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  lastUpdated?: Date;
  onRefresh?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}

// Progress Ring Component
export function ProgressRing({
  value,
  size = 60,
  strokeWidth = 4,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg
        className="progress-ring"
        width={size}
        height={size}
      >
        <circle
          className="progress-ring-bg"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-fill"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold">{value}%</span>
      </div>
    </div>
  );
}

// Quick Stats Bar
export function QuickStatsBar({
  stats,
  className,
}: {
  stats: { label: string; value: string | number; change?: number }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-6 p-4 rounded-xl bg-muted/50 overflow-x-auto",
        className
      )}
    >
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">{stat.label}:</span>
          <span className="text-sm font-semibold">{stat.value}</span>
          {stat.change !== undefined && (
            <span
              className={cn(
                "text-xs font-medium",
                stat.change > 0 ? "text-success" : stat.change < 0 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {stat.change > 0 ? "+" : ""}
              {stat.change}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default {
  MetricCard,
  DashboardSection,
  AIInsightCard,
  DashboardGrid,
  DashboardHeader,
  ProgressRing,
  QuickStatsBar,
};
