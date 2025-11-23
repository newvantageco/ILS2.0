/**
 * Floating Action Button (FAB) Component
 *
 * A beautiful expandable FAB with smooth animations
 * Perfect for mobile and quick actions across the platform
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Plus,
  X,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FABAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  mainIcon?: LucideIcon;
  mainLabel?: string;
  className?: string;
  showLabels?: boolean;
  expandDirection?: "up" | "left" | "right";
}

const fabVariants = {
  closed: {
    rotate: 0,
    scale: 1,
  },
  open: {
    rotate: 45,
    scale: 1.1,
  },
};

const menuVariants = {
  closed: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
  open: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  closed: {
    opacity: 0,
    y: 20,
    scale: 0.8,
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const backdropVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

export function FloatingActionButton({
  actions,
  position = "bottom-right",
  mainIcon: MainIcon = Plus,
  mainLabel = "Quick Actions",
  className,
  showLabels = true,
  expandDirection = "up",
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  };

  const directionClasses = {
    up: "flex-col-reverse mb-4",
    left: "flex-row-reverse mr-4",
    right: "flex-row ml-4",
  };

  const handleActionClick = (action: FABAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-40 flex items-end",
        positionClasses[position],
        className
      )}
    >
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative z-40 flex flex-col items-center">
        {/* Action Buttons */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className={cn("flex gap-3", directionClasses[expandDirection])}
            >
              {actions.map((action) => (
                <motion.div
                  key={action.id}
                  variants={itemVariants}
                  className="flex items-center gap-3"
                >
                  {showLabels && expandDirection === "up" && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="px-3 py-1.5 rounded-lg bg-card border border-border shadow-lg text-sm font-medium whitespace-nowrap"
                    >
                      {action.label}
                    </motion.span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    className={cn(
                      "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                      action.color || "bg-primary text-primary-foreground hover:bg-primary/90",
                      action.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    style={
                      action.color
                        ? { backgroundColor: action.color, color: "white" }
                        : undefined
                    }
                    aria-label={action.label}
                  >
                    <action.icon className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          variants={fabVariants}
          animate={isOpen ? "open" : "closed"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl flex items-center justify-center",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            isOpen && "bg-red-500 hover:bg-red-600"
          )}
          aria-label={isOpen ? "Close menu" : mainLabel}
          aria-expanded={isOpen}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <MainIcon className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Tooltip for closed state */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-2 -right-2"
          >
            <span className="flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] text-primary-foreground font-bold items-center justify-center">
                {actions.length}
              </span>
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Mini FAB for simpler use cases
export function MiniFAB({
  icon: Icon,
  onClick,
  label,
  className,
  color,
}: {
  icon: LucideIcon;
  onClick: () => void;
  label: string;
  className?: string;
  color?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-full shadow-lg flex items-center justify-center",
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        className
      )}
      style={color ? { backgroundColor: color } : undefined}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
    </motion.button>
  );
}

// Scroll to top FAB
export function ScrollToTopFAB({ threshold = 300 }: { threshold?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-6 right-6 z-40",
            "w-12 h-12 rounded-full shadow-lg flex items-center justify-center",
            "bg-muted text-muted-foreground",
            "hover:bg-muted/90 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          )}
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default FloatingActionButton;
