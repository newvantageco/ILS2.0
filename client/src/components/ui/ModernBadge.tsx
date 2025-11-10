/**
 * Modern Badge Component
 *
 * Beautiful status badges with animations and variants.
 * Used for status indicators, labels, and categories.
 */

import { ReactNode } from "react";

interface ModernBadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "purple"
    | "orange";
  size?: "sm" | "md" | "lg";
  pill?: boolean;
  glow?: boolean;
  dot?: boolean;
  className?: string;
}

export default function ModernBadge({
  children,
  variant = "default",
  size = "md",
  pill = false,
  glow = false,
  dot = false,
  className = "",
}: ModernBadgeProps) {
  const getVariantStyles = () => {
    const styles = {
      default: "bg-gray-100 text-gray-700 border-gray-200",
      primary: "bg-primary-100 text-primary-700 border-primary-200",
      secondary: "bg-secondary-100 text-secondary-700 border-secondary-200",
      success: "bg-success-100 text-success-700 border-success-200",
      warning: "bg-warning-100 text-warning-700 border-warning-200",
      error: "bg-error-100 text-error-700 border-error-200",
      info: "bg-blue-100 text-blue-700 border-blue-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      orange: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return styles[variant];
  };

  const getSizeStyles = () => {
    const styles = {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-2.5 py-1",
      lg: "text-base px-3 py-1.5",
    };
    return styles[size];
  };

  const getDotColor = () => {
    const colors = {
      default: "bg-gray-500",
      primary: "bg-primary-500",
      secondary: "bg-secondary-500",
      success: "bg-success-500",
      warning: "bg-warning-500",
      error: "bg-error-500",
      info: "bg-blue-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
    };
    return colors[variant];
  };

  const getGlowStyles = () => {
    if (!glow) return "";

    const glows = {
      default: "shadow-lg shadow-gray-200",
      primary: "shadow-lg shadow-primary-200",
      secondary: "shadow-lg shadow-secondary-200",
      success: "shadow-lg shadow-success-200",
      warning: "shadow-lg shadow-warning-200",
      error: "shadow-lg shadow-error-200",
      info: "shadow-lg shadow-blue-200",
      purple: "shadow-lg shadow-purple-200",
      orange: "shadow-lg shadow-orange-200",
    };
    return glows[variant];
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-semibold
        border
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${pill ? "rounded-full" : "rounded-md"}
        ${glow ? getGlowStyles() : ""}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`
            w-1.5 h-1.5 rounded-full
            ${getDotColor()}
            animate-pulse
          `}
        />
      )}
      {children}
    </span>
  );
}

// Preset badge components for common use cases
export function StatusBadge({
  status,
  ...props
}: { status: string } & Partial<ModernBadgeProps>) {
  const getStatusVariant = (
    status: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "purple"
    | "orange" => {
    const statusLower = status.toLowerCase();

    if (
      statusLower.includes("active") ||
      statusLower.includes("completed") ||
      statusLower.includes("paid") ||
      statusLower.includes("confirmed")
    ) {
      return "success";
    }

    if (
      statusLower.includes("pending") ||
      statusLower.includes("waiting") ||
      statusLower.includes("scheduled")
    ) {
      return "warning";
    }

    if (
      statusLower.includes("cancelled") ||
      statusLower.includes("rejected") ||
      statusLower.includes("failed") ||
      statusLower.includes("expired")
    ) {
      return "error";
    }

    if (
      statusLower.includes("draft") ||
      statusLower.includes("inactive") ||
      statusLower.includes("archived")
    ) {
      return "default";
    }

    if (
      statusLower.includes("submitted") ||
      statusLower.includes("processing")
    ) {
      return "info";
    }

    return "primary";
  };

  return (
    <ModernBadge variant={getStatusVariant(status)} dot pill {...props}>
      {status}
    </ModernBadge>
  );
}
