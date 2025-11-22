/**
 * Modern Stats Card Component
 *
 * Beautiful KPI/metrics card with animations and gradient support.
 * Designed for dashboard and analytics displays.
 */

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  // Alternative trend props for simpler usage
  change?: number;
  changeLabel?: string;
  // Custom icon styling
  iconBgColor?: string;
  iconColor?: string;
  gradient?: boolean;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  className?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  change,
  changeLabel,
  iconBgColor,
  iconColor,
  gradient = false,
  variant = "default",
  className = "",
}: StatsCardProps) {
  // Compute trend from change prop if trend isn't provided
  const computedTrend = trend || (change !== undefined ? {
    value: Math.abs(change),
    isPositive: change >= 0,
    label: changeLabel,
  } : undefined);
  const getVariantStyles = () => {
    if (gradient) {
      return "bg-gradient-to-br from-primary-600 to-secondary-600 text-white border-0";
    }

    switch (variant) {
      case "primary":
        return "bg-primary-50 border-primary-200 text-primary-900";
      case "success":
        return "bg-success-50 border-success-200 text-success-900";
      case "warning":
        return "bg-warning-50 border-warning-200 text-warning-900";
      case "error":
        return "bg-error-50 border-error-200 text-error-900";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getIconBgStyles = () => {
    // Use custom iconBgColor if provided
    if (iconBgColor) return iconBgColor;
    if (gradient) return "bg-white/20";

    switch (variant) {
      case "primary":
        return "bg-primary-100";
      case "success":
        return "bg-success-100";
      case "warning":
        return "bg-warning-100";
      case "error":
        return "bg-error-100";
      default:
        return "bg-gray-100";
    }
  };

  const getIconColorStyles = () => {
    // Use custom iconColor if provided
    if (iconColor) return iconColor;
    if (gradient) return "text-white";

    switch (variant) {
      case "primary":
        return "text-primary-600";
      case "success":
        return "text-success-600";
      case "warning":
        return "text-warning-600";
      case "error":
        return "text-error-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`
        card
        hover-lift
        p-6
        ${getVariantStyles()}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={`
              text-sm font-medium mb-2
              ${gradient ? "text-white/80" : "text-gray-600"}
            `}
          >
            {title}
          </p>

          <h3
            className={`
              text-3xl font-bold tracking-tight mb-1
              ${gradient ? "text-white" : "text-gray-900"}
            `}
          >
            {value}
          </h3>

          {subtitle && (
            <p
              className={`
                text-sm
                ${gradient ? "text-white/70" : "text-gray-500"}
              `}
            >
              {subtitle}
            </p>
          )}

          {computedTrend && (
            <div className="flex items-center gap-2 mt-3">
              <div
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                  ${
                    computedTrend.isPositive
                      ? "bg-success-100 text-success-700"
                      : "bg-error-100 text-error-700"
                  }
                  ${gradient ? "bg-white/20 text-white" : ""}
                `}
              >
                <span>{computedTrend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(computedTrend.value)}%</span>
              </div>
              {computedTrend.label && (
                <span
                  className={`
                    text-xs
                    ${gradient ? "text-white/70" : "text-gray-500"}
                  `}
                >
                  {computedTrend.label}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={`
              flex items-center justify-center
              w-12 h-12 rounded-xl
              ${getIconBgStyles()}
              ${getIconColorStyles()}
              animate-fade-in
            `}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
