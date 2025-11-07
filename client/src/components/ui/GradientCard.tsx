/**
 * Gradient Card Component
 *
 * Eye-catching card with gradient backgrounds and glass morphism effects.
 * Perfect for feature highlights, CTAs, and premium content.
 */

import { ReactNode } from "react";

interface GradientCardProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "purple" | "orange";
  glass?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function GradientCard({
  children,
  variant = "primary",
  glass = false,
  className = "",
  onClick,
}: GradientCardProps) {
  const getGradientStyles = () => {
    if (glass) {
      return "glass-card";
    }

    switch (variant) {
      case "primary":
        return "gradient-primary text-white";
      case "secondary":
        return "gradient-secondary text-white";
      case "success":
        return "bg-gradient-to-br from-success-500 to-success-700 text-white";
      case "purple":
        return "bg-gradient-to-br from-purple-500 to-pink-500 text-white";
      case "orange":
        return "bg-gradient-to-br from-orange-500 to-red-500 text-white";
      default:
        return "gradient-primary text-white";
    }
  };

  return (
    <div
      className={`
        card
        hover-lift
        p-6
        ${getGradientStyles()}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface GradientCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function GradientCardHeader({
  title,
  subtitle,
  icon,
}: GradientCardHeaderProps) {
  return (
    <div className="flex items-start gap-4 mb-4">
      {icon && (
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
      </div>
    </div>
  );
}

interface GradientCardContentProps {
  children: ReactNode;
}

export function GradientCardContent({ children }: GradientCardContentProps) {
  return <div className="text-white/90">{children}</div>;
}

interface GradientCardActionsProps {
  children: ReactNode;
}

export function GradientCardActions({ children }: GradientCardActionsProps) {
  return <div className="flex items-center gap-3 mt-6">{children}</div>;
}
