/**
 * Advanced Animated Components
 *
 * A collection of reusable animated components using Framer Motion
 * - NumberCounter: Animated number counting
 * - ProgressRing: Circular progress indicator
 * - AnimatedCard: Enhanced card with hover effects
 * - StaggeredList: Animated list with stagger effect
 * - AnimatedButton: Button with micro-interactions
 * - SlidePanel: Sliding drawer panel
 * - MorphingCard: Card that morphs between states
 * - PulseIndicator: Pulsing status indicator
 */

import * as React from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  cardVariants,
  cardHoverVariants,
  buttonVariants,
  staggerContainer,
  staggerItem,
  pulseVariants,
  transitions,
  progressRingVariants,
  drawerVariants,
  notificationVariants,
} from "@/lib/animations";

// ============================================================================
// NUMBER COUNTER
// ============================================================================

export interface NumberCounterProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  onComplete?: () => void;
}

export function NumberCounter({
  from = 0,
  to,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  onComplete,
}: NumberCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);
  const rounded = useTransform(motionValue, (latest) =>
    latest.toFixed(decimals)
  );
  const isInView = useInView(ref, { once: true });

  React.useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, to, {
        duration,
        ease: "easeOut",
        onComplete,
      });

      return controls.stop;
    }
  }, [isInView, to, duration, motionValue, onComplete]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

// ============================================================================
// PROGRESS RING
// ============================================================================

export interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true,
  color = "hsl(var(--primary))",
  bgColor = "hsl(var(--muted))",
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (showPercentage && (
          <div className="text-center">
            <div className="text-2xl font-bold">
              <NumberCounter to={progress} suffix="%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ANIMATED CARD
// ============================================================================

export interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: boolean;
  hoverShadow?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function AnimatedCard({
  children,
  className,
  hoverScale = true,
  hoverShadow = true,
  onClick,
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={hoverScale ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      exit="exit"
      transition={{ delay }}
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
      style={hoverShadow ? {} : undefined}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// STAGGERED LIST
// ============================================================================

export interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({
  children,
  className,
  staggerDelay = 0.05,
}: StaggeredListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface StaggeredItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggeredItem({ children, className }: StaggeredItemProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// ANIMATED BUTTON
// ============================================================================

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "icon";
  isLoading?: boolean;
  loadingText?: string;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, variant = "default", isLoading, loadingText, className, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        variants={variant === "icon" ? undefined : buttonVariants}
        initial="initial"
        whileHover={!disabled && !isLoading ? "hover" : undefined}
        whileTap={!disabled && !isLoading ? "tap" : undefined}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            />
            {loadingText || "Loading..."}
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

// ============================================================================
// SLIDE PANEL
// ============================================================================

export interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  direction?: "left" | "right" | "top" | "bottom";
  children: React.ReactNode;
  className?: string;
  title?: string;
  size?: "sm" | "md" | "lg" | "full";
}

export function SlidePanel({
  isOpen,
  onClose,
  direction = "right",
  children,
  className,
  title,
  size = "md",
}: SlidePanelProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "max-w-full",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Panel */}
          <motion.div
            custom={direction}
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "fixed bg-background shadow-lg z-50 overflow-auto",
              direction === "right" && "right-0 top-0 bottom-0 w-full",
              direction === "left" && "left-0 top-0 bottom-0 w-full",
              direction === "top" && "top-0 left-0 right-0 h-full",
              direction === "bottom" && "bottom-0 left-0 right-0 h-full",
              (direction === "right" || direction === "left") && sizeClasses[size],
              className
            )}
          >
            <div className="p-6 space-y-4">
              {title && (
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MORPHING CARD
// ============================================================================

export interface MorphingCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  className?: string;
}

export function MorphingCard({
  frontContent,
  backContent,
  className,
}: MorphingCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <div className={cn("perspective-1000", className)}>
      <motion.div
        className="relative w-full h-full cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden rounded-lg border bg-card p-6"
          style={{ backfaceVisibility: "hidden" }}
        >
          {frontContent}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden rounded-lg border bg-card p-6"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {backContent}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// PULSE INDICATOR
// ============================================================================

export interface PulseIndicatorProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
  label?: string;
}

export function PulseIndicator({
  size = "md",
  color = "bg-green-500",
  className,
  label,
}: PulseIndicatorProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <motion.div
          className={cn("rounded-full", color, sizeClasses[size])}
        />
        <motion.div
          className={cn("absolute inset-0 rounded-full", color)}
          animate={{
            scale: [1, 2, 2],
            opacity: [0.7, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      </div>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  return (
    <motion.div
      variants={animation === "pulse" ? pulseVariants : undefined}
      initial={animation !== "none" ? "initial" : undefined}
      animate={animation !== "none" ? "animate" : undefined}
      className={cn(
        "bg-muted",
        variantClasses[variant],
        className
      )}
      style={{
        width,
        height: variant === "text" ? undefined : height,
      }}
    />
  );
}

// ============================================================================
// NOTIFICATION TOAST
// ============================================================================

export interface NotificationToastProps {
  isVisible: boolean;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  onClose: () => void;
}

export function NotificationToast({
  isVisible,
  title,
  description,
  variant = "default",
  onClose,
}: NotificationToastProps) {
  const variantClasses = {
    default: "bg-background border-border",
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  };

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={notificationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg",
            variantClasses[variant]
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold">{title}</h4>
              {description && (
                <p className="text-sm mt-1 opacity-90">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// EXPANDABLE SECTION
// ============================================================================

export interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function ExpandableSection({
  title,
  children,
  defaultExpanded = false,
  className,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <h3 className="font-semibold">{title}</h3>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// FLOATING ACTION BUTTON
// ============================================================================

export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function FloatingActionButton({
  icon,
  label,
  position = "bottom-right",
  className,
  ...props
}: FloatingActionButtonProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "fixed z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg p-4",
        "hover:shadow-xl transition-shadow",
        positionClasses[position],
        className
      )}
      {...props}
    >
      {icon}
      {label && (
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          whileHover={{ width: "auto", opacity: 1 }}
          className="overflow-hidden whitespace-nowrap text-sm font-medium"
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  );
}
